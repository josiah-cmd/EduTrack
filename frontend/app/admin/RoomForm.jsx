import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";

export default function RoomForm({ isDarkMode }) {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [token, setToken] = useState(null);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [editingRoomId, setEditingRoomId] = useState(null);

  const timeSlots = [
    "8:00AM - 9:00AM",
    "9:00AM - 10:00AM",
    "10:00AM - 11:00AM",
    "1:00PM - 2:00PM",
    "2:00PM - 3:00PM",
    "3:00PM - 4:00PM",
  ];

  const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data ?? []);
    } catch (err) {
      console.error("❌ Fetch rooms error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let savedToken = await AsyncStorage.getItem("token");
        if (!savedToken) {
          savedToken =
            (await AsyncStorage.getItem("adminToken")) ||
            (await AsyncStorage.getItem("staffToken")) ||
            (await AsyncStorage.getItem("teacherToken")) ||
            (await AsyncStorage.getItem("studentToken"));
        }

        if (!savedToken) {
          setPopupMessage("No auth token found. Please log in again.");
          setPopupVisible(true);
          return;
        }

        setToken(savedToken);

        const [subjectsRes, sectionsRes, teachersRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/sections"),
          api.get("/teachers"),
        ]);

        setSubjects(subjectsRes.data ?? []);
        setSections(sectionsRes.data ?? []);
        setTeachers(teachersRes.data ?? []);
        fetchRooms();
      } catch (error) {
        console.error("❌ Fetch error:", error.response?.data || error.message);
        setPopupMessage("Failed to fetch form data. Please check token or API.");
        setPopupVisible(true);
      }
    };

    fetchData();
  }, []);

    const isScheduleConflict = (roomToCheck) => {
    return rooms.some(
      (r) =>
        r.id !== roomToCheck.id &&
        r.day === roomToCheck.day &&
        r.time === roomToCheck.time &&
        (r.teacher_id === roomToCheck.teacher_id || r.section_id === roomToCheck.section_id)
    );
  };

  const handleSubmit = async () => {
  if (!subjectId || !teacherId || !sectionId || !day || !time) {
    setPopupMessage("⚠️ All fields are required!");
    setPopupVisible(true);
    return;
  }

  if (!token) {
    setPopupMessage("No auth token found. Please log in again.");
    setPopupVisible(true);
    return;
  }

  const roomData = {
    subject_id: Number(subjectId),
    teacher_id: Number(teacherId),
    section_id: Number(sectionId),
    day,
    time,
  };

  if (isScheduleConflict({ ...roomData, id: editingRoomId })) {
    setPopupMessage("⚠️ Schedule conflict detected for this room!");
    setPopupVisible(true);
    return;
  }

  try {
    if (editingRoomId) {
      // 🔥 don't include "id" in body, it's already in URL
      await api.put(`/rooms/${editingRoomId}`, roomData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPopupMessage("✅ Room updated successfully!");
    } else {
      await api.post("/rooms", roomData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPopupMessage("✅ Room created successfully!");
    }

    setPopupVisible(true);

    setSubjectId("");
    setTeacherId("");
    setSectionId("");
    setDay("");
    setTime("");
    setEditingRoomId(null);
    fetchRooms();
  } catch (error) {
    console.error("❌ Room creation/edit error:", error.response?.data || error.message);
    setPopupMessage("❌ Failed to create/update room.");
    setPopupVisible(true);
  }
};

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setSubjectId(room.subject_id);
    setTeacherId(room.teacher_id);
    setSectionId(room.section_id);
    setDay(room.day);
    setTime(room.time);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000" : "#f2f2f2" },
      ]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Room Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? "#0f172a" : "#fff" },
          ]}
        >
          <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
            {editingRoomId ? "Edit Room" : "Create Room"}
          </Text>

          {/* Subject */}
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
            Subject
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDarkMode ? "#111" : "#fff",
                borderColor: isDarkMode ? "#444" : "#ccc",
              },
            ]}
          >
            <Picker
              selectedValue={subjectId}
              onValueChange={(val) => setSubjectId(val)}
              dropdownIconColor={isDarkMode ? "#fff" : "#000"}
              style={styles.picker(isDarkMode)}
            >
              <Picker.Item label="Select Subject" value="" color={isDarkMode ? "#aaa" : "#555"} />
              {subjects.map((sub) => (
                <Picker.Item key={sub.id} label={sub.name} value={sub.id} color={isDarkMode ? "#fff" : "#000"} />
              ))}
            </Picker>
          </View>

          {/* Teacher */}
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
            Teacher
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDarkMode ? "#111" : "#fff",
                borderColor: isDarkMode ? "#444" : "#ccc",
              },
            ]}
          >
            <Picker
              selectedValue={teacherId}
              onValueChange={(val) => setTeacherId(val)}
              dropdownIconColor={isDarkMode ? "#fff" : "#000"}
              style={styles.picker(isDarkMode)}
            >
              <Picker.Item label="Select Teacher" value="" color={isDarkMode ? "#aaa" : "#555"} />
              {teachers.map((t) => (
                <Picker.Item
                  key={t.id}
                  label={t.user?.name || t.name || "Unnamed"}
                  value={t.id}
                  color={isDarkMode ? "#fff" : "#000"}
                />
              ))}
            </Picker>
          </View>

          {/* Section */}
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
            Section
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDarkMode ? "#111" : "#fff",
                borderColor: isDarkMode ? "#444" : "#ccc",
              },
            ]}
          >
            <Picker
              selectedValue={sectionId}
              onValueChange={(val) => setSectionId(val)}
              dropdownIconColor={isDarkMode ? "#fff" : "#000"}
              style={styles.picker(isDarkMode)}
            >
              <Picker.Item label="Select Section" value="" color={isDarkMode ? "#aaa" : "#555"} />
              {sections.map((sec) => (
                <Picker.Item key={sec.id} label={sec.name} value={sec.id} color={isDarkMode ? "#fff" : "#000"} />
              ))}
            </Picker>
          </View>

          {/* Day */}
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
            Day
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDarkMode ? "#111" : "#fff",
                borderColor: isDarkMode ? "#444" : "#ccc",
                marginBottom: 18,
              },
            ]}
          >
            <Picker
              selectedValue={day}
              onValueChange={(val) => setDay(val)}
              dropdownIconColor={isDarkMode ? "#fff" : "#000"}
              style={styles.picker(isDarkMode)}
            >
              <Picker.Item label="Select Day" value="" color={isDarkMode ? "#aaa" : "#555"} />
              {daysOfWeek.map((d, i) => (
                <Picker.Item key={i} label={d} value={d} color={isDarkMode ? "#fff" : "#000"} />
              ))}
            </Picker>
          </View>

          {/* Time */}
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
            Time
          </Text>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDarkMode ? "#111" : "#fff",
                borderColor: isDarkMode ? "#444" : "#ccc",
              },
            ]}
          >
            <Picker
              selectedValue={time}
              onValueChange={(val) => setTime(val)}
              dropdownIconColor={isDarkMode ? "#fff" : "#000"}
              style={styles.picker(isDarkMode)}
            >
              <Picker.Item label="Select Time" value="" color={isDarkMode ? "#aaa" : "#555"} />
              {timeSlots.map((t, i) => (
                <Picker.Item key={i} label={t} value={t} color={isDarkMode ? "#fff" : "#000"} />
              ))}
            </Picker>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
            <Text style={styles.btnText}>{editingRoomId ? "Update Room" : "Create Room"}</Text>
          </TouchableOpacity>
        </View>

        {/* Rooms List Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? "#0f172a" : "#fff" },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? "#fff" : "#000", marginBottom: 15 },
            ]}
          >
            Rooms List
          </Text>
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.roomCard,
                  { backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9" },
                ]}
              >
                <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: "600", fontSize: 16 }}>
                  {item.subject?.name || "No Subject"}
                </Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#333", marginTop: 3 }}>
                  Teacher: {item.teacher?.user?.name || "No Teacher"}
                </Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#333", marginTop: 3 }}>
                  Section: {item.section?.name || "No Section"}
                </Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#333", marginTop: 3 }}>
                  {item.day} - {item.time}
                </Text>
                <Text
                  style={{
                    color: isDarkMode ? "#ffcc00" : "#007bff",
                    fontWeight: "700",
                    marginTop: 5,
                  }}
                >
                  Code: {item.token || "N/A"}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: "#10b981",
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                  onPress={() => handleEditRoom(item)}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Popup Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={popupVisible}
          onRequestClose={() => setPopupVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalBox, { backgroundColor: isDarkMode ? "#222" : "#fff" }]}
            >
              <Text style={{ color: isDarkMode ? "#fff" : "#000", fontSize: 16, marginBottom: 10 }}>
                {popupMessage}
              </Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setPopupVisible(false)}
              >
                <Text style={styles.modalBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: "100%" },
  card: { borderRadius: 12, padding: 20, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 15, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 18, fontSize: 15 },
  pickerWrapper: { borderWidth: 1, borderRadius: 10, marginBottom: 18, overflow: "hidden" },
  picker: (isDarkMode) => ({
    color: isDarkMode ? "#fff" : "#000",
    backgroundColor: isDarkMode ? "#111" : "#fff",
    fontSize: 15,
    height: 55,
    paddingHorizontal: 10,
  }),
  btn: {
    marginTop: 10,
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { padding: 20, borderRadius: 15, width: "80%", alignItems: "center" },
  modalBtn: { backgroundColor: "#007bff", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  roomCard: { padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#1e293b" },
});
