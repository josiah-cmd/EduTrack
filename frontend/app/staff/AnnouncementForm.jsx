/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import RenderHTML from "react-native-render-html";
import { ScrollView } from "react-native-web";
import api from "../lib/axios";

/**
 * Client-only safe CKEditor loader:
 * - On server or when CKEditor isn't available, fallback to TextInput.
 * - When window is present, attempt to require CKEditor modules and use them.
 */
let initialEditor = null;
if (typeof window !== "undefined") {
  try {
    const ck = require("@ckeditor/ckeditor5-react");
    const classic = require("@ckeditor/ckeditor5-build-classic");
    const CKEditorLib = ck && (ck.CKEditor || ck.default?.CKEditor || ck.default);
    const ClassicEditorLib = classic && (classic.default || classic);
    if (CKEditorLib && ClassicEditorLib) {
      initialEditor = { CKEditor: CKEditorLib, ClassicEditor: ClassicEditorLib };
    }
  } catch (e) {
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

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [editorModules, setEditorModules] = useState(initialEditor);
  const editorRef = useRef(null);

  // ✅ ABSOLUTE IMAGE UPLOAD URL (THIS WAS MISSING)
  const imageUploadUrl = api?.defaults?.baseURL
    ? `${api.defaults.baseURL}/announcements/upload-image`
    : "/announcements/upload-image";

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
      setShowSuccessModal(true);
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
      setShowSuccessModal(true);
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

  const setEditorContentIfPresent = (html) => {
    setContent(html);
    if (editorModules && editorRef.current && typeof editorRef.current.setData === "function") {
      try {
        editorRef.current.setData(html);
      } catch (e) {}
    }
  };

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.header, { color: isDarkMode ? "#fff" : "#111" }]}>
        📢 Announcements
      </Text>

      <View style={styles.form}>
        {editorModules && editorModules.CKEditor && editorModules.ClassicEditor ? (
          <editorModules.CKEditor
            editor={editorModules.ClassicEditor}
            data={content}
            onReady={(editor) => {
              editorRef.current = editor;

              // ✅ AUTO LIMIT IMAGE SIZE AFTER INSERT (SAFE)
              editor.model.document.on("change:data", () => {
                const viewDocument = editor.editing.view.document;
                const images = viewDocument.getRoot().getChildren();

                for (const node of images) {
                  if (node.name === "figure") {
                    const img = node.getChild(0);
                    if (img && img.is("element", "img")) {
                      editor.editing.view.change((writer) => {
                        writer.setStyle("max-width", "300px", img);
                        writer.setStyle("height", "auto", img);
                      });
                    }
                  }
                }
              });
            }}
            onChange={(event, editor) => {
              try {
                const data = editor.getData();
                setContent(data);
              } catch (e) { }
            }}
            config={{
              placeholder: "Write an announcement...",

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
                  "imageUpload",
                  "|",
                  "undo",
                  "redo",
                ],
                shouldNotGroupWhenFull: true,
              },

              // ✅ IMAGE CONFIG (ADDED — DOES NOT REMOVE ANYTHING)
              image: {
                styles: ["alignLeft", "alignCenter", "alignRight"],
                toolbar: [
                  "imageStyle:alignLeft",
                  "imageStyle:alignCenter",
                  "imageStyle:alignRight",
                ],
              },

              // ✅ FIXED IMAGE UPLOAD CONFIG (UNCHANGED)
              extraPlugins: [
                function Base64UploadAdapterPlugin(editor) {
                  editor.plugins.get("FileRepository").createUploadAdapter = (
                    loader
                  ) => {
                    return {
                      upload: () =>
                        loader.file.then(
                          (file) =>
                            new Promise((resolve) => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                resolve({ default: reader.result });
                              };
                              reader.readAsDataURL(file);
                            })
                        ),
                    };
                  };
                },
              ],
            }}
          />
        ) : (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                color: isDarkMode ? "#fff" : "#111",
                borderColor: isDarkMode ? "#374151" : "#d1d5db",
              },
            ]}
            placeholder="Write an announcement..."
            placeholderTextColor={isDarkMode ? "#000000" : "#6b7280"}
            value={content}
            onChangeText={setContent}
            multiline
          />
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDarkMode ? "#808080" : "#0E5149" }]}
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
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDarkMode ? "#808080" : "#fff",
                borderColor: isDarkMode ? "#374151" : "#d1d5db",
              },
            ]}
          >
            <RenderHTML
              contentWidth={600}
              source={{ html: item.content || "" }}
              baseStyle={[styles.text, { color: isDarkMode ? "#fff" : "#111", fontWeight: "500" }]}
              tagsStyles={{
                p: { color: isDarkMode ? "#fff" : "#111", marginBottom: 6 },
                li: { color: isDarkMode ? "#fff" : "#111" },
                span: { color: isDarkMode ? "#fff" : "#111" },
                img: { maxWidth: 300, height: "auto" }, // ✅ IMAGE FIX FOR DISPLAY
              }}
            />

            <Text
              style={[
                styles.subtext,
                { color: isDarkMode ? "#F7F7F7" : "#6b7280", fontWeight: "500" },
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
              {/* Edit container */}
              <View
                style={[
                  styles.actionContainer,
                  isDarkMode ? styles.editDark : styles.editLight,
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setEditorContentIfPresent(item.content || "");
                  }}
                >
                  <Text
                    style={[
                      styles.link,
                      isDarkMode ? styles.textDark : styles.textLight,
                    ]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Delete container */}
              <View
                style={[
                  styles.actionContainer,
                  isDarkMode ? styles.deleteDark : styles.deleteLight,
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedId(item.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
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
              { backgroundColor: isDarkMode ? "#0E5149" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? "#fff" : "#111827", fontWeight: "500" },
              ]}
            >
              Delete Announcement
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: isDarkMode ? "#F7F7F7" : "#374151", fontWeight: "400" },
              ]}
            >
              Are you sure you want to delete this announcement?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: isDarkMode ? "#808080" : "#e5e7eb" },
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: isDarkMode ? "#fff" : "#111" }}>
                  Cancel
                </Text>
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

      {/* ✅ Success Modal */}
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
              { backgroundColor: isDarkMode ? "#0E5149" : "#fff" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: "#F7F7F7" }]}>
              Success
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: isDarkMode ? "#F7F7F7" : "#374151" },
              ]}
            >
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#808080" }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={{ color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "transparent",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
    alignSelf: "flex-end",
    width: "10%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 20,
  },
  subtext: {
    fontSize: 12,
    marginBottom: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
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
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
  },
  actionContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  /* EDIT button */
  editLight: {
    backgroundColor: "#0E5149", 
  },

  editDark: {
    backgroundColor: "#0E5149", 
  },

  /* DELETE button */
  deleteLight: {
    backgroundColor: "#b91c1c", 
  },

  deleteDark: {
    backgroundColor: "#b91c1c", 
  },

  /* Text */
  textLight: {
    color: "#F7F7F7",
  },

  textDark: {
    color: "#f8fafc",
  },

  deleteText: {
    color: "#F7F7F7",
    fontWeight: "600",
  },
});