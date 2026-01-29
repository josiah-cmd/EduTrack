import { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

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
    console.warn("CKEditor not loaded (fallback to TextInput).", e.message);
  }
}

export default function MessageForm({ onSent, isDarkMode }) {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [editorModules, setEditorModules] = useState(initialEditor);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchRecipients();
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

  const fetchRecipients = async () => {
    try {
      const response = await api.get("/users");
      setRecipients(response.data);
    } catch (error) {
      console.error("Error fetching recipients:", error);
    }
  };

  const handleSend = async () => {
    if (editorRef.current) {
      const latestData = editorRef.current.getData();
      if (latestData !== content) {
        setContent(latestData);
      }
    }

    if (!selectedRecipient || !subject || !content) {
      alert("All fields are required!");
      return;
    }

    try {
      await api.post("/messages", {
        recipient_email: selectedRecipient,
        subject: subject,
        body: content,
      });

      // ✅ Show success modal instead of instantly closing
      setSuccessModalVisible(true);

      // Clear input fields
      setSubject("");
      setContent("");
      setSelectedRecipient("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  return (
    <View style={styles.form}>
      {/* Recipient */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#F7F7F7", fontWeight: "500" }]}>Recipient</Text>
      <TextInput
        placeholder="Enter recipient email"
        placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
        value={selectedRecipient}
        onChangeText={setSelectedRecipient}
        style={[
          styles.input,
          { color: isDarkMode ? "#fff" : "#F7F7F7", borderColor: isDarkMode ? "#000000" : "#000000" },
        ]}
      />

      {/* Subject */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#F7F7F7", fontWeight: "500" }]}>Subject</Text>
      <TextInput
        style={[
          styles.input,
          { color: isDarkMode ? "#fff" : "#F7F7F7", borderColor: isDarkMode ? "#000000" : "#000000" },
        ]}
        placeholder="Enter subject"
        placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
        value={subject}
        onChangeText={setSubject}
      />

      {/* Message */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#F7F7F7", fontWeight: "500" }]}>Message</Text>
      <View style={[styles.editorContainer, { borderColor: isDarkMode ? "#000000" : "#ccc" }]}>
        {editorModules && editorModules.CKEditor && editorModules.ClassicEditor ? (
          <editorModules.CKEditor
            editor={editorModules.ClassicEditor}
            data={content}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            onChange={(event, editor) => {
              try {
                setContent(editor.getData());
              } catch (e) {
                console.error("Editor error:", e.message);
              }
            }}
            config={{
              toolbar: [
                "heading",
                "|",
                "bold",
                "italic",
                "link",
                "bulletedList",
                "numberedList",
                "blockQuote",
                "|",
                "undo",
                "redo",
              ],
              placeholder: "Write your message...",
            }}
          />
        ) : (
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: "top" }]}
            placeholder="Write your message..."
            placeholderTextColor={isDarkMode ? "#aaa" : "#000000"}
            value={content}
            onChangeText={setContent}
            multiline
          />
        )}
      </View>

      {/* Send Button */}
      <View style={{ alignItems: "flex-end" }}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ Message Sent Successfully!</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSuccessModalVisible(false);
                onSent?.(); // ✅ Now trigger parent after closing modal
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: "#808080",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
    fontSize: 15,
    fontWeight: "500"
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    padding: 5,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#0E5149",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: 70,
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontWeight: "500"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    width: "30%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});