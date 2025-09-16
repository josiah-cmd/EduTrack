import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import api from "../lib/axios";

export default function UserForm({ token }) {
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      console.log("✅ Users fetched:", res.data);
      setUsers(res.data);
    } catch (error) {
      console.error("❌ Error fetching users:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !role) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    try {
      const fullName = middleInitial
        ? `${firstName} ${middleInitial}. ${lastName}`
        : `${firstName} ${lastName}`;

      console.log("📤 Payload:", { name: fullName, role, email });

      const res = await api.post("/users", { name: fullName, role, email });

      console.log("✅ User created:", res.data);
      Alert.alert("Success", "User created successfully!");

      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setRole("");
      setEmail("");

      fetchUsers();
    } catch (error) {
      console.error("❌ Error creating user:", error.response?.data || error.message);

      const errorMsg =
        error.response?.data?.message ||
        JSON.stringify(error.response?.data?.errors) ||
        error.message ||
        "Failed to create user";

      Alert.alert("Error", errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create User</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Middle Initial (Optional)"
        value={middleInitial}
        onChangeText={setMiddleInitial}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Select Role</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={role}
          onValueChange={(value) => setRole(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Role" value="" />
          <Picker.Item label="Student" value="student" />
          <Picker.Item label="Teacher" value="teacher" />
          <Picker.Item label="Admin" value="admin" />
          <Picker.Item label="Staff" value="staff" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Create User</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});