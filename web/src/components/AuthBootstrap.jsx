"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

// Renders nothing — just bootstraps auth on every page load
export default function AuthBootstrap() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return null;
}