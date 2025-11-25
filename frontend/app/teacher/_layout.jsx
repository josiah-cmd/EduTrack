import { Stack } from "expo-router";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function TeacherLayout() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
