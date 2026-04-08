// src/app/settings/staff/[id]/edit/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "../../../../../src/store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../../../src/config/permissionMap";
import EditStaffScreen from "../../../../../src/components/settings/staff/EditStaffScreen";
import { fetchUsers } from "../../../../../src/api/userApi"; // ← use what actually exists

export default function EditStaffPage() {
  const router       = useRouter();
  const { id }       = useParams();

  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  const canEdit = can(permissions, ACTION_PERMISSIONS.staff.edit);

  const [staffUser,    setStaffUser]    = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login");          return; }
    if (!canEdit) { router.replace("/settings/staff"); return; }
  }, [user, loading, _hasHydrated, canEdit]);

  // ── Fetch staff user by id ─────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated || loading || !user || !canEdit || !id) return;

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
  }, [_hasHydrated, loading, user, canEdit, id]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!_hasHydrated || loading || fetchLoading) return null;
  if (!user || !canEdit)                        return null;

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

  return <EditStaffScreen user={staffUser} />;
}