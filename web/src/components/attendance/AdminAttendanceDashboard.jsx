// src/components/attendance/AdminAttendanceDashboard.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { fetchAttendanceDashboard } from "../../api/attendanceApi";
import { useRealtime } from "../../hooks/useRealtime";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldBorder: "rgba(201,162,39,0.30)",
  goldGlow: "rgba(201,162,39,0.12)",
  bg: "#0A0A0A",
  surface: "#111111",
  card: "#161616",
  cardHover: "#1c1c1c",
  border: "#252525",
  white: "#FFFFFF",
  muted: "#555",
  mutedLight: "#888",

  presentBg: "rgba(52,199,89,0.10)",
  presentText: "#34C759",
  presentBorder: "rgba(52,199,89,0.25)",
  presentGlow: "rgba(52,199,89,0.15)",

  absentBg: "rgba(255,69,58,0.10)",
  absentText: "#FF453A",
  absentBorder: "rgba(255,69,58,0.25)",
  absentGlow: "rgba(255,69,58,0.15)",

  lateBg: "rgba(255,159,10,0.10)",
  lateText: "#FF9F0A",
  lateBorder: "rgba(255,159,10,0.25)",
  lateGlow: "rgba(255,159,10,0.15)",

  allBg: "rgba(201,162,39,0.10)",
  allText: "#C9A227",
  allBorder: "rgba(201,162,39,0.25)",
  allGlow: "rgba(201,162,39,0.15)",
};

