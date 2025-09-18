import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Security({ isDarkMode }) {
  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const sections = [
    {
      id: "auth",
      title: "Authentication Settings",
      desc: "Password rules, session timeout, login attempt limits.",
      icon: "key-outline",
    },
    {
      id: "lock",
      title: "Account Lock/Unlock",
      desc: "Manually control user access and unlock accounts.",
      icon: "lock-closed-outline",
    },
    {
      id: "2fa",
      title: "Two-Factor Authentication",
      desc: "Add an optional extra layer of login security.",
      icon: "shield-checkmark-outline",
    },
  ];

  return (
    <ScrollView style={[styles.container, themeStyles]}>
      <Text style={[styles.title, textColor]}>Security & Access</Text>

      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          activeOpacity={0.7}
          onPress={() => console.log(`${item.title} clicked`)} // 🔹 future modal
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