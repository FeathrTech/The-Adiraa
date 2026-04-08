// src/app/attendance/reports/page.jsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../../src/config/permissionMap";
import AttendanceReports from
  "../../../src/components/attendance/AttendanceReports";

// ─── Inner component ──────────────────────────────────────────────────────────
function AttendanceReportsPageInner() {
  const router = useRouter();

  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // ── Permission check ───────────────────────────────────────────────────────
  // Reuses the same dashboard_summary permission since reports
  // are an extension of the dashboard
  const canAccess = canAccessScreen(permissions, SCREEN_ACCESS.AttendanceDashboard);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)      { router.replace("/login");      return; }
    if (!canAccess) { router.replace("/attendance"); }
  }, [user, loading, _hasHydrated, canAccess, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canAccess)      return null;

  return <AttendanceReports />;
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function AttendanceReportsPage() {
  return (
    <Suspense fallback={null}>
      <AttendanceReportsPageInner />
    </Suspense>
  );
}