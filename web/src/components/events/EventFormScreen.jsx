// src/components/events/EventFormScreen.jsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../config/permissionMap";
import { createEvent, updateEvent } from "../../api/eventsApi";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  inputBg: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  red: "#E57373",
  orange: "#F97316",
};

// ─── Char limits ──────────────────────────────────────────────────────────────
const LIMITS = { title: 100, notes: 500, clientName: 60 };

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

function CalendarIcon({ size = 14 }) {
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

function RibbonIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function DocumentIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function PersonIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PersonCircleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M6.168 18.849A4.001 4.001 0 0110 16h4a4.001 4.001 0 013.832 2.849" />
    </svg>
  );
}

function PhoneIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function OptionsIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function TimeIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FlagIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function BusinessIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function RestaurantIcon({ size = 14 }) {
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

function MoonIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ChatIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function UploadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function PlusCircleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function LockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
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

function Spinner({ size = 18, color = "#000" }) {
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

// ─── Unauthorized screen ──────────────────────────────────────────────────────
function Unauthorized({ router }) {
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: C.bg,
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: 20,
        border: `1px solid rgba(229,115,115,0.35)`,
        padding: 40, maxWidth: 400, width: "100%",
        textAlign: "center",
      }}>
        <div style={{ color: C.red, marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <WarningIcon size={40} />
        </div>
        <h2 style={{ color: C.white, fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
          Access Denied
        </h2>
        <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
          You don't have permission to perform this action.
        </p>
        <button
          onClick={() => router.push("/events")}
          style={{
            backgroundColor: C.gold, border: "none",
            borderRadius: 10, padding: "10px 24px",
            color: "#000", fontWeight: 700,
            fontSize: 14, cursor: "pointer",
          }}
        >
          Back to Events
        </button>
      </div>
    </div>
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint, optional }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hint ? 3 : 0 }}>
        <span style={{ color: C.gold, display: "flex" }}>{icon}</span>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{label}</span>
        {optional && (
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 400 }}>(optional)</span>
        )}
      </div>
      {hint && (
        <p style={{ color: C.muted, fontSize: 12, margin: "0 0 0 20px" }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChange, placeholder,
  multiline, type, isPhone,
  maxLength, showCount,
}) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    let text = e.target.value;
    if (isPhone) {
      text = text.replace(/[^0-9]/g, "").slice(0, 10);
      onChange(text);
    } else if (maxLength) {
      if (text.length <= maxLength) onChange(text);
    } else {
      onChange(text);
    }
  };

  const currentLength = value ? value.length : 0;
  const isNearLimit   = maxLength && currentLength >= maxLength * 0.85;
  const isAtLimit     = maxLength && currentLength >= maxLength;

  const borderColor = focused
    ? isAtLimit ? C.red : C.gold
    : isAtLimit ? "rgba(229,115,115,0.5)" : C.border;

  const baseStyle = {
    backgroundColor: C.inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 12,
    padding: "10px 14px",
    color: C.white,
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color .15s",
  };

  if (isPhone) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{
          backgroundColor: C.inputBg,
          border: `1px solid ${focused ? C.gold : C.border}`,
          borderRadius: 12,
          display: "flex", alignItems: "center",
          padding: "0 14px",
          transition: "border-color .15s",
        }}>
          <input
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            type="tel"
            inputMode="numeric"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              ...baseStyle,
              border: "none",
              background: "none",
              padding: "10px 0",
              flex: 1,
              width: "auto",
            }}
          />
          <span style={{
            color: currentLength === 10 ? C.gold : C.muted,
            fontSize: 12, fontWeight: 600, marginLeft: 6, whiteSpace: "nowrap",
          }}>
            {currentLength}/10
          </span>
        </div>
        {currentLength > 0 && currentLength < 10 && (
          <p style={{ color: C.red, fontSize: 12, margin: "4px 0 0 4px" }}>
            Phone number must be 10 digits
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {multiline ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          style={{ ...baseStyle, resize: "vertical", minHeight: 96 }}
        />
      ) : (
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          type={type || "text"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseStyle}
        />
      )}
      {showCount && maxLength && (
        <p style={{
          color: isAtLimit ? C.red : isNearLimit ? C.orange : C.muted,
          fontSize: 12, textAlign: "right",
          margin: "4px 2px 0",
        }}>
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: 10, marginBottom: 18, marginTop: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        backgroundColor: "rgba(201,162,39,0.12)",
        border: `1px solid ${C.borderGold}`,
        display: "flex", alignItems: "center",
        justifyContent: "center", color: C.gold,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        color: C.gold, fontSize: 12,
        fontWeight: 700, letterSpacing: 2,
        textTransform: "uppercase",
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </div>
  );
}

// ─── Slot chip ────────────────────────────────────────────────────────────────
function SlotChip({ slot, isActive, isDisabled, onClick }) {
  const icons = { lunch: <RestaurantIcon size={15} />, dinner: <MoonIcon size={15} /> };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8,
        padding: "12px 16px", borderRadius: 12,
        backgroundColor: isActive ? C.gold : C.inputBg,
        border: `1px solid ${isActive ? C.gold : C.border}`,
        color: isActive ? "#000" : C.muted,
        fontWeight: 700, fontSize: 14,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.35 : 1,
        transition: "all .15s",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icons[slot]}
        <span style={{ textTransform: "capitalize" }}>{slot}</span>
      </div>
      {isDisabled && (
        <span style={{ fontSize: 11, color: C.red, marginTop: 2 }}>
          Already Booked
        </span>
      )}
    </button>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ status, isActive, isDisabled, onClick }) {
  const META = {
    booked:   { icon: <CheckCircleIcon size={15} />, color: "#5DBE8A", label: "Booked" },
    in_talks: { icon: <ChatIcon size={15} />,        color: C.gold,    label: "In Talks" },
  };
  const meta = META[status];

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8,
        padding: "12px 16px", borderRadius: 12,
        backgroundColor: isActive
          ? status === "booked"
            ? "rgba(93,190,138,0.15)"
            : "rgba(201,162,39,0.15)"
          : C.inputBg,
        border: `1px solid ${isActive ? meta.color : C.border}`,
        color: isActive ? meta.color : C.muted,
        fontWeight: 700, fontSize: 14,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.35 : 1,
        transition: "all .15s",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {meta.icon}
        <span>{meta.label}</span>
      </div>
      {isDisabled && (
        <span style={{ fontSize: 11, color: C.red, marginTop: 2 }}>
          Slot Confirmed
        </span>
      )}
    </button>
  );
}

