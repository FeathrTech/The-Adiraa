// src/app/dashboard/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../src/store/authStore";
import { can } from "../../src/config/permissionMap";
import NoAccessScreen from "../../src/components/NoAccessScreen";
import DashboardScreen from "../../src/components/DashboardScreen";
import StaffDashboardScreen from "../../src/components/StaffDashboardScreen";

export default function DashboardPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  const isAdmin = can(permissions, "dashboard.view");
  const isStaff =
    can(permissions, "attendance.checkin") ||
    can(permissions, "attendance.checkout");

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) { router.replace("/login"); }
  }, [user, loading, _hasHydrated, router]);

  if (!_hasHydrated || loading) return null;
  if (!user)                    return null;

  // No permission at all
  if (!isAdmin && !isStaff) return <NoAccessScreen />;

  // Admin takes priority — staff who are also admins see admin dashboard
  if (isAdmin) return <DashboardScreen />;

  // Pure staff — see staff dashboard
  return <StaffDashboardScreen />;
}