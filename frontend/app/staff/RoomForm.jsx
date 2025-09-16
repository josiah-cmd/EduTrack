import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import api from "../lib/axios";

export default function RoomForm({ navigation }) {
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

  // popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      console.log("✅ Rooms fetched:", res.data);
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

        console.log("🔑 RoomForm token:", savedToken);

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

        console.log("✅ Subjects fetched:", subjectsRes.data);
        console.log("✅ Sections fetched:", sectionsRes.data);
        console.log("✅ Teachers fetched:", teachersRes.data);

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

    try {
      await api.post("/rooms", {
        subject_id: Number(subjectId),
        teacher_id: Number(teacherId),
        section_id: Number(sectionId),
        day,
        time,
      });

      setPopupMessage("✅ Room created successfully!");
      setPopupVisible(true);

      setSubjectId("");
      setTeacherId("");
      setSectionId("");
      setDay("");
      setTime("");

      fetchRooms();
    } catch (error) {
      console.error("❌ Room creation error:", error.response?.data || error.message);
      setPopupMessage("❌ Failed to create room.");
      setPopupVisible(true);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        Create Room
      </Text>

      {/* Subject */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Subject
      </Text>
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            borderColor: isDark ? "#fff" : "#000",
          },
        ]}
      >
        <Picker
          selectedValue={subjectId}
          onValueChange={(val) => setSubjectId(val)}
          dropdownIconColor={isDark ? "#fff" : "#000"}
          style={{ color: isDark ? "#fff" : "#000" }}
        >
          <Picker.Item label="Select Subject" value="" />
          {subjects.map((sub) => (
            <Picker.Item key={sub.id} label={sub.name} value={sub.id} />
          ))}
        </Picker>
      </View>

      {/* Teacher */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Teacher
      </Text>
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            borderColor: isDark ? "#fff" : "#000",
          },
        ]}
      >
        <Picker
          selectedValue={teacherId}
          onValueChange={(val) => setTeacherId(val)}
          dropdownIconColor={isDark ? "#fff" : "#000"}
          style={{ color: isDark ? "#fff" : "#000" }}
        >
          <Picker.Item label="Select Teacher" value="" />
          {teachers.map((t) => (
            <Picker.Item key={t.id} label={t.user?.name || "Unnamed"} value={t.id} />
          ))}
        </Picker>
      </View>

      {/* Section */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Section
      </Text>
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            borderColor: isDark ? "#fff" : "#000",
          },
        ]}
      >
        <Picker
          selectedValue={sectionId}
          onValueChange={(val) => setSectionId(val)}
          dropdownIconColor={isDark ? "#fff" : "#000"}
          style={{ color: isDark ? "#fff" : "#000" }}
        >
          <Picker.Item label="Select Section" value="" />
          {sections.map((sec) => (
            <Picker.Item key={sec.id} label={sec.name} value={sec.id} />
          ))}
        </Picker>
      </View>

      {/* Day */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Day
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            color: isDark ? "#fff" : "#000",
            borderColor: isDark ? "#fff" : "#000",
          },
        ]}
        placeholder="e.g. Monday"
        placeholderTextColor={isDark ? "#aaa" : "#555"}
        value={day}
        onChangeText={setDay}
      />

      {/* Time */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Time
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            color: isDark ? "#fff" : "#000",
            borderColor: isDark ? "#fff" : "#000",
          },
        ]}
        placeholder="e.g. 8:00AM - 9:00AM"
        placeholderTextColor={isDark ? "#aaa" : "#555"}
        value={time}
        onChangeText={setTime}
      />

      {/* Submit */}
      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Create Room</Text>
      </TouchableOpacity>

      {/* Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={popupVisible}
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{popupMessage}</Text>
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
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 18,
    overflow: "hidden",
  },
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
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "80%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  modalBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});