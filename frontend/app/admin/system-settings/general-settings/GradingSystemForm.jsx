import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../../lib/axios";

export default function GradingSystemForm({ isDarkMode, onBack }) {
  const theme = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const [form, setForm] = useState({
    passing_grade: "",
    excellent_range: "",
    good_range: "",
    needs_improvement_range: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🟢 Fetch grading system
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/settings/grading-system");
        const data = {};
        res.data.forEach((item) => {
          data[item.key] = item.value;
        });
        setForm({
          passing_grade: data.passing_grade || "",
          excellent_range: data.excellent_range || "",
          good_range: data.good_range || "",
          needs_improvement_range: data.needs_improvement_range || "",
        });
      } catch {
        Alert.alert("Error", "Failed to load grading system");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🟢 Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/settings/grading-system", form);
      Alert.alert("Success", "Grading system updated!");
    } catch {
      Alert.alert("Error", "Failed to save grading rules");
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

      <Text style={[styles.title, textColor]}>Grading System</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Passing Grade (%)</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.passing_grade}
          onChangeText={(v) => setForm({ ...form, passing_grade: v })}
          placeholder="e.g. 75"
          keyboardType="numeric"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Excellent Range</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.excellent_range}
          onChangeText={(v) => setForm({ ...form, excellent_range: v })}
          placeholder="e.g. 90–100"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Good Range</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.good_range}
          onChangeText={(v) => setForm({ ...form, good_range: v })}
          placeholder="e.g. 80–89"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Needs Improvement Range</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.needs_improvement_range}
          onChangeText={(v) => setForm({ ...form, needs_improvement_range: v })}
          placeholder="e.g. below 80"
          placeholderTextColor="#888"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save Grading Rules"}</Text>
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