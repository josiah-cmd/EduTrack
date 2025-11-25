import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios"; // 🟢 Add axios instance

export default function AccountLockUnlock({ isDarkMode, onBack }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 🟢 Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(""); // "lock" or "unlock"

  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  // 🟢 Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/security/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus === "Locked" ? `/security/users/${id}/unlock` : `/security/users/${id}/lock`;
      await api.post(endpoint);
      Alert.alert("Success", `User ${currentStatus === "Locked" ? "unlocked" : "locked"} successfully!`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update account status.");
    }
  };

  // 🟢 Open modal confirmation
  const confirmAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setModalVisible(true);
  };

  // 🟢 Confirm and perform lock/unlock
  const handleConfirm = () => {
    if (selectedUser) {
      toggleStatus(selectedUser.id, selectedUser.is_locked ? "Locked" : "Active");
    }
    setModalVisible(false);
  };

  // 🟢 Filter users
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, textColor]}>Account Lock/Unlock</Text>
      <Text style={[styles.desc, { color: isDarkMode ? "#aaa" : "#555" }]}>
        Manage user access by locking or unlocking accounts manually.
      </Text>

      <TextInput
        placeholder="Search by name, email, or role..."
        placeholderTextColor={isDarkMode ? "#777" : "#aaa"}
        value={search}
        onChangeText={setSearch}
        style={[
          styles.searchInput,
          isDarkMode ? styles.inputDark : styles.inputLight,
        ]}
      />

      {loading ? (
        <Text style={[{ textAlign: "center", marginTop: 20 }, textColor]}>Loading users...</Text>
      ) : filteredUsers.length === 0 ? (
        <Text style={[{ textAlign: "center", marginTop: 20 }, textColor]}>No users found</Text>
      ) : (
        filteredUsers.map((user) => (
          <View
            key={user.id}
            style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          >
            <View>
              <Text style={[styles.cardTitle, textColor]}>{user.name}</Text>
              <Text style={{ color: user.is_locked ? "#f87171" : "#4ade80" }}>
                {user.is_locked ? "Locked" : "Active"}
              </Text>
              <Text style={[{ fontSize: 12, color: "#888" }]}>
                {user.role} • {user.email}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: user.is_locked ? "#22c55e" : "#dc2626" },
              ]}
              onPress={() => confirmAction(user, user.is_locked ? "unlock" : "lock")}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {user.is_locked ? "Unlock" : "Lock"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* 🟢 Confirmation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode ? styles.modalDark : styles.modalLight]}>
            <Text style={[styles.modalTitle, textColor]}>
              {actionType === "lock" ? "Lock Account" : "Unlock Account"}
            </Text>
            <Text style={[styles.modalMessage, { color: isDarkMode ? "#ccc" : "#444" }]}>
              {actionType === "lock"
                ? `Are you sure you want to lock ${selectedUser?.name}'s account? They won't be able to log in until unlocked.`
                : `Are you sure you want to unlock ${selectedUser?.name}'s account? They will regain access to the system.`}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  actionType === "lock" ? styles.lockBtn : styles.unlockBtn,
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>
                  {actionType === "lock" ? "Lock" : "Unlock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  dark: { 
    backgroundColor: "#000" 
  },
  light: { 
    backgroundColor: "#fff" 
  },
  backButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  backText: { 
    fontSize: 16, 
    marginLeft: 6 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 10 
  },
  desc: { 
    fontSize: 14, 
    marginBottom: 20 
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  inputDark: { 
    backgroundColor: "#1a1a1a", 
    borderColor: "#333", 
    color: "#fff" 
  },
  inputLight: { 
    backgroundColor: "#f9f9f9", 
    borderColor: "#ddd", 
    color: "#000" 
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cardDark: { 
    backgroundColor: "#1a1a1a", 
    borderColor: "#333" 
  },
  cardLight: { 
    backgroundColor: "#f9f9f9", 
    borderColor: "#ddd" 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "30%",
    borderRadius: 12,
    padding: 20,
  },
  modalDark: { 
    backgroundColor: "#1a1a1a" 
  },
  modalLight: { 
    backgroundColor: "#fff" 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: "#777",
  },
  lockBtn: {
    backgroundColor: "#dc2626",
  },
  unlockBtn: {
    backgroundColor: "#22c55e",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },
});