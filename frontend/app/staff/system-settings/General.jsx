import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function General({ isDarkMode }) {
  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const sections = [
    {
      id: "school",
      title: "School Information",
      desc: "Manage name, logo, address, and contact details.",
      icon: "school-outline",
    },
    {
      id: "academic",
      title: "Academic Year & Semester Setup",
      desc: "Define start/end dates, terms, and grading periods.",
      icon: "calendar-outline",
    },
    {
      id: "grading",
      title: "Grading System",
      desc: "Customize grading scale (percentages, letters, pass/fail).",
      icon: "bar-chart-outline",
    },
    {
      id: "theme",
      title: "Theme & Branding",
      desc: "Toggle light/dark, set school colors, favicon/logo.",
      icon: "color-palette-outline",
    },
    {
      id: "notifications",
      title: "Notification Settings",
      desc: "Enable or disable email, SMS, and in-app notifications.",
      icon: "notifications-outline",
    },
  ];

  return (
    <ScrollView style={[styles.container, themeStyles]}>
      <Text style={[styles.title, textColor]}>General Settings</Text>

      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          activeOpacity={0.7}
          onPress={() => console.log(`${item.title} clicked`)} // later: navigate or open modal
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