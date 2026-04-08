"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../../src/store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../../src/config/permissionMap";
import CreateRoleScreen from
  "../../../../src/components/settings/roles/CreateRoleScreen";

export default function CreateRolePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions = useAuthStore((s) => s.permissions) || [];

  const canCreate = can(permissions, ACTION_PERMISSIONS.role.create);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!canCreate) { router.replace("/settings/roles"); }
  }, [user, loading, _hasHydrated, canCreate]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canCreate) return null;

  return <CreateRoleScreen />;
}