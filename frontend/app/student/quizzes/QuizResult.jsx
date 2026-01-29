/* eslint-disable */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import api from "../../lib/axios";

export default function QuizResult({  attemptId: propAttemptId,  quizId: propQuizId,  score: propScore,  total: propTotal,  percentage: propPercentage,  onBack,  isDarkMode,}) {
  // ✅ Changed to avoid name collisions with props — read params into temp variables
  const params = useLocalSearchParams();
  const attemptIdParam = params.attemptId;
  const quizIdParam = params.quizId;
  const scoreParam = params.score;
  const totalParam = params.total;
  const percentageParam = params.percentage;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const idToUse = propAttemptId || attemptIdParam;
      if (!idToUse) {
        setResult({
          quiz: { title: "Quiz Result", instructions: "Completed quiz" },
          score: Number(propScore || scoreParam) || 0,
          total_points: Number(propTotal || totalParam) || 0,
          status: "Completed",
          answers: [],
        });
        setLoading(false);
        return;
      }

      // ✅ FIXED ENDPOINT
      const response = await api.get(`/student/quiz-attempts/${idToUse}/result`);
      setResult(response.data);
    } catch (error) {
      console.log("❌ Error fetching result:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#fff" }}>No result found.</Text>
      </View>
    );
  }

  const percentageValue =
    result.total_points > 0
      ? ((result.score / result.total_points) * 100).toFixed(2)
      : propPercentage || percentageParam || 0;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? "#121212" : "#f9f9f9",
          width: "100vw", // ✅ Added — full width on web
          minHeight: "100vh", // ✅ ensures full screen height
        },
      ]}
      contentContainerStyle={{ alignItems: "center" }} // ✅ ensures centered layout
    >
      <View
        style={[
          styles.wrapper,
          { width: "100%", maxWidth: 1200 }, // ✅ full width but limited for nice layout
        ]}
      >
        <View
          style={[
            styles.headerBox,
            {
              backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
              borderColor: isDarkMode ? "#333" : "#ccc",
            },
          ]}
        >
          <Text
            style={[
              styles.quizTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {result.quiz.title}
          </Text>
          <Text
            style={[
              styles.quizDesc,
              { color: isDarkMode ? "#ccc" : "#333" },
            ]}
          >
            {result.quiz.instructions}
          </Text>

          <View
            style={[
              styles.statsBox,
              { backgroundColor: isDarkMode ? "#181818" : "#eee" },
            ]}
          >
            <Text style={[styles.statText, { color: isDarkMode ? "#fff" : "#111" }]}>
              🧮 Score:{" "}
              <Text style={{ color: "#000000" }}>
                {result.score} / {result.total_points}
              </Text>
            </Text>
            <Text style={[styles.statText, { color: isDarkMode ? "#fff" : "#111" }]}>
              📊 Percentage:{" "}
              <Text
                style={{
                  color: percentageValue >= 50 ? "#000000" : "#ff5555",
                }}
              >
                {percentageValue}%
              </Text>
            </Text>
            <Text style={[styles.statText, { color: isDarkMode ? "#fff" : "#111" }]}>
              🏁 Status:{" "}
              <Text style={{ color: "#000000" }}>{result.status}</Text>
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.questionsContainer,
            { backgroundColor: isDarkMode ? "#1a1a1a" : "#fafafa" },
          ]}
        >
          {result.answers.length > 0 ? (
            result.answers.map((a, index) => (
              <View
                key={index}
                style={[
                  styles.questionCard,
                  {
                    borderColor: a.is_correct ? "#000000" : "#ff5555",
                    backgroundColor: isDarkMode ? "#222" : "#fff",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.questionText,
                    { color: isDarkMode ? "#fff" : "#111" },
                  ]}
                >
                  {index + 1}. {a.question.question_text}
                </Text>

                <Text
                  style={[
                    styles.answerText,
                    { color: isDarkMode ? "#ddd" : "#333" },
                  ]}
                >
                  Your Answer:{" "}
                  <Text
                    style={{
                      color: a.is_correct ? "#000000" : "#ff5555",
                      fontWeight: "bold",
                    }}
                  >
                    {a.option?.label || "N/A"}
                  </Text>
                </Text>

                {!a.is_correct && (
                  <Text
                    style={[
                      styles.correctAnswerText,
                      { color: isDarkMode ? "#aaa" : "#555" },
                    ]}
                  >
                    Correct Answer:{" "}
                    <Text style={{ color: "#00ff88", fontWeight: "bold" }}>
                      {a.question.correct_answer}
                    </Text>
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: "#ccc", textAlign: "center", marginTop: 10 }}>
              No question breakdown available.
            </Text>
          )}
        </View>

        {/* ✅ Back button modified to work inside RoomContent instead of window.history */}
        <TouchableOpacity
          onPress={() => {
            if (onBack) onBack();
            else if (typeof window !== "undefined") window.history.back();
          }}
          style={[
            styles.backButton,
            { backgroundColor: isDarkMode ? "#333" : "#ddd" },
          ]}
        >
          <Text
            style={[
              styles.backText,
              { color: isDarkMode ? "#00ff88" : "#000000" },
            ]}
          >
            ⬅ Back to Quizzes
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingVertical: 30,
  },
  wrapper: {
    width: width > 800 ? "70%" : "95%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  headerBox: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  quizTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  quizDesc: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 15,
    textAlign: "center",
  },
  statsBox: {
    backgroundColor: "#181818",
    borderRadius: 10,
    padding: 15,
  },
  statText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
  },
  questionsContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#222",
  },
  questionText: {
    fontSize: 17,
    color: "#fff",
    marginBottom: 10,
  },
  answerText: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 5,
  },
  correctAnswerText: {
    fontSize: 16,
    color: "#aaa",
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 50,
  },
  backText: {
    color: "#00ff88",
    fontSize: 17,
    fontWeight: "600",
  },
});