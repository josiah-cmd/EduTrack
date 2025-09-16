import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from './lib/axios';

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      console.log("Login response:", res.data);

      const user = res.data?.user;
      const token = res.data?.token;

      if (!user || !token) throw new Error("Invalid login response.");

      // ✅ Always save universal token
      await AsyncStorage.setItem("token", token);

      // ✅ Store role + role-based token
      await AsyncStorage.setItem("role", user.role);
      await AsyncStorage.setItem(`${user.role}Token`, token);

      // ✅ Route by role
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "teacher":
          router.push("/teacher");
          break;
        case "staff":
          router.push("/staff");
          break;
        case "student":
          router.push("/student");
          break;
        default:
          console.error("Unknown role:", user.role);
      }
    } catch (e) {
      console.error("Login error:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/edutrack-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>EduTrack</Text>
          <Text style={styles.subtitle}>Learning Management System</Text>
        </View>

        <View style={styles.inputGroup}>
          <Icon name="mail-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={login}
          />
        </View>

        <View style={styles.inputGroup}>
          <Icon name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={login}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.2 }]}
          onPress={login}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>© 2025 EDUTRACK. All Rights Reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: '100vh',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // ✅ Web shadow
    elevation: 6,

    // ✅ Native shadow (for consistency if needed)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
  },
});