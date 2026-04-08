// src/components/sites/CreateSiteScreen.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { useSiteStore } from "../../store/siteStore";
import { createSite } from "../../api/siteApi";

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
};

// ─── Limits ───────────────────────────────────────────────────────────────────
const LIMITS = {
  name: { min: 2, max: 100 },
  description: { max: 500 },
  latitude: { max: 12 },
  longitude: { max: 13 },
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

function DocumentIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
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

function CompassIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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

function CheckCircleIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function InfoIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CrosshairIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
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

function Spinner({ size = 18, color = "#000" }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      style={{ animation: "cs-spin .8s linear infinite" }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
      marginTop: 8,
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        backgroundColor: "rgba(201,162,39,0.12)",
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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: C.white, fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
          {label}
        </div>
        {hint && (
          <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{hint}</div>
        )}
      </div>
    </div>
  );
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function StyledInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  maxLength,
  showCount = false,
  id,
}) {
  const [focused, setFocused] = useState(false);

  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength >= Math.floor(maxLength * 0.85);
  const isAtLimit = maxLength && currentLength >= maxLength;

  const borderColor = focused
    ? isAtLimit ? C.red : C.gold
    : isAtLimit
      ? "rgba(229,115,115,0.5)"
      : C.border;

  const handleChange = (e) => {
    const val = e.target.value;
    if (maxLength && val.length > maxLength) return;
    onChange(val);
  };

  const counterColor = isAtLimit ? C.red : isNearLimit ? C.orange : C.muted;

  const sharedStyle = {
    width: "100%",
    backgroundColor: C.inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    padding: "10px 13px",
    color: C.white,
    fontSize: 13,
    outline: "none",
    transition: "border-color .15s",
    fontFamily: "inherit",
    boxSizing: "border-box",
    resize: "none",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...sharedStyle, minHeight: 100 }}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={sharedStyle}
        />
      )}
      {showCount && maxLength && (
        <div style={{
          color: counterColor,
          fontSize: 11,
          textAlign: "right",
          marginTop: 4,
        }}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateSiteScreen() {
  const router = useRouter();
  const permissions = useAuthStore((s) => s.permissions) || [];
  const addSite = useSiteStore((s) => s.addSite);
  const canCreate = permissions.includes("site.create");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  const hasLocation = !!(latitude && longitude);

  // ── Fetch live location ────────────────────────────────────────────────────
  const fetchLocation = async () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
        setLoadingLocation(false);
      },
      () => {
        setLocationError("Failed to fetch location. Please allow location access.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // ── Validation & Save ──────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Banquet name is required.";
    else if (name.trim().length < LIMITS.name.min)
      e.name = `Name must be at least ${LIMITS.name.min} characters.`;

    if (!latitude || !longitude) {
      e.location = "Both latitude and longitude are required.";
    } else {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || lat < -90 || lat > 90)
        e.latitude = "Latitude must be between -90 and 90.";
      if (isNaN(lng) || lng < -180 || lng > 180)
        e.longitude = "Longitude must be between -180 and 180.";
    }
    return e;
  };

  const handleSave = async () => {
    if (saving) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setSaving(true);
      const savedSite = await createSite({
        name: name.trim(),
        address: description,
        latitude,
        longitude,
      });
      addSite(savedSite);
      router.back();
    } catch (error) {
      setErrors({ submit: error?.response?.data?.message || "Failed to create site." });
    } finally {
      setSaving(false);
    }
  };

  // ── No permission ──────────────────────────────────────────────────────────
  if (!canCreate) {
    return (
      <>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
           
        `}</style>
        <div style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ color: C.faint }}><LockIcon size={48} /></div>
          <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>No Permission</p>
        </div>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cs-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cs-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .cs-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 20px 48px;
        }

        .cs-surface {
          width: 100%;
          max-width: 720px;
          background-color: ${C.surface};
          border-radius: 28px;
          border: 1px solid ${C.borderGold};
          padding: 24px 20px;
          animation: cs-fadeIn .35s ease forwards;
        }

        @media (min-width: 480px) {
          .cs-surface { padding: 28px 26px; }
          .cs-outer { padding: 28px 24px 60px; }
        }

        @media (min-width: 768px) {
          .cs-surface { padding: 34px 36px; }
          .cs-outer { padding: 36px 32px 60px; }
        }

        /* Header */
        .cs-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${C.border};
          margin-bottom: 26px;
        }

        .cs-back-btn {
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
        .cs-back-btn:hover { filter: brightness(1.2); }

        .cs-back-label {
          display: none;
        }
        @media (min-width: 480px) {
          .cs-back-label { display: inline; }
        }

        .cs-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 3px;
        }

        .cs-title {
          color: ${C.white};
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.3px;
          margin: 0;
          line-height: 1;
        }

        @media (min-width: 480px) {
          .cs-title { font-size: 26px; }
        }

        /* Coord row */
        .cs-coord-row {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        @media (min-width: 480px) {
          .cs-coord-row {
            flex-direction: row;
            gap: 16px;
          }
          .cs-coord-row > * { flex: 1; }
        }

        /* Inputs */
        input, textarea {
          font-family: inherit;
        }
        input::placeholder, textarea::placeholder {
          color: ${C.muted};
        }

        /* Error text */
        .cs-error {
          color: ${C.red};
          font-size: 11.5px;
          margin-top: -10px;
          margin-bottom: 14px;
          margin-left: 2px;
        }

        /* Location status card */
        .cs-loc-card {
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10;
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 600;
          flex: 1;
        }

        /* Auto fetch btn */
        .cs-fetch-btn {
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
          margin-bottom: 28px;
        }
        .cs-fetch-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        .cs-fetch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Halls empty state */
        .cs-halls-empty {
          background-color: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          text-align: center;
        }

        /* Divider */
        .cs-divider {
          height: 1px;
          background-color: ${C.border};
          margin-bottom: 22px;
        }

        /* Create button */
        .cs-create-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background-color: ${C.gold};
          border: none;
          border-radius: 14px;
          padding: 14px 24px;
          color: #000;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter .15s, transform .1s, box-shadow .15s;
        }
        .cs-create-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(201,162,39,0.3);
        }
        .cs-create-btn:active:not(:disabled) { transform: translateY(0); }
        .cs-create-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background-color: ${C.faint};
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.25); border-radius: 4px; }
      `}</style>

      <div className="cs-outer">
        <div className="cs-surface">

          {/* ── Header ── */}
          <div className="cs-header">
            <button className="cs-back-btn" onClick={() => router.back()}>
              <ArrowLeftIcon size={15} />
              <span className="cs-back-label">Back</span>
            </button>
            <div>
              <p className="cs-eyebrow">Venue Management</p>
              <h1 className="cs-title">Create Site</h1>
            </div>
          </div>

          {/* ══ SITE INFORMATION ══ */}
          <SectionHeader
            title="Site Information"
            icon={<BuildingIcon size={16} color={C.gold} />}
          />

          {/* Name */}
          <FieldLabel
            icon={<BuildingIcon size={15} color={C.gold} />}
            label="Banquet Name"
            hint={`2–${LIMITS.name.max} characters`}
          />
          <StyledInput
            id="site-name"
            value={name}
            onChange={setName}
            placeholder="e.g. The Grand Pavilion, Rose Banquet Hall"
            maxLength={LIMITS.name.max}
            showCount
          />
          {name.length > 0 && name.trim().length < LIMITS.name.min && (
            <div className="cs-error">
              Name must be at least {LIMITS.name.min} characters.
            </div>
          )}
          {errors.name && <div className="cs-error">{errors.name}</div>}

          {/* Description */}
          <FieldLabel
            icon={<DocumentIcon size={15} color={C.gold} />}
            label="Description"
            hint="Address, facilities, or any notes about this site"
          />
          <StyledInput
            id="site-description"
            value={description}
            onChange={setDescription}
            placeholder="e.g. Located on 5th Avenue, capacity 500, includes outdoor garden area..."
            multiline
            maxLength={LIMITS.description.max}
            showCount
          />

          {/* ══ GPS LOCATION ══ */}
          <SectionHeader
            title="GPS Location"
            icon={<LocationIcon size={16} color={C.gold} />}
          />

          {/* Coord row */}
          <div className="cs-coord-row">
            <div>
              <FieldLabel
                icon={<NavigateIcon size={15} color={C.gold} />}
                label="Latitude"
                hint="e.g. 28.6139"
              />
              <StyledInput
                id="site-lat"
                value={latitude}
                onChange={setLatitude}
                placeholder="28.6139"
                type="number"
                maxLength={LIMITS.latitude.max}
              />
              {errors.latitude && <div className="cs-error">{errors.latitude}</div>}
            </div>
            <div>
              <FieldLabel
                icon={<CompassIcon size={15} color={C.gold} />}
                label="Longitude"
                hint="e.g. 77.2090"
              />
              <StyledInput
                id="site-lng"
                value={longitude}
                onChange={setLongitude}
                placeholder="77.2090"
                type="number"
                maxLength={LIMITS.longitude.max}
              />
              {errors.longitude && <div className="cs-error">{errors.longitude}</div>}
            </div>
          </div>
          {errors.location && <div className="cs-error" style={{ marginTop: -8 }}>{errors.location}</div>}

          {/* Location status card */}
          <div style={{
            backgroundColor: hasLocation ? "rgba(93,190,138,0.1)" : "rgba(201,162,39,0.08)",
            border: `1px solid ${hasLocation ? "rgba(93,190,138,0.35)" : C.borderGold}`,
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{ flexShrink: 0 }}>
              {hasLocation
                ? <CheckCircleIcon size={18} color={C.green} />
                : <InfoIcon size={18} color={C.gold} />}
            </div>
            <span style={{
              color: hasLocation ? C.green : C.gold,
              fontSize: 13,
              fontWeight: 600,
              flex: 1,
            }}>
              {hasLocation
                ? `Location set: ${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
                : "No location set — fill in manually or use Auto Fetch below"}
            </span>
          </div>

          {locationError && (
            <div className="cs-error" style={{ marginTop: -6, marginBottom: 12 }}>
              {locationError}
            </div>
          )}

          {/* Auto Fetch button */}
          <button
            className="cs-fetch-btn"
            onClick={fetchLocation}
            disabled={loadingLocation}
          >
            {loadingLocation
              ? <Spinner size={16} color={C.gold} />
              : <CrosshairIcon size={16} color={C.gold} />}
            <span>
              {loadingLocation ? "Fetching Location…" : "Auto Fetch Live Location"}
            </span>
          </button>

          {/* ══ HALLS ══ */}
          <SectionHeader
            title="Halls"
            icon={<GridIcon size={16} color={C.gold} />}
          />

          <div className="cs-halls-empty">
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: C.faint,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}>
              <GridIcon size={28} color={C.muted} />
            </div>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, margin: 0 }}>
              No Halls Added Yet
            </p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0, maxWidth: 320 }}>
              Save this site first, then add individual halls from the venue detail screen.
            </p>
          </div>

          <div className="cs-divider" />

          {/* Submit error */}
          {errors.submit && (
            <div className="cs-error" style={{ marginBottom: 12, fontSize: 13 }}>
              {errors.submit}
            </div>
          )}

          {/* ── Create Button ── */}
          <button
            className="cs-create-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={16} color={C.muted} />
                <span style={{ color: C.muted }}>Creating Site…</span>
              </>
            ) : (
              <>
                <CheckCircleIcon size={18} color="#000" />
                <span>Create Site</span>
              </>
            )}
          </button>

        </div>
      </div>
    </>
  );
}