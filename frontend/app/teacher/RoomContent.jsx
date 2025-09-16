import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";

// ✅ Import React DatePicker
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ✅ Import new detail component
import AssignmentDetail from "./AssignmentDetail";

export default function RoomContent({ room }) {
  const [activeTab, setActiveTab] = useState("modules");
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ✅ New states for picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ✅ New state for people tab
  const [people, setPeople] = useState([]);

  // ✅ NEW: track selected material
  const [selectedMaterial, setSelectedMaterial] = useState(null);

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

  // ✅ Fetch people (from API)
  const fetchPeople = async () => {
    if (!room) return;
    try {
      const res = await api.get(`/rooms/${room.id}/people`);
      const { teacher, students } = res.data;

      // sort students alphabetically
      const sortedStudents = (students || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // teacher first
      const allPeople = teacher ? [teacher, ...sortedStudents] : sortedStudents;

      setPeople(allPeople);
    } catch (err) {
      console.error(
        "❌ Error fetching people:",
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    if (activeTab === "people") {
      fetchPeople();
    } else {
      fetchMaterials();
    }
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

      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Upload failed:", err.response?.data || err.message);
      alert("Upload failed");
    }
  };

  // ✅ Date handler
  const onChangeDate = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setSelectedDate(newDate);
      updateDeadline(newDate);
    }
  };

  // ✅ Time handler
  const onChangeTime = (event, selected) => {
    setShowTimePicker(false);
    if (selected) {
      const newDate = new Date(selectedDate);
      newDate.setHours(selected.getHours(), selected.getMinutes(), 0);
      setSelectedDate(newDate);
      updateDeadline(newDate);
    }
  };

  // ✅ Format deadline 
  const updateDeadline = (date) => {
    const formatted = date
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // "YYYY-MM-DD HH:mm:ss"
    setDeadline(formatted);
  };

  // ✅ Render detail view if material selected
  if (selectedMaterial) {
    return (
      <AssignmentDetail
        material={selectedMaterial}
        onBack={() => setSelectedMaterial(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["modules", "assignments", "quizzes", "people"].map((tab) => (
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
      {activeTab !== "quizzes" && activeTab !== "people" && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📤 Upload {activeTab.slice(0, -1)}</Text>
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

          {/* ✅ Deadline pickers */}
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
            <TouchableOpacity style={styles.pickFileBtn} onPress={pickFile}>
              <Text style={styles.pickFileText}>📂 Pick File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={uploadFile}>
              <Text style={styles.uploadText}>⬆ Upload</Text>
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

      {/* → Uploaded Files header & list */}
      {activeTab !== "people" && (
        <View style={styles.uploadedSection}>
          <Text style={styles.uploadedHeader}>Uploaded Files</Text>

          <FlatList
            data={materials}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedMaterial(item)}>
                <View style={styles.fileCard}>
                  <Text style={styles.fileTitle}>{item.title}</Text>
                  <Text style={styles.fileDesc}>{item.description}</Text>
                  {item.deadline && (
                    <Text style={styles.deadline}>
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

      {/* People list */}
      {activeTab === "people" && (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.personCard}>
              <Text style={styles.personName}>
                {item.name} {item.role === "teacher" ? "(Instructor)" : ""}
              </Text>
              <Text style={styles.personEmail}>{item.email}</Text>
            </View>
          )}
        />
      )}

      {/* ✅ Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ Uploaded</Text>
            <Text style={styles.modalText}>
              Your {activeTab.slice(0, -1)} has been uploaded successfully!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Custom DatePicker Styling */}
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
          background-color: #007bff;
          color: #fff;
          border-bottom: none;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header {
          color: #fff;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #007bff;
          color: #fff;
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
    backgroundColor: "#f9f9f9",
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#007bff",
  },
  modalText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  /* File Row */
  fileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  /* Pick File Button */
  pickFileBtn: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#6c757d", // gray
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  pickFileText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* Upload Button */
  uploadBtn: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#007bff", // blue
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
  },
});