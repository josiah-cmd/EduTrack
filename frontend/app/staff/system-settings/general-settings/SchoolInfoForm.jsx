import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../..//lib/axios";

export default function SchoolInfoForm({ isDarkMode, onBack }) {
  const theme = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  const [form, setForm] = useState({
    school_name: "",
    school_address: "",
    school_logo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🟢 Fetch school info on mount
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get("/settings/school-info");
        const data = {};
        res.data.forEach((item) => {
          data[item.key] = item.value;
        });
        setForm({
          school_name: data.school_name || "",
          school_address: data.school_address || "",
          school_logo: data.school_logo || "",
        });
      } catch (err) {
        Alert.alert("Error", "Failed to load school info");
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  // 🟢 Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/settings/school-info", form);
      Alert.alert("Success", "School information updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} size="large" color="#4caf50" />;

  return (
    <ScrollView style={[styles.container, theme]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-outline" size={22} color={textColor.color} />
        <Text style={[styles.backText, textColor]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, textColor]}>School Information</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>School Name</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.school_name}
          onChangeText={(v) => setForm({ ...form, school_name: v })}
          placeholder="Enter school name"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>Address</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.school_address}
          onChangeText={(v) => setForm({ ...form, school_address: v })}
          placeholder="Enter address"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, textColor]}>School Logo (URL)</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
          value={form.school_logo}
          onChangeText={(v) => setForm({ ...form, school_logo: v })}
          placeholder="Enter logo URL"
          placeholderTextColor="#888"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
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