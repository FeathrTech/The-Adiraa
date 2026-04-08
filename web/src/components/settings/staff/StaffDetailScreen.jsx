// src/components/settings/staff/StaffDetailScreen.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../config/permissionMap";
import { deactivateUser } from "../../../api/userApi";
import api from "../../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "rgba(201,162,39,0.12)",
  goldDimMed: "rgba(201,162,39,0.08)",
  borderGold: "rgba(201,162,39,0.35)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  green: "#5DBE8A",
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
  blue: "#60A5FA",
  blueBg: "rgba(96,165,250,0.12)",
  blueBorder: "rgba(96,165,250,0.35)",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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

function Spinner({ size = 20, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrendingUpIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function XCircleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function PulseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.97 19.97 0 01-8.63-3.07
        19.5 19.5 0 01-6-6 19.97 19.97 0 01-3.07-8.67A2 2 0 013.11 2h3
        a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09
        9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573
        2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function EditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IdCardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <line x1="14" y1="9" x2="18" y2="9" />
      <line x1="14" y1="12" x2="18" y2="12" />
      <line x1="14" y1="15" x2="16" y2="15" />
    </svg>
  );
}

function UserRemoveIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="23" y2="8" />
    </svg>
  );
}

function CheckCircleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function LoginIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function LogoutIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LocationIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DocumentIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ImageIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TimerIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 14.5 13" />
      <path d="M5 3l1.5 1.5M19 3l-1.5 1.5M12 1v2" />
    </svg>
  );
}

function TodayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Status Meta ──────────────────────────────────────────────────────────────
function getStatusMeta(s) {
  return ({
    Present: { color: "#5DBE8A", bg: "rgba(93,190,138,0.12)", border: "rgba(93,190,138,0.4)", label: "PRESENT" },
    Late: { color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", label: "LATE" },
    Completed: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.4)", label: "COMPLETED" },
    Absent: { color: "#E57373", bg: "rgba(229,115,115,0.1)", border: "rgba(229,115,115,0.35)", label: "ABSENT" },
    NotMarked: { color: "#888888", bg: "rgba(136,136,136,0.1)", border: "rgba(136,136,136,0.3)", label: "NOT MARKED" },
  }[s] || { color: C.muted, bg: "rgba(100,100,100,0.1)", border: "rgba(100,100,100,0.3)", label: s?.toUpperCase() ?? "--" });
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: 20,
        border: `1px solid ${C.borderGold}`,
        padding: 28, maxWidth: 400, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      }}>
        <h3 style={{
          color: C.white, fontSize: 18,
          fontWeight: 800, margin: "0 0 10px",
        }}>
          {title}
        </h3>
        <p style={{
          color: C.muted, fontSize: 14,
          lineHeight: 1.6, margin: "0 0 24px",
        }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: C.faint,
            border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "9px 18px",
            color: C.muted, fontWeight: 600,
            fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              backgroundColor: confirmColor,
              border: "none", borderRadius: 10,
              padding: "9px 18px",
              color: "#000", fontWeight: 700,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Spinner size={14} color="#000" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ID Proof Modal ───────────────────────────────────────────────────────────
function IdProofModal({ open, url, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    if (open) { setImgError(false); setImgLoading(true); }
  }, [open]);

  if (!open || !url) return null;

  const isPdf = url.toLowerCase().includes(".pdf") ||
    url.toLowerCase().includes("application/pdf");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: 20,
        border: `1px solid ${C.borderGold}`,
        padding: 20, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: C.blueBg,
              border: `1px solid ${C.blueBorder}`,
              display: "flex", alignItems: "center",
              justifyContent: "center", color: C.blue,
            }}>
              {isPdf ? <DocumentIcon size={17} /> : <IdCardIcon size={17} />}
            </div>
            <div>
              <p style={{ color: C.white, fontWeight: 700, fontSize: 15, margin: 0 }}>
                ID Proof
              </p>
              <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>
                {isPdf ? "PDF Document" : "Image Document"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: C.faint, border: "none",
            borderRadius: 8, padding: 7,
            cursor: "pointer", color: C.muted, display: "flex",
          }}>
            <XIcon size={18} />
          </button>
        </div>

        <div style={{ height: 1, backgroundColor: C.border, marginBottom: 16 }} />

        {isPdf ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              backgroundColor: C.blueBg,
              border: `1px solid ${C.blueBorder}`,
              display: "flex", alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px", color: C.blue,
            }}>
              <DocumentIcon size={34} />
            </div>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>
              PDF Document
            </p>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: "0 0 16px" }}>
              Click below to open in a new tab
            </p>
            <a href={url} target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: C.blue, borderRadius: 12,
              padding: "11px 24px",
              color: "#000", fontWeight: 700,
              fontSize: 14, textDecoration: "none",
            }}>
              <ExternalLinkIcon size={16} />
              Open PDF
            </a>
          </div>
        ) : imgError ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <span style={{ color: C.muted, fontSize: 48 }}>🖼</span>
            <p style={{ color: C.muted, fontSize: 13, margin: "10px 0" }}>
              Could not load the document image.
            </p>
            <a href={url} target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: C.blueBg,
              border: `1px solid ${C.blueBorder}`,
              borderRadius: 10, padding: "8px 16px",
              color: C.blue, fontWeight: 600,
              fontSize: 13, textDecoration: "none",
            }}>
              <ExternalLinkIcon size={13} />
              Open in Browser
            </a>
          </div>
        ) : (
          <div style={{
            borderRadius: 12, overflow: "hidden",
            backgroundColor: C.faint,
            position: "relative", minHeight: 200,
          }}>
            {imgLoading && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center",
                justifyContent: "center", zIndex: 1,
              }}>
                <Spinner size={32} color={C.gold} />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="ID Proof"
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgLoading(false); setImgError(true); }}
              style={{
                width: "100%", maxHeight: 360,
                objectFit: "contain", borderRadius: 12,
                display: imgLoading ? "none" : "block",
              }}
            />
          </div>
        )}

        {!isPdf && !imgError && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href={url} target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              color: C.muted, fontSize: 12, textDecoration: "none",
            }}>
              <ExternalLinkIcon size={12} />
              Open full size in browser
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attendance Photo Modal ───────────────────────────────────────────────────
function AttendancePhotoModal({ log, onClose }) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (log) setPhotoError(false);
  }, [log]);

  if (!log) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: 20,
        border: `1px solid ${C.borderGold}`,
        padding: 20, width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      }}>
        <button onClick={onClose} style={{
          display: "flex", marginLeft: "auto", marginBottom: 12,
          backgroundColor: C.faint, border: "none",
          borderRadius: 8, padding: 6,
          cursor: "pointer", color: C.muted,
        }}>
          <XIcon size={20} />
        </button>

        {!photoError && log.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={log.photo}
            alt="Attendance"
            onError={() => setPhotoError(true)}
            style={{
              width: "100%", maxHeight: 320,
              objectFit: "contain", borderRadius: 14,
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 30 }}>
            <span style={{ fontSize: 48, color: C.muted }}>🖼</span>
            <p style={{ color: C.muted, marginTop: 10, fontSize: 13 }}>
              Attendance photo expired (15 day retention policy)
            </p>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <p style={{ color: C.white, fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>
            {new Date(log.timestamp).toLocaleString()}
          </p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
            {log.location
              ? `${Number(log.location.latitude).toFixed(4)}, ${Number(log.location.longitude).toFixed(4)}`
              : "Location unavailable"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "28px 0 16px",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: C.goldDim,
        border: `1px solid ${C.borderGold}`,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        color: C.gold, flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        color: C.gold, fontWeight: 700,
        fontSize: 11, letterSpacing: "2.5px",
        textTransform: "uppercase",
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </div>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon }) {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 18, border: `1px solid ${C.borderGold}`,
      padding: "18px 20px", flex: "1 1 140px",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        backgroundColor: C.goldDim,
        border: `1px solid ${C.borderGold}`,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        marginBottom: 10, color: C.gold,
      }}>
        {icon}
      </div>
      <p style={{ color: C.muted, fontSize: 12, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: C.gold, fontSize: 26, fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  );
}

// ─── Avatar Circle ────────────────────────────────────────────────────────────
// ─── Avatar Circle ────────────────────────────────────────────────────────────
function AvatarCircle({ user, initials, size = 96 }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Computed once on mount — stable across all re-renders
  const photoSrc = useRef(
    user.profilePhotoUrl
      ? `${user.profilePhotoUrl}?t=${Date.now()}`
      : null
  );

  const showImg = photoSrc.current && !error;

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(201,162,39,0.5)",
      overflow: "hidden", flexShrink: 0,
      backgroundColor: "rgba(201,162,39,0.1)",
      display: "flex", alignItems: "center",
      justifyContent: "center", position: "relative",
    }}>
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc.current}  // ✅ stable ref, never changes
          alt={user.name}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", position: "absolute",
          }}
        />
      )}
      {(!showImg || loading) && (
        <span style={{
          color: C.gold, fontWeight: 900,
          fontSize: size * 0.35, letterSpacing: 1,
          position: "relative", zIndex: 1,
        }}>
          {initials}
        </span>
      )}
      {showImg && loading && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 2,
        }}>
          <Spinner size={20} color={C.gold} />
        </div>
      )}
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ markedDates, selectedDate, onDayPress, onMonthChange }) {
  const today = new Date();
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());

  const prevMonth = () => {
    let m = displayMonth - 1;
    let y = displayYear;
    if (m < 0) { m = 11; y--; }
    setDisplayMonth(m);
    setDisplayYear(y);
    onMonthChange && onMonthChange({ year: y, month: m + 1 });
  };

  const nextMonth = () => {
    let m = displayMonth + 1;
    let y = displayYear;
    if (m > 11) { m = 0; y++; }
    setDisplayMonth(m);
    setDisplayYear(y);
    onMonthChange && onMonthChange({ year: y, month: m + 1 });
  };

  const monthName = new Date(displayYear, displayMonth)
    .toLocaleString("default", { month: "long" });
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ padding: "16px 12px 8px" }}>
      {/* Month nav */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14, paddingInline: 4,
      }}>
        <button onClick={prevMonth} style={{
          background: "none", border: "none",
          cursor: "pointer", color: C.gold, display: "flex", padding: 4,
        }}>
          <ChevronLeftIcon size={20} />
        </button>
        <span style={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>
          {monthName} {displayYear}
        </span>
        <button onClick={nextMonth} style={{
          background: "none", border: "none",
          cursor: "pointer", color: C.gold, display: "flex", padding: 4,
        }}>
          <ChevronRightIcon size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2, marginBottom: 4,
      }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} style={{
            textAlign: "center", color: C.muted,
            fontSize: 11, fontWeight: 600, padding: "4px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2,
      }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const mark = markedDates[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => onDayPress(dateStr)}
              style={{
                position: "relative",
                background: isSelected ? C.gold : "none",
                border: isToday && !isSelected
                  ? `1px solid ${C.gold}` : "none",
                borderRadius: 8, cursor: "pointer",
                padding: "6px 0",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
              }}
            >
              <span style={{
                color: isSelected ? "#000" : isToday ? C.gold : C.white,
                fontSize: 13,
                fontWeight: isToday || isSelected ? 700 : 400,
              }}>
                {day}
              </span>
              {mark && (
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  backgroundColor: isSelected
                    ? "#000" : mark.dotColor || C.gold,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main StaffDetailScreen ───────────────────────────────────────────────────
export default function StaffDetailScreen({ user: userProp }) {
  const router = useRouter();
  const permissions = useAuthStore((s) => s.permissions);

  // ── Permission flags ───────────────────────────────────────────────────────
  const canViewAttendance = can(permissions, "attendance.view.staff_history");
  const canViewStaff = can(permissions, "staff.view");

  const [user, setUser] = useState(userProp);
  const [stats, setStats] = useState({
    daysWorked: "--", lateDays: "--",
    overtime: "--", absents: "--", status: "--",
  });
  const [calendarData, setCalendarData] = useState({});
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [todayAtt, setTodayAtt] = useState(null);
  const [workHours, setWorkHours] = useState("--");
  const [selectedLog, setSelectedLog] = useState(null);
  const [idProofOpen, setIdProofOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // ── Month state + ref ──────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const currentMonthRef = useRef(currentMonth);
  const userIdRef = useRef(user?.id);

  useEffect(() => { currentMonthRef.current = currentMonth; }, [currentMonth]);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  // ── Permission guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!canViewAttendance && !canViewStaff) {
      router.replace("/settings/staff");
    }
  }, [canViewAttendance, canViewStaff, router]);

  // ── Load analytics ─────────────────────────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    if (!canViewAttendance) return; // only load if permitted
    const month = currentMonthRef.current;
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      const res = await api.get(
        `/attendance/analytics/${userId}?month=${month}`
      );
      const { summary, calendar } = res.data;
      setStats(summary);

      const mappedLogs = [];
      calendar.forEach((day) => {
        if (day.checkInTime)
          mappedLogs.push({
            type: "login",
            timestamp: day.checkInTime,
            attendanceDate: day.date,
            photo: day.checkInPhoto,
            location: { latitude: day.lat, longitude: day.lng },
          });
        if (day.checkOutTime)
          mappedLogs.push({
            type: "logout",
            timestamp: day.checkOutTime,
            attendanceDate: day.date,
            photo: day.checkOutPhoto,
            location: { latitude: day.lat, longitude: day.lng },
          });
      });
      setLogs(mappedLogs);

      const marked = {};
      calendar.forEach((day) => {
        const dateKey = new Date(day.date).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
        let color = "#22c55e";
        if (day.status === "Absent") color = "#ef4444";
        if (day.status === "Late") color = "#f97316";
        if (day.status === "OutsideRange") color = "#3b82f6";
        if (day.status === "NotMarked") color = "#6b7280";
        marked[dateKey] = { dotColor: color };
      });

      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const todayData = calendar.find((d) => d.date === today);
      if (todayData) setTodayAtt(todayData);
      setCalendarData(marked);
    } catch (err) {
      console.log(err);
    }
  }, [canViewAttendance]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // ── Month change ───────────────────────────────────────────────────────────
  const handleMonthChange = useCallback(({ year, month }) => {
    const newMonth = `${year}-${String(month).padStart(2, "0")}`;
    currentMonthRef.current = newMonth;
    setCurrentMonth(newMonth);
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Midnight refresh ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!canViewAttendance) return;
    let lastDay = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const interval = setInterval(() => {
      const today = new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      if (today !== lastDay) { lastDay = today; loadAnalytics(); }
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics, canViewAttendance]);

  // ── Work hours ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!todayAtt?.checkInTime) { setWorkHours("--"); return; }
    const calculate = () => {
      try {
        const start = new Date(todayAtt.checkInTime);
        const end = todayAtt.checkOutTime
          ? new Date(todayAtt.checkOutTime) : new Date();
        const diffMs = end - start;
        if (diffMs <= 0) { setWorkHours("--"); return; }
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setWorkHours(`${hours}h ${minutes}m`);
      } catch { setWorkHours("--"); }
    };
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [todayAtt]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    try {
      setActionLoading("deactivate");
      await deactivateUser(user.id);
      setConfirmDialog(null);
      router.push("/settings/staff");
    } catch {
      setConfirmDialog(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading("activate");
      await api.patch(`/users/${user.id}`, { isActive: true });
      setUser((prev) => ({ ...prev, isActive: true }));
      setConfirmDialog(null);
    } catch {
      setConfirmDialog(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await api.delete(`/users/${user.id}/permanent`);
      setConfirmDialog(null);
      router.push("/settings/staff");
    } catch {
      setConfirmDialog(null);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  const roleLabel = user.roles?.map((r) => r.name).join(", ") || "No Role";
  const initials = user.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const isActive = user.isActive;
  const canEdit = can(permissions, ACTION_PERMISSIONS.staff.edit);
  const canDelete = can(permissions, ACTION_PERMISSIONS.staff.delete);
  const statusMeta = getStatusMeta(stats.status);

  const filteredLogs = selectedDate
    ? logs.filter((l) =>
      new Date(l.attendanceDate).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }) === selectedDate
    )
    : [];

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .fade-in { animation: fadeIn .35s ease forwards; }

        .detail-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px 48px;
          box-sizing: border-box;
        }
        @media (min-height: 900px) {
          .detail-outer { align-items: center; padding: 48px 16px; }
        }

        .detail-card {
          width: 100%;
          max-width: 860px;
          background-color: ${C.surface};
          border-radius: 24px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(201,162,39,0.06),
            0 24px 80px rgba(0,0,0,0.6),
            0 8px 32px rgba(0,0,0,0.4);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 28px;
          border-bottom: 1px solid ${C.border};
          flex-wrap: wrap;
        }

        .card-body {
          padding: 0 28px 48px;
          overflow-y: auto;
          max-height: calc(100vh - 160px);
        }

        .profile-card {
          background-color: ${C.card};
          border-radius: 24px;
          padding: 28px;
          border: 1px solid ${C.borderGold};
          margin-top: 28px;
          margin-bottom: 24px;
        }

        .profile-inner {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .stats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 24px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 10px;
          padding: 7px 14px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          border-width: 1px;
          border-style: solid;
          background: none;
          transition: filter .15s, transform .1s;
        }
        .action-btn:hover  { filter: brightness(1.2); transform: translateY(-1px); }
        .action-btn:active { transform: translateY(0); }

        .log-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background-color: ${C.cardAlt};
          border-radius: 14px;
          border: 1px solid ${C.border};
          padding: 14px 16px;
          margin-bottom: 10px;
        }

        .today-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid ${C.border};
        }
        .today-row:last-child { border-bottom: none; }

        .back-btn { transition: filter .15s; }
        .back-btn:hover { filter: brightness(1.2); }

        .photo-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          background-color: ${C.goldDim};
          border: 1px solid ${C.borderGold};
          cursor: pointer; color: ${C.gold};
          flex-shrink: 0; transition: filter .15s;
        }
        .photo-btn:hover { filter: brightness(1.2); }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25); border-radius: 4px;
        }

        @media (max-width: 600px) {
          .card-body   { padding: 0 16px 40px; }
          .card-header { padding: 16px !important; }
          .profile-inner {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .action-btns { justify-content: center !important; }
          .stats-grid > * { flex: 1 1 calc(50% - 7px) !important; }
        }
      `}</style>

      {/* ── Modals ── */}
      {confirmDialog && (
        <ConfirmDialog
          open
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          confirmColor={confirmDialog.confirmColor}
          loading={!!actionLoading}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      <IdProofModal
        open={idProofOpen}
        url={user.idProofUrl}
        onClose={() => setIdProofOpen(false)}
      />
      <AttendancePhotoModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      <div className="detail-outer">
        <div className="detail-card fade-in">

          {/* ── HEADER ── */}
          <div className="card-header">
            <button
              className="back-btn"
              onClick={() => router.push("/settings/staff")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                backgroundColor: C.faint,
                border: `1px solid ${C.borderGold}`,
                borderRadius: 10, padding: "7px 12px",
                color: C.gold, fontWeight: 600,
                fontSize: 13, cursor: "pointer", flexShrink: 0,
              }}
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: C.gold, fontSize: 10, fontWeight: 700,
                letterSpacing: "3px", textTransform: "uppercase",
                margin: "0 0 3px",
              }}>
                Staff Management
              </p>
              <h1 style={{
                color: C.white,
                fontSize: "clamp(20px, 4vw, 28px)",
                fontWeight: 900, letterSpacing: "-0.5px",
                margin: 0, lineHeight: 1,
              }}>
                Staff Profile
              </h1>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="card-body">

            {/* ── PROFILE CARD ── */}
            <div className="profile-card">
              <div className="profile-inner">
                <AvatarCircle user={user} initials={initials} size={96} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    color: C.white, fontWeight: 800,
                    fontSize: "clamp(20px,3vw,26px)",
                    letterSpacing: "-0.3px", margin: "0 0 4px",
                  }}>
                    {user.name}
                  </h2>
                  <p style={{ color: C.muted, fontSize: 14, margin: "0 0 4px" }}>
                    {roleLabel}
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 6, marginBottom: 12, color: C.muted,
                  }}>
                    <PhoneIcon size={13} />
                    <span style={{ fontSize: 13 }}>{user.mobile || "—"}</span>
                  </div>

                  {/* Status badge */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      backgroundColor: isActive ? C.greenBg : C.redBg,
                      border: `1px solid ${isActive ? C.greenBorder : C.redBorder}`,
                      borderRadius: 8, padding: "4px 10px",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        backgroundColor: isActive ? C.green : C.red,
                      }} />
                      <span style={{
                        color: isActive ? C.green : C.red,
                        fontWeight: 700, fontSize: 12,
                        letterSpacing: "0.5px",
                      }}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </span>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="action-btns" style={{
                    display: "flex", flexWrap: "wrap", gap: 8,
                  }}>
                    {canEdit && (
                      <button
                        className="action-btn"
                        onClick={() =>
                          router.push(`/settings/staff/${user.id}/edit`)
                        }
                        style={{
                          backgroundColor: C.goldDim,
                          borderColor: C.borderGold,
                          color: C.gold,
                        }}
                      >
                        <EditIcon size={14} />
                        Edit
                      </button>
                    )}

                    {!!user.idProofUrl && (
                      <button
                        className="action-btn"
                        onClick={() => setIdProofOpen(true)}
                        style={{
                          backgroundColor: C.blueBg,
                          borderColor: C.blueBorder,
                          color: C.blue,
                        }}
                      >
                        <IdCardIcon size={14} />
                        ID Proof
                      </button>
                    )}

                    {canDelete && isActive && !user.roles?.some((r) => r.name?.toLowerCase() === "owner") && (
                      <button
                        className="action-btn"
                        onClick={() => setConfirmDialog({
                          title: "Deactivate Staff",
                          message: `Are you sure you want to deactivate ${user.name}? Their account will be disabled.`,
                          confirmLabel: "Deactivate",
                          confirmColor: C.red,
                          onConfirm: handleDeactivate,
                        })}
                        style={{
                          backgroundColor: C.redBg,
                          borderColor: C.redBorder,
                          color: C.red,
                        }}
                      >
                        <UserRemoveIcon size={14} />
                        Deactivate
                      </button>
                    )}

                    {canEdit && !isActive && (
                      <button
                        className="action-btn"
                        onClick={() => setConfirmDialog({
                          title: "Reactivate Staff",
                          message: `Restore login access for ${user.name}?`,
                          confirmLabel: "Reactivate",
                          confirmColor: C.green,
                          onConfirm: handleActivate,
                        })}
                        style={{
                          backgroundColor: C.greenBg,
                          borderColor: C.greenBorder,
                          color: C.green,
                        }}
                      >
                        <CheckCircleIcon size={14} />
                        Reactivate
                      </button>
                    )}

                    {canDelete && !isActive && (
                      <button
                        className="action-btn"
                        onClick={() => setConfirmDialog({
                          title: "Delete from System",
                          message: `Permanently delete ${user.name}? This action cannot be undone.`,
                          confirmLabel: "Delete Permanently",
                          confirmColor: C.red,
                          onConfirm: handleDelete,
                        })}
                        style={{
                          backgroundColor: C.redBg,
                          borderColor: C.redBorder,
                          color: C.red,
                        }}
                      >
                        <TrashIcon size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── ATTENDANCE SECTION — only for attendance.view.staff_history ── */}
            {canViewAttendance && (
              <>
                {/* ── STATS GRID ── */}
                <div className="stats-grid">
                  {[
                    { label: "Days Worked", value: stats.daysWorked, icon: <CalendarIcon size={16} /> },
                    { label: "Late Days", value: stats.lateDays, icon: <ClockIcon size={16} /> },
                    { label: "Overtime", value: stats.overtime, icon: <TrendingUpIcon size={16} /> },
                    { label: "Absents", value: stats.absents, icon: <XCircleIcon size={16} /> },
                  ].map((tile) => (
                    <StatTile key={tile.label} {...tile} />
                  ))}
                </div>

                {/* ── CURRENT STATUS ── */}
                <div style={{
                  backgroundColor: C.card,
                  borderRadius: 18, border: `1px solid ${C.borderGold}`,
                  padding: "16px 20px", marginBottom: 4,
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 10, color: C.muted,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      backgroundColor: C.goldDim,
                      border: `1px solid ${C.borderGold}`,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", color: C.gold,
                    }}>
                      <PulseIcon size={16} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Today</span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    backgroundColor: statusMeta.bg,
                    border: `1px solid ${statusMeta.border}`,
                    borderRadius: 10, padding: "6px 14px",
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      backgroundColor: statusMeta.color,
                    }} />
                    <span style={{
                      color: statusMeta.color, fontWeight: 700,
                      fontSize: 13, letterSpacing: "0.4px",
                    }}>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* ── ATTENDANCE CALENDAR ── */}
                <SectionHeader
                  icon={<CalendarIcon size={16} />}
                  title="Attendance Calendar"
                />
                <div style={{
                  backgroundColor: C.card,
                  borderRadius: 20, border: `1px solid ${C.borderGold}`,
                  overflow: "hidden", marginBottom: 4,
                }}>
                  <MiniCalendar
                    markedDates={calendarData}
                    selectedDate={selectedDate}
                    onDayPress={(dateStr) =>
                      setSelectedDate((cur) =>
                        cur === dateStr ? null : dateStr
                      )
                    }
                    onMonthChange={handleMonthChange}
                  />
                  {/* Legend */}
                  <div style={{
                    display: "flex", flexWrap: "wrap",
                    gap: "8px 20px", padding: "8px 16px 16px",
                  }}>
                    {[
                      { label: "Present", color: "#22c55e" },
                      { label: "Late", color: "#f97316" },
                      { label: "Absent", color: "#ef4444" },
                      { label: "Outside", color: "#3b82f6" },
                      { label: "Not Marked", color: "#6b7280" },
                    ].map((l) => (
                      <div key={l.label} style={{
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          backgroundColor: l.color,
                        }} />
                        <span style={{ color: C.muted, fontSize: 12 }}>
                          {l.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── ATTENDANCE HISTORY ── */}
                {selectedDate && (
                  <>
                    <SectionHeader
                      icon={<ClockIcon size={16} />}
                      title="Attendance History"
                    />
                    <div style={{
                      backgroundColor: C.card,
                      borderRadius: 20, border: `1px solid ${C.borderGold}`,
                      padding: "20px 20px",
                      marginBottom: 4,
                    }}>
                      {/* Date header row */}
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center",
                          gap: 6, color: C.gold,
                        }}>
                          <CalendarIcon size={15} />
                          <span style={{
                            color: C.gold, fontWeight: 700, fontSize: 14,
                          }}>
                            {selectedDate}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedDate(null)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            backgroundColor: C.faint,
                            border: "none", borderRadius: 8,
                            padding: "5px 10px", cursor: "pointer",
                            color: C.muted, fontSize: 12,
                          }}
                        >
                          <XIcon size={12} />
                          Clear
                        </button>
                      </div>

                      {filteredLogs.length === 0 ? (
                        <div style={{
                          textAlign: "center",
                          padding: "32px 0",
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 10, color: C.muted,
                          }}>
                            <ClockIcon size={48} />
                          </div>
                          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
                            No records for {selectedDate}
                          </p>
                        </div>
                      ) : (
                        filteredLogs.map((log, index) => {
                          const logDate = new Date(log.timestamp);
                          const isLogin = log.type === "login";
                          return (
                            <div key={index} className="log-row">
                              {/* Type icon */}
                              <div style={{
                                width: 40, height: 40, borderRadius: "50%",
                                backgroundColor: isLogin
                                  ? "rgba(93,190,138,0.12)"
                                  : "rgba(229,115,115,0.12)",
                                border: `1px solid ${isLogin
                                  ? "rgba(93,190,138,0.4)"
                                  : "rgba(229,115,115,0.4)"}`,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", flexShrink: 0,
                                color: isLogin ? C.green : C.red,
                              }}>
                                {isLogin
                                  ? <LoginIcon size={18} />
                                  : <LogoutIcon size={18} />
                                }
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  color: C.white, fontWeight: 700,
                                  fontSize: 14, margin: "0 0 3px",
                                }}>
                                  {isLogin ? "Check In" : "Check Out"}
                                </p>
                                <p style={{
                                  color: C.muted, fontSize: 12,
                                  margin: "0 0 4px",
                                }}>
                                  {logDate.toLocaleTimeString([], {
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                  {" · "}
                                  {logDate.toLocaleDateString()}
                                </p>
                                <div style={{
                                  display: "flex", alignItems: "center",
                                  gap: 4, color: C.muted,
                                }}>
                                  <LocationIcon size={12} />
                                  <span style={{
                                    fontSize: 12,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {log.location?.address ||
                                      log.location?.displayText ||
                                      (log.location
                                        ? `${Number(log.location.latitude).toFixed(4)}, ${Number(log.location.longitude).toFixed(4)}`
                                        : "Location unavailable")}
                                  </span>
                                </div>
                              </div>

                              {/* Photo button */}
                              {log.photo && (
                                <button
                                  className="photo-btn"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  <ImageIcon size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {/* ── TODAY'S ATTENDANCE ── */}
                <SectionHeader
                  icon={<TodayIcon size={16} />}
                  title="Today's Attendance"
                />
                <div style={{
                  backgroundColor: C.card,
                  borderRadius: 20, border: `1px solid ${C.borderGold}`,
                  padding: "4px 20px",
                  marginBottom: 32,
                }}>
                  {[
                    {
                      label: "Check-in",
                      icon: <LoginIcon size={15} />,
                      value: todayAtt?.checkInTime
                        ? new Date(todayAtt.checkInTime).toLocaleTimeString()
                        : "--",
                    },
                    {
                      label: "Check-out",
                      icon: <LogoutIcon size={15} />,
                      value: todayAtt?.checkOutTime
                        ? new Date(todayAtt.checkOutTime).toLocaleTimeString()
                        : "--",
                    },
                    {
                      label: "Work Hours",
                      icon: <TimerIcon size={15} />,
                      value: workHours,
                    },
                  ].map((row, idx, arr) => (
                    <div
                      key={row.label}
                      className="today-row"
                      style={{
                        borderBottom: idx < arr.length - 1
                          ? `1px solid ${C.border}` : "none",
                      }}
                    >
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          backgroundColor: C.goldDim,
                          border: `1px solid ${C.borderGold}`,
                          display: "flex", alignItems: "center",
                          justifyContent: "center", color: C.gold,
                        }}>
                          {row.icon}
                        </div>
                        <span style={{
                          color: C.muted, fontSize: 14, fontWeight: 500,
                        }}>
                          {row.label}
                        </span>
                      </div>
                      <span style={{
                        color: row.value === "--" ? C.muted : C.white,
                        fontWeight: 700, fontSize: 15,
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Powered By ── */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, marginTop: 8,
              marginBottom: canViewAttendance ? 0 : 32,
            }}>
              <div style={{
                height: 1, width: 16,
                backgroundColor: "rgba(201,162,39,0.3)",
              }} />
              <span style={{
                color: "rgba(201,162,39,0.5)", fontSize: 10,
                fontWeight: 500, letterSpacing: "3px",
                textTransform: "uppercase",
              }}>
                Powered by FeathrTech
              </span>
              <div style={{
                height: 1, width: 16,
                backgroundColor: "rgba(201,162,39,0.3)",
              }} />
            </div>

          </div>{/* end card-body */}
        </div>{/* end detail-card */}
      </div>{/* end detail-outer */}
    </>
  );
}