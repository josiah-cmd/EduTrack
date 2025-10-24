import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/student/quizzes");
      setQuizzes(response.data);
    } catch (error) {
      console.log("❌ Error fetching quizzes:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await api.get("/student/quizzes/attempts");
      setAttempts(response.data);
    } catch (error) {
      console.log("❌ Error fetching attempts:", error.response?.data || error.message);
    }
  };

  const handleStart = async () => {
    try {
      await api.post(`/student/quizzes/${selectedQuiz.id}/start`);
      setShowModal(false);
      router.push({
        pathname: "/student/quizzes/QuizTake",
        params: { quizId: selectedQuiz.id },
      });
    } catch (error) {
      console.log("❌ Error starting quiz:", error.response?.data || error.message);
    }
  };

  const getAttemptByQuiz = (quizId) =>
    attempts.find((a) => a.quiz_id === quizId && a.status === "completed");

  // ✅ Fetch on mount
  useEffect(() => {
    fetchQuizzes();
    fetchAttempts();
  }, []);

  // ✅ Fetch again when screen regains focus (after navigating back)
  useFocusEffect(
    useCallback(() => {
      // ✅ ADDED — delay to ensure backend updated attempt status
      const refresh = async () => {
        await new Promise((res) => setTimeout(res, 500)); // small delay for consistency
        await fetchQuizzes(); // ✅ ADDED — refresh quiz data too
        await fetchAttempts(); // ✅ existing
      };
      refresh();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <ScrollView>
      <Text style={styles.header}>Available Quizzes</Text>
      {quizzes.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#888" }}>No quizzes available.</Text>
      ) : (
        quizzes.map((quiz) => {
          const attempt = getAttemptByQuiz(quiz.id);
          return (
            <View key={quiz.id} style={styles.quizCard}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDate}>
                {quiz.start_time
                  ? `${quiz.start_time} to ${quiz.end_time}`
                  : "No schedule available"}
              </Text>

              <View style={styles.infoContainer}>
                <Text style={styles.label}>Description:</Text>
                <Text style={styles.value}>
                  {quiz.instructions || "No instructions provided."}
                </Text>

                <View style={styles.inlineRow}>
                  <Text style={styles.labelInline}>Duration:</Text>
                  <Text style={styles.valueInline}>{quiz.duration || 0} minute(s)</Text>

                  <Text style={styles.labelInline}>Points:</Text>
                  <Text style={styles.valueInline}>
                    {quiz.total_points || 0} point(s)
                  </Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.labelInline}>Passing Score:</Text>
                  <Text style={[styles.valueInline, { color: "#f87171" }]}>
                    {quiz.passing_score ? quiz.passing_score : 0}
                  </Text>

                  <Text style={styles.labelInline}>Status:</Text>
                  <Text
                    style={[
                      styles.valueInline,
                      {
                        color:
                          quiz.status === "Published"
                            ? "#22c55e"
                            : quiz.status === "Draft"
                            ? "#ca8a04"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {quiz.status || "N/A"}
                  </Text>
                </View>
              </View>

              {attempt ? (
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: "#2563eb" }]}
                  onPress={() =>
                    router.push({
                      pathname: "/student/quizzes/QuizResult",
                      params: { attemptId: attempt.id },
                    })
                  }
                >
                  <Text style={[styles.startText, { color: "#fff" }]}>
                    View Result ({attempt.score}/{attempt.total_points})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    setSelectedQuiz(quiz);
                    setShowModal(true);
                  }}
                >
                  <Text style={styles.startText}>Start Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              Are you ready to start the quiz {selectedQuiz?.title}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleStart}>
                <Text style={styles.confirmText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ✅ Enhanced layout + typography (matches STEP S design)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: "#0b0b0b",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 25,
    textAlign: "center",
  },
  quizCard: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e4e4e7",
    marginBottom: 4,
  },
  quizDate: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 12,
  },
  infoContainer: {
    marginBottom: 15,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d1d5db",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#f3f4f6",
    marginBottom: 8,
    lineHeight: 20,
  },
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  labelInline: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a1a1aa",
    marginRight: 4,
  },
  valueInline: {
    fontSize: 13,
    color: "#f3f4f6",
    marginRight: 10,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  startButton: {
    backgroundColor: "#00cc88",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  startText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#00cc88",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#000",
    fontWeight: "bold",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
});