const FILTER_META = {
  all: {
    label: "Total Staff",
    sublabel: "Registered employees",
    icon: "people",
    bg: C.allBg,
    text: C.allText,
    border: C.allBorder,
    glow: C.allGlow,
  },
  present: {
    label: "Present Today",
    sublabel: "Checked in today",
    icon: "check",
    bg: C.presentBg,
    text: C.presentText,
    border: C.presentBorder,
    glow: C.presentGlow,
  },
  absent: {
    label: "Absent Today",
    sublabel: "Not checked in",
    icon: "close",
    bg: C.absentBg,
    text: C.absentText,
    border: C.absentBorder,
    glow: C.absentGlow,
  },
  late: {
    label: "Late Today",
    sublabel: "Arrived after cutoff",
    icon: "clock",
    bg: C.lateBg,
    text: C.lateText,
    border: C.lateBorder,
    glow: C.lateGlow,
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PeopleIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CheckIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CloseIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ClockIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DocumentIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ArrowRightIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color}
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function StatIcon({ name, size, color }) {
  switch (name) {
    case "people": return <PeopleIcon size={size} color={color} />;
    case "check":  return <CheckIcon size={size} color={color} />;
    case "close":  return <CloseIcon size={size} color={color} />;
    case "clock":  return <ClockIcon size={size} color={color} />;
    default:       return null;
  }
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function ShimmerNumber() {
  return (
    <div style={{
      width: 72, height: 44, borderRadius: 8,
      backgroundColor: "#2a2a2a",
      animation: "shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ filter, count, loading, onClick, permission, canFn }) {
  const [hovered, setHovered] = useState(false);
  if (!canFn(permission)) return null;

  const meta = FILTER_META[filter];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? C.cardHover : C.card,
        border: `1px solid ${hovered ? meta.border : C.border}`,
        borderRadius: 20,
        padding: "28px 26px 24px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all .2s ease",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered
          ? `0 0 0 1px ${meta.border}, 0 12px 40px ${meta.glow}`
          : "0 2px 8px rgba(0,0,0,0.3)",
        width: "100%",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${meta.text}, transparent)`,
        opacity: hovered ? 0.8 : 0.25,
        transition: "opacity .2s",
        borderRadius: "20px 20px 0 0",
      }} />

      {/* Corner glow */}
      {hovered && (
        <div style={{
          position: "absolute",
          top: -40, right: -40,
          width: 120, height: 120,
          borderRadius: "50%",
          backgroundColor: meta.glow,
          filter: "blur(24px)",
          pointerEvents: "none",
        }} />
      )}

      {/* Top row: icon + arrow */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
      }}>
        <div style={{
          width: 50, height: 50,
          borderRadius: 14,
          backgroundColor: meta.bg,
          border: `1px solid ${meta.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .2s",
          transform: hovered ? "scale(1.1)" : "scale(1)",
          flexShrink: 0,
        }}>
          <StatIcon name={meta.icon} size={22} color={meta.text} />
        </div>

        <div style={{
          color: meta.text,
          opacity: hovered ? 1 : 0,
          transition: "opacity .2s, transform .2s",
          transform: hovered ? "translate(0,0)" : "translate(-4px, 4px)",
          marginTop: 6,
        }}>
          <ArrowRightIcon size={15} color={meta.text} />
        </div>
      </div>

      {/* Big number */}
      <div style={{ marginBottom: 10 }}>
        {loading ? (
          <ShimmerNumber />
        ) : (
          <span style={{
            color: meta.text,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -1.5,
            display: "block",
          }}>
            {count ?? "—"}
          </span>
        )}
      </div>

      {/* Label */}
      <span style={{
        color: C.white,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: 0.1,
        marginBottom: 4,
        display: "block",
      }}>
        {meta.label}
      </span>

      {/* Sublabel */}
      <span style={{
        color: C.mutedLight,
        fontSize: 12,
        fontWeight: 400,
        display: "block",
        lineHeight: 1.4,
      }}>
        {meta.sublabel}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminAttendanceDashboard() {
  const router = useRouter();
  const permissions = useAuthStore((s) => s.permissions) || [];
  const canFn = useCallback((key) => permissions.includes(key), [permissions]);

  const [summary, setSummary] = useState({
    all: null, present: null, absent: null, late: null,
  });
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const todayIST = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const filters = ["all", "present", "absent", "late"];
      const results = await Promise.all(
        filters.map((filter) =>
          fetchAttendanceDashboard({ filter, date: todayIST })
            .then((res) => ({ filter, total: res.data.total ?? 0 }))
            .catch(() => ({ filter, total: null }))
        )
      );
      const next = {};
      results.forEach(({ filter, total }) => (next[filter] = total));
      setSummary(next);
    } catch (err) {
      console.log("Dashboard summary error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useRealtime("attendance:updated", loadSummary);
  useRealtime("attendance:checkin", loadSummary);
  useRealtime("attendance:checkout", loadSummary);

  const goToMonitor = (filter) =>
    router.push(`/attendance/live?filter=${filter}`);

  // ── Show report button if user can view the dashboard summary ──
  const showReport = canFn("attendance.view.dashboard_summary");

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric",
    month: "long", day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 0.3; }
          50%  { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .ad-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .ad-wrap {
          width: 100%;
          max-width: 560px;
          animation: fadeIn .4s ease forwards;
        }

        .ad-header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          padding-top: 48px;
        }

        .ad-back-btn {
          position: absolute;
          left: 0;
          top: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: ${C.card};
          border: 1px solid ${C.goldBorder};
          border-radius: 10px;
          padding: 8px 13px;
          color: ${C.gold};
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .ad-back-btn:hover { filter: brightness(1.2); }

        @media (max-width: 400px) {
          .ad-back-label { display: none; }
          .ad-back-btn   { padding: 8px 10px; }
        }

        .ad-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          margin: 0 0 10px;
        }

        .ad-title {
          color: ${C.white};
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 8px;
          line-height: 1.15;
        }

        .ad-date {
          color: ${C.mutedLight};
          font-size: 13px;
          margin: 0;
          font-weight: 400;
        }

        .ad-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .ad-divider-line {
          flex: 1;
          height: 1px;
          background: ${C.border};
        }
        .ad-divider-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: ${C.gold};
          opacity: 0.6;
        }

        .ad-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        /* ── Report button ── */
        .report-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background-color: ${C.gold};
          border: none;
          border-radius: 16px;
          padding: 16px;
          color: #000;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter .15s, transform .1s, box-shadow .15s;
          margin-top: 4px;
        }
        .report-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,162,39,0.28);
        }
        .report-btn:active { transform: translateY(0); }

        @media (min-width: 640px) {
          .ad-wrap  { max-width: 600px; }
          .ad-title { font-size: 30px; }
          .ad-grid  { gap: 18px; }
        }

        @media (min-width: 1024px) {
          .ad-wrap { max-width: 620px; }
        }

        @media (max-width: 400px) {
          .ad-outer { padding: 24px 12px; }
          .ad-grid  { gap: 10px; }
          .ad-title { font-size: 22px; }
        }

        @media (max-width: 300px) {
          .ad-grid { grid-template-columns: 1fr; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.2);
          border-radius: 4px;
        }
      `}</style>

      <div className="ad-outer">
        <div className="ad-wrap">

          {/* ── Header ── */}
          <div className="ad-header">
            <button
              className="ad-back-btn"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeftIcon size={15} />
              <span className="ad-back-label">Back</span>
            </button>

            <p className="ad-eyebrow">Attendance Management</p>
            <h1 className="ad-title">Attendance Overview</h1>
            <p className="ad-date">{todayLabel}</p>
          </div>

          {/* ── Decorative divider ── */}
          <div className="ad-divider">
            <div className="ad-divider-line" />
            <div className="ad-divider-dot" />
            <div className="ad-divider-line" />
          </div>

          {/* ── 2×2 stat cards ── */}
          <div className="ad-grid">
            <StatCard
              filter="all"
              permission="attendance.view.dashboard_summary"
              count={summary.all}
              loading={loading}
              canFn={canFn}
              onClick={() => goToMonitor("all")}
            />
            <StatCard
              filter="present"
              permission="attendance.view.live_status"
              count={summary.present}
              loading={loading}
              canFn={canFn}
              onClick={() => goToMonitor("present")}
            />
            <StatCard
              filter="absent"
              permission="attendance.view.live_status"
              count={summary.absent}
              loading={loading}
              canFn={canFn}
              onClick={() => goToMonitor("absent")}
            />
            <StatCard
              filter="late"
              permission="attendance.view.live_status"
              count={summary.late}
              loading={loading}
              canFn={canFn}
              onClick={() => goToMonitor("late")}
            />
          </div>

          {/* ── View Detailed Report button ── */}
          {showReport && (
            <button
              className="report-btn"
              onClick={() => router.push("/attendance/reports")}
            >
              <DocumentIcon size={18} color="#000" />
              View Detailed Report
            </button>
          )}

        </div>
      </div>
    </>
  );
}