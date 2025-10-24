/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function ChangePasswordForm({ isDarkMode, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("⚠ Please fill out all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("❌ New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const role = await AsyncStorage.getItem("role");
      const token = await AsyncStorage.getItem(`${role}Token`);
      if (!token) return;

      const res = await api.post(
        "/profile/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ " + res.data.message);
      onBack();
    } catch (err) {
      console.error("❌ Error changing password:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#f5f6fa" }]}>
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#111" }]}>Change Password</Text>

      <TextInput
        style={[
          styles.input,
          {
            color: isDarkMode ? "#fff" : "#000",
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            borderColor: isDarkMode ? "#333" : "#ddd",
          },
        ]}
        placeholder="Current Password"
        placeholderTextColor={isDarkMode ? "#888" : "#888"}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <TextInput
        style={[
          styles.input,
          {
            color: isDarkMode ? "#fff" : "#000",
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            borderColor: isDarkMode ? "#333" : "#ddd",
          },
        ]}
        placeholder="New Password"
        placeholderTextColor={isDarkMode ? "#888" : "#888"}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={[
          styles.input,
          {
            color: isDarkMode ? "#fff" : "#000",
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            borderColor: isDarkMode ? "#333" : "#ddd",
          },
        ]}
        placeholder="Confirm New Password"
        placeholderTextColor={isDarkMode ? "#888" : "#888"}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.6 }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{loading ? "Saving..." : "🔒 Update Password"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
        <Text style={styles.cancelButtonText}>↩ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#000",
    paddingHorizontal: 14,
    marginBottom: 18,
    borderRadius: 10,
    height: 50,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#999",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});