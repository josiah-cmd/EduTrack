/* eslint-disable */
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../../lib/axios";

export default function GradeForm({ isDarkMode, onBack, room }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = isDarkMode ? styles.dark : styles.light;
  const [grades, setGrades] = useState({});
  const [computedGrades, setComputedGrades] = useState({});
  const [quarter, setQuarter] = useState("1st");

  // 🆕 Track selected student for single save
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // 🆕 Track verified state
  const [verifiedStatus, setVerifiedStatus] = useState({});

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
              grade_id: grade.id, // 🆕 added: store grade ID
              written_work: grade.written_work?.toString() || "0",
              performance_task: grade.performance_task?.toString() || "0",
              quarterly_assessment:
                grade.quarterly_assessment?.toString() || "0",
            },
          }));

          setComputedGrades((prev) => ({
            ...prev,
            [`${student.id}_${quarter}`]: {
              initial_grade: grade.initial_grade,
              final_grade: grade.final_grade,
              remarks: grade.remarks,
            },
          }));

          // 🆕 Store verification status
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
        initial_grade:
          written || performance || quarterly
            ? (
                written * 0.25 +
                performance * 0.5 +
                quarterly * 0.25
              ).toFixed(2)
            : auto.initial_grade,
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
          initial_grade: saved.initial_grade,
          final_grade: saved.final_grade,
          remarks: saved.remarks,
        },
      }));

      setGrades((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          grade_id: saved.id, // 🆕 added: store grade ID after saving
          written_work: saved.written_work?.toString() || "0",
          performance_task: saved.performance_task?.toString() || "0",
          quarterly_assessment: saved.quarterly_assessment?.toString() || "0",
        },
      }));

      // 🆕 Update verification status
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

  // 🆕 Verify grade
  const handleVerify = async (studentId) => {
    const gradeId = grades[studentId]?.grade_id; // 🆕 added
    if (!gradeId) {
      Alert.alert("Error", "No grade found to verify.");
      return;
    }
    try {
      await api.patch(`/grades/${gradeId}/verify`); // 🆕 fixed to use gradeId
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

  // 🆕 Unverify grade
  const handleUnverify = async (studentId) => {
    const gradeId = grades[studentId]?.grade_id; // 🆕 added
    if (!gradeId) {
      Alert.alert("Error", "No grade found to unverify.");
      return;
    }
    try {
      await api.patch(`/grades/${gradeId}/unverify`); // 🆕 fixed to use gradeId
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

  // ✅ Check if all displayed students have verified grades
  const isAllVerified = Object.values(verifiedStatus || {}).every(
    (v) => v === true
  );

  // ✅ Verify all grades
  const handleVerifyAll = async () => {
    try {
      for (const [key] of Object.entries(verifiedStatus || {})) {
        const [studentId] = key.split("_");
        const gradeId = grades[studentId]?.grade_id; // 🆕 added
        if (gradeId) await api.patch(`/grades/${gradeId}/verify`); // 🆕 fixed
      }
      Alert.alert("Success", "All grades verified successfully!");
    } catch (error) {
      console.error("Error verifying all grades:", error);
      Alert.alert("Error", "Failed to verify all grades.");
    }
  };

  // ✅ Unverify all grades
  const handleUnverifyAll = async () => {
    try {
      for (const [key] of Object.entries(verifiedStatus || {})) {
        const [studentId] = key.split("_");
        const gradeId = grades[studentId]?.grade_id; // 🆕 added
        if (gradeId) await api.patch(`/grades/${gradeId}/unverify`); // 🆕 fixed
      }
      Alert.alert("Success", "All grades unverified successfully!");
    } catch (error) {
      console.error("Error unverifying all grades:", error);
      Alert.alert("Error", "Failed to unverify all grades.");
    }
  };

  return (
    <View style={[styles.container, { color: isDarkMode ? "#fff" : "#1a1a1a" }]}>
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

      <View style={styles.quarterContainer}>
        <Text
          style={{
            color: isDarkMode ? "#fff" : "#0b3d2e",
            fontWeight: "bold",
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
              { backgroundColor: quarter === q ? "#178a4c" : "#c9b037" },
            ]}
          >
            <Text style={styles.quarterButtonText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 25, flex: 1 }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#178a4c"
            style={{ marginTop: 20 }}
          />
        ) : students.length === 0 ? (
          <Text style={styles.noStudentsText}>
            No students found in this section.
          </Text>
        ) : (
          <>
            {/* 🆕 Vertical scroll instead of horizontal */}
            <ScrollView style={{ marginTop: 10 }}>
              <View style={{ paddingBottom: 10 }}>
                {/* 🆕 Fixed header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>
                    Student Name
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>
                    Written Work
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1.2 }]}>
                    Performance Task
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1.2 }]}>
                    Quarterly Assessment
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>
                    Initial Grade
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>
                    Final Grade
                  </Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Remarks</Text>
                  
                  {/* 🆕 Added Verify column header */}
                  <Text style={[styles.tableHeader, { flex: 0.8 }]}>Verify</Text>
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
                            borderColor: isDarkMode ? "#c9b037" : "#178a4c",
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
                            borderColor: isDarkMode ? "#c9b037" : "#178a4c",
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
                            borderColor: isDarkMode ? "#c9b037" : "#178a4c",
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
                          {
                            flex: 1,
                            textAlign: "center",
                            color: isDarkMode ? "#f3f4f6" : "#0b3d2e",
                          },
                        ]}
                      >
                        {comp.initial_grade}
                      </Text>

                      <Text
                        style={[
                          styles.tableCell,
                          {
                            flex: 1,
                            textAlign: "center",
                            fontWeight: "600",
                            color: isDarkMode ? "#c9b037" : "#178a4c",
                          },
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
                                ? "#dc2626"
                                : "#c9b037",
                          },
                        ]}
                      >
                        {comp.remarks}
                      </Text>

                      {/* 🆕 Moved Verify Button after Remarks */}
                      <TouchableOpacity
                        onPress={() =>
                          isVerified
                            ? handleUnverify(student.id)
                            : handleVerify(student.id)
                        }
                        style={{
                          flex: 0.8,
                          backgroundColor: isVerified ? "#dc2626" : "#178a4c",
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginHorizontal: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {isVerified ? "Unverify" : "Verify"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* ✅ Save and Verify All Buttons */}
            <View style={styles.saveAllContainer}>
              <View style={styles.saveButtonsWrapper}>
                <TouchableOpacity
                  onPress={() => saveGrade(selectedStudentId)}
                  style={[styles.saveAllButton, { backgroundColor: "#178a4c" }]}
                >
                  <Text style={styles.saveAllText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveAllGrades}
                  style={[styles.saveAllButton, { backgroundColor: "#c9b037" }]}
                >
                  <Text style={styles.saveAllText}>Save All Grades</Text>
                </TouchableOpacity>

                {/* 🆕 Verify All Grades Button */}
                <TouchableOpacity
                  onPress={() =>
                    isAllVerified ? handleUnverifyAll() : handleVerifyAll()
                  }
                  style={[
                    styles.saveAllButton,
                    {
                      backgroundColor: isAllVerified ? "#dc2626" : "#178a4c",
                    },
                  ]}
                >
                  <Text style={styles.saveAllText}>
                    {isAllVerified ? "Unverify All Grades" : "Verify All Grades"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  back: {
    backgroundColor: "#c9b037",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  quarterContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quarterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quarterButtonText: {
    color: "#fff",
  },
  noStudentsText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    color: "#6b7280",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderColor: "#178a4c",
    paddingVertical: 10,
    backgroundColor: "#178a4c",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeader: {
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#178a4c",
  },
  tableCell: {
    fontSize: 14,
    textAlign: "center",
  },
  scoreInput: {
    borderWidth: 1,
    borderRadius: 6,
    textAlign: "center",
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  verifyContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginTop: 20,
    marginRight: 30,
  },
  saveAllContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginTop: 30,
    marginBottom: 50,
    paddingRight: 30,
  },
  saveButtonsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saveAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveAllText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  light: {
    backgroundColor: "#ffffff",
  },
  dark: {
    backgroundColor: "#0b3d2e",
  },
});