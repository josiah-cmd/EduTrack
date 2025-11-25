import { Stack } from "expo-router";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function StudentLayout() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}