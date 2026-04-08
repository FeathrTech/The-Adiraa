"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../src/config/permissionMap";
import RoleListScreen from "../../../src/components/settings/roles/RoleListScreen";

export default function RolesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions = useAuthStore((s) => s.permissions) || [];

  const canView = can(permissions, "role.view");

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!canView) { router.replace("/settings"); }
  }, [user, loading, _hasHydrated, canView]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canView) return null;

  return <RoleListScreen />;
}