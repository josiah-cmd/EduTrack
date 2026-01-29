import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🔹 Import subcomponents
import AuditLogs from "./system-maintenance/AuditLogs";
import BackupRestore from "./system-maintenance/BackupRestore";
import ClearCache from "./system-maintenance/ClearCache";
import DataImportExport from "./system-maintenance/DataImportExport";

export default function Maintenance({ isDarkMode }) {
  const [activeSection, setActiveSection] = useState(null);

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  // 🔹 Each section entry
  const sections = [
    {
      id: "backup",
      title: "Backup & Restore",
      desc: "Database + files backup, restore option.",
      icon: "cloud-upload-outline",
      component: <BackupRestore isDarkMode={isDarkMode} />,
    },
    {
      id: "cache",
      title: "Clear Cache / Reset Temporary Data",
      desc: "Keep the system fast and clean.",
      icon: "trash-outline",
      component: <ClearCache isDarkMode={isDarkMode} />,
    },
    {
      id: "audit",
      title: "Audit Logs",
      desc: "View login history, account changes, activity trail.",
      icon: "list-outline",
      component: <AuditLogs isDarkMode={isDarkMode} />,
    },
    {
      id: "import",
      title: "Data Import/Export",
      desc: "Bulk upload (CSV/Excel) for users, subjects, grades.",
      icon: "download-outline",
      component: <DataImportExport isDarkMode={isDarkMode} />,
    },
  ];

  // 🔹 If a section is active, show its subcomponent
  if (activeSection) {
    const section = sections.find((s) => s.id === activeSection);

    return (
      <View>
        {/* Back button + title */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setActiveSection(null)}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={[styles.backText, textColor]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, textColor]}>{section.title}</Text>
        </View>

        {/* Subcomponent */}
        <ScrollView>{section.component}</ScrollView>
      </View>
    );
  }

  // 🔹 Otherwise, show the main list
  return (
    <ScrollView>
      <Text style={[styles.title, textColor]}>System Maintenance</Text>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
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