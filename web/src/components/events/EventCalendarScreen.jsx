// src/components/events/EventCalendarScreen.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../config/permissionMap";
import { getCalendarSummary, getEventsByDate, deleteEvent } from "../../api/eventsApi";
import { fetchSites, fetchSiteById } from "../../api/siteApi";

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
  orange: "#F97316",
};

const DOT = {
  booked:   "#E57373",
  in_talks: "#E8C34A",
  available:"#5DBE8A",
};

const STATUS_BADGE = {
  booked:   { bg:"rgba(229,115,115,0.15)", text:"#E57373", border:"rgba(229,115,115,0.35)" },
  in_talks: { bg:"rgba(232,195,74,0.15)",  text:"#E8C34A", border:"rgba(232,195,74,0.35)"  },
  available:{ bg:"rgba(93,190,138,0.15)",  text:"#5DBE8A", border:"rgba(93,190,138,0.35)"  },
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

function RestaurantIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function EditIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 14 }) {
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

function PlusIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BuildingIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function WarningIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckCircleIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function LocationIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function Spinner({ size = 28, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
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
        <h3 style={{ color: C.white, fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>
          {title}
        </h3>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: C.faint, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "9px 18px",
            color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
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

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ calendarData, selectedDate, today, onDayPress, onMonthChange, loading }) {
  const todayObj = new Date();
  const [displayYear,  setDisplayYear]  = useState(todayObj.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(todayObj.getMonth());

  const prevMonth = () => {
    let m = displayMonth - 1, y = displayYear;
    if (m < 0) { m = 11; y--; }
    setDisplayMonth(m); setDisplayYear(y);
    onMonthChange({ year: y, month: m + 1 });
  };

  const nextMonth = () => {
    let m = displayMonth + 1, y = displayYear;
    if (m > 11) { m = 0; y++; }
    setDisplayMonth(m); setDisplayYear(y);
    onMonthChange({ year: y, month: m + 1 });
  };

  const monthName   = new Date(displayYear, displayMonth).toLocaleString("default", { month: "long" });
  const firstDay    = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
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
        <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>
          {monthName} {displayYear}
        </span>
        <button onClick={nextMonth} style={{
          background: "none", border: "none",
          cursor: "pointer", color: C.gold, display: "flex", padding: 4,
        }}>
          <ChevronRightIcon size={20} />
        </button>
      </div>

      {loading ? (
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", padding: "40px 0",
        }}>
          <Spinner size={28} color={C.gold} />
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2, marginBottom: 6,
          }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} style={{
                textAlign: "center", color: C.gold,
                fontSize: 11, fontWeight: 600, padding: "4px 0",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2,
          }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;

              const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const mark       = calendarData[dateStr];
              const isToday    = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const isPast     = dateStr < today;

              const dots = mark?.dots?.length === 2
                ? mark.dots
                : [
                    { key: "lunch",  color: isPast ? "transparent" : DOT.available },
                    { key: "dinner", color: isPast ? "transparent" : DOT.available },
                  ];

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayPress(dateStr)}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 3, padding: "4px 0",
                    background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isSelected
                      ? C.gold
                      : isToday ? "rgba(201,162,39,0.15)" : "transparent",
                    border: isToday && !isSelected ? `1px solid ${C.borderGold}` : "none",
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isToday || isSelected ? 700 : 400,
                      color: isSelected ? "#000" : isPast ? C.muted : isToday ? C.gold : C.white,
                    }}>
                      {day}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 4, height: 7,
                  }}>
                    {dots.map((dot, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: "50%",
                        backgroundColor: isPast
                          ? (dot.color === "transparent" ? "transparent" : dot.color)
                          : dot.color,
                      }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ event, isFirst, bookedHallSlots, isPast, permissions, onEdit, onDelete }) {
  const badge = STATUS_BADGE[event.status] || STATUS_BADGE.available;

  const showOrphanWarning =
    event.status === "in_talks" &&
    bookedHallSlots.some(
      (b) => b.hallName === event.hallName && b.eventSlot === event.eventSlot
    );

  return (
    <div style={{
      borderTop: isFirst ? "none" : `1px solid ${C.border}`,
      paddingTop: isFirst ? 0 : 12,
      marginTop: isFirst ? 0 : 12,
    }}>
      {showOrphanWarning && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          backgroundColor: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.4)",
          borderRadius: 8, padding: "6px 10px", marginBottom: 8,
        }}>
          <span style={{ color: C.orange, display: "flex" }}>
            <WarningIcon size={14} />
          </span>
          <span style={{ color: C.orange, fontSize: 12, flex: 1 }}>
            This slot is already confirmed for another booking in this hall
          </span>
        </div>
      )}

      <p style={{ color: C.white, fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>
        {event.title}
      </p>
      <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px" }}>
        {event.clientName}
      </p>

      <div style={{
        display: "flex", flexWrap: "wrap",
        alignItems: "center", gap: 6, marginBottom: 6,
      }}>
        <span style={{
          padding: "3px 10px", borderRadius: 20,
          backgroundColor: badge.bg,
          border: `1px solid ${badge.border}`,
          color: badge.text, fontSize: 11,
          fontWeight: 600, textTransform: "capitalize",
        }}>
          {event.status === "in_talks" ? "In Talks" : event.status}
        </span>

        {event.hallName && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20,
            backgroundColor: "rgba(201,162,39,0.12)",
            border: `1px solid ${C.borderGold}`,
            color: C.gold, fontSize: 11, fontWeight: 600,
          }}>
            <BuildingIcon size={11} />
            {event.hallName}
          </span>
        )}

        {showOrphanWarning && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20,
            backgroundColor: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.4)",
            color: C.orange, fontSize: 11, fontWeight: 600,
          }}>
            <WarningIcon size={11} />
            Already Booked
          </span>
        )}
      </div>

      {event.notes && (
        <p style={{ color: C.muted, fontSize: 11, fontStyle: "italic", margin: "0 0 8px" }}>
          {event.notes}
        </p>
      )}

      {can(permissions, ACTION_PERMISSIONS.event.edit) && !isPast && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => onEdit(event)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              backgroundColor: "rgba(201,162,39,0.1)",
              border: `1px solid ${C.borderGold}`,
              borderRadius: 8, padding: "5px 12px",
              color: C.gold, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <EditIcon size={12} />
            Edit
          </button>

          {can(permissions, ACTION_PERMISSIONS.event.delete) && (
            <button
              onClick={() => onDelete(event)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                backgroundColor: "rgba(229,115,115,0.1)",
                border: "1px solid rgba(229,115,115,0.35)",
                borderRadius: 8, padding: "5px 12px",
                color: "#E57373", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              <TrashIcon size={12} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SlotCard ─────────────────────────────────────────────────────────────────
function SlotCard({
  title, slotIcon, slotEvents, slot,
  bookedSlots, bookedHallSlots, isPast,
  permissions, onEdit, onDelete,
}) {
  const hasEvents    = slotEvents?.length > 0;
  const slotIsBooked = bookedSlots.includes(slot);

  return (
    <div style={{
      border: `1px solid ${hasEvents ? C.borderGold : C.border}`,
      borderRadius: 16, padding: "16px 18px",
      marginBottom: 12, backgroundColor: C.card,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          backgroundColor: "rgba(201,162,39,0.12)",
          border: `1px solid ${C.borderGold}`,
          display: "flex", alignItems: "center",
          justifyContent: "center", color: C.gold, flexShrink: 0,
        }}>
          {slotIcon}
        </div>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 15, flex: 1 }}>
          {title}
        </span>

        {slotEvents?.length > 1 && (
          <span style={{
            backgroundColor: "rgba(201,162,39,0.15)",
            border: `1px solid ${C.borderGold}`,
            borderRadius: 12, padding: "2px 8px",
            color: C.gold, fontSize: 11, fontWeight: 600,
          }}>
            {slotEvents.length} entries
          </span>
        )}

        {slotIsBooked && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            backgroundColor: "rgba(229,115,115,0.12)",
            border: "1px solid rgba(229,115,115,0.35)",
            borderRadius: 12, padding: "2px 8px",
            color: "#E57373", fontSize: 11, fontWeight: 600,
          }}>
            <CheckCircleIcon size={11} />
            Confirmed
          </span>
        )}
      </div>

      <div style={{ height: 1, backgroundColor: C.border, margin: "8px 0 12px" }} />

      {hasEvents ? (
        slotEvents.map((event, index) => (
          <EventRow
            key={event.id}
            event={event}
            isFirst={index === 0}
            bookedHallSlots={bookedHallSlots}
            isPast={isPast}
            permissions={permissions}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        !isPast && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: DOT.available,
            }} />
            <span style={{ color: C.muted, fontSize: 13 }}>Available</span>
          </div>
        )
      )}
    </div>
  );
}

