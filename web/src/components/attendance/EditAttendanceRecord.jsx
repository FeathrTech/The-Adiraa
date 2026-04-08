// src/components/attendance/EditAttendanceRecord.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldBorder: "rgba(201,162,39,0.35)",
  goldBg: "rgba(201,162,39,0.08)",
  bg: "#0A0A0A",
  surface: "#111111",
  card: "#1B1B1B",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#888",
  dark: "#111",
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

function UserIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClockIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SaveIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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

function Spinner({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "ear-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? C.gold : "#444",
        position: "relative",
        cursor: "pointer",
        transition: "background .2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 3,
        left: value ? 25 : 3,
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: C.white,
        transition: "left .2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 16,
      border: `1px solid ${C.gold}`,
      padding: "20px",
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
function FieldLabel({ icon, children }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      color: C.gold,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 10,
    }}>
      {icon}
      {children}
    </div>
  );
}

// ─── Time Input ───────────────────────────────────────────────────────────────
function TimeInput({ value, onChange, placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        backgroundColor: C.dark,
        border: `1px solid ${focused ? C.gold : C.goldBorder}`,
        borderRadius: 10,
        padding: "12px 14px",
        color: disabled ? C.muted : C.white,
        fontSize: 14,
        outline: "none",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color .15s",
        boxSizing: "border-box",
        colorScheme: "dark",
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditAttendanceRecord() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attendanceId = searchParams.get("attendanceId");

  const userPermissions = useAuthStore((s) => s.permissions) || [];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [staff, setStaff] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [markAbsent, setMarkAbsent] = useState(false);

  // ── Permission checks ──────────────────────────────────────────────────────
  const canEdit    = can(userPermissions, "attendance.edit_record");
  const canAbsent  = can(userPermissions, "attendance.mark_absent");
  const canPresent = can(userPermissions, "attendance.mark_present");

  // ── Format time from ISO → HH:MM ──────────────────────────────────────────
  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  };

  // ── Load attendance record ─────────────────────────────────────────────────
  useEffect(() => {
    if (!attendanceId) {
      setError("No attendance ID provided.");
      setLoading(false);
      return;
    }

    api.get(`/attendance/${attendanceId}`)
      .then(res => {
        const data = res.data;
        setStaff(data.user);
        setAttendanceDate(data.attendanceDate || "");
        setCheckInTime(data.checkInTime ? formatTime(data.checkInTime) : "");
        setCheckOutTime(data.checkOutTime ? formatTime(data.checkOutTime) : "");
        setMarkAbsent(data.isAbsent || false);
      })
      .catch(() => setError("Unable to load attendance record."))
      .finally(() => setLoading(false));
  }, [attendanceId]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!staff) return;

    try {
      setSaving(true);
      setError(null);

      const date = attendanceDate || new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      if (markAbsent) {
        await api.post("/attendance/mark-absent", {
          userId: staff.id,
          date,
        });
      } else {
        await api.post("/attendance/manual-mark", {
          userId: staff.id,
          date,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
        });
      }

      setSuccess(true);
      setTimeout(() => router.back(), 1200);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to update attendance.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spinner size={32} color={C.gold} />
      </div>
    );
  }

  // ── No permission ──────────────────────────────────────────────────────────
  if (!canEdit && !canAbsent && !canPresent) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 360,
          textAlign: "center",
        }}>
          <div style={{ color: "#E57373", marginBottom: 12 }}>
            <XCircleIcon size={40} />
          </div>
          <p style={{ color: C.white, fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>
            Access Denied
          </p>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>
            You don't have permission to edit attendance records.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: C.gold,
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              color: "#000",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Format date for display ────────────────────────────────────────────────
  const displayDate = attendanceDate
    ? new Date(attendanceDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", day: "numeric",
        month: "long", year: "numeric",
      })
    : "—";

  return (
    <>
      <style>{`
        @keyframes ear-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ear-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ear-successPop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .ear-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 16px 60px;
        }

        .ear-wrap {
          width: 100%;
          max-width: 520px;
          animation: ear-fadeIn .35s ease forwards;
        }

        /* ── Header ── */
        .ear-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 44px;
          margin-bottom: 28px;
        }

        .ear-back-btn {
          position: absolute; left: 0;
          display: flex; align-items: center; gap: 6px;
          background-color: ${C.card};
          border: 1px solid ${C.goldBorder};
          border-radius: 10px;
          padding: 8px 13px;
          color: ${C.gold};
          font-weight: 600; font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .ear-back-btn:hover { filter: brightness(1.2); }

        .ear-page-title {
          color: ${C.gold};
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          text-align: center;
        }

        /* ── Section card ── */
        .ear-card {
          background-color: ${C.card};
          border-radius: 16px;
          border: 1px solid ${C.gold};
          padding: 20px;
          margin-bottom: 16px;
        }

        /* ── Field label row ── */
        .ear-field-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: ${C.gold};
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        /* ── Toggle row ── */
        .ear-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* ── Save button ── */
        .ear-save-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: ${C.gold};
          border: none;
          border-radius: 16px;
          padding: 16px;
          color: #000;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: filter .15s, transform .1s, box-shadow .15s;
          margin-top: 4px;
        }
        .ear-save-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,162,39,0.28);
        }
        .ear-save-btn:active:not(:disabled) { transform: translateY(0); }
        .ear-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Error ── */
        .ear-error {
          background: rgba(229,115,115,0.1);
          border: 1px solid rgba(229,115,115,0.3);
          border-radius: 12px;
          padding: 12px 16px;
          color: #E57373;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Success banner ── */
        .ear-success {
          background: rgba(93,190,138,0.12);
          border: 1px solid rgba(93,190,138,0.35);
          border-radius: 12px;
          padding: 14px 18px;
          color: #5DBE8A;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          text-align: center;
          animation: ear-successPop .35s ease forwards;
        }

        /* ── Avatar ── */
        .ear-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background-color: rgba(201,162,39,0.12);
          border: 1px solid ${C.goldBorder};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${C.gold};
          font-weight: 800;
          font-size: 18px;
          flex-shrink: 0;
        }

        /* ── Date pill ── */
        .ear-date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          background-color: rgba(201,162,39,0.08);
          border: 1px solid ${C.goldBorder};
          color: ${C.gold};
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }

        /* ── Two-col time layout on wider screens ── */
        .ear-time-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        @media (min-width: 480px) {
          .ear-time-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .ear-time-grid .ear-card {
            margin-bottom: 0;
          }
          .ear-time-wrapper {
            margin-bottom: 16px;
          }
        }

        @media (min-width: 640px) {
          .ear-outer { padding: 28px 24px 60px; }
          .ear-page-title { font-size: 20px; }
        }

        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(5) hue-rotate(5deg);
          cursor: pointer;
          opacity: 0.7;
        }
        input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.2); border-radius: 4px;
        }
      `}</style>

      <div className="ear-outer">
        <div className="ear-wrap">

          {/* ── Header ── */}
          <div className="ear-header">
            <button className="ear-back-btn" onClick={() => router.back()}>
              <ArrowLeftIcon size={15} />
              <span>Back</span>
            </button>
            <h1 className="ear-page-title">Edit Attendance</h1>
          </div>

          {/* ── Success ── */}
          {success && (
            <div className="ear-success">
              ✓ Attendance updated successfully — redirecting…
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="ear-error">
              <XCircleIcon size={15} />
              {error}
            </div>
          )}

          {/* ── Staff card ── */}
          <div className="ear-card">
            <div className="ear-field-label">
              <UserIcon size={15} />
              Staff Member
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="ear-avatar">
                {staff?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{
                  color: C.white,
                  fontWeight: 600,
                  fontSize: 15,
                }}>
                  {staff?.name || "—"}
                </div>
                {staff?.roles?.length > 0 && (
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {staff.roles.map(r => r.name).join(", ")}
                  </div>
                )}
                {/* Date pill */}
                <div className="ear-date-pill">
                  <ClockIcon size={11} />
                  {displayDate}
                </div>
              </div>
            </div>
          </div>

          {/* ── Time fields — side by side on wider screens ── */}
          <div className="ear-time-wrapper">
            <div className="ear-time-grid">

              {/* Check In */}
              <div className="ear-card">
                <div className="ear-field-label">
                  <ClockIcon size={15} />
                  Check-in Time
                </div>
                <TimeInput
                  value={checkInTime}
                  onChange={setCheckInTime}
                  placeholder="HH:MM"
                  disabled={markAbsent}
                />
                {checkInTime && !markAbsent && (
                  <button
                    onClick={() => setCheckInTime("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.muted,
                      fontSize: 11,
                      cursor: "pointer",
                      marginTop: 6,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <XCircleIcon size={11} /> Clear
                  </button>
                )}
              </div>

              {/* Check Out */}
              <div className="ear-card">
                <div className="ear-field-label">
                  <ClockIcon size={15} />
                  Check-out Time
                </div>
                <TimeInput
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                  placeholder="HH:MM"
                  disabled={markAbsent}
                />
                {checkOutTime && !markAbsent && (
                  <button
                    onClick={() => setCheckOutTime("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.muted,
                      fontSize: 11,
                      cursor: "pointer",
                      marginTop: 6,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <XCircleIcon size={11} /> Clear
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* ── Mark Absent toggle ── */}
          {canAbsent && (
            <div className="ear-card">
              <div className="ear-toggle-row">
                <div>
                  <div style={{
                    color: C.white,
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 3,
                  }}>
                    Mark as Absent
                  </div>
                  <div style={{ color: C.muted, fontSize: 12 }}>
                    Clears check-in / check-out and marks absent
                  </div>
                </div>
                <Toggle value={markAbsent} onChange={setMarkAbsent} />
              </div>

              {/* Warning when toggled on */}
              {markAbsent && (
                <div style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  backgroundColor: "rgba(229,115,115,0.08)",
                  border: "1px solid rgba(229,115,115,0.25)",
                  color: "#E57373",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <XCircleIcon size={13} />
                  Check-in and check-out times will be ignored.
                </div>
              )}
            </div>
          )}

          {/* ── Save button ── */}
          <button
            className="ear-save-btn"
            onClick={handleSave}
            disabled={saving || success}
          >
            {saving ? (
              <><Spinner size={18} color="#000" /> Saving…</>
            ) : success ? (
              <>✓ Saved</>
            ) : (
              <><SaveIcon size={16} /> Save Changes</>
            )}
          </button>

        </div>
      </div>
    </>
  );
}