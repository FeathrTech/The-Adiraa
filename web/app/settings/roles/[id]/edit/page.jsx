"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "../../../../../src/store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../../../src/config/permissionMap";
import EditRoleScreen from
  "../../../../../src/components/settings/roles/EditRoleScreen";

export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions = useAuthStore((s) => s.permissions) || [];

  const canEdit = can(
    permissions,
    ACTION_PERMISSIONS.role.assignPermissions
  );

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!canEdit) { router.replace("/settings/roles"); }
  }, [user, loading, _hasHydrated, canEdit]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canEdit) return null;

  return <EditRoleScreen />;
}