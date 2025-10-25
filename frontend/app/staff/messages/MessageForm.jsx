/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

// ---- CKEditor safe loader (same pattern as AnnouncementForm.jsx) ----
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
  const [editorModules, setEditorModules] = useState(initialEditor);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchRecipients();

    // ensure CKEditor is loaded client-side
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
    // 🔥 force sync latest editor data before sending
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
      alert("Message sent!");
      setSubject("");
      setContent("");
      setSelectedRecipient("");
      onSent?.();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  return (
    <View style={[styles.form]}>
      {/* Recipient */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Recipient</Text>
      <TextInput
        placeholder="Enter recipient"
        placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
        value={selectedRecipient}
        onChangeText={setSelectedRecipient}
        style={[
          styles.input,
          { color: isDarkMode ? "#fff" : "#000", borderColor: isDarkMode ? "#555" : "#ccc" },
        ]}
      />

      {/* Subject */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Subject</Text>
      <TextInput
        style={[
          styles.input,
          { color: isDarkMode ? "#fff" : "#000", borderColor: isDarkMode ? "#555" : "#ccc" },
        ]}
        placeholder="Enter subject"
        placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
        value={subject}
        onChangeText={setSubject}
      />

      {/* Message */}
      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Message</Text>
      <View style={[styles.editorContainer, { borderColor: isDarkMode ? "#555" : "#ccc" }]}>
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
            placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
            value={content}
            onChangeText={setContent}
            multiline
          />
        )}
      </View>

      {/* Send Button */}
      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
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
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    padding: 5,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});