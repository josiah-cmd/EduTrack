import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_URL } from "../lib/axios";

export default function AssignmentDetail({ material, onBack }) {
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
      a.download = filename;
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
  },
  container: {
    padding: 16,
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
});