// src/components/settings/staff/StaffListScreen.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchUsers, deleteUser } from "../../../api/userApi";
import { useRealtime } from "../../../hooks/useRealtime";
import { useAuthStore } from "../../../store/authStore";
import { useRefreshOnFocus } from "../../../hooks/useRefreshOnFocus";

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
  green: "#5DBE8A",
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const isOwnerUser = (user) =>
  user?.roles?.some((r) => r.name?.toLowerCase() === "owner");

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function PlusIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg
      width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24"
      style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }}
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2
        19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.9 9.79
        19.79 19.79 0 01.86 1.15 2 2 0 012.84 0h3
        a2 2 0 012 1.72c.127.96.361 1.903.7 2.81
        a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6
        l1.27-1.27a2 2 0 012.11-.45
        c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function ShieldIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14
        a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3
        L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8
        a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function LockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="30" height="30" fill="none" stroke="currentColor"
      strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5
        a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
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

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18, color = C.gold }) {
  return (
    <svg
      width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  const progressRef = useRef(null);

  useEffect(() => {
    if (!toast || !progressRef.current) return;
    progressRef.current.style.transition = "none";
    progressRef.current.style.transform = "scaleX(1)";
    void progressRef.current.offsetWidth;
    progressRef.current.style.transition = "transform 3.5s linear";
    progressRef.current.style.transform = "scaleX(0)";
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const accent  = isError ? C.red : C.green;
  const bg      = isError ? "rgba(20,10,10,0.97)" : "rgba(10,18,12,0.97)";
  const border  = isError
    ? "rgba(229,115,115,0.5)" : "rgba(93,190,138,0.5)";
  const iconBg  = isError
    ? "rgba(229,115,115,0.15)" : "rgba(93,190,138,0.15)";
  const closeBg = isError
    ? "rgba(229,115,115,0.1)" : "rgba(93,190,138,0.1)";
  const shadow  = isError
    ? "0 10px 40px rgba(229,115,115,0.18),0 2px 10px rgba(0,0,0,0.7)"
    : "0 10px 40px rgba(93,190,138,0.18),0 2px 10px rgba(0,0,0,0.7)";

  return (
    <>
      <style>{`
        @keyframes toastDrop {
          0%   { opacity:0; transform:translateX(-50%)
                  translateY(-24px) scale(.94); }
          60%  { opacity:1; transform:translateX(-50%)
                  translateY(5px) scale(1.01); }
          100% { opacity:1; transform:translateX(-50%)
                  translateY(0) scale(1); }
        }
        .toast-drop {
          animation: toastDrop .42s
            cubic-bezier(.34,1.56,.64,1) forwards;
        }
      `}</style>

      <div
        className="toast-drop"
        style={{
          position: "fixed", top: 20, left: "50%",
          zIndex: 99999, width: "min(420px, 92vw)",
          pointerEvents: "auto",
        }}
      >
        <div style={{
          backgroundColor: bg, borderRadius: 18,
          border: `1px solid ${border}`, boxShadow: shadow,
          display: "flex", alignItems: "center",
          gap: 12, padding: "12px 14px",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            backgroundColor: iconBg,
            display: "flex", alignItems: "center",
            justifyContent: "center",
            flexShrink: 0, color: accent,
          }}>
            {isError ? <XCircleIcon /> : <CheckCircleIcon />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: accent, fontSize: 10, fontWeight: 800,
              letterSpacing: "2px", textTransform: "uppercase",
              margin: "0 0 3px",
            }}>
              {isError ? "Error" : "Success"}
            </p>
            <p style={{
              color: C.white, fontSize: 13, fontWeight: 500,
              lineHeight: 1.4, margin: 0, wordBreak: "break-word",
            }}>
              {toast.msg}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 9,
              border: "none", cursor: "pointer",
              backgroundColor: closeBg, color: accent,
              display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
              transition: "filter .15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = "brightness(1)")
            }
          >
            <XIcon size={13} />
          </button>
        </div>
        <div style={{
          height: 3, backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 2, marginTop: 5, marginInline: 4,
          overflow: "hidden",
        }}>
          <div
            ref={progressRef}
            style={{
              height: "100%", borderRadius: 2,
              backgroundColor: accent, transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
function FilterTabs({ filter, setFilter, users }) {
  const tabs = [
    { key: "all",      label: "All",
      count: users.length },
    { key: "active",   label: "Active",
      count: users.filter((u) => u.isActive).length },
    { key: "inactive", label: "Inactive",
      count: users.filter((u) => !u.isActive).length },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {tabs.map((tab) => {
        const sel = filter === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              flex: 1, display: "flex",
              alignItems: "center", justifyContent: "center",
              gap: 6, padding: "9px 8px", borderRadius: 10,
              border: `1px solid ${sel ? C.gold : C.border}`,
              backgroundColor: sel
                ? "rgba(201,162,39,0.1)" : C.inputBg,
              cursor: "pointer", transition: "all .15s",
            }}
          >
            <span style={{
              color: sel ? C.gold : C.muted,
              fontWeight: sel ? 700 : 500, fontSize: 13,
            }}>
              {tab.label}
            </span>
            <span style={{
              backgroundColor: sel
                ? "rgba(201,162,39,0.2)" : C.faint,
              borderRadius: 6, padding: "1px 7px",
              color: sel ? C.gold : C.muted,
              fontWeight: 700, fontSize: 11,
            }}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Staff Row Card ───────────────────────────────────────────────────────────
function StaffCard({ item, onView, onEdit, onDelete, canEdit, canDelete }) {
  const [hovered, setHovered] = useState(false);
  const roleLabel =
    item.roles?.map((r) => r.name).join(", ") || "No Role";
  const isActive  = item.isActive;
  const isOwner   = isOwnerUser(item);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#202020" : C.card,
        borderRadius: 16,
        border: `1px solid ${hovered ? C.gold : C.borderGold}`,
        padding: "14px 16px",
        display: "flex", alignItems: "center",
        gap: 14, transition: "all .15s",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 6px 24px rgba(201,162,39,0.08)" : "none",
      }}
    >
      {/* Avatar */}
      <div
        onClick={onView}
        style={{
          width: 46, height: 46, borderRadius: "50%",
          backgroundColor: "rgba(201,162,39,0.12)",
          border: `1px solid ${C.borderGold}`,
          display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          color: C.gold, fontWeight: 800, fontSize: 18,
          cursor: "pointer",
        }}
      >
        {item.name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      {/* Info */}
      <div
        onClick={onView}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div style={{
          display: "flex", alignItems: "center",
          gap: 8, marginBottom: 4, flexWrap: "wrap",
        }}>
          <p style={{
            color: C.white, fontWeight: 700, fontSize: 14,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {item.name}
          </p>

          {/* Status badge */}
          <span style={{
            backgroundColor: isActive ? C.greenBg : C.redBg,
            border: `1px solid ${
              isActive ? C.greenBorder : C.redBorder}`,
            borderRadius: 6, padding: "2px 8px",
            color: isActive ? C.green : C.red,
            fontWeight: 700, fontSize: 10,
            letterSpacing: "0.6px", flexShrink: 0,
          }}>
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>

          {/* ── Owner protected badge ── */}
          {isOwner && (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              backgroundColor: "rgba(201,162,39,0.1)",
              border: `1px solid ${C.borderGold}`,
              borderRadius: 6, padding: "2px 8px",
              color: C.gold, fontWeight: 700,
              fontSize: 10, letterSpacing: "0.6px",
              flexShrink: 0,
            }}>
              <LockIcon size={10} />
              Protected
            </span>
          )}
        </div>

        <div style={{
          display: "flex", alignItems: "center",
          gap: 14, flexWrap: "wrap",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: 4, color: C.muted,
          }}>
            <PhoneIcon />
            <span style={{ fontSize: 12 }}>
              {item.mobile || "—"}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center",
            gap: 4, color: C.muted,
          }}>
            <ShieldIcon />
            <span style={{
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 160,
            }}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 6, flexShrink: 0,
      }}>
        {/* View */}
        <button
          onClick={onView}
          title="View"
          style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5,
            padding: "7px 13px", borderRadius: 9,
            border: `1px solid ${C.borderGold}`,
            backgroundColor: "rgba(201,162,39,0.08)",
            color: C.gold, fontWeight: 600, fontSize: 12,
            cursor: "pointer", transition: "all .15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "rgba(201,162,39,0.16)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "rgba(201,162,39,0.08)")
          }
        >
          <ChevronRightIcon />
          <span className="btn-label">View</span>
        </button>

        {/* Edit — hidden for owner */}
        {canEdit && !isOwner && (
          <button
            onClick={onEdit}
            title="Edit"
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5,
              padding: "7px 13px", borderRadius: 9,
              border: `1px solid ${C.border}`,
              backgroundColor: C.cardAlt,
              color: C.muted, fontWeight: 600, fontSize: 12,
              cursor: "pointer", transition: "all .15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderGold;
              e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.muted;
            }}
          >
            <EditIcon />
            <span className="btn-label">Edit</span>
          </button>
        )}

        {/* Delete — hidden for owner */}
        {canDelete && !isOwner && (
          <button
            onClick={onDelete}
            title="Delete"
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5,
              padding: "7px 13px", borderRadius: 9,
              border: `1px solid ${C.redBorder}`,
              backgroundColor: C.redBg,
              color: C.red, fontWeight: 600, fontSize: 12,
              cursor: "pointer", transition: "all .15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(229,115,115,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = C.redBg)
            }
          >
            <TrashIcon />
            <span className="btn-label">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ search, filter }) {
  const isFiltered = filter !== "all";
  const label = search.trim()
    ? "No Results Found"
    : isFiltered
      ? filter === "active" ? "No Active Staff" : "No Inactive Staff"
      : "No Staff Found";
  const sub = search.trim()
    ? `No staff matching "${search}"`
    : isFiltered
      ? filter === "active"
        ? "No staff members are currently active"
        : "No staff members are currently inactive"
      : "Add staff members to get started";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center",
      paddingTop: 64, paddingBottom: 32,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        backgroundColor: C.faint,
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        marginBottom: 16, color: C.muted,
      }}>
        <PeopleIcon />
      </div>
      <p style={{
        color: C.white, fontWeight: 700,
        fontSize: 15, margin: "0 0 6px",
      }}>
        {label}
      </p>
      <p style={{
        color: C.muted, fontSize: 13,
        textAlign: "center", margin: 0,
      }}>
        {sub}
      </p>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ target, onConfirm, onCancel, deleting }) {
  if (!target) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn .2s ease forwards",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: C.surface, borderRadius: 20,
          border: `1px solid ${C.borderGold}`,
          padding: "28px 24px",
          width: "100%", maxWidth: 420,
          animation: "slideUp .25s ease forwards",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: C.redBg,
          border: `1px solid ${C.redBorder}`,
          display: "flex", alignItems: "center",
          justifyContent: "center",
          marginBottom: 16, color: C.red,
        }}>
          <TrashIcon size={22} />
        </div>

        <h2 style={{
          color: C.white, fontWeight: 800,
          fontSize: 18, margin: "0 0 8px",
        }}>
          Delete Staff Member?
        </h2>
        <p style={{
          color: C.muted, fontSize: 14,
          margin: "0 0 24px", lineHeight: 1.5,
        }}>
          You are about to delete{" "}
          <span style={{ color: C.white, fontWeight: 600 }}>
            {target.name}
          </span>
          . This action cannot be undone.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              border: `1px solid ${C.border}`,
              backgroundColor: C.card, color: C.muted,
              fontWeight: 700, fontSize: 14,
              cursor: deleting ? "not-allowed" : "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              if (!deleting) e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.muted;
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              border: `1px solid ${C.redBorder}`,
              backgroundColor: C.redBg, color: C.red,
              fontWeight: 700, fontSize: 14,
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              if (!deleting)
                e.currentTarget.style.backgroundColor =
                  "rgba(229,115,115,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.redBg;
            }}
          >
            {deleting ? (
              <>
                <Spinner size={15} color={C.red} />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: C.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 12, color: C.muted,
    }}>
      <Spinner size={36} color={C.gold} />
      <p style={{
        fontSize: 11, letterSpacing: "3px",
        fontWeight: 600, textTransform: "uppercase", margin: 0,
      }}>
        Loading
      </p>
    </div>
  );
}

