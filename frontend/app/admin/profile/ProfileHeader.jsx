import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function ProfileHeader({ isDarkMode, onEdit }) {   // ✅ FIXED props destructure
  const [user, setUser] = useState(null);
  const router = useRouter();

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
      } catch (err) {
        console.error("❌ Error fetching profile:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
        <Text style={{ color: isDarkMode ? "#aaa" : "#333" }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
      <View style={[styles.card, { backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9" }]}>
        <Image
          source={{ uri: user.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: isDarkMode ? "#fff" : "#000" }]}>{user.name}</Text>
        <Text style={[styles.role, { color: isDarkMode ? "#aaa" : "#555" }]}>{user.role.toUpperCase()}</Text>

        <View style={styles.infoBox}>
          <Text style={[styles.info, { color: isDarkMode ? "#ddd" : "#333" }]}>📞 {user.phone || "No phone"}</Text>
          <Text style={[styles.info, { color: isDarkMode ? "#ddd" : "#333" }]}>🏠 {user.address || "No address"}</Text>
          <Text style={[styles.info, { color: isDarkMode ? "#ddd" : "#333" }]}>⚧ {user.gender || "Not set"}</Text>
          <Text style={[styles.info, { color: isDarkMode ? "#ddd" : "#333" }]}>🎂 {user.dob || "Not set"}</Text>
        </View>

        <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}   // ✅ now works, because prop is passed correctly
        >
            <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    marginBottom: 15,
  },
  infoBox: {
    marginVertical: 15,
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
  },
  info: {
    fontSize: 15,
    marginBottom: 8,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});