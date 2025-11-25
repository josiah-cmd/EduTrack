/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns"; // ✅ convert timestamps to local
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api, { API_URL } from "../lib/axios"; // ✅ import api instance

export default function AssignmentDetail({ material, onBack, room }) {
    const [file, setFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [submissions, setSubmissions] = useState([]); // ✅ Student’s uploaded files

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

    // ✅ Helper: convert URI → Blob
    const uriToBlob = async (uri) => {
        const response = await fetch(uri);
        return await response.blob();
    };

    // ✅ Upload submission (web fix: force File object)
    const uploadFile = async () => {
        if (!file) return alert("Pick a file first");

        const formData = new FormData();
        formData.append("material_id", material?.id || ""); // ✅ safe check

        let fileData;
        try {
            // Always convert to a real File for web
            const blob = await uriToBlob(file.uri);
            fileData = new File([blob], file.name || "uploadfile", {
                type: file.mimeType || "application/octet-stream",
            });
        } catch (e) {
            console.error("❌ Blob conversion failed, fallback:", e);
            fileData = {
                uri: file.uri,
                type: file.mimeType || "application/octet-stream",
                name: file.name || "uploadfile",
            };
        }

        formData.append("file", fileData);

        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            // ✅ ensure correct multipart Content-Type
            await api.post("/submissions", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setFile(null);
            setModalVisible(true);
            fetchSubmissions(); // ✅ Refresh after upload
        } catch (err) {
            console.error("❌ Upload failed:", err.response?.data || err.message);
            alert("Upload failed");
        }
    };

    // ✅ Preview file
    const handlePreview = async (id, filename = "file") => {
        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            const url = `${API_URL}/materials/${id}/preview`;
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

    // ✅ Download file (FIXED for DOCX/PDF)
    const handleDownload = async (id, filename = "download") => {
        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            // ✅ Axios with blob response
            const res = await api.get(`/materials/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            // ✅ Get filename from headers
            let downloadName = filename;
            const contentDisposition = res.headers["content-disposition"];
            if (contentDisposition && contentDisposition.includes("filename=")) {
                downloadName = contentDisposition.split("filename=")[1].replace(/"/g, "");
            }

            // ✅ Create object URL and trigger download
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("❌ Download failed:", err.response?.data || err.message);
            alert("Download failed");
        }
    };

    // ✅ Fetch student’s own submissions using Axios
    const fetchSubmissions = async () => {
        try {
            const role = await AsyncStorage.getItem("role");
            const token = await AsyncStorage.getItem(`${role}Token`);

            if (!material?.id) return; // ✅ prevent crash

            const res = await api.get(`/submissions/my/${material.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSubmissions(res.data);
        } catch (err) {
            console.error("❌ Fetch submissions failed:", err.response || err.message);
        }
    };

    useEffect(() => {
        if (material?.id) {
            fetchSubmissions();
        }
    }, [material]);

    // ✅ Guard clause: stop rendering if no material yet
    if (!material) {
        return (
            <View style={styles.wrapper}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>⬅ Back</Text>
                </TouchableOpacity>
                <Text>Loading assignment...</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>⬅ Back</Text>
            </TouchableOpacity>

            <View style={styles.containerBox}>
                <Text style={styles.title}>{material?.title || "No Title"}</Text>
                <Text style={styles.desc}>{material?.description || "No Description"}</Text>
                {material?.deadline && (
                    <Text style={styles.deadline}>
                        ⏳ Deadline: {format(new Date(material.deadline), "MMM dd, yyyy h:mm a")}
                    </Text>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => material && handlePreview(material.id, material?.title || "file")}>
                        <Text style={styles.actionBtn}>👁 Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => material && handleDownload(material.id, material?.title || "download")}>
                        <Text style={styles.actionBtn}>⬇ Download</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Student Submission Upload */}
            {material?.type === "assignment" && (
                <View style={styles.formCard}>
                    <Text style={styles.formHeader}>📤 Submit Your Work</Text>

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

            {/* ✅ List of Student’s Submissions */}
            {submissions.length > 0 && (
                <View style={styles.submissionsCard}>
                    <Text style={styles.subHeader}>📑 Your Submissions</Text>
                    <FlatList
                        data={submissions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.submissionItem}>
                                <Text style={styles.subFile}>📄 {item.filename}</Text>
                                <Text style={styles.subDate}>
                                    🕒 {format(new Date(item.created_at), "MMM dd, yyyy h:mm a")}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            )}

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
    wrapper: {
        flex: 1,
        padding: 20,
    },
    containerBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 20,
    },
    backBtn: {
        marginBottom: 12,
    },
    backText: {
        fontSize: 14,
        color: "#007bff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 6,
    },
    desc: {
        fontSize: 14,
        color: "#555",
        marginBottom: 6,
    },
    deadline: {
        color: "red",
        fontWeight: "600",
        marginBottom: 12,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
    },
    actionBtn: {
        fontSize: 16,
        fontWeight: "600",
        color: "#007bff",
        marginRight: 20,
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
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    pickBtn: {
        flex: 1,
        marginRight: 5,
        backgroundColor: "#006400",
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
        backgroundColor: "#FFD700",
        paddingVertical: 10,
        borderRadius: 6,
    },
    uploadBtnText: {
        textAlign: "center",
        color: "#000",
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

    /* Submissions */
    submissionsCard: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10
    },
    submissionItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    subFile: {
        fontWeight: "600",
        color: "#333"
    },
    subDate: {
        fontSize: 12,
        color: "#666"
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
