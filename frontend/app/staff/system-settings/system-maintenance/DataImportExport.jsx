import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker"; // ✅ for file import
import * as FileSystem from "expo-file-system"; // ✅ for file handling
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios"; // ✅ connect to Laravel backend

export default function DataImportExport({ isDarkMode }) {
  const textColor = { color: isDarkMode ? "#fff" : "#000" };
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    Alert.alert("Import", "Importing data from CSV or Excel...");
    // 🔹 Later: upload file via Laravel endpoint (/api/import-data)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;

      setLoading(true);

      const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: "application/octet-stream",
      });

      const res = await api.post("/system-maintenance/import-data", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        Alert.alert("✅ Success", res.data.message || "Data imported successfully!");
      } else {
        Alert.alert("⚠️ Warning", res.data?.message || "Import completed with warnings.");
      }
    } catch (error) {
      console.error("❌ Import error:", error.message);
      Alert.alert("Error", "Failed to import data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    Alert.alert("Export", "Exporting system data...");
    // 🔹 Later: download file from Laravel endpoint (/api/export-data)
    try {
      setLoading(true);
      const res = await api.get("/system-maintenance/export-data", {
        responseType: "blob",
      });

      if (res.status === 200) {
        Alert.alert("✅ Success", "Data export initiated successfully.");
      } else {
        Alert.alert("⚠️ Warning", "Unexpected response from server during export.");
      }
    } catch (error) {
      console.error("❌ Export error:", error.message);
      Alert.alert("Error", "Failed to export data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={[styles.desc, textColor]}>
        Import or export system data such as users, subjects, and grades.
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.importBtn]}
        onPress={handleImport}
        disabled={loading}
      >
        <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>
          {loading ? "Importing..." : "Import Data"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.exportBtn]}
        onPress={handleExport}
        disabled={loading}
      >
        <Ionicons name="download-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>
          {loading ? "Exporting..." : "Export Data"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  desc: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  importBtn: {
    backgroundColor: "#2563eb",
  },
  exportBtn: {
    backgroundColor: "#4caf50",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  dark: { backgroundColor: "#000" },
  light: { backgroundColor: "#fff" },
});