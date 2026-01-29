import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ✅ Correct imports
import AccountLockUnlock from "./security-settings/AccountLockUnlock";
import AuthenticationSettings from "./security-settings/AuthenticationSettings";

export default function Security({ isDarkMode }) {
  const [activeSection, setActiveSection] = useState(null);

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const sections = [
    {
      id: "auth",
      title: "Authentication Settings",
      desc: "Password rules, session timeout, login attempt limits.",
      icon: "key-outline",
      component: <AuthenticationSettings isDarkMode={isDarkMode} />,
    },
    {
      id: "lock",
      title: "Account Lock/Unlock",
      desc: "Manually control user access and unlock accounts.",
      icon: "lock-closed-outline",
      component: <AccountLockUnlock isDarkMode={isDarkMode} />,
    },
  ];

  if (activeSection) {
    const selected = sections.find((s) => s.id === activeSection);
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => setActiveSection(null)}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={isDarkMode ? "#4caf50" : "#2563eb"}
          />
          <Text style={[{ marginLeft: 8, fontSize: 16, fontWeight: "600" }, textColor]}>
            Back
          </Text>
        </TouchableOpacity>
        {selected.component}
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <Text style={[styles.title, textColor]}>Security & Access</Text>

      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          activeOpacity={0.7}
          onPress={() => setActiveSection(item.id)}
        >
          <Ionicons name={item.icon} size={26} color={isDarkMode ? "#F7F7F7" : "#000000"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, textColor]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { color: isDarkMode ? "#F7F7F7" : "#555", fontWeight: "500" }]}>
              {item.desc}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={22} color={isDarkMode ? "#000000" : "#000000"} />
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
    backgroundColor: "#808080",
    borderColor: "#000000",
  },
  cardLight: {
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  cardDesc: {
    fontSize: 14,
    marginTop: 2,
  },
});