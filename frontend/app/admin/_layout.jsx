import { Stack } from "expo-router";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
