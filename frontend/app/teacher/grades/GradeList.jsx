import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import api from "../../lib/axios";

export default function GradeList({ isDarkMode, onSelectRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = isDarkMode ? styles.dark : styles.light;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get("/teacher/rooms");
        setRooms(response.data || []);
      } catch (error) {
        console.error("❌ Error fetching teacher rooms:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const subjectIcons = {
    Math: "calculator-outline",
    Science: "flask-outline",
    English: "book-outline",
  };

  const subjectColors = {
    Math: "#3b82f6",
    Science: "#10b981",
    English: "#f59e0b",
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerAccent,{ backgroundColor: isDarkMode ? "#41ab5d" : "#41ab5d" }]}/>
        <Text style={[styles.header, { color: isDarkMode ? "#fff" : "#111827" }]}>
          Grade Records
        </Text>
      </View>

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 30 }} />
      ) : rooms.length === 0 ? (
        <Text
          style={{
            color: isDarkMode ? "#9ca3af" : "#6b7280",
            textAlign: "center",
            marginTop: 40,
            fontSize: 16,
          }}
        >
          No rooms found for this teacher.
        </Text>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const subjectName =
              item.subject?.name || item.subject_name || "Unknown Subject";
            const sectionName =
              item.section?.name || item.section_name || "Unknown Section";

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectRoom(item)}
              >
                <View style={[styles.card,{ backgroundColor: isDarkMode ? "#2a2a2a" : "#fff" },]}>
                  <View style={styles.subjectInfo}>
                    <Ionicons
                      name={subjectIcons[subjectName] || "school-outline"}
                      size={24}
                      color={subjectColors[subjectName] || "#41ab5d"}
                      style={styles.icon}
                    />
                    <View>
                      <Text style={[styles.subject,{ color: isDarkMode ? "#f3f4f6" : "#111827" },]}>
                        {subjectName}
                      </Text>
                      <Text style={[styles.section, { color: isDarkMode ? "#9ca3af" : "#6b7280" },]}>
                        Section: {sectionName}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  headerAccent: {
    width: 5,
    height: 26,
    borderRadius: 2,
    marginRight: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
  },

  // Cards
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  subject: {
    fontSize: 17,
    fontWeight: "600",
  },
  section: {
    fontSize: 13,
  },

  light: { 
    backgroundColor: "#f9fafb" 
  },
  dark: { 
    backgroundColor: "#18181b" 
  },
});