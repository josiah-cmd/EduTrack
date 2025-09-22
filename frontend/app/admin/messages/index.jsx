import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RenderHTML from "react-native-render-html";
import api from "../../lib/axios";
import MessageDetail from "./MessageDetail";
import MessageForm from "./MessageForm";

export default function Messages({ isDarkMode }) {
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "#cccccc" : "#555555";
  const cardBg = isDarkMode ? "#1e1e1e" : "#f5f5f5";
  const buttonBg = isDarkMode ? "#007bff" : "#1976d2";

  const contentWidth = Dimensions.get("window").width - 60;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get("/messages/inbox");
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonBg }]}
          onPress={() => {
            setShowForm(false);
            setSelectedMessage(null);
          }}
        >
          <Text style={styles.buttonText}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonBg }]}
          onPress={() => {
            setShowForm(true);
            setSelectedMessage(null);
          }}
        >
          <Text style={styles.buttonText}>Compose</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <MessageForm
          onSent={() => {
            setShowForm(false);
            fetchMessages();
          }}
          isDarkMode={isDarkMode}
        />
      ) : (
        <ScrollView style={styles.inbox}>
          {messages.length === 0 ? (
            <Text style={[styles.noMsg, { color: subTextColor }]}>
              No Messages
            </Text>
          ) : (
            messages.map((msg) => (
              <TouchableOpacity
                key={msg.id}
                style={[styles.messageBox, { backgroundColor: cardBg }]}
                onPress={() => setSelectedMessage(msg)}
              >
                <Text style={[styles.subject, { color: textColor }]}>
                  {msg.subject}
                </Text>
                <Text style={[styles.sender, { color: subTextColor }]}>
                  From: {msg.sender?.name}
                </Text>

                {/* ✅ Render HTML preview (safe) */}
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
            ))
          )}
        </ScrollView>
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
  actions: {
    flexDirection: "row",
    marginBottom: 15,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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