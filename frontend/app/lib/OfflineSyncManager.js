// lib/OfflineSyncManager.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import api from "./axios"; // your existing Axios instance

export default {};

const QUEUE_KEY = "offline_sync_queue";

/**
 * Add a failed request to the offline queue
 */
export async function queueRequest(endpoint, method = "POST", data = {}) {
  try {
    const existingQueue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
    existingQueue.push({
      endpoint,
      method,
      data,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
    console.log("📦 Queued offline request:", endpoint);
  } catch (error) {
    console.error("Error queueing request:", error);
  }
}

/**
 * Try syncing queued requests when online
 */
export async function syncQueuedRequests() {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
    if (queue.length === 0) {
      console.log("✅ No queued requests to sync.");
      return;
    }

    console.log(`🌐 Syncing ${queue.length} queued requests...`);

    const successful = [];

    for (const req of queue) {
      try {
        await api({
          url: req.endpoint,
          method: req.method,
          data: req.data,
        });
        successful.push(req);
      } catch (err) {
        console.error(`❌ Failed to sync request ${req.endpoint}:`, err.message);
      }
    }

    // Keep only failed ones
    const failed = queue.filter((req) => !successful.includes(req));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));

    console.log(`✅ Synced ${successful.length}, remaining ${failed.length}`);
  } catch (error) {
    console.error("Error syncing requests:", error);
  }
}

/**
 * Monitor internet connection and trigger sync automatically
 */
export function initOfflineSyncWatcher() {
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log("🌍 Online again! Starting sync...");
      syncQueuedRequests();
    } else {
      console.log("📴 Offline mode — requests will be queued.");
    }
  });
}