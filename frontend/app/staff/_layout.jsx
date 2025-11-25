import { Stack } from "expo-router";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function StaffLayout() {
  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
