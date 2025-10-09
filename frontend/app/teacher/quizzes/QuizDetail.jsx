import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function QuizDetail({ quiz, isDarkMode, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/quiz/${quiz.id}/results`);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching quiz results:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [quiz.id]);

  return (
    <View style={styles.wrapper}>
      {/* Quiz Info Box */}
      <View
        style={[
          styles.containerBox,
          {
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
            borderColor: isDarkMode ? "#006400" : "#007b55",
            borderWidth: 1,
            shadowColor: isDarkMode ? "#006400" : "#333",
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: isDarkMode ? "#FFD700" : "#007bff" }]}>⬅ Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: isDarkMode ? "#FFD700" : "#000" }]}>{quiz.title}</Text>
        <Text style={[styles.desc, { color: isDarkMode ? "#fff" : "#555" }]}>{quiz.instructions || "No description available."}</Text>

        <Text style={[styles.meta, { color: isDarkMode ? "#bbb" : "#444" }]}>
          🕒 Schedule: {quiz.start_time} → {quiz.end_time}
        </Text>
        <Text style={[styles.meta, { color: isDarkMode ? "#bbb" : "#444" }]}>
          ⏱ Duration: {quiz.duration} mins | Passing Score: {quiz.passing_score} | Total: {quiz.total_points}
        </Text>
      </View>

      {/* Student Submissions */}
      <View
        style={[
          styles.submissionsBox,
          {
            backgroundColor: isDarkMode ? "#111" : "#fff",
            borderColor: isDarkMode ? "#006400" : "#ddd",
            borderWidth: 1,
            shadowColor: isDarkMode ? "#006400" : "#000",
          },
        ]}
      >
        <Text style={[styles.subHeader, { color: isDarkMode ? "#FFD700" : "#000" }]}>📑 Student Results</Text>

        {loading ? (
          <Text style={[styles.noSubmissions, { color: isDarkMode ? "#aaa" : "#666" }]}>Loading...</Text>
        ) : submissions.length === 0 ? (
          <Text style={[styles.noSubmissions, { color: isDarkMode ? "#aaa" : "#666" }]}>No students have taken this quiz yet.</Text>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.submissionCard,
                  {
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
                    borderColor: isDarkMode ? "#006400" : "#ddd",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.studentName, { color: isDarkMode ? "#FFD700" : "#000" }]}>
                  👤 {item.student_name || "Unknown Student"}
                </Text>
                <Text style={[styles.score, { color: isDarkMode ? "#32CD32" : "#007bff" }]}>
                  🏆 Score: {item.score ?? "N/A"}
                </Text>
                <Text style={[styles.date, { color: isDarkMode ? "#ccc" : "#777" }]}>
                  🕒 {item.submitted_at ? format(new Date(item.submitted_at), "MMM dd, yyyy h:mm a") : "Not available"}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 16,
  },
  containerBox: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    marginBottom: 4,
  },
  submissionsBox: {
    borderRadius: 10,
    padding: 16,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  noSubmissions: {
    textAlign: "center",
    fontSize: 15,
  },
  submissionCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  score: {
    fontSize: 15,
    marginVertical: 4,
  },
  date: {
    fontSize: 13,
  },
});