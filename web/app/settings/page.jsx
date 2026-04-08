"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../src/store/authStore";
import SettingsScreen from "../../src/components/settings/SettingsScreen";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions = useAuthStore((s) => s.permissions) || [];

  const canAccessSettings = permissions.some((p) =>
    p.startsWith("settings.")
  );

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessSettings) {
      router.replace("/dashboard");
    }
  }, [user, loading, _hasHydrated, canAccessSettings]);

  // Still restoring session
  if (!_hasHydrated || loading) return null;

  // No user or no permission
  if (!user || !canAccessSettings) return null;

  return <SettingsScreen />;
}