// ─── Main EventFormScreen ─────────────────────────────────────────────────────
export default function EventFormScreen() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const permissions  = useAuthStore((s) => s.permissions) || [];

  // ── Parse query params ────────────────────────────────────────────────────
  const mode            = searchParams.get("mode") || "create";
  const date            = searchParams.get("date") || "";
  const locationId      = searchParams.get("locationId") || "";
  const isEdit          = mode === "edit";

  // For edit — event data comes as JSON in query (or fetch by eventId)
  let event            = null;
  let halls            = [];
  let bookedSlots      = [];
  let bookedHallSlots  = [];
  let preselectedHall  = null;

  try {
    const raw = searchParams.get("eventData");
    if (raw) event = JSON.parse(decodeURIComponent(raw));
  } catch {}
  try {
    const raw = searchParams.get("halls");
    if (raw) halls = JSON.parse(decodeURIComponent(raw));
  } catch {}
  try {
    const raw = searchParams.get("bookedSlots");
    if (raw) bookedSlots = JSON.parse(decodeURIComponent(raw));
  } catch {}
  try {
    const raw = searchParams.get("bookedHallSlots");
    if (raw) bookedHallSlots = JSON.parse(decodeURIComponent(raw));
  } catch {}
  preselectedHall = searchParams.get("preselectedHall") || null;

  // ── Permission guard ───────────────────────────────────────────────────────
  const requiredPermission = isEdit
    ? ACTION_PERMISSIONS.event.edit
    : ACTION_PERMISSIONS.event.create;

  if (!can(permissions, requiredPermission)) {
    return <Unauthorized router={router} />;
  }

  // ── Default slot ───────────────────────────────────────────────────────────
  const defaultSlot = (() => {
    if (event?.eventSlot) return event.eventSlot;
    if (!bookedSlots.includes("lunch"))  return "lunch";
    if (!bookedSlots.includes("dinner")) return "dinner";
    return "lunch";
  })();

  // ── Default status ─────────────────────────────────────────────────────────
  const defaultStatus = (() => {
    if (event?.status) return event.status;
    if (
      preselectedHall &&
      bookedHallSlots.some(
        (b) => b.hallName === preselectedHall && b.eventSlot === defaultSlot
      )
    ) return "in_talks";
    return "booked";
  })();

  return (
    <EventFormInner
      router={router}
      isEdit={isEdit}
      event={event}
      date={date}
      locationId={locationId}
      halls={halls}
      bookedSlots={bookedSlots}
      bookedHallSlots={bookedHallSlots}
      preselectedHall={preselectedHall}
      defaultSlot={defaultSlot}
      defaultStatus={defaultStatus}
    />
  );
}

