import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import api from "../../../lib/axios"; // ✅ connect to Laravel backend

export default function AuditLogs({ isDarkMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseLaravelDate = (dateString) => {
    if (!dateString) return null;

    // If already ISO (from backend fix), parse directly
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }

    // Legacy Laravel format: "YYYY-MM-DD HH:mm:ss"
    const isoString = dateString.replace(" ", "T") + "Z";
    const date = new Date(isoString);

    return isNaN(date.getTime()) ? null : date;
  };

  const getRelativeTime = (dateString) => {
    const date = parseLaravelDate(dateString);
    if (!date) return "";

    const now = new Date();
    const diffMs = now - date;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "Asia/Manila",
    });
  };

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
    <View>
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
                  {item.created_at
                    ? getRelativeTime(item.created_at)
                    : item.time}
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