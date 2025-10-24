import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios";

export default function AcademicSetupForm({ isDarkMode, onBack }) {
  const theme = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🟢 Fetch academic year
  useEffect(() => {
    const fetchYear = async () => {
      try {
        const res = await api.get("/settings/academic-year");
        setAcademicYear(res.data?.value || "");
      } catch {
        Alert.alert("Error", "Failed to load academic year");
      } finally {
        setLoading(false);
      }
    };
    fetchYear();
  }, []);

  // 🟢 Save
  const handleSave = async () => {
    if (!academicYear.trim()) return Alert.alert("Validation", "Please enter academic year.");
    setSaving(true);
    try {
      await api.post("/settings/academic-year", { academic_year: academicYear });
      Alert.alert("Success", "Academic year saved!");
    } catch {
      Alert.alert("Error", "Failed to save setup");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} size="large" color="#4caf50" />;

  return (
    <ScrollView style={[styles.container, theme]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-outline" size={22} color={textColor.color} />
        <Text style={[styles.backText, textColor]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, textColor]}>Academic Year & Semester Setup</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Academic Year</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={academicYear}
          onChangeText={setAcademicYear}
          placeholder="e.g. 2025–2026"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Start Date</Text>
        <TextInput style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} placeholder="YYYY-MM-DD" placeholderTextColor="#888" />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>End Date</Text>
        <TextInput style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} placeholder="YYYY-MM-DD" placeholderTextColor="#888" />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save Setup"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  dark: { 
    backgroundColor: "#000" 
  },
  light: { 
    backgroundColor: "#fff" 
  },
  backBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15 
  },
  backText: { 
    marginLeft: 5, 
    fontSize: 16 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 20 
  },
  formGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 6 
  },
  input: { 
    borderRadius: 8, 
    padding: 10, 
    fontSize: 15 
  },
  inputDark: { 
    backgroundColor: "#1a1a1a", 
    color: "#fff" 
  },
  inputLight: { 
    backgroundColor: "#f5f5f5", 
    color: "#000" 
  },
  saveBtn: { 
    backgroundColor: "#4caf50", 
    padding: 14, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 10 
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
});