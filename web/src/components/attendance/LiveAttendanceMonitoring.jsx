// src/components/attendance/LiveAttendanceMonitoring.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";
import { useRealtime } from "../../hooks/useRealtime";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    gold: "#C9A227",
    goldLight: "#E8C45A",
    bg: "#0A0A0A",
    surface: "#131313",
    card: "#1A1A1A",
    cardAlt: "#1F1F1F",
    border: "#2A2A2A",
    borderGold: "rgba(201,162,39,0.35)",
    white: "#FFFFFF",
    muted: "#777",
    faint: "#333",
};

const STATUS = {
    Present: { bg: "rgba(93,190,138,0.15)", text: "#5DBE8A", border: "rgba(93,190,138,0.35)" },
    Absent: { bg: "rgba(229,115,115,0.15)", text: "#E57373", border: "rgba(229,115,115,0.35)" },
    Late: { bg: "rgba(232,195,74,0.15)", text: "#E8C34A", border: "rgba(232,195,74,0.35)" },
    NotMarked: { bg: "rgba(120,120,120,0.15)", text: "#999999", border: "rgba(120,120,120,0.35)" },
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

function PeopleIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

function EditIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function CheckIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function XIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ClockIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function HalfDayIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 0 1 0 20z" />
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
}

function TrashIcon({ size = 13 }) {
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

function ChevronLeftIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
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

function DotsIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}

