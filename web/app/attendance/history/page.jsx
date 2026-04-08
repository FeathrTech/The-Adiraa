// src/app/attendance/history/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import StaffAttendanceHistory from "../../../src/components/attendance/StaffAttendanceHistory";

export default function AttendanceHistoryPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // attendance.view.own — direct permission check
  const canView = permissions.includes("attendance.view.own");

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login");     return; }
    if (!canView) { router.replace("/dashboard"); return; }
  }, [user, loading, _hasHydrated, canView, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canView)        return null;

  return <StaffAttendanceHistory />;
}