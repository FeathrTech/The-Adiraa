// src/components/sites/VenueDetailsScreen.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { fetchSiteById } from "../../api/siteApi";
import { fetchHalls, deleteHall } from "../../api/hallApi";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "rgba(201,162,39,0.12)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  green: "#5DBE8A",
  greenDim: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  danger: "#C0392B",
  dangerLight: "rgba(192,57,43,0.15)",
  dangerBright: "#E74C3C",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BuildingIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

function LocationIcon({ size = 18, color = "currentColor", filled = false }) {
  return (
    <svg width={size} height={size} fill={filled ? color : "none"} stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function GridIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function DocumentIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CalendarIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function RefreshIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function StorefrontIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function RadioIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
    </svg>
  );
}

function MapIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function PencilIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PeopleIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TrashIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Spinner({ size = 32, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "vd-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formattedDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
      marginTop: 10,
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        backgroundColor: C.goldDim,
        border: `1px solid ${C.borderGold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        color: C.gold,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      padding: "14px 0",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        backgroundColor: C.faint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 2,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 4, letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{
          color: accent || C.white,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, borderColor, bgColor }) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: bgColor || C.card,
      borderRadius: 16,
      border: `1px solid ${borderColor || C.border}`,
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
    }}>
      <div style={{
        width: 46,
        height: 46,
        borderRadius: "50%",
        backgroundColor: bgColor || C.goldDim,
        border: `1px solid ${borderColor || C.borderGold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {icon}
      </div>
      <span style={{
        color: color || C.gold,
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: -0.5,
        lineHeight: 1,
      }}>
        {value ?? "—"}
      </span>
      <span style={{
        color: C.muted,
        fontSize: 12,
        textAlign: "center",
        letterSpacing: 0.3,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ hallName, onConfirm, onCancel, deleting }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !deleting) onCancel();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        animation: "vd-fadeIn .2s ease forwards",
      }}
    >
      <div style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.borderGold}`,
        borderRadius: 24,
        padding: "32px 28px 28px",
        maxWidth: 400,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        animation: "vd-modalPop .25s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}>

        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: "rgba(192,57,43,0.12)",
          border: "1.5px solid rgba(192,57,43,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.danger,
          marginBottom: 20,
        }}>
          <AlertTriangleIcon size={34} />
        </div>

        {/* Title */}
        <h2 style={{
          color: C.white,
          fontSize: 20,
          fontWeight: 800,
          margin: "0 0 10px",
          textAlign: "center",
          letterSpacing: -0.3,
        }}>
          Delete Hall?
        </h2>

        {/* Body */}
        <p style={{
          color: C.muted,
          fontSize: 14,
          margin: "0 0 28px",
          lineHeight: 1.65,
          textAlign: "center",
          maxWidth: 300,
        }}>
          You are about to permanently delete{" "}
          <span style={{
            color: C.white,
            fontWeight: 700,
            backgroundColor: "rgba(255,255,255,0.06)",
            padding: "1px 7px",
            borderRadius: 6,
          }}>
            {hallName}
          </span>
          . This action{" "}
          <span style={{ color: C.dangerBright, fontWeight: 600 }}>
            cannot be undone
          </span>
          .
        </p>

        {/* Divider */}
        <div style={{
          width: "100%",
          height: 1,
          backgroundColor: C.border,
          marginBottom: 20,
        }} />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              backgroundColor: C.faint,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "11px 0",
              color: C.white,
              fontWeight: 600,
              fontSize: 14,
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.45 : 1,
              transition: "filter .15s",
            }}
            onMouseEnter={e => !deleting && (e.currentTarget.style.filter = "brightness(1.3)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              backgroundColor: C.danger,
              border: "none",
              borderRadius: 12,
              padding: "11px 0",
              color: C.white,
              fontWeight: 700,
              fontSize: 14,
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              opacity: deleting ? 0.75 : 1,
              transition: "filter .15s",
              boxShadow: "0 4px 14px rgba(192,57,43,0.35)",
            }}
            onMouseEnter={e => !deleting && (e.currentTarget.style.filter = "brightness(1.15)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          >
            {deleting
              ? <><Spinner size={15} color="#fff" /> Deleting…</>
              : <><TrashIcon size={15} color="#fff" /> Delete Hall</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", visible }) {
  const bg   = type === "success" ? "rgba(39,174,96,0.95)" : "rgba(192,57,43,0.95)";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div style={{
      position: "fixed",
      bottom: 32,
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: "opacity .3s ease, transform .3s ease",
      backgroundColor: bg,
      color: "#fff",
      borderRadius: 12,
      padding: "12px 22px",
      fontSize: 14,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 9,
      zIndex: 2000,
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 900,
        flexShrink: 0,
      }}>
        {icon}
      </span>
      {message}
    </div>
  );
}

// ─── Hall Card ────────────────────────────────────────────────────────────────
function HallCard({ hall, onDelete, canDelete }) {
  const [deleteHovered, setDeleteHovered] = useState(false);

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 14,
      border: `1px solid ${C.borderGold}`,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      transition: "border-color .18s",
      animation: "vd-fadeIn .3s ease forwards",
    }}>
      {/* Icon */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        backgroundColor: C.goldDim,
        border: `1px solid ${C.borderGold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <BuildingIcon size={18} color={C.gold} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: C.white,
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {hall.name}
        </div>

        {hall.description && (
          <div style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {hall.description}
          </div>
        )}

        {hall.capacity && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <PeopleIcon size={12} color={C.muted} />
            <span style={{ color: C.muted, fontSize: 12 }}>
              Capacity:{" "}
              <span style={{ color: C.goldLight, fontWeight: 600 }}>
                {hall.capacity}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={() => onDelete(hall)}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          title="Delete hall"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${deleteHovered ? C.danger : "transparent"}`,
            backgroundColor: deleteHovered ? C.dangerLight : "transparent",
            color: deleteHovered ? C.dangerBright : C.muted,
            cursor: "pointer",
            transition: "all .15s",
            flexShrink: 0,
          }}
        >
          <TrashIcon size={15} color={deleteHovered ? C.dangerBright : C.muted} />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VenueDetailsScreen() {
  const router  = useRouter();
  const params  = useParams();
  const siteId  = params?.siteId || params?.id;

  const permissions = useAuthStore((s) => s.permissions) || [];
  const canEdit      = permissions.includes("site.edit");
  // const canDeleteHall = permissions.includes("hall.delete");

  const [site,        setSite]        = useState(null);
  const [halls,       setHalls]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [confirmHall, setConfirmHall] = useState(null);  // { id, name }
  const [deleting,    setDeleting]    = useState(false);
  const [toast,       setToast]       = useState({ visible: false, message: "", type: "success" });

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!siteId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [siteData, hallData] = await Promise.all([
          fetchSiteById(siteId),
          fetchHalls(siteId).catch(() => []),
        ]);
        setSite(siteData);
        setHalls(Array.isArray(hallData) ? hallData : []);
      } catch (err) {
        console.error("VenueDetails load error:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [siteId]);

  // ── Delete hall handler ────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmHall) return;
    try {
      setDeleting(true);
      await deleteHall(siteId, confirmHall.id);
      // Optimistic remove
      setHalls((prev) => prev.filter((h) => h.id !== confirmHall.id));
      showToast(`"${confirmHall.name}" deleted successfully`, "success");
      setConfirmHall(null);
    } catch (err) {
      console.error("Hall delete failed:", err?.response?.data || err.message);
      showToast("Failed to delete hall", "error");
    } finally {
      setDeleting(false);
    }
  };

  const hasLocation = !!(site?.latitude && site?.longitude);

  const openMaps = () => {
    if (!hasLocation) return;
    window.open(
      `https://maps.google.com/?q=${site.latitude},${site.longitude}`,
      "_blank"
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !site) {
    return (
      <>
        <style>{`
          @keyframes vd-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          *, *::before, *::after { box-sizing: border-box; }
        `}</style>
        <div style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}>
          <Spinner size={36} color={C.gold} />
          <span style={{
            color: C.muted,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}>
            Loading Venue
          </span>
        </div>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes vd-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vd-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vd-modalPop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }

        *, *::before, *::after { box-sizing: border-box; }

        .vd-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 20px 48px;
        }

        .vd-surface {
          width: 100%;
          max-width: 860px;
          background-color: ${C.surface};
          border-radius: 28px;
          border: 1px solid ${C.borderGold};
          padding: 24px 20px;
          animation: vd-fadeIn .35s ease forwards;
        }

        @media (min-width: 480px) {
          .vd-surface { padding: 28px 26px; }
          .vd-outer   { padding: 28px 24px 60px; }
        }
        @media (min-width: 768px) {
          .vd-surface { padding: 34px 36px; }
          .vd-outer   { padding: 36px 32px 60px; }
        }

        .vd-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .vd-header-mid {
          flex: 1;
          min-width: 0;
        }

        .vd-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: ${C.faint};
          border: 1px solid ${C.borderGold};
          border-radius: 10px;
          padding: 8px 13px;
          color: ${C.gold};
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .vd-back-btn:hover { filter: brightness(1.2); }

        .vd-back-label { display: none; }
        @media (min-width: 480px) { .vd-back-label { display: inline; } }

        .vd-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 3px;
        }
        @media (min-width: 480px) { .vd-eyebrow { font-size: 11px; } }

        .vd-title {
          color: ${C.white};
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.3px;
          margin: 0;
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 480px) { .vd-title { font-size: 24px; } }
        @media (min-width: 768px) { .vd-title { font-size: 28px; } }

        .vd-edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: ${C.gold};
          border: none;
          border-radius: 12px;
          padding: 9px 16px;
          color: #000;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: filter .15s, transform .1s;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .vd-edit-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .vd-edit-label { display: none; }
        @media (min-width: 480px) { .vd-edit-label { display: inline; } }

        .vd-stats {
          display: flex;
          gap: 14px;
          margin-bottom: 6px;
        }

        .vd-info-card {
          background-color: ${C.card};
          border-radius: 16px;
          border: 1px solid ${C.borderGold};
          padding: 0 20px;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .vd-gps-card {
          border-radius: 16px;
          border-width: 1px;
          border-style: solid;
          padding: 18px 20px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .vd-coord-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (min-width: 480px) {
          .vd-coord-row { flex-direction: row; gap: 14px; }
          .vd-coord-row > * { flex: 1; }
        }

        .vd-coord-box {
          background-color: ${C.faint};
          border-radius: 10px;
          padding: 12px 14px;
        }

        .vd-maps-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: ${C.faint};
          border: 1px solid ${C.greenBorder};
          border-radius: 12px;
          padding: 12px 18px;
          color: ${C.green};
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: filter .15s, transform .1s;
          width: 100%;
        }
        .vd-maps-btn:hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }

        .vd-halls-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 8px;
        }
        @media (min-width: 640px) {
          .vd-halls-grid { grid-template-columns: 1fr 1fr; }
        }

        .vd-halls-empty {
          background-color: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 36px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          text-align: center;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25);
          border-radius: 4px;
        }
      `}</style>

      <div className="vd-outer">
        <div className="vd-surface">

          {/* ── Header ── */}
          <div className="vd-header">
            <button className="vd-back-btn" onClick={() => router.back()}>
              <ArrowLeftIcon size={15} />
              <span className="vd-back-label">Back</span>
            </button>

            <div className="vd-header-mid">
              <p className="vd-eyebrow">Venue Management</p>
              <h1 className="vd-title" title={site.name}>{site.name}</h1>
            </div>

            {canEdit && (
              <button
                className="vd-edit-btn"
                onClick={() => router.push(`/sites/${siteId}/edit`)}
              >
                <PencilIcon size={14} color="#000" />
                <span className="vd-edit-label">Edit</span>
              </button>
            )}
          </div>

          {/* ── Stats ── */}
          <div className="vd-stats">
            <StatCard
              icon={<GridIcon size={20} color={C.gold} />}
              label="Halls"
              value={halls.length}
              color={C.gold}
              bgColor={C.goldDim}
              borderColor={C.borderGold}
            />
            <StatCard
              icon={<RadioIcon size={20} color={C.green} />}
              label="Radius (m)"
              value={site.allowedRadius ?? 100}
              color={C.green}
              bgColor={C.greenDim}
              borderColor={C.greenBorder}
            />
          </div>

          {/* ══ SITE INFORMATION ══ */}
          <SectionHeader
            title="Site Information"
            icon={<BuildingIcon size={16} color={C.gold} />}
          />

          <div className="vd-info-card">
            <InfoRow
              icon={<StorefrontIcon size={15} color={C.gold} />}
              label="Venue Name"
              value={site.name}
              accent={C.gold}
            />
            <InfoRow
              icon={<DocumentIcon size={15} color={C.muted} />}
              label="Address / Description"
              value={site.address || "No address provided"}
            />
            <InfoRow
              icon={<CalendarIcon size={15} color={C.muted} />}
              label="Created"
              value={formattedDate(site.createdAt)}
            />
            <InfoRow
              icon={<RefreshIcon size={15} color={C.muted} />}
              label="Last Updated"
              value={formattedDate(site.updatedAt)}
            />
          </div>

          {/* ══ GPS LOCATION ══ */}
          <SectionHeader
            title="GPS Location"
            icon={<LocationIcon size={16} color={C.gold} />}
          />

          <div
            className="vd-gps-card"
            style={{
              backgroundColor: hasLocation ? C.greenDim : C.card,
              borderColor: hasLocation ? C.greenBorder : C.border,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LocationIcon
                size={20}
                color={hasLocation ? C.green : C.muted}
                filled={hasLocation}
              />
              <span style={{
                color: hasLocation ? C.green : C.muted,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0.5,
              }}>
                {hasLocation ? "Location Set" : "No Location Data"}
              </span>
            </div>

            {hasLocation && (
              <>
                <div className="vd-coord-row">
                  <div className="vd-coord-box">
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 5, letterSpacing: 0.5 }}>
                      Latitude
                    </div>
                    <div style={{
                      color: C.white,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}>
                      {Number(site.latitude).toFixed(6)}
                    </div>
                  </div>
                  <div className="vd-coord-box">
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 5, letterSpacing: 0.5 }}>
                      Longitude
                    </div>
                    <div style={{
                      color: C.white,
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}>
                      {Number(site.longitude).toFixed(6)}
                    </div>
                  </div>
                </div>

                <button className="vd-maps-btn" onClick={openMaps}>
                  <MapIcon size={16} color={C.green} />
                  Open in Google Maps
                </button>
              </>
            )}
          </div>

          {/* ══ HALLS ══ */}
          <SectionHeader
            title={`Halls (${halls.length})`}
            icon={<GridIcon size={16} color={C.gold} />}
          />

          {halls.length === 0 ? (
            <div className="vd-halls-empty">
              <div style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: C.faint,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <GridIcon size={26} color={C.muted} />
              </div>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                No halls have been added to this venue yet
              </p>
            </div>
          ) : (
            <div className="vd-halls-grid">
              {halls.map((hall) => (
                <HallCard
                  key={hall.id}
                  hall={hall}
                  canDelete={true}
                  onDelete={(h) => setConfirmHall({ id: h.id, name: h.name })}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmHall && (
        <ConfirmModal
          hallName={confirmHall.name}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setConfirmHall(null)}
        />
      )}

      {/* ── Toast ── */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </>
  );
}