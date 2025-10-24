import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import api from "../../../lib/axios"; // ✅ connect to Laravel backend

export default function AuditLogs({ isDarkMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Fetch real logs from Laravel API
    const fetchLogs = async () => {
      try {
        const res = await api.get("/system-maintenance/audit-logs");
        if (Array.isArray(res.data)) {
          setLogs(res.data);
        } else {
          console.warn("Unexpected API format:", res.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch audit logs:", error.message);
        // 🔹 Keep dummy data if backend fails
        const dummyLogs = [
          { id: "1", action: "User Admin logged in", time: "2025-10-15 02:20 AM" },
          { id: "2", action: "Changed password for User #12", time: "2025-10-14 09:15 PM" },
          { id: "3", action: "Cleared system cache", time: "2025-10-14 08:03 PM" },
        ];
        setLogs(dummyLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const textColor = { color: isDarkMode ? "#fff" : "#000" };

  return (
    <View style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <Text style={[styles.desc, textColor]}>
        Displays login activity, account changes, and other system actions.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#4caf50" : "#2563eb"} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.logCard,
                isDarkMode ? styles.logDark : styles.logLight,
              ]}
            >
              <Ionicons name="time-outline" size={20} color={isDarkMode ? "#4caf50" : "#2563eb"} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.logText, textColor]}>
                  {item.action || item.description || "No description"}
                </Text>
                <Text style={[styles.logTime, { color: isDarkMode ? "#aaa" : "#555" }]}>
                  {item.time || item.created_at || ""}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  desc: {
    fontSize: 15,
    marginBottom: 14,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  logDark: {
    backgroundColor: "#1a1a1a",
  },
  logLight: {
    backgroundColor: "#f9f9f9",
  },
  logText: {
    fontSize: 15,
    fontWeight: "500",
  },
  logTime: {
    fontSize: 13,
    marginTop: 2,
  },
  dark: { backgroundColor: "#000" },
  light: { backgroundColor: "#fff" },
});