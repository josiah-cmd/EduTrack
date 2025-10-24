import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios";

export default function BackupRestore({ isDarkMode }) {
  const textColor = { color: isDarkMode ? "#fff" : "#000" };
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    Alert.alert("Backup Started", "The system is now creating a backup...");
    try {
      setLoading(true);
      const res = await api.post("/system-maintenance/backup");
      if (res.status === 200) {
        Alert.alert("✅ Backup Successful", res.data.message || "Backup file created successfully.");
      } else {
        Alert.alert("⚠️ Backup Warning", res.data?.message || "Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Backup failed:", error.message);
      Alert.alert("Error", "Failed to create backup. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert("Restore", "Restore process initiated...");
    try {
      setLoading(true);
      const res = await api.post("/system-maintenance/restore");
      if (res.status === 200) {
        Alert.alert("✅ Restore Successful", res.data.message || "System has been restored successfully.");
      } else {
        Alert.alert("⚠️ Restore Warning", res.data?.message || "Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Restore failed:", error.message);
      Alert.alert("Error", "Failed to restore data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <Text style={[styles.desc, textColor]}>
        Create and restore system backups including database and uploaded files.
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.backupBtn]}
        onPress={handleBackup}
        disabled={loading}
      >
        <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>
          {loading ? "Processing..." : "Backup Now"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.restoreBtn]}
        onPress={handleRestore}
        disabled={loading}
      >
        <Ionicons name="cloud-download-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>
          {loading ? "Processing..." : "Restore Backup"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginTop: 10 
  },
  desc: { 
    fontSize: 15, 
    marginBottom: 20, 
    lineHeight: 22 
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  backupBtn: { 
    backgroundColor: "#2563eb" 
  },
  restoreBtn: { 
    backgroundColor: "#4caf50" 
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  dark: { 
    backgroundColor: "#000" 
  },
  light: { 
    backgroundColor: "#fff" 
  },
});