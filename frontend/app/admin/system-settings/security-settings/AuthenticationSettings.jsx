import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../../../lib/axios"; // 🟢 Add axios instance

export default function AuthenticationSettings({ isDarkMode, onBack }) {
  const [minLength, setMinLength] = useState("8");
  const [maxAttempts, setMaxAttempts] = useState("5");
  const [timeout, setTimeout] = useState("30");

  // 🟢 ADDED: Lockout timer (minutes)
  const [lockoutMinutes, setLockoutMinutes] = useState("15");

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false); // 🟢 Added for modal

  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  // 🟢 Fetch existing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // ✅ NEW ROUTE (preferred)
        const res = await api.get("/security/authentication-settings");

        if (res.data) {
          setMinLength(res.data.password_min_length?.toString() || "8");
          setMaxAttempts(res.data.max_login_attempts?.toString() || "5");
          setTimeout(res.data.session_timeout?.toString() || "30");
          setLockoutMinutes(res.data.lockout_minutes?.toString() || "15");
        }
      } catch (error) {
        console.warn("New endpoint failed, trying fallback...", error);

        // 🟡 FALLBACK (DO NOT REMOVE — legacy support)
        try {
          const res = await api.get("/security/settings");
          if (res.data) {
            setMinLength(res.data.password_min_length?.toString() || "8");
            setMaxAttempts(res.data.max_login_attempts?.toString() || "5");
            setTimeout(res.data.session_timeout?.toString() || "30");
          }
        } catch (err) {
          console.error("Error fetching settings:", err);
        }
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);

      // ✅ NEW ROUTE (preferred)
      await api.put("/security/authentication-settings", {
        password_min_length: parseInt(minLength),
        max_login_attempts: parseInt(maxAttempts),
        lockout_minutes: parseInt(lockoutMinutes),
        session_timeout: parseInt(timeout),
      });

      Alert.alert("Success", "Authentication settings saved!");
    } catch (error) {
      console.warn("New endpoint failed, trying fallback...", error);

      // 🟡 FALLBACK (legacy compatibility)
      try {
        await api.post("/security/settings", {
          password_min_length: parseInt(minLength),
          max_login_attempts: parseInt(maxAttempts),
          session_timeout: parseInt(timeout),
        });

        Alert.alert("Success", "Authentication settings saved!");
      } catch (err) {
        console.error("Error saving settings:", err);
        Alert.alert("Error", "Failed to save settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Confirm Save Handler
  const confirmSave = () => {
    setConfirmVisible(false);
    handleSave();
  };

  return (
    <ScrollView>
      <Text style={[styles.title, textColor]}>Authentication Settings</Text>
      <Text style={[styles.desc, { color: isDarkMode ? "#aaa" : "#555" }]}>
        Configure login rules and session management.
      </Text>

      <View style={styles.form}>
        <Text style={[styles.label, textColor]}>Password Minimum Length</Text>
        <TextInput
          value={minLength}
          onChangeText={setMinLength}
          keyboardType="numeric"
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
        />

        <Text style={[styles.label, textColor]}>Max Login Attempts</Text>
        <TextInput
          value={maxAttempts}
          onChangeText={setMaxAttempts}
          keyboardType="numeric"
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
        />

        {/* 🟢 ADDED */}
        <Text style={[styles.label, textColor]}>
          Lockout Duration (minutes)
        </Text>
        <TextInput
          value={lockoutMinutes}
          onChangeText={setLockoutMinutes}
          keyboardType="numeric"
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
        />

        <Text style={[styles.label, textColor]}>
          Session Timeout (minutes)
        </Text>
        <TextInput
          value={timeout}
          onChangeText={setTimeout}
          keyboardType="numeric"
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
        />

        {/* 🟢 Modified: Show confirmation modal before saving */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => setConfirmVisible(true)}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? "Saving..." : "Save Settings"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🟢 Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? "#1a1a1a" : "#fff" },
            ]}
          >
            <Text style={[styles.modalTitle, textColor]}>
              Confirm Save Settings
            </Text>
            <Text
              style={[
                styles.modalMessage,
                { color: isDarkMode ? "#ccc" : "#555" },
              ]}
            >
              Are you sure you want to save these authentication settings?
              {"\n"}
              This will apply to all users in the system.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}
                onPress={confirmSave}
              >
                <Text style={styles.modalBtnText}>Yes, Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#dc2626" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  dark: { 
    backgroundColor: "#000" 
  },
  light: { 
    backgroundColor: "#fff" 
  },
  backButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  backText: { 
    fontSize: 16, 
    marginLeft: 6 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 10 
  },
  desc: { 
    fontSize: 14, 
    marginBottom: 20 
  },
  form: { 
    gap: 16 },
  label: { 
    fontSize: 16, 
    fontWeight: "500" 
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  inputDark: { 
    backgroundColor: "#1a1a1a", 
    borderColor: "#333", 
    color: "#fff" 
  },
  inputLight: { 
    backgroundColor: "#f9f9f9", 
    borderColor: "#ddd", 
    color: "#000" 
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "30%",
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 15 
  },
});