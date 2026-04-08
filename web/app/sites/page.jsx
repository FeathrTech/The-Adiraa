// src/app/sites/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../src/config/permissionMap";
import VenueScreen from
  "../../src/components/sites/VenueScreen";

export default function SitesPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // Uses SCREEN_ACCESS.SiteList → allOf: ["site.view"]
  const canView = canAccessScreen(permissions, SCREEN_ACCESS.SiteList);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login");     return; }
    if (!canView) { router.replace("/dashboard"); }
  }, [user, loading, _hasHydrated, canView, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canView)        return null;

  return <VenueScreen />;
}