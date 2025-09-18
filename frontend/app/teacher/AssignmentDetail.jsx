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

export default function AssignmentDetail({ material, onBack }) {
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

    fetchSubmissions();
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
      a.download = filename; // ✅ use original filename
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download failed:", err.message);
      alert("Download failed");
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.containerBox}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>⬅ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{material.title}</Text>
        <Text style={styles.desc}>{material.description}</Text>
        {material.deadline && (
          <Text style={styles.deadline}>
            Deadline: {format(new Date(material.deadline), "yyyy-MM-dd h:mm a")}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handlePreview(material.id, material.title)}
          >
            <Text style={styles.actionBtn}>👁 Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDownload(material.id, material.title)}
          >
            <Text style={styles.actionBtn}>⬇ Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Student submissions list */}
      <View style={styles.submissionsBox}>
        <Text style={styles.subHeader}>📑 Student Submissions</Text>

        {submissions.length === 0 ? (
          <Text style={styles.noSubmissions}>No submissions yet</Text>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.submissionCard}>
                <Text style={styles.studentName}>
                  👤 {item.student?.name || "Unknown"}
                </Text>
                {/* ✅ Show original filename */}
                <Text style={styles.fileName}>📄 {item.filename}</Text>
                <Text style={styles.date}>
                  🕒 {format(
                    new Date(item.submitted_at),
                    "MMM dd, yyyy h:mm a"
                  )}
                </Text>
                <View style={styles.submissionActions}>
                  <TouchableOpacity
                    onPress={() => handlePreview(item.id, item.filename)}
                  >
                    <Text style={styles.subBtn}>👁 Preview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload(item.id, item.filename)}
                  >
                    <Text style={styles.subBtn}>⬇ Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
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
  },
  actionBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
    marginRight: 20,
  },

  /* Submissions */
  submissionsBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noSubmissions: {
    color: "#666",
    fontStyle: "italic",
  },
  submissionCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  studentName: {
    fontWeight: "600",
    marginBottom: 4,
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
    color: "#007bff",
    marginRight: 15,
  },
});