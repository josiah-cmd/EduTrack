/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // 🟢 Added Modal
import api from "../../lib/axios";

export default function ProfileForm({ isDarkMode, onBack }) {
  const [user, setUser] = useState(null);
  const [dob, setDob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // 🟢 Added
  const [modalMessage, setModalMessage] = useState(""); // 🟢 Added

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const role = await AsyncStorage.getItem("role");
        const token = await AsyncStorage.getItem(`${role}Token`);
        if (!token) return;

        const res = await api.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        if (res.data.dob) setDob(new Date(res.data.dob));
      } catch (err) {
        console.error("❌ Error fetching profile:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const role = await AsyncStorage.getItem("role");
      const token = await AsyncStorage.getItem(`${role}Token`);
      if (!token) return;

      await api.post(
        "/profile/update",
        {
          name: user.name,
          phone: user.phone,
          address: user.address,
          gender: user.gender,
          dob: dob ? dob.toISOString().split("T")[0] : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Show modal instead of alert
      setModalMessage("✅ Profile updated successfully!");
      setModalVisible(true);
    } catch (err) {
      console.error("❌ Error updating profile:", err.response?.data || err.message);
      alert("Failed to update profile");
    }
  };

  // format DD/MM/YYYY for display
  const formatDisplay = (d) => {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // handle <input type="date" /> changes
  const handleWebDateChange = (e) => {
    const val = e?.target?.value;
    if (!val) {
      setDob(null);
      return;
    }

    // ✅ Construct the date manually in local time (no timezone shift)
    const [year, month, day] = val.split("-");
    const newDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    // ✅ Adjust for your local timezone so it shows exactly the same date picked
    setDob(new Date(newDate.getTime() + newDate.getTimezoneOffset() * 60000));
  };

  if (!user) return <Text style={{ color: isDarkMode ? "#fff" : "#000", textAlign: "center" }}>Loading...</Text>;

  return (
  <View style={[styles.container]}>
    <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#111" }]}>Edit Profile</Text>

    {/* Full Name */}
    <TextInput
      style={[
        styles.input,
        { 
          color: isDarkMode ? "#fff" : "#000", 
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          borderColor: isDarkMode ? "#333" : "#ddd"
        },
      ]}
      value={user.name}
      onChangeText={(text) => setUser({ ...user, name: text })}
      placeholder="Full Name"
      placeholderTextColor={isDarkMode ? "#888" : "#888"}
    />

    {/* Phone Number */}
    <TextInput
      style={[
        styles.input,
        { 
          color: isDarkMode ? "#fff" : "#000", 
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          borderColor: isDarkMode ? "#333" : "#ddd"
        },
      ]}
      value={user.phone || ""}
      onChangeText={(text) => setUser({ ...user, phone: text })}
      placeholder="Phone Number"
      placeholderTextColor={isDarkMode ? "#888" : "#888"}
      keyboardType="phone-pad"
    />

    {/* Address */}
    <TextInput
      style={[
        styles.input,
        { 
          color: isDarkMode ? "#fff" : "#000", 
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          borderColor: isDarkMode ? "#333" : "#ddd"
        },
      ]}
      value={user.address || ""}
      onChangeText={(text) => setUser({ ...user, address: text })}
      placeholder="Address"
      placeholderTextColor={isDarkMode ? "#888" : "#888"}
    />

    {/* Gender Picker */}
    <View
      style={[
        styles.pickerWrapper,
        {
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          borderColor: isDarkMode ? "#333" : "#ddd",
        },
      ]}
    >
      <select
        value={user.gender || ""}
        onChange={(e) => setUser({ ...user, gender: e.target.value })}
        style={{
          width: "100%",
          height: 50,
          padding: "0 12px",
          background: isDarkMode ? "#1e1e1e" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
          borderWidth: 0,
          outline: "none",
          fontSize: 15,
          borderRadius: 6,
          appearance: "none",
        }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </View>

    {/* Date Picker - Web only */}
    <input
      type="date"
      value={dob ? dob.toISOString().split("T")[0] : ""}
      onChange={handleWebDateChange}
      style={{
        width: "100%",
        height: 50,
        marginTop: 8,
        marginBottom: 18,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
        background: isDarkMode ? "#1e1e1e" : "#fff",
        color: isDarkMode ? "#fff" : "#000",
        fontSize: 15,
        outline: "none",
      }}
    />

    {/* Buttons */}
    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
      <Text style={styles.saveButtonText}>💾 Save Profile</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
      <Text style={styles.cancelButtonText}>↩ Back</Text>
    </TouchableOpacity>

    {/* 🟢 Success Modal */}
    <Modal
      transparent
      animationType="fade"
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }]}>
          <Text style={[styles.modalMessage, { color: isDarkMode ? "#fff" : "#000" }]}>
            {modalMessage}
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setModalVisible(false);
              onBack(); // Return after confirming
            }}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 18,
    height: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#2563eb",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
    transition: "0.3s",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.3,
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
  /* 🟢 Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "30%",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    elevation: 10,
  },
  modalMessage: {
    fontSize: 17,
    textAlign: "center",
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});