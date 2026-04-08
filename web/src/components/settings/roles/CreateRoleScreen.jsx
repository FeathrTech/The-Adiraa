// src/components/settings/roles/CreateRoleScreen.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRole, assignPermissions } from "../../../api/roleApi";
import { fetchPermissions } from "../../../api/permissionApi";
import { useAuthStore } from "../../../store/authStore";
import { PERMISSION_GROUPS, can } from "../../../config/permissionMap";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  inputBg: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  red: "#E57373",
  green: "#81C784",
};

const ROLE_NAME_MAX = 50;
const ROLE_NAME_MIN = 2;

// ─── Icons ────────────────────────────────────────────────────────────────────
function ShieldIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ShieldHalfIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3v17z" fill="currentColor"
        fillOpacity="0.15" />
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ListIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function CheckAllIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="1 12 5 16 13 8" />
      <polyline points="9 12 13 16 21 8" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
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

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-all duration-200
        focus:outline-none"
      style={{
        width: 44,
        height: 24,
        backgroundColor: checked ? "rgba(201,162,39,0.45)" : C.faint,
        borderTop: `1px solid ${checked ? C.borderGold : C.border}`,
        borderRight: `1px solid ${checked ? C.borderGold : C.border}`,
        borderBottom: `1px solid ${checked ? C.borderGold : C.border}`,
        borderLeft: `1px solid ${checked ? C.borderGold : C.border}`,
      }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all duration-200"
        style={{
          width: 20,
          height: 20,
          backgroundColor: checked ? C.gold : C.muted,
          left: checked ? "calc(100% - 22px)" : "2px",
        }}
      />
    </button>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1"
        style={{ height: 1, backgroundColor: C.border }} />
      <span
        className="text-[10px] sm:text-xs font-semibold tracking-[2.5px]
          uppercase"
        style={{ color: C.muted }}
      >
        {label}
      </span>
      <div className="flex-1"
        style={{ height: 1, backgroundColor: C.border }} />
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

// ─── Main CreateRoleScreen ────────────────────────────────────────────────────
export default function CreateRoleScreen() {
  const router = useRouter();
  const userPermissions = useAuthStore((s) => s.permissions);

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [nameFocused, setNameFocused] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeToast = () => setToast(null);

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    try {
      const data = await fetchPermissions();
      setPermissions(data);
    } catch (err) {
      showToast("Failed to load permissions", "error");
    } finally {
      setLoadingPerms(false);
    }
  };

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const togglePermission = (id) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (groupKeys) => {
    const groupPerms = permissions.filter((p) => groupKeys.includes(p.key));
    const groupIds = groupPerms.map((p) => p.id);
    const allSel = groupIds.every((id) => selectedPermissions.includes(id));
    if (allSel) {
      setSelectedPermissions((prev) =>
        prev.filter((id) => !groupIds.includes(id))
      );
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupIds])]);
    }
  };

  const toggleAll = () => {
    const allIds = permissions.map((p) => p.id);
    setSelectedPermissions(
      selectedPermissions.length === allIds.length ? [] : allIds
    );
  };

  const formatLabel = (key) =>
    key.split(".").slice(1).join(" ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (roleName.trim().length < ROLE_NAME_MIN) {
      showToast(
        `Role name must be at least ${ROLE_NAME_MIN} characters`,
        "error"
      );
      return;
    }
    try {
      setLoading(true);
      const role = await createRole(roleName.trim());
      if (can(userPermissions, "role.assign_permissions")) {
        await assignPermissions(role.id, selectedPermissions);
      }
      showToast("Role created successfully");
      setTimeout(() => router.push("/settings/roles"), 1800);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to create role",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPerms) return <LoadingScreen />;

  const allSelected = selectedPermissions.length === permissions.length;
  const canSubmit = !loading && roleName.trim().length >= ROLE_NAME_MIN;
  const selectedCount = selectedPermissions.length;
  const totalCount = permissions.length;
  const nameLen = roleName.length;

  const nameCountColor =
    nameLen >= ROLE_NAME_MAX
      ? C.red
      : nameLen >= Math.floor(ROLE_NAME_MAX * 0.85)
        ? "#F97316"
        : C.muted;

  const nameBorderColor = nameFocused
    ? nameLen >= ROLE_NAME_MAX ? C.red : C.gold
    : nameLen >= ROLE_NAME_MAX
      ? "rgba(229,115,115,0.5)"
      : C.border;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease forwards; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
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
        className="min-h-screen px-4 py-6 sm:px-6 lg:px-10"
        style={{ backgroundColor: C.bg }}
      >
        <div className="max-w-2xl mx-auto animate-fadeIn">

          {/* ── Header ── */}
          <div className="flex items-start sm:items-end justify-between mb-5">
            <div>
              <p
                className="text-[11px] sm:text-xs font-bold tracking-[3px]
                  uppercase mb-1"
                style={{ color: C.gold }}
              >
                Role Management
              </p>
              <h1
                className="font-extrabold tracking-tight leading-none"
                style={{
                  color: C.white,
                  fontSize: "clamp(26px, 5vw, 42px)",
                }}
              >
                Create Role
              </h1>
            </div>

            {/* Badge + back */}
            <div className="flex items-center gap-2 mt-1">
              {/* Live permission count badge */}
              <div
                className="flex flex-col items-center rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: selectedCount > 0
                    ? "rgba(201,162,39,0.12)"
                    : C.faint,
                  borderTop: `1px solid ${selectedCount > 0
                    ? C.borderGold : C.border}`,
                  borderRight: `1px solid ${selectedCount > 0
                    ? C.borderGold : C.border}`,
                  borderBottom: `1px solid ${selectedCount > 0
                    ? C.borderGold : C.border}`,
                  borderLeft: `1px solid ${selectedCount > 0
                    ? C.borderGold : C.border}`,
                }}
              >
                <span
                  className="font-bold text-xs leading-tight"
                  style={{ color: selectedCount > 0 ? C.gold : C.muted }}
                >
                  {selectedCount}/{totalCount}
                </span>
                <span className="text-[9px] tracking-wider uppercase"
                  style={{ color: C.muted }}>
                  perms
                </span>
              </div>

              {/* Back button */}
              <button
                onClick={() => router.push("/settings/roles")}
                className="flex items-center gap-2 rounded-xl px-3 py-2
                  sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                  transition-all duration-150 hover:brightness-110
                  active:scale-[0.97]"
                style={{
                  backgroundColor: C.card,
                  borderTop: `1px solid ${C.borderGold}`,
                  borderRight: `1px solid ${C.borderGold}`,
                  borderBottom: `1px solid ${C.borderGold}`,
                  borderLeft: `1px solid ${C.borderGold}`,
                  color: C.gold,
                }}
              >
                <ArrowLeftIcon />
                <span className="hidden sm:inline">Roles</span>
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mb-5"
            style={{ height: 1, backgroundColor: C.border }} />

          {/* ── Role Name Card ── */}
          <div
            className="rounded-2xl p-4 sm:p-5 mb-2 animate-slideUp"
            style={{
              backgroundColor: C.card,
              borderTop: `1px solid ${C.borderGold}`,
              borderRight: `1px solid ${C.borderGold}`,
              borderBottom: `1px solid ${C.borderGold}`,
              borderLeft: `1px solid ${C.borderGold}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1"
              style={{ color: C.gold }}>
              <ShieldIcon size={16} />
              <span className="font-bold text-sm sm:text-base"
                style={{ color: C.white }}>
                Role Name
              </span>
            </div>
            <p className="text-xs mb-3 ml-6" style={{ color: C.muted }}>
              Give this role a clear, descriptive name
            </p>

            <input
              type="text"
              placeholder="e.g. Event Manager"
              value={roleName}
              maxLength={ROLE_NAME_MAX}
              onChange={(e) => {
                if (e.target.value.length <= ROLE_NAME_MAX) {
                  setRoleName(e.target.value);
                }
              }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className="w-full rounded-xl px-4 py-3 text-sm sm:text-base
                outline-none transition-all duration-150"
              style={{
                backgroundColor: C.inputBg,
                borderTop: `1px solid ${nameBorderColor}`,
                borderRight: `1px solid ${nameBorderColor}`,
                borderBottom: `1px solid ${nameBorderColor}`,
                borderLeft: `1px solid ${nameBorderColor}`,
                color: C.white,
                caretColor: C.gold,
              }}
            />

            {/* Char counter + min hint */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: C.red }}>
                {nameLen > 0 && nameLen < ROLE_NAME_MIN
                  ? `Minimum ${ROLE_NAME_MIN} characters required`
                  : ""}
              </span>
              <span className="text-xs font-medium"
                style={{ color: nameCountColor }}>
                {nameLen}/{ROLE_NAME_MAX}
              </span>
            </div>
          </div>

          <SectionDivider label="Permissions" />

          {/* ── Select All Row ── */}
          <div
            className="flex items-center justify-between rounded-2xl
              px-4 py-3.5 sm:py-4 mb-3 animate-slideUp"
            style={{
              backgroundColor: C.card,
              borderTop: `1px solid ${allSelected ? C.borderGold : C.border}`,
              borderRight: `1px solid ${allSelected ? C.borderGold : C.border}`,
              borderBottom: `1px solid ${allSelected ? C.borderGold : C.border}`,
              borderLeft: `1px solid ${allSelected ? C.borderGold : C.border}`,
              animationDelay: "60ms",
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: 38, height: 38,
                  backgroundColor: allSelected
                    ? "rgba(201,162,39,0.15)"
                    : C.faint,
                  borderTop: `1px solid ${allSelected ? C.borderGold : C.border}`,
                  borderRight: `1px solid ${allSelected ? C.borderGold : C.border}`,
                  borderBottom: `1px solid ${allSelected ? C.borderGold : C.border}`,
                  borderLeft: `1px solid ${allSelected ? C.borderGold : C.border}`,
                  color: allSelected ? C.gold : C.muted,
                }}
              >
                {allSelected
                  ? <CheckAllIcon size={16} />
                  : <ListIcon size={16} />}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-sm sm:text-base leading-tight"
                  style={{ color: C.white }}>
                  Select All Permissions
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {selectedCount} of {totalCount} selected
                </p>
              </div>
            </div>

            <Toggle checked={allSelected} onChange={toggleAll} />
          </div>

          {/* ── Permission Groups ── */}
          {Object.entries(PERMISSION_GROUPS).map(([groupName, groupKeys], gi) => {
            const groupPerms = permissions.filter((p) =>
              groupKeys.includes(p.key)
            );
            if (groupPerms.length === 0) return null;

            const groupIds = groupPerms.map((p) => p.id);
            const groupAllSel = groupIds.every((id) =>
              selectedPermissions.includes(id)
            );
            const groupSomeSel = groupIds.some((id) =>
              selectedPermissions.includes(id)
            );
            const groupCount = groupIds.filter((id) =>
              selectedPermissions.includes(id)
            ).length;

            const headerBorderColor = groupAllSel
              ? C.borderGold
              : groupSomeSel
                ? "rgba(201,162,39,0.2)"
                : C.border;

            return (
              <div
                key={groupName}
                className="mb-3 animate-slideUp"
                style={{ animationDelay: `${(gi + 2) * 50}ms` }}
              >
                {/* ── Group header ── */}
                <div
                  className="flex items-center justify-between
                    rounded-t-2xl px-4 py-3.5"
                  style={{
                    backgroundColor: C.card,
                    borderTop: `1px solid ${headerBorderColor}`,
                    borderLeft: `1px solid ${headerBorderColor}`,
                    borderRight: `1px solid ${headerBorderColor}`,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="flex items-center justify-center rounded-xl
                        shrink-0"
                      style={{
                        width: 36, height: 36,
                        backgroundColor: groupAllSel
                          ? "rgba(201,162,39,0.15)"
                          : groupSomeSel
                            ? "rgba(201,162,39,0.08)"
                            : C.faint,
                        borderTop: `1px solid ${headerBorderColor}`,
                        borderRight: `1px solid ${headerBorderColor}`,
                        borderBottom: `1px solid ${headerBorderColor}`,
                        borderLeft: `1px solid ${headerBorderColor}`,
                        color: groupAllSel
                          ? C.gold
                          : groupSomeSel ? C.goldLight : C.muted,
                      }}
                    >
                      <ShieldHalfIcon size={16} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm sm:text-base
                          leading-tight truncate"
                        style={{ color: C.white }}
                      >
                        {groupName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {groupCount} of {groupIds.length} selected
                      </p>
                    </div>
                  </div>

                  <Toggle
                    checked={groupAllSel}
                    onChange={() => toggleGroup(groupKeys)}
                  />
                </div>

                {/* ── Individual permissions ── */}
                <div
                  className="rounded-b-2xl overflow-hidden"
                  style={{
                    backgroundColor: C.cardAlt,
                    borderTop: "none",
                    borderLeft: `1px solid ${C.border}`,
                    borderRight: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {groupPerms.map((perm, idx) => {
                    const isOn = selectedPermissions.includes(perm.id);
                    const isLast = idx === groupPerms.length - 1;

                    return (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between
                          px-4 py-3 transition-colors duration-100"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : `1px solid ${C.border}`,
                          backgroundColor: isOn
                            ? "rgba(201,162,39,0.04)"
                            : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1
                          min-w-0">
                          <div
                            className="rounded-full shrink-0 transition-colors
                              duration-150"
                            style={{
                              width: 8, height: 8,
                              backgroundColor: isOn ? C.gold : C.faint,
                            }}
                          />
                          <span
                            className="text-xs sm:text-sm truncate
                              transition-colors duration-150"
                            style={{
                              color: isOn ? C.white : C.muted,
                              fontWeight: isOn ? "600" : "400",
                            }}
                          >
                            {formatLabel(perm.key)}
                          </span>
                        </div>

                        <Toggle
                          checked={isOn}
                          onChange={() => togglePermission(perm.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Divider + Create Button ── */}
          <div className="mt-5 mb-4"
            style={{ height: 1, backgroundColor: C.border }} />

          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 w-full
              rounded-2xl py-4 sm:py-5 font-bold text-sm tracking-wide
              uppercase transition-all duration-150 hover:brightness-110
              active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSubmit ? C.gold : C.faint,
              color: canSubmit ? "#000" : C.muted,
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {loading ? (
              <>
                <Spinner size={18} />
                Creating...
              </>
            ) : (
              <>
                <PlusCircleIcon />
                Create Role
              </>
            )}
          </button>

          {/* ── Powered By ── */}
          <div className="flex items-center justify-center gap-2 mt-8">
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