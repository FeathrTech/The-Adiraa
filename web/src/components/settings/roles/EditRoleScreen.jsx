// src/components/settings/roles/EditRoleScreen.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchPermissions } from "../../../api/permissionApi";
import { updateRole, fetchRoleById } from "../../../api/roleApi";
import { PERMISSION_GROUPS } from "../../../config/permissionMap";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  inputBg: "#1C1C1C",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  red: "#E57373",
  green: "#81C784",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
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

function EditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function SaveIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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

function XIcon({ size = 16 }) {
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
  const isSuccess = toast.type === "success";

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

        {/* Progress bar + close */}
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

// ─── Main EditRoleScreen ──────────────────────────────────────────────────────
export default function EditRoleScreen() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id;

  const [roleNameInput, setRoleNameInput] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [initialRoleName, setInitialRoleName] = useState("");
  const [initialPermissions, setInitialPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeToast = () => setToast(null);

  // ── Load role + permissions ────────────────────────────────────────────────
  useEffect(() => {
    if (!roleId) return;
    load();
  }, [roleId]);

  const load = async () => {
    try {
      setLoading(true);
      const [allPermissions, roleDetails] = await Promise.all([
        fetchPermissions(),
        fetchRoleById(roleId),
      ]);
      setPermissions(allPermissions);
      const perms = (roleDetails.permissions || []).map((p) => p.id);
      setRoleNameInput(roleDetails.name);
      setInitialRoleName(roleDetails.name);
      setSelectedPermissions(perms);
      setInitialPermissions(perms);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to load role",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const togglePermission = (id) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (groupKeys) => {
    const groupIds = permissions
      .filter((p) => groupKeys.includes(p.key))
      .map((p) => p.id);
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

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!roleNameInput.trim()) {
      showToast("Role name is required", "error");
      return;
    }
    if (!selectedPermissions.length) {
      showToast("Select at least one permission", "error");
      return;
    }
    try {
      setSaving(true);
      await updateRole(roleId, {
        name: roleNameInput.trim(),
        permissionIds: selectedPermissions,
      });
      showToast("Role updated successfully");
      setTimeout(() => router.push("/settings/roles"), 1800);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update role",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // ── Derived state ──────────────────────────────────────────────────────────
  const allSelected = selectedPermissions.length === permissions.length;
  const selectedCount = selectedPermissions.length;
  const totalCount = permissions.length;

  const nameChanged = roleNameInput.trim() !== initialRoleName.trim();
  const permissionsChanged =
    selectedPermissions.length !== initialPermissions.length ||
    !selectedPermissions.every((id) => initialPermissions.includes(id));
  const canSave = !saving && roleNameInput.trim() &&
    (nameChanged || permissionsChanged);

  const nameBorderColor = nameFocused ? C.gold : C.border;

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
            <div className="flex-1 min-w-0 mr-3">
              <p
                className="text-[11px] sm:text-xs font-bold tracking-[3px]
                  uppercase mb-1"
                style={{ color: C.gold }}
              >
                Role Management
              </p>
              <h1
                className="font-extrabold tracking-tight leading-none truncate"
                style={{
                  color: C.white,
                  fontSize: "clamp(22px, 5vw, 40px)",
                }}
              >
                {roleNameInput || "Edit Role"}
              </h1>
            </div>

            {/* Badge + back */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Live count badge */}
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
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: 32, height: 32,
                  backgroundColor: "rgba(201,162,39,0.12)",
                  borderTop: `1px solid ${C.borderGold}`,
                  borderRight: `1px solid ${C.borderGold}`,
                  borderBottom: `1px solid ${C.borderGold}`,
                  borderLeft: `1px solid ${C.borderGold}`,
                  color: C.gold,
                }}
              >
                <EditIcon size={14} />
              </div>
              <span className="font-bold text-sm sm:text-base"
                style={{ color: C.white }}>
                Role Name
              </span>
              <span style={{ color: C.red, fontWeight: "800" }}>*</span>
            </div>

            <p className="text-xs mb-3 ml-10" style={{ color: C.muted }}>
              Edit the display name for this role
            </p>

            <input
              type="text"
              value={roleNameInput}
              onChange={(e) => setRoleNameInput(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Event Manager"
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
              borderBottom: `1px solid ${allSelected
                ? C.borderGold : C.border}`,
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
                    ? "rgba(201,162,39,0.15)" : C.faint,
                  borderTop: `1px solid ${allSelected
                    ? C.borderGold : C.border}`,
                  borderRight: `1px solid ${allSelected
                    ? C.borderGold : C.border}`,
                  borderBottom: `1px solid ${allSelected
                    ? C.borderGold : C.border}`,
                  borderLeft: `1px solid ${allSelected
                    ? C.borderGold : C.border}`,
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
                {/* Group header */}
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

                {/* Individual permissions */}
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
                        className="flex items-center justify-between px-4 py-3
                          transition-colors duration-100"
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

          {/* ── Divider + Save Button ── */}
          <div className="mt-5 mb-4"
            style={{ height: 1, backgroundColor: C.border }} />

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center justify-center gap-2 w-full
              rounded-2xl py-4 sm:py-5 font-bold text-sm tracking-wide
              uppercase transition-all duration-150 hover:brightness-110
              active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSave ? C.gold : C.faint,
              color: canSave ? "#000" : C.muted,
              opacity: canSave ? 1 : 0.6,
            }}
          >
            {saving ? (
              <>
                <Spinner size={18} />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon />
                Save Changes
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