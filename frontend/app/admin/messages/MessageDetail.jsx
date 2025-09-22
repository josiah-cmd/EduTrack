import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RenderHTML from "react-native-render-html";

export default function MessageDetail({ message, onBack, isDarkMode }) {
  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "#cccccc" : "#555555";
  const cardBg = isDarkMode ? "#1e1e1e" : "#f9f9f9";

  // ✅ Get device width for proper rendering
  const contentWidth = Dimensions.get("window").width - 40;

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: isDarkMode ? "#60a5fa" : "#2563eb" }]}>
          ← Back to Inbox
        </Text>
      </TouchableOpacity>

      {/* Subject */}
      <Text style={[styles.subject, { color: textColor }]}>
        {message.subject}
      </Text>

      {/* Sender + Timestamp */}
      <Text style={[styles.meta, { color: subTextColor }]}>
        From: {message.sender?.name} ({message.sender?.email}) •{" "}
        {new Date(message.created_at).toLocaleString()}
      </Text>

      {/* Recipient */}
      <Text style={[styles.meta, { color: subTextColor }]}>
        To: {message.recipient?.name
              ? `${message.recipient?.name} (${message.recipient?.email})`
              : message.recipient?.email}
      </Text>

      {/* Full message content */}
      <RenderHTML
        contentWidth={contentWidth}
        source={{ html: message.body || "" }}
        baseStyle={{ color: textColor, fontSize: 16, lineHeight: 22 }}
        tagsStyles={{
          p: { color: textColor },
          li: { color: textColor },
          span: { color: textColor },
          strong: { color: textColor },
          em: { color: textColor },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
  },
  backButton: {
    marginBottom: 15,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  subject: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    marginBottom: 20,
  },
});