import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios"; // ✅ connect to Laravel backend

export default function ClearCache({ isDarkMode }) {
  const textColor = { color: isDarkMode ? "#fff" : "#000" };
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const handleClear = async () => {
    try {
      setLoading(true);
      const res = await api.post("/system-maintenance/clear-cache");
      if (res.data?.success) {
        setConfirmVisible(false);
        setSuccessVisible(true);
      } else {
        Alert.alert("⚠️ Warning", res.data?.message || "Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Cache clear failed:", error.message);
      Alert.alert("Error", "Failed to clear cache. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <Text style={[styles.desc, textColor]}>
        Clears system cache and temporary data to keep performance smooth.
      </Text>

      {/* 🔹 MAIN BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={() => setConfirmVisible(true)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Text style={styles.btnText}>Clear Cache</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ⚠️ CONFIRMATION MODAL */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <Text style={[styles.modalTitle, textColor]}>Are you sure?</Text>
            <Text style={[styles.modalText, textColor]}>
              Do you really want to clear the system cache? This will remove temporary data.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn]}
                onPress={handleClear}
                disabled={loading}
              >
                <Text style={styles.confirmText}>
                  {loading ? "Clearing..." : "Yes, Clear"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ SUCCESS MODAL */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <Ionicons name="checkmark-circle-outline" size={50} color="#22c55e" />
            <Text style={[styles.modalTitle, textColor]}>Cache Cleared!</Text>
            <Text style={[styles.modalText, textColor]}>
              System cache and temporary data were cleared successfully.
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { marginTop: 10 }]}
              onPress={() => setSuccessVisible(false)}
            >
              <Text style={styles.confirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 10,
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

  /* 🔹 MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    width: "30%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  darkModal: { 
    backgroundColor: "#1a1a1a" 
  },
  lightModal: { 
    backgroundColor: "#fff" 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#d1d5db",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  cancelText: { 
    color: "#000", 
    fontWeight: "600" 
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },
});