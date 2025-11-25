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
  const [day, setDay] = useState([]); 
  const [time, setTime] = useState([]); 
  const [token, setToken] = useState(null);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [editingRoomId, setEditingRoomId] = useState(null);

  const timeSlots = [
    "7:30AM - 7:35AM",
    "7:45AM - 8:00AM",
    "8:00AM - 9:00AM",
    "9:00AM - 10:00AM",
    "10:15AM - 11:15AM",
    "11:15AM - 12:15PM",
    "1:00PM - 2:00PM",
    "2:00PM - 3:00PM",
    "3:00PM - 4:00PM",
    "4:00PM - 5:00PM",
    "5:00PM - 5:15PM",
  ];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
        JSON.stringify(r.day) === JSON.stringify(roomToCheck.day) &&
        JSON.stringify(r.time) === JSON.stringify(roomToCheck.time) &&
        (r.teacher_id === roomToCheck.teacher_id || r.section_id === roomToCheck.section_id)
    );
  };

  const handleToggleDay = (selectedDay) => {
    setDay((prevDays) =>
      prevDays.includes(selectedDay)
        ? prevDays.filter((d) => d !== selectedDay)
        : [...prevDays, selectedDay]
    );
  };

  const handleAddTime = (selectedTime) => {
    setTime((prevTimes) =>
      prevTimes.includes(selectedTime)
        ? prevTimes.filter((t) => t !== selectedTime)
        : [...prevTimes, selectedTime]
    );
  };

  const handleSubmit = async () => {
    if (!subjectId || !teacherId || !sectionId || day.length === 0 || time.length === 0) {
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
      setDay([]);
      setTime([]);
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

    try {
      const parsedDay = typeof room.day === "string" && room.day.startsWith("[") ? JSON.parse(room.day) : [room.day];
      const parsedTime = typeof room.time === "string" && room.time.startsWith("[") ? JSON.parse(room.time) : [room.time];
      setDay(parsedDay);
      setTime(parsedTime);
    } catch {
      setDay([room.day]);
      setTime([room.time]);
    }
  };

  return (
    <View style={[styles.container]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff" }]}>
          <Text style={[styles.title, { color: isDarkMode ? "#ffd700" : "#064e3b" }]}>
            {editingRoomId ? "Edit Room" : "Create Room"}
          </Text>

          {/* SIDE-BY-SIDE FORM SECTIONS */}
          <View style={styles.sideBySideContainer}>
            {/* LEFT SIDE */}
            <View style={styles.leftColumn}>
              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#064e3b" }]}>Subject</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#ffffff", borderColor: isDarkMode ? "#ffd700" : "#10b981" }]}>
                <Picker selectedValue={subjectId} onValueChange={(val) => setSubjectId(val)} dropdownIconColor={isDarkMode ? "#ffd700" : "#064e3b"} style={styles.picker(isDarkMode)}>
                  <Picker.Item label="Select Subject" value="" color={isDarkMode ? "#ffd700" : "#10b981"} />
                  {subjects.map((sub) => (
                    <Picker.Item key={sub.id} label={sub.name} value={sub.id} color={isDarkMode ? "#fff" : "#064e3b"} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#064e3b" }]}>Teacher</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#ffffff", borderColor: isDarkMode ? "#ffd700" : "#10b981" }]}>
                <Picker selectedValue={teacherId} onValueChange={(val) => setTeacherId(val)} dropdownIconColor={isDarkMode ? "#ffd700" : "#064e3b"} style={styles.picker(isDarkMode)}>
                  <Picker.Item label="Select Teacher" value="" color={isDarkMode ? "#ffd700" : "#10b981"} />
                  {teachers.map((t) => (
                    <Picker.Item key={t.id} label={t.user?.name || t.name || "Unnamed"} value={t.id} color={isDarkMode ? "#fff" : "#064e3b"} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#064e3b" }]}>Section</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#ffffff", borderColor: isDarkMode ? "#ffd700" : "#10b981" }]}>
                <Picker selectedValue={sectionId} onValueChange={(val) => setSectionId(val)} dropdownIconColor={isDarkMode ? "#ffd700" : "#064e3b"} style={styles.picker(isDarkMode)}>
                  <Picker.Item label="Select Section" value="" color={isDarkMode ? "#ffd700" : "#10b981"} />
                  {sections.map((sec) => (
                    <Picker.Item key={sec.id} label={sec.name} value={sec.id} color={isDarkMode ? "#fff" : "#064e3b"} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* RIGHT SIDE */}
            <View style={styles.rightColumn}>
              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#064e3b" }]}>Days</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
                {daysOfWeek.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => handleToggleDay(d)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      margin: 4,
                      borderWidth: 1,
                      borderColor: day.includes(d) ? "#10b981" : "#aaa",
                      borderRadius: 8,
                      backgroundColor: day.includes(d) ? (isDarkMode ? "#064e3b" : "#10b981") : "transparent",
                    }}
                  >
                    <Text style={{ color: day.includes(d) ? "#fff" : isDarkMode ? "#ffd700" : "#064e3b" }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#064e3b" }]}>Time Slots</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
                {timeSlots.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => handleAddTime(t)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      margin: 4,
                      borderWidth: 1,
                      borderColor: time.includes(t) ? "#10b981" : "#aaa",
                      borderRadius: 8,
                      backgroundColor: time.includes(t) ? (isDarkMode ? "#064e3b" : "#10b981") : "transparent",
                    }}
                  >
                    <Text style={{ color: time.includes(t) ? "#fff" : isDarkMode ? "#ffd700" : "#064e3b" }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: "#10b981" }]} onPress={handleSubmit}>
            <Text style={styles.btnText}>{editingRoomId ? "Update Room" : "Create Room"}</Text>
          </TouchableOpacity>
        </View>

        {/* ROOMS LIST */}
        <View style={[styles.card, styles.roomsListCard, { backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff" }]}>
          <Text style={[styles.title, { color: isDarkMode ? "#ffd700" : "#064e3b", marginBottom: 15 }]}>Rooms List</Text>
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2} // ✅ show 2 cards per row
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{paddingHorizontal: 8,}}
            renderItem={({ item }) => (
              <View style={[styles.roomCard, { backgroundColor: isDarkMode ? "#065f46" : "#f9f9f9", borderColor: isDarkMode ? "#ffd700" : "#10b981", width: "48%", marginBottom: 15, }]}>
                <Text style={{ color: isDarkMode ? "#ffd700" : "#064e3b", fontWeight: "600", fontSize: 16 }}>
                  {item.subject?.name || "No Subject"}
                </Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#064e3b", marginTop: 3 }}>Teacher: {item.teacher?.user?.name || "No Teacher"}</Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#064e3b", marginTop: 3 }}>Section: {item.section?.name || "No Section"}</Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#064e3b", marginTop: 3 }}>
                  {Array.isArray(item.day) ? item.day.join(", ") : item.day} -{" "}
                  {Array.isArray(item.time) ? item.time.join(", ") : item.time}
                </Text>
                <Text style={{ color: isDarkMode ? "#ffd700" : "#d4af37", fontWeight: "700", marginTop: 5 }}>Code: {item.token || "N/A"}</Text>
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: "#10b981",
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignItems: "center",
                    alignSelf: "flex-end",
                    width: "15%",
                  }}
                  onPress={() => handleEditRoom(item)}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* MODAL */}
        <Modal animationType="fade" transparent={true} visible={popupVisible} onRequestClose={() => setPopupVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: isDarkMode ? "#065f46" : "#ffffff", borderColor: isDarkMode ? "#ffd700" : "#10b981", borderWidth: 1 }]}>
              <Text style={{ color: isDarkMode ? "#ffd700" : "#064e3b", fontSize: 16, marginBottom: 10 }}>{popupMessage}</Text>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#10b981" }]} onPress={() => setPopupVisible(false)}>
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
  container: { 
    flex: 1, 
    minHeight: "100%" 
  },
  card: { 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 20 
  },
  label: { 
    fontSize: 15, 
    marginBottom: 6, 
    fontWeight: "600" 
  },
  input: { 
    borderWidth: 1, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 18, 
    fontSize: 15 
  },
  pickerWrapper: { 
    borderWidth: 1, 
    borderRadius: 10, 
    marginBottom: 18, 
    overflow: "hidden" 
  },
  picker: (isDarkMode) => ({
    color: isDarkMode ? "#ffd700" : "#064e3b",
    backgroundColor: isDarkMode ? "#065f46" : "#ffffff",
    fontSize: 15,
    height: 55,
    paddingHorizontal: 10,
  }),
  btn: {
    marginTop: 10,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "flex-end",
    width: "15%",
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalBox: { 
    padding: 20, 
    borderRadius: 15, 
    width: "30%", 
    alignItems: "center" 
  },
  modalBtn: { 
    backgroundColor: "#10b981", 
    paddingVertical: 10, 
    paddingHorizontal: 25, 
    borderRadius: 10 
  },
  modalBtnText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 15 
  },
  roomCard: { 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1 ,
    width: "50%"
  },
  sideBySideContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    flexWrap: "wrap" 
  },
  leftColumn: { 
    flex: 1, 
    minWidth: "45%", 
    paddingRight: 10 
  },
    rightColumn: {
    flex: 1,
    minWidth: "45%",
    paddingLeft: 10,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "48%",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#10b981",
    marginVertical: 10,
    opacity: 0.3,
  },
});