"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../src/store/authStore";
import { canAccessScreen, SCREEN_ACCESS } from "../../src/config/permissionMap";

export default function EventsPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  const canView = canAccessScreen(permissions, SCREEN_ACCESS.EventCalendar);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login");    return; }
    if (!canView) { router.replace("/settings"); return; }
    router.replace("/events/calendar");
  }, [user, loading, _hasHydrated, canView]);

  return null;
}