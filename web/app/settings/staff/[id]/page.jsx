// src/app/settings/staff/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "../../../../src/store/authStore";
import { can } from "../../../../src/config/permissionMap";
import StaffDetailScreen from "../../../../src/components/settings/staff/StaffDetailScreen";
import { fetchUsers } from "../../../../src/api/userApi";

export default function StaffDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions = useAuthStore((s) => s.permissions) || [];

  const canView = can(permissions, "attendance.view.staff_history") ||
    can(permissions, "staff.view");

  const [staffUser, setStaffUser] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!canView) { router.replace("/settings/staff"); return; }
  }, [user, loading, _hasHydrated, canView]);

  // ── Fetch staff user ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated || loading || !user || !canView || !id) return;

    (async () => {
      try {
        setFetchLoading(true);
        const all = await fetchUsers();
        const found = Array.isArray(all)
          ? all.find((u) => String(u.id) === String(id))
          : null;
        if (!found) throw new Error("User not found");
        setStaffUser(found);
      } catch {
        setFetchError("Failed to load staff member.");
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [_hasHydrated, loading, user, canView, id]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!_hasHydrated || loading || fetchLoading) return null;
  if (!user || !canView) return null;

  if (fetchError) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ color: "#E57373", fontSize: 14 }}>{fetchError}</p>
      </div>
    );
  }

  return <StaffDetailScreen user={staffUser} />;
}