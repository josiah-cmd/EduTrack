/* eslint-disable */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";
import { queueRequest } from "../../lib/OfflineSyncManager";

export default function QuizTake() {
  const { quizId: quizIdCamel, quizid } = useLocalSearchParams();
  const quizId = quizIdCamel ?? quizid;
  const router = useRouter();
  const navigation = useNavigation();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const STORAGE_KEY = `quiz_progress_${quizId}`;

  // ---------------------------
  // 🧠 Fetch or Restore Quiz
  // ---------------------------
  useEffect(() => {
    restoreProgress();
    fetchQuiz();
  }, []);

  const restoreProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentIndex(parsed.currentIndex || 0);
        setAttemptId(parsed.attemptId || null);
        console.log("♻️ Restored quiz progress:", parsed);
      }
    } catch (err) {
      console.log("⚠️ Failed to restore quiz progress:", err);
    }
  };

  const saveProgress = async (updatedAnswers, index, attempt) => {
    try {
      const data = {
        answers: updatedAnswers,
        currentIndex: index,
        attemptId: attempt || attemptId,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log("💾 Progress saved offline:", data);
    } catch (err) {
      console.log("⚠️ Failed to save progress:", err);
    }
  };

  const clearProgress = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("🧹 Cleared saved quiz progress");
  };

  // ---------------------------
  // 🧩 Fetch Quiz + Start Attempt
  // ---------------------------
  const fetchQuiz = async () => {
    try {
      console.log("🔍 QuizTake quizId from params:", quizId);

      const token = await AsyncStorage.getItem("token");

      // 1️⃣ Start (or resume) the attempt
      const startRes = await api.post(
        `/student/quizzes/${quizId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ startRes.data:", startRes.data);

      const newAttemptId =
        startRes.data?.id ||
        startRes.data?.attempt?.id ||
        startRes.data?.data?.id;

      if (!newAttemptId) {
        throw new Error("No attempt ID returned");
      }

      setAttemptId(newAttemptId);

      // 2️⃣ Fetch quiz content
      const quizRes = await api.get(`/student/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ quizRes.data:", quizRes.data);

      setQuiz(quizRes.data);

      console.log(
        "🧪 quizRes.data.questions:",
        quizRes.data.questions?.length,
        quizRes.data.questions
      );

      const duration = quizRes.data.duration
        ? quizRes.data.duration * 60
        : 600;

      setTimeLeft(duration);
    } catch (err) {
      console.log(
        "❌ Fetch Quiz Error:",
        err.response?.status,
        err.response?.data || err
      );
    }
  };

  // ---------------------------
  // ⏱ Timer
  // ---------------------------
  useEffect(() => { 
    if (!timeLeft) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 60) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [timeLeft]);

  // ---------------------------
  // 🚫 Tab-switch warning
  // ---------------------------
  useEffect(() => {
    if (typeof document !== "undefined") {
      const handleVisibilityChange = () => {
        if (document.hidden) triggerWarning();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [warningCount]);

  const triggerWarning = () => {
    if (warningCount === 0) {
      setWarningCount(1);
      setShowWarning(true);
    } else if (warningCount === 1) {
      setWarningCount(2);
      handleAutoSubmit();
    }
  };

  // ---------------------------
  // 🧾 Answer select + Save offline
  // ---------------------------
  const handleSelect = (questionId, optionId) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    setAnswers(updatedAnswers);
    saveProgress(updatedAnswers, currentIndex);
  };

  // ---------------------------
  // 🧾 Submit & Sync
  // ---------------------------
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formattedAnswers = Object.keys(answers).map((qid) => ({
        question_id: parseInt(qid),
        selected_option_id: answers[qid],
      }));

      try {
        const res = await api.post(
          `/student/quiz-attempts/${attemptId}/submit`,
          { answers: formattedAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await clearProgress();
        setShowSubmitModal(false);

        router.replace({
          pathname: "/student/quizzes/QuizResult",
          params: {
            attemptId,
            quizId,
            score: res.data.score,
            total: res.data.total_points,
            percentage: res.data.percentage,
          },
        });
      } catch (err) {
        console.log("📴 Offline detected — queuing submission");
        await queueRequest(`/student/quiz-attempts/${attemptId}/submit`, "POST", {
          answers: formattedAnswers,
        });
        await clearProgress();
        Alert.alert("Offline", "Your quiz submission is saved offline and will sync once online.");
        router.replace("/student/index");
      }
    } catch (err) {
      console.log("❌ Submit Error:", err);
    }
  };

  // ---------------------------
  // ⏱ Auto Submit
  // ---------------------------
  const handleAutoSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formattedAnswers = Object.keys(answers).map((qid) => ({
        question_id: parseInt(qid),
        selected_option_id: answers[qid],
      }));

      try {
        const res = await api.post(
          `/student/quiz-attempts/${attemptId}/submit`,
          { answers: formattedAnswers, auto_submitted: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await clearProgress();
        setShowWarning(false);
        router.replace({
          pathname: "/student/quizzes/QuizResult",
          params: {
            attemptId,
            quizId,
            score: res.data.score,
            total: res.data.total_points,
            percentage: res.data.percentage,
          },
        });
      } catch (err) {
        console.log("📴 Offline detected — queuing auto-submit");
        await queueRequest(`/student/quiz-attempts/${attemptId}/submit`, "POST", {
          answers: formattedAnswers,
          auto_submitted: true,
        });
        await clearProgress();
        Alert.alert("Offline", "Your quiz auto-submission is saved locally and will sync later.");
        router.replace("/student/index");
      }
    } catch (err) {
      console.log("❌ Auto Submit Error:", err);
    }
  };

  // ---------------------------
  // 🧭 UI
  // ---------------------------
  if (!quiz) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading quiz...</Text>
      </View>
    );
  }

  const questions = quiz.questions || [];
  const safeIndex =
    currentIndex >= 0 && currentIndex < questions.length
      ? currentIndex
      : 0;

  const question = questions[safeIndex];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>{quiz.title}</Text>

        <Animated.View
          style={[
            styles.timerContainer,
            { opacity: fadeAnim },
            timeLeft <= 60 && { borderColor: "#ff3333" },
          ]}
        >
          <Text
            style={[
              styles.timerText,
              timeLeft <= 60 && { color: "#ff3333" },
            ]}
          >
            Time Left: {formatTime(timeLeft)}
          </Text>
        </Animated.View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {question ? `${safeIndex + 1}. ${question.question_text}` : "Loading question..."}
          </Text>

          <ScrollView style={styles.optionsContainer}>
            {question && (question.options || question.choices)?.length > 0 ? (
              (question.options || question.choices).map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.option,
                    answers[question.id] === opt.id && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(question.id, opt.id)}
                >
                  <Text style={styles.optionText}>
                    {opt.label ? `${opt.label}. ` : ""}
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noOptionsText}>
                {question ? "No options available for this question." : "Loading options..."}
              </Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.navButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={() => setCurrentIndex(currentIndex - 1)}
              style={[styles.navButton, styles.secondaryButton]}
            >
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>
          )}
          {safeIndex < questions.length - 1 ? (
            <TouchableOpacity
              onPress={() => setCurrentIndex(safeIndex + 1)}
              style={[styles.navButton, styles.primaryButton]}
            >
              <Text style={styles.navText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowSubmitModal(true)}
              style={[styles.navButton, styles.submitButton]}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ✅ FIXED MODAL: Confirm Submit */}
      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Are you sure you want to submit?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit}>
                <Text style={styles.confirmText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Warning Modal */}
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, { borderColor: "#ffcc00" }]}>
            <Text style={[styles.modalText, { color: "#ffcc00" }]}>
              ⚠️ You switched tabs or minimized the quiz!{"\n\n"}This is your first
              warning. Leaving again will auto-submit your quiz.
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: "#ffcc00" }]}
              onPress={() => setShowWarning(false)}
            >
              <Text style={[styles.confirmText, { color: "#000" }]}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    minHeight: "100vh",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 30,
    width: "90%",
    maxWidth: 800,
    marginTop: 30,
    backgroundColor: "#141414",
    borderRadius: 20,
    shadowColor: "#00ff88",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
  },
  title: {
    color: "#00ff88",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  timerContainer: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#00ff88",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: "#101010",
  },
  timerText: {
    color: "#00ff88",
    fontSize: 18,
    fontWeight: "700",
  },
  questionCard: {
    backgroundColor: "#1a1a1d",
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: "#00ff88",
    marginBottom: 25,
    shadowColor: "#00ff88",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  questionText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
  },
  optionsContainer: {
    maxHeight: 350,
  },
  option: {
    backgroundColor: "#232323",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    transition: "all 0.2s",
  },
  optionSelected: {
    borderColor: "#00ff88",
    backgroundColor: "#003322",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
  },
  noOptionsText: {
    color: "#888",
    textAlign: "center",
    fontSize: 16,
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#00ff88",
  },
  secondaryButton: {
    backgroundColor: "#2a2a2a",
  },
  navText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#00ff88",
  },
  submitText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalBox: {
    backgroundColor: "#1b1b1b",
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#00ff88",
    width: "80%",
  },
  modalText: {
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cancelText: {
    color: "#ff6666",
    fontSize: 16,
  },
  confirmText: {
    color: "#00ff88",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    minWidth: 100,
    alignItems: "center",
  },
  loading: {
    color: "#fff",
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});