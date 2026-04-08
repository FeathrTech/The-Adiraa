// src/components/sites/VenueScreen.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { useSiteStore } from "../../store/siteStore";
import { fetchSites, deleteSite } from "../../api/siteApi";
import { socket } from "../../utils/socket";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  danger: "#C0392B",
  dangerLight: "rgba(192,57,43,0.15)",
  dangerBright: "#E74C3C",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BuildingIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

function LocationIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function AddIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronRightIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function LockIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Spinner({ size = 28, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "vs-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ siteName, onConfirm, onCancel, deleting }) {
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
        animation: "vs-fadeIn .2s ease forwards",
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
        gap: 0,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        animation: "vs-modalPop .25s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}>

        {/* Danger icon circle */}
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
          flexShrink: 0,
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
          Delete Site?
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
            {siteName}
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
              transition: "filter .15s, transform .1s",
              boxShadow: "0 4px 14px rgba(192,57,43,0.35)",
            }}
            onMouseEnter={e => !deleting && (e.currentTarget.style.filter = "brightness(1.15)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          >
            {deleting
              ? <><Spinner size={15} color="#fff" /> Deleting…</>
              : <><TrashIcon size={15} /> Delete Site</>
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

// ─── Site Card ────────────────────────────────────────────────────────────────
function SiteCard({ site, onClick, onDelete, canDelete }) {
  const [hovered, setHovered]             = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteHovered(false); }}
      style={{
        backgroundColor: hovered ? "#1F1F1F" : C.card,
        borderRadius: 16,
        border: `1px solid ${hovered ? C.gold : C.borderGold}`,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all .18s ease",
        boxShadow: hovered ? "0 4px 20px rgba(201,162,39,0.12)" : "none",
        position: "relative",
        animation: "vs-fadeIn .3s ease forwards",
      }}
    >
      {/* Left: icon + info */}
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flex: 1,
          minWidth: 0,
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "rgba(201,162,39,0.12)",
          border: `1px solid ${C.borderGold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform .18s",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}>
          <BuildingIcon size={20} color={C.gold} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{
            color: C.white,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {site.name}
          </div>

          {site.latitude && site.longitude && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <LocationIcon size={12} color={C.muted} />
              <span style={{ color: C.muted, fontSize: 12 }}>
                {Number(site.latitude).toFixed(4)},{" "}
                {Number(site.longitude).toFixed(4)}
              </span>
            </div>
          )}

          {site.address && (
            <div style={{
              color: C.muted,
              fontSize: 12,
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {site.address}
            </div>
          )}
        </div>
      </div>

      {/* Right: delete + chevron */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        marginLeft: 10,
      }}>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            onMouseEnter={() => setDeleteHovered(true)}
            onMouseLeave={() => setDeleteHovered(false)}
            title="Delete site"
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
            <TrashIcon size={15} />
          </button>
        )}

        <div
          onClick={onClick}
          style={{
            color: hovered ? C.gold : C.muted,
            transition: "color .18s, transform .18s",
            transform: hovered ? "translateX(3px)" : "translateX(0)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRightIcon size={18} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VenueScreen() {
  const router      = useRouter();
  const permissions = useAuthStore((s) => s.permissions) || [];

  // ✅ Read sites for rendering only
  const sites    = useSiteStore((s) => Array.isArray(s.sites) ? s.sites : []);
  const setSites = useSiteStore((s) => s.setSites);

  const [loading,     setLoading]     = useState(false);
  const [confirmSite, setConfirmSite] = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [toast,       setToast]       = useState({ visible: false, message: "", type: "success" });

  const canView   = permissions.includes("site.view");
  const canCreate = permissions.includes("site.create");
  const canDelete = permissions.includes("site.delete");

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  // ── Load sites ─────────────────────────────────────────────────────────────
  const loadSites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSites();
      // ✅ data is a direct array — safe to pass straight to setSites
      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Site fetch error:", err?.response?.data || err.message);
      showToast("Failed to load sites", "error");
    } finally {
      setLoading(false);
    }
  }, [setSites, showToast]);

  useEffect(() => { loadSites(); }, [loadSites]);

  // ── Real-time socket listeners ─────────────────────────────────────────────
  useEffect(() => {
    socket.on("site:created", (newSite) => {
      // ✅ Read latest state directly from store, no updater function
      const current = useSiteStore.getState().sites;
      const safe    = Array.isArray(current) ? current : [];
      if (safe.find((s) => s.id === newSite.id)) return; // duplicate guard
      setSites([newSite, ...safe]);
      showToast(`New site "${newSite.name}" added`, "success");
    });

    socket.on("site:updated", (updatedSite) => {
      const current = useSiteStore.getState().sites;
      const safe    = Array.isArray(current) ? current : [];
      setSites(safe.map((s) => (s.id === updatedSite.id ? updatedSite : s)));
    });

    socket.on("site:deleted", ({ id }) => {
      const current = useSiteStore.getState().sites;
      const safe    = Array.isArray(current) ? current : [];
      setSites(safe.filter((s) => s.id !== id));
      showToast("A site was removed", "error");
    });

    return () => {
      socket.off("site:created");
      socket.off("site:updated");
      socket.off("site:deleted");
    };
  }, [setSites, showToast]);

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmSite) return;
    try {
      setDeleting(true);
      await deleteSite(confirmSite.id);
      // ✅ Read latest from store directly, no updater function
      const current = useSiteStore.getState().sites;
      const safe    = Array.isArray(current) ? current : [];
      setSites(safe.filter((s) => s.id !== confirmSite.id));
      showToast(`"${confirmSite.name}" deleted successfully`, "success");
      setConfirmSite(null);
    } catch (err) {
      console.error("Delete failed:", err?.response?.data || err.message);
      showToast("Failed to delete site", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes vs-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vs-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vs-modalPop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }

        *, *::before, *::after { box-sizing: border-box; }

        .vs-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 24px 20px 40px;
        }

        .vs-surface {
          width: 100%;
          max-width: 960px;
          background-color: ${C.surface};
          border-radius: 28px;
          border: 1px solid ${C.borderGold};
          padding: 28px;
          display: flex;
          flex-direction: column;
          animation: vs-fadeIn .35s ease forwards;
          position: relative;
        }

        .vs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 22px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 24px;
          gap: 12px;
        }

        .vs-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .vs-back-btn {
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
        .vs-back-btn:hover { filter: brightness(1.2); }

        .vs-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 3px;
        }

        .vs-title {
          color: ${C.white};
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.3px;
          margin: 0;
          line-height: 1;
        }

        .vs-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(39,174,96,0.1);
          border: 1px solid rgba(39,174,96,0.3);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #2ECC71;
          letter-spacing: 0.5px;
        }
        .vs-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #2ECC71;
          animation: vs-pulse 1.8s ease infinite;
        }
        @keyframes vs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }

        .vs-add-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background-color: ${C.gold};
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          color: #000;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: filter .15s, transform .1s, box-shadow .15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .vs-add-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201,162,39,0.28);
        }
        .vs-add-btn:active { transform: translateY(0); }

        .vs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(201,162,39,0.15);
          border: 1px solid ${C.borderGold};
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 12px;
          font-weight: 700;
          color: ${C.gold};
          margin-left: 8px;
          vertical-align: middle;
        }

        .vs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 80px;
        }

        @media (min-width: 768px) {
          .vs-grid {
            grid-template-columns: 1fr 1fr;
            padding-bottom: 16px;
          }
          .vs-title  { font-size: 28px; }
          .vs-eyebrow { font-size: 11px; }
          .vs-surface { padding: 32px; }
          .vs-outer   { padding: 28px 24px 40px; }
        }

        .vs-add-label { display: none; }
        @media (min-width: 480px) {
          .vs-add-label { display: inline; }
        }

        .vs-fab {
          position: fixed;
          bottom: 28px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: ${C.gold};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(201,162,39,0.45);
          transition: transform .15s, box-shadow .15s;
          z-index: 100;
        }
        .vs-fab:hover  { transform: scale(1.08); box-shadow: 0 6px 28px rgba(201,162,39,0.55); }
        .vs-fab:active { transform: scale(0.97); }
        .vs-fab { display: flex; }
        @media (min-width: 768px) { .vs-fab { display: none; } }

        .vs-add-btn-wrap { display: none; }
        @media (min-width: 768px) { .vs-add-btn-wrap { display: flex; } }

        .vs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          flex: 1;
        }

        .vs-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 14px;
        }

        .vs-noaccess {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 12px;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25); border-radius: 4px;
        }
      `}</style>

      <div className="vs-outer">
        <div className="vs-surface">

          {/* No access */}
          {!canView ? (
            <div className="vs-noaccess">
              <div style={{ color: C.faint }}><LockIcon size={48} /></div>
              <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>No Access</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="vs-header">
                <div className="vs-header-left">
                  <button className="vs-back-btn" onClick={() => router.back()}>
                    <ArrowLeftIcon size={15} />
                    <span className="vs-add-label">Back</span>
                  </button>

                  <div>
                    <p className="vs-eyebrow">Management</p>
                    <h1 className="vs-title">
                      Venues
                      {sites.length > 0 && (
                        <span className="vs-count">{sites.length}</span>
                      )}
                    </h1>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="vs-live-badge">
                    <span className="vs-live-dot" />
                    LIVE
                  </div>

                  {canCreate && (
                    <div className="vs-add-btn-wrap">
                      <button
                        className="vs-add-btn"
                        onClick={() => router.push("/sites/create")}
                      >
                        <AddIcon size={16} />
                        <span>Add Site</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading */}
              {loading ? (
                <div className="vs-loading">
                  <Spinner size={30} color={C.gold} />
                  <span style={{
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}>
                    Loading
                  </span>
                </div>

              /* Empty state */
              ) : sites.length === 0 ? (
                <div className="vs-empty">
                  <div style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    backgroundColor: C.faint,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}>
                    <BuildingIcon size={40} color={C.muted} />
                  </div>
                  <p style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
                    No Venues Yet
                  </p>
                  <p style={{ color: C.muted, fontSize: 13, margin: 0, textAlign: "center" }}>
                    No banquet sites have been created yet
                  </p>
                  {canCreate && (
                    <button
                      onClick={() => router.push("/sites/create")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: C.gold,
                        border: "none",
                        borderRadius: 14,
                        padding: "13px 28px",
                        color: "#000",
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: "pointer",
                        marginTop: 12,
                        transition: "filter .15s, transform .1s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.filter = "brightness(1.1)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.filter = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <AddIcon size={16} />
                      Create Your First Site
                    </button>
                  )}
                </div>

              /* Sites grid */
              ) : (
                <div className="vs-grid">
                  {sites.map((site) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onClick={() => router.push(`/sites/${site.id}`)}
                      canDelete={canDelete}
                      onDelete={() => setConfirmSite({ id: site.id, name: site.name })}
                    />
                  ))}
                </div>
              )}

              {/* Confirm Delete Modal */}
              {confirmSite && (
                <ConfirmModal
                  siteName={confirmSite.name}
                  deleting={deleting}
                  onConfirm={handleDeleteConfirm}
                  onCancel={() => !deleting && setConfirmSite(null)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* FAB — mobile only */}
      {canView && canCreate && !loading && sites.length > 0 && (
        <button
          className="vs-fab"
          onClick={() => router.push("/sites/create")}
          title="Add Site"
        >
          <AddIcon size={26} />
        </button>
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </>
  );
}