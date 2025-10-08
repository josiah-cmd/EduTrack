import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../lib/axios";

export default function QuizForm({ quizId, onBack, onNextStep, isDarkMode }) { // 🔹 added onNextStep prop
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [options, setOptions] = useState([
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = () => {
    if (!questionText || !correctAnswer || !points) {
      Alert.alert("Incomplete", "Please fill in all fields and select a correct answer.");
      return;
    }

    // ✅ Add unique ID for FlatList keyExtractor
    const newQuestion = {
      id: Date.now().toString(), // <-- unique key
      question_text: questionText,
      type: questionType,
      options: questionType === "multiple_choice" ? options : [],
      correct_answer: correctAnswer,
      points: parseInt(points),
    };

    setQuestions([...questions, newQuestion]);
    setQuestionText("");
    setOptions([
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ]);
    setCorrectAnswer("");
    setPoints("");
  };

  const handleOptionChange = (index, text) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const renderQuestion = ({ item, index }) => (
    <View
      style={[
        styles.questionCard,
        { backgroundColor: isDarkMode ? "#222" : "#f2f2f2" },
      ]}
    >
      <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" }}>
        {index + 1}. {item.question_text}
      </Text>
      <Text style={{ color: isDarkMode ? "#aaa" : "#333" }}>
        Type: {item.type} | Points: {item.points}
      </Text>
    </View>
  );

  const saveQuiz = async () => {
    if (questions.length === 0) {
      Alert.alert("Empty Quiz", "Please add at least one question before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // ✅ Send all questions in one request (Laravel expects "questions": [])
      await api.post(`/quizzes/${quizId}/questions`, {
        questions: questions.map((q) => ({
          question_text: q.question_text,
          type: q.type,
          points: q.points,
          correct_answer: q.correct_answer,
          options: q.options,
        })),
      });

      Alert.alert("Success", "Quiz saved successfully!");
      
      // 🔹 added: go to next step (QuizReview.jsx) automatically
      if (onNextStep) {
        onNextStep();
      } else if (onBack) {
        onBack();
      }

    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert("Error", "Failed to save quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container]}>
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>Step 2 — Add Questions</Text>

      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Question Text</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: isDarkMode ? "#fff" : "#000",
            borderColor: isDarkMode ? "#444" : "#ccc",
            backgroundColor: isDarkMode ? "#111" : "#fff",
          },
        ]}
        value={questionText}
        onChangeText={setQuestionText}
        placeholder="Enter question..."
        placeholderTextColor={isDarkMode ? "#aaa" : "#555"} // ✅ fixed visibility
      />

      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Question Type</Text>
      <View style={styles.typeRow}>
        {["multiple_choice", "true_false", "identification"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, questionType === type && styles.activeType]}
            onPress={() => setQuestionType(type)}
          >
            <Text style={[styles.typeText, questionType === type && styles.activeText]}>
              {type.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {questionType === "multiple_choice" && (
        <View>
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Options</Text>
          {options.map((opt, index) => (
            <View key={opt.label} style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: isDarkMode ? "#fff" : "#000" }]}>{opt.label}.</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: isDarkMode ? "#fff" : "#000",
                    borderColor: isDarkMode ? "#444" : "#ccc",
                    backgroundColor: isDarkMode ? "#111" : "#fff",
                  },
                ]}
                placeholder={`Option ${opt.label}`}
                placeholderTextColor={isDarkMode ? "#aaa" : "#555"} // ✅ fixed
                value={opt.text}
                onChangeText={(text) => handleOptionChange(index, text)}
              />
              <TouchableOpacity onPress={() => setCorrectAnswer(opt.label)}>
                <Ionicons
                  name={correctAnswer === opt.label ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={correctAnswer === opt.label ? "green" : isDarkMode ? "#aaa" : "gray"}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {questionType === "true_false" && (
        <View style={styles.typeRow}>
          {["True", "False"].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.typeButton, correctAnswer === val && styles.activeType]}
              onPress={() => setCorrectAnswer(val)}
            >
              <Text style={[styles.typeText, correctAnswer === val && styles.activeText]}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {questionType === "identification" && (
        <View>
          <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Correct Answer</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: isDarkMode ? "#fff" : "#000",
                borderColor: isDarkMode ? "#444" : "#ccc",
                backgroundColor: isDarkMode ? "#111" : "#fff",
              },
            ]}
            value={correctAnswer}
            onChangeText={setCorrectAnswer}
            placeholder="Type the correct answer..."
            placeholderTextColor={isDarkMode ? "#aaa" : "#555"} // ✅ fixed
          />
        </View>
      )}

      <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Points</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: isDarkMode ? "#fff" : "#000",
            borderColor: isDarkMode ? "#444" : "#ccc",
            backgroundColor: isDarkMode ? "#111" : "#fff",
          },
        ]}
        keyboardType="numeric"
        value={points}
        onChangeText={setPoints}
        placeholder="Enter points (e.g., 5)"
        placeholderTextColor={isDarkMode ? "#aaa" : "#555"} // ✅ fixed
      />

      <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
        <Ionicons name="add-circle-outline" size={20} color="white" />
        <Text style={styles.addText}>Add Question</Text>
      </TouchableOpacity>

      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.id} // ✅ stable unique key
        style={{ marginVertical: 10 }}
      />

      <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={saveQuiz} disabled={isSaving}>
        <Text style={styles.saveText}>{isSaving ? "Saving..." : "Save Quiz"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    marginTop: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
  },
  typeRow: { 
    flexDirection: "row", 
    marginVertical: 10 
  },
  typeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginRight: 10,
  },
  typeText: { 
    fontSize: 13 
  },
  activeType: { 
    backgroundColor: "#007bff", 
    borderColor: "#007bff" 
  },
  activeText: { 
    color: "white" 
  },
  optionRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginVertical: 4 
  },
  optionLabel: { 
    width: 20, 
    fontWeight: "bold" 
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
  },
  addText: { 
    color: "white", 
    fontWeight: "bold", 
    marginLeft: 5 
  },
  questionItem: {
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 5,
  },
  questionText: { 
    fontWeight: "bold" 
  },
  questionMeta: { 
    fontSize: 12, 
    color: "#555" 
  },
  saveBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { 
    color: "white", 
    fontWeight: "bold" 
  },
});
