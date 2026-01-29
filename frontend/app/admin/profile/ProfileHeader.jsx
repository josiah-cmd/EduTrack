/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // ✅ added
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function ProfileHeader({ isDarkMode, onEdit }) {   // ✅ props destructure
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ Fetch profile data
  const fetchProfile = async () => {
    try {
      const role = await AsyncStorage.getItem("role");
      const token = await AsyncStorage.getItem(`${role}Token`);
      if (!token) return;

      const res = await api.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
    } catch (err) {
      console.error("❌ Error fetching profile:", err.response?.data || err.message);
    }
  };

  // ✅ Fetch once on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ Fetch again whenever screen is focused (after saving)
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
        <Text style={{ color: isDarkMode ? "#aaa" : "#333" }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={[styles.card, { backgroundColor: isDarkMode ? "#808080" : "#f9f9f9" }]}>
        <Image
          source={{ uri: user.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
          style={styles.avatar}
        />

        {/* ✅ All text + button grouped on the right side */}
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: isDarkMode ? "#fff" : "#000" }]}>{user.name}</Text>
          <Text style={[styles.role, { color: isDarkMode ? "#F7F7F7" : "#555" }]}>{user.role.toUpperCase()}</Text>

          <View style={styles.infoBox}>
            <Text style={[styles.info, { color: isDarkMode ? "#F7F7F7" : "#333" }]}>📞 {user.phone || "No phone"}</Text>
            <Text style={[styles.info, { color: isDarkMode ? "#F7F7F7" : "#333" }]}>🏠 {user.address || "No address"}</Text>
            <Text style={[styles.info, { color: isDarkMode ? "#F7F7F7" : "#333" }]}>⚧ {user.gender || "Not set"}</Text>
            <Text style={[styles.info, { color: isDarkMode ? "#F7F7F7" : "#333" }]}>🎂 {user.dob || "Not set"}</Text>
          </View>

          <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}   // ✅ works because prop is passed correctly
          >
              <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: "#10b981" }]} // green for distinction
            onPress={() => onEdit("changePassword")}
          >
            <Text style={styles.editButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    flexDirection: "row", // avatar on left, info on right
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    maxWidth: 700,
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: "#1f1f1f", // overridden by dark/light mode anyway
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 30,
    borderWidth: 3,
    borderColor: "#2563eb",
  },
  infoContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  infoBox: {
    marginBottom: 15,
  },
  info: {
    fontSize: 15,
    marginBottom: 6,
  },
  editButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});