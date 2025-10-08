import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import QuizForm from "./QuizForm";
import QuizList from "./QuizList";
import QuizReview from "./QuizReview";

export default function QuizCreate({ quizData }) { // ✅ added prop for when QuizList passes quizData
  const [step, setStep] = useState(quizData ? 2 : 1); // ✅ if quizData exists, start at step 2
  const [quizId, setQuizId] = useState(quizData?.id || null); // ✅ auto use existing quizId if passed
  const router = useRouter();

  // ✅ Step 1: Quiz info created → go to QuizForm
  const handleQuizCreated = (newQuizId) => {
    setQuizId(newQuizId);
    setStep(2);
  };

  // ✅ Step 3: After saving questions → go to QuizReview
  const handleQuestionsSaved = () => {
    setStep(3);
  };

  // ✅ Step 5: After publishing or saving draft → success + back to list
  const handleFinish = () => {
    Alert.alert("✅ Success", "Quiz has been published successfully!", [
      {
        text: "OK",
        onPress: () => {
          setQuizId(null);
          setStep(1);
          router.push("/teacher/quizzes"); // ✅ adjusted route path to match folder (was /quizzes)
        },
      },
    ]);
  };

  // ✅ Step 4: Back button in QuizReview → return to QuizForm
  const handleBackToEdit = () => {
    setStep(2);
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <QuizList
          onQuizCreated={handleQuizCreated} // called after saving quiz info
        />
      )}

      {step === 2 && quizId && (
        <QuizForm
          quizId={quizId}
          onNextStep={handleQuestionsSaved} // called after saving questions
        />
      )}

      {step === 3 && quizId && (
        <QuizReview
          quizId={quizId}
          onBack={handleBackToEdit} // back to edit
          onFinish={handleFinish} // publish → success → back to list
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});