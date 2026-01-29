import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

  // ✅ ADD SUBJECT
  const [addSubjectVisible, setAddSubjectVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

    // ✅ ADD SECTION
  const [addSectionVisible, setAddSectionVisible] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newStrand, setNewStrand] = useState("");

  // ✅ DELETE ROOM STATES
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

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

  // ✅ ADDITION: DELETE ROOM HANDLER
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      await api.delete(`/rooms/${roomToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPopupMessage("✅ Room deleted successfully!");
      setPopupVisible(true);
      setDeleteModalVisible(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (error) {
      setPopupMessage("❌ Failed to delete room.");
      setPopupVisible(true);
      setDeleteModalVisible(false);
    }
  };

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

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      setPopupMessage("⚠️ Subject name is required.");
      setPopupVisible(true);
      return;
    }

    try {
      const res = await api.post(
        "/subjects",
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubjects((prev) => [...prev, res.data]);
      setSubjectId(res.data.id);
      setNewSubjectName("");
      setAddSubjectVisible(false);
    } catch (error) {
      setPopupMessage(error.response?.data?.message || "❌ Failed to add subject.");
      setPopupVisible(true);
    }
  };

  const handleAddSection = async () => {
    if (!selectedGrade || !newSectionName.trim()) {
      setPopupMessage("⚠️ Grade and Section Name are required.");
      setPopupVisible(true);
      return;
    }

    let sectionLabel = "";

    // Senior High logic
    if (selectedGrade === "Grade 11" || selectedGrade === "Grade 12") {
      if (!newStrand.trim()) {
        setPopupMessage("⚠️ Strand is required for Senior High.");
        setPopupVisible(true);
        return;
      }
      sectionLabel = `${selectedGrade} - ${newSectionName} (${newStrand})`;
    } else {
      sectionLabel = `${selectedGrade} - ${newSectionName}`;
    }

    try {
      const res = await api.post(
        "/sections",
        { name: sectionLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSections((prev) => [...prev, res.data]);
      setSectionId(res.data.id);

      setAddSectionVisible(false);
      setSelectedGrade("");
      setNewSectionName("");
      setNewStrand("");
    } catch (error) {
      setPopupMessage("❌ Failed to add section.");
      setPopupVisible(true);
    }
  };

  const handleSubmit = async () => {
    if (!subjectId || !teacherId || !sectionId || day.length === 0 || time.length === 0) {
      setPopupMessage("⚠️ All fields are required!");
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
      setEditingRoomId(null);
      fetchRooms();
    } catch (error) {
      setPopupMessage("❌ Failed to create/update room.");
      setPopupVisible(true);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setSubjectId(room.subject_id);
    setTeacherId(room.teacher_id);
    setSectionId(room.section_id);
    setDay(JSON.parse(room.day));
    setTime(JSON.parse(room.time));
  };

  // ✅ CONFIRM DELETE ROOM
  const confirmDeleteRoom = async () => {
    if (!roomToDelete || !token) return;

    try {
      await api.delete(`/rooms/${roomToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeleteModalVisible(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (error) {
      console.error(
        "❌ Failed to delete room:",
        error.response?.data || error.message
      );
      alert("Failed to delete room.");
    }
  };

  return (
    <View style={[styles.container]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: isDarkMode ? "#808080" : "#ffffff" }]}>
          <Text style={[styles.title, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
            {editingRoomId ? "Edit Room" : "Create Room"}
          </Text>

          <View style={styles.sideBySideContainer}>
            <View style={styles.leftColumn}>
              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Subject</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#000000", borderColor: isDarkMode ? "#F7F7F7" : "#000000" }]}>
                <Picker
                  selectedValue={subjectId}
                  onValueChange={(val) => {
                    if (val === "__add_subject__") {
                      setAddSubjectVisible(true);
                      return;
                    }
                    setSubjectId(val);
                  }}
                  dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                  style={styles.picker(isDarkMode)}
                >
                  <Picker.Item label="Select Subject" value="" color={isDarkMode ? "#F7F7F7" : "#000000"} />
                  {subjects.map((sub) => (
                    <Picker.Item key={sub.id} label={sub.name} value={sub.id} color={isDarkMode ? "#fff" : "#000000"} />
                  ))}
                  <Picker.Item label="➕ Add Subject" value="__add_subject__" color={isDarkMode ? "#F7F7F7" : "#000000"} /> {/* ✅ ADDED */}
                </Picker>
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Teacher</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#000000", borderColor: isDarkMode ? "#F7F7F7" : "#000000" }]}>
                <Picker selectedValue={teacherId} onValueChange={(val) => setTeacherId(val)} dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"} style={styles.picker(isDarkMode)}>
                  <Picker.Item label="Select Teacher" value="" color={isDarkMode ? "#F7F7F7" : "#000000"} />
                  {teachers.map((t) => (
                    <Picker.Item key={t.id} label={t.user?.name || t.name || "Unnamed"} value={t.id} color={isDarkMode ? "#fff" : "#000000"} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Section</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? "#065f46" : "#000000", borderColor: isDarkMode ? "#F7F7F7" : "#000000" }]}>
                <Picker
                  selectedValue={sectionId}
                  onValueChange={(val) => {
                    if (val === "__add_section__") {
                      setAddSectionVisible(true);
                      return;
                    }
                    setSectionId(val);
                  }}
                  dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                  style={styles.picker(isDarkMode)}
                >
                  <Picker.Item label="Select Section" value="" color={isDarkMode ? "#F7F7F7" : "#000000"} />

                  {sections.map((sec) => (
                    <Picker.Item
                      key={sec.id}
                      label={sec.name}
                      value={sec.id}
                      color={isDarkMode ? "#fff" : "#000000"}
                    />
                  ))}

                  {/* ✅ NEW */}
                  <Picker.Item
                    label="➕ Add Grade Level & Section"
                    value="__add_section__"
                    color={isDarkMode ? "#F7F7F7" : "#000000"}
                  />
                </Picker>
              </View>
            </View>

            {/* RIGHT SIDE */}
            <View style={styles.rightColumn}>
              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Days</Text>
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
                      borderColor: day.includes(d) ? "#808080" : "#aaa",
                      borderRadius: 8,
                      backgroundColor: day.includes(d) ? (isDarkMode ? "#0E5149" : "#10b981") : "transparent",
                    }}
                  >
                    <Text style={{ color: day.includes(d) ? "#fff" : isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Time Slots</Text>
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
                      backgroundColor: time.includes(t) ? (isDarkMode ? "#0E5149" : "#10b981") : "transparent",
                    }}
                  >
                    <Text style={{ color: time.includes(t) ? "#fff" : isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: "#0E5149" }]} onPress={handleSubmit}>
            <Text style={styles.btnText}>{editingRoomId ? "Update Room" : "Create Room"}</Text>
          </TouchableOpacity>
        </View>

        {/* ROOMS LIST */}
        <View style={[styles.card, styles.roomsListCard, { backgroundColor: isDarkMode ? "#808080" : "#ffffff" }]}>
          <Text style={[styles.title, { color: isDarkMode ? "#F7F7F7" : "#000000", marginBottom: 15, fontWeight: "500" }]}>Rooms List</Text>
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2} // ✅ show 2 cards per row
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{paddingHorizontal: 8,}}
            renderItem={({ item }) => (
              <View style={[styles.roomCard, { backgroundColor: isDarkMode ? "#0E5149" : "#f9f9f9", borderColor: isDarkMode ? "#F7F7F7" : "#000000", width: "48%", marginBottom: 15, }]}>
                <Text style={{ color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500", fontSize: 16 }}>
                  {item.subject?.name || "No Subject"}
                </Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginTop: 3, fontWeight: "500" }}>Teacher: {item.teacher?.user?.name || "No Teacher"}</Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginTop: 3, fontWeight: "500" }}>Section: {item.section?.name || "No Section"}</Text>
                <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginTop: 3, fontWeight: "500" }}>
                  {Array.isArray(item.day) ? item.day.join(", ") : item.day} -{" "}
                  {Array.isArray(item.time) ? item.time.join(", ") : item.time}
                </Text>
                <Text style={{ color: isDarkMode ? "#ffd700" : "#000000", fontWeight: "500", marginTop: 5 }}>Code: {item.token || "N/A"}</Text>
                {/* ✅ BUTTON ROW */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditRoom(item)}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </TouchableOpacity>

                  {/* ✅ DELETE BUTTON */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      setRoomToDelete(item);
                      setDeleteModalVisible(true);
                    }}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        {/* MODAL */}
        <Modal animationType="fade" transparent={true} visible={popupVisible} onRequestClose={() => setPopupVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: isDarkMode ? "#0E5149" : "#ffffff", borderColor: isDarkMode ? "#F7F7F7" : "#10b981", borderWidth: 1 }]}>
              <Text style={{ color: isDarkMode ? "#F7F7F7" : "#064e3b", fontSize: 16, marginBottom: 10 }}>{popupMessage}</Text>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#808080" }]} onPress={() => setPopupVisible(false)}>
                <Text style={styles.modalBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ✅ DELETE CONFIRMATION MODAL (UPDATED UI) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.confirmDeleteBox,
                { backgroundColor: "#0E5149" },
              ]}
            >
              <Text style={styles.confirmTitle}>Confirm Delete</Text>

              <Text style={styles.confirmMessage}>
                Are you sure you want to delete{" "}
                <Text style={{ fontWeight: "700" }}>
                  {roomToDelete?.subject?.name || "this room"}
                </Text>
                ?
              </Text>

              {/* ✅ MODAL ACTION BUTTONS */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDeleteBtn}
                  onPress={confirmDeleteRoom}
                >
                  <Text style={styles.modalBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ✅ ADD SUBJECT MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={addSubjectVisible}
          onRequestClose={() => setAddSubjectVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                { 
                  backgroundColor: isDarkMode ? "#0E5149" : "#ffffff",
                },
              ]}
            >
              <Text
                style={{
                  color: isDarkMode ? "#F7F7F7" : "#000000",
                  fontSize: 16,
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                Add New Subject
              </Text>

              <TextInput
                placeholder="Subject Name"
                placeholderTextColor={isDarkMode ? "#F7F7F7" : "#000000"}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                style={{
                  borderWidth: 1,
                  borderColor: "#000000",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 15,
                  color: isDarkMode ? "#fff" : "#064e3b",
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: "#808080",
                      width: "48%",
                      height: 44,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 8,
                    },
                  ]}
                  onPress={() => setAddSubjectVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: "#10b981",
                      width: "48%",
                      height: 44,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 8,
                    },
                  ]}
                  onPress={handleAddSubject}
                >
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ✅ ADD SECTION MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={addSectionVisible}
          onRequestClose={() => setAddSectionVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: isDarkMode ? "#0E5149" : "#ffffff",
                },
              ]}
            >
              <Text
                style={{
                  color: isDarkMode ? "#F7F7F7" : "#000000",
                  fontSize: 16,
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                Add New Grade Level & Section
              </Text>

              {/* GRADE PICKER */}
              <View style={{ width: "100%", marginBottom: 12 }}>
                <Picker
                  selectedValue={selectedGrade}
                  onValueChange={setSelectedGrade}
                  style={styles.picker(isDarkMode)}
                >
                  <Picker.Item label="Select Grade" value="" />
                  <Picker.Item label="Grade 7" value="Grade 7" />
                  <Picker.Item label="Grade 8" value="Grade 8" />
                  <Picker.Item label="Grade 9" value="Grade 9" />
                  <Picker.Item label="Grade 10" value="Grade 10" />
                  <Picker.Item label="Grade 11" value="Grade 11" />
                  <Picker.Item label="Grade 12" value="Grade 12" />
                </Picker>
              </View>

              {/* STRAND (ONLY SHS) */}
              {(selectedGrade === "Grade 11" || selectedGrade === "Grade 12") && (
                <TextInput
                  placeholder="Strand (e.g. STEM, ABM)"
                  placeholderTextColor={isDarkMode ? "#ccc" : "#000000"}
                  value={newStrand}
                  onChangeText={setNewStrand}
                  style={{
                    borderWidth: 1,
                    borderColor: "#000000",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    color: isDarkMode ? "#fff" : "#064e3b",
                    width: "100%",
                  }}
                />
              )}

              {/* SECTION NAME */}
              <TextInput
                placeholder="Section Name"
                placeholderTextColor={isDarkMode ? "#F7F7F7" : "#000000"}
                value={newSectionName}
                onChangeText={setNewSectionName}
                style={{
                  borderWidth: 1,
                  borderColor: "#000000",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 15,
                  color: isDarkMode ? "#F7F7F7" : "#064e3b",
                  width: "100%",
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#808080",
                      width: "48%",
                      height: 44,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 8, },
                  ]}
                  onPress={() => setAddSectionVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#10b981",
                      width: "48%",
                      height: 44,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 8, },
                  ]}
                  onPress={handleAddSection}
                >
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
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
    color: isDarkMode ? "#F7F7F7" : "#000000",
    backgroundColor: isDarkMode ? "#0E5149" : "#ffffff",
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
    paddingHorizontal: 20, 
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
  confirmDeleteBox: {
    width: "32%",
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 15,
    color: "#f1f5f9",
    textAlign: "center",
    marginBottom: 22,
  },
  confirmBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelBtn: {
    backgroundColor: "#9ca3af",
    paddingVertical: 12,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#6b7280", // cleaner gray
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  btnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  modalActions: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 20,
  gap: 12,
},

cancelBtn: {
  backgroundColor: "#9ca3af",
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: 8,
  minWidth: 120,
  alignItems: "center",
},

confirmDeleteBtn: {
  backgroundColor: "#b91c1c",
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: 8,
  minWidth: 120,
  alignItems: "center",
},

modalBtnText: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "600",
},

});