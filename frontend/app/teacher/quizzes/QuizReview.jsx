import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function QuizReview({ quizId, onBack, onFinish }) {
  const [quiz, setQuiz] = useState(null); // ✅ fixed "auseState" → "useState"
  const [questions, setQuestions] = useState([]); // ✅ fixed
  const [isFinishing, setIsFinishing] = useState(false); // ✅ fixed typo

  useEffect(() => {
    const fetchData = async () => { // ✅ fixed invalid arrow syntax (async ?=>)
      try {
        const [quizRes, questionRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get(`/quizzes/${quizId}/questions`),
        ]);

        setQuiz(quizRes.data.quiz || quizRes.data);

        if (Array.isArray(quizRes.data?.questions)) {
          setQuestions(quizRes.data.questions);
        } else if (Array.isArray(questionRes.data?.questions)) {
          setQuestions(questionRes.data.questions);
        } else if (Array.isArray(questionRes.data)) {
          setQuestions(questionRes.data);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error("❌ Error loading quiz/questions:", error.response?.data || error.message);
      }
    }; // ✅ fixed colon (:) to semicolon
    fetchData();
  }, [quizId]);

  const handleSaveAndPublish = async (status = "published") => {
    try {
      setIsFinishing(true);
      await api.put(`/quizzes/${quizId}`, { status });
      Alert.alert(
        "Success",
        `Quiz ${status === "published" ? "published" : "saved as draft"} successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              if (onFinish) onFinish();
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update quiz status.");
    } finally {
      setIsFinishing(false);
    }
  };

  if (!quiz) return <Text>Loading quiz details...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 4 — Review & Save</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Title:</Text>
        <Text style={styles.value}>{quiz.title}</Text>

        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{quiz.description}</Text>

        <Text style={styles.label}>Total Questions:</Text>
        <Text style={styles.value}>{questions.length}</Text>
      </View>

      <Text style={styles.subTitle}>Questions:</Text>
      {questions.map((q, i) => (
        <View key={i} style={styles.questionCard}>
          <Text style={styles.questionText}>
            {i + 1}. {q.question_text}
          </Text>
          <Text style={styles.meta}>
            Type: {q.type} | Points: {q.points}
          </Text>

          {Array.isArray(q.options) &&
            q.options.length > 0 &&
            q.options.map((opt, idx) => (
              <Text key={idx} style={styles.option}>
                •{" "}
                {typeof opt === "string"
                  ? opt
                  : `${opt.label ?? String.fromCharCode(65 + idx)}. ${
                      opt.option_text ?? opt.text
                    }`}
              </Text>
            ))}

          <Text style={styles.correct}>✅ Correct Answer: {q.correct_answer}</Text>
        </View>
      ))}

      {/* ✅ fixed from "TouchableOction" → "TouchableOpacity" */}
      <TouchableOpacity
        style={[styles.publishBtn, isFinishing && { opacity: 0.6 }]}
        onPress={() => handleSaveAndPublish("published")}
        disabled={isFinishing}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
        <Text style={styles.btnText}>{isFinishing ? "Publishing..." : "Save & Publish"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.draftBtn, isFinishing && { opacity: 0.6 }]}
        onPress={() => handleSaveAndPublish("draft")}
        disabled={isFinishing}
      >
        <Ionicons name="save-outline" size={20} color="white" />
        <Text style={styles.btnText}>{isFinishing ? "Saving..." : "Save as Draft"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle-outline" size={20} color="white" />
        <Text style={styles.btnText}>Back to Edit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
  },
  value: {
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  questionCard: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionText: {
    fontWeight: "600",
  },
  meta: {
    color: "gray",
    marginBottom: 4,
  },
  option: {
    marginLeft: 10,
  },
  correct: {
    color: "green",
    fontWeight: "600",
    marginTop: 5,
  },
  publishBtn: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  draftBtn: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },

  // ✅ Added minimal missing styles
  backBtn: {
    backgroundColor: "#444", // darker gray for back button
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});