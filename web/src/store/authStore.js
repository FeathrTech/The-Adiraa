// src/store/authStore.js (web)
"use client";

import { create } from "zustand";
import { setAuthToken } from "../utils/setAuthToken";
import api from "../api/axios";

// ─── Extract permissions from roles ───────────────────────────────────────────
const extractPermissions = (user) => {
  return (
    user?.roles?.flatMap((role) =>
      role?.permissions?.map((perm) => perm.key)
    ) || []
  );
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  permissions: [],
  loading: true,
  _hasHydrated: false,

  // ================= LOGIN =================
  login: async (user, token) => {
    try {
      const permissions = extractPermissions(user);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthToken(token);

      set({
        user,
        token,
        permissions: [...new Set(permissions)],
        loading: false,
        _hasHydrated: true,
      });
    } catch (err) {
      console.error("Login error:", err);
    }
  },

  // ================= SET USER =================
  setUser: async (updatedUser) => {
    try {
      const permissions = extractPermissions(updatedUser);

      localStorage.setItem("user", JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        permissions: [...new Set(permissions)],
      });
    } catch (err) {
      console.error("Set user error:", err);
    }
  },

  // ================= LOGOUT =================
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout API failed:", err?.message);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setAuthToken(null);

    set({
      user: null,
      token: null,
      permissions: [],
      loading: false,
      _hasHydrated: true,
    });
  },

  // ================= RESTORE SESSION =================
  // Mirrors React Native restoreSession exactly —
  // reads from localStorage, no server call needed
  restoreSession: async () => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (token && userString) {
        const user = JSON.parse(userString);
        const permissions = extractPermissions(user);

        setAuthToken(token);

        set({
          user,
          token,
          permissions: [...new Set(permissions)],
          loading: false,
          _hasHydrated: true,
        });

        return;
      }

      // No stored session
      set({
        user: null,
        token: null,
        permissions: [],
        loading: false,
        _hasHydrated: true,
      });
    } catch (error) {
      console.error("Restore session error:", error);

      set({
        user: null,
        token: null,
        permissions: [],
        loading: false,
        _hasHydrated: true,
      });
    }
  },
}));