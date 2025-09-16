import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Layout() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="teacher/index" options={{ headerShown: false }} />
        <Stack.Screen name="staff/index" options={{ headerShown: false }} />
        <Stack.Screen name="student/index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}