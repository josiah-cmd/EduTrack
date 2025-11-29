// app/lib/axios.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Use the Vercel environment variable + append /api
export const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_URL, // now uses your Render backend in production
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