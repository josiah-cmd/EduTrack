/* eslint-disable */
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../../lib/axios";

export default function GradeForm({ isDarkMode, onBack, room }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = isDarkMode ? styles.dark : styles.light;
  const [grades, setGrades] = useState({});
  const [computedGrades, setComputedGrades] = useState({});
  const [quarter, setQuarter] = useState("1st");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [verifiedStatus, setVerifiedStatus] = useState({});

  // 🆕 Modal control states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);

  const openModal = (action, payload = null) => {
    setModalAction(action);
    setModalPayload(payload);
    setModalVisible(true);
  };

  const confirmAction = async () => {
    setModalVisible(false);
    switch (modalAction) {
      case "save":
        await saveGrade(modalPayload);
        break;
      case "saveAll":
        await saveAllGrades();
        break;
      case "verify":
        await handleVerify(modalPayload);
        break;
      case "unverify":
        await handleUnverify(modalPayload);
        break;
      case "verifyAll":
        await handleVerifyAll();
        break;
      case "unverifyAll":
        await handleUnverifyAll();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchExistingGrades = async () => {
      const subjectId =
        room?.subject_id ||
        room?.subject?.id ||
        (room?.subject && room.subject.id) ||
        0;

      if (!subjectId) return;

      for (const student of students) {
        const res = await api.get(
          `/grades/${student.id}/${quarter}?subject_id=${subjectId}`
        );

        const grade = res.data.grade;
        if (grade) {
          setGrades((prev) => ({
            ...prev,
            [student.id]: {
              grade_id: grade.id,
              written_work: grade.written_work?.toString() || "0",
              performance_task: grade.performance_task?.toString() || "0",
              quarterly_assessment:
                grade.quarterly_assessment?.toString() || "0",
            },
          }));

          setComputedGrades((prev) => ({
            ...prev,
            [`${student.id}_${quarter}`]: {
              final_grade: grade.final_grade,
              remarks: grade.remarks,
            },
          }));

          setVerifiedStatus((prev) => ({
            ...prev,
            [`${student.id}_${quarter}`]: grade.is_verified,
          }));
        }
      }
    };
    if (students.length > 0) fetchExistingGrades();
  }, [students, quarter, room]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchStudents = async () => {
      try {
        const response = await Promise.race([
          api.get(`/rooms/${room.id}/people`, { signal: controller.signal }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 7000)
          ),
        ]);
        if (isMounted) {
          const studentList = response.data?.students || [];
          setStudents(studentList);
        }
      } catch (error) {
        if (isMounted) {
          console.error("❌ Error fetching students:", error.message);
          setStudents([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (room?.id) fetchStudents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [room]);

  const handleInputChange = async (studentId, field, value) => {
    const newValue = value.replace(/[^0-9.]/g, "");
    const updated = {
      ...grades,
      [studentId]: {
        ...grades[studentId],
        [field]: newValue,
      },
    };
    setGrades(updated);

    setSelectedStudentId(studentId);

    try {
      const subjectId =
        room?.subject_id ||
        room?.subject?.id ||
        (room?.subject && room.subject.id) ||
        0;
      if (!subjectId) return;

      const written = isNaN(parseFloat(updated[studentId]?.written_work))
        ? 0
        : parseFloat(updated[studentId]?.written_work);
      const performance = isNaN(
        parseFloat(updated[studentId]?.performance_task)
      )
        ? 0
        : parseFloat(updated[studentId]?.performance_task);
      const quarterly = isNaN(
        parseFloat(updated[studentId]?.quarterly_assessment)
      )
        ? 0
        : parseFloat(updated[studentId]?.quarterly_assessment);

      const res = await api.get(
        `/grades/autoCompute/${studentId}/${quarter}?subject_id=${subjectId}`
      );

      const auto = res.data || {};

      const finalComputed = {
        ...auto,
        final_grade:
          written || performance || quarterly
            ? (
                written * 0.25 +
                performance * 0.5 +
                quarterly * 0.25
              ).toFixed(2)
            : auto.final_grade,
        remarks:
          written || performance || quarterly
            ? (
                written * 0.25 +
                performance * 0.5 +
                quarterly * 0.25
              ) >= 75
              ? "Passed"
              : "Failed"
            : auto.remarks,
      };

      setComputedGrades((prev) => ({
        ...prev,
        [`${studentId}_${quarter}`]: finalComputed,
      }));
    } catch (err) {
      console.log("⚠️ Auto compute error:", err.message);
    }
  };

  const saveGrade = async (studentId) => {
    const subjectId =
      room?.subject_id ||
      room?.subject?.id ||
      (room?.subject && room.subject.id) ||
      0;
    const targetId = studentId || selectedStudentId;

    if (!targetId) {
      Alert.alert("Error", "No student selected to save.");
      return;
    }

    const gradeData = grades[targetId] || {};

    if (!subjectId) {
      Alert.alert("Error", "No subject ID found in this room.");
      return;
    }

    try {
      const payload = {
        student_id: targetId,
        subject_id: subjectId,
        quarter: quarter,
        written_work: isNaN(parseFloat(gradeData.written_work))
          ? 0
          : parseFloat(gradeData.written_work),
        performance_task: isNaN(parseFloat(gradeData.performance_task))
          ? 0
          : parseFloat(gradeData.performance_task),
        quarterly_assessment: isNaN(
          parseFloat(gradeData.quarterly_assessment)
        )
          ? 0
          : parseFloat(gradeData.quarterly_assessment),
      };

      const res = await api.post("/grades", payload);

      const saved = res.data.grade;

      setComputedGrades((prev) => ({
        ...prev,
        [`${targetId}_${quarter}`]: {
          final_grade: saved.final_grade,
          remarks: saved.remarks,
        },
      }));

      setGrades((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          grade_id: saved.id,
          written_work: saved.written_work?.toString() || "0",
          performance_task: saved.performance_task?.toString() || "0",
          quarterly_assessment: saved.quarterly_assessment?.toString() || "0",
        },
      }));

      setVerifiedStatus((prev) => ({
        ...prev,
        [`${targetId}_${quarter}`]: saved.is_verified,
      }));

      Alert.alert("✅ Success", "Grade saved successfully!");
    } catch (error) {
      console.error("❌ Error saving grade:", error.message);
      Alert.alert("Error", "Failed to save grade. Please try again.");
    }
  };

  const saveAllGrades = async () => {
    try {
      for (const student of students) {
        await saveGrade(student.id);
      }
      Alert.alert("Success", "All grades have been saved successfully!");
    } catch (error) {
      console.error("Error saving all grades:", error);
      Alert.alert("Error", "Failed to save all grades. Please try again.");
    }
  };

  const handleVerify = async (studentId) => {
    const gradeId = grades[studentId]?.grade_id;
    if (!gradeId) {
      Alert.alert("Error", "No grade found to verify.");
      return;
    }
    try {
      await api.patch(`/grades/${gradeId}/verify`);
      setVerifiedStatus((prev) => ({
        ...prev,
        [`${studentId}_${quarter}`]: true,
      }));
      Alert.alert("✅ Verified", "Grade has been verified.");
    } catch (error) {
      console.error("Verify error:", error);
      Alert.alert("Error", "Failed to verify grade.");
    }
  };

  const handleUnverify = async (studentId) => {
    const gradeId = grades[studentId]?.grade_id;
    if (!gradeId) {
      Alert.alert("Error", "No grade found to unverify.");
      return;
    }
    try {
      await api.patch(`/grades/${gradeId}/unverify`);
      setVerifiedStatus((prev) => ({
        ...prev,
        [`${studentId}_${quarter}`]: false,
      }));
      Alert.alert("❌ Unverified", "Grade has been unverified.");
    } catch (error) {
      console.error("Unverify error:", error);
      Alert.alert("Error", "Failed to unverify grade.");
    }
  };

  useEffect(() => {
    setGrades({});
    setComputedGrades({});
  }, [quarter]);

  const isAllVerified = Object.values(verifiedStatus || {}).every(
    (v) => v === true
  );

  const handleVerifyAll = async () => {
    try {
      for (const [key] of Object.entries(verifiedStatus || {})) {
        const [studentId] = key.split("_");
        const gradeId = grades[studentId]?.grade_id;
        if (gradeId) await api.patch(`/grades/${gradeId}/verify`);
      }
      Alert.alert("Success", "All grades verified successfully!");
    } catch (error) {
      console.error("Error verifying all grades:", error);
      Alert.alert("Error", "Failed to verify all grades.");
    }
  };

  const handleUnverifyAll = async () => {
    try {
      for (const [key] of Object.entries(verifiedStatus || {})) {
        const [studentId] = key.split("_");
        const gradeId = grades[studentId]?.grade_id;
        if (gradeId) await api.patch(`/grades/${gradeId}/unverify`);
      }
      Alert.alert("Success", "All grades unverified successfully!");
    } catch (error) {
      console.error("Error unverifying all grades:", error);
      Alert.alert("Error", "Failed to unverify all grades.");
    }
  };

  return (
    <View style={[styles.container]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      >
      {/* 🆕 Confirmation Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              {`Are you sure you want to ${
                modalAction === "save"
                  ? "Save"
                  : modalAction === "saveAll"
                  ? "Save All Grades"
                  : modalAction === "verify"
                  ? "Verify"
                  : modalAction === "unverify"
                  ? "Unverify"
                  : modalAction === "verifyAll"
                  ? "Verify All Grades"
                  : modalAction === "unverifyAll"
                  ? "Unverify All Grades"
                  : "proceed"
              }?`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#6b7280" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#178a4c" }]}
                onPress={confirmAction}
              >
                <Text style={styles.modalBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerContainer}>
        <Text
          style={[
            styles.header,
            { color: isDarkMode ? "#fff" : "#1a1a1a", fontWeight: "bold" },
          ]}
        >
          Add / Update Grades
        </Text>

        <TouchableOpacity style={[styles.button, styles.back]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* 📝 Reminder Notice */}
      <View>
        <Text style={[styles.reminderText, { color: isDarkMode ? "#F7F7F7" : "#1a1a1a", fontWeight: "500" },]}>
          ⚠️ These grades are{" "}
          <Text style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000", fontWeight: "500" }}>
            not yet official
          </Text>
          . Please verify before final submission.
        </Text>
      </View>
          
      <View style={styles.quarterContainer}>
        <Text
          style={{
            color: isDarkMode ? "#fff" : "#0b3d2e",
            fontWeight: "bold",
            fontWeight: "500",
          }}
        >
          Quarter:
        </Text>

        {["1st", "2nd", "3rd", "4th"].map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => setQuarter(q)}
            style={[
              styles.quarterButton,
              { backgroundColor: quarter === q ? "#178a4c" : "#808080" , fontWeight: "500"},
            ]}
          >
            <Text style={styles.quarterButtonText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 25, flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#178a4c" style={{ marginTop: 20 }} />
        ) : students.length === 0 ? (
          <Text style={styles.noStudentsText}>No students found in this section.</Text>
        ) : (
          <>
            <ScrollView style={{ marginTop: 10 }}>
              <View style={{ paddingBottom: 10 }}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeader, { flex: 1, fontWeight: "600" }]}>Student Name</Text>
                  <Text style={[styles.tableHeader, { flex: 1, fontWeight: "600" }]}>Written Work</Text>
                  <Text style={[styles.tableHeader, { flex: 1.2, fontWeight: "600" }]}>Performance Task</Text>
                  <Text style={[styles.tableHeader, { flex: 1.2, fontWeight: "600" }]}>Quarterly Assessment</Text>
                  <Text style={[styles.tableHeader, { flex: 1, fontWeight: "600" }]}>Final Grade</Text>
                  <Text style={[styles.tableHeader, { flex: 1, fontWeight: "600" }]}>Remarks</Text>
                  <Text style={[styles.tableHeader, { flex: 0.8, fontWeight: "600" }]}>Verify</Text>
                </View>

                {students.map((student, index) => {
                  const comp =
                    computedGrades[`${student.id}_${quarter}`] || {
                      initial_grade: "-",
                      final_grade: "-",
                      remarks: "-",
                    };

                  const isVerified =
                    verifiedStatus[`${student.id}_${quarter}`] || false;

                  return (
                    <View
                      key={student.id}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor:
                            index % 2 === 0
                              ? isDarkMode
                                ? "#1f2937"
                                : "#f9fafb"
                              : isDarkMode
                              ? "#374151"
                              : "#ffffff",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          {
                            flex: 1,
                            color: isDarkMode ? "#f3f4f6" : "#0b3d2e",
                            textAlign: "center",
                            fontWeight: "600"
                          },
                        ]}
                      >
                        {student.name}
                      </Text>

                      <TextInput
                        style={[
                          styles.scoreInput,
                          {
                            flex: 1,
                            backgroundColor: isDarkMode ? "#333" : "#f7f7f7",
                            color: isDarkMode ? "#fff" : "#000",
                            borderColor: isDarkMode ? "#F7F7F7" : "#178a4c",
                            fontWeight: "500",
                          },
                        ]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={grades[student.id]?.written_work || ""}
                        onChangeText={(v) =>
                          handleInputChange(student.id, "written_work", v)
                        }
                      />

                      <TextInput
                        style={[
                          styles.scoreInput,
                          {
                            flex: 1.2,
                            backgroundColor: isDarkMode ? "#333" : "#f7f7f7",
                            color: isDarkMode ? "#fff" : "#000",
                            borderColor: isDarkMode ? "#F7F7F7" : "#178a4c",
                            fontWeight: "500",
                          },
                        ]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={grades[student.id]?.performance_task || ""}
                        onChangeText={(v) =>
                          handleInputChange(student.id, "performance_task", v)
                        }
                      />

                      <TextInput
                        style={[
                          styles.scoreInput,
                          {
                            flex: 1.2,
                            backgroundColor: isDarkMode ? "#333" : "#f7f7f7",
                            color: isDarkMode ? "#fff" : "#000",
                            borderColor: isDarkMode ? "#F7F7F7" : "#178a4c",
                            fontWeight: "500",
                          },
                        ]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={grades[student.id]?.quarterly_assessment || ""}
                        onChangeText={(v) =>
                          handleInputChange(student.id, "quarterly_assessment", v)
                        }
                      />

                      <Text
                        style={[
                          styles.tableCell,
                          { flex: 1, textAlign: "center", color: isDarkMode ? "#fff" : "#000", fontWeight: "500", },
                        ]}
                      >
                        {comp.final_grade}
                      </Text>

                      <Text
                        style={[
                          styles.tableCell,
                          {
                            flex: 1,
                            textAlign: "center",
                            color:
                              comp.remarks === "Passed"
                                ? "#178a4c"
                                : comp.remarks === "Failed"
                                ? "#b91c1c"
                                : isDarkMode
                                ? "#fff"
                                : "#000",
                                fontWeight: "500",
                          },
                        ]}
                      >
                        {comp.remarks}
                      </Text>

                      {/* Verify / Unverify Button */}
                      <TouchableOpacity
                        style={[
                          styles.verifyButton,
                          {
                            backgroundColor: isVerified ? "#808080" : "#808080",
                          },
                        ]}
                        onPress={() =>
                          openModal(isVerified ? "unverify" : "verify", student.id)
                        }
                      >
                        <Text style={styles.verifyButtonText}>
                          {isVerified ? "Unverify" : "Verify"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#808080" }]}
                onPress={() => openModal("save")}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#808080" }]}
                onPress={() => openModal("saveAll")}
              >
                <Text style={styles.actionButtonText}>Save All Grades</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#808080" }]}
                onPress={() => openModal(isAllVerified ? "unverifyAll" : "verifyAll")}
              >
                <Text style={styles.actionButtonText}>
                  {isAllVerified ? "Unverify All Grades" : "Verify All Grades"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

/* ========================== STYLES ========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
  },
  button: {
    backgroundColor: "#178a4c",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  back: {
    backgroundColor: "#6b7280",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontWeight: "500"
  },
  quarterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  quarterButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  quarterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noStudentsText: {
    textAlign: "center",
    color: "#555",
    marginTop: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#808080",
    paddingVertical: 10,
  },
  tableHeader: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  tableCell: {
    fontSize: 14,
    textAlign: "center",
  },
  scoreInput: {
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    paddingVertical: 4,
    width: 30,
  },
  verifyButton: {
    flex: 0.8,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginVertical: 20,
    paddingRight: 20
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontWeight: "500"
  },
  /* ========================== MODAL ========================== */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  /* ========================== THEME ========================== */
  light: {
    backgroundColor: "#E5E9DD",
  },
  dark: {
    backgroundColor: "#1a1a1a",
  },
  /* ========================== REMINDER BOX ========================== */
  reminderBox: {
    backgroundColor: "#fef3c7", // light yellow
    borderLeftWidth: 5,
    borderLeftColor: "#c9b037",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 5,
  },
  reminderText: {
    fontSize: 14,
    textAlign: "center",
  },
});