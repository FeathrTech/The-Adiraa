// src/app/sites/create/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/authStore";
import {
  canAccessScreen,
  SCREEN_ACCESS,
} from "../../../src/config/permissionMap";
import CreateSiteScreen from "../../../src/components/sites/CreateSiteScreen";

export default function CreateSitePage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const loading      = useAuthStore((s) => s.loading);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // Uses SCREEN_ACCESS.CreateSite → allOf: ["site.create"]
  const canCreate = canAccessScreen(permissions, SCREEN_ACCESS.CreateSite);

  useEffect(() => {
    if (!_hasHydrated || loading) return;
    if (!user)      { router.replace("/login");   return; }
    if (!canCreate) { router.replace("/sites");          }
  }, [user, loading, _hasHydrated, canCreate, router]);

  if (!_hasHydrated || loading) return null;
  if (!user || !canCreate)      return null;

  return <CreateSiteScreen />;
}