function EmptyIcon({ size = 48 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

function Spinner({ size = 22, color = C.gold }) {
    return (
        <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
            style={{ animation: "lam-spin .8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" stroke={color}
                strokeWidth="4" style={{ opacity: 0.25 }} />
            <path fill={color} style={{ opacity: 0.75 }}
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = STATUS[status];
    if (!s) return null;
    const labels = {
        Present: "Present", Absent: "Absent",
        Late: "Late", NotMarked: "Not Marked",
    };
    return (
        <span style={{
            padding: "4px 10px",
            borderRadius: 20,
            backgroundColor: s.bg,
            border: `1px solid ${s.border}`,
            color: s.text,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            display: "inline-block",
        }}>
            {labels[status] ?? status}
        </span>
    );
}

// ─── Action Modal ─────────────────────────────────────────────────────────────
function ActionModal({ actions, item, onClose }) {
    if (!item) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "rgba(0,0,0,0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: C.card,
                    borderRadius: 20,
                    border: `1px solid ${C.borderGold}`,
                    width: "100%",
                    maxWidth: 340,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            backgroundColor: C.faint,
                            border: `1px solid ${C.borderGold}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 15,
                            color: C.gold,
                            flexShrink: 0,
                        }}
                    >
                        {item.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                color: C.white,
                                fontWeight: 700,
                                fontSize: 15,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.name}
                        </div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                            {item.roles?.map((r) => r.name).join(", ")}
                        </div>
                    </div>
                </div>

                {/* Status row */}
                <div
                    style={{
                        padding: "12px 20px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span style={{ color: C.muted, fontSize: 13 }}>Current Status</span>
                    <StatusBadge status={item.status} />
                </div>

                {/* Action buttons */}
                <div style={{ padding: "8px 0" }}>
                    {actions.length === 0 ? (
                        <div style={{
                            padding: "16px 20px",
                            color: C.muted,
                            fontSize: 13,
                            textAlign: "center",
                        }}>
                            No actions available
                        </div>
                    ) : (
                        actions.map((a, i) => (
                            <button
                                key={a.label}
                                onClick={() => {
                                    onClose();
                                    a.onClick();
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 20px",
                                    background: "none",
                                    border: "none",
                                    borderBottom:
                                        i !== actions.length - 1
                                            ? `1px solid ${C.border}`
                                            : "none",
                                    color: a.isDelete ? "#E57373" : C.white,
                                    fontSize: 14,
                                    fontWeight: a.isDelete ? 700 : 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "background .15s",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "none")
                                }
                            >
                                {a.label}
                            </button>
                        ))
                    )}
                </div>

                {/* Cancel */}
                <div
                    style={{
                        padding: "12px 16px",
                        borderTop: `1px solid ${C.border}`,
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: C.faint,
                            color: C.muted,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background .15s",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#3a3a3a")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = C.faint)
                        }
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Desktop action buttons row ───────────────────────────────────────────────
const ACTION_STYLE = {
    edit: { bg: "rgba(201,162,39,0.08)", border: "rgba(201,162,39,0.35)", text: "#C9A227", hoverBg: "rgba(201,162,39,0.18)" },
    present: { bg: "rgba(93,190,138,0.08)", border: "rgba(93,190,138,0.35)", text: "#5DBE8A", hoverBg: "rgba(93,190,138,0.18)" },
    absent: { bg: "rgba(229,115,115,0.08)", border: "rgba(229,115,115,0.35)", text: "#E57373", hoverBg: "rgba(229,115,115,0.18)" },
    late: { bg: "rgba(232,195,74,0.08)", border: "rgba(232,195,74,0.35)", text: "#E8C34A", hoverBg: "rgba(232,195,74,0.18)" },
    halfday: { bg: "rgba(255,159,10,0.08)", border: "rgba(255,159,10,0.35)", text: "#FF9F0A", hoverBg: "rgba(255,159,10,0.18)" },
    delete: { bg: "rgba(229,115,115,0.08)", border: "rgba(229,115,115,0.35)", text: "#E57373", hoverBg: "rgba(229,115,115,0.18)" },
};

function ActionBtn({ label, icon, styleKey, onClick, disabled }) {
    const [hovered, setHovered] = useState(false);
    const s = ACTION_STYLE[styleKey] || ACTION_STYLE.edit;
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={label}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 8,
                border: `1px solid ${s.border}`,
                backgroundColor: hovered ? s.hoverBg : s.bg,
                color: s.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "background .15s",
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 10000,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16,
        }}>
            <div style={{
                backgroundColor: C.surface,
                borderRadius: 20,
                border: `1px solid ${C.borderGold}`,
                padding: 28, maxWidth: 400, width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            }}>
                <h3 style={{ color: C.white, fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>
                    {title}
                </h3>
                <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
                    {message}
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            background: C.faint, border: `1px solid ${C.border}`,
                            borderRadius: 10, padding: "9px 18px",
                            color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            backgroundColor: "#E57373", border: "none",
                            borderRadius: 10, padding: "9px 18px",
                            color: "#000", fontWeight: 700, fontSize: 13,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            display: "flex", alignItems: "center", gap: 6,
                        }}
                    >
                        {loading && <Spinner size={14} color="#000" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Mini Calendar Picker ─────────────────────────────────────────────────────
function MiniCalendarPicker({ selectedDate, onSelect, onClose }) {
    const [year, setYear] = useState(selectedDate.getFullYear());
    const [month, setMonth] = useState(selectedDate.getMonth());

    const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const selStr = selectedDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center",
                justifyContent: "center", padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: C.card, borderRadius: 20,
                    border: `1px solid ${C.borderGold}`,
                    padding: 24, width: 320,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 16,
                }}>
                    <button onClick={prevMonth} style={{
                        background: "none", border: "none", color: C.gold,
                        cursor: "pointer", display: "flex", padding: 4, borderRadius: 8,
                    }}>
                        <ChevronLeftIcon size={18} />
                    </button>
                    <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>
                        {monthName} {year}
                    </span>
                    <button onClick={nextMonth} style={{
                        background: "none", border: "none", color: C.gold,
                        cursor: "pointer", display: "flex", padding: 4, borderRadius: 8,
                    }}>
                        <ChevronRightIcon size={18} />
                    </button>
                </div>

                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 2, marginBottom: 6,
                }}>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                        <div key={d} style={{
                            textAlign: "center", color: C.gold,
                            fontSize: 11, fontWeight: 600, padding: "4px 0",
                        }}>{d}</div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isSelected = dateStr === selStr;
                        const isToday = dateStr === new Date().toLocaleDateString("en-CA",
                            { timeZone: "Asia/Kolkata" });
                        return (
                            <button
                                key={dateStr}
                                onClick={() => { onSelect(new Date(dateStr + "T00:00:00")); onClose(); }}
                                style={{
                                    width: "100%", aspectRatio: "1",
                                    borderRadius: "50%", border: "none",
                                    backgroundColor: isSelected ? C.gold : isToday
                                        ? "rgba(201,162,39,0.15)" : "transparent",
                                    color: isSelected ? "#000" : isToday ? C.gold : C.white,
                                    fontWeight: isSelected || isToday ? 700 : 400,
                                    fontSize: 13, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "background .15s",
                                }}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveAttendanceMonitoring({ filter: initialFilter = "all" }) {
    const router = useRouter();
    const userPermissions = useAuthStore((s) => s.permissions) || [];

    const [filter, setFilter] = useState(initialFilter);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [modalItem, setModalItem] = useState(null);

    const formattedDate = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    // ── Load ───────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/attendance/dashboard", {
                params: { filter, date: formattedDate },
            });
            setData(res.data.staff || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.log("Attendance load error", err);
            setError("Failed to load attendance data.");
        } finally {
            setLoading(false);
        }
    }, [filter, formattedDate]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        let lastDay = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
        const interval = setInterval(() => {
            const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
            if (today !== lastDay) { lastDay = today; setDate(new Date()); }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useRealtime("attendance:updated", load);
    useRealtime("attendance:checkin", load);
    useRealtime("attendance:checkout", load);

    // ── Action handler ─────────────────────────────────────────────────────────
    const handleAction = async (item, action) => {
        try {
            setActionLoading(true);
            setError(null);
            const { attendanceId } = item;

            if (action === "mark_present" && !attendanceId) {
                await api.post("/attendance/manual-mark", {
                    userId: item.id,
                    date: formattedDate,
                    checkInTime: new Date().toTimeString().slice(0, 5),
                });
            } else if (action === "mark_absent") {
                await api.post("/attendance/mark-absent", { userId: item.id, date: formattedDate });
            } else {
                await api.patch(`/attendance/${attendanceId}/action`, { action });
            }
            await load();
        } catch (err) {
            console.log("Attendance action error", err);
            setError("Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        await handleAction(confirmDelete, "delete");
        setConfirmDelete(null);
    };

    // ── Build actions list for a row ───────────────────────────────────────────
    const getActions = (item) => {
        const actions = [];
        if (can(userPermissions, "attendance.edit_record") && item.attendanceId)
            actions.push({
                label: "Edit Record",
                onClick: () => router.push(`/attendance/edit?attendanceId=${item.attendanceId}`),
            });
        if (can(userPermissions, "attendance.mark_present"))
            actions.push({ label: "Mark Present", onClick: () => handleAction(item, "mark_present") });
        if (can(userPermissions, "attendance.mark_absent"))
            actions.push({ label: "Mark Absent", onClick: () => handleAction(item, "mark_absent") });
        if (can(userPermissions, "attendance.override_late"))
            actions.push({ label: "Override Late", onClick: () => handleAction(item, "override_late") });
        if (can(userPermissions, "attendance.override_halfday"))
            actions.push({ label: "Half Day", onClick: () => handleAction(item, "override_halfday") });
        if (can(userPermissions, "attendance.delete_record"))
            actions.push({
                label: "Delete Record",
                isDelete: true,
                onClick: () => setConfirmDelete(item),
            });
        return actions;
    };

    const FILTERS = [
        { key: "all", label: "Overview" },
        { key: "present", label: "Present" },
        { key: "absent", label: "Absent" },
        { key: "late", label: "Late" },
        { key: "not_marked", label: "Not Marked" },
    ];

    const displayDate = date.toDateString();

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @keyframes lam-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes lam-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .lam-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 16px 48px;
        }

        .lam-wrap {
          width: 100%;
          max-width: 1100px;
          animation: lam-fadeIn .35s ease forwards;
        }

        /* ── Header ── */
        .lam-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 44px;
          margin-bottom: 18px;
          padding: 0 4px;
        }

        .lam-back-btn {
          position: absolute;
          left: 0;
          display: flex; align-items: center; gap: 5px;
          background-color: ${C.card};
          border: 1px solid ${C.borderGold};
          border-radius: 10px;
          padding: 8px 13px;
          color: ${C.gold};
          font-weight: 600; font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .lam-back-btn:hover { filter: brightness(1.2); }

        .lam-title {
          color: ${C.white};
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          text-align: center;
        }

        /* ── Controls ── */
        .lam-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
          padding: 0 4px;
        }

        .lam-date-btn {
          display: flex; align-items: center; gap: 7px;
          background-color: ${C.card};
          border: 1px solid ${C.borderGold};
          border-radius: 10px;
          padding: 9px 14px;
          color: ${C.white};
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
          justify-content: space-between;
          width: 100%;
        }
        .lam-date-btn:hover { filter: brightness(1.15); }

        .lam-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .lam-chip {
          padding: 7px 14px;
          border-radius: 20px;
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          border-width: 1px; border-style: solid;
          transition: all .15s;
          white-space: nowrap;
          background: none;
          text-transform: capitalize;
        }
        .lam-chip-active {
          background-color: ${C.gold};
          border-color: ${C.gold};
          color: #000; font-weight: 700;
        }
        .lam-chip-inactive {
          background-color: ${C.faint};
          border-color: ${C.border};
          color: ${C.muted};
        }

        .lam-total {
          color: ${C.muted};
          font-size: 13px;
          margin-top: 4px;
          padding: 0 4px;
        }

        /* ── Table card ── */
        .lam-table-card {
          background-color: ${C.surface};
          border-radius: 20px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
          margin: 0 4px;
        }

        .lam-table-inner {
          padding: 16px;
        }

        /* ── Table header row ── */
        .lam-thead-row {
          display: flex;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 4px;
        }

        .lam-th {
          color: ${C.gold};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        /* ── Data row ── */
        .lam-row {
          display: flex;
          align-items: center;
          padding: 12px 4px;
          border-bottom: 1px solid ${C.border};
          cursor: pointer;
          transition: background .15s;
          border-radius: 8px;
        }
        .lam-row:last-child { border-bottom: none; }
        .lam-row:hover { background: rgba(255,255,255,0.025); }

        /* ── Avatar ── */
        .lam-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background-color: ${C.faint};
          border: 1px solid ${C.borderGold};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-weight: 700; font-size: 14px;
          color: ${C.gold};
          margin-right: 10px;
        }

        /* ── Empty ── */
        .lam-empty {
          display: flex; flex-direction: column;
          align-items: center;
          padding: 48px 0;
          gap: 10px;
        }

        /* ── Error ── */
        .lam-error {
          background: rgba(229,115,115,0.1);
          border: 1px solid rgba(229,115,115,0.35);
          border-radius: 10px;
          padding: 10px 16px;
          color: #E57373; font-size: 13px;
          margin: 0 4px 14px;
        }

        /* ── Loading ── */
        .lam-loading {
          display: flex; align-items: center;
          justify-content: center; padding: 32px 0;
        }

        /* ── col widths ── */
        .lam-col-staff  { flex: 1; min-width: 0; }
        .lam-col-status { width: 110px; text-align: center; flex-shrink: 0; }
        .lam-col-actions{ flex-shrink: 0; display: flex; justify-content: flex-end; }

        /* Mobile: hide status col */
        .lam-col-status { display: none; }
        .lam-th-status  { display: none; }

        /* ── Dots button ── */
        .lam-dots-btn {
          background: none;
          border: none;
          color: ${C.muted};
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background .15s;
        }
        .lam-dots-btn:hover {
          background: rgba(255,255,255,0.06);
          color: ${C.white};
        }

        /* ── Tablet+ ── */
        @media (min-width: 640px) {
          .lam-outer    { padding: 24px 20px 48px; }
          .lam-title    { font-size: 20px; }
          .lam-date-btn { width: auto; }

          .lam-col-status {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 110px;
          }
          .lam-th-status {
            display: block;
            text-align: center;
          }
        }

        /* ── Desktop controls row ── */
        @media (min-width: 768px) {
          .lam-controls { flex-wrap: nowrap; }
          .lam-total-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background-color: ${C.card};
            border: 1px solid ${C.borderGold};
            border-radius: 10px;
            padding: 9px 14px;
            color: ${C.muted};
            font-size: 13px;
            margin-left: auto;
            white-space: nowrap;
          }
        }

        /* ── Mobile vs Tablet+ toggles ── */
        @media (max-width: 639px) {
          .lam-dots-menu  { display: flex; }
          .lam-btn-group  { display: none !important; }
          .lam-total-badge{ display: none !important; }
          .lam-back-label { display: none; }
          .lam-back-btn   { padding: 8px 10px; }
        }
        @media (min-width: 640px) {
          .lam-dots-menu  { display: none !important; }
          .lam-btn-group  { display: flex !important; }
          .lam-total-badge{ display: flex !important; }
          .lam-total      { display: none; }
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25); border-radius: 4px;
        }
      `}</style>

            {/* ── Calendar Picker Modal ── */}
            {showCalendar && (
                <MiniCalendarPicker
                    selectedDate={date}
                    onSelect={setDate}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {/* ── Action Modal (mobile dots) ── */}
            <ActionModal
                item={modalItem}
                actions={modalItem ? getActions(modalItem) : []}
                onClose={() => setModalItem(null)}
            />

            {/* ── Confirm Delete Dialog ── */}
            <ConfirmDialog
                open={!!confirmDelete}
                title="Delete Record"
                message={`Are you sure you want to delete the attendance record for "${confirmDelete?.name}"? This cannot be undone.`}
                loading={actionLoading}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete(null)}
            />

            <div className="lam-outer">
                <div className="lam-wrap">

                    {/* ── Header ── */}
                    <div className="lam-header">
                        <button
                            className="lam-back-btn"
                            onClick={() => router.push("/attendance")}
                        >
                            <ArrowLeftIcon size={15} />
                            <span className="lam-back-label">Back</span>
                        </button>
                        <h1 className="lam-title">Live Attendance Monitoring</h1>
                    </div>

                    {/* ── Error ── */}
                    {error && <div className="lam-error">{error}</div>}

                    {/* ── Controls ── */}
                    <div className="lam-controls">
                        {/* Date picker button */}
                        <button
                            className="lam-date-btn"
                            onClick={() => setShowCalendar(true)}
                        >
                            <span>{displayDate}</span>
                            <span style={{ color: C.gold, display: "flex" }}>
                                <CalendarIcon size={16} />
                            </span>
                        </button>

                        {/* Filter chips */}
                        <div className="lam-filters">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    className={`lam-chip ${filter === f.key
                                        ? "lam-chip-active" : "lam-chip-inactive"}`}
                                    onClick={() => setFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Total badge — shown on desktop */}
                        <div className="lam-total-badge" style={{ display: "none" }}>
                            <span style={{ color: C.gold, display: "flex" }}>
                                <PeopleIcon size={14} />
                            </span>
                            Total:{" "}
                            <span style={{ color: C.gold, fontWeight: 700, marginLeft: 4 }}>
                                {total}
                            </span>
                        </div>
                    </div>

                    {/* Mobile total */}
                    <p className="lam-total" style={{ marginBottom: 12 }}>
                        Total Staff:{" "}
                        <span style={{ color: C.gold, fontWeight: 700 }}>{total}</span>
                    </p>

                    {/* ── Table card ── */}
                    <div className="lam-table-card">
                        <div className="lam-table-inner">

                            {/* Table header */}
                            <div className="lam-thead-row">
                                <div className="lam-th lam-col-staff">Staff</div>
                                <div className="lam-th lam-th-status lam-col-status"
                                    style={{ textAlign: "center" }}>
                                    Status
                                </div>
                                <div className="lam-th lam-col-actions"
                                    style={{ minWidth: 60, justifyContent: "flex-end" }}>
                                    Actions
                                </div>
                            </div>

                            {/* Body */}
                            {(loading || actionLoading) ? (
                                <div className="lam-loading">
                                    <Spinner size={26} color={C.gold} />
                                </div>
                            ) : data.length === 0 ? (
                                <div className="lam-empty">
                                    <span style={{ color: C.faint }}>
                                        <EmptyIcon size={44} />
                                    </span>
                                    <span style={{ color: C.muted, fontSize: 14 }}>
                                        No attendance records found
                                    </span>
                                </div>
                            ) : (
                                data.map((item) => {
                                    const avatar = item.name?.charAt(0)?.toUpperCase() || "U";
                                    const roles = item.roles?.map(r => r.name).join(", ");
                                    const actions = getActions(item);

                                    return (
                                        <div
                                            key={item.id}
                                            className="lam-row"
                                            onClick={() => router.push(`/settings/staff/${item.id}`)}
                                        >
                                            {/* Avatar + name */}
                                            <div className="lam-col-staff" style={{
                                                display: "flex", alignItems: "center",
                                            }}>
                                                <div className="lam-avatar">{avatar}</div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{
                                                        color: C.white, fontWeight: 600,
                                                        fontSize: 14,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{
                                                        color: C.muted, fontSize: 12,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}>
                                                        {roles}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status — hidden on mobile */}
                                            <div className="lam-col-status">
                                                <StatusBadge status={item.status} />
                                            </div>

                                            {/* Actions */}
                                            <div
                                                className="lam-col-actions"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Mobile: dots button → opens centered modal */}
                                                <div className="lam-dots-menu">
                                                    <button
                                                        className="lam-dots-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModalItem(item);
                                                        }}
                                                    >
                                                        <DotsIcon size={18} />
                                                    </button>
                                                </div>

                                                {/* Tablet+: inline action buttons */}
                                                <div className="lam-btn-group" style={{
                                                    display: "none",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    flexWrap: "wrap",
                                                    justifyContent: "flex-end",
                                                }}>
                                                    {can(userPermissions, "attendance.edit_record") && item.attendanceId && (
                                                        <ActionBtn
                                                            label="Edit"
                                                            icon={<EditIcon size={13} />}
                                                            styleKey="edit"
                                                            onClick={() => router.push(
                                                                `/attendance/edit?attendanceId=${item.attendanceId}`
                                                            )}
                                                        />
                                                    )}
                                                    {can(userPermissions, "attendance.mark_present") && (
                                                        <ActionBtn
                                                            label="Present"
                                                            icon={<CheckIcon size={13} />}
                                                            styleKey="present"
                                                            onClick={() => handleAction(item, "mark_present")}
                                                            disabled={actionLoading}
                                                        />
                                                    )}
                                                    {can(userPermissions, "attendance.mark_absent") && (
                                                        <ActionBtn
                                                            label="Absent"
                                                            icon={<XIcon size={13} />}
                                                            styleKey="absent"
                                                            onClick={() => handleAction(item, "mark_absent")}
                                                            disabled={actionLoading}
                                                        />
                                                    )}
                                                    {can(userPermissions, "attendance.override_late") && (
                                                        <ActionBtn
                                                            label="Late"
                                                            icon={<ClockIcon size={13} />}
                                                            styleKey="late"
                                                            onClick={() => handleAction(item, "override_late")}
                                                            disabled={actionLoading}
                                                        />
                                                    )}
                                                    {can(userPermissions, "attendance.override_halfday") && (
                                                        <ActionBtn
                                                            label="Half Day"
                                                            icon={<HalfDayIcon size={13} />}
                                                            styleKey="halfday"
                                                            onClick={() => handleAction(item, "override_halfday")}
                                                            disabled={actionLoading}
                                                        />
                                                    )}
                                                    {can(userPermissions, "attendance.delete_record") && (
                                                        <ActionBtn
                                                            label="Delete"
                                                            icon={<TrashIcon size={13} />}
                                                            styleKey="delete"
                                                            onClick={() => setConfirmDelete(item)}
                                                            disabled={actionLoading}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}