// ─── Main EventCalendarScreen ─────────────────────────────────────────────────
export default function EventCalendarScreen() {
  const router      = useRouter();
  const permissions = useAuthStore((s) => s.permissions) || [];

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const [sites,           setSites]           = useState([]);
  const [selectedSite,    setSelectedSite]    = useState(null);
  const [halls,           setHalls]           = useState([]);
  const [loadingSites,    setLoadingSites]    = useState(true);
  const [selectedHall,    setSelectedHall]    = useState(null);
  const [calendarData,    setCalendarData]    = useState({});
  const [selectedDate,    setSelectedDate]    = useState(null);
  const [currentMonth,    setCurrentMonth]    = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [events,          setEvents]          = useState([]);
  const [loadingEvents,   setLoadingEvents]   = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [deleting,        setDeleting]        = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const bookedHallSlots = events
    .filter((e) => e.status === "booked")
    .map((e) => ({ hallName: e.hallName, eventSlot: e.eventSlot }));

  const bookedSlots = [...new Set(
    events.filter((e) => e.status === "booked").map((e) => e.eventSlot)
  )];

  const lunchEvents  = events.filter((e) => e.eventSlot === "lunch");
  const dinnerEvents = events.filter((e) => e.eventSlot === "dinner");
  const isPast       = selectedDate ? selectedDate < today : false;

  // ── Build marks ────────────────────────────────────────────────────────────
  const buildMarks = useCallback((summary, selected, year, month) => {
    const marks = {};
    const daysInMonth = new Date(year, month, 0).getDate();
    const getColor = (status) => {
      if (status === "booked")   return DOT.booked;
      if (status === "in_talks") return DOT.in_talks;
      return DOT.available;
    };
    for (let i = 1; i <= daysInMonth; i++) {
      const date       = `${year}-${String(month).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
      const isPastDate = date < today;
      const daySummary = summary[date] || {};
      let dots;
      if (isPastDate) {
        dots = [
          {
            key: "lunch",
            color: (daySummary.lunch === "booked" || daySummary.lunch === "in_talks")
              ? getColor(daySummary.lunch) : "transparent",
          },
          {
            key: "dinner",
            color: (daySummary.dinner === "booked" || daySummary.dinner === "in_talks")
              ? getColor(daySummary.dinner) : "transparent",
          },
        ];
      } else {
        dots = [
          { key: "lunch",  color: getColor(daySummary.lunch)  },
          { key: "dinner", color: getColor(daySummary.dinner) },
        ];
      }
      marks[date] = { dots };
    }
    if (selected) {
      marks[selected] = { ...(marks[selected] || {}), selected: true, selectedColor: C.gold };
    }
    return marks;
  }, [today]);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadCalendar = useCallback(async (siteId, selected, year, month, hallName = null) => {
    if (!siteId) return;
    try {
      setLoadingCalendar(true);
      const summary = await getCalendarSummary({
        siteId, year, month,
        ...(hallName ? { hallName } : {}),
      });
      setCalendarData(buildMarks(summary, selected, year, month));
    } catch (err) {
      console.log("loadCalendar error:", err);
    } finally {
      setLoadingCalendar(false);
    }
  }, [buildMarks]);

  const loadEvents = useCallback(async (date, siteId, hallName = null) => {
    if (!siteId || !date) return;
    try {
      setLoadingEvents(true);
      const res = await getEventsByDate(date, {
        locationId: siteId,
        ...(hallName ? { hallName } : {}),
      });
      setEvents(res);
    } catch (err) {
      console.log("loadEvents error:", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // ── Load sites on mount ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingSites(true);
        const data = await fetchSites();
        setSites(data);
        if (data.length > 0) setSelectedSite(data[0]);
      } catch (err) {
        console.log("Failed to load sites:", err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

  // ── Venue change ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSite?.id) return;
    (async () => {
      try {
        const data = await fetchSiteById(selectedSite.id);
        setHalls(Array.isArray(data) ? data : data?.halls || []);
      } catch {
        setHalls([]);
      }
    })();
    setSelectedHall(null);
    setSelectedDate(null);
    setEvents([]);
    setCalendarData({});
    loadCalendar(selectedSite.id, null, currentMonth.year, currentMonth.month, null);
  }, [selectedSite?.id]);

  // ── Hall filter change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSite?.id) return;
    setCalendarData({});
    loadCalendar(selectedSite.id, selectedDate, currentMonth.year, currentMonth.month, selectedHall);
    if (selectedDate) loadEvents(selectedDate, selectedSite.id, selectedHall);
  }, [selectedHall]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDayPress = (dateStr) => {
    setSelectedDate(dateStr);
    loadEvents(dateStr, selectedSite?.id, selectedHall);
    loadCalendar(selectedSite?.id, dateStr, currentMonth.year, currentMonth.month, selectedHall);
  };

  const handleMonthChange = ({ year, month }) => {
    setCurrentMonth({ year, month });
    loadCalendar(selectedSite?.id, selectedDate, year, month, selectedHall);
  };

  // ── FIXED: Edit navigation — passes full event + context as query params ──
  const handleEdit = (event) => {
    const params = new URLSearchParams({
      mode:            "edit",
      date:            selectedDate || "",
      locationId:      selectedSite?.id || "",
      eventData:       encodeURIComponent(JSON.stringify(event)),
      halls:           encodeURIComponent(JSON.stringify(halls)),
      bookedSlots:     encodeURIComponent(JSON.stringify(bookedSlots)),
      bookedHallSlots: encodeURIComponent(JSON.stringify(bookedHallSlots)),
    });
    if (selectedHall) params.set("preselectedHall", selectedHall);
    router.push(`/events/form?${params.toString()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      setDeleting(true);
      await deleteEvent(confirmDelete.id);
      setConfirmDelete(null);
      if (selectedDate) {
        loadEvents(selectedDate, selectedSite?.id, selectedHall);
        loadCalendar(selectedSite?.id, selectedDate, currentMonth.year, currentMonth.month, selectedHall);
      }
    } catch {
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── FIXED: Add Event navigation — passes halls + booked context ────────────
  const goToAddEvent = () => {
    const params = new URLSearchParams({
      mode:            "create",
      date:            selectedDate || "",
      locationId:      selectedSite?.id || "",
      halls:           encodeURIComponent(JSON.stringify(halls)),
      bookedSlots:     encodeURIComponent(JSON.stringify(bookedSlots)),
      bookedHallSlots: encodeURIComponent(JSON.stringify(bookedHallSlots)),
    });
    if (selectedHall) params.set("preselectedHall", selectedHall);
    router.push(`/events/form?${params.toString()}`);
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        * { box-sizing: border-box; }

        .ec-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 16px 48px;
        }

        .ec-card {
          width: 100%;
          max-width: 1100px;
          background-color: ${C.surface};
          border-radius: 24px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(201,162,39,0.06),
            0 24px 80px rgba(0,0,0,0.6);
          animation: fadeIn .35s ease forwards;
        }

        .ec-header {
          padding: 20px 28px 16px;
          border-bottom: 1px solid ${C.border};
        }

        .ec-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ec-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .chip-label {
          color: ${C.muted};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-right: 4px;
        }

        .ec-body {
          display: flex;
          flex-direction: row;
        }

        .ec-left {
          flex: 0 0 380px;
          border-right: 1px solid ${C.border};
          padding: 24px;
        }

        .ec-right {
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 180px);
          padding: 24px;
        }

        .chip-btn {
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-width: 1px;
          border-style: solid;
          transition: all .15s;
          white-space: nowrap;
        }
        .chip-btn:hover { filter: brightness(1.1); }

        .chip-btn-active {
          background-color: ${C.gold};
          border-color: ${C.gold};
          color: #000;
          font-weight: 700;
        }
        .chip-btn-inactive {
          background-color: ${C.faint};
          border-color: ${C.border};
          color: ${C.muted};
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: ${C.faint};
          border: 1px solid ${C.borderGold};
          border-radius: 10px;
          padding: 7px 12px;
          color: ${C.gold};
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          flex-shrink: 0;
        }
        .back-btn:hover { filter: brightness(1.2); }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25);
          border-radius: 4px;
        }

        @media (max-width: 720px) {
          .ec-outer  { padding: 12px 10px 32px; }
          .ec-body   { flex-direction: column; }
          .ec-left   {
            flex: none;
            border-right: none;
            border-bottom: 1px solid ${C.border};
            padding: 16px;
          }
          .ec-right  { max-height: none; padding: 16px; }
          .ec-header { padding: 14px 16px 12px; }
        }

        @media (max-width: 480px) {
          .ec-header-top h1 { font-size: 20px !important; }
        }
      `}</style>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="ec-outer">
        <div className="ec-card">

          {/* ── HEADER ── */}
          <div className="ec-header">
            <div className="ec-header-top">

              {/* ── FIXED: back button → goes to /dashboard ── */}
              <button
                className="back-btn"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeftIcon size={16} />
                Back
              </button>

              <div>
                <p style={{
                  color: C.gold, fontSize: 10, fontWeight: 700,
                  letterSpacing: "3px", textTransform: "uppercase",
                  margin: "0 0 2px",
                }}>
                  Event Management
                </p>
                <h1 style={{
                  color: C.white, fontSize: 26,
                  fontWeight: 800, letterSpacing: "-0.3px",
                  margin: 0, lineHeight: 1,
                }}>
                  Event Calendar
                </h1>
              </div>
            </div>

            {/* Venue chips */}
            {loadingSites ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner size={18} color={C.gold} />
                <span style={{ color: C.muted, fontSize: 13 }}>Loading venues…</span>
              </div>
            ) : sites.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div className="ec-chips-row">
                  <span className="chip-label">
                    <LocationIcon size={11} />
                    {" "}Location
                  </span>
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      className={`chip-btn ${selectedSite?.id === site.id ? "chip-btn-active" : "chip-btn-inactive"}`}
                      onClick={() => setSelectedSite(site)}
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hall chips */}
            {halls.length > 0 && (
              <div>
                <div className="ec-chips-row">
                  <span className="chip-label">
                    <BuildingIcon size={11} />
                    {" "}Hall
                  </span>
                  <button
                    className={`chip-btn ${selectedHall === null ? "chip-btn-active" : "chip-btn-inactive"}`}
                    onClick={() => setSelectedHall(null)}
                  >
                    All Halls
                  </button>
                  {halls.map((hall) => {
                    const hallId = hall.name ?? hall;
                    const isSel  = selectedHall === hallId;
                    return (
                      <button
                        key={hallId}
                        className={`chip-btn ${isSel ? "chip-btn-active" : "chip-btn-inactive"}`}
                        onClick={() => setSelectedHall(hallId)}
                      >
                        {hallId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="ec-body">

            {/* ── LEFT: Calendar ── */}
            <div className="ec-left">
              <MiniCalendar
                calendarData={calendarData}
                selectedDate={selectedDate}
                today={today}
                onDayPress={handleDayPress}
                onMonthChange={handleMonthChange}
                loading={loadingCalendar}
              />

              {/* Legend */}
              <div style={{
                display: "flex", flexWrap: "wrap",
                gap: "8px 16px", marginTop: 14,
                paddingTop: 14, borderTop: `1px solid ${C.border}`,
              }}>
                {[
                  { color: DOT.booked,    label: "Booked"    },
                  { color: DOT.in_talks,  label: "In Talks"  },
                  { color: DOT.available, label: "Available" },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      backgroundColor: l.color,
                    }} />
                    <span style={{ color: C.muted, fontSize: 12 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Date detail ── */}
            <div className="ec-right">
              {selectedDate ? (
                <>
                  {/* Date heading */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, marginBottom: 16,
                  }}>
                    <div style={{
                      width: 4, height: 28, borderRadius: 2,
                      backgroundColor: C.gold, flexShrink: 0,
                    }} />
                    <h2 style={{
                      color: C.white, fontWeight: 700,
                      fontSize: 16, margin: 0, flex: 1,
                    }}>
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric",
                        month: "long", day: "numeric",
                      })}
                    </h2>
                  </div>

                  {/* Selected hall badge */}
                  {selectedHall && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      backgroundColor: "rgba(201,162,39,0.08)",
                      border: `1px solid ${C.borderGold}`,
                      borderRadius: 10, padding: "5px 10px", marginBottom: 14,
                    }}>
                      <span style={{ color: C.gold, display: "flex" }}>
                        <BuildingIcon size={13} />
                      </span>
                      <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
                        {selectedHall}
                      </span>
                    </div>
                  )}

                  {/* Slot cards */}
                  {loadingEvents ? (
                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "center", padding: "32px 0",
                    }}>
                      <Spinner size={28} color={C.gold} />
                    </div>
                  ) : (
                    <>
                      <SlotCard
                        title="Lunch"
                        slotIcon={<RestaurantIcon size={15} />}
                        slotEvents={lunchEvents}
                        slot="lunch"
                        bookedSlots={bookedSlots}
                        bookedHallSlots={bookedHallSlots}
                        isPast={isPast}
                        permissions={permissions}
                        onEdit={handleEdit}
                        onDelete={(e) => setConfirmDelete(e)}
                      />
                      <SlotCard
                        title="Dinner"
                        slotIcon={<MoonIcon size={15} />}
                        slotEvents={dinnerEvents}
                        slot="dinner"
                        bookedSlots={bookedSlots}
                        bookedHallSlots={bookedHallSlots}
                        isPast={isPast}
                        permissions={permissions}
                        onEdit={handleEdit}
                        onDelete={(e) => setConfirmDelete(e)}
                      />
                    </>
                  )}

                  {/* Add Event button */}
                  {can(permissions, ACTION_PERMISSIONS.event.create) && selectedDate >= today && (
                    <button
                      onClick={goToAddEvent}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8,
                        backgroundColor: C.gold,
                        border: "none", borderRadius: 14,
                        padding: "14px 0",
                        color: "#000", fontWeight: 800,
                        fontSize: 14, letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        cursor: "pointer", marginTop: 8,
                        transition: "filter .15s, transform .1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter    = "brightness(1.1)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter    = "brightness(1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <PlusIcon size={18} />
                      Add Event
                    </button>
                  )}
                </>
              ) : (
                !loadingCalendar && (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "60px 0", opacity: 0.4, gap: 10,
                  }}>
                    <span style={{ color: C.muted }}>
                      <CalendarIcon size={40} />
                    </span>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                      Tap a date to view bookings
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}