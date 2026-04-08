// src/components/attendance/AttendanceConfigScreen.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchRoles } from "../../../api/roleApi";
import api from "../../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldDim: "rgba(201,162,39,0.15)",
  goldDimMed: "rgba(201,162,39,0.08)",
  borderGold: "rgba(201,162,39,0.4)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#222",
  green: "#5DBE8A",
  greenDim: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#F87171",
  redDim: "rgba(248,113,113,0.12)",
  redBorder: "rgba(248,113,113,0.35)",
};

const LATE_THRESHOLD_MAX = 999;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function TimeIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function LocationIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function AlarmIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 14 15" />
      <path d="M5 3L2 6M22 6l-3-3" />
    </svg>
  );
}
function BellIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function PeopleIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function CheckIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function HourglassIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M5 2h14M5 22h14M6 2v4l6 6-6 6v4M18 2v4l-6 6 6 6v4" />
    </svg>
  );
}
function ArrowLeftIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function SaveIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
function Spinner({ size = 20, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "ac-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: isErr ? "rgba(248,113,113,0.15)" : "rgba(93,190,138,0.15)",
      border: `1px solid ${isErr ? "rgba(248,113,113,0.4)" : "rgba(93,190,138,0.4)"}`,
      borderRadius: 12, padding: "12px 22px",
      color: isErr ? C.red : C.green,
      fontWeight: 600, fontSize: 13,
      zIndex: 9999, whiteSpace: "nowrap",
      animation: "ac-fadeIn .25s ease",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      {message}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26, borderRadius: 13,
        backgroundColor: value ? C.gold : C.border,
        position: "relative", cursor: "pointer",
        transition: "background-color .2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 3, left: value ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        backgroundColor: value ? "#000" : C.muted,
        transition: "left .2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, sublabel, value, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
    }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ color: C.white, fontWeight: 600, fontSize: 14 }}>{label}</div>
        {sublabel && (
          <div style={{ color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{sublabel}</div>
        )}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      padding: "22px 20px",
      marginBottom: 18,
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, marginBottom: 18,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: C.goldDim,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{
          color: C.gold, fontWeight: 700, fontSize: 12,
          letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Time Input ───────────────────────────────────────────────────────────────
function TimeInput({ value, onChange, placeholder }) {
  const [raw, setRaw] = useState(value ?? "");
  const [error, setError] = useState(false);

  useEffect(() => {
    setRaw(value ?? "");
    setError(false);
  }, [value]);

  const validate = (text) => {
    if (!text) { setError(false); onChange(null); return; }
    const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (match) { setError(false); onChange(text); }
    else { setError(true); onChange(null); }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    let formatted = text.replace(/[^0-9:]/g, "");
    if (
      formatted.length === 2 &&
      !formatted.includes(":") &&
      text.length > raw.length
    ) {
      formatted = formatted + ":";
    }
    if (formatted.length > 5) return;
    setRaw(formatted);

    if (formatted.length === 0) { setError(false); onChange(null); return; }

    const match = formatted.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (match) { setError(false); onChange(formatted); }
    else if (formatted.length === 5) { setError(true); onChange(null); }
  };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center",
        backgroundColor: C.faint,
        borderRadius: 12,
        border: `1px solid ${error ? C.redBorder : raw ? C.borderGold : C.border}`,
        padding: "10px 14px",
        gap: 8,
        transition: "border-color .15s",
      }}>
        <TimeIcon size={17} color={error ? C.red : raw ? C.gold : C.muted} />
        <input
          value={raw}
          onChange={handleChange}
          onBlur={() => validate(raw)}
          placeholder={placeholder ?? "HH:MM"}
          maxLength={5}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: error ? C.red : C.white,
            fontSize: 14, fontWeight: 600,
            letterSpacing: 2, fontVariantNumeric: "tabular-nums",
            caretColor: C.gold,
          }}
        />
        {raw && !error && (
          <div style={{
            backgroundColor: C.greenDim,
            borderRadius: 6, padding: "2px 7px",
          }}>
            <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>IST</span>
          </div>
        )}
        {raw && (
          <div
            onClick={() => { setRaw(""); setError(false); onChange(null); }}
            style={{ cursor: "pointer", display: "flex", color: C.muted }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div style={{ color: C.red, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
          Use HH:MM format (e.g. 17:30)
        </div>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceConfigScreen() {
  const router = useRouter();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const [allowOutsideRadius, setAllowOutsideRadius] = useState(false);
  const [allowLateCheckIn, setAllowLateCheckIn] = useState(true);
  const [lateThreshold, setLateThreshold] = useState("0");
  const [lateThresholdError, setLateThresholdError] = useState(false);
  const [checkoutReminder1, setCheckoutReminder1] = useState(null);
  const [checkoutReminder2, setCheckoutReminder2] = useState(null);

  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Load roles ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch {
        showToast("Failed to load roles", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load config for selected role ───────────────────────────────────────────
  const loadRoleConfig = useCallback(async (roleId) => {
    try {
      setConfigLoading(true);
      const res = await api.get(`/attendance/config/${roleId}`);
      const d = res.data;
      setAllowOutsideRadius(!!d.allowOutsideRadius);
      setAllowLateCheckIn(d.allowLateCheckIn !== false);
      setLateThreshold(String(d.lateThreshold ?? 0));
      setLateThresholdError(false);
      setCheckoutReminder1(d.checkoutReminder1 ?? null);
      setCheckoutReminder2(d.checkoutReminder2 ?? null);
    } catch {
      setAllowOutsideRadius(false);
      setAllowLateCheckIn(true);
      setLateThreshold("0");
      setLateThresholdError(false);
      setCheckoutReminder1(null);
      setCheckoutReminder2(null);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // ── Late threshold handlers ─────────────────────────────────────────────────
  const handleLateThresholdChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, "");
    if (cleaned === "") { setLateThreshold(""); setLateThresholdError(false); return; }
    const num = parseInt(cleaned, 10);
    if (num > LATE_THRESHOLD_MAX) {
      setLateThreshold(String(LATE_THRESHOLD_MAX));
      setLateThresholdError(false);
    } else {
      setLateThreshold(cleaned);
      setLateThresholdError(false);
    }
  };

  const handleLateThresholdBlur = () => {
    const num = parseInt(lateThreshold, 10);
    if (lateThreshold === "" || isNaN(num) || num < 0) {
      setLateThreshold("0");
      setLateThresholdError(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveConfig = async () => {
    if (!selectedRole) { showToast("Please select a role first", "error"); return; }
    const threshold = Number(lateThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > LATE_THRESHOLD_MAX) {
      showToast(`Late threshold must be between 0 and ${LATE_THRESHOLD_MAX}`, "error");
      return;
    }
    try {
      setSaving(true);
      await api.post("/attendance/config", {
        roleId: selectedRole,
        allowOutsideRadius,
        allowLateCheckIn,
        lateThreshold: threshold,
        checkoutReminder1: checkoutReminder1 || null,
        checkoutReminder2: checkoutReminder2 || null,
      });
      showToast("Configuration saved successfully");
      // ← navigate to /settings explicitly instead of router.back()
      setTimeout(() => router.push("/settings"), 1200);
    } catch {
      showToast("Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  const thresholdNum = parseInt(lateThreshold, 10);
  const thresholdNearMax =
    !isNaN(thresholdNum) && thresholdNum >= Math.floor(LATE_THRESHOLD_MAX * 0.9);

  // ── Loading splash ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`
          @keyframes ac-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          *,*::before,*::after{box-sizing:border-box} body{margin:0}
        `}</style>
        <div style={{
          minHeight: "100vh", backgroundColor: C.bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <Spinner size={34} color={C.gold} />
          <span style={{
            color: C.muted, fontSize: 11, fontWeight: 600,
            letterSpacing: 2.5, textTransform: "uppercase",
          }}>
            Loading
          </span>
        </div>
      </>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes ac-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ac-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .ac-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          padding: 20px 16px 60px;
          animation: ac-fadeIn .35s ease forwards;
        }

        .ac-shell {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          background-color: ${C.surface};
          border-radius: 28px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
        }

        /* header */
        .ac-header {
          padding: 28px 24px 22px;
          border-bottom: 1px solid ${C.border};
        }
        .ac-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 4px;
        }
        .ac-title {
          color: ${C.white};
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 0;
        }
        @media (min-width: 768px) {
          .ac-outer  { padding: 32px 24px 60px; }
          .ac-header { padding: 32px 32px 24px; }
          .ac-title  { font-size: 30px; }
        }

        /* scroll body */
        .ac-body {
          padding: 24px 20px 28px;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .ac-body { padding: 28px 32px 36px; }
        }

        /* role row */
        .ac-role-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          border-width: 1px;
          border-style: solid;
          transition: background-color .15s, border-color .15s;
        }
        .ac-role-row:hover {
          border-color: ${C.borderGold} !important;
        }

        /* save button */
        .ac-save-btn {
          width: 100%;
          padding: 15px;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity .15s, filter .15s;
          margin-top: 8px;
        }
        .ac-save-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .ac-save-btn:disabled { cursor: not-allowed; }

        /* back button */
        .ac-back-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          background-color: ${C.card};
          border: 1px solid ${C.border};
          cursor: pointer;
          transition: border-color .15s;
          flex-shrink: 0;
        }
        .ac-back-btn:hover { border-color: ${C.borderGold}; }

        /* threshold input row */
        .ac-threshold-row {
          display: flex;
          align-items: center;
          background-color: ${C.faint};
          border-radius: 12px;
          border-width: 1px;
          border-style: solid;
          padding: 10px 14px;
          gap: 8px;
          transition: border-color .15s;
        }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input::placeholder { color: ${C.muted}; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.25); border-radius: 4px; }
      `}</style>

      <div className="ac-outer">
        <div className="ac-shell">

          {/* ── Header ── */}
          <div className="ac-header">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              {/* ← explicit push instead of router.back() */}
              <button
                className="ac-back-btn"
                onClick={() => router.push("/settings")}
              >
                <ArrowLeftIcon size={17} color={C.white} />
              </button>
              <div>
                <p className="ac-eyebrow">Settings</p>
                <h1 className="ac-title">Attendance Config</h1>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="ac-body">

            {/* ── Role Selection ── */}
            <SectionCard
              title="Select Role"
              icon={<PeopleIcon size={17} color={C.gold} />}
            >
              {roles.length === 0 ? (
                <div style={{
                  color: C.muted, fontSize: 13,
                  textAlign: "center", padding: "16px 0",
                }}>
                  No roles found
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="ac-role-row"
                    onClick={() => { setSelectedRole(role.id); loadRoleConfig(role.id); }}
                    style={{
                      backgroundColor: selectedRole === role.id ? C.goldDim : C.faint,
                      borderColor: selectedRole === role.id ? C.borderGold : C.border,
                    }}
                  >
                    <span style={{
                      color: selectedRole === role.id ? C.gold : C.white,
                      fontWeight: selectedRole === role.id ? 700 : 500,
                      fontSize: 14,
                    }}>
                      {role.name}
                    </span>
                    {selectedRole === role.id && (
                      <CheckIcon size={18} color={C.gold} />
                    )}
                  </div>
                ))
              )}
            </SectionCard>

            {/* ── Config Fields ── */}
            {selectedRole && (
              <>
                {configLoading ? (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", padding: "32px 0", gap: 10,
                  }}>
                    <Spinner size={28} color={C.gold} />
                    <span style={{ color: C.muted, fontSize: 13 }}>Loading config…</span>
                  </div>
                ) : (
                  <>
                    {/* ── Location Rules ── */}
                    <SectionCard
                      title="Location Rules"
                      icon={<LocationIcon size={17} color={C.gold} />}
                    >
                      <ToggleRow
                        label="Allow Check-In Outside Radius"
                        sublabel="Staff can check in even if outside the designated location radius"
                        value={allowOutsideRadius}
                        onChange={setAllowOutsideRadius}
                      />
                    </SectionCard>

                    {/* ── Late Policy ── */}
                    <SectionCard
                      title="Late Policy"
                      icon={<AlarmIcon size={17} color={C.gold} />}
                    >
                      <ToggleRow
                        label="Allow Late Check-In"
                        sublabel="Staff can still check in after the scheduled shift start time"
                        value={allowLateCheckIn}
                        onChange={setAllowLateCheckIn}
                      />

                      <Divider />

                      <div style={{
                        color: C.muted, fontSize: 12,
                        marginBottom: 10, lineHeight: 1.6,
                      }}>
                        Grace period in minutes before marking as late (0–{LATE_THRESHOLD_MAX})
                      </div>

                      <div
                        className="ac-threshold-row"
                        style={{
                          borderColor: lateThresholdError
                            ? C.redBorder
                            : thresholdNearMax
                              ? "rgba(249,115,22,0.5)"
                              : C.border,
                        }}
                      >
                        <HourglassIcon
                          size={17}
                          color={lateThresholdError ? C.red : C.muted}
                        />
                        <input
                          type="number"
                          value={lateThreshold}
                          onChange={handleLateThresholdChange}
                          onBlur={handleLateThresholdBlur}
                          placeholder="0"
                          min={0}
                          max={LATE_THRESHOLD_MAX}
                          style={{
                            flex: 1, background: "none",
                            border: "none", outline: "none",
                            color: lateThresholdError ? C.red : C.white,
                            fontSize: 14, fontWeight: 600,
                            caretColor: C.gold,
                          }}
                        />
                        <span style={{
                          color: thresholdNearMax ? "#F97316" : C.muted,
                          fontSize: 12, whiteSpace: "nowrap",
                        }}>
                          max {LATE_THRESHOLD_MAX} min
                        </span>
                      </div>

                      {thresholdNearMax && !lateThresholdError && (
                        <div style={{
                          color: "#F97316", fontSize: 11,
                          marginTop: 4, marginLeft: 2,
                        }}>
                          Approaching maximum grace period ({LATE_THRESHOLD_MAX} min)
                        </div>
                      )}
                    </SectionCard>

                    {/* ── Checkout Reminders ── */}
                    <SectionCard
                      title="Checkout Reminders"
                      icon={<BellIcon size={17} color={C.gold} />}
                    >
                      <div style={{
                        color: C.muted, fontSize: 12,
                        marginBottom: 18, lineHeight: 1.6,
                      }}>
                        Set up to two daily push notification reminders for staff to check out.
                      </div>

                      <div style={{
                        color: C.white, fontWeight: 600,
                        fontSize: 13, marginBottom: 8,
                      }}>
                        First Reminder
                      </div>
                      <TimeInput
                        value={checkoutReminder1}
                        onChange={setCheckoutReminder1}
                        placeholder="e.g. 17:00"
                      />

                      <Divider />

                      <div style={{
                        color: C.white, fontWeight: 600,
                        fontSize: 13, marginBottom: 8,
                      }}>
                        Second Reminder
                      </div>
                      <TimeInput
                        value={checkoutReminder2}
                        onChange={setCheckoutReminder2}
                        placeholder="e.g. 18:30"
                      />

                      {(checkoutReminder1 || checkoutReminder2) && (
                        <div style={{
                          marginTop: 16,
                          backgroundColor: C.goldDimMed,
                          borderRadius: 10,
                          border: `1px solid ${C.borderGold}`,
                          padding: "14px 16px",
                          display: "flex", flexDirection: "column", gap: 8,
                        }}>
                          <span style={{
                            color: C.gold, fontWeight: 700,
                            fontSize: 11, letterSpacing: 1.5,
                            textTransform: "uppercase",
                          }}>
                            Active Reminders
                          </span>
                          {checkoutReminder1 && (
                            <div style={{
                              display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <BellIcon size={14} color={C.gold} />
                              <span style={{ color: C.white, fontSize: 13 }}>
                                {checkoutReminder1} IST
                              </span>
                            </div>
                          )}
                          {checkoutReminder2 && (
                            <div style={{
                              display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <BellIcon size={14} color={C.gold} />
                              <span style={{ color: C.white, fontSize: 13 }}>
                                {checkoutReminder2} IST
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </SectionCard>

                    {/* ── Save Button ── */}
                    <button
                      className="ac-save-btn"
                      onClick={saveConfig}
                      disabled={saving}
                      style={{
                        backgroundColor: saving
                          ? "rgba(201,162,39,0.4)"
                          : C.gold,
                        color: "#000",
                      }}
                    >
                      {saving ? (
                        <Spinner size={18} color="#000" />
                      ) : (
                        <>
                          <SaveIcon size={18} color="#000" />
                          Save Configuration
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}