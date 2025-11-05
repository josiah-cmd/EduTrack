import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";

export default function AttendanceForm({ room, isDarkMode }) {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Fetch students in this class/room
  useEffect(() => {
    if (!room) return;
    const fetchStudents = async () => {
      try {
        const res = await api.get(`/rooms/${room.id}/students`);
        const fetchedStudents = res.data || [];

        // ✅ Safely map LRN from nested `student` relation if available
        setStudents(fetchedStudents);
        setRecords(
          fetchedStudents.map((s) => ({
            student_id: s.id,
            name: s.name,
            lrn: s.lrn || s.student?.lrn || "N/A", // ✅ Fix: support nested structure
            status: "present",
            notes: "",
          }))
        );
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [room]);

  const updateStatus = (id, value) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === id ? { ...r, status: value } : r))
    );
  };

  const updateNotes = (id, text) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === id ? { ...r, notes: text } : r))
    );
  };

  const markAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const saveAttendance = async () => {
    try {
      setLoading(true);
      for (const record of records) {
        await api.post("/attendance", {
          student_id: record.student_id,
          subject_id: room.subject_id,
          date: selectedDate,
          status: record.status,
          notes: record.notes,
        });
      }
      setSuccessMsg("✅ Attendance saved successfully!");
      setModalVisible(true);
    } catch (error) {
      console.error("Error saving attendance:", error.response?.data || error);
      setSuccessMsg("❌ Failed to save attendance.");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: "#121212", borderColor: "#333" }]}>
      <Text style={[styles.header, { color: isDarkMode ? "#FFD700" : "#000" }]}>
        Record Attendance
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, justifyContent: "space-between", gap: 10 }}>
        {/* ✅ Wrap DatePicker in a relative div with high zIndex */}
        <div style={{ position: "relative", zIndex: 9999 }}>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="custom-datepicker"
            popperPlacement="bottom-start"
            popperClassName="datepicker-popper-fix"
            portalId="root-portal"
          />
        </div>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="🔍 Search by LRN or Name"
          style={[
            styles.searchInput,
            isDarkMode && { backgroundColor: "#333", color: "#fff" },
          ]}
        />
      </View>

      <ScrollView horizontal style={styles.tableContainer}>
        <View style={{ width: 820 }}>
          <View style={[styles.tableHeader, isDarkMode && { backgroundColor: "#333" }]}>
            <Text style={[styles.th, { flex: 1, color: "#FFD700" }]}>#</Text>
            <Text style={[styles.th, { flex: 1.3, color: "#FFD700" }]}>LRN</Text>
            <Text style={[styles.th, { flex: 2, color: "#FFD700" }]}>Student Name</Text>
            <Text style={[styles.th, { flex: 1, color: "#FFD700" }]}>Status</Text>
            <Text style={[styles.th, { flex: 2, color: "#FFD700" }]}>Notes</Text>
          </View>

          {filteredRecords.map((record, index) => (
            <View
              key={record.student_id}
              style={[styles.row, isDarkMode && { backgroundColor: "#1e1e1e" }]}
            >
              <Text style={[styles.td, { flex: 1, color: isDarkMode ? "#fff" : "#000" }]}>
                {index + 1}
              </Text>

              {/* ✅ Fixed LRN display */}
              <Text style={[styles.td, { flex: 1.3, color: isDarkMode ? "#fff" : "#000" }]}>
                {record.lrn}
              </Text>

              <Text style={[styles.td, { flex: 2, color: isDarkMode ? "#fff" : "#000" }]}>
                {record.name}
              </Text>

              <select
                value={record.status}
                onChange={(e) => updateStatus(record.student_id, e.target.value)}
                style={{
                  flex: 1,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: isDarkMode ? "#333" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                  textAlign: "center",
                }}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>

              <TextInput
                value={record.notes}
                onChangeText={(t) => updateNotes(record.student_id, t)}
                placeholder="Optional notes"
                style={[
                  styles.notesInput,
                  { flex: 2 },
                  isDarkMode && { backgroundColor: "#333", color: "#fff" },
                ]}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 10 }}>
        <TouchableOpacity style={[styles.batchBtn, { backgroundColor: "#32CD32" }]} onPress={() => markAll("present")}>
          <Text style={styles.batchText}>Mark All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.batchBtn, { backgroundColor: "#FF6347" }]} onPress={() => markAll("absent")}>
          <Text style={styles.batchText}>Mark All Absent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.batchBtn, { backgroundColor: "#FFA500" }]} onPress={() => markAll("late")}>
          <Text style={styles.batchText}>Mark All Late</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={saveAttendance}
        disabled={loading}
        style={[
          styles.saveBtn,
          { backgroundColor: loading ? "#999" : "#FFD700" },
        ]}
      >
        <Text style={{ fontWeight: "bold", color: "#000" }}>
          {loading ? "Saving..." : "💾 Save Attendance"}
        </Text>
      </TouchableOpacity>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && { backgroundColor: "#222" }]}>
            <Text
              style={{
                fontSize: 16,
                textAlign: "center",
                color: successMsg.includes("✅") ? "#00FF7F" : "#FF6347",
              }}
            >
              {successMsg}
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#FFD700" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#000", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <style jsx global>{`
        .custom-datepicker {
          width: 200px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #ccc;
          background-color: ${isDarkMode ? "#333" : "#fff"};
          color: ${isDarkMode ? "#fff" : "#000"};
          position: relative;
          z-index: 9999;
        }

        /* ✅ Forces calendar popup above all elements */
        .react-datepicker {
          z-index: 9999 !important;
        }

        .react-datepicker-popper {
          z-index: 9999 !important;
        }

        .datepicker-popper-fix {
          z-index: 9999 !important;
        }
      `}</style>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#555",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#444",
    alignItems: "center",
  },
  th: {
    fontWeight: "700",
    paddingHorizontal: 10,
  },
  td: {
    paddingHorizontal: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 6,
    padding: 6,
  },
  saveBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    padding: 6,
    backgroundColor: "#fff",
    width: 220,
    maxWidth: 250,
    alignSelf: "flex-end",
  },
  batchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  batchText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 280,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "30%",
  },
  modalBtn: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
});