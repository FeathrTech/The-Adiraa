// src/store/authStore.js

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { setAuthToken } from "../utils/setAuthToken";
import api from "../api/axios";

const extractPermissions = (user) => {
  return (
    user?.roles?.flatMap((role) =>
      role?.permissions?.map((perm) => perm.key)
    ) || []
  );
};

// ─── Register push token and save to backend ─────────────────────────────────
// Called after login and on session restore.
// Safe to call multiple times — silently skips on emulators or if denied.
async function registerPushToken() {
  try {
    if (!Device.isDevice) return; // emulator — skip

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "544c2015-7cf0-4794-a774-b12e84b543a2", // from app.json extra.eas.projectId
    });

    await api.patch("/users/me/push-token", { pushToken: token });

    console.log("✅ Push token registered:", token);
  } catch (err) {
    // Non-fatal — app works fine without push tokens
    console.warn("Push token registration failed:", err?.message);
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  permissions: [],
  loading: true,

  // ================= LOGIN =================
  login: async (user, token) => {
    const permissions = extractPermissions(user);

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    setAuthToken(token);

    set({
      user,
      token,
      permissions: [...new Set(permissions)],
      loading: false,
    });

    // Register push token after login — fire and forget
    registerPushToken();
  },

  // ================= LOGOUT =================
  // ================= LOGOUT =================
  logout: async () => {
    try {
      // Tell backend to clear pushToken and delete the session
      await api.post("/auth/logout");
    } catch (err) {
      // Non-fatal — proceed with local logout regardless
      console.warn("Logout API failed:", err?.message);
    }

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    setAuthToken(null);

    set({
      user: null,
      token: null,
      permissions: [],
      loading: false,
    });
  },

  // ================= RESTORE =================
  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (token && userString) {
        const user = JSON.parse(userString);
        const permissions = extractPermissions(user);

        setAuthToken(token);

        set({
          user,
          token,
          permissions: [...new Set(permissions)],
          loading: false,
        });

        // Re-register on every app open — token can rotate
        registerPushToken();

        return;
      }

      set({
        user: null,
        token: null,
        permissions: [],
        loading: false,
      });
    } catch (error) {
      set({
        user: null,
        token: null,
        permissions: [],
        loading: false,
      });
    }
  },
}));