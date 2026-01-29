/* eslint-disable */
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";
import QuizCreate from "./QuizCreate"; // ✅ Added import (NO removals)
import QuizDetail from "./QuizDetail";
import QuizForm from "./QuizForm";
import QuizReview from "./QuizReview";

export default function QuizList({ room, isDarkMode}) {
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

  const [isTestBankMode, setIsTestBankMode] = useState(false);
  const [showQuizTestBankModal, setShowQuizTestBankModal] = useState(false);
  const [testBankQuizzes, setTestBankQuizzes] = useState([]);

  const fetchTestBankQuizzes = async () => {
    try {
      const res = await api.get("/test-bank/quizzes");
      setTestBankQuizzes(res.data);
    } catch (err) {
      console.error("❌ Error fetching test bank quizzes:", err.response?.data || err.message);
    }
  };

  const saveQuizToTestBank = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/save-to-test-bank`);
      alert("Quiz saved to Test Bank");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to save quiz");
    }
  };

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
        room_id: isTestBankMode ? null : room.id,
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

      if (isTestBankMode && savedQuiz?.id) {
        await api.post(`/quizzes/${savedQuiz.id}/save-to-test-bank`);
      }

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

  const handleCreateNewQuiz = () => {
    // Close Test Bank modal
    setShowQuizTestBankModal(false);

    // Reset all quiz fields
    setEditingQuiz(null);
    setTitle("");
    setDescription("");
    setStartTime(null);
    setEndTime(null);
    setDuration("");
    setPassingScore("");
    setTotalPoints("");
    setIsTestBankMode(true);
    // Open the New Quiz modal (from Quizlist.jsx)
    setShowModal(true);
  };
  
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

      <View
        style={{
          backgroundColor: "#808080", // 👈 CHANGE UI COLOR HERE
          padding: 12,
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setIsTestBankMode(false)}
            style={{
              padding: 8,
              backgroundColor: !isTestBankMode ? "#0E5149" : "#555",
              borderRadius: 6,
              flex: 1,
              marginRight: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              Classroom
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsTestBankMode(true);
              fetchTestBankQuizzes();
              setShowQuizTestBankModal(true);
            }}
            style={{
              padding: 8,
              backgroundColor: isTestBankMode ? "#0E5149" : "#555",
              borderRadius: 6,
              flex: 1,
              marginLeft: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              Test Bank
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[styles.addBtn, { backgroundColor: "#0E5149" }]}
        >
          <Text style={[styles.addBtnText, { color: "#F7F7F7" }]}>
            ➕ Add Quiz
          </Text>
        </TouchableOpacity>
      </View>

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
            <Text style={[styles.quizTitle, { color: isDarkMode ? "#F7F7F7" : "#000" }]}>{item.title}</Text>
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
                <Text style={{ color: "#fff", fontWeight: "400" }}>✏ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={[styles.smallBtn, { backgroundColor: "#ff4444" }]}
              >
                <Text style={{ color: "#fff", fontWeight: "400" }}>🗑 Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: "#4b0082",
                  borderRadius: 6,
                  marginRight: 6,
                }}
                onPress={() => saveQuizToTestBank(item.id)}
              >
                <Text style={{ color: "#fff", fontWeight: "500" }}>
                  Save to Test Bank
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleStatus(item)}
                style={[
                  styles.smallBtn,
                  { backgroundColor: item.status === "published" ? "#32cd32" : "#808080", fontWeight: "500", },
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
                <Text style={{ color: "#FFD700", fontWeight: "500", }}>📊 View Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* --- MODALS BELOW (unchanged except for textarea) --- */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDarkMode && { backgroundColor: "#1e1e1e" }]}>
            <Text style={[styles.modalTitle, { color: "#F7F7F7" }]}>
              {editingQuiz ? "✏ Edit Quiz" : "➕ New Quiz"}
            </Text>

            <TextInput
              placeholder="Quiz Title"
              value={title}
              onChangeText={setTitle}
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
            />

            {/* ✅ UPDATED: Description now uses multiline textarea (like RoomContent.jsx) */}
            <TextInput
              placeholder="Description / Instructions"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.input,
                { height: 100, paddingTop: 10, paddingBottom: 10 },
                isDarkMode && { backgroundColor: "#333", color: "#fff" },
              ]}
              placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
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
              placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
            />

            <TextInput
              placeholder="Passing Score"
              value={passingScore}
              onChangeText={setPassingScore}
              keyboardType="numeric"
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
            />

            <TextInput
              placeholder="Total Points"
              value={totalPoints}
              onChangeText={setTotalPoints}
              keyboardType="numeric"
              style={[styles.input, isDarkMode && { backgroundColor: "#333", color: "#fff" }]}
              placeholderTextColor={isDarkMode ? "#F7F7F7" : "#F7F7F7"}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#0E5149" }]}
                onPress={handleSave}
              >
                <Text style={[styles.modalBtnText, { color: "#F7F7F7" }]}>💾 Save</Text>
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
          <Text style={[styles.modalTitle, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>✅ Success</Text>
          <Text style={[styles.modalText, { color: isDarkMode ? "#fff" : "#333" }]}>
            Quiz saved successfully!
          </Text>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#006400" }]}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={[styles.modalBtnText, { color: "#F7F7F7" }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 🔹 QUIZ TEST BANK MODAL */}
      <Modal
        transparent
        visible={showQuizTestBankModal}
        animationType="slide"
        onRequestClose={() => setShowQuizTestBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDarkMode && { backgroundColor: "#1e1e1e" }, { maxHeight: "80%" }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? "#F7F7F7" : "#007bff" }]}>
              📚 Test Bank
            </Text>

            <TouchableOpacity
              onPress={handleCreateNewQuiz}
              style={styles.newQuizBtn}
            >
              <Text style={styles.newQuizBtnText}>➕ Create New Quiz</Text>
            </TouchableOpacity>

            <FlatList
              data={testBankQuizzes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.fileCard, isDarkMode && { backgroundColor: "#333", borderColor: "#555" }, { marginBottom: 10 }]}>
                  <Text style={[styles.fileTitle, isDarkMode && { color: "#fff" }]}>{item.title}</Text>
                  <Text style={[styles.fileDesc, isDarkMode && { color: "#ccc" }]}>{item.description || "No description available"}</Text>

                  <TouchableOpacity
                    style={[styles.uploadBtn, { marginTop: 6 }]}
                    onPress={async () => {
                      try {
                        await api.post("/test-bank/quizzes/attach", {
                          quiz_id: item.id,
                          room_id: room.id,
                        });

                        alert("Quiz added to room successfully!");
                        setShowQuizTestBankModal(false);
                        fetchQuizzes(); // refresh the room's quizzes list
                      } catch (err) {
                        console.error(err.response?.data || err.message);
                        alert("Failed to add quiz");
                      }
                    }}
                  >
                    <Text style={{ color: isDarkMode ? "#81b0ff" : "#007bff", fontWeight: "600" }}>
                      ➕ Add to This Room
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isDarkMode ? "#555" : "#F7F7F7" }]}
              onPress={() => setShowQuizTestBankModal(false)}
            >
              <Text style={[styles.modalButtonText, isDarkMode && { color: "#fff" }]}>Close</Text>
            </TouchableOpacity>
          </View>
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
    fontWeight: "500",
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
  modalButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Materials list */
  fileCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fileTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  fileDesc: {
    color: "#555",
  },
  deadline: {
    color: "red",
    fontWeight: "600",
    marginTop: 4,
  },
  newQuizBtn: {
    backgroundColor: "#0E5149",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  newQuizBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadBtn: {
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 6,
  },
});