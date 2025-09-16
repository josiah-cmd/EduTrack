import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api, { API_URL } from "../lib/axios";

export default function RoomContent({ room }) {
    const [activeTab, setActiveTab] = useState("modules");
    const [materials, setMaterials] = useState([]);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [deadline, setDeadline] = useState("");
    const [file, setFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // ✅ Fetch materials
    const fetchMaterials = async () => {
        if (!room) return;
        try {
            const typeParam =
                activeTab === "modules"
                    ? "module"
                    : activeTab === "assignments"
                        ? "assignment"
                        : "quiz";

            const res = await api.get("/materials", {
                params: { type: typeParam, room_id: room.id },
            });

            console.log("Fetched materials:", res.data);
            setMaterials(res.data);
        } catch (err) {
            console.error("❌ Error fetching materials:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [activeTab, room]);

    // ✅ Pick file
    const pickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFile(result.assets[0]);
        }
    };

    const removeFile = () => setFile(null);

    // ✅ Helper: convert URI → Blob (for web uploads)
    const uriToBlob = async (uri) => {
        const response = await fetch(uri);
        return await response.blob();
    };

    // ✅ Upload
    const uploadFile = async () => {
        if (!file) return alert("Pick a file first");

        const formData = new FormData();
        formData.append("room_id", room.id);
        formData.append("type", activeTab === "modules" ? "module" : "assignment");
        formData.append("title", title);
        formData.append("description", desc);
        if (activeTab === "assignments") formData.append("deadline", deadline);

        let fileData;
        if (file.uri.startsWith("data:")) {
            fileData = await uriToBlob(file.uri);
        } else {
            fileData = {
                uri: file.uri,
                type: file.mimeType || "application/octet-stream",
                name: file.name || "uploadfile",
            };
        }

        formData.append("file", fileData);

        try {
            await api.post("/materials", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setTitle("");
            setDesc("");
            setDeadline("");
            setFile(null);
            fetchMaterials();
            setModalVisible(true); // ✅ Show modal
        } catch (err) {
            console.error("❌ Upload failed:", err.response?.data || err.message);
            alert("Upload failed");
        }
    };

    // ✅ Preview file (smart)
    const handlePreview = async (id, filename = "file") => {
        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            const url = `${API_URL}/materials/${id}/preview`;

            // Detect extension
            const ext = filename.split(".").pop().toLowerCase();

            if (ext === "pdf") {
                window.open(`${url}?token=${token}`, "_blank");
            } else {
                const gview = `https://docs.google.com/viewer?url=${encodeURIComponent(
                    url + "?token=" + token
                )}&embedded=true`;
                window.open(gview, "_blank");
            }
        } catch (err) {
            console.error("❌ Preview failed:", err.message);
            alert("Preview failed");
        }
    };

    // ✅ Download file
    const handleDownload = async (id, filename = "download") => {
        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            const res = await fetch(`${API_URL}/materials/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to download file");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("❌ Download failed:", err.message);
            alert("Download failed");
        }
    };

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {["modules", "assignments", "quizzes"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Upload form */}
            {activeTab === "assignments" && (
                <View style={styles.formCard}>
                    <Text style={styles.formHeader}>📤 Upload Assignment</Text>
                    <TextInput
                        placeholder="Title"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Description"
                        value={desc}
                        onChangeText={setDesc}
                        style={styles.input}
                    />
                    {activeTab === "assignments" && (
                        <TextInput
                            placeholder="Deadline (YYYY-MM-DD HH:mm:ss)"
                            value={deadline}
                            onChangeText={setDeadline}
                            style={styles.input}
                        />
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
                            <Text style={styles.pickBtnText}>📂 Pick File</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={uploadFile}>
                            <Text style={styles.uploadBtnText}>⬆ Upload</Text>
                        </TouchableOpacity>
                    </View>

                    {file && (
                        <View style={styles.filePreview}>
                            <Text style={styles.filePreviewText}>📄 {file.name}</Text>
                            {file.size && (
                                <Text style={styles.filePreviewSize}>
                                    Size: {Math.round(file.size / 1024)} KB
                                </Text>
                            )}
                            <TouchableOpacity onPress={removeFile} style={styles.removeBtn}>
                                <Text style={styles.removeBtnText}>❌ Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Materials list */}
            <FlatList
                data={materials}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.fileCard}>
                        <Text style={styles.fileTitle}>{item.title}</Text>
                        <Text style={styles.fileDesc}>{item.description}</Text>
                        {item.deadline && (
                            <Text style={styles.deadline}>⏳ Deadline: {item.deadline}</Text>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handlePreview(item.id, item.title)}>
                                <Text style={styles.previewBtn}>👁 Preview</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleDownload(item.id, item.title)}>
                                <Text style={styles.downloadBtn}>⬇ Download</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* ✅ Success Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalText}>✅ File uploaded successfully!</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.modalBtn}
                        >
                            <Text style={styles.modalBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 12 
  },
  
  /* Tabs */
  tabContainer: { 
    flexDirection: "row", 
    marginBottom: 15 
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  activeTab: { 
    backgroundColor: "#007bff" 
  },
  tabText: { 
    textAlign: "center", 
    fontWeight: "600", 
    color: "#333" 
  },
  activeTabText: { 
    color: "#fff" 
  },

  /* Form */
  formCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  formHeader: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  buttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  pickBtn: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "#6c757d",
    paddingVertical: 10,
    borderRadius: 6,
  },
  pickBtnText: { 
    textAlign: "center", 
    color: "#fff", 
    fontWeight: "600" 
  },
  uploadBtn: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 6,
  },
  uploadBtnText: { 
    textAlign: "center", 
    color: "#fff", 
    fontWeight: "600" 
  },

  /* File Preview */
  filePreview: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#eef",
    borderRadius: 6,
  },
  filePreviewText: { 
    fontWeight: "600", 
    color: "#333" 
  },
  filePreviewSize: { 
    fontSize: 12, 
    color: "#666" 
  },
  removeBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#ff4444",
    borderRadius: 6,
  },
  removeBtnText: { 
    color: "#fff", 
    fontWeight: "600" 
  },

  /* Materials list */
  fileCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fileTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 3 
  },
  fileDesc: { 
    color: "#555" 
  },
  deadline: { 
    color: "red", 
    fontWeight: "600", 
    marginTop: 4 
  },
  actions: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 8 
  },
  previewBtn: { 
    color: "#007bff", 
    fontWeight: "bold" 
  },
  downloadBtn: { 
    color: "green", 
    fontWeight: "bold" 
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 15 
  },
  modalBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalBtnText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
});