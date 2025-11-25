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
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const login = async () => {
    setLoading(true);
    setErrorMessage("");
    try { 
      const res = await api.post("/login", { email, password });
      console.log("Login response:", res.data);

      const user = res.data?.user;
      const token = res.data?.token;

      if (!user || !token) throw new Error("Invalid login response.");

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", user.role);
      await AsyncStorage.setItem(`${user.role}Token`, token);

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
      {/* ===== Left Section with DWAD & SVD Logos ===== */}
      <View style={styles.leftSection}>
        <View style={styles.leftContent}>
          <View style={styles.logoRow}>
            <Image
              source={require('../assets/dwad-logo.png')}
              style={styles.leftLogo}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/svd-logo.png')}
              style={styles.leftLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.schoolName}>DIVINE WORD ACADEMY OF DAGUPAN</Text>
          <Text style={styles.schoolMotto}>“Witness to the Word • Wisdom in Action”</Text>

          {/* ===== Updated Footer Info (single-line with space) ===== */}
          <View style={styles.leftFooter}>
            <Text style={styles.leftFooterText}>facebook.com/DWADOfficialFBPage Rizal Extension, Dagupan City</Text>
          </View>
        </View>
      </View>

      {/* ===== Right Section (Login Card) ===== */}
      <View style={styles.rightSection}>
        <View style={styles.card}>
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

          <View style={[styles.inputGroup, errorMessage && { borderColor: 'red' }]}>
            <Icon name="mail-outline" size={20} color="#004d40" style={styles.icon} />
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

          <View style={[styles.inputGroup, errorMessage && { borderColor: 'red' }]}>
            <Icon name="lock-closed-outline" size={20} color="#004d40" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={login}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#004d40" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.5 }]}
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

          {/* Decorative Corners */}
          <View style={styles.decorBottomLeft} />
          <View style={styles.decorBottomRight} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ========================== LAYOUT ========================== */
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E5E9DD',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  leftSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  leftContent: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginBottom: 18,
  },
  leftLogo: {
    width: 100,
    height: 100,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E3B32',
    textAlign: 'center',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  schoolMotto: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },

  /* ===== Left Footer (Updated to Side-by-Side Layout) ===== */
  leftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#004d40',
    paddingTop: 12,
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  leftFooterText: {
    fontSize: 15,
    color: '#0E3B32',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  /* ========================== CARD ========================== */
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.98)',
    padding: 28,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#004d40',
    boxShadow: '0px 6px 8px rgba(0,0,0,0.15)',
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
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#004d40',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    marginVertical: 8,
    borderRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
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
    marginRight: 8 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333' 
  },
  button: {
    backgroundColor: '#004d40',
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
    color: '#004d40',
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

  /* ========================== DECORATIVE CORNERS ========================== */
  decorTopLeft: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#004d40',
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
    borderColor: '#004d40',
    borderBottomRightRadius: 4,
  },
});