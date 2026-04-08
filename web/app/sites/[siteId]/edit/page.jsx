// src/app/sites/[siteId]/edit/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../../src/store/authStore";
import { canAccessScreen, SCREEN_ACCESS } from "../../../../src/config/permissionMap";
import EditVenueScreen from "../../../../src/components/sites/EditVenueScreen";

export default function EditSitePage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // Uses SCREEN_ACCESS.EditSite → allOf: ["site.edit"]
  const canEdit = canAccessScreen(permissions, SCREEN_ACCESS.EditSite);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login");        return; }
    if (!canEdit) { router.replace("/sites");        return; }
  }, [user, loading, _hasHydrated, canEdit, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canEdit)        return null;

  return <EditVenueScreen />;
}