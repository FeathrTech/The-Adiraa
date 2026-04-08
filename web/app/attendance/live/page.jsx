// src/app/attendance/live/page.jsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../../src/config/permissionMap";
import LiveAttendanceMonitoring from
  "../../../src/components/attendance/LiveAttendanceMonitoring";

// ─── Inner (useSearchParams requires Suspense boundary) ───────────────────────
function LiveAttendancePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter") || "all";

  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // ── Single permission check for ALL filters including "report" ─────────────
  // SCREEN_ACCESS.LiveAttendance → allOf: ["attendance.view.live_status"]
  const canAccess = canAccessScreen(permissions, SCREEN_ACCESS.LiveAttendance);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)      { router.replace("/login");      return; }
    if (!canAccess) { router.replace("/attendance"); }
  }, [user, loading, _hasHydrated, canAccess, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canAccess)      return null;

  return <LiveAttendanceMonitoring filter={filter} />;
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function LiveAttendancePage() {
  return (
    <Suspense fallback={null}>
      <LiveAttendancePageInner />
    </Suspense>
  );
}