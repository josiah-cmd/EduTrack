import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";
import QuizCreate from "./QuizCreate"; // ✅ Added import (NO removals)
import QuizDetail from "./QuizDetail";
import QuizForm from "./QuizForm";
import QuizReview from "./QuizReview";

export default function QuizList({ room, isDarkMode }) {
  const [quizzes, setQuizzes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [totalPoints, setTotalPoints] = useState("");

  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [step, setStep] = useState(1); // ✅ Step flow: 1=list, 2=form, 3=review
  const [activeQuizId, setActiveQuizId] = useState(null);

  // ✅ Added state for new integrated flow (NO removal)
  const [isUsingQuizCreate, setIsUsingQuizCreate] = useState(false);

  // ✅ NEW: Pass saved quiz data directly to QuizCreate for continuation
  const [savedQuizData, setSavedQuizData] = useState(null);

  const [viewingQuiz, setViewingQuiz] = useState(null);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get("/quizzes", { params: { room_id: room?.id } });
      setQuizzes(res.data);
    } catch (err) {
      console.error("❌ Error fetching quizzes:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (room) fetchQuizzes();
  }, [room]);

  const formatDateTime = (date) => {
    if (!date) return "";
    const pad = (n) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  };

  const handleSave = async () => {
    if (!room) return alert("Room is not set.");
    if (!title.trim()) return alert("Title is required");
    if (!startTime || !endTime) return alert("Start and end date/time are required");
    if (!duration.trim() || isNaN(parseInt(duration))) return alert("Duration (minutes) is required and must be a number");
    if (!passingScore.trim() || isNaN(parseInt(passingScore))) return alert("Passing score is required and must be a number");
    if (!totalPoints.trim() || isNaN(parseInt(totalPoints))) return alert("Total points is required and must be a number");

    try {
      const data = {
        room_id: room.id,
        title,
        instructions: description,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        duration: parseInt(duration, 10),
        passing_score: parseInt(passingScore, 10),
        total_points: parseInt(totalPoints, 10),
      };

      let response;

      if (editingQuiz) {
        response = await api.put(`/quizzes/${editingQuiz.id}`, data);
      } else {
        response = await api.post("/quizzes", data);
      }

      // ✅ Fix: handle Laravel create() response (no “quiz” key)
      const savedQuiz = response.data.quiz || response.data;

      setTitle("");
      setDescription("");
      setStartTime(null);
      setEndTime(null);
      setDuration("");
      setPassingScore("");
      setTotalPoints("");
      setEditingQuiz(null);
      setShowModal(false);
      fetchQuizzes();
      setShowSuccessModal(true);

      // ✅ Move to Step 2 (QuizForm) — or use full flow via QuizCreate
      if (savedQuiz?.id) {
        setActiveQuizId(savedQuiz.id);
        setSavedQuizData(savedQuiz); // ✅ Store full quiz data for QuizCreate
        setStep(2);
        setIsUsingQuizCreate(true); // ✅ Switch to QuizCreate flow
      }
    } catch (err) {
      console.error("❌ Save failed:", err.response?.data || err.message);
      alert("Failed to save quiz");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/quizzes/${id}`);
      fetchQuizzes();
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err.message);
    }
  };

  const toggleStatus = async (quiz) => {
    try {
      await api.patch(`/quizzes/${quiz.id}/toggle`);
      fetchQuizzes();
    } catch (err) {
      console.error("❌ Toggle failed:", err.response?.data || err.message);
    }
  };

  // ✅ FIX ADDED: Full return handler for after Save & Publish → OK
  const handleBackToQuizzes = () => {
    setIsUsingQuizCreate(false);
    setStep(1);
    setActiveQuizId(null);
    setSavedQuizData(null);
    fetchQuizzes(); // ✅ Refresh list on return
  };

  // ✅ NEW: integrate QuizCreate after quiz is saved
  if (isUsingQuizCreate && activeQuizId && savedQuizData) {
    return (
      <QuizCreate
        quizData={savedQuizData}
        onBackToQuizzes={handleBackToQuizzes} // ✅ FIX ADDED
      />
    );
  }

  // ✅ Step flow rendering (unchanged)
  if (step === 2 && activeQuizId) {
    return (
      <QuizForm
        quizId={activeQuizId}
        room={room}
        isDarkMode={isDarkMode}
        onNextStep={() => setStep(3)}
        onBack={() => setStep(1)}
      />
    );
  }

  if (step === 3 && activeQuizId) {
    return (
      <QuizReview
        quizId={activeQuizId}
        room={room}
        isDarkMode={isDarkMode}
        onBack={() => setStep(2)}
        onFinish={handleBackToQuizzes} // ✅ FIX ADDED
      />
    );
  }

  if (viewingQuiz) {
    return (
      <QuizDetail
        quiz={viewingQuiz}
        isDarkMode={isDarkMode}
        onBack={() => setViewingQuiz(null)}
      />
    );
  }

  // ✅ Your full existing JSX code (UNCHANGED except one new button)
  return (
    <View style={{ flex: 1 }}>
      <style>{`
        .react-datepicker {
          font-size: 14px;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }
      `}</style>

      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={[styles.addBtn, { backgroundColor: "#006400" }]}
      >
        <Text style={[styles.addBtnText, { color: "#FFD700" }]}>➕ Add Quiz</Text>
      </TouchableOpacity>

      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.quizCard,
              isDarkMode && { backgroundColor: "#222", borderColor: "#444" },
            ]}
          >
            <Text style={[styles.quizTitle, { color: isDarkMode ? "#FFD700" : "#000" }]}>{item.title}</Text>
            <Text style={[styles.quizDesc, { color: isDarkMode ? "#ccc" : "#555" }]}>
              {item.description || item.instructions || "No description"}
            </Text>

            {item.start_time && item.end_time && (
              <Text style={[styles.metaText, { color: isDarkMode ? "#bbb" : "#444" }]}>
                Schedule: {item.start_time} → {item.end_time}
              </Text>
            )}
            {item.duration != null && (
              <Text style={[styles.metaText, { color: isDarkMode ? "#bbb" : "#444" }]}>
                Duration: {item.duration} mins
              </Text>
            )}
            {(item.passing_score != null || item.total_points != null) && (
              <Text style={[styles.metaText, { color: isDarkMode ? "#bbb" : "#444" }]}>
                Passing: {item.passing_score ?? "-"} | Total: {item.total_points ?? "-"}
              </Text>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditingQuiz(item);
                  setTitle(item.title || "");
                  setDescription(item.instructions || item.description || "");
                  setStartTime(item.start_time ? new Date(item.start_time) : null);
                  setEndTime(item.end_time ? new Date(item.end_time) : null);
                  setDuration(item.duration != null ? String(item.duration) : "");
                  setPassingScore(item.passing_score != null ? String(item.passing_score) : "");
                  setTotalPoints(item.total_points != null ? String(item.total_points) : "");
                  setShowModal(true);
                }}
                style={[styles.smallBtn, { backgroundColor: "#1e90ff" }]}
              >
                <Text style={{ color: "#fff" }}>✏ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={[styles.smallBtn, { backgroundColor: "#ff4444" }]}
              >
                <Text style={{ color: "#fff" }}>🗑 Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleStatus(item)}
                style={[
                  styles.smallBtn,
                  { backgroundColor: item.status === "published" ? "#32cd32" : "#808080" },
                ]}
              >
                <Text style={{ color: "#fff" }}>
                  {item.status === "published" ? "Published" : item.status === "closed" ? "Closed" : "Draft"}
                </Text>
              </TouchableOpacity>

              {/* ✅ NEW BUTTON: View Results */}
              <TouchableOpacity
                onPress={() => setViewingQuiz(item)}
                style={[styles.smallBtn, { backgroundColor: "#006400" }]}
              >
                <Text style={{ color: "#FFD700" }}>📊 View Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* --- MODALS BELOW (unchanged) --- */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDarkMode && { backgroundColor: "#1e1e1e" }]}>
            <Text style={[styles.modalTitle, { color: "#FFD700" }]}>
              {editingQuiz ? "✏ Edit Quiz" : "➕ New Quiz"}
            </Text>

            <TextInput
              placeholder="Quiz Title"
              value={title}
              onChangeText={setTitle}
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
            />

            <TextInput
              placeholder="Description / Instructions"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
            />

            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={[styles.input, { justifyContent: "center" }, isDarkMode && { backgroundColor: "#333" }]}
            >
              <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                {startTime ? formatDateTime(startTime) : "Select Start Date/Time"}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DatePicker
                selected={startTime}
                onChange={(date) => {
                  setStartTime(date);
                  setShowStartPicker(false);
                }}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm:ss"
                inline={false}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={[styles.input, { justifyContent: "center" }, isDarkMode && { backgroundColor: "#333" }]}
            >
              <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                {endTime ? formatDateTime(endTime) : "Select End Date/Time"}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DatePicker
                selected={endTime}
                onChange={(date) => {
                  setEndTime(date);
                  setShowEndPicker(false);
                }}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm:ss"
                inline={false}
              />
            )}

            <TextInput
              placeholder="Duration (minutes)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
            />

            <TextInput
              placeholder="Passing Score"
              value={passingScore}
              onChangeText={setPassingScore}
              keyboardType="numeric"
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
            />

            <TextInput
              placeholder="Total Points"
              value={totalPoints}
              onChangeText={setTotalPoints}
              keyboardType="numeric"
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#bbb" : "#555"}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#006400" }]}
                onPress={handleSave}
              >
                <Text style={[styles.modalBtnText, { color: "#FFD700" }]}>💾 Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#555" }]}
                onPress={() => {
                  setShowModal(false);
                  setEditingQuiz(null);
                  setTitle("");
                  setDescription("");
                  setStartTime(null);
                  setEndTime(null);
                  setDuration("");
                  setPassingScore("");
                  setTotalPoints("");
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? "#FFD700" : "#007bff" }]}>✅ Success</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? "#fff" : "#333" }]}>
            Quiz saved successfully!
          </Text>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#006400" }]}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={[styles.modalBtnText, { color: "#FFD700" }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  addBtnText: {
    fontWeight: "600",
  },
  quizCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  quizDesc: {
    marginTop: 4,
    fontSize: 14,
  },
  metaText: {
    marginTop: 6,
    fontSize: 13,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    fontWeight: "600",
  },
  modalText: {
    textAlign: "center",
    marginBottom: 10,
  },
});