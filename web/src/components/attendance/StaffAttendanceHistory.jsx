// src/components/attendance/StaffAttendanceHistory.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    gold: "#C9A227",
    goldLight: "#E8C45A",
    goldDim: "#7A5E10",
    bg: "#0A0A0A",
    surface: "#131313",
    card: "#1A1A1A",
    cardAlt: "#202020",
    border: "#2A2A2A",
    borderGold: "rgba(201,162,39,0.35)",
    white: "#FFFFFF",
    muted: "#666",
    faint: "#333",
    green: "#5DBE8A",
    greenBg: "rgba(93,190,138,0.12)",
    greenBorder: "rgba(93,190,138,0.35)",
    orange: "#F97316",
    orangeBg: "rgba(249,115,22,0.12)",
    orangeBorder: "rgba(249,115,22,0.35)",
    red: "#E57373",
    redBg: "rgba(229,115,115,0.10)",
    redBorder: "rgba(229,115,115,0.35)",
    blue: "#60A5FA",
    blueBg: "rgba(96,165,250,0.12)",
    blueBorder: "rgba(96,165,250,0.35)",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    );
}
function CheckCircleIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}
function ClockIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function CloseCircleIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}
function TimerIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 14 15" />
            <path d="M9 2h6M12 2v3" />
        </svg>
    );
}
function CalendarIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
function ListIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}
function LoginIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
        </svg>
    );
}
function LogoutIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}
function LocationIcon({ size = 12, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    );
}
function CameraIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}
function CameraOffIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" />
        </svg>
    );
}
function TrashIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
    );
}
function ImageIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );
}
function AlertIcon({ size = 13, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
function SunIcon({ size = 13, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        </svg>
    );
}
function ChevronDownIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
function ChevronUpIcon({ size = 14, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );
}
function ChevronLeftIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}
function ChevronRightIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
function CloseIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function InfoIcon({ size = 15, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}
function Spinner({ size = 32, color = C.gold }) {
    return (
        <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
            style={{ animation: "sah-spin .8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
            <path fill={color} style={{ opacity: 0.75 }}
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(dateStr) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: "Asia/Kolkata",
    });
}

function fmtDate(dateStr) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        timeZone: "Asia/Kolkata",
    });
}

