import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import api from "../lib/axios";

export default function UserForm({ isDarkMode }) {
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // 🆕 new states for teacher details
  const [department, setDepartment] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState([]); // ✅ all subjects list

  // modals
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const scheme = useColorScheme();
  const isDark =
    typeof isDarkMode === "boolean" ? isDarkMode : scheme === "dark";

  // dynamic colors
  const textColor = isDark ? "#ffffff" : "#333333";
  const subTextColor = isDark ? "#cccccc" : "#555555";
  const inputBg = isDark ? "#1e1e1e" : "#f9f9f9";
  const borderColor = isDark ? "#555555" : "#ccc";
  const buttonBg = isDark ? "#6366f1" : "#4f46e5";
  const buttonText = "#ffffff";
  const headerBorder = isDark ? "#666" : "#ddd";
  const rowBorder = isDark ? "#444" : "#eee";
  const cardBg = isDark ? "#111827" : "#ffffff";

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      console.log("✅ Users fetched:", res.data);
      setUsers(res.data);
    } catch (error) {
      console.error("❌ Error fetching users:", error.response?.data || error.message);
    }
  };

  // 🆕 fetch subjects for dropdown
  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      console.log("✅ Subjects fetched:", res.data);
      setSubjects(res.data);
    } catch (error) {
      console.error("❌ Error fetching subjects:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSubjects(); // 🆕 fetch subjects on mount
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !role) {
      setShowWarning(true);
      return;
    }

    try {
      const fullName = middleInitial
        ? `${firstName} ${middleInitial}. ${lastName}`
        : `${firstName} ${lastName}`;

      // 🆕 include department and subject_id if teacher
      const payload =
        role === "teacher"
          ? {
              name: fullName,
              role,
              email,
              department: department || null,
              subject_id: subjectId || null,
            }
          : {
              name: fullName,
              role,
              email,
            };

      console.log("📤 Payload:", payload);

      const res = await api.post("/users", payload);

      console.log("✅ User created:", res.data);

      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setRole("");
      setEmail("");
      setDepartment(""); // 🆕 reset
      setSubjectId(""); // 🆕 reset

      fetchUsers();
      setShowSuccess(true); // ✅ show confirmation modal
    } catch (error) {
      console.error("❌ Error creating user:", error.response?.data || error.message);
    }
  };

  // --- Filtered Users based on search and role filter ---
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole ? u.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  // 🆕 sample department options (you can add more)
  const departmentOptions = [
    "Mathematics",
    "Science",
    "English",
    "Computer Studies",
    "Social Studies",
    "Filipino",
    "Physical Education",
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.title, { color: textColor }]}>Create User</Text>

        {/* --- FORM --- */}
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
          placeholder="First Name"
          placeholderTextColor={subTextColor}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
          placeholder="Middle Initial (Optional)"
          placeholderTextColor={subTextColor}
          value={middleInitial}
          onChangeText={setMiddleInitial}
        />
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
          placeholder="Last Name"
          placeholderTextColor={subTextColor}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
          placeholder="Email"
          placeholderTextColor={subTextColor}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: textColor }]}>Select Role</Text>
        <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            style={{ color: textColor, backgroundColor: inputBg }}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Select Role" value="" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Teacher" value="teacher" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Staff" value="staff" />
          </Picker>
        </View>

        {/* 🆕 Show only when Teacher is selected */}
        {role === "teacher" && (
          <>
            <Text style={[styles.label, { color: textColor }]}>Select Department</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
              <Picker
                selectedValue={department}
                onValueChange={(value) => setDepartment(value)}
                style={{ color: textColor, backgroundColor: inputBg }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="Select Department" value="" />
                {departmentOptions.map((dept, index) => (
                  <Picker.Item key={index} label={dept} value={dept} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.label, { color: textColor }]}>Select Subject</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
              <Picker
                selectedValue={subjectId}
                onValueChange={(value) => setSubjectId(value)}
                style={{ color: textColor, backgroundColor: inputBg }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((subj) => (
                  <Picker.Item key={subj.id} label={subj.name} value={subj.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: buttonBg }]} onPress={handleSubmit}>
          <Text style={[styles.buttonText, { color: buttonText }]}>Create User</Text>
        </TouchableOpacity>
      </View>

      {/* --- USER LIST --- */}
      <View style={[styles.card, { backgroundColor: cardBg, marginTop: 25 }]}>
        <Text style={[styles.title, { marginBottom: 15, color: textColor }]}>User List</Text>

        {/* --- SEARCH --- */}
        <TextInput
          style={[
            styles.input,
            { color: textColor, backgroundColor: inputBg, borderColor, marginBottom: 10 },
          ]}
          placeholder="Search by name or email"
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* --- FILTER BY ROLE --- */}
        <View
          style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor, marginBottom: 15 }]}
        >
          <Picker
            selectedValue={filterRole}
            onValueChange={(value) => setFilterRole(value)}
            style={{ color: textColor, backgroundColor: inputBg }}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Filter by Role" value="" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Teacher" value="teacher" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Staff" value="staff" />
          </Picker>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: headerBorder }]}>
          <Text style={[styles.cell, styles.headerCell, { color: textColor }]}>Name</Text>
          <Text style={[styles.cell, styles.headerCell, { color: textColor }]}>Email</Text>
          <Text style={[styles.cell, styles.headerCell, { color: textColor }]}>Role</Text>
        </View>

        {filteredUsers.map((item) => (
          <View key={item.id} style={[styles.tableRow, { borderBottomColor: rowBorder }]}>
            <Text style={[styles.cell, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.cell, { color: textColor }]}>{item.email}</Text>
            <Text style={[styles.cell, { color: textColor }]}>{item.role}</Text>
          </View>
        ))}
      </View>

      {/* --- WARNING MODAL --- */}
      <Modal transparent visible={showWarning} animationType="fade" onRequestClose={() => setShowWarning(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#1f2937" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#111" }]}>Missing Fields</Text>
            <Text style={[styles.modalText, { color: isDark ? "#ccc" : "#444" }]}>
              Please fill in all required fields before creating a user.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#6366f1" }]}
              onPress={() => setShowWarning(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- SUCCESS MODAL --- */}
      <Modal transparent visible={showSuccess} animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#1f2937" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#111" }]}>✅ User Created</Text>
            <Text style={[styles.modalText, { color: isDark ? "#ccc" : "#444" }]}>
              The new user has been successfully created.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#10b981" }]}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    paddingVertical: 8,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
});
