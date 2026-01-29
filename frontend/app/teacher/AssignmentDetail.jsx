import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../lib/axios";

export default function AssignmentDetail({ material, onBack, isDarkMode }) {
  const [submissions, setSubmissions] = useState([]);

  // ✅ Fetch submissions for this assignment
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const role = await AsyncStorage.getItem("role");
        const token = await AsyncStorage.getItem(`${role}Token`);

        const res = await fetch(`${API_URL}/submissions/${material.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        console.error("❌ Error fetching submissions:", err.message);
      }
    };

    // ✅ Only fetch submissions if it's an assignment
    if (material.type === "assignment") {
      fetchSubmissions();
    }
  }, [material.id]);

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

  // ✅ Download file (fixed)
  const handleDownload = async (id, filename = "download") => {
    try {
      const role = await AsyncStorage.getItem("role");
      const token = await AsyncStorage.getItem(`${role}Token`);

      const res = await fetch(`${API_URL}/materials/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to download file");

      // ✅ Extract filename from the Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      let suggestedName = filename;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) suggestedName = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName; // ✅ use the backend-provided filename + extension
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download failed:", err.message);
      alert("Download failed");
    }
  };

  return (
    <View style={[styles.wrapper]}>
      <View
        style={[
          styles.containerBox,
          {
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
            borderColor: isDarkMode ? "#006400" : "#007b55",
            borderWidth: 1,
            shadowColor: isDarkMode ? "#006400" : "#333",
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text
            style={[
              styles.backText,
              { color: isDarkMode ? "#FFD700" : "#000000" },
            ]}
          >
            ⬅ Back
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.title, { color: isDarkMode ? "#FFD700" : "#000" }]}
        >
          {material.title}
        </Text>
        <Text
          style={[styles.desc, { color: isDarkMode ? "#fff" : "#555" }]}
        >
          {material.description}
        </Text>
        {material.deadline && (
          <Text
            style={[
              styles.deadline,
              { color: isDarkMode ? "#FF6347" : "red" },
            ]}
          >
            Deadline: {format(new Date(material.deadline), "yyyy-MM-dd h:mm a")}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handlePreview(material.id, material.title)}
          >
            <Text
              style={[
                styles.actionBtn,
                { color: isDarkMode ? "#000000" : "#000000" },
              ]}
            >
              👁 Preview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDownload(material.id, material.title)}
          >
            <Text
              style={[
                styles.actionBtn,
                { color: isDarkMode ? "#32CD32" : "#000000" },
              ]}
            >
              ⬇ Download
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Student submissions list — only for assignments */}
      {material.type === "assignment" && (
        <View
          style={[
            styles.submissionsBox,
            {
              backgroundColor: isDarkMode ? "#111" : "#fff",
              borderColor: isDarkMode ? "#006400" : "#ddd",
              borderWidth: 1,
              shadowColor: isDarkMode ? "#006400" : "#000",
            },
          ]}
        >
          <Text
            style={[
              styles.subHeader,
              { color: isDarkMode ? "#FFD700" : "#000" },
            ]}
          >
            📑 Student Submissions
          </Text>

          {submissions.length === 0 ? (
            <Text
              style={[
                styles.noSubmissions,
                { color: isDarkMode ? "#aaa" : "#666" },
              ]}
            >
              No submissions yet
            </Text>
          ) : (
            <FlatList
              data={submissions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.submissionCard,
                    {
                      backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
                      borderColor: isDarkMode ? "#006400" : "#ddd",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.studentName,
                      { color: isDarkMode ? "#FFD700" : "#000" },
                    ]}
                  >
                    👤 {item.student?.name || "Unknown"}
                  </Text>
                  <Text
                    style={[styles.fileName, { color: isDarkMode ? "#fff" : "#333" }]}
                  >
                    📄 {item.filename}
                  </Text>
                  <Text
                    style={[styles.date, { color: isDarkMode ? "#ccc" : "#777" }]}
                  >
                    🕒{" "}
                    {format(new Date(item.submitted_at), "MMM dd, yyyy h:mm a")}
                  </Text>
                  <View style={styles.submissionActions}>
                    <TouchableOpacity
                      onPress={() => handlePreview(item.id, item.filename)}
                    >
                      <Text
                        style={[
                          styles.subBtn,
                          { color: isDarkMode ? "#32CD32" : "#007bff" },
                        ]}
                      >
                        👁 Preview
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDownload(item.id, item.filename)}
                    >
                      <Text
                        style={[
                          styles.subBtn,
                          { color: isDarkMode ? "#32CD32" : "#007bff" },
                        ]}
                      >
                        ⬇ Download
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 20,
  },
  containerBox: {
    backgroundColor: "#ffffff", // white base
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D4AF37", // gold outline accent
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: "#006400", // deep green accent
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#006400", // green for title
  },
  desc: {
    fontSize: 14,
    color: "#444", // neutral dark text
    marginBottom: 6,
  },
  deadline: {
    color: "#D9534F", // red still for urgency
    fontWeight: "600",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D4AF37", // gold action links
    marginRight: 20,
  },

  /* Submissions */
  submissionsBox: {
    backgroundColor: "#ffffff", // white base
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#D4AF37", // gold border
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#006400", // green header
  },
  noSubmissions: {
    color: "#666",
    fontStyle: "italic",
  },
  submissionCard: {
    backgroundColor: "#F5FFF5", // light green tint background
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D4AF37", // gold edge for distinction
  },
  studentName: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#006400", // green text
  },
  fileName: {
    fontSize: 14,
    color: "#333",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginBottom: 6,
  },
  submissionActions: {
    flexDirection: "row",
    gap: 12,
  },
  subBtn: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D4AF37", // gold action links
    marginRight: 15,
  },
});