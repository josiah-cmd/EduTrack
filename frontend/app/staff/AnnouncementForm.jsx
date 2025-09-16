import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../lib/axios";

export default function AnnouncementForm() {
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadTokenAndData = async () => {
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
        console.error("❌ No token found");
        return;
      }
      setToken(savedToken);
      fetchAnnouncements();
    } catch (err) {
      console.error("❌ Error loading token:", err.message);
    }
  };

  useEffect(() => {
    loadTokenAndData();
  }, []);

  const fetchAnnouncements = async () => {
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
      await api.post("/announcements", { content });

      setContent("");
      Alert.alert("✅ Success", "Announcement created!");
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
    <View style={styles.container}>
      <Text style={styles.header}>📢 Announcements</Text>

      {/* Input + Create/Update button */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Write an announcement..."
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
          <View style={styles.card}>
            <Text style={styles.text}>{item.content}</Text>
            <Text style={styles.subtext}>— {item.user?.name}</Text>

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
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 16 
  },
  header: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 16, 
    color: "#111" 
  },
  form: { 
    marginBottom: 20 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
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
    fontSize: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  text: { 
    fontSize: 16, 
    marginBottom: 4, 
    color: "#111" 
  },
  subtext: { 
    fontSize: 12, 
    color: "#555" 
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