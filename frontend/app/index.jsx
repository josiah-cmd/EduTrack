import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from './lib/axios';

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✅ inline error message
  const router = useRouter();

  const login = async () => {
    setLoading(true);
    setErrorMessage(""); // clear old error
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

      // ✅ Show popup alert
      Alert.alert(
        "Login Failed",
        e.response?.data?.message || "Invalid username or password.",
        [{ text: "OK" }]
      );

      // ✅ Inline error message
      setErrorMessage(e.response?.data?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ===== background image ===== */}
      <Image
        source={require('../assets/dwad-image.png')}
        style={styles.bgImage}
        resizeMode="cover"
        accessibilityLabel="background-image"
      />
      {/* ===== dark overlay ===== */}
      <View style={styles.overlay} />
      {/* ============================================================== */}

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

        {/* ✅ Inline error message */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <View style={[
          styles.inputGroup,
          errorMessage && { borderColor: 'red' } // ✅ turn border red if error
        ]}>
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

        <View style={[
          styles.inputGroup,
          errorMessage && { borderColor: 'red' } // ✅ turn border red if error
        ]}>
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
    /* ===== CHANGED: make container transparent so bg image shows through ===== */
    backgroundColor: 'transparent', // <-- was '#f9fafb' before (changed)
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: '100vh',
  },
  /* ===== ADDED: style for the bg image ===== */
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },
  /* ===== ADDED: dark overlay ===== */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)', // semi-transparent black
    zIndex: -1,
  },
  /* ====================================================================== */
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    /* ✅ DWAD theme border */
    borderWidth: 2,
    borderColor: '#006400',
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
    color: '#006400', // ✅ DWAD green
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
    backgroundColor: '#fff', // ✅ keep white for clarity
  },
  icon: {
    marginRight: 8,
    color: '#006400', // ✅ green icons
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#006400', // ✅ DWAD green
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  buttonText: {
    color: '#FFD700', // ✅ gold text
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  footer: {
    textAlign: 'center',
    color: '#006400', // ✅ green footer
    fontSize: 13,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});