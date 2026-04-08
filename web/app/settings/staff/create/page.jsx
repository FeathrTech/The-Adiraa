"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../../src/store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../../src/config/permissionMap";
import CreateStaffScreen from "../../../../src/components/settings/staff/CreateStaffScreen";

export default function CreateStaffPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  const canCreate = can(permissions, ACTION_PERMISSIONS.staff.create);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)      { router.replace("/login");          return; }
    if (!canCreate) { router.replace("/settings/staff"); return; }
  }, [user, loading, _hasHydrated, canCreate]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canCreate)      return null;

  return <CreateStaffScreen />;
}