// src/app/sites/[siteId]/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../../src/config/permissionMap";
import VenueDetailsScreen from "../../../src/components/sites/VenueDetailsScreen";

export default function SiteDetailPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // Uses SCREEN_ACCESS.SiteDetail → anyOf: ["site.view", "site.edit"]
  const canView = canAccessScreen(permissions, SCREEN_ACCESS.SiteDetail);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)    { router.replace("/login"); return; }
    if (!canView) { router.replace("/sites"); return; }
  }, [user, loading, _hasHydrated, canView, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canView)        return null;

  return <VenueDetailsScreen />;
}