import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { initOfflineSyncWatcher } from "./lib/OfflineSyncManager"; // ✅ import the sync watcher

export default function Layout() {
  useEffect(() => {
    // ✅ Initialize offline sync globally
    initOfflineSyncWatcher();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="teacher/index" options={{ headerShown: false }} />
        <Stack.Screen name="staff/index" options={{ headerShown: false }} />
        <Stack.Screen name="student/index" options={{ headerShown: false }} />
        <Stack.Screen name="student/quizzes/QuizTake" options={{ headerShown: false }} />
        <Stack.Screen name="student/quizzes/QuizResult" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}