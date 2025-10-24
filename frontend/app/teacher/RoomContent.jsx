/* eslint-disable */
import { format } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FlatList, Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // ✅ Added Linking
import api from "../lib/axios";
import AssignmentDetail from "./AssignmentDetail";
import AttendanceForm from "./AttendanceForm";
import QuizCreate from "./quizzes/QuizCreate";
import QuizList from "./quizzes/QuizList";

export default function RoomContent({ room }) {
  const [activeTab, setActiveTab] = useState("modules");
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [people, setPeople] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showQuizCreate, setShowQuizCreate] = useState(false);

  // ✅ FIX ADDED HERE — define updateDeadline
  const updateDeadline = (date) => {
    if (!date) return;
    setDeadline(format(date, "yyyy-MM-dd HH:mm:ss")); // keep it in full format
  };
  // ✅ END FIX

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

  // ✅ Fetch people
  const fetchPeople = async () => {
    if (!room) return;
    try {
      const res = await api.get(`/rooms/${room.id}/people`);
      const { teacher, students } = res.data;
      const sortedStudents = (students || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      const allPeople = teacher ? [teacher, ...sortedStudents] : sortedStudents;
      setPeople(allPeople);
    } catch (err) {
      console.error("❌ Error fetching people:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (activeTab === "people") {
      fetchPeople();
    } else if (
      activeTab !== "quizzes" &&
      activeTab !== "attendance"
    ) {
      fetchMaterials();
    }
  }, [activeTab, room]);

  // ✅ Pick file (ensures correct name/type for Laravel)
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const picked = result.assets[0];
      const nameParts = picked.name ? picked.name.split(".") : [];
      const ext = nameParts.length > 1 ? nameParts.pop() : "bin";

      setFile({
        ...picked,
        name: picked.name || `file_${Date.now()}.${ext}`,
        mimeType: picked.mimeType || `application/${ext}`,
      });
    }
  };

  const removeFile = () => setFile(null);

  // ✅ Convert URI → Blob
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  // ✅ Upload (fixed version)
  const uploadFile = async () => {
    if (!file) return alert("Pick a file first");

    const formData = new FormData();
    formData.append("room_id", room.id);
    formData.append("type", activeTab === "modules" ? "module" : "assignment");
    formData.append("title", title);
    formData.append("description", desc);
    if (activeTab === "assignments") formData.append("deadline", deadline);

    // ✅ Ensure it has name + type before upload
    let fileData;
    try {
      const blob = await uriToBlob(file.uri);
      fileData = new File([blob], file.name, { type: file.mimeType });
    } catch (error) {
      // fallback for mobile (RN File object)
      fileData = {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || "uploadfile.txt",
      };
    }

    formData.append("file", fileData);

    try {
      const res = await api.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Use returned URL with proper filename
      console.log("Uploaded material:", res.data);
      setMaterials((prev) => [res.data.material, ...prev]);

      setTitle("");
      setDesc("");
      setDeadline("");
      setFile(null);
      fetchMaterials();
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Upload failed:", err.response?.data || err.message);
      alert("Upload failed");
    }
  };

  // ✅ Helper: download file
  const downloadFile = async (material) => {
    const url = `${process.env.EXPO_PUBLIC_API_URL || api.defaults.baseURL}/materials/${material.id}/download`;
    console.log("Downloading:", url);
    Linking.openURL(url);
  };

  // ✅ Helper: preview file
  const previewFile = async (material) => {
    const url = `${process.env.EXPO_PUBLIC_API_URL || api.defaults.baseURL}/materials/${material.id}/preview`;
    console.log("Previewing:", url);
    Linking.openURL(url);
  };

  // ✅ Helper: get file type icon or label
  const getFileIcon = (filename = "") => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "📄 PDF";
    if (["doc", "docx"].includes(ext)) return "📝 DOCX";
    if (["ppt", "pptx"].includes(ext)) return "📊 PPT";
    if (["xls", "xlsx"].includes(ext)) return "📈 XLSX";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬 MP4";
    if (["txt"].includes(ext)) return "📘 TXT";
    return "📁 File";
  };

  // ✅ Render detail
  if (selectedMaterial) {
    return (
      <AssignmentDetail
        material={selectedMaterial}
        onBack={() => setSelectedMaterial(null)}
      />
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["modules", "assignments", "quizzes", "people", "attendance"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
              activeTab === tab && { backgroundColor: "#006400" },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
                activeTab === tab && { color: "#FFD700" },
                isDarkMode && { color: "#fff" },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attendance */}
      {activeTab === "attendance" && (
        <AttendanceForm room={room} isDarkMode={isDarkMode} />
      )}

      {/* Quizzes */}
      {activeTab === "quizzes" && room && (
        showQuizCreate ? (
          <QuizCreate
            room={room}
            isDarkMode={isDarkMode}
            onBackToQuizzes={() => setShowQuizCreate(false)}
          />
        ) : (
          <QuizList
            room={room}
            isDarkMode={isDarkMode}
            onCreateQuiz={() => setShowQuizCreate(true)}
          />
        )
      )}

      {/* Upload form */}
      {activeTab !== "quizzes" && activeTab !== "people" && activeTab !== "attendance" &&(
        <View style={[styles.formCard, isDarkMode && { backgroundColor: "#1e1e1e" }]}>
          <Text style={[styles.formTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
            📤 Upload {activeTab.slice(0, -1)}
          </Text>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
            placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
          />
          <TextInput
            placeholder="Description"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              { textAlignVertical: "top", height: 100 },
              isDarkMode && { backgroundColor: "#333", color: "#fff" },
            ]}
            placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
          />

          {activeTab === "assignments" && (
            <div style={{ marginBottom: 12 }}>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  updateDeadline(date);
                }}
                showTimeSelect
                timeFormat="hh:mm aa"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd h:mm aa"
                placeholderText="Pick deadline date & time"
                className="custom-datepicker"
                inline
              />
            </div>
          )}

          <View style={styles.fileRow}>
            <TouchableOpacity style={[styles.pickFileBtn, { backgroundColor: "#006400" }]} onPress={pickFile}>
              <Text style={[styles.pickFileText, { color: "#fff" }]}>📂 Pick File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: "#FFD700" }]} onPress={uploadFile}>
              <Text style={[styles.uploadText, { color: "#000", fontWeight: "bold" }]}>⬆ Upload</Text>
            </TouchableOpacity>
          </View>

          {file && (
            <View style={styles.filePreview}>
              <Text style={[styles.filePreviewText, { color: isDarkMode ? "#fff" : "#333" }]}>
                {getFileIcon(file.name)} {file.name}
              </Text>
              {file.size && (
                <Text style={[styles.filePreviewSize, { color: isDarkMode ? "#bbb" : "#666" }]} >
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

      {/* Uploaded Files */}
      {activeTab !== "people" && activeTab !== "quizzes" && activeTab !== "attendance" &&(
        <View style={styles.uploadedSection}>
          <Text style={[styles.uploadedHeader, { color: isDarkMode ? "#FFD700" : "#222" }]}>
            Uploaded Files
          </Text>

          <FlatList
            data={materials}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              // ✅ MAKE FILE CLICKABLE (ADDED ONLY THIS WRAPPER)
              <TouchableOpacity onPress={() => setSelectedMaterial(item)}>
                <View style={[styles.fileCard, isDarkMode && { backgroundColor: "#222", borderColor: "#444" }]}>
                  <Text style={[styles.fileTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
                    {getFileIcon(item.original_name || item.file_path)} {item.title}
                  </Text>
                  <Text style={[styles.fileDesc, { color: isDarkMode ? "#bbb" : "#555" }]}>
                    {item.description}
                  </Text>

                  {item.deadline && (
                    <Text style={[styles.deadline, { color: "#FF6347" }]}>
                      Deadline: {format(new Date(item.deadline), "yyyy-MM-dd h:mm a")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}

      {/* People */}
      {activeTab === "people" && (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.personCard, isDarkMode && { backgroundColor: "#222", borderColor: "#444" }]}>
              <Text style={[styles.personName, { color: isDarkMode ? "#fff" : "#333" }]}>
                {item.name} {item.role === "teacher" ? "(Instructor)" : ""}
              </Text>
              <Text style={[styles.personEmail, { color: isDarkMode ? "#bbb" : "#555" }]}>{item.email}</Text>
            </View>
          )}
        />
      )}

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? "#FFD700" : "#007bff" }]}>✅ Uploaded</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? "#fff" : "#444" }]}>
            Your {activeTab.slice(0, -1)} has been uploaded successfully!
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: "#006400" }]}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={[styles.modalButtonText, { color: "#FFD700" }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* DatePicker styles */}
      <style jsx global>{`
        .custom-datepicker {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
          font-size: 14px;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .custom-datepicker:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }
        .react-datepicker {
          border-radius: 12px;
          border: 1px solid #ddd;
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: #006400;
          color: #fff;
          border-bottom: none;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header {
          color: #fff;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #FFD700;
          color: #000;
        }
      `}</style>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },

  /* Tabs */
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  activeTab: {
    backgroundColor: "#007bff",
  },
  tabText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
  },

  /* Form */
  formCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  /* File Preview */
  filePreview: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#eef",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filePreviewText: {
    fontWeight: "600",
    color: "#333",
  },
  filePreviewSize: {
    fontSize: 12,
    color: "#666",
  },
  removeBtn: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#ff4444",
    borderRadius: 6,
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* Uploaded Files section */
  uploadedSection: {
    marginTop: 10,
  },
  uploadedHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },

  /* Materials list */
  fileCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fileTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  fileDesc: {
    color: "#555",
  },
  deadline: {
    color: "red",
    fontWeight: "600",
    marginTop: 4,
  },

  /* People list */
  personCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  personName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  personEmail: {
    fontSize: 14,
    color: "#555",
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15,
  },
  modalButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Buttons */
  fileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  pickFileBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginRight: 5,
    alignItems: "center",
  },
  pickFileText: {
    fontWeight: "600",
  },
  uploadBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: "center",
  },
  uploadText: {
    fontWeight: "600",
  },
});