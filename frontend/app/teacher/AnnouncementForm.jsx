import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../lib/axios";

export default function AnnouncementForm({ isDarkMode }) {
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadTokenAndData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      if (!savedToken) {
        console.error("❌ No token found");
        return;
      }
      setToken(savedToken);

      const res = await api.get("/users/me");
      setUserId(res.data.id);

      fetchAnnouncements(savedToken);
    } catch (err) {
      console.error("❌ Error loading token:", err.message);
    }
  };

  useEffect(() => {
    loadTokenAndData();
  }, []);

  const fetchAnnouncements = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
    }
  };

  const createAnnouncement = async () => {
    if (!content.trim()) {
      Alert.alert("Validation Error", "Announcement cannot be empty.");
      return;
    }

    try {
      await api.post("/announcements", { content, target_role: "student" });
      setContent("");
      Alert.alert("✅ Success", "Announcement created for students!");
      fetchAnnouncements();
    } catch (err) {
      console.error("❌ Create error:", err.response?.data || err.message);
      Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
    }
  };

  const updateAnnouncement = async () => {
    if (!content.trim()) {
      Alert.alert("Validation Error", "Announcement cannot be empty.");
      return;
    }

    try {
      const ann = announcements.find((a) => a.id === editingId);
      if (!ann || ann.created_by !== userId) {
        Alert.alert("⚠️ Unauthorized", "You can only edit your own announcements.");
        return;
      }

      await api.put(`/announcements/${editingId}`, { content });
      setContent("");
      setEditingId(null);
      Alert.alert("✅ Success", "Announcement updated!");
      fetchAnnouncements();
    } catch (err) {
      console.error("❌ Update error:", err.response?.data || err.message);
      Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
    }
  };

  const confirmDelete = async () => {
    try {
      const ann = announcements.find((a) => a.id === selectedId);
      if (!ann || ann.created_by !== userId) {
        Alert.alert("⚠️ Unauthorized", "You can only delete your own announcements.");
        setShowDeleteModal(false);
        setSelectedId(null);
        return;
      }

      await api.delete(`/announcements/${selectedId}`);
      Alert.alert("✅ Deleted", "Announcement removed.");
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedId));
    } catch (err) {
      console.error("❌ Delete error:", err.response?.data || err.message);
      Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
    } finally {
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  return (
    <View>
      <Text style={[styles.header, { color: isDarkMode ? "#fff" : "#111" }]}>
        📢 Announcements
      </Text>

      {/* Input + Create/Update button */}
      <View style={styles.form}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isDarkMode ? "#1f2937" : "#f9f9f9", color: isDarkMode ? "#fff" : "#111", borderColor: isDarkMode ? "#374151" : "#ccc" },
          ]}
          placeholder="Write an announcement..."
          placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
          value={content}
          onChangeText={setContent}
          multiline
        />

        <TouchableOpacity
          style={styles.button}
          onPress={editingId ? updateAnnouncement : createAnnouncement}
        >
          <Text style={styles.buttonText}>
            {editingId ? "Update" : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: isDarkMode ? "#374151" : "#f9fafb", borderColor: isDarkMode ? "#4b5563" : "#e5e7eb" }]}>
            <Text style={[styles.text, { color: isDarkMode ? "#fff" : "#111" }]}>{item.content}</Text>
            <Text style={[styles.subtext, { color: isDarkMode ? "#ccc" : "#555" }]}>— {item.user?.name}</Text>

            {item.created_by === userId && (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setContent(item.content);
                  }}
                >
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedId(item.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <Text style={[styles.link, { color: "red" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* Delete Modal */}
      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Announcement</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this announcement?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: "#111" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ef4444" }]}
                onPress={confirmDelete}
              >
                <Text style={{ color: "#fff" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  form: {
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 60,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    gap: 12,
  },
  link: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1f2937",
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
});
