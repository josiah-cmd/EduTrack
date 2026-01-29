/* eslint-disable */
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import RenderHTML from "react-native-render-html";
import api from "../../lib/axios";
import MessageDetail from "./MessageDetail";
import MessageForm from "./MessageForm";

export default function Messages({ isDarkMode }) {
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // 🔍 Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox"); // ✅ Added active tab
  const [sortOrder, setSortOrder] = useState("desc"); // ✅ Added sort order (newest/oldest)

  // 🔄 Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "#F7F7F7" : "#000000";
  const cardBg = isDarkMode ? "#1e1e1e" : "#f5f5f5";
  const buttonBg = isDarkMode ? "#808080" : "#1976d2";

  const contentWidth = Dimensions.get("window").width - 60;

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1, true);
  }, [activeTab, sortOrder]);

  // ✅ FIXED VERSION: prevents duplicates and double-fetching
  const fetchMessages = async (pageNumber = page, reset = false) => {
    if (loading) return; // prevent double calls
    if (!reset && !hasMore) return;

    setLoading(true);

    try {
      const endpoint = activeTab === "sent" ? "/messages/sent" : "/messages";
      const response = await api.get(endpoint, {
        params: { page: pageNumber, per_page: 10 }, // ✅ must match backend pagination
      });

      let data = response.data.data || response.data; // support Laravel resource or plain array
      const meta = response.data.meta || null;

      // ✅ Apply sort by created_at
      data = [...data].sort((a, b) => {
        if (sortOrder === "desc") {
          return new Date(b.created_at) - new Date(a.created_at);
        } else {
          return new Date(a.created_at) - new Date(b.created_at);
        }
      });

      // ✅ Prevent duplicate messages by ID and handle reset properly
      setMessages((prev) => {
        const combined = reset ? data : [...prev, ...data];
        const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());
        return unique;
      });

      if (meta) {
        setHasMore(meta.current_page < meta.last_page);
        setPage(meta.current_page + 1);
      } else {
        setHasMore(data.length > 0);
        setPage(pageNumber + 1);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Apply search + filter
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.body?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnread = filterUnread ? !msg.read_at : true;

    return matchesSearch && matchesUnread;
  });

  if (selectedMessage) {
    return (
      <MessageDetail
        message={selectedMessage}
        onBack={() => setSelectedMessage(null)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Messages</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        Inbox & compose new messages
      </Text>

      {/* ✅ New action rows */}
      <View style={styles.actionsRow}>
        {/* LEFT SIDE → Inbox, Sent, Compose */}
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: activeTab === "inbox" ? "#10b981" : buttonBg },
            ]}
            onPress={() => {
              setActiveTab("inbox");
              setShowForm(false);
              setSelectedMessage(null);
            }}
          >
            <Text style={styles.buttonText}>Inbox</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: activeTab === "sent" ? "#10b981" : buttonBg },
            ]}
            onPress={() => {
              setActiveTab("sent");
              setShowForm(false);
              setSelectedMessage(null);
            }}
          >
            <Text style={styles.buttonText}>Sent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeTab === "compose" ? "#10b981" : buttonBg }]}
            onPress={() => {
              setActiveTab("compose");
              setShowForm(true);
              setSelectedMessage(null);
            }}
          >
            <Text style={styles.buttonText}>Compose</Text>
          </TouchableOpacity>
        </View>

        {/* RIGHT SIDE → Search, Unread, Sort */}
        <View style={styles.rightActions}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: "#808080",
                borderColor: subTextColor,
                color: textColor,
              },
            ]}
            placeholder="Search messages..."
            placeholderTextColor={subTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filterUnread ? "#10b981" : buttonBg },
            ]}
            onPress={() => setFilterUnread((prev) => !prev)}
          >
            <Text style={styles.buttonText}>Unread</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: buttonBg }]}
            onPress={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
          >
            <Text style={styles.buttonText}>
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showForm ? (
        <MessageForm
          onSent={() => {
            setShowForm(false);
            setMessages([]); // ✅ clear first
            setPage(1);
            fetchMessages(1, true);
          }}
          isDarkMode={isDarkMode}
        />
      ) : (
        <FlatList
          style={styles.inbox}
          data={filteredMessages}
          keyExtractor={(msg) => msg.id.toString()}
          renderItem={({ item: msg }) => (
            <TouchableOpacity
              style={[styles.messageBox, { backgroundColor: cardBg }]}
              onPress={() => setSelectedMessage(msg)}
            >
              <Text style={[styles.subject, { color: textColor }]}>
                {msg.subject}
              </Text>
              <Text style={[styles.sender, { color: subTextColor }]}>
                From: {msg.sender?.name}
              </Text>

              <RenderHTML
                contentWidth={contentWidth}
                source={{
                  html:
                    msg.body && msg.body.length > 80
                      ? msg.body.substring(0, 80) + "..."
                      : msg.body,
                }}
                baseStyle={{ color: textColor, fontSize: 15, marginTop: 5 }}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.noMsg, { color: subTextColor }]}>
              No Messages
            </Text>
          }
          onEndReached={() => fetchMessages(page)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator size="small" color={subTextColor} style={{ margin: 10 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontWeight: "500"
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 5,
    minWidth: 100,
    width: 200,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  inbox: {
    marginTop: 10,
  },
  noMsg: {
    fontSize: 16,
    textAlign: "center",
  },
  messageBox: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  subject: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sender: {
    fontSize: 14,
  },
});