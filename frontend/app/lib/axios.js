// app/lib/axios.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const API_URL = "http://192.168.0.102:8000/api";

const api = axios.create({
  baseURL: "http://192.168.0.102:8000/api", // ✅ your backend
});

// Attach token automatically
api.interceptors.request.use(async (config) => {
  try {
    const role = await AsyncStorage.getItem("role"); // who's logged in
    const token = await AsyncStorage.getItem(`${role}Token`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("❌ Axios interceptor error:", err.message);
  }
  return config;
});

export default api;