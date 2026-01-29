/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHTML from "react-native-render-html";
import api from "../lib/axios";

export default function AnnouncementList({ token, isDarkMode }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  const fetchAnnouncements = async () => {
    try {
      const authToken = token || (await AsyncStorage.getItem("token"));
      if (!authToken) throw new Error("No token found");

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? "#808080" : "#ffffff",
              borderColor: isDarkMode ? "#333" : "#000000",
            },
          ]}
        >
          {item.content?.includes("<") ? (
            <RenderHTML
              contentWidth={width}
              source={{ html: item.content || "" }}
              baseStyle={{
                fontSize: 16,
                fontWeight: "500",
                marginBottom: 5,
                color: isDarkMode ? "#F7F7F7" : "#000000",
              }}
            />
          ) : (
            <Text
              style={[
                styles.content,
                { color: isDarkMode ? "#F7F7F7" : "#000000" },
              ]}
            >
              {item.content}
            </Text>
          )}

          <Text
            style={[
              styles.meta,
              { color: isDarkMode ? "#F7F7F7" : "#000000" },
            ]}
          >
            Posted by {item.user?.name || "Unknown"} •{" "}
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text
            style={{
              color: isDarkMode ? "#F7F7F7" : "#000000",
              fontWeight: "500",
            }}
          >
            No Announcements
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 30 }}
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
    backgroundColor: "#808080",
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
    fontWeight: "500",
  },
  meta: {
    fontSize: 12,
    color: "black",
    fontWeight: "500",
  },
});