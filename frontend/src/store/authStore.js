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

async function registerPushToken() {
  try {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "544c2015-7cf0-4794-a774-b12e84b543a2",
    });

    await api.patch("/users/me/push-token", { pushToken: token });

    console.log("✅ Push token registered:", token);
  } catch (err) {
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

    registerPushToken();
  },

  // ================= SET USER ================= ← ADD THIS
  // Called after self-upload (profile photo / id proof)
  // Updates user in state AND persists to AsyncStorage
  setUser: async (updatedUser) => {
    const permissions = extractPermissions(updatedUser);

    // Persist updated user to AsyncStorage so it survives app restart
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

    set({
      user: updatedUser,
      permissions: [...new Set(permissions)],
    });
  },

  // ================= LOGOUT =================
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
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

        registerPushToken();
        return;
      }

      set({ user: null, token: null, permissions: [], loading: false });
    } catch (error) {
      set({ user: null, token: null, permissions: [], loading: false });
    }
  },
}));