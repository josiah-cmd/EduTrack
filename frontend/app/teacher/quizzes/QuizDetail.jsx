/* eslint-disable */
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function QuizDetail({ quiz, isDarkMode, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      // ✅ FIXED: ensure correct endpoint path & working backend route
      const res = await api.get(`/quizzes/${quiz.id}/attempts`);
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
            backgroundColor: isDarkMode ? "#808080" : "#fff",
            borderColor: isDarkMode ? "#000000" : "#007b55",
            borderWidth: 1,
            shadowColor: isDarkMode ? "#006400" : "#333",
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>⬅ Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: isDarkMode ? "#F7F7F7" : "#000" }]}>{quiz.title}</Text>
        <Text style={[styles.desc, { color: isDarkMode ? "#fff" : "#555" }]}>
          {quiz.instructions || "No description available."}
        </Text>

        <Text style={[styles.meta, { color: isDarkMode ? "#F7F7F7" : "#444", fontWeight: "500",}]}>
          🕒 Schedule: {quiz.start_time} → {quiz.end_time}
        </Text>
        <Text style={[styles.meta, { color: isDarkMode ? "#F7F7F7" : "#444", fontWeight: "500", }]}>
          ⏱ Duration: {quiz.duration} mins | Passing Score: {quiz.passing_score} | Total:{" "}
          {quiz.total_points}
        </Text>
      </View>

      {/* Student Submissions */}
      <View
        style={[
          styles.submissionsBox,
          {
            backgroundColor: isDarkMode ? "#808080" : "#fff",
            borderColor: isDarkMode ? "#000000" : "#ddd",
            borderWidth: 1,
            shadowColor: isDarkMode ? "#006400" : "#000",
          },
        ]}
      >
        <Text style={[styles.subHeader, { color: isDarkMode ? "#F7F7F7" : "#000" }]}>
          📑 Student Results
        </Text>

        {loading ? (
          <Text style={[styles.noSubmissions, { color: isDarkMode ? "#aaa" : "#666" }]}>
            Loading...
          </Text>
        ) : submissions.length === 0 ? (
          <Text style={[styles.noSubmissions, { color: isDarkMode ? "#aaa" : "#666" }]}>
            No students have taken this quiz yet.
          </Text>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.submissionCard,
                  {
                    backgroundColor: isDarkMode ? "#0E5149" : "#f9f9f9",
                    borderColor: isDarkMode ? "#000000" : "#ddd",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.studentName, { color: isDarkMode ? "#F7F7F7" : "#000" }]}>
                  👤 {item.student_name || "Unknown Student"}
                </Text>

                {/* ✅ Added: show student email */}
                <Text style={[styles.meta, { color: isDarkMode ? "#F7F7F7" : "#666" }]}>
                  ✉️ {item.student_email || "No email available"}
                </Text>

                <Text style={[styles.score, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>
                  🏆 Score: {item.score ?? "N/A"} / {item.total_points ?? "?"}
                </Text>

                {/* ✅ Added: show quiz attempt status */}
                <Text
                  style={[
                    styles.status,
                    {
                      color:
                        item.status === "completed"
                          ? (isDarkMode ? "#F7F7F7" : "#008000")
                          : (isDarkMode ? "#FFD700" : "#DAA520"),
                    },
                  ]}
                >
                  📊 Status: {item.status ? item.status.toUpperCase() : "UNKNOWN"}
                </Text>

                <Text style={[styles.date, { color: isDarkMode ? "#F7F7F7" : "#777" }]}>
                  🕒{" "}
                  {item.submitted_at
                    ? format(new Date(item.submitted_at), "MMM dd, yyyy h:mm a")
                    : "Not available"}
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
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "500",
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
    fontWeight: "500",
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
    fontWeight: "500",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
  },
});