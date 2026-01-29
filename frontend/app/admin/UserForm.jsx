import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, } from "react-native";
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

  // 🆕 new states for student details
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState([]); // will hold section list from backend

  // modals
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // EDIT STATES
  const [editingUser, setEditingUser] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  // 🆕 LRN (Student only)
  const [lrn, setLrn] = useState("");

  const scheme = useColorScheme();
  const isDark =
    typeof isDarkMode === "boolean" ? isDarkMode : scheme === "dark";

  const textColor = isDark ? "#F7F7F7" : "#000000"; 
  const subTextColor = isDark ? "#d1fae5" : "#000000";
  const inputBg = isDark ? "#0E5149" : "#f9fafb"; 
  const borderColor = isDark ? "#F7F7F7" : "#000000"; 
  const buttonBg = isDark ? "#0E5149" : "#0E5149"; 
  const buttonText = isDark ? "#F7F7F7" : "#F7F7F7"; 
  const headerBorder = isDark ? "#064e3b" : "#000000"; 
  const rowBorder = isDark ? "#065f46" : "#000000"; 
  const cardBg = isDark ? "#808080" : "#ffffff"; 

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

  // 🆕 fetch sections (for student)
  const fetchSections = async () => {
    try {
      const res = await api.get("/sections");
      console.log("✅ Sections fetched:", res.data);
      setSections(res.data);
    } catch (error) {
      console.error("❌ Error fetching sections:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSubjects(); // 🆕 fetch subjects on mount
    fetchSections(); // 🆕 fetch sections for students
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !role) {
      setShowWarning(true);
      return;
    }

    // 🆕 LRN guard (student only)
    if (role === "student" && lrn.length !== 12) {
      setShowWarning(true);
      return;
    }

    try {
      const fullName = middleInitial
        ? `${firstName} ${middleInitial}. ${lastName}`
        : `${firstName} ${lastName}`;

      // 🆕 include department and subject_id if teacher
      // 🆕 include grade_level and section_id if student
      const payload =
        role === "teacher"
          ? {
            name: fullName,
            role,
            email,
            department: department || null,
            subject_id: subjectId || null,
          }
          : role === "student"
            ? {
              name: fullName,
              role,
              email,
              grade_level: gradeLevel || null,
              section_id: section || null,
              lrn: lrn || null,
            }
            : {
              name: fullName,
              role,
              email,
            };

      console.log("📤 Payload:", payload);

      let res;

      // ✅ CREATE vs UPDATE (added logic, no removal)
      if (editingUser) {
        res = await api.put(`/users/${editingUser.id}`, payload);
        console.log("✅ User updated:", res.data);
      } else {
        res = await api.post("/users", payload);
        console.log("✅ User created:", res.data);
      }

      // ✅ reset form (unchanged, reused)
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setRole("");
      setEmail("");
      setDepartment("");
      setSubjectId("");
      setGradeLevel("");
      setSection("");
      setLrn("");

      setEditingUser(null); // 🆕 exit edit mode

      fetchUsers();
      if (editingUser) {
        setShowUpdateSuccess(true);
      } else {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error(
        editingUser
          ? "❌ Error updating user:"
          : "❌ Error creating user:",
        error.response?.data || error.message
      );
    }
  };

  const handleEdit = (user) => {
    const parts = user.name.split(" ");
    setEditingUser(user);
    setFirstName(parts[0] || "");
    setMiddleInitial(parts.length === 3 ? parts[1].replace(".", "") : "");
    setLastName(parts[parts.length - 1] || "");
    setEmail(user.email);
    setRole(user.role);
    setEditingUser(user);
  };

  const handleDeleteConfirm = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("❌ Error deleting user:", error.response?.data || error.message);
    }
  };

  const handleUpdateConfirm = async () => {
    if (!editingUser) return;

    const fullName = middleInitial
      ? `${firstName} ${middleInitial}. ${lastName}`
      : `${firstName} ${lastName}`;

    await api.put(`/users/${editingUser.id}`, {
      name: fullName,
      email,
      role,
    });

    setEditingUser(null);
    setShowUpdateConfirm(false);
    fetchUsers();
  };

  // --- Filtered Users based on search and role filter ---
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole ? u.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  // 🆕 sample grade levels
  const gradeLevels = [
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* CREATE USER CARD */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.title, { color: textColor }]}>Create User</Text>

        {/* new layout: fields on left, role+create on right */}
        <View style={styles.createRow}>
          {/* LEFT: form fields */}
          <View style={styles.createLeft}>
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
          </View>

          {/* RIGHT: role selection + conditional pickers + create button */}
          <View style={styles.createRight}>
            <Text style={[styles.label, { color: textColor }]}>Select Role</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
              <Picker
                selectedValue={role}
                onValueChange={(value) => setRole(value)}
                style={{ color: textColor, backgroundColor: inputBg, fontSize: 15, width: '100%', height: '100%'  }}
                itemStyle={{ fontSize: 18, height: 56 }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Teacher" value="teacher" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Staff" value="staff" />
              </Picker>
            </View>

            {/* conditional fields shown in right column to keep role-related inputs together */}
            {role === "teacher" && (
              <>
                <Text style={[styles.label, { color: textColor }]}>Select Subject</Text>
                <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
                  <Picker
                    selectedValue={subjectId}
                    onValueChange={(value) => setSubjectId(value)}
                    style={{ color: textColor, backgroundColor: inputBg, fontSize: 15, width: '100%', height: '100%' }}
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

            {role === "student" && (
              <>
                <Text style={[styles.label, { color: textColor }]}>Select Grade</Text>
                <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
                  <Picker
                    selectedValue={gradeLevel}
                    onValueChange={(value) => setGradeLevel(value)}
                    style={{ color: textColor, backgroundColor: inputBg, fontSize: 15, width: "100%", height: "100%" }}
                    dropdownIconColor={textColor}
                  >
                    <Picker.Item label="Select Grade" value="" />
                    {gradeLevels.map((grade, index) => (
                      <Picker.Item key={index} label={grade} value={grade} />
                    ))}
                  </Picker>
                </View>

                <Text style={[styles.label, { color: textColor }]}>Select Section</Text>
                <View style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor }]}>
                  <Picker
                    selectedValue={section}
                    onValueChange={(value) => setSection(value)}
                    style={{ color: textColor, backgroundColor: inputBg, fontSize: 15, width: "100%", height: "100%" }}
                    dropdownIconColor={textColor}
                  >
                    <Picker.Item label="Select Section" value="" />
                    {sections.map((sec) => (
                      <Picker.Item key={sec.id} label={sec.name} value={sec.id} />
                    ))}
                  </Picker>
                </View>

                <Text style={[styles.label, { color: textColor }]}>
                  Learner Reference Number (LRN)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
                  placeholder="Enter 12-digit LRN"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                  maxLength={12}
                  value={lrn}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, "");
                    setLrn(numericText);
                  }}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonBg, marginTop: 10 }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, { color: buttonText }]}>
                {editingUser ? "Update User" : "Create User"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- USER LIST --- */}
      <View style={[styles.card, { backgroundColor: cardBg, marginTop: 25 }]}>
        <View style={styles.userListHeader}>
          <Text style={[styles.title, { marginBottom: 15, color: textColor }]}>User List</Text>

          {/* --- Filters on the right --- */}
          <View style={styles.filterRow}>
            <TextInput
              style={[
                styles.smallInput,
                { color: textColor, backgroundColor: inputBg, borderColor },
              ]}
              placeholder="Search user..."
              placeholderTextColor={subTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View
              style={[
                styles.smallPickerWrapper,
                { backgroundColor: inputBg, borderColor },
              ]}
            >
              <Picker
                selectedValue={filterRole}
                onValueChange={(value) => setFilterRole(value)}
                style={{ color: textColor, backgroundColor: inputBg, fontSize: 15, width: '100%', height: '100%'  }}
                itemStyle={{ fontSize: 18, height: 56 }}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="Filter Role" value="" />
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Teacher" value="teacher" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Staff" value="staff" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: headerBorder }]}>
          <Text style={[styles.cell, styles.headerCell, styles.nameCol, { color: textColor }]}>Name</Text>
          <Text style={[styles.cell, styles.headerCell, styles.emailCol, { color: textColor }]}>Email</Text>
          <Text style={[styles.cell, styles.headerCell, styles.roleCol, { color: textColor }]}>Role</Text>
          <Text style={[styles.headerCell, styles.actionCol, { color: textColor }]}>Actions</Text>
        </View>

        {filteredUsers.map((item) => (
          <View key={item.id} style={[styles.tableRow, { borderBottomColor: rowBorder }]}>
            <Text style={[styles.cell, styles.nameCol, { color: textColor }]}>
              {item.name}
            </Text>

            <Text style={[styles.cell, styles.emailCol, { color: textColor }]}>
              {item.email}
            </Text>

            <Text style={[styles.cell, styles.roleCol, { color: textColor }]}>
              {item.role}
            </Text>

            <View style={[styles.actionContainer, styles.actionCol]}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEdit(item)}
              >
                <Text style={{ color: "#F7F7F7", fontWeight: "700" }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteConfirm(item)}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* --- WARNING MODAL --- */}
      <Modal transparent visible={showWarning} animationType="fade" onRequestClose={() => setShowWarning(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#0E5149" : "#ffffff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>Missing Fields</Text>
            <Text style={[styles.modalText, { color: isDark ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
              Please fill in all required fields before creating a user.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#808080" }]}
              onPress={() => setShowWarning(false)}
            >
              <Text style={{ color: "#F7F7F7", fontWeight: "500" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- SUCCESS MODAL --- */}
      <Modal transparent visible={showSuccess} animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#0E5149" : "#ffffff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#F7F7F7" : "#000000" }]}>✅ User Created</Text>
            <Text style={[styles.modalText, { color: isDark ? "#F7F7F7" : "#000000" }]}>
              The new user has been successfully created.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isDark ? "#808080" : "#10b981" }]}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={{ color: "#F7F7F7", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal transparent visible={showUpdateConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#065f46" : "#ffffff" }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Confirm Update
            </Text>

            <Text style={[styles.modalText, { color: subTextColor }]}>
              Are you sure you want to update this user?
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#9ca3af" }]}
                onPress={() => setShowUpdateConfirm(false)}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#10b981" }]}
                onPress={handleUpdateConfirm}
              >
                <Text style={{ color: "#fff" }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Modal
        transparent
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#0E5149" : "#ffffff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
              Confirm Delete
            </Text>

            <Text style={[styles.modalText, { color: isDark ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "600" }}>
                {selectedUser?.name}
              </Text>
              ?
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#9ca3af" }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ef4444" }]}
                onPress={handleDeleteUser}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showUpdateSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? "#0E5149" : "#ffffff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#F7F7F7" : "#000000" }]}>
              User Updated
            </Text>

            <Text style={[styles.modalText, { color: isDark ? "#F7F7F7" : "#000000" }]}>
              The user information has been successfully updated.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#10b981", marginTop: 10 }]}
              onPress={() => setShowUpdateSuccess(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                OK
              </Text>
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
    fontWeight: "500"
  },

  /* create row layout */
  createRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  createLeft: {
    flex: 1,
    minWidth: "60%",
    paddingRight: 10,
  },
  createRight: {
    width: 320,
    minWidth: 260,
    paddingLeft: 10,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 14,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    width: "190%",
    marginRight: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    height: 46,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    height: 56,
    width: "100%",
    fontSize: 18,
    paddingHorizontal: 8,
  },
  smallPickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    width: 160,
    height: 38,
    justifyContent: "center",
    overflow: "hidden",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
    alignSelf: "flex-end",
    width: "30%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontWeight: "500"
  },
  userListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
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
    width: "30%",
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
  actionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: "#0E5149",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  nameCol: {
    flex: 2,
    fontWeight: "500"
  },
  emailCol: {
    flex: 2,
    fontWeight: "500"
  },
  roleCol: {
    flex: 1,
    textTransform: "capitalize",
    fontWeight: "500"
  },
  actionCol: {
    width: 150,
    textAlign: "center",
    alignItems: "flex-end",
    fontWeight: "500"
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    fontWeight: "500"
  },
});