// ─── Inner form (stateful) ────────────────────────────────────────────────────
function EventFormInner({
  router, isEdit, event, date, locationId,
  halls, bookedSlots, bookedHallSlots,
  preselectedHall, defaultSlot, defaultStatus,
}) {
  const [form, setForm] = useState({
    title:        event?.title        || "",
    clientName:   event?.clientName   || "",
    clientContact: event?.clientContact || "",
    notes:        event?.notes        || "",
    eventSlot:    defaultSlot,
    status:       event?.status       || defaultStatus,
    hallName:     event?.hallName     || preselectedHall || "",
  });

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isSlotBookedForHall = (slot) => {
    if (!form.hallName) return false;
    return bookedHallSlots.some(
      (b) => b.hallName === form.hallName && b.eventSlot === slot
    );
  };

  const isHallBookedForSlot = (hallName) =>
    bookedHallSlots.some(
      (b) => b.hallName === hallName && b.eventSlot === form.eventSlot
    );

  const slotBookedForSelectedHall = isSlotBookedForHall(form.eventSlot);

  const update = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "hallName" || key === "eventSlot") {
        const targetHall = key === "hallName" ? value : prev.hallName;
        const targetSlot = key === "eventSlot" ? value : prev.eventSlot;
        const nowBooked  = bookedHallSlots.some(
          (b) => b.hallName === targetHall && b.eventSlot === targetSlot
        );
        if (nowBooked && next.status === "booked") next.status = "in_talks";
      }
      return next;
    });
  };

  // ── Validation + submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Event title is required.");
      return;
    }
    if (form.title.trim().length < 3) {
      setError("Event title must be at least 3 characters.");
      return;
    }
    if (!form.clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (form.clientName.trim().length < 2) {
      setError("Client name must be at least 2 characters.");
      return;
    }
    if (form.clientContact && form.clientContact.length !== 10) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title:         form.title,
        clientName:    form.clientName,
        clientContact: form.clientContact,
        notes:         form.notes,
        eventSlot:     form.eventSlot,
        status:        form.status,
        hallName:      form.hallName || null,
        date,
        location:      { id: locationId },
      };
      if (isEdit) await updateEvent(event.id, payload);
      else        await createEvent(payload);
      router.push("/events/calendar?locationId=" + locationId);
    } catch (e) {
      setError(e?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "";

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }

        .ef-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 16px 48px;
        }

        .ef-card {
          width: 100%;
          max-width: 780px;
          background-color: ${C.surface};
          border-radius: 24px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(201,162,39,0.06),
            0 24px 80px rgba(0,0,0,0.6);
          animation: fadeIn .35s ease forwards;
        }

        .ef-header {
          padding: 20px 28px 18px;
          border-bottom: 1px solid ${C.border};
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ef-body {
          padding: 28px;
          overflow-y: auto;
          max-height: calc(100vh - 160px);
        }

        .ef-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .ef-chips-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
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
          white-space: nowrap;
        }
        .back-btn:hover { filter: brightness(1.2); }

        .hall-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-width: 1px;
          border-style: solid;
          transition: all .15s;
          white-space: nowrap;
          background: none;
        }
        .hall-chip:hover:not(:disabled) { filter: brightness(1.1); }
        .hall-chip:disabled { cursor: not-allowed; opacity: 0.4; }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          padding: 14px;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter .15s, transform .1s;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { cursor: not-allowed; }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25);
          border-radius: 4px;
        }

        @media (max-width: 640px) {
          .ef-outer  { padding: 12px 10px 32px; }
          .ef-body   { padding: 16px; max-height: none; }
          .ef-header { padding: 14px 16px; }
          .ef-grid-2 { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>

      <div className="ef-outer">
        <div className="ef-card">

          {/* ── HEADER ── */}
          <div className="ef-header">
            <button
              className="back-btn"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon size={16} />
              Back
            </button>

            <div style={{ flex: 1 }}>
              <p style={{
                color: C.gold, fontSize: 10, fontWeight: 700,
                letterSpacing: "3px", textTransform: "uppercase",
                margin: "0 0 2px",
              }}>
                {isEdit ? "Editing Event" : "New Booking"}
              </p>
              <h1 style={{
                color: C.white, fontSize: 24,
                fontWeight: 800, letterSpacing: "-0.3px",
                margin: "0 0 4px", lineHeight: 1,
              }}>
                {isEdit ? "Edit Event" : "Add Event"}
              </h1>
              {dateLabel && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ color: C.muted, display: "flex" }}>
                    <CalendarIcon size={13} />
                  </span>
                  <span style={{ color: C.muted, fontSize: 13 }}>
                    {dateLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="ef-body">

            {/* Error banner */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                backgroundColor: "rgba(229,115,115,0.1)",
                border: "1px solid rgba(229,115,115,0.4)",
                borderRadius: 10, padding: "10px 14px",
                marginBottom: 20,
              }}>
                <span style={{ color: C.red, display: "flex" }}>
                  <WarningIcon size={15} />
                </span>
                <span style={{ color: C.red, fontSize: 13 }}>{error}</span>
              </div>
            )}

            {/* ── EVENT DETAILS ── */}
            <SectionHeader
              title="Event Details"
              icon={<CalendarIcon size={14} />}
            />

            <FieldLabel
              icon={<RibbonIcon size={14} />}
              label="Event Title"
              hint="Give this event a clear, descriptive name"
            />
            <StyledInput
              value={form.title}
              onChange={(v) => update("title", v)}
              placeholder="e.g. Wedding Reception – Sharma Family"
              maxLength={LIMITS.title}
              showCount
            />

            <FieldLabel
              icon={<DocumentIcon size={14} />}
              label="Notes"
              hint="Additional details, special requirements, etc."
              optional
            />
            <StyledInput
              value={form.notes}
              onChange={(v) => update("notes", v)}
              placeholder="Any special requirements, menu preferences…"
              multiline
              maxLength={LIMITS.notes}
              showCount
            />

            {/* ── CLIENT INFO ── */}
            <SectionHeader
              title="Client Information"
              icon={<PersonIcon size={14} />}
            />

            <div className="ef-grid-2">
              <div>
                <FieldLabel
                  icon={<PersonCircleIcon size={14} />}
                  label="Client Name"
                  hint="Full name of the primary contact"
                />
                <StyledInput
                  value={form.clientName}
                  onChange={(v) => update("clientName", v)}
                  placeholder="e.g. Rahul Sharma"
                  maxLength={LIMITS.clientName}
                  showCount
                />
              </div>
              <div>
                <FieldLabel
                  icon={<PhoneIcon size={14} />}
                  label="Contact Number"
                  hint="10-digit mobile number"
                  optional
                />
                <StyledInput
                  value={form.clientContact}
                  onChange={(v) => update("clientContact", v)}
                  placeholder="e.g. 9876543210"
                  isPhone
                />
              </div>
            </div>

            {/* ── BOOKING OPTIONS ── */}
            <SectionHeader
              title="Booking Options"
              icon={<OptionsIcon size={14} />}
            />

            {/* Slot picker */}
            <FieldLabel
              icon={<TimeIcon size={14} />}
              label="Event Slot"
              hint="Select lunch or dinner time slot"
            />
            <div className="ef-chips-row">
              {["lunch", "dinner"].map((slot) => {
                const globallyBooked =
                  bookedSlots.includes(slot) && (!isEdit || form.eventSlot !== slot);
                return (
                  <SlotChip
                    key={slot}
                    slot={slot}
                    isActive={form.eventSlot === slot}
                    isDisabled={globallyBooked}
                    onClick={() => update("eventSlot", slot)}
                  />
                );
              })}
            </div>

            {/* Status picker */}
            <FieldLabel
              icon={<FlagIcon size={14} />}
              label="Booking Status"
              hint="Booked = confirmed; In Talks = tentative"
            />

            {/* Warning: slot already booked for selected hall */}
            {slotBookedForSelectedHall && !isEdit && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                backgroundColor: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.4)",
                borderRadius: 10, padding: "10px 14px",
                marginBottom: 12,
              }}>
                <span style={{ color: C.orange, display: "flex", marginTop: 1 }}>
                  <WarningIcon size={14} />
                </span>
                <p style={{
                  color: C.orange, fontSize: 13,
                  margin: 0, lineHeight: 1.6, flex: 1,
                }}>
                  This slot is already confirmed for{" "}
                  <strong>{form.hallName}</strong>.{" "}
                  Only <em>In Talks</em> is allowed.
                </p>
              </div>
            )}

            <div className="ef-chips-row">
              {["booked", "in_talks"].map((s) => {
                const isDisabled =
                  s === "booked" && slotBookedForSelectedHall && !isEdit;
                return (
                  <StatusChip
                    key={s}
                    status={s}
                    isActive={form.status === s}
                    isDisabled={isDisabled}
                    onClick={() => update("status", s)}
                  />
                );
              })}
            </div>

            {/* Hall picker */}
            {halls.length > 0 && (
              <>
                <FieldLabel
                  icon={<BusinessIcon size={14} />}
                  label="Hall"
                  hint="Select a specific hall (optional)"
                  optional
                />
                <div style={{
                  display: "flex", flexWrap: "wrap",
                  gap: 8, marginBottom: 20,
                }}>
                  {/* None chip */}
                  <button
                    className="hall-chip"
                    onClick={() => update("hallName", "")}
                    style={{
                      backgroundColor: !form.hallName ? C.gold : C.inputBg,
                      borderColor:     !form.hallName ? C.gold : C.border,
                      color:           !form.hallName ? "#000" : C.muted,
                      fontWeight:      !form.hallName ? 700   : 500,
                    }}
                  >
                    None
                  </button>

                  {halls.map((hall) => {
                    const hallName   = hall.name ?? hall;
                    const isActive   = form.hallName === hallName;
                    const isBooked   = isHallBookedForSlot(hallName);
                    const isDisabled = isBooked && !isActive;

                    return (
                      <button
                        key={hall.id ?? hallName}
                        className="hall-chip"
                        disabled={isDisabled}
                        onClick={() => update("hallName", hallName)}
                        style={{
                          backgroundColor: isActive
                            ? C.gold
                            : C.inputBg,
                          borderColor: isActive
                            ? C.gold
                            : isBooked
                              ? "rgba(229,115,115,0.4)"
                              : C.border,
                          color: isActive
                            ? "#000"
                            : isBooked
                              ? C.red
                              : C.muted,
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {isActive && <CheckIcon size={13} />}
                        {isBooked && !isActive && (
                          <LockIcon size={12} />
                        )}
                        <span>{hallName}</span>
                        {isBooked && !isActive && (
                          <span style={{
                            fontSize: 11, color: C.red,
                            marginLeft: 2,
                          }}>
                            · Booked
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Divider */}
            <div style={{
              height: 1,
              backgroundColor: C.border,
              margin: "4px 0 20px",
            }} />

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: loading ? C.faint : C.gold,
                color: loading ? C.muted : "#000",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <Spinner size={18} color="#000" />
                : isEdit
                  ? <UploadIcon size={18} />
                  : <PlusCircleIcon size={18} />
              }
              {loading
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Event"
              }
            </button>

          </div>{/* /ef-body */}
        </div>{/* /ef-card */}
      </div>{/* /ef-outer */}
    </>
  );
}