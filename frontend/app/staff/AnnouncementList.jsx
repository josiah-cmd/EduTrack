import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html"; // ✅ NEW for CKEditor HTML
import api from "../lib/axios"; // ✅ use your axios instance

export default function AnnouncementList({ token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions(); // ✅ needed by RenderHTML

  const fetchAnnouncements = async () => {
    try {
      const authToken = token || (await AsyncStorage.getItem("token"));
      if (!authToken) throw new Error("No token found");

      // 🔑 Fetch announcements using axios instance
      const res = await api.get("/announcements");

      setAnnouncements(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {/* ✅ If content has HTML, render with RenderHTML, else fallback */}
          {item.content?.includes("<") ? (
            <RenderHTML
              contentWidth={width}
              source={{ html: item.content || ""}}
              baseStyle={styles.content}
            />
          ) : (
            <Text style={styles.content}>{item.content}</Text>
          )}
          <Text style={styles.meta}>
            Posted by {item.user?.name || "Unknown"} •{" "}
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: "gray" }}>No Announcements</Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 30 }} // ✅ prevents last card from being cut off
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  content: {
    fontSize: 16,
    color: "white",
    marginBottom: 5,
  },
  meta: {
    fontSize: 12,
    color: "gray",
  },
});