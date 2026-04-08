// src/app/attendance/edit/page.jsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../../src/config/permissionMap";
import EditAttendanceRecord from
  "../../../src/components/attendance/EditAttendanceRecord";

// ─── Inner component ──────────────────────────────────────────────────────────
function EditAttendancePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // /attendance/edit?attendanceId=xxxx
  const attendanceId = searchParams.get("attendanceId");

  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // ── SCREEN_ACCESS.EditAttendance → anyOf: [edit, absent, present] ─────────
  const canAccess = canAccessScreen(permissions, SCREEN_ACCESS.EditAttendance);

  useEffect(() => {
    if (!_hasHydrated || loading) return;

    // Not logged in
    if (!user) {
      router.replace("/login");
      return;
    }

    // No attendanceId in query string → back to list
    if (!attendanceId) {
      router.replace("/attendance");
      return;
    }

    // Insufficient permissions
    if (!canAccess) {
      router.replace("/attendance");
    }

  }, [user, loading, _hasHydrated, canAccess, attendanceId, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canAccess || !attendanceId) return null;

  return <EditAttendanceRecord />;
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function EditAttendancePage() {
  return (
    <Suspense fallback={null}>
      <EditAttendancePageInner />
    </Suspense>
  );
}