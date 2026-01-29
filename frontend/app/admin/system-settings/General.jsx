import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Import the three subcomponents
import AcademicSetupForm from "./general-settings/AcademicSetupForm";
import GradingSystemForm from "./general-settings/GradingSystemForm";
import SchoolInfoForm from "./general-settings/SchoolInfoForm";

export default function General({ isDarkMode }) {
  const [activeSection, setActiveSection] = useState(null); // Track which section is open

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  // Define the main setting sections
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
  ];

  // If a section is open, render its corresponding component
  if (activeSection === "school") {
    return <SchoolInfoForm isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "academic") {
    return <AcademicSetupForm isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "grading") {
    return <GradingSystemForm isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} />;
  }

  // Otherwise, render the General Settings overview
  return (
    <ScrollView>
      <Text style={[styles.title, textColor]}>General Settings</Text>

      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
          activeOpacity={0.7}
          onPress={() => setActiveSection(item.id)} // Switch content dynamically
        >
          <Ionicons name={item.icon} size={26} color={isDarkMode ? "#F7F7F7" : "#000000"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, textColor]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { color: isDarkMode ? "#F7F7F7" : "#555", fontWeight: "500" }]}>{item.desc}</Text>
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
    borderColor: "#333",
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