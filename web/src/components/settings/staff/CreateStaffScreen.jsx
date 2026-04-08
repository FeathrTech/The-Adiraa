// src/components/settings/staff/CreateStaffScreen.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchRoles } from "../../../api/roleApi";
import { fetchSites } from "../../../api/siteApi";
import { createUser } from "../../../api/userApi";
import { useAuthStore } from "../../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../../config/permissionMap";

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
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
};

// ─── Limits ───────────────────────────────────────────────────────────────────
const LIMITS = {
  name:     { min: 2, max: 60 },
  email:    { max: 254 },
  password: { min: 8, max: 128 },
  shift:    { max: 5 },
};

// ✅ File size limits
const FILE_LIMITS = {
  profilePhoto: 5  * 1024 * 1024,  // 5 MB
  idProof:      10 * 1024 * 1024,  // 10 MB
};

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidTime  = (t) => !t || /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const formatShiftTime = (text) => {
  const digits = text.replace(/[^0-9]/g, "");
  if (!digits.length) return "";
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ":" + digits.slice(2, 4);
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
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

function EyeIcon({ off = false }) {
  return off ? (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.39 1 12a10.11 10.11 0 012.83-4.1" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.61 11 8a10.1 10.1 0 01-1.34 2.37" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function Spinner({ size = 18, color = "#000" }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color}
        strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function PersonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LocationPinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DocumentIcon({ size = 16 }) {
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

function CloudUploadIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function CameraIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IdCardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4M14 12h4M14 15h2" />
    </svg>
  );
}

function EditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2
        1.99 1.99 0 01-.38-.04
        19.97 19.97 0 01-8.63-3.07
        19.5 19.5 0 01-6-6
        19.97 19.97 0 01-3.07-8.67
        A2 2 0 013.11 2h3a2 2 0 012 1.72
        c.127.96.361 1.903.7 2.81
        a2 2 0 01-.45 2.11L7.09 9.91
        a16 16 0 006 6l1.27-1.27
        a2 2 0 012.11-.45
        c.907.339 1.85.573 2.81.7
        A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MailIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function SunriseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 18a5 5 0 00-10 0" />
      <line x1="12" y1="2" x2="12" y2="9" />
      <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
      <line x1="1" y1="18" x2="3" y2="18" />
      <line x1="21" y1="18" x2="23" y2="18" />
      <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
      <line x1="23" y1="22" x2="1" y2="22" />
      <polyline points="8 6 12 2 16 6" />
    </svg>
  );
}

function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3
        7 7 0 0021 12.79z" />
    </svg>
  );
}

function AddUserIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  const progressRef = useRef(null);

  useEffect(() => {
    if (!toast || !progressRef.current) return;
    progressRef.current.style.transition = "none";
    progressRef.current.style.transform  = "scaleX(1)";
    void progressRef.current.offsetWidth;
    progressRef.current.style.transition = "transform 3.5s linear";
    progressRef.current.style.transform  = "scaleX(0)";
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const accent  = isError ? C.red   : C.green;
  const bg      = isError ? "rgba(20,10,10,0.97)"  : "rgba(10,18,12,0.97)";
  const border  = isError ? "rgba(229,115,115,0.5)" : "rgba(93,190,138,0.5)";
  const iconBg  = isError ? "rgba(229,115,115,0.15)": "rgba(93,190,138,0.15)";

  return (
    <>
      <style>{`
        @keyframes toastDrop {
          0%   { opacity:0; transform:translateX(-50%) translateY(-24px) scale(.94); }
          60%  { opacity:1; transform:translateX(-50%) translateY(5px) scale(1.01); }
          100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        .toast-drop { animation: toastDrop .42s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>
      <div className="toast-drop" style={{
        position:"fixed", top:20, left:"50%",
        zIndex:99999, width:"min(420px,92vw)",
        pointerEvents:"auto",
      }}>
        <div style={{
          backgroundColor:bg, borderRadius:18,
          border:`1px solid ${border}`,
          boxShadow:`0 10px 40px ${isError
            ? "rgba(229,115,115,0.18)"
            : "rgba(93,190,138,0.18)"},0 2px 10px rgba(0,0,0,0.7)`,
          display:"flex", alignItems:"center",
          gap:12, padding:"12px 14px",
        }}>
          <div style={{
            width:38, height:38, borderRadius:11,
            backgroundColor:iconBg,
            display:"flex", alignItems:"center",
            justifyContent:"center",
            flexShrink:0, color:accent,
          }}>
            {isError ? <XCircleIcon /> : <CheckCircleIcon />}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{
              color:accent, fontSize:10, fontWeight:800,
              letterSpacing:"2px", textTransform:"uppercase",
              margin:"0 0 3px",
            }}>
              {isError ? "Error" : "Success"}
            </p>
            <p style={{
              color:C.white, fontSize:13, fontWeight:500,
              lineHeight:1.4, margin:0, wordBreak:"break-word",
            }}>
              {toast.msg}
            </p>
          </div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:9,
            border:"none", cursor:"pointer",
            backgroundColor: isError
              ? "rgba(229,115,115,0.1)"
              : "rgba(93,190,138,0.1)",
            color:accent,
            display:"flex", alignItems:"center",
            justifyContent:"center", flexShrink:0,
          }}>
            <XIcon size={13} />
          </button>
        </div>
        <div style={{
          height:3, backgroundColor:"rgba(255,255,255,0.06)",
          borderRadius:2, marginTop:5, marginInline:4,
          overflow:"hidden",
        }}>
          <div ref={progressRef} style={{
            height:"100%", borderRadius:2,
            backgroundColor:accent, transformOrigin:"left",
          }} />
        </div>
      </div>
    </>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      margin:"28px 0 18px",
    }}>
      <div style={{
        width:34, height:34, borderRadius:10,
        backgroundColor:"rgba(201,162,39,0.12)",
        border:`1px solid ${C.borderGold}`,
        display:"flex", alignItems:"center",
        justifyContent:"center",
        color:C.gold, flexShrink:0,
      }}>
        {icon}
      </div>
      <span style={{
        color:C.gold, fontWeight:700,
        fontSize:11, letterSpacing:"2.5px",
        textTransform:"uppercase",
      }}>
        {title}
      </span>
      <div style={{ flex:1, height:1, backgroundColor:C.border }} />
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint, optional, required }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ color:C.gold, display:"flex", alignItems:"center" }}>
          {icon}
        </span>
        <span style={{ color:C.white, fontWeight:700, fontSize:13 }}>
          {label}
        </span>
        {required && (
          <span style={{ color:C.red, fontWeight:800, fontSize:14 }}>*</span>
        )}
        {optional && (
          <span style={{ color:C.muted, fontSize:11 }}>(optional)</span>
        )}
      </div>
      {hint && (
        <p style={{ color:C.muted, fontSize:11, margin:"3px 0 0 22px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChange, placeholder, type = "text",
  maxLength, showCount, isPhone,
}) {
  const [focused,  setFocused]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const len        = value?.length ?? 0;
  const nearLimit  = maxLength && len >= Math.floor(maxLength * 0.85);
  const atLimit    = maxLength && len >= maxLength;
  const counterColor = atLimit ? C.red : nearLimit ? C.orange : C.muted;

  const borderColor = focused
    ? atLimit ? C.red : C.gold
    : atLimit ? "rgba(229,115,115,0.5)" : C.border;

  const handlePhone = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(digits);
  };

  if (isPhone) {
    return (
      <div style={{ marginBottom:16 }}>
        <div style={{
          display:"flex", alignItems:"center",
          backgroundColor:C.inputBg,
          border:`1px solid ${focused ? C.gold : C.border}`,
          borderRadius:11, padding:"0 14px",
          transition:"border-color .15s",
        }}>
          <input
            value={value}
            onChange={handlePhone}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            type="tel"
            maxLength={10}
            style={{
              flex:1, background:"none", border:"none",
              outline:"none", color:C.white, fontSize:14,
              padding:"11px 0", caretColor:C.gold,
            }}
          />
          <span style={{
            color: len === 10 ? C.gold : C.muted,
            fontSize:12, fontWeight:600,
            marginLeft:8, flexShrink:0,
          }}>
            {len}/10
          </span>
        </div>
        {len > 0 && len < 10 && (
          <p style={{ color:C.red, fontSize:11, margin:"4px 0 0 2px" }}>
            Phone number must be 10 digits
          </p>
        )}
      </div>
    );
  }

  const inputType = type === "password"
    ? showPwd ? "text" : "password"
    : type;

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{
        display:"flex", alignItems:"center",
        backgroundColor:C.inputBg,
        border:`1px solid ${borderColor}`,
        borderRadius:11, padding:"0 14px",
        transition:"border-color .15s",
      }}>
        <input
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          type={inputType}
          maxLength={maxLength}
          style={{
            flex:1, background:"none", border:"none",
            outline:"none", color:C.white, fontSize:14,
            padding:"11px 0", caretColor:C.gold,
          }}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPwd((p) => !p)}
            style={{
              background:"none", border:"none",
              cursor:"pointer", color:C.muted,
              display:"flex", padding:"4px", flexShrink:0,
            }}
          >
            <EyeIcon off={!showPwd} />
          </button>
        )}
      </div>
      {showCount && maxLength && (
        <p style={{
          color:counterColor, fontSize:11,
          textAlign:"right", margin:"3px 2px 0",
        }}>
          {len}/{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── Selector Chip ────────────────────────────────────────────────────────────
function SelectorChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:6,
        backgroundColor: selected ? C.gold : C.inputBg,
        border:`1px solid ${selected ? C.gold : C.border}`,
        borderRadius:10, padding:"9px 16px",
        cursor:"pointer",
        fontWeight: selected ? 700 : 400,
        fontSize:13,
        color: selected ? "#000" : C.muted,
        transition:"all .15s", whiteSpace:"nowrap",
      }}
    >
      {selected && (
        <svg width="14" height="14" fill="none"
          stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ─── Upload Button ────────────────────────────────────────────────────────────
function UploadButton({ label, hint, selected, onChange, accept, preview }) {
  const inputRef = useRef(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        display:"flex", alignItems:"center", gap:14,
        backgroundColor: selected
          ? "rgba(201,162,39,0.08)" : C.inputBg,
        border:`1px solid ${selected ? C.borderGold : C.border}`,
        borderRadius:13, padding:"14px 16px",
        cursor:"pointer", marginBottom:12,
        transition:"all .15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = C.gold)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor =
          selected ? C.borderGold : C.border)
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display:"none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          // Reset so same file can be re-selected after rejection
          e.target.value = "";
        }}
      />
      <div style={{
        width:52, height:52, borderRadius:10,
        backgroundColor: selected
          ? "rgba(201,162,39,0.15)" : C.faint,
        border:`1px solid ${selected ? C.borderGold : C.border}`,
        display:"flex", alignItems:"center",
        justifyContent:"center", flexShrink:0,
        overflow:"hidden",
      }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview"
            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <span style={{ color: selected ? C.gold : C.muted }}>
            <UploadIcon />
          </span>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{
          color: selected ? C.white : C.muted,
          fontWeight: selected ? 700 : 400,
          fontSize:14, margin:"0 0 3px",
        }}>
          {label}
        </p>
        <p style={{
          color:C.muted, fontSize:11, margin:0,
          overflow:"hidden", textOverflow:"ellipsis",
          whiteSpace:"nowrap",
        }}>
          {hint}
        </p>
      </div>
      <span style={{ color: selected ? C.gold : C.muted, flexShrink:0 }}>
        {selected ? <CheckCircleIcon /> : <UploadIcon />}
      </span>
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ icon, label, description, value, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        backgroundColor: value
          ? "rgba(201,162,39,0.06)" : C.inputBg,
        border:`1px solid ${value ? C.borderGold : C.border}`,
        borderRadius:13, padding:"14px 16px",
        cursor:"pointer", marginBottom:12,
        transition:"all .15s", gap:12,
      }}
    >
      <div style={{
        display:"flex", alignItems:"center",
        gap:12, flex:1, minWidth:0,
      }}>
        <div style={{
          width:38, height:38, borderRadius:"50%",
          backgroundColor: value
            ? "rgba(201,162,39,0.12)" : C.faint,
          border:`1px solid ${value ? C.borderGold : C.border}`,
          display:"flex", alignItems:"center",
          justifyContent:"center", flexShrink:0,
          color: value ? C.gold : C.muted,
        }}>
          {icon}
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{
            color: value ? C.white : C.muted,
            fontWeight: value ? 700 : 500,
            fontSize:14, margin:"0 0 3px",
          }}>
            {label}
          </p>
          <p style={{
            color:C.muted, fontSize:11,
            margin:0, lineHeight:1.5,
          }}>
            {description}
          </p>
        </div>
      </div>
      <div style={{
        width:44, height:24, borderRadius:100,
        backgroundColor: value ? C.gold : C.faint,
        display:"flex", alignItems:"center",
        padding:"0 3px", flexShrink:0,
        transition:"background-color .2s",
      }}>
        <div style={{
          width:18, height:18, borderRadius:"50%",
          backgroundColor:C.white,
          marginLeft: value ? "auto" : 0,
          transition:"margin .2s",
        }} />
      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:"100vh", backgroundColor:C.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      gap:12,
    }}>
      <Spinner size={36} color={C.gold} />
      <p style={{
        fontSize:11, letterSpacing:"3px",
        fontWeight:600, textTransform:"uppercase",
        margin:0, color:C.muted,
      }}>
        Loading
      </p>
    </div>
  );
}

// ─── Main CreateStaffScreen ───────────────────────────────────────────────────
export default function CreateStaffScreen() {
  const router      = useRouter();
  const permissions = useAuthStore((s) => s.permissions);

  const [name,       setName]       = useState("");
  const [mobile,     setMobile]     = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd,   setShiftEnd]   = useState("");

  const [roles,         setRoles]         = useState([]);
  const [sites,         setSites]         = useState([]);
  const [selectedRole,  setSelectedRole]  = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);

  const [profilePhoto,   setProfilePhoto]   = useState(null);
  const [idProof,        setIdProof]        = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idPreview,      setIdPreview]      = useState(null);

  const [allowSelfPhotoUpload, setAllowSelfPhotoUpload] = useState(false);
  const [allowSelfIdUpload,    setAllowSelfIdUpload]    = useState(false);

  const [loading,        setLoading]        = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast,          setToast]          = useState(null);

  const toastTimer = useRef(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };
  const closeToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  };

  // ── Load roles + sites ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [roleData, siteData] = await Promise.all([
          fetchRoles(),
          fetchSites(),
        ]);
        const filtered = Array.isArray(roleData)
          ? roleData.filter((r) => r.name.toLowerCase() !== "owner")
          : [];
        setRoles(filtered);
        setSites(Array.isArray(siteData) ? siteData : []);
      } catch {
        showToast("Failed to load roles / locations", "error");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // ── Permission guard ───────────────────────────────────────────────────────
  if (!can(permissions, ACTION_PERMISSIONS.staff.create)) {
    return (
      <div style={{
        minHeight:"100vh", backgroundColor:C.bg,
        display:"flex", alignItems:"center",
        justifyContent:"center",
      }}>
        <p style={{ color:C.red, fontSize:14 }}>
          You don't have permission to create staff.
        </p>
      </div>
    );
  }

  if (initialLoading) return <LoadingScreen />;

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleProfilePhoto = (file) => {
    // ✅ Type check — profile photo must be an image
    if (!file.type.startsWith("image/")) {
      showToast(
        "Profile photo must be an image file (JPG, PNG, etc.)",
        "error"
      );
      return;
    }
    // ✅ Size check — max 5 MB
    if (file.size > FILE_LIMITS.profilePhoto) {
      showToast(
        `Profile photo must be under 5 MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        "error"
      );
      return;
    }
    setProfilePhoto(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleIdProof = (file) => {
    // ✅ Size check — max 10 MB
    if (file.size > FILE_LIMITS.idProof) {
      showToast(
        `ID proof must be under 10 MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        "error"
      );
      return;
    }
    setIdProof(file);
    if (file.type.startsWith("image/")) {
      setIdPreview(URL.createObjectURL(file));
    } else {
      setIdPreview(null);
    }
  };

  const toggleSite = (id) => {
    setSelectedSites((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim())
      return "Full name is required";
    if (name.trim().length < LIMITS.name.min)
      return `Name must be at least ${LIMITS.name.min} characters`;
    if (!mobile.trim())
      return "Mobile number is required";
    if (mobile.length !== 10)
      return "Mobile number must be exactly 10 digits";
    if (email && !isValidEmail(email))
      return "Enter a valid email address";
    if (!password.trim())
      return "Password is required";
    if (password.length < LIMITS.password.min)
      return `Password must be at least ${LIMITS.password.min} characters`;
    if (shiftStart && !isValidTime(shiftStart))
      return "Shift start must be in HH:MM format (e.g. 09:00)";
    if (shiftEnd && !isValidTime(shiftEnd))
      return "Shift end must be in HH:MM format (e.g. 18:00)";
    const chosenRole = roles.find((r) => r.id === selectedRole);
    if (chosenRole?.name?.toLowerCase() === "owner")
      return "Owner role cannot be assigned to staff";
    if (!selectedRole)
      return "Please select a role";
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const err = validate();
    if (err) { showToast(err, "error"); return; }

    // ✅ Double-check file sizes at submit time
    if (profilePhoto && profilePhoto.size > FILE_LIMITS.profilePhoto) {
      showToast("Profile photo exceeds 5 MB limit", "error");
      return;
    }
    if (idProof && idProof.size > FILE_LIMITS.idProof) {
      showToast("ID proof exceeds 10 MB limit", "error");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name",           name.trim());
      formData.append("mobile",         mobile);
      formData.append("password",       password);
      formData.append("shiftStartTime", shiftStart);
      formData.append("shiftEndTime",   shiftEnd);
      formData.append("roleIds",        JSON.stringify([selectedRole]));
      formData.append("email",          email?.trim() ?? "");
      formData.append("allowSelfPhotoUpload", String(allowSelfPhotoUpload));
      formData.append("allowSelfIdUpload",    String(allowSelfIdUpload));

      if (selectedSites.length > 0)
        formData.append("locationIds", JSON.stringify(selectedSites));
      if (profilePhoto)
        formData.append("profilePhoto", profilePhoto);
      if (idProof)
        formData.append("idProof", idProof);

      const createdUser = await createUser(formData);
      showToast(`Staff "${createdUser.username}" created successfully`);
      setTimeout(() =>
        router.push(`/settings/staff/${createdUser.id}`),
        1500
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to create staff",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .fade-in { animation: fadeIn .35s ease forwards; }

        .create-staff-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px 48px;
          box-sizing: border-box;
        }
        @media (min-height: 900px) {
          .create-staff-outer {
            align-items: center;
            padding: 48px 16px;
          }
        }

        .create-staff-card {
          width: 100%;
          max-width: 700px;
          background-color: ${C.surface};
          border-radius: 24px;
          border: 1px solid ${C.borderGold};
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 0 0 1px rgba(201,162,39,0.06),
            0 24px 80px rgba(0,0,0,0.6),
            0 8px 32px rgba(0,0,0,0.4);
        }

        .card-body {
          padding: 8px 28px 48px;
          overflow-y: auto;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .two-col-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .two-col        { grid-template-columns: 1fr; }
          .two-col-toggle { grid-template-columns: 1fr; }
          .card-body      { padding: 8px 16px 40px; }
          .card-header    { padding: 16px 16px !important; }
        }

        .chip-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .hide-sm { display: inline; }
        @media (max-width: 480px) {
          .hide-sm { display: none !important; }
        }

        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25);
          border-radius: 4px;
        }

        .create-btn { transition: filter .15s, transform .1s; }
        .create-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .create-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <Toast toast={toast} onClose={closeToast} />

      <div className="create-staff-outer">
        <div className="create-staff-card fade-in">

          {/* ── Header ── */}
          <div
            className="card-header"
            style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"20px 28px",
              borderBottom:`1px solid ${C.border}`,
              flexWrap:"wrap",
            }}
          >
            <button
              onClick={() => router.push("/settings/staff")}
              style={{
                display:"flex", alignItems:"center", gap:6,
                backgroundColor:C.faint,
                border:`1px solid ${C.borderGold}`,
                borderRadius:10, padding:"7px 12px",
                color:C.gold, fontWeight:600, fontSize:13,
                cursor:"pointer", flexShrink:0,
                transition:"filter .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              <ArrowLeftIcon />
              <span className="hide-sm">Back</span>
            </button>

            <div style={{ flex:1, minWidth:0 }}>
              <p style={{
                color:C.gold, fontSize:10, fontWeight:700,
                letterSpacing:"3px", textTransform:"uppercase",
                margin:"0 0 3px",
              }}>
                Staff Management
              </p>
              <h1 style={{
                color:C.white,
                fontSize:"clamp(20px, 4vw, 28px)",
                fontWeight:800, letterSpacing:"-0.3px",
                margin:0, lineHeight:1,
              }}>
                Add Staff Member
              </h1>
            </div>

            <div style={{
              display:"flex", alignItems:"center",
              gap:4, flexShrink:0,
            }}>
              <span style={{ color:C.red, fontWeight:800, fontSize:14 }}>*</span>
              <span style={{ color:C.muted, fontSize:12 }}>Required</span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="card-body">

            {/* ── PERSONAL INFO ── */}
            <SectionHeader
              icon={<PersonIcon size={16} />}
              title="Personal Info"
            />

            <FieldLabel
              icon={<EditIcon size={14} />}
              label="Full Name"
              hint={`2–${LIMITS.name.max} characters`}
              required
            />
            <StyledInput
              value={name} onChange={setName}
              placeholder="e.g. Rahul Sharma"
              maxLength={LIMITS.name.max} showCount
            />

            <div className="two-col">
              <div>
                <FieldLabel
                  icon={<PhoneIcon size={14} />}
                  label="Mobile Number"
                  hint="10-digit number"
                  required
                />
                <StyledInput
                  value={mobile} onChange={setMobile}
                  placeholder="e.g. 9876543210"
                  isPhone
                />
              </div>
              <div>
                <FieldLabel
                  icon={<MailIcon size={14} />}
                  label="Email"
                  hint="Notifications & recovery"
                  optional
                />
                <StyledInput
                  value={email} onChange={setEmail}
                  placeholder="e.g. rahul@company.com"
                  type="email"
                  maxLength={LIMITS.email.max} showCount
                />
              </div>
            </div>

            <FieldLabel
              icon={<LockIcon size={14} />}
              label="Password"
              hint={`Minimum ${LIMITS.password.min} characters`}
              required
            />
            <StyledInput
              value={password} onChange={setPassword}
              placeholder="Set a strong password"
              type="password"
              maxLength={LIMITS.password.max} showCount
            />

            {/* ── SHIFT TIMINGS ── */}
            <SectionHeader
              icon={<ClockIcon size={16} />}
              title="Shift Timings"
            />

            <div className="two-col">
              <div>
                <FieldLabel
                  icon={<SunriseIcon size={14} />}
                  label="Start Time"
                  hint="24-hr format (HH:MM)"
                />
                <StyledInput
                  value={shiftStart}
                  onChange={(v) => setShiftStart(formatShiftTime(v))}
                  placeholder="09:00"
                  maxLength={LIMITS.shift.max}
                />
              </div>
              <div>
                <FieldLabel
                  icon={<MoonIcon size={14} />}
                  label="End Time"
                  hint="24-hr format (HH:MM)"
                />
                <StyledInput
                  value={shiftEnd}
                  onChange={(v) => setShiftEnd(formatShiftTime(v))}
                  placeholder="18:00"
                  maxLength={LIMITS.shift.max}
                />
              </div>
            </div>

            {/* ── ROLE ── */}
            <SectionHeader
              icon={<ShieldIcon size={16} />}
              title="Role"
            />
            <p style={{
              color:C.muted, fontSize:12,
              margin:"0 0 14px", lineHeight:1.6,
            }}>
              Assign a permission role that controls
              what this staff member can access
            </p>

            {roles.length === 0 ? (
              <p style={{ color:C.muted, fontSize:13 }}>
                No roles available
              </p>
            ) : (
              <div className="chip-wrap">
                {roles.map((role) => (
                  <SelectorChip
                    key={role.id}
                    label={role.name}
                    selected={selectedRole === role.id}
                    onClick={() => setSelectedRole(role.id)}
                  />
                ))}
              </div>
            )}

            {/* ── ASSIGN LOCATION ── */}
            {sites.length > 0 && (
              <>
                <SectionHeader
                  icon={<LocationPinIcon size={16} />}
                  title="Assign Location"
                />
                <p style={{
                  color:C.muted, fontSize:12,
                  margin:"0 0 14px", lineHeight:1.6,
                }}>
                  Select one or more sites for attendance tracking
                </p>
                <div className="chip-wrap">
                  {sites.map((site) => (
                    <SelectorChip
                      key={site.id}
                      label={site.name}
                      selected={selectedSites.includes(site.id)}
                      onClick={() => toggleSite(site.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── DOCUMENTS ── */}
            <SectionHeader
              icon={<DocumentIcon size={16} />}
              title="Documents"
            />
            <p style={{
              color:C.muted, fontSize:12,
              margin:"0 0 14px", lineHeight:1.6,
            }}>
              Upload profile photo and ID proof
              for verification records
            </p>

            {/* ✅ Hints now match actual enforced limits */}
            <UploadButton
              label={profilePhoto
                ? "Profile Photo Selected"
                : "Upload Profile Photo"}
              hint={profilePhoto
                ? profilePhoto.name
                : "JPEG / PNG — max 5 MB"}
              selected={!!profilePhoto}
              accept="image/*"
              onChange={handleProfilePhoto}
              preview={profilePreview}
            />

            <UploadButton
              label={idProof ? "ID Proof Selected" : "Upload ID Proof"}
              hint={idProof ? idProof.name : "Image or PDF — max 10 MB"}
              selected={!!idProof}
              accept="image/*,application/pdf"
              onChange={handleIdProof}
              preview={idPreview}
            />

            {/* ── SELF-UPLOAD PERMISSIONS ── */}
            <div style={{
              height:1, backgroundColor:C.border,
              margin:"24px 0",
            }} />

            <SectionHeader
              icon={<CloudUploadIcon size={16} />}
              title="Self Upload"
            />
            <p style={{
              color:C.muted, fontSize:12,
              margin:"0 0 14px", lineHeight:1.6,
            }}>
              Allow this staff member to upload their
              own documents from the app
            </p>

            <div className="two-col-toggle">
              <ToggleRow
                icon={<CameraIcon size={16} />}
                label="Profile Photo"
                description="Staff can update their own photo"
                value={allowSelfPhotoUpload}
                onToggle={() => setAllowSelfPhotoUpload((p) => !p)}
              />
              <ToggleRow
                icon={<IdCardIcon size={16} />}
                label="ID Proof"
                description="Staff can upload their own ID"
                value={allowSelfIdUpload}
                onToggle={() => setAllowSelfIdUpload((p) => !p)}
              />
            </div>

            {/* ── Divider ── */}
            <div style={{
              height:1, backgroundColor:C.border,
              margin:"24px 0",
            }} />

            {/* ── CREATE BUTTON ── */}
            <button
              className="create-btn"
              onClick={handleCreate}
              disabled={loading}
              style={{
                width:"100%",
                display:"flex", alignItems:"center",
                justifyContent:"center", gap:8,
                backgroundColor: loading ? C.faint : C.gold,
                border:"none", borderRadius:13,
                padding:"15px 0",
                color: loading ? C.muted : "#000",
                fontWeight:800, fontSize:14,
                letterSpacing:"0.5px",
                textTransform:"uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Spinner size={18} color={C.muted} />
                  Creating Staff…
                </>
              ) : (
                <>
                  <AddUserIcon size={18} />
                  Create Staff Member
                </>
              )}
            </button>

            {/* ── Powered By ── */}
            <div style={{
              display:"flex", alignItems:"center",
              justifyContent:"center",
              gap:8, marginTop:32,
            }}>
              <div style={{
                height:1, width:16,
                backgroundColor:"rgba(201,162,39,0.3)",
              }} />
              <span style={{
                color:"rgba(201,162,39,0.5)",
                fontSize:10, fontWeight:500,
                letterSpacing:"3px", textTransform:"uppercase",
              }}>
                Powered by FeathrTech
              </span>
              <div style={{
                height:1, width:16,
                backgroundColor:"rgba(201,162,39,0.3)",
              }} />
            </div>

          </div>{/* end card-body */}
        </div>{/* end card */}
      </div>{/* end outer */}
    </>
  );
}