// ─── Main StaffListScreen ─────────────────────────────────────────────────────
export default function StaffListScreen() {
  const router      = useRouter();
  const permissions = useAuthStore((s) => s.permissions);

  const [users,         setUsers]         = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter,        setFilter]        = useState("all");
  const [toast,         setToast]         = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const toastTimer = useRef(null);
  const searchRef  = useRef(null);

  const canCreate = permissions.includes("staff.create");
  const canEdit   = permissions.includes("staff.edit");
  const canDelete = permissions.includes("staff.delete");

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to load staff",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useRefreshOnFocus(loadUsers);
  useRealtime("user:created", loadUsers);
  useRealtime("user:updated", loadUsers);
  useRealtime("user:deleted", loadUsers);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
    showToast("Staff list refreshed");
  };

  // ── Filter + Search ────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...users];
    if (filter === "active")
      result = result.filter((u) => u.isActive);
    else if (filter === "inactive")
      result = result.filter((u) => !u.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.mobile?.includes(q)
      );
    }
    setFiltered(result);
  }, [search, users, filter]);

  // ── Delete — with owner guard ──────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    // ── Layer 1: owner role guard ──────────────────────────────────
    if (isOwnerUser(deleteTarget)) {
      showToast("Owner account cannot be deleted", "error");
      setDeleteTarget(null);
      return;
    }

    try {
      setDeleting(true);
      await deleteUser(deleteTarget.id);
      showToast(`${deleteTarget.name} deleted successfully`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to delete staff",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fade-in  { animation: fadeIn  .35s ease forwards; }
        .slide-up { animation: slideUp .3s  ease forwards; }

        @media (max-width: 520px) {
          .btn-label { display: none !important; }
        }
        @media (max-width: 480px) {
          .hide-sm { display: none !important; }
        }

        .staff-scroll::-webkit-scrollbar { width: 4px; }
        .staff-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .staff-scroll::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25);
          border-radius: 4px;
        }
      `}</style>

      <Toast toast={toast} onClose={closeToast} />

      <DeleteModal
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setDeleteTarget(null)}
        deleting={deleting}
      />

      <div style={{
        minHeight: "100vh",
        backgroundColor: C.bg,
        padding: "24px 16px",
      }}>
        <div
          className="fade-in"
          style={{
            maxWidth: 720,
            margin: "0 auto",
            backgroundColor: C.surface,
            borderRadius: 24,
            border: `1px solid ${C.borderGold}`,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 48px)",
          }}
        >

          {/* ── Header ── */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 20, paddingBottom: 16,
            borderBottom: `1px solid ${C.border}`,
            flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <p style={{
                color: C.gold, fontSize: 10, fontWeight: 700,
                letterSpacing: "3px", textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
                Admin
              </p>
              <h1 style={{
                color: C.white,
                fontSize: "clamp(24px, 5vw, 38px)",
                fontWeight: 800, letterSpacing: "-0.3px",
                margin: 0, lineHeight: 1,
              }}>
                Staff
              </h1>
            </div>

            <div style={{
              display: "flex", alignItems: "center",
              gap: 8, flexWrap: "wrap",
            }}>
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  backgroundColor: C.card,
                  border: `1px solid ${C.borderGold}`,
                  borderRadius: 11, padding: "8px 14px",
                  color: C.gold, fontWeight: 700, fontSize: 13,
                  cursor: refreshing ? "not-allowed" : "pointer",
                  opacity: refreshing ? 0.6 : 1,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  if (!refreshing)
                    e.currentTarget.style.filter =
                      "brightness(1.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                <RefreshIcon spinning={refreshing} />
                <span className="hide-sm">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              {/* Back */}
              <button
                onClick={() => router.push("/settings")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  backgroundColor: C.card,
                  border: `1px solid ${C.borderGold}`,
                  borderRadius: 11, padding: "8px 14px",
                  color: C.gold, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", transition: "all .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter =
                    "brightness(1.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                <ArrowLeftIcon />
                <span className="hide-sm">Settings</span>
              </button>

              {/* Add Staff */}
              {canCreate && (
                <button
                  onClick={() =>
                    router.push("/settings/staff/create")
                  }
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    backgroundColor: C.gold, border: "none",
                    borderRadius: 11, padding: "8px 16px",
                    color: "#000", fontWeight: 800, fontSize: 13,
                    cursor: "pointer", transition: "all .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter =
                      "brightness(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter = "brightness(1)")
                  }
                >
                  <PlusIcon />
                  <span className="hide-sm">Add Staff</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Search ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: C.inputBg,
            border: `1px solid ${
              searchFocused ? C.gold : C.border}`,
            borderRadius: 13, padding: "10px 14px",
            marginBottom: 12, transition: "border-color .15s",
          }}>
            <span style={{
              color: searchFocused ? C.gold : C.muted,
            }}>
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, background: "none",
                border: "none", outline: "none",
                color: C.white, fontSize: 14,
                caretColor: C.gold,
              }}
            />
            {search.length > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", color: C.muted,
                  display: "flex", padding: 2,
                  transition: "color .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = C.white)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = C.muted)
                }
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* ── Filter Tabs ── */}
          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            users={users}
          />

          {/* ── Count Row ── */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <span style={{ color: C.muted, fontSize: 12 }}>
              {filtered.length}{" "}
              {filtered.length === 1 ? "member" : "members"}
              {search.trim()
                ? ` found for "${search}"`
                : filter !== "all"
                  ? ` ${filter}`
                  : " total"}
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                backgroundColor: C.green,
              }} />
              <span style={{ color: C.muted, fontSize: 11 }}>
                {activeCount} active
              </span>
            </div>
          </div>

          {/* ── Staff List ── */}
          {filtered.length === 0 ? (
            <EmptyState search={search} filter={filter} />
          ) : (
            <div
              className="staff-scroll"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {filtered.map((user, i) => (
                <div
                  key={user.id}
                  className="slide-up"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <StaffCard
                    item={user}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={() =>
                      router.push(`/settings/staff/${user.id}`)
                    }
                    onEdit={() =>
                      router.push(
                        `/settings/staff/${user.id}/edit`
                      )
                    }
                    onDelete={() =>
                      setDeleteTarget({
                        id:    user.id,
                        name:  user.name,
                        roles: user.roles,  // ← passed for guard
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Powered By ── */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center",
            gap: 8, marginTop: "auto", paddingTop: 32,
          }}>
            <div style={{
              height: 1, width: 16,
              backgroundColor: "rgba(201,162,39,0.3)",
            }} />
            <span style={{
              color: "rgba(201,162,39,0.5)",
              fontSize: 10, fontWeight: 500,
              letterSpacing: "3px", textTransform: "uppercase",
            }}>
              Powered by FeathrTech
            </span>
            <div style={{
              height: 1, width: 16,
              backgroundColor: "rgba(201,162,39,0.3)",
            }} />
          </div>

        </div>
      </div>
    </>
  );
}