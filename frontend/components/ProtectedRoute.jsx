import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const token = await AsyncStorage.getItem("token");
      const role = await AsyncStorage.getItem("role");

      // Not logged in
      if (!token || !role) {
        router.replace("/");
        return;
      }

      // Role not allowed
      if (!allowedRoles.includes(role)) {
        router.replace("/");
        return;
      }

      setAuthorized(true);
    };

    checkAccess();
  }, []);

  if (authorized === null) return null;

  return children;
}