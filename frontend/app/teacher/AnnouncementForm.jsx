/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import RenderHTML from "react-native-render-html";
import api from "../lib/axios";

/**
 * Client-only safe CKEditor loader:
 * - On server or when CKEditor isn't available, fallback to TextInput.
 * - When window is present, attempt to require CKEditor modules and use them.
 */
let initialEditor = null;
if (typeof window !== "undefined") {
  // do not throw if require fails; we'll just fallback
  try {
    const ck = require("@ckeditor/ckeditor5-react");
    const classic = require("@ckeditor/ckeditor5-build-classic");
    // Robust extraction: module shape may vary
    const CKEditorLib = ck && (ck.CKEditor || ck.default?.CKEditor || ck.default);
    const ClassicEditorLib = classic && (classic.default || classic);
    if (CKEditorLib && ClassicEditorLib) {
      initialEditor = { CKEditor: CKEditorLib, ClassicEditor: ClassicEditorLib };
    }
  } catch (e) {
    // Editor not available in this environment (safe fallback)
    console.warn("CKEditor not loaded (will use fallback input).", e.message);
  }
}

export default function AnnouncementForm({ isDarkMode }) {
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ✅ Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // local editor container state (null if not available)
  const [editorModules, setEditorModules] = useState(initialEditor);

  // ref to the editor (if CKEditor present)
  const editorRef = useRef(null);

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

    // If the initial attempt didn't load CKEditor (e.g. HMR), try again on mount (client-side)
    if (!editorModules && typeof window !== "undefined") {
      try {
        const ck = require("@ckeditor/ckeditor5-react");
        const classic = require("@ckeditor/ckeditor5-build-classic");
        const CKEditorLib = ck && (ck.CKEditor || ck.default?.CKEditor || ck.default);
        const ClassicEditorLib = classic && (classic.default || classic);
        if (CKEditorLib && ClassicEditorLib) {
          setEditorModules({ CKEditor: CKEditorLib, ClassicEditor: ClassicEditorLib });
        }
      } catch (e) {
        // still not available: that's fine, fallback remains
        console.warn("CKEditor still unavailable after mount:", e.message);
      }
    }
     
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
    if (!content || !content.toString().trim()) {
      Alert.alert("Validation Error", "Announcement cannot be empty.");
      return;
    }

    try {
      await api.post("/announcements", { content });

      setContent("");
      setSuccessMessage("✅ Announcement created successfully!");
      setShowSuccessModal(true); // ✅ show modal
      fetchAnnouncements();
    } catch (err) {
      console.error("❌ Create error:", err.response?.data || err.message);
      Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
    }
  };

  const updateAnnouncement = async () => {
    if (!content || !content.toString().trim()) {
      Alert.alert("Validation Error", "Announcement cannot be empty.");
      return;
    }

    try {
      await api.put(`/announcements/${editingId}`, { content });

      setContent("");
      setEditingId(null);
      setSuccessMessage("✅ Announcement updated successfully!");
      setShowSuccessModal(true); // ✅ show modal
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

  // helper: set editor HTML if CKEditor present (used when editing an existing announcement)
  const setEditorContentIfPresent = (html) => {
    setContent(html);
    if (editorModules && editorRef.current && typeof editorRef.current.setData === "function") {
      try {
        editorRef.current.setData(html);
      } catch (e) {
        // ignore if setData isn't supported
      }
    }
  };

  return (
    <View style={{ padding: 16}}>
      <Text style={[styles.header, { color: isDarkMode ? "#178a4c" : "#178a4c" }]}>
        📢 Announcements
      </Text>

      {/* Editor area */}
      <View style={styles.form}>
        {editorModules && editorModules.CKEditor && editorModules.ClassicEditor ? (
          <editorModules.CKEditor
            editor={editorModules.ClassicEditor}
            data={content}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            onChange={(event, editor) => {
              try {
                const data = editor.getData();
                setContent(data);
              } catch (e) {}
            }}
            config={{
              toolbar: {
                items: [
                  "bold",
                  "italic",
                  "underline",
                  "|",
                  "bulletedList",
                  "numberedList",
                  "blockQuote",
                  "|",
                  "link",
                  "|",
                  "undo",
                  "redo",
                ],
                shouldNotGroupWhenFull: true,
              },
              placeholder: "Write an announcement...",
            }}
          />
        ) : (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? "#1a1a1a" : "#f7f7f7",
                color: isDarkMode ? "#fff" : "#0b3d2e",
                borderColor: isDarkMode ? "#178a4c" : "#178a4c",
              },
            ]}
            placeholder="Write an announcement..."
            placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
            value={content}
            onChangeText={setContent}
            multiline
          />
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? "#178a4c" : "#178a4c" },
          ]}
          onPress={editingId ? updateAnnouncement : createAnnouncement}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>
            {editingId ? "Update" : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
                borderColor: isDarkMode ? "#c9b037" : "#178a4c",
              },
            ]}
          >
            <RenderHTML
              contentWidth={600}
              source={{ html: item.content || "" }}
              baseStyle={[
                styles.text,
                { color: isDarkMode ? "#fff" : "#0b3d2e" },
              ]}
              tagsStyles={{
                p: { color: isDarkMode ? "#fff" : "#0b3d2e" },
                li: { color: isDarkMode ? "#fff" : "#0b3d2e" },
                span: { color: isDarkMode ? "#fff" : "#0b3d2e" },
              }}
            />

            <Text
              style={[
                styles.subtext,
                { color: isDarkMode ? "#c9b037" : "#178a4c" },
              ]}
            >
              —{" "}
              {item.user?.role === "admin"
                ? "Admin"
                : item.user?.role === "staff"
                ? "Staff"
                : item.user?.role === "teacher"
                ? item.user?.name
                : item.user?.name}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.id);
                  setEditorContentIfPresent(item.content || "");
                }}
              >
                <Text
                  style={[
                    styles.link,
                    { color: isDarkMode ? "#c9b037" : "#178a4c" },
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSelectedId(item.id);
                  setShowDeleteModal(true);
                }}
              >
                <Text
                  style={[
                    styles.link,
                    { color: isDarkMode ? "#f87171" : "#b91c1c" },
                  ]}
                >
                  Delete
                </Text>
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
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDarkMode ? "#0b3d2e" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? "#c9b037" : "#178a4c" },
              ]}
            >
              Delete Announcement
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: isDarkMode ? "#fff" : "#0b3d2e" },
              ]}
            >
              Are you sure you want to delete this announcement?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDarkMode ? "#1f2937" : "#ccc",
                    borderColor: isDarkMode ? "#c9b037" : "#178a4c",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: isDarkMode ? "#fff" : "#0b3d2e" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: "#b91c1c" },
                ]}
                onPress={confirmDelete}
              >
                <Text style={{ color: "#fff" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDarkMode ? "#0b3d2e" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? "#c9b037" : "#178a4c" },
              ]}
            >
              Success
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: isDarkMode ? "#fff" : "#0b3d2e" },
              ]}
            >
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: isDarkMode ? "#c9b037" : "#178a4c" },
              ]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={{ color: "#fff" }}>OK</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 60,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    marginBottom: 3,
    lineHeight: 20,
  },
  subtext: {
    fontSize: 12,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    gap: 16,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
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
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
});
