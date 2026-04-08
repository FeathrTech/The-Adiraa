// src/components/sites/EditVenueScreen.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { fetchSiteById, updateSite } from "../../api/siteApi";
import { fetchHalls, createHall, updateHall, deleteHall } from "../../api/hallApi";

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
  green: "#5DBE8A",
  greenDim: "rgba(93,190,138,0.1)",
  greenBorder: "rgba(93,190,138,0.35)",
};

// ─── Limits ───────────────────────────────────────────────────────────────────
const LIMITS = {
  latitude:     { max: 12 },
  longitude:    { max: 13 },
  radius:       { max: 5, cap: 99999 },
  moreInfo:     { max: 500 },
  hallName:     { min: 2, max: 100 },
  hallDesc:     { max: 300 },
  hallCapacity: { max: 6, cap: 999999 },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function BuildingIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" /><path d="M3 9h18" /><path d="M3 15h18" />
    </svg>
  );
}
function LocationIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function NavigateIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
function CompassIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
function InfoIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function CrosshairIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}
function RadioIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49" />
    </svg>
  );
}
function DocumentIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function GridIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function AddIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function AddCircleIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function PencilIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function PeopleIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function CloudUploadIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
function LockIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
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
function StorefrontIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function Spinner({ size = 18, color = "#000" }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "ev-spin .8s linear infinite" }}>
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
  const bg = type === "error" ? "rgba(229,115,115,0.15)" : "rgba(93,190,138,0.15)";
  const border = type === "error" ? "rgba(229,115,115,0.4)" : "rgba(93,190,138,0.4)";
  const color = type === "error" ? C.red : C.green;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: bg, border: `1px solid ${border}`,
      borderRadius: 12, padding: "12px 20px",
      color, fontWeight: 600, fontSize: 13,
      zIndex: 9999, whiteSpace: "nowrap",
      animation: "ev-fadeIn .25s ease",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      {message}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9000,
    }}>
      <div style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.borderGold}`,
        borderRadius: 20, padding: "28px 28px 22px",
        width: "90%", maxWidth: 380,
        animation: "ev-fadeIn .2s ease",
      }}>
        <p style={{ color: C.white, fontSize: 15, fontWeight: 600, margin: "0 0 20px", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            backgroundColor: C.faint, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "9px 18px",
            color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            backgroundColor: "rgba(229,115,115,0.15)",
            border: "1px solid rgba(229,115,115,0.4)",
            borderRadius: 10, padding: "9px 18px",
            color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 18, marginTop: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        backgroundColor: "rgba(201,162,39,0.12)",
        border: `1px solid ${C.borderGold}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        color: C.gold, fontSize: 11, fontWeight: 700,
        letterSpacing: 3, textTransform: "uppercase", whiteSpace: "nowrap",
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ flexShrink: 0 }}>{icon}</div>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
          {label}
        </span>
      </div>
      {hint && (
        <div style={{ color: C.muted, fontSize: 11, marginTop: 2, marginLeft: 22 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChange, placeholder, multiline = false,
  type = "text", maxLength, showCount = false,
  disabled = false, id,
}) {
  const [focused, setFocused] = useState(false);
  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength >= Math.floor(maxLength * 0.85);
  const isAtLimit   = maxLength && currentLength >= maxLength;

  const borderColor = !disabled
    ? focused
      ? isAtLimit ? C.red : C.gold
      : isAtLimit ? "rgba(229,115,115,0.5)" : C.border
    : C.border;

  const handleChange = (e) => {
    const val = e.target.value;
    if (maxLength && val.length > maxLength) return;
    onChange(val);
  };

  const counterColor = isAtLimit ? C.red : isNearLimit ? C.orange : C.muted;

  const shared = {
    width: "100%", boxSizing: "border-box",
    backgroundColor: disabled ? C.faint : C.inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 10, padding: "10px 13px",
    color: disabled ? C.muted : C.white,
    fontSize: 13, outline: "none",
    transition: "border-color .15s",
    fontFamily: "inherit", resize: "none",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {multiline ? (
        <textarea id={id} value={value} onChange={handleChange}
          placeholder={placeholder} maxLength={maxLength}
          disabled={disabled} rows={4}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...shared, minHeight: 100 }}
        />
      ) : (
        <input id={id} type={type} value={value} onChange={handleChange}
          placeholder={placeholder} maxLength={maxLength}
          disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={shared}
        />
      )}
      {showCount && maxLength && !disabled && (
        <div style={{ color: counterColor, fontSize: 11, textAlign: "right", marginTop: 4 }}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
}

// ─── Hall Card ────────────────────────────────────────────────────────────────
function HallCard({ hall, onEdit, onDelete }) {
  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 16,
      border: `1px solid ${C.borderGold}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            backgroundColor: "rgba(201,162,39,0.12)",
            border: `1px solid ${C.borderGold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 2,
          }}>
            <BuildingIcon size={17} color={C.gold} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: C.white, fontWeight: 700, fontSize: 14,
              marginBottom: 3, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {hall.name}
            </div>
            {hall.description && (
              <div style={{
                color: C.muted, fontSize: 12, marginBottom: 4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
        </div>
        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => onEdit(hall)} className="ev-hall-edit-btn">
            <PencilIcon size={13} color={C.gold} />
            <span>Edit</span>
          </button>
          <button onClick={() => onDelete(hall.id)} className="ev-hall-del-btn">
            <TrashIcon size={13} color={C.red} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hall Modal ───────────────────────────────────────────────────────────────
function HallModal({
  visible, onClose, onSave, editingHallId,
  hallName, setHallName,
  hallDesc, setHallDesc,
  hallCapacity, setHallCapacity,
  saving,
}) {
  const overlayRef = useRef(null);
  if (!visible) return null;

  const hallNameLen      = hallName ? hallName.length : 0;
  const hallDescLen      = hallDesc ? hallDesc.length : 0;
  const hallNameNearLim  = hallNameLen >= Math.floor(LIMITS.hallName.max * 0.85);
  const hallNameAtLim    = hallNameLen >= LIMITS.hallName.max;
  const hallDescNearLim  = hallDescLen >= Math.floor(LIMITS.hallDesc.max * 0.85);
  const hallDescAtLim    = hallDescLen >= LIMITS.hallDesc.max;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 8000, padding: "20px",
      }}
    >
      <div style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.borderGold}`,
        borderRadius: 24, padding: "24px 24px 20px",
        width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        animation: "ev-fadeIn .22s ease",
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              backgroundColor: "rgba(201,162,39,0.12)",
              border: `1px solid ${C.borderGold}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {editingHallId
                ? <PencilIcon size={15} color={C.gold} />
                : <AddIcon size={15} color={C.gold} />}
            </div>
            <div>
              <div style={{
                color: C.gold, fontSize: 10, fontWeight: 700,
                letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 2,
              }}>
                Hall Management
              </div>
              <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>
                {editingHallId ? "Edit Hall" : "Add Hall"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: "50%",
            backgroundColor: C.faint, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.muted,
          }}>
            <CloseIcon size={16} color={C.muted} />
          </button>
        </div>

        {/* Hall Name */}
        <FieldLabel
          icon={<StorefrontIcon size={14} color={C.gold} />}
          label="Hall Name"
          hint={`2–${LIMITS.hallName.max} characters`}
        />
        <div style={{ marginBottom: 16 }}>
          <input
            value={hallName}
            onChange={(e) => {
              if (e.target.value.length <= LIMITS.hallName.max) setHallName(e.target.value);
            }}
            placeholder="e.g. Crystal Ballroom"
            maxLength={LIMITS.hallName.max}
            style={{
              width: "100%", boxSizing: "border-box",
              backgroundColor: C.inputBg,
              border: `1px solid ${hallNameAtLim ? "rgba(229,115,115,0.5)" : C.border}`,
              borderRadius: 10, padding: "10px 13px",
              color: C.white, fontSize: 13,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <div style={{
            color: hallNameAtLim ? C.red : hallNameNearLim ? C.orange : C.muted,
            fontSize: 11, textAlign: "right", marginTop: 4,
          }}>
            {hallNameLen}/{LIMITS.hallName.max}
          </div>
          {hallName.length > 0 && hallName.trim().length < LIMITS.hallName.min && (
            <div style={{ color: C.red, fontSize: 11, marginTop: 2 }}>
              Hall name must be at least {LIMITS.hallName.min} characters.
            </div>
          )}
        </div>

        {/* Hall Description */}
        <FieldLabel
          icon={<DocumentIcon size={14} color={C.gold} />}
          label="Description"
          hint="Features, amenities, or access notes"
        />
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={hallDesc}
            onChange={(e) => {
              if (e.target.value.length <= LIMITS.hallDesc.max) setHallDesc(e.target.value);
            }}
            placeholder="e.g. Air-conditioned, stage included, ground floor access"
            maxLength={LIMITS.hallDesc.max}
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              backgroundColor: C.inputBg,
              border: `1px solid ${hallDescAtLim ? "rgba(229,115,115,0.5)" : C.border}`,
              borderRadius: 10, padding: "10px 13px",
              color: C.white, fontSize: 13, resize: "none",
              outline: "none", fontFamily: "inherit", minHeight: 90,
            }}
          />
          <div style={{
            color: hallDescAtLim ? C.red : hallDescNearLim ? C.orange : C.muted,
            fontSize: 11, textAlign: "right", marginTop: 4,
          }}>
            {hallDescLen}/{LIMITS.hallDesc.max}
          </div>
        </div>

        {/* Hall Capacity */}
        <FieldLabel
          icon={<PeopleIcon size={14} color={C.gold} />}
          label="Capacity"
          hint={`Max guests (up to ${LIMITS.hallCapacity.cap.toLocaleString()})`}
        />
        <div style={{ marginBottom: 20 }}>
          <input
            type="number"
            value={hallCapacity}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, "");
              if (cleaned === "") { setHallCapacity(""); return; }
              const num = parseInt(cleaned, 10);
              setHallCapacity(num > LIMITS.hallCapacity.cap
                ? String(LIMITS.hallCapacity.cap) : cleaned);
            }}
            placeholder="e.g. 250"
            maxLength={LIMITS.hallCapacity.max}
            style={{
              width: "100%", boxSizing: "border-box",
              backgroundColor: C.inputBg,
              border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 13px",
              color: C.white, fontSize: 13,
              outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            width: "100%",
            backgroundColor: saving ? C.faint : C.gold,
            border: "none", borderRadius: 14,
            padding: "13px 0",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            color: saving ? C.muted : "#000",
            fontWeight: 800, fontSize: 13,
            textTransform: "uppercase", letterSpacing: 0.3,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            transition: "filter .15s",
          }}
        >
          {saving
            ? <><Spinner size={16} color={C.muted} /><span>Saving…</span></>
            : <>{editingHallId
                ? <><CloudUploadIcon size={16} color="#000" /><span>Update Hall</span></>
                : <><CheckCircleIcon size={16} color="#000" /><span>Create Hall</span></>
              }</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditVenueScreen() {
  const router = useRouter();
  const params = useParams();
  const siteId = params?.siteId || params?.id;

  const permissions = useAuthStore((s) => s.permissions) || [];
  const canEdit = permissions.includes("site.edit");

  const [site,            setSite]            = useState(null);
  const [halls,           setHalls]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [savingHall,      setSavingHall]      = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [latitude,       setLatitude]       = useState("");
  const [longitude,      setLongitude]      = useState("");
  const [allowedRadius,  setAllowedRadius]  = useState("100");
  const [moreInfo,       setMoreInfo]       = useState("");

  const [modalVisible,  setModalVisible]  = useState(false);
  const [hallName,      setHallName]      = useState("");
  const [hallDesc,      setHallDesc]      = useState("");
  const [hallCapacity,  setHallCapacity]  = useState("");
  const [editingHallId, setEditingHallId] = useState(null);

  const [toast,       setToast]       = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null); // hallId to delete
  const [errors,      setErrors]      = useState({});

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    if (!siteId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [venue, hallData] = await Promise.all([
          fetchSiteById(siteId),
          fetchHalls(siteId).catch(() => []),
        ]);
        setSite(venue);
        setHalls(hallData);
        setLatitude(venue.latitude?.toString() || "");
        setLongitude(venue.longitude?.toString() || "");
        setAllowedRadius(venue.allowedRadius?.toString() || "100");
        setMoreInfo(venue.address || "");
      } catch (err) {
        showToast("Failed to load venue", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [siteId]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported by your browser", "error"); return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
        setLoadingLocation(false);
        showToast("Location updated successfully");
      },
      () => {
        setLoadingLocation(false);
        showToast("Failed to fetch location. Allow location access.", "error");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    const e = {};
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (latitude && (isNaN(lat) || lat < -90 || lat > 90))
      e.latitude = "Latitude must be between -90 and 90.";
    if (longitude && (isNaN(lng) || lng < -180 || lng > 180))
      e.longitude = "Longitude must be between -180 and 180.";
    const radius = Number(allowedRadius);
    if (allowedRadius && (isNaN(radius) || radius < 0 || radius > LIMITS.radius.cap))
      e.radius = `Radius must be between 0 and ${LIMITS.radius.cap.toLocaleString()} meters.`;
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setSaving(true);
      const updated = await updateSite(siteId, {
        latitude, longitude,
        allowedRadius: radius || 100,
        address: moreInfo,
      });
      setSite(updated);
      showToast("Venue updated successfully");
    } catch {
      showToast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHall = async () => {
    if (!hallName.trim()) { showToast("Hall name is required", "error"); return; }
    if (hallName.trim().length < LIMITS.hallName.min) {
      showToast(`Hall name must be at least ${LIMITS.hallName.min} characters`, "error"); return;
    }
    try {
      setSavingHall(true);
      if (editingHallId) {
        const updated = await updateHall(siteId, editingHallId, {
          name: hallName.trim(), description: hallDesc,
          capacity: Number(hallCapacity),
        });
        setHalls(halls.map(h => h.id === editingHallId ? updated : h));
        showToast("Hall updated successfully");
      } else {
        const newHall = await createHall(siteId, {
          name: hallName.trim(), description: hallDesc,
          capacity: Number(hallCapacity),
        });
        setHalls([...halls, newHall]);
        showToast("Hall created successfully");
      }
      closeModal();
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSavingHall(false);
    }
  };

  const handleDeleteHall = async (id) => {
    try {
      await deleteHall(siteId, id);
      setHalls(halls.filter(h => h.id !== id));
      showToast("Hall deleted");
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setConfirmDel(null);
    }
  };

  const openEditHall = (hall) => {
    setEditingHallId(hall.id);
    setHallName(hall.name);
    setHallDesc(hall.description || "");
    setHallCapacity(hall.capacity?.toString() || "");
    setModalVisible(true);
  };

  const openAddHall = () => {
    setEditingHallId(null);
    setHallName(""); setHallDesc(""); setHallCapacity("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingHallId(null);
    setHallName(""); setHallDesc(""); setHallCapacity("");
  };

  const hasLocation = !!(latitude && longitude);
  const moreInfoLen = moreInfo ? moreInfo.length : 0;
  const moreInfoNearLim = moreInfoLen >= Math.floor(LIMITS.moreInfo.max * 0.85);
  const moreInfoAtLim   = moreInfoLen >= LIMITS.moreInfo.max;

  // ── No permission ──────────────────────────────────────────────────────────
  if (!canEdit) {
    return (
      <>
        <style>{`*, *::before, *::after { box-sizing: border-box; }  `}</style>
        <div style={{
          minHeight: "100vh", backgroundColor: C.bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <div style={{ color: C.faint }}><LockIcon size={48} /></div>
          <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>No Permission</p>
        </div>
      </>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !site) {
    return (
      <>
        <style>{`
          @keyframes ev-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          *, *::before, *::after { box-sizing: border-box; }  
        `}</style>
        <div style={{
          minHeight: "100vh", backgroundColor: C.bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <Spinner size={34} color={C.gold} />
          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase" }}>
            Loading Venue
          </span>
        </div>
      </>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes ev-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ev-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        *, *::before, *::after { box-sizing: border-box; }
         

        .ev-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 20px 60px;
        }
        .ev-surface {
          width: 100%;
          max-width: 820px;
          background-color: ${C.surface};
          border-radius: 28px;
          border: 1px solid ${C.borderGold};
          padding: 24px 20px;
          animation: ev-fadeIn .35s ease forwards;
        }
        @media (min-width: 480px) {
          .ev-surface { padding: 28px 26px; }
          .ev-outer   { padding: 28px 24px 60px; }
        }
        @media (min-width: 768px) {
          .ev-surface { padding: 34px 36px; }
          .ev-outer   { padding: 36px 32px 60px; }
        }

        /* ── Header ── */
        .ev-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 26px;
          flex-wrap: wrap;
        }
        .ev-header-mid {
          flex: 1;
          min-width: 0;
        }
        .ev-back-btn {
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
        .ev-back-btn:hover { filter: brightness(1.2); }
        .ev-back-label { display: none; }
        @media (min-width: 480px) { .ev-back-label { display: inline; } }

        .ev-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 3px;
        }
        @media (min-width: 480px) { .ev-eyebrow { font-size: 11px; } }

        .ev-title {
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
        @media (min-width: 480px) { .ev-title { font-size: 24px; } }
        @media (min-width: 768px) { .ev-title { font-size: 28px; } }

        .ev-add-btn {
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
        .ev-add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        .ev-add-label { display: none; }
        @media (min-width: 480px) { .ev-add-label { display: inline; } }

        /* ── Coord row ── */
        .ev-coord-row {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        @media (min-width: 480px) {
          .ev-coord-row { flex-direction: row; gap: 16px; }
          .ev-coord-row > * { flex: 1; }
        }

        /* ── Auto fetch btn ── */
        .ev-fetch-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background-color: ${C.card};
          border: 1px solid ${C.borderGold};
          border-radius: 12px;
          padding: 12px 18px;
          color: ${C.gold};
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: filter .15s, transform .1s;
          margin-bottom: 26px;
        }
        .ev-fetch-btn:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
        .ev-fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Save config btn ── */
        .ev-save-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background-color: ${C.gold};
          border: none;
          border-radius: 14px;
          padding: 14px 0;
          color: #000;
          font-weight: 800;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: filter .15s, transform .1s, box-shadow .15s;
          margin-bottom: 28px;
        }
        .ev-save-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(201,162,39,0.3);
        }
        .ev-save-btn:disabled { opacity: 0.65; cursor: not-allowed; background-color: ${C.faint}; }

        /* ── Halls grid ── */
        .ev-halls-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 8px;
        }
        @media (min-width: 640px) {
          .ev-halls-grid { grid-template-columns: 1fr 1fr; }
        }

        /* ── Hall action btns ── */
        .ev-hall-edit-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: rgba(201,162,39,0.12);
          border: 1px solid ${C.borderGold};
          border-radius: 8px;
          padding: 6px 12px;
          color: ${C.gold};
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .ev-hall-edit-btn:hover { filter: brightness(1.2); }

        .ev-hall-del-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: rgba(229,115,115,0.1);
          border: 1px solid rgba(229,115,115,0.35);
          border-radius: 8px;
          padding: 6px 12px;
          color: ${C.red};
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .ev-hall-del-btn:hover { filter: brightness(1.2); }

        /* ── Halls empty add btn ── */
        .ev-add-first-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: ${C.gold};
          border: none;
          border-radius: 12px;
          padding: 11px 22px;
          color: #000;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          margin-top: 10px;
          transition: filter .15s, transform .1s;
        }
        .ev-add-first-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* inputs / textareas */
        input, textarea { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: ${C.muted}; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        .ev-error { color: ${C.red}; font-size: 11.5px; margin-top: -10px; margin-bottom: 14px; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.25); border-radius: 4px; }
      `}</style>

      <div className="ev-outer">
        <div className="ev-surface">

          {/* ── Header ── */}
          <div className="ev-header">
            <button className="ev-back-btn" onClick={() => router.back()}>
              <ArrowLeftIcon size={15} />
              <span className="ev-back-label">Back</span>
            </button>
            <div className="ev-header-mid">
              <p className="ev-eyebrow">Venue Management</p>
              <h1 className="ev-title" title={site.name}>{site.name}</h1>
            </div>
            <button className="ev-add-btn" onClick={openAddHall}>
              <AddIcon size={15} color="#000" />
              <span className="ev-add-label">Add Hall</span>
            </button>
          </div>

          {/* ══ GPS LOCATION ══ */}
          <SectionHeader
            title="GPS Location"
            icon={<LocationIcon size={16} color={C.gold} />}
          />

          {/* Coord row */}
          <div className="ev-coord-row">
            <div>
              <FieldLabel
                icon={<NavigateIcon size={14} color={C.gold} />}
                label="Latitude"
                hint="e.g. 28.6139"
              />
              <StyledInput
                value={latitude} onChange={setLatitude}
                placeholder="28.6139" type="number"
                maxLength={LIMITS.latitude.max}
              />
              {errors.latitude && <div className="ev-error">{errors.latitude}</div>}
            </div>
            <div>
              <FieldLabel
                icon={<CompassIcon size={14} color={C.gold} />}
                label="Longitude"
                hint="e.g. 77.2090"
              />
              <StyledInput
                value={longitude} onChange={setLongitude}
                placeholder="77.2090" type="number"
                maxLength={LIMITS.longitude.max}
              />
              {errors.longitude && <div className="ev-error">{errors.longitude}</div>}
            </div>
          </div>

          {/* Location status card */}
          <div style={{
            backgroundColor: hasLocation ? C.greenDim : "rgba(201,162,39,0.08)",
            border: `1px solid ${hasLocation ? C.greenBorder : C.borderGold}`,
            borderRadius: 12, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14,
          }}>
            <div style={{ flexShrink: 0 }}>
              {hasLocation
                ? <CheckCircleIcon size={18} color={C.green} />
                : <InfoIcon size={18} color={C.gold} />}
            </div>
            <span style={{
              color: hasLocation ? C.green : C.gold,
              fontSize: 13, fontWeight: 600, flex: 1,
            }}>
              {hasLocation
                ? `Location: ${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
                : "No location set — fill in manually or use Auto Fetch below"}
            </span>
          </div>

          {/* Auto Fetch */}
          <button
            className="ev-fetch-btn"
            onClick={fetchLocation}
            disabled={loadingLocation}
          >
            {loadingLocation
              ? <Spinner size={16} color={C.gold} />
              : <CrosshairIcon size={16} color={C.gold} />}
            <span>{loadingLocation ? "Fetching…" : "Auto Fetch Live Location"}</span>
          </button>

          {/* ══ CONFIGURATION ══ */}
          <SectionHeader
            title="Configuration"
            icon={<RadioIcon size={16} color={C.gold} />}
          />

          <FieldLabel
            icon={<RadioIcon size={14} color={C.gold} />}
            label="Attendance Radius"
            hint={`Meters staff can check in from (max ${LIMITS.radius.cap.toLocaleString()}m)`}
          />
          <StyledInput
            value={allowedRadius}
            onChange={(val) => {
              const cleaned = val.replace(/[^0-9]/g, "");
              if (cleaned === "") { setAllowedRadius(""); return; }
              const num = parseInt(cleaned, 10);
              setAllowedRadius(num > LIMITS.radius.cap ? String(LIMITS.radius.cap) : cleaned);
            }}
            placeholder="100"
            type="number"
            maxLength={LIMITS.radius.max}
          />
          {errors.radius && <div className="ev-error">{errors.radius}</div>}

          <FieldLabel
            icon={<DocumentIcon size={14} color={C.gold} />}
            label="Additional Information"
            hint="Address, access notes, parking, or any relevant site details"
          />
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={moreInfo}
              onChange={(e) => {
                if (e.target.value.length <= LIMITS.moreInfo.max) setMoreInfo(e.target.value);
              }}
              placeholder="e.g. Main entrance on North side, parking available on Level B2..."
              maxLength={LIMITS.moreInfo.max}
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box",
                backgroundColor: C.inputBg,
                border: `1px solid ${moreInfoAtLim ? "rgba(229,115,115,0.5)" : C.border}`,
                borderRadius: 10, padding: "10px 13px",
                color: C.white, fontSize: 13, resize: "none",
                outline: "none", fontFamily: "inherit", minHeight: 100,
              }}
            />
            <div style={{
              color: moreInfoAtLim ? C.red : moreInfoNearLim ? C.orange : C.muted,
              fontSize: 11, textAlign: "right", marginTop: 4,
            }}>
              {moreInfoLen}/{LIMITS.moreInfo.max}
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && <div className="ev-error" style={{ fontSize: 13 }}>{errors.submit}</div>}

          {/* Save Config */}
          <button
            className="ev-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? <><Spinner size={16} color={C.muted} /><span style={{ color: C.muted }}>Saving…</span></>
              : <><CloudUploadIcon size={16} color="#000" /><span>Save Configuration</span></>}
          </button>

          {/* ══ HALLS ══ */}
          <SectionHeader
            title="Halls"
            icon={<GridIcon size={16} color={C.gold} />}
          />

          {halls.length === 0 ? (
            <div style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "32px 20px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 10,
              marginBottom: 8, textAlign: "center",
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                backgroundColor: C.faint, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 4,
              }}>
                <GridIcon size={30} color={C.muted} />
              </div>
              <p style={{ color: C.white, fontWeight: 700, fontSize: 16, margin: 0 }}>
                No Halls Added
              </p>
              <p style={{ color: C.muted, fontSize: 13, margin: 0, maxWidth: 320 }}>
                Add halls to this venue so events can be assigned to a specific space.
              </p>
              <button className="ev-add-first-btn" onClick={openAddHall}>
                <AddCircleIcon size={16} color="#000" />
                Add First Hall
              </button>
            </div>
          ) : (
            <div className="ev-halls-grid">
              {halls.map((hall) => (
                <HallCard
                  key={hall.id}
                  hall={hall}
                  onEdit={openEditHall}
                  onDelete={(id) => setConfirmDel(id)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Hall Modal ── */}
      <HallModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={handleSaveHall}
        editingHallId={editingHallId}
        hallName={hallName}      setHallName={setHallName}
        hallDesc={hallDesc}      setHallDesc={setHallDesc}
        hallCapacity={hallCapacity} setHallCapacity={setHallCapacity}
        saving={savingHall}
      />

      {/* ── Confirm Delete ── */}
      {confirmDel && (
        <ConfirmDialog
          message="Are you sure you want to delete this hall? This action cannot be undone."
          onConfirm={() => handleDeleteHall(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}

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