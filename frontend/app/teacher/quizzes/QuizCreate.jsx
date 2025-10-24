/* eslint-disable */
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import QuizForm from "./QuizForm";
import QuizList from "./QuizList";
import QuizReview from "./QuizReview";

export default function QuizCreate({ quizData, onBackToQuizzes }) { // ✅ added optional prop
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

  // ✅ FIX ADDED: Final publish → back to QuizList cleanly
  const handleFinish = () => {
    setQuizId(null);
    setStep(1);

    // ✅ Attempt direct parent callback first (no router)
    if (onBackToQuizzes) {
      onBackToQuizzes();
      return; // ✅ Stop here if handled
    }

    try {
      router.back(); // ✅ fallback (in case direct parent not used)
    } catch (error) {
      console.warn("Router not active, showing QuizList directly");
      setStep(1); // ✅ fallback to show QuizList locally
    }
  };

  // ✅ Step 4: Back button in QuizReview → return to QuizForm
  const handleBackToEdit = () => {
    setStep(2);
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <QuizList
          onQuizCreated={handleQuizCreated}
        />
      )}

      {step === 2 && quizId && (
        <QuizForm
          quizId={quizId}
          onNextStep={handleQuestionsSaved}
        />
      )}

      {step === 3 && quizId && (
        <QuizReview
          quizId={quizId}
          onBack={handleBackToEdit}
          onFinish={handleFinish} // ✅ FIX ADDED: publish → go back to QuizList
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});