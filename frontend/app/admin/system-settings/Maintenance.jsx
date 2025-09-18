import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Maintenance({ isDarkMode }) {
  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const sections = [
    {
      id: "backup",
      title: "Backup & Restore",
      desc: "Database + files backup, restore option.",
      icon: "cloud-upload-outline",
    },
    {
      id: "cache",
      title: "Clear Cache / Reset Temporary Data",
      desc: "Keep the system fast and clean.",
      icon: "trash-outline",
    },
    {
      id: "audit",
      title: "Audit Logs",
      desc: "View login history, account changes, activity trail.",
      icon: "list-outline",
    },
    {
      id: "errors",
      title: "Error Logs Viewer",
      desc: "Check system errors for debugging.",
      icon: "bug-outline",
    },
    {
      id: "update",
      title: "Update / Version Info",
      desc: "Show current EduTrack version, apply updates.",
      icon: "refresh-circle-outline",
    },
    {
      id: "import",
      title: "Data Import/Export",
      desc: "Bulk upload (CSV/Excel) for users, subjects, grades.",
      icon: "download-outline",
    },
  ];

  return (
    <ScrollView style={[styles.container, themeStyles]}>
      <Text style={[styles.title, textColor]}>System Maintenance</Text>

      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          activeOpacity={0.7}
          onPress={() => console.log(`${item.title} clicked`)} // 🔹 future: modal/form
        >
          <Ionicons name={item.icon} size={26} color={isDarkMode ? "#4caf50" : "#2563eb"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, textColor]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { color: isDarkMode ? "#aaa" : "#555" }]}>
              {item.desc}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={22} color={isDarkMode ? "#aaa" : "#555"} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  dark: {
    backgroundColor: "#000",
  },
  light: {
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    gap: 12,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333",
  },
  cardLight: {
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 14,
    marginTop: 2,
  },
});