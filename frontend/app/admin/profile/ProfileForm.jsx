import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import api from "../../lib/axios";

export default function ProfileForm({ isDarkMode, onBack }) {
  const [user, setUser] = useState(null);
  const [dob, setDob] = useState(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

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

      await api.put(
        "/profile",
        {
          name: user.name,
          phone: user.phone,
          address: user.address,
          gender: user.gender,
          dob: dob ? dob.toISOString().split("T")[0] : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Profile updated successfully!");
      onBack(); // ✅ go back to ProfileHeader instead of router.push
    } catch (err) {
      console.error("❌ Error updating profile:", err.response?.data || err.message);
      alert("Failed to update profile");
    }
  };

  if (!user) return <Text style={{ color: isDarkMode ? "#fff" : "#000", textAlign: "center" }}>Loading...</Text>;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>Edit Profile</Text>

      <TextInput
        style={[styles.input, { color: isDarkMode ? "#fff" : "#000", backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0" }]}
        value={user.name}
        onChangeText={(text) => setUser({ ...user, name: text })}
        placeholder="Full Name"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={[styles.input, { color: isDarkMode ? "#fff" : "#000", backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0" }]}
        value={user.phone || ""}
        onChangeText={(text) => setUser({ ...user, phone: text })}
        placeholder="Phone Number"
        placeholderTextColor="#aaa"
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, { color: isDarkMode ? "#fff" : "#000", backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0" }]}
        value={user.address || ""}
        onChangeText={(text) => setUser({ ...user, address: text })}
        placeholder="Address"
        placeholderTextColor="#aaa"
      />

      {/* Gender Dropdown */}
      <TouchableOpacity
        style={[styles.dropdown, { backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0" }]}
        onPress={() => setShowGenderDropdown(!showGenderDropdown)}
      >
        <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>{user.gender || "Select Gender"}</Text>
      </TouchableOpacity>
      {showGenderDropdown && (
        <View style={styles.dropdownOptions}>
          {["Male", "Female"].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.option}
              onPress={() => {
                setUser({ ...user, gender: option });
                setShowGenderDropdown(false);
              }}
            >
              <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Date Picker */}
      <TouchableOpacity
        onPress={() => setDatePickerVisibility(true)}
        style={[styles.dropdown, { backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0" }]}
      >
        <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
          {dob ? dob.toDateString() : "Select Date of Birth"}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        maximumDate={new Date()}
        onConfirm={(date) => {
          setDob(date);
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {/* Buttons */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Save Profile</Text>
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
    padding: 20,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#1f1f1f",
    color: "#fff",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#1f1f1f",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  dropdownOptions: {
    backgroundColor: "#1f1f1f",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: { 
    marginTop: 10, 
    alignItems: "center" 
  },
  cancelButtonText: { 
    color: "#aaa", 
    fontSize: 14 
 },
});