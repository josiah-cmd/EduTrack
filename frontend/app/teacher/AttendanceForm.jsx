import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";

export default function AttendanceForm({ room, isDarkMode }) {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ Fetch students in this class/room
  useEffect(() => {
    if (!room) return;
    const fetchStudents = async () => {
      try {
        const res = await api.get(`/rooms/${room.id}/students`);
        setStudents(res.data || []);
        setRecords(
          res.data.map((s) => ({
            student_id: s.id,
            name: s.name,
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

  // ✅ Handle status change per student
  const updateStatus = (id, value) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === id ? { ...r, status: value } : r))
    );
  };

  // ✅ Handle notes change
  const updateNotes = (id, text) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === id ? { ...r, notes: text } : r))
    );
  };

  // ✅ Save Attendance
    const saveAttendance = async () => {
  try {
    setLoading(true);

    for (const record of records) {
      await api.post("/attendance", {
        student_id: record.student_id,
        subject_id: room.subject_id, // or adjust based on your data
        date: selectedDate,
        status: record.status,
        notes: record.notes,
      });
    }

    setSuccessMsg("✅ Attendance saved successfully!");
  } catch (error) {
    console.error("Error saving attendance:", error.response?.data || error);
    setSuccessMsg("❌ Failed to save attendance.");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: "#121212", borderColor: "#333" }]}>
      <Text style={[styles.header, { color: isDarkMode ? "#FFD700" : "#000" }]}>
        Record Attendance
      </Text>

      <div style={{ marginBottom: 15 }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          className="custom-datepicker"
        />
      </div>

      <ScrollView horizontal style={styles.tableContainer}>
        <View>
          <View style={[styles.tableHeader, isDarkMode && { backgroundColor: "#333" }]}>
            <Text style={[styles.th, { flex: 2, color: "#FFD700" }]}>Student Name</Text>
            <Text style={[styles.th, { flex: 1, color: "#FFD700" }]}>Status</Text>
            <Text style={[styles.th, { flex: 2, color: "#FFD700" }]}>Notes</Text>
          </View>

          {records.map((record) => (
            <View
              key={record.student_id}
              style={[styles.row, isDarkMode && { backgroundColor: "#1e1e1e" }]}
            >
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

      {successMsg !== "" && (
        <Text
          style={{
            textAlign: "center",
            color: successMsg.includes("✅") ? "#00FF7F" : "#FF6347",
            marginTop: 10,
          }}
        >
          {successMsg}
        </Text>
      )}

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

      {/* ✅ Match DatePicker style */}
      <style jsx global>{`
        .custom-datepicker {
          width: 200px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #ccc;
          background-color: ${isDarkMode ? "#333" : "#fff"};
          color: ${isDarkMode ? "#fff" : "#000"};
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
});