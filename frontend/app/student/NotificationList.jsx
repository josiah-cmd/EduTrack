/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";

const stripHtml = (html) => {
  if (!html) return "No content";
  const text = html.replace(/<\/?[^>]+(>|$)/g, "").trim();
  return text.length > 0 ? text : "No content";
};

export default function NotificationList({ onOpenMaterial, onOpenMessages, onOpenAnnouncements, onOpenQuiz }) {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const role = await AsyncStorage.getItem("role");
        const token = await AsyncStorage.getItem(`${role}Token`);
        if (!token) {
          console.warn("⚠️ No auth token found. Notifications cannot load.");
          return;
        }

        const res = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setNotifications(data);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err.response?.data || err.message);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification) => {
    console.log("Clicked notification:", notification);

    if (notification.material_id) {
      if (onOpenMaterial) {
        onOpenMaterial({
          id: notification.material_id,
          type: notification.type,
          section_id: notification.section_id || null,
        });
      }
    }
    // 🟣 FIXED — quiz open now works with both section_id and room_id
    else if (notification.type === "quiz") {
      if (onOpenQuiz) {
        onOpenQuiz({
          type: "quiz",
          section_id: notification.section_id || null,
          room_id: notification.room_id || null,
          title: notification.title,
        });
      }
    }
    else if (notification.type === "message") {
      if (onOpenMessages) {
        onOpenMessages();
      }
    }
    else if (notification.type === "announcement") {
      if (onOpenAnnouncements) {
        onOpenAnnouncements();
      }
    }
    else {
      setSelectedNotification(notification);
    }
  };

  if (selectedNotification) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedNotification(null)} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          [{selectedNotification?.type?.toUpperCase()}] {selectedNotification?.title || "No title"}
        </Text>
        <Text style={styles.content}>
          {selectedNotification?.type === "message"
            ? `A new message from ${selectedNotification?.sender_name || "Unknown"}`
            : selectedNotification?.type === "announcement"
              ? `A new announcement from ${selectedNotification?.sender_name || "Unknown"}`
              : selectedNotification?.type === "quiz"
                ? "A new quiz has been published for your class"
                : stripHtml(selectedNotification?.content) || "No content"}
        </Text>
        <Text style={styles.date}>
          {selectedNotification?.created_at
            ? format(new Date(selectedNotification.created_at), "MMM dd, yyyy h:mm a")
            : ""}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <ScrollView>
        {notifications.length > 0 ? (
          notifications.map((n, index) => (
            <TouchableOpacity
              key={n.id || index}
              style={[styles.card, !n.read_at && styles.unread]}
              onPress={() => handleNotificationClick(n)}
            >
              <Text style={styles.text}>
                [{n?.type?.toUpperCase()}] {n?.title || "No title"}
              </Text>
              <Text style={styles.content}>
                {n?.type === "message"
                  ? `A new message from ${n?.sender_name || "Unknown"}`
                  : n?.type === "announcement"
                    ? `A new announcement from ${n?.sender_name || "Unknown"}`
                    : n?.type === "quiz"
                      ? "A new quiz has been published for your class"
                      : stripHtml(n?.content) || "No content"}
              </Text>
              <Text style={styles.date}>
                {n?.created_at
                  ? format(new Date(n.created_at), "MMM dd, yyyy h:mm a")
                  : ""}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.empty}>No notifications found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#fff",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
  content: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  empty: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: "#007bff",
    fontSize: 16,
  },
});