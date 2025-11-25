import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { initOfflineSyncWatcher } from "./lib/OfflineSyncManager";

export default function Layout() {
  useEffect(() => {
    initOfflineSyncWatcher();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="teacher/index" />
        <Stack.Screen name="staff/index" />
        <Stack.Screen name="student/index" />
        <Stack.Screen name="student/quizzes/QuizTake" />
        <Stack.Screen name="student/quizzes/QuizResult" />
      </Stack>
    </SafeAreaView>
  );
}