function calcDuration(checkIn, checkOut) {
    if (!checkIn) return "--";
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const ms = end - start;
    if (ms <= 0) return "--";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isPhotoExpired(attendanceDateStr) {
    if (!attendanceDateStr) return false;
    const attendanceDate = new Date(attendanceDateStr + "T00:00:00");
    const diffDays = (new Date() - attendanceDate) / (1000 * 60 * 60 * 24);
    return diffDays > 15;
}

function getStatusMeta(record) {
    if (!record) return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
    if (record.isAbsent) return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
    if (record.checkOutTime) return { label: record.isLate ? "Late • Completed" : "Completed", color: C.green, bg: C.greenBg, border: C.greenBorder, dot: "#22c55e" };
    if (record.checkInTime && record.isLate) return { label: "Late", color: C.orange, bg: C.orangeBg, border: C.orangeBorder, dot: "#f97316" };
    if (record.checkInTime) return { label: "Present", color: C.goldLight, bg: "rgba(201,162,39,0.12)", border: C.borderGold, dot: C.gold };
    return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

function MiniCalendar({ yearMonth, markedDates, selectedDate, onDayPress, onMonthChange }) {
    const [year, month] = yearMonth.split("-").map(Number);

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prevMonth = () => {
        const d = new Date(year, month - 2, 1);
        onMonthChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
    };
    const nextMonth = () => {
        const d = new Date(year, month, 1);
        onMonthChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
    };

    return (
        <div style={{
            backgroundColor: C.card,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            marginBottom: 20,
        }}>
            {/* Month nav */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px 10px",
            }}>
                <button onClick={prevMonth} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.gold, display: "flex", padding: 4,
                }}>
                    <ChevronLeftIcon size={18} color={C.gold} />
                </button>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
                    {MONTHS[month - 1]} {year}
                </span>
                <button onClick={nextMonth} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.gold, display: "flex", padding: 4,
                }}>
                    <ChevronRightIcon size={18} color={C.gold} />
                </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 8px" }}>
                {DAYS.map(d => (
                    <div key={d} style={{
                        textAlign: "center", color: C.muted,
                        fontSize: 11, fontWeight: 600, paddingBottom: 6,
                    }}>{d}</div>
                ))}
            </div>

            {/* Cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 8px 12px", gap: 2 }}>
                {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const mark = markedDates[dateStr];
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === today;

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDayPress({ dateString: dateStr })}
                            style={{
                                aspectRatio: "1",
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                borderRadius: 8,
                                cursor: "pointer",
                                backgroundColor: isSelected ? C.gold : isToday ? "rgba(201,162,39,0.15)" : "transparent",
                                transition: "background-color .12s",
                                position: "relative",
                            }}
                        >
                            <span style={{
                                fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400,
                                color: isSelected ? "#000" : isToday ? C.goldLight : C.white,
                            }}>{day}</span>
                            {mark?.marked && (
                                <div style={{
                                    width: 5, height: 5, borderRadius: "50%",
                                    backgroundColor: isSelected ? "#000" : (mark.dotColor || C.gold),
                                    marginTop: 1,
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{
                display: "flex", flexWrap: "wrap", gap: "8px 16px",
                padding: "10px 16px 14px",
                borderTop: `1px solid ${C.border}`,
            }}>
                {[
                    { label: "Present", color: C.gold },
                    { label: "Late", color: "#f97316" },
                    { label: "Done", color: "#22c55e" },
                    { label: "Absent", color: "#ef4444" },
                ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: l.color }} />
                        <span style={{ color: C.muted, fontSize: 11 }}>{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ title, icon }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ flexShrink: 0, color: C.gold }}>{icon}</div>
            <span style={{ color: C.white, fontSize: 15, fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
                {title}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </div>
    );
}

// ─── Time Block ───────────────────────────────────────────────────────────────
function TimeBlock({ label, time, icon, color, bg, border, photo, photoExpired, lat, lng, onPhotoPress }) {
    return (
        <div style={{
            flex: 1, backgroundColor: bg, border: `1px solid ${border}`,
            borderRadius: 16, padding: "14px 16px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ color }}>{icon}</div>
                <span style={{ color, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                    {label}
                </span>
            </div>

            <div style={{
                color: time === "--" ? C.muted : C.white,
                fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 8,
                fontVariantNumeric: "tabular-nums",
            }}>
                {time}
            </div>

            {lat && lng ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <LocationIcon size={11} color={C.muted} />
                    <span style={{ color: C.muted, fontSize: 11 }}>
                        {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                    </span>
                </div>
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <LocationIcon size={11} color={C.faint} />
                    <span style={{ color: C.faint, fontSize: 11 }}>Location unavailable</span>
                </div>
            )}

            {photo ? (
                photoExpired ? (
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        backgroundColor: C.redBg, border: `1px solid ${C.redBorder}`,
                        borderRadius: 8, padding: "5px 10px",
                    }}>
                        <TrashIcon size={12} color={C.red} />
                        <span style={{ color: C.red, fontWeight: 600, fontSize: 11 }}>Photo Deleted</span>
                    </div>
                ) : (
                    <button
                        onClick={onPhotoPress}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            backgroundColor: "rgba(0,0,0,0.3)",
                            border: `1px solid ${border}`,
                            borderRadius: 8, padding: "5px 10px",
                            cursor: "pointer",
                        }}
                    >
                        <CameraIcon size={12} color={color} />
                        <span style={{ color, fontWeight: 600, fontSize: 11 }}>View Photo</span>
                    </button>
                )
            ) : (
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    backgroundColor: "rgba(0,0,0,0.2)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "5px 10px", opacity: 0.5,
                }}>
                    <CameraOffIcon size={12} color={C.muted} />
                    <span style={{ color: C.muted, fontSize: 11 }}>No Photo</span>
                </div>
            )}
        </div>
    );
}

// ─── Day Detail Card ──────────────────────────────────────────────────────────
function DayDetailCard({ record, onPhotoPress, onClear }) {
    const meta = getStatusMeta(record);
    const duration = calcDuration(record.checkInTime, record.checkOutTime);
    const photoExpired = isPhotoExpired(record.attendanceDate);

    return (
        <div style={{
            backgroundColor: C.card,
            borderRadius: 20, border: `1px solid ${meta.border}`,
            padding: "20px 20px", marginBottom: 20,
        }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
                    borderRadius: 10, padding: "6px 12px",
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: meta.color }} />
                    <span style={{ color: meta.color, fontWeight: 800, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>
                        {meta.label}
                    </span>
                </div>
                <button onClick={onClear} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    backgroundColor: C.faint, border: "none", borderRadius: 8,
                    padding: "6px 10px", cursor: "pointer",
                    color: C.muted, fontSize: 12, fontWeight: 600,
                }}>
                    <CloseIcon size={12} color={C.muted} /> Clear
                </button>
            </div>

            {/* Flags */}
            {(record.isLate || record.isHalfDay) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {record.isLate && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            backgroundColor: C.orangeBg, border: `1px solid ${C.orangeBorder}`,
                            borderRadius: 8, padding: "4px 10px",
                        }}>
                            <AlertIcon size={12} color={C.orange} />
                            <span style={{ color: C.orange, fontWeight: 700, fontSize: 11 }}>Late Arrival</span>
                        </div>
                    )}
                    {record.isHalfDay && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            backgroundColor: C.blueBg, border: `1px solid ${C.blueBorder}`,
                            borderRadius: 8, padding: "4px 10px",
                        }}>
                            <SunIcon size={12} color={C.blue} />
                            <span style={{ color: C.blue, fontWeight: 700, fontSize: 11 }}>Half Day</span>
                        </div>
                    )}
                </div>
            )}

            {/* Photo expiry notice */}
            {photoExpired && (record.checkInPhoto || record.checkOutPhoto) && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    backgroundColor: "rgba(229,115,115,0.06)",
                    border: `1px solid ${C.redBorder}`,
                    borderRadius: 10, padding: "8px 12px", marginBottom: 12,
                }}>
                    <InfoIcon size={14} color={C.red} />
                    <span style={{ color: C.red, fontSize: 12 }}>
                        Photos for this day have been automatically deleted after 15 days.
                    </span>
                </div>
            )}

            {/* Time blocks */}
            <div className="sah-time-blocks">
                <TimeBlock
                    label="Check In" time={fmtTime(record.checkInTime)}
                    icon={<LoginIcon size={14} color={C.green} />}
                    color={C.green} bg={C.greenBg} border={C.greenBorder}
                    photo={record.checkInPhoto} photoExpired={photoExpired}
                    lat={record.checkInLat} lng={record.checkInLng}
                    onPhotoPress={() => onPhotoPress(record.checkInPhoto, "Check In", record.attendanceDate)}
                />
                <TimeBlock
                    label="Check Out" time={fmtTime(record.checkOutTime)}
                    icon={<LogoutIcon size={14} color={C.red} />}
                    color={C.red} bg={C.redBg} border={C.redBorder}
                    photo={record.checkOutPhoto} photoExpired={photoExpired}
                    lat={record.checkOutLat} lng={record.checkOutLng}
                    onPhotoPress={() => onPhotoPress(record.checkOutPhoto, "Check Out", record.attendanceDate)}
                />
            </div>

            {/* Duration */}
            <div style={{
                backgroundColor: C.surface, borderRadius: 14,
                border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", marginTop: 12,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        backgroundColor: "rgba(201,162,39,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <TimerIcon size={15} color={C.gold} />
                    </div>
                    <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Total Working Hours</span>
                </div>
                <span style={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>{duration}</span>
            </div>
        </div>
    );
}

// ─── Record Row ───────────────────────────────────────────────────────────────
function RecordRow({ record, isSelected, onPress, onPhotoPress }) {
    const meta = getStatusMeta(record);
    const duration = calcDuration(record.checkInTime, record.checkOutTime);
    const photoExpired = isPhotoExpired(record.attendanceDate);
    const dayNum = record.attendanceDate?.split("-")[2];
    const dayName = new Date(record.attendanceDate + "T12:00:00")
        .toLocaleDateString("en-IN", { weekday: "short" });

    return (
        <div
            onClick={onPress}
            style={{
                backgroundColor: isSelected ? C.surface : C.card,
                borderRadius: 16, border: `1px solid ${isSelected ? C.borderGold : C.border}`,
                padding: "13px 16px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer", transition: "background-color .15s, border-color .15s",
            }}
        >
            {/* Date circle */}
            <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ color: meta.color, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{dayNum}</span>
                <span style={{ color: meta.color, fontSize: 10, fontWeight: 600, opacity: 0.7 }}>{dayName}</span>
            </div>

            {/* Middle */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                    <div style={{
                        backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
                        borderRadius: 6, padding: "2px 7px",
                    }}>
                        <span style={{ color: meta.color, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>
                            {meta.label.toUpperCase()}
                        </span>
                    </div>
                    {record.isHalfDay && (
                        <div style={{
                            backgroundColor: C.blueBg, border: `1px solid ${C.blueBorder}`,
                            borderRadius: 6, padding: "2px 7px",
                        }}>
                            <span style={{ color: C.blue, fontWeight: 700, fontSize: 10 }}>HALF</span>
                        </div>
                    )}
                    {photoExpired && (record.checkInPhoto || record.checkOutPhoto) && (
                        <div style={{
                            backgroundColor: C.redBg, border: `1px solid ${C.redBorder}`,
                            borderRadius: 6, padding: "2px 7px",
                            display: "flex", alignItems: "center", gap: 3,
                        }}>
                            <TrashIcon size={9} color={C.red} />
                            <span style={{ color: C.red, fontWeight: 600, fontSize: 10 }}>Photos Deleted</span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <LoginIcon size={12} color={C.green} />
                        <span style={{
                            color: record.checkInTime ? C.white : C.muted,
                            fontSize: 12, fontWeight: 600,
                        }}>
                            {fmtTime(record.checkInTime)}
                        </span>
                    </div>
                    <span style={{ color: C.faint, fontSize: 12 }}>→</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <LogoutIcon size={12} color={C.red} />
                        <span style={{
                            color: record.checkOutTime ? C.white : C.muted,
                            fontSize: 12, fontWeight: 600,
                        }}>
                            {fmtTime(record.checkOutTime)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ color: C.gold, fontWeight: 800, fontSize: 14 }}>{duration}</span>
                <div style={{ display: "flex", gap: 5 }}>
                    {record.checkInPhoto && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPhotoPress(record.checkInPhoto, "Check In Photo", record.attendanceDate); }}
                            style={{
                                width: 28, height: 28, borderRadius: 7,
                                backgroundColor: photoExpired ? C.redBg : C.greenBg,
                                border: `1px solid ${photoExpired ? C.redBorder : C.greenBorder}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            {photoExpired
                                ? <TrashIcon size={11} color={C.red} />
                                : <ImageIcon size={11} color={C.green} />}
                        </button>
                    )}
                    {record.checkOutPhoto && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPhotoPress(record.checkOutPhoto, "Check Out Photo", record.attendanceDate); }}
                            style={{
                                width: 28, height: 28, borderRadius: 7,
                                backgroundColor: C.redBg,
                                border: `1px solid ${C.redBorder}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            {photoExpired
                                ? <TrashIcon size={11} color={C.red} />
                                : <ImageIcon size={11} color={C.red} />}
                        </button>
                    )}
                </div>
                <div style={{ color: C.muted }}>
                    {isSelected ? <ChevronUpIcon size={13} color={C.muted} /> : <ChevronDownIcon size={13} color={C.muted} />}
                </div>
            </div>
        </div>
    );
}

// ─── Photo Modal ──────────────────────────────────────────────────────────────
function PhotoModal({ photoModal, onClose }) {
    const [loadError, setLoadError] = useState(false);

    useEffect(() => { setLoadError(false); }, [photoModal]);

    if (!photoModal) return null;

    const expired = isPhotoExpired(photoModal.attendanceDate);

    return (
        <div style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9000, padding: 20,
            animation: "sah-fadeIn .2s ease",
        }}>
            <div style={{
                backgroundColor: C.surface, borderRadius: 24,
                border: `1px solid ${C.borderGold}`,
                padding: 18, width: "100%", maxWidth: 480,
            }}>
                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 14,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CameraIcon size={16} color={C.gold} />
                        <span style={{ color: C.gold, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
                            {photoModal.label?.toUpperCase()}
                        </span>
                    </div>
                    <button onClick={onClose} style={{
                        backgroundColor: C.faint, border: "none", borderRadius: 8,
                        padding: 6, cursor: "pointer", display: "flex",
                    }}>
                        <CloseIcon size={18} color={C.muted} />
                    </button>
                </div>

                {/* Content */}
                {expired || loadError ? (
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "32px 20px",
                        backgroundColor: "rgba(229,115,115,0.06)",
                        borderRadius: 16, border: `1px solid ${C.redBorder}`,
                    }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            backgroundColor: C.redBg, border: `1px solid ${C.redBorder}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 14,
                        }}>
                            <TrashIcon size={24} color={C.red} />
                        </div>
                        <span style={{ color: C.red, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                            Photo Deleted
                        </span>
                        <span style={{
                            color: C.muted, fontSize: 12.5, textAlign: "center",
                            lineHeight: 1.6, marginBottom: 14,
                        }}>
                            Attendance photos are automatically deleted after 15 days to protect privacy and reduce storage.
                        </span>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            backgroundColor: C.redBg, border: `1px solid ${C.redBorder}`,
                            borderRadius: 8, padding: "5px 12px",
                        }}>
                            <ClockIcon size={12} color={C.red} />
                            <span style={{ color: C.red, fontSize: 12, fontWeight: 600 }}>
                                15-day retention policy
                            </span>
                        </div>
                    </div>
                ) : photoModal.uri ? (
                    <img
                        src={photoModal.uri}
                        alt={photoModal.label}
                        onError={() => setLoadError(true)}
                        style={{
                            width: "100%", height: 340, borderRadius: 16,
                            objectFit: "contain", backgroundColor: "#000",
                        }}
                    />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
                        <ImageIcon size={50} color={C.muted} />
                        <span style={{ color: C.muted, marginTop: 10, fontSize: 13 }}>Photo unavailable</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffAttendanceHistory() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const permissions = useAuthStore((s) => s.permissions) || [];

    const canViewOwn = permissions.includes("attendance.view.own");

    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [calendarMarked, setCalendarMarked] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [photoModal, setPhotoModal] = useState(null);
    const [summaryStats, setSummaryStats] = useState({ daysWorked: 0, lateDays: 0, absents: 0, avgHours: "--" });
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    const loadRecords = useCallback(async (yearMonth) => {
        if (!user || !canViewOwn) { setLoading(false); return; }
        try {
            setLoading(true);
            const res = await api.get(`/attendance/my-history?month=${yearMonth}`);
            const data = res.data;
            setRecords(data);

            const marked = {};
            let worked = 0, late = 0, absent = 0, totalMs = 0, countedDays = 0;

            data.forEach((r) => {
                const meta = getStatusMeta(r);
                marked[r.attendanceDate] = { marked: true, dotColor: meta.dot };
                if (r.isAbsent) { absent++; return; }
                if (r.checkInTime) {
                    worked++;
                    if (r.isLate) late++;
                    if (r.checkOutTime) {
                        totalMs += new Date(r.checkOutTime) - new Date(r.checkInTime);
                        countedDays++;
                    }
                }
            });

            const avgMs = countedDays > 0 ? totalMs / countedDays : 0;
            const avgH = Math.floor(avgMs / 3600000);
            const avgM = Math.floor((avgMs % 3600000) / 60000);
            setSummaryStats({
                daysWorked: worked, lateDays: late, absents: absent,
                avgHours: countedDays > 0 ? `${avgH}h ${avgM}m` : "--",
            });
            setCalendarMarked(marked);
        } catch (err) {
            console.error("Attendance history error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, canViewOwn]);

    useEffect(() => { loadRecords(currentMonth); }, [currentMonth, loadRecords]);

    const onMonthChange = ({ year, month }) => {
        const ym = `${year}-${String(month).padStart(2, "0")}`;
        setCurrentMonth(ym);
        setSelectedDate(null);
        setSelectedRecord(null);
    };

    const onDayPress = ({ dateString }) => {
        if (selectedDate === dateString) { setSelectedDate(null); setSelectedRecord(null); return; }
        setSelectedDate(dateString);
        setSelectedRecord(records.find(r => r.attendanceDate === dateString) || null);
    };

    const markedWithSelected = {
        ...calendarMarked,
        ...(selectedDate && {
            [selectedDate]: {
                ...(calendarMarked[selectedDate] || {}),
                selected: true, selectedColor: C.gold,
            },
        }),
    };

    const tiles = [
        { label: "Days Worked", value: summaryStats.daysWorked, icon: <CheckCircleIcon size={18} color={C.green} />, color: C.green },
        { label: "Late Days", value: summaryStats.lateDays, icon: <ClockIcon size={18} color={C.orange} />, color: C.orange },
        { label: "Absents", value: summaryStats.absents, icon: <CloseCircleIcon size={18} color={C.red} />, color: C.red },
        { label: "Avg Hours", value: summaryStats.avgHours, icon: <TimerIcon size={18} color={C.goldLight} />, color: C.goldLight },
    ];

    if (loading) {
        return (
            <>
                <style>{`
          @keyframes sah-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          *,*::before,*::after{box-sizing:border-box} body{margin:0}
        `}</style>
                <div style={{
                    minHeight: "100vh", backgroundColor: C.bg,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 14,
                }}>
                    <Spinner size={34} color={C.gold} />
                    <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase" }}>
                        Loading
                    </span>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{`
        @keyframes sah-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes sah-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        *,*::before,*::after { box-sizing:border-box; }
        body { margin:0; }

        .sah-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          padding: 24px 20px 60px;
          animation: sah-fadeIn .35s ease forwards;
        }
        .sah-inner {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }

        /* header */
        .sah-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .sah-back-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background-color: ${C.card};
          border: 1px solid ${C.border};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          color: ${C.white};
          transition: border-color .15s;
        }
        .sah-back-btn:hover { border-color: ${C.borderGold}; }

        .sah-eyebrow {
          color: ${C.gold}; font-size: 10px; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; margin: 0 0 3px;
        }
        .sah-title {
          color: ${C.white}; font-size: 22px; font-weight: 800;
          letter-spacing: -0.4px; margin: 0;
        }
        @media (min-width: 768px) {
          .sah-outer  { padding: 36px 32px 60px; }
          .sah-title  { font-size: 28px; }
        }

        /* tiles */
        .sah-tiles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .sah-tiles { grid-template-columns: repeat(4, 1fr); }
        }

        /* main layout */
        .sah-main {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .sah-main { grid-template-columns: 340px 1fr; align-items: start; }
        }
        @media (min-width: 1024px) {
          .sah-main { grid-template-columns: 380px 1fr; }
        }

        /* time blocks */
        .sah-time-blocks {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 0;
        }
        @media (min-width: 480px) {
          .sah-time-blocks { flex-direction: row; }
        }

        /* no record */
        .sah-no-record {
          background-color: ${C.card};
          border-radius: 20px;
          border: 1px solid ${C.border};
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 20px;
          text-align: center;
          margin-bottom: 20px;
        }

        /* record list */
        .sah-record-row:hover {
          background-color: ${C.surface} !important;
          border-color: ${C.borderGold} !important;
        }

        button { font-family: inherit; }
        input, textarea { font-family: inherit; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.25); border-radius: 4px; }
      `}</style>

            <div className="sah-outer">
                <div className="sah-inner">

                    {/* ── Header ── */}
                    <div className="sah-header">
                        <button className="sah-back-btn" onClick={() => router.back()}>
                            <ArrowLeftIcon size={18} />
                        </button>
                        <div>
                            <p className="sah-eyebrow">Staff Portal</p>
                            <h1 className="sah-title">My Attendance</h1>
                        </div>
                    </div>

                    {/* ── Summary Tiles ── */}
                    <div className="sah-tiles">
                        {tiles.map((tile) => (
                            <div key={tile.label} style={{
                                backgroundColor: C.card,
                                borderRadius: 18, border: `1px solid ${C.border}`,
                                padding: "16px 14px",
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: "50%",
                                    backgroundColor: tile.color + "20",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    marginBottom: 8,
                                }}>
                                    {tile.icon}
                                </div>
                                <div style={{ color: C.muted, fontSize: 11, marginBottom: 3 }}>{tile.label}</div>
                                <div style={{ color: tile.color, fontSize: 22, fontWeight: 800 }}>{tile.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Main layout ── */}
                    <div className="sah-main">

                        {/* Left — Calendar */}
                        <div>
                            <SectionLabel
                                title="Attendance Calendar"
                                icon={<CalendarIcon size={16} color={C.gold} />}
                            />
                            <MiniCalendar
                                yearMonth={currentMonth}
                                markedDates={markedWithSelected}
                                selectedDate={selectedDate}
                                onDayPress={onDayPress}
                                onMonthChange={onMonthChange}
                            />

                            {/* Selected day detail */}
                            {selectedDate && (
                                <>
                                    <SectionLabel
                                        title={fmtDate(selectedDate)}
                                        icon={<CalendarIcon size={16} color={C.gold} />}
                                    />
                                    {selectedRecord ? (
                                        <DayDetailCard
                                            record={selectedRecord}
                                            onPhotoPress={(uri, label, date) => setPhotoModal({ uri, label, attendanceDate: date })}
                                            onClear={() => { setSelectedDate(null); setSelectedRecord(null); }}
                                        />
                                    ) : (
                                        <div className="sah-no-record">
                                            <CalendarIcon size={48} color={C.faint} />
                                            <p style={{ color: C.muted, marginTop: 12, fontSize: 14, fontWeight: 600 }}>
                                                No attendance record
                                            </p>
                                            <p style={{ color: C.faint, marginTop: 4, fontSize: 12 }}>{selectedDate}</p>
                                            <button
                                                onClick={() => { setSelectedDate(null); setSelectedRecord(null); }}
                                                style={{
                                                    marginTop: 14, padding: "7px 16px",
                                                    borderRadius: 10, border: `1px solid ${C.border}`,
                                                    backgroundColor: "transparent", cursor: "pointer",
                                                    color: C.muted, fontSize: 12,
                                                }}
                                            >
                                                Clear Selection
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right — Records list */}
                        <div>
                            <SectionLabel
                                title="This Month's Records"
                                icon={<ListIcon size={16} color={C.gold} />}
                            />
                            {records.length === 0 ? (
                                <div className="sah-no-record">
                                    <ListIcon size={48} color={C.faint} />
                                    <p style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>No records this month</p>
                                </div>
                            ) : (
                                [...records]
                                    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
                                    .map((r) => (
                                        <RecordRow
                                            key={r.attendanceDate}
                                            record={r}
                                            isSelected={selectedDate === r.attendanceDate}
                                            onPress={() => {
                                                if (selectedDate === r.attendanceDate) {
                                                    setSelectedDate(null); setSelectedRecord(null);
                                                } else {
                                                    setSelectedDate(r.attendanceDate); setSelectedRecord(r);
                                                }
                                            }}
                                            onPhotoPress={(uri, label, date) =>
                                                setPhotoModal({ uri, label, attendanceDate: date })}
                                        />
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Photo Modal ── */}
            <PhotoModal
                photoModal={photoModal}
                onClose={() => setPhotoModal(null)}
            />
        </>
    );
}