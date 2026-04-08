// src/components/settings/roles/RoleListScreen.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchRoles, deleteRole } from "../../../api/roleApi";
import { useRealtime } from "../../../hooks/useRealtime";
import { useAuthStore } from "../../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../config/permissionMap";
import { useRefreshOnFocus } from "../../../hooks/useRefreshOnFocus";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  red: "#E57373",
  green: "#81C784",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function ShieldIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function KeyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6M15.5 7.5L19 4M17 6l2-2" />
    </svg>
  );
}

function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function LockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <svg className="animate-spin" width={size} height={size}
      fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor"
        strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: C.bg }}
    >
      <Spinner size={36} />
      <p className="mt-4 text-xs tracking-[3px] font-semibold uppercase"
        style={{ color: C.muted }}>
        Loading
      </p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 72, height: 72,
          backgroundColor: C.faint,
          border: `1px solid ${C.border}`,
          color: C.muted,
        }}
      >
        <ShieldIcon size={32} />
      </div>
      <p className="font-bold text-base" style={{ color: C.white }}>
        No Roles Found
      </p>
      <p className="text-sm text-center" style={{ color: C.muted }}>
        Create your first role to get started
      </p>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({ item, userPermissions, onDelete, onEdit, delay = 0 }) {
  const isOwner = item.name === "Owner";

  return (
    <div
      className="animate-slideUp rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.borderGold}`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* ── Top row ── */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: 44, height: 44,
            backgroundColor: "rgba(201,162,39,0.12)",
            border: `1px solid ${C.borderGold}`,
            color: C.gold,
          }}
        >
          <ShieldIcon size={20} />
        </div>

        {/* Name + badge + permission count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm sm:text-base leading-tight"
              style={{ color: C.white }}>
              {item.name}
            </span>

            {/* Protected badge */}
            {isOwner && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-md
                  text-[10px] font-semibold"
                style={{
                  backgroundColor: "rgba(201,162,39,0.12)",
                  border: `1px solid ${C.borderGold}`,
                  color: C.gold,
                }}
              >
                <LockIcon size={10} />
                Protected
              </span>
            )}
          </div>

          {/* Permission count */}
          <div className="flex items-center gap-1 mt-0.5"
            style={{ color: C.muted }}>
            <KeyIcon size={12} />
            <span className="text-xs">
              {item.permissions?.length || 0} permission
              {item.permissions?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: C.border }} />

      {/* ── Action buttons — hidden for Owner ── */}
      {!isOwner && (
        <div className="flex items-center gap-2">
          {can(userPermissions, ACTION_PERMISSIONS.role.assignPermissions) && (
            <button
              onClick={() => onEdit(item.id)}
              className="flex-1 flex items-center justify-center gap-2
                rounded-xl py-2.5 font-semibold text-xs sm:text-sm
                transition-all duration-150 hover:brightness-110
                active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(201,162,39,0.1)",
                border: `1px solid ${C.borderGold}`,
                color: C.gold,
              }}
            >
              <KeyIcon size={14} />
              Manage Permissions
            </button>
          )}

          {can(userPermissions, ACTION_PERMISSIONS.role.delete) && (
            <button
              onClick={() => onDelete(item.id, item.name)}
              className="flex items-center justify-center gap-1.5
                rounded-xl py-2.5 px-4 font-semibold text-xs sm:text-sm
                transition-all duration-150 hover:brightness-110
                active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(229,115,115,0.1)",
                border: "1px solid rgba(229,115,115,0.35)",
                color: C.red,
              }}
            >
              <TrashIcon size={14} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Top Toast Popup ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div
      className="fixed top-5 left-1/2 z-50 animate-toastDrop"
      style={{ transform: "translateX(-50%)", minWidth: 320, maxWidth: "90vw" }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5
          shadow-2xl backdrop-blur-sm"
        style={{
          backgroundColor: isError
            ? "rgba(20,10,10,0.97)"
            : "rgba(10,14,10,0.97)",
          borderTop: `1px solid ${isError
            ? "rgba(229,115,115,0.5)"
            : "rgba(129,199,132,0.5)"}`,
          borderRight: `1px solid ${isError
            ? "rgba(229,115,115,0.5)"
            : "rgba(129,199,132,0.5)"}`,
          borderBottom: `1px solid ${isError
            ? "rgba(229,115,115,0.5)"
            : "rgba(129,199,132,0.5)"}`,
          borderLeft: `1px solid ${isError
            ? "rgba(229,115,115,0.5)"
            : "rgba(129,199,132,0.5)"}`,
          boxShadow: isError
            ? "0 8px 32px rgba(229,115,115,0.15), 0 2px 8px rgba(0,0,0,0.6)"
            : "0 8px 32px rgba(129,199,132,0.15), 0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: isError
              ? "rgba(229,115,115,0.15)"
              : "rgba(129,199,132,0.15)",
            color: isError ? C.red : C.green,
          }}
        >
          {isError ? <XCircleIcon /> : <CheckCircleIcon />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-0.5"
            style={{ color: isError ? C.red : C.green }}
          >
            {isError ? "Error" : "Success"}
          </p>
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: C.white }}
          >
            {toast.msg}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg shrink-0
            transition-all duration-150 hover:brightness-125 active:scale-95
            focus:outline-none"
          style={{
            width: 28,
            height: 28,
            backgroundColor: isError
              ? "rgba(229,115,115,0.1)"
              : "rgba(129,199,132,0.1)",
            color: isError ? C.red : C.green,
          }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="mt-1.5 rounded-full overflow-hidden mx-1"
        style={{ height: 3, backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full rounded-full animate-toastProgress"
          style={{
            backgroundColor: isError ? C.red : C.green,
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main RoleListScreen ──────────────────────────────────────────────────────
export default function RoleListScreen() {
  const router = useRouter();
  const userPermissions = useAuthStore((s) => s.permissions);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const canCreate = can(userPermissions, ACTION_PERMISSIONS.role.create);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeToast = () => setToast(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRoles();
      setRoles(data);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to load roles",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, []);

  // ── Refresh on tab focus / back nav ───────────────────────────────────────
  useRefreshOnFocus(loadRoles);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useRealtime("role:updated", loadRoles);
  useRealtime("role:created", loadRoles);
  useRealtime("role:deleted", loadRoles);

  // ── Pull-to-refresh equivalent ─────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoles();
    setRefreshing(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (roleId, roleName) => {
    if (roleName === "Owner") {
      showToast("Owner role cannot be deleted", "error");
      return;
    }

    const confirmed = window.confirm(
      `Delete role "${roleName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    (async () => {
      try {
        setDeletingId(roleId);
        await deleteRole(roleId);
        showToast("Role deleted successfully");
        loadRoles();
      } catch {
        showToast("Failed to delete role", "error");
      } finally {
        setDeletingId(null);
      }
    })();
  };

  if (loading) return <LoadingScreen />;

  // ── Decide layout: ≤3 roles → single col, >3 → 2-col grid ────────────────
  const useGrid = roles.length > 3;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease forwards; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease forwards; }

        @keyframes toastDrop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(4px) scale(1.01); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); }
        }
        .animate-toastDrop {
          animation: toastDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        .animate-toastProgress {
          animation: toastProgress 3.5s linear forwards;
        }
      `}</style>

      <Toast toast={toast} onClose={closeToast} />

      <div
        className="min-h-screen flex items-start justify-center
          px-4 py-8 sm:px-6 lg:px-10"
        style={{ backgroundColor: C.bg }}
      >
        {/* ── Centred column — width adapts to grid vs single ── */}
        <div
          className="w-full animate-fadeIn"
          style={{ maxWidth: useGrid ? "860px" : "520px" }}
        >

          {/* ── Header ── */}
          <div className="flex items-start sm:items-end justify-between mb-5">
            <div>
              <p
                className="text-[11px] sm:text-xs font-bold tracking-[3px]
                  uppercase mb-1"
                style={{ color: C.gold }}
              >
                Settings
              </p>
              <h1
                className="font-extrabold tracking-tight leading-none"
                style={{
                  color: C.white,
                  fontSize: "clamp(26px, 5vw, 42px)",
                }}
              >
                Roles
              </h1>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2 mt-1">
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2
                  sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                  transition-all duration-150 hover:brightness-110
                  active:scale-[0.97] disabled:opacity-50"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.borderGold}`,
                  color: C.gold,
                }}
              >
                {refreshing
                  ? <Spinner size={16} />
                  : <RefreshIcon />}
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              {/* Back */}
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 rounded-xl px-3 py-2
                  sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                  transition-all duration-150 hover:brightness-110
                  active:scale-[0.97]"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.borderGold}`,
                  color: C.gold,
                }}
              >
                <ArrowLeftIcon />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mb-5"
            style={{ height: 1, backgroundColor: C.border }} />

          {/* ── Create button (below header, full width) ── */}
          {canCreate && (
            <div className="mb-4 animate-fadeIn"
              style={{ animationDelay: "60ms" }}>
              <button
                onClick={() => router.push("/settings/roles/create")}
                className="flex items-center justify-center gap-2 w-full
                  rounded-2xl py-3.5 font-bold text-sm tracking-wide
                  uppercase transition-all duration-150 hover:brightness-110
                  active:scale-[0.98]"
                style={{
                  backgroundColor: C.gold,
                  color: "#000",
                }}
              >
                <PlusIcon />
                Create Role
              </button>
            </div>
          )}

          {/* ── Role list / grid ── */}
          {roles.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className={
                useGrid
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                  : "flex flex-col gap-3"
              }
            >
              {roles.map((role, i) => (
                <RoleCard
                  key={role.id}
                  item={role}
                  userPermissions={userPermissions}
                  onEdit={(id) =>
                    router.push(`/settings/roles/${id}/edit`)
                  }
                  onDelete={handleDelete}
                  delay={i * 50}
                />
              ))}
            </div>
          )}

          {/* ── Powered By ── */}
          <div className="flex items-center justify-center gap-2 mt-10
            animate-fadeIn" style={{ animationDelay: "300ms" }}>
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
            <span
              className="text-[10px] sm:text-[11px] font-medium
                tracking-widest"
              style={{ color: "rgba(201,162,39,0.5)" }}
            >
              POWERED BY FEATHRTECH
            </span>
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
          </div>

        </div>
      </div>
    </>
  );
}