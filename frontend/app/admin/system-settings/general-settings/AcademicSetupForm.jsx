import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../../../lib/axios";

export default function AcademicSetupForm({ isDarkMode, onBack }) {
  const theme = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const [academicYear, setAcademicYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔵 MODAL STATES (ADDED)
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 🟢 Fetch ACTIVE academic year
  useEffect(() => {
    const fetchYear = async () => {
      try {
        const res = await api.get("/academic-years/active");

        if (res.data) {
          setAcademicYear(res.data.year_label || "");
          setStartDate(res.data.start_date || "");
          setEndDate(res.data.end_date || "");
        }
      } catch {
        Alert.alert("Error", "Failed to load academic year");
      } finally {
        setLoading(false);
      }
    };

    fetchYear();
  }, []);

  // 🟡 CONFIRM SAVE
  const requestSave = () => {
    if (!academicYear.trim() || !startDate || !endDate) {
      return Alert.alert("Validation", "All fields are required.");
    }
    setConfirmModal(true);
  };

  // 🟢 SAVE ACTION (UNCHANGED LOGIC)
  const handleSave = async () => {
    if (!academicYear || !startDate || !endDate) {
      return Alert.alert("Validation", "All fields are required.");
    }

    setSaving(true);
    try {
      await api.post("/academic-years", {
        year_label: academicYear,
        start_date: startDate,
        end_date: endDate,
      });

      setConfirmModal(false); // ✅ close confirmation modal
      setSuccessModal(true);  // ✅ open success modal
    } catch (error) {
      console.log(error.response?.data);
      Alert.alert("Error", "Failed to save academic year.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, marginTop: 100 }}
        size="large"
        color="#4caf50"
      />
    );
  }

  return (
    <ScrollView style={theme}>
      {/* 🔙 BACK */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-outline" size={22} color={textColor.color} />
        <Text style={[styles.backText, textColor]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, textColor]}>
        Academic Year & Semester Setup
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Academic Year</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={academicYear}
          onChangeText={setAcademicYear}
          placeholder="e.g. 2026–2027"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Start Date</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>End Date</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
        />
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={requestSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Setup"}
        </Text>
      </TouchableOpacity>

      {/* 🔴 CONFIRMATION MODAL */}
      <Modal transparent visible={confirmModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Save</Text>
            <Text style={styles.modalText}>
              Are you sure you want to save this academic year?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setConfirmModal(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleSave}
              >
                <Text style={styles.modalBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🟢 SUCCESS MODAL */}
      <Modal transparent visible={successModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { color: "#000000" }]}>
              All Set!
            </Text>
            <Text style={styles.modalText}>
              🎓 Academic Year & Semester have been successfully configured.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              onPress={() => setSuccessModal(false)}
            >
              <Text style={styles.modalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🟢 RESULT MODAL */}
      <Modal transparent visible={resultModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text
              style={[
                styles.modalTitle,
                { color: isSuccess ? "#4caf50" : "#f44336" },
              ]}
            >
              {isSuccess ? "Success" : "Error"}
            </Text>

            <Text style={styles.modalText}>{resultMessage}</Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              onPress={() => setResultModal(false)}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
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
  backBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  backText: { 
    marginLeft: 5, 
    fontSize: 16 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 20 
  },
  formGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 6 
  },
  input: { 
    borderRadius: 8, 
    padding: 10, 
    fontSize: 15 
  },
  inputDark: { 
    backgroundColor: "#1a1a1a", 
    color: "#fff" 
  },
  inputLight: { 
    backgroundColor: "#f5f5f5", 
    color: "#000" 
  },
  saveBtn: { 
    backgroundColor: "#808080", 
    padding: 14, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 10 
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  // 🔵 MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: "#9e9e9e",
  },
  confirmBtn: {
    backgroundColor: "#4caf50",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});