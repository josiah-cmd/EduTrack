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
      Alert.alert(
        "Login Failed",
        e.response?.data?.message || "Invalid username or password.",
        [{ text: "OK" }]
      );
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

      {/* 🏫 Academic Hero Header */}
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>Divine Word Academy of Dagupan</Text>
        <Text style={styles.heroSubtitle}>“Witness to the Word • Wisdom in Action”</Text>
      </View>

      <View style={styles.card}>
        {/* Decorative top corners */}
        <View style={styles.decorTopLeft} />
        <View style={styles.decorTopRight} />

        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/edutrack-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>EduTrack</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Learning Management System</Text>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <View style={[
          styles.inputGroup,
          errorMessage && { borderColor: 'red' }
        ]}>
          <Icon name="mail-outline" size={20} color="#006400" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Institutional Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={login}
          />
        </View>

        <View style={[
          styles.inputGroup,
          errorMessage && { borderColor: 'red' }
        ]}>
          <Icon name="lock-closed-outline" size={20} color="#006400" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={login}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#006400" />
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
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>“Learn. Lead. Inspire.”</Text>
        </View>

        <Text style={styles.footer}>
          © 2025 EduTrack • In partnership with Divine Word Academy of Dagupan
        </Text>

        {/* Decorative bottom corners */}
        <View style={styles.decorBottomLeft} />
        <View style={styles.decorBottomRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: '100vh',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: -1,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  heroLogo: {
    width: 70,
    height: 70,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fdfdfd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#f1f1f1',
    fontStyle: 'italic',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.9)', // Glass effect
    padding: 26,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#006400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#006400',
    textTransform: 'uppercase',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    marginVertical: 6,
    borderRadius: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#444',
    fontStyle: 'italic',
  },
  roleText: {
    marginTop: 4,
    fontSize: 12,
    color: '#006400',
    fontWeight: '600',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#006400',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  quoteContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#006400',
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  /* Decorative corners */
  decorTopLeft: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#006400',
    borderTopLeftRadius: 4,
  },
  decorTopRight: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFD700',
    borderTopRightRadius: 4,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFD700',
    borderBottomLeftRadius: 4,
  },
  decorBottomRight: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#006400',
    borderBottomRightRadius: 4,
  },
});