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

  // --- NEW STATE: editId, delete modal ---
  const [editId, setEditId] = useState(null); // if set -> edit mode
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 🔹 TEST BANK STATES (ADDED)
  const [isTestBankMode, setIsTestBankMode] = useState(false);
  const [testBankMaterials, setTestBankMaterials] = useState([]);
  const [showTestBankModal, setShowTestBankModal] = useState(false);
  const [saveToTestBank, setSaveToTestBank] = useState(false);

  const [showModulesFolder, setShowModulesFolder] = useState(true);
  const [showAssignmentsFolder, setShowAssignmentsFolder] = useState(false);

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

  // 🔹 Fetch Test Bank Materials
  const fetchTestBankMaterials = async () => {
    try {
      const res = await api.get("/materials/test-bank");
      setTestBankMaterials(res.data);
    } catch (err) {
      console.error("❌ Error fetching test bank:", err.response?.data || err.message);
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

  // --- NEW: startEdit - prefill form with material data and switch to edit mode
  const startEdit = (material) => {
    setTitle(material.title || "");
    setDesc(material.description || "");
    if (material.deadline) {
      try {
        const parsed = new Date(material.deadline);
        if (!isNaN(parsed)) {
          setSelectedDate(parsed);
          updateDeadline(parsed);
        }
      } catch (e) {
        // ignore
      }
    } else {
      setSelectedDate(new Date());
      setDeadline("");
    }

    // We do not auto-set the file object (teacher can pick new file if they want).
    setFile(null);

    // Set edit mode
    setEditId(material.id);

    // Ensure tab is modules/assignments depending on type
    if (material.type === "assignment") {
      setActiveTab("assignments");
    } else if (material.type === "module") {
      setActiveTab("modules");
    }
    // Scroll/view handled by parent UI if needed; form is visible already.
  };

  // --- NEW: cancel editing
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDesc("");
    setDeadline("");
    setSelectedDate(new Date());
    setFile(null);
  };

  // ✅ Upload (fixed version) - UPDATED to support edit mode + Test Bank
  const uploadFile = async () => {
    if (!title?.trim()) return alert("Title is required");
    // if creating new, require file
    if (!editId && !file) return alert("Pick a file first");

    const formData = new FormData();

    // 🔹 Attach room_id ONLY if saving to classroom
    if (!saveToTestBank) {
      formData.append("room_id", room.id);
    }

    formData.append("type", activeTab === "modules" ? "module" : "assignment");
    formData.append("title", title);
    formData.append("description", desc);

    // 🔹 Explicit Test Bank flag
    if (saveToTestBank) {
      formData.append("is_test_bank", "1");
    }

    if (activeTab === "assignments") formData.append("deadline", deadline);

    // If there's a picked file, attach it (optional on edit)
    if (file) {
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
    }

    try {
      if (editId) {
        // UPDATE existing material — your backend expects POST /materials/{id}
        const res = await api.post(`/materials/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("Updated material:", res.data);

        // Replace in materials list
        setMaterials((prev) =>
          prev.map((m) => (m.id === res.data.material.id ? res.data.material : m))
        );

        setShowSuccessModal(true);
        // exit edit mode (but keep form cleared)
        cancelEdit();
        fetchMaterials();
      } else {
        // CREATE new material
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
        setSaveToTestBank(false);
      }
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

  // --- NEW: confirmDelete opens modal
  const confirmDelete = (material) => {
    setDeleteTarget(material);
    setShowDeleteModal(true);
  };

  // --- NEW: perform delete
  const deleteFile = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/materials/${deleteTarget.id}`);
      // remove from list
      setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);

      // If we were editing the same item, cancel edit mode
      if (editId === deleteTarget.id) cancelEdit();
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err.message);
      alert("Delete failed");
    }
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
              activeTab === tab && { backgroundColor: "#808080" },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
                activeTab === tab && { color: "#FFD700" },
                isDarkMode && { color: "#000000" },
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
      {activeTab !== "quizzes" && activeTab !== "people" && activeTab !== "attendance" && (
        <View style={[styles.formCard, isDarkMode && { backgroundColor: "#808080" }]}>

          {/* 🔹 Test Bank Toggle */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setIsTestBankMode(false)}
              style={{
                padding: 8,
                backgroundColor: !isTestBankMode ? "#0E5149" : "#555",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Classroom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsTestBankMode(true);
                fetchTestBankMaterials();
              }}
              style={{
                padding: 8,
                backgroundColor: isTestBankMode ? "#0E5149" : "#555",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Learning Materials Bank</Text>
            </TouchableOpacity>
          </View>

          {/* 🔹 Upload title + Save to Test Bank aligned */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginVertical: 10,
            }}
          >
            <Text style={[styles.formTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
              📤 Upload {activeTab.slice(0, -1)}
            </Text>

            {/* 🔹 Save to Test Bank Toggle */}
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: "#444",
                borderRadius: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "600", marginRight: 8 }}>
                  Save to Learning Materials Bank
                </Text>

                <TouchableOpacity
                  onPress={() => setSaveToTestBank((prev) => !prev)}
                  style={{
                    width: 42,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: saveToTestBank ? "#0E5149" : "#999",
                    justifyContent: "center",
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#fff",
                      alignSelf: saveToTestBank ? "flex-end" : "flex-start",
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>     

          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
            placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
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
            placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
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
            <TouchableOpacity style={[styles.pickFileBtn, { backgroundColor: "#0E5149" }]} onPress={pickFile}>
              <Text style={[styles.pickFileText, { color: "#fff" }]}>📂 Pick File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: "#0E5149" }]} onPress={uploadFile}>
              <Text style={[styles.uploadText, { color: "#F7F7F7", fontWeight: "bold" }]}>{editId ? "💾 Save Changes" : "⬆ Upload"}</Text>
            </TouchableOpacity>
          </View>

          {isTestBankMode && (
            <TouchableOpacity
              style={{ marginTop: 10, padding: 10, backgroundColor: "#444", borderRadius: 6 }}
              onPress={() => {
                fetchTestBankMaterials();
                setShowTestBankModal(true);
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                📚 View Learning Materials Bank
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel edit button shown only in edit mode */}
          {editId && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>✖ Cancel Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          {file && (
            <View style={styles.filePreview}>
              <Text style={[styles.filePreviewText, { color: isDarkMode ? "#000000" : "#333" }]}>
                {getFileIcon(file.name)} {file.name}
              </Text>
              {file.size && (
                <Text style={[styles.filePreviewSize, { color: isDarkMode ? "#000000" : "#666" }]} >
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
          <Text style={[styles.uploadedHeader, { color: isDarkMode ? "#F7F7F7" : "#222" }]}>
            Uploaded Files
          </Text>

          <FlatList
            data={materials}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              // ✅ MAKE FILE CLICKABLE (ADDED ONLY THIS WRAPPER)
              <TouchableOpacity onPress={() => setSelectedMaterial(item)}>
                <View style={[styles.fileCard, isDarkMode && { backgroundColor: "#808080", borderColor: "#444" }]}>
                  <Text style={[styles.fileTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
                    {getFileIcon(item.original_name || item.file_path)} {item.title}
                  </Text>
                  <Text style={[styles.fileDesc, { color: isDarkMode ? "#F7F7F7" : "#555" }]}>
                    {item.description}
                  </Text>

                  {item.deadline && (
                    <Text style={[styles.deadline, { color: "#000000" }]}>
                      Deadline: {format(new Date(item.deadline), "yyyy-MM-dd h:mm a")}
                    </Text>
                  )}

                  {/* --- NEW: Edit & Delete buttons (Option A) --- */}
                  <View style={styles.actionRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                      }}
                    ></View>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        // Prevent parent TouchableOpacity from taking this press:
                        // (in RN nesting, inner touchables get events)
                        startEdit(item);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        confirmDelete(item);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
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
            <View style={[styles.personCard, isDarkMode && { backgroundColor: "#808080", borderColor: "#444", fontWeight: "400" }]}>
              <Text style={[styles.personName, { color: isDarkMode ? "#fff" : "#333" }]}>
                {item.name} {item.role === "teacher" ? "(Instructor)" : ""}
              </Text>
              <Text style={[styles.personEmail, { color: isDarkMode ? "#000000" : "#F7F7F7", fontWeight: "400" }]}>{item.email}</Text>
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
          <Text style={[styles.modalTitle, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>✅ Uploaded</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? "#fff" : "#444" }]}>
            Your {activeTab.slice(0, -1)} has been uploaded successfully!
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: "#0E5149" }]}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={[styles.modalButtonText, { color: "#F7F7F7" }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* --- NEW: Delete Confirmation Modal --- */}
      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>Confirm Delete</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? "#fff" : "#444", marginBottom: 10 }]}>
            Are you sure you want to delete this file?
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#ff4444", marginRight: 8 }]}
              onPress={deleteFile}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#0E5149" }]}
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
            >
              <Text style={[styles.modalButtonText, { color: "#F7F7F7" }]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔹 TEST BANK MODAL */}
      <Modal
        transparent
        visible={showTestBankModal}
        animationType="slide"
        onRequestClose={() => setShowTestBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            <Text
              style={[
                styles.modalTitle,
                {
                  textAlign: "left",
                  alignSelf: "flex-start",
                  color: isDarkMode ? "#000000" : "#007bff",
                },
              ]}
            >
              📚 Learning Materials Bank
            </Text>

            {/* 📁 MODULES FOLDER */}
            <TouchableOpacity
              style={styles.folderHeader}
              onPress={() => setShowModulesFolder((prev) => !prev)}
            >
              <Text style={styles.folderTitle}>
                {showModulesFolder ? "📂" : "📁"} Modules
              </Text>
            </TouchableOpacity>

            {showModulesFolder &&
              testBankMaterials
                .filter((item) => item.type === "module")
                .map((item) => (
                  <View key={item.id} style={[styles.fileCard, { marginBottom: 10 }]}>
                    <Text style={styles.fileTitle}>{item.title}</Text>
                    <Text style={styles.fileDesc}>{item.description}</Text>

                    <TouchableOpacity
                      style={[styles.uploadBtn, { marginTop: 6 }]}
                      onPress={async () => {
                        try {
                          await api.post("/materials/attach-test-bank", {
                            material_id: item.id,
                            room_id: room.id,
                          });

                          alert("Added to room successfully!");
                          setShowTestBankModal(false);
                          fetchMaterials();
                        } catch (err) {
                          console.error(err.response?.data || err.message);
                          alert("Failed to add material");
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#000000" : "#007bff",
                          fontWeight: "600",
                        }}
                      >
                        ➕ Add to This Room
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

            {/* 📁 ASSIGNMENTS FOLDER */}
            <TouchableOpacity
              style={styles.folderHeader}
              onPress={() => setShowAssignmentsFolder((prev) => !prev)}
            >
              <Text style={styles.folderTitle}>
                {showAssignmentsFolder ? "📂" : "📁"} Assignments
              </Text>
            </TouchableOpacity>

            {showAssignmentsFolder &&
              testBankMaterials
                .filter((item) => item.type === "assignment")
                .map((item) => (
                  <View key={item.id} style={[styles.fileCard, { marginBottom: 10 }]}>
                    <Text style={styles.fileTitle}>{item.title}</Text>
                    <Text style={styles.fileDesc}>{item.description}</Text>

                    <TouchableOpacity
                      style={[styles.uploadBtn, { marginTop: 6 }]}
                      onPress={async () => {
                        try {
                          await api.post("/materials/attach-test-bank", {
                            material_id: item.id,
                            room_id: room.id,
                          });

                          alert("Added to room successfully!");
                          setShowTestBankModal(false);
                          fetchMaterials();
                        } catch (err) {
                          console.error(err.response?.data || err.message);
                          alert("Failed to add material");
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#000000" : "#007bff",
                          fontWeight: "600",
                        }}
                      >
                        ➕ Add to This Room
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#F7F7F7" }]}
              onPress={() => setShowTestBankModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>

          </View>
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
          background-color: #0E5149;
          color: #fff;
          border-bottom: none;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header {
          color: #fff;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #0E5149;
          color: #F7F7F7;
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
  /* NEW: Action row & buttons */
  actionRow: {
    marginTop: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 5,
    alignItems: "center",
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#0E5149",
    borderRadius: 6,
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#b91c1c",
    borderRadius: 6,
  },
  /* Cancel edit button */
  cancelBtn: {
    backgroundColor: "#8b0000",
    padding: 8,
    borderRadius: 6,
  },
  folderHeader: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eaeaea",
    borderRadius: 8,
    marginBottom: 6,
    fontWeight: "600",
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  fileCard: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginLeft: 10, // visual folder indentation
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    width: "50%",
    maxHeight: "90%",
    borderRadius: 14,
    padding: 16,
  },
});