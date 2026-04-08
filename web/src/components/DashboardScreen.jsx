// src/components/dashboard/DashboardScreen.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { uploadOwnProfilePhoto, uploadOwnIdProof } from "../api/userApi";
import { useRealtime } from "../hooks/useRealtime";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import api from "../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "#7A5E10",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isPdf = (url) => {
  if (typeof url !== "string") return false;
  try {
    const pathname = new URL(url).pathname;
    return pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().split("?")[0].split("#")[0].endsWith(".pdf");
  }
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function ChevronRightIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0
        01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1
        1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0
        00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0
        004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0
        004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65
        1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0
        001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65
        1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0
        00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2
        3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4M14 12h4M14 15h2" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
      <line x1="9" y1="9" x2="11" y2="9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function VenueIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18"
      fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor"
        strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// ─── Clock Widget ─────────────────────────────────────────────────────────────
function ClockWidget() {
  const now = useClock();

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const parts = timeStr.split(" ");
  const timeNumbers = parts[0];
  const ampm = parts[1]?.toUpperCase();

  return (
    <div
      className="rounded-2xl p-5 sm:p-7 mb-5 flex flex-col items-center"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.borderGold}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: C.gold }} />
        <span className="text-xs font-semibold tracking-[3px] uppercase"
          style={{ color: C.gold }}>
          IST
        </span>
      </div>

      <div className="flex items-end">
        <span
          className="font-bold tabular-nums tracking-tight leading-none"
          style={{
            color: C.white,
            fontSize: "clamp(36px, 8vw, 80px)",
          }}
        >
          {timeNumbers}
        </span>
        <span
          className="font-bold ml-2 mb-1 tracking-widest"
          style={{
            color: C.gold,
            fontSize: "clamp(14px, 2.5vw, 26px)",
          }}
        >
          {ampm}
        </span>
      </div>

      <div className="w-full my-4"
        style={{ height: 1, backgroundColor: C.border }} />

      <span
        className="font-medium tracking-wide text-center text-sm sm:text-base"
        style={{ color: C.muted }}
      >
        {dateStr}
      </span>
    </div>
  );
}

// ─── Upload File Picker Modal ─────────────────────────────────────────────────
function FilePickerModal({ open, title, options, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center
        justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl p-5 animate-fadeIn"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.borderGold}`,
          maxWidth: "400px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-base mb-4 text-center"
          style={{ color: C.white }}>
          {title}
        </p>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { opt.onPress(); onClose(); }}
              className="w-full rounded-xl py-3 px-4 font-semibold text-sm
                transition-all duration-150 hover:brightness-110
                active:scale-[0.98] text-left"
              style={{
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                color: opt.danger ? "#E57373" : C.white,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ID Proof Thumbnail ───────────────────────────────────────────────────────
function IdProofThumbnail({ idProofPreview, idProofUrl }) {
  const [imgError, setImgError] = useState(false);
  const hasPdf = idProofUrl && isPdf(idProofUrl);

  useEffect(() => {
    setImgError(false);
  }, [idProofPreview]);

  if (hasPdf) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-full
          shrink-0"
        style={{
          width: "clamp(36px, 9vw, 48px)",
          height: "clamp(36px, 9vw, 48px)",
          backgroundColor: "rgba(201,162,39,0.15)",
          border: `1px solid ${C.borderGold}`,
          color: C.gold,
        }}
      >
        <PdfIcon />
      </div>
    );
  }

  if (idProofPreview && !imgError) {
    return (
      <div
        className="rounded-full shrink-0 overflow-hidden"
        style={{
          width: "clamp(36px, 9vw, 48px)",
          height: "clamp(36px, 9vw, 48px)",
          border: `1px solid ${C.borderGold}`,
        }}
      >
        <img
          src={idProofPreview}
          alt="ID Proof"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: "clamp(36px, 9vw, 48px)",
        height: "clamp(36px, 9vw, 48px)",
        backgroundColor: "rgba(201,162,39,0.1)",
        border: `1px solid ${C.borderGold}`,
        color: C.gold,
      }}
    >
      <IdCardIcon />
    </div>
  );
}

// ─── Self Upload Card ─────────────────────────────────────────────────────────
function SelfUploadCard({
  canUploadOwnPhoto,
  canUploadOwnIdProof,
  uploading,
  onPickPhoto,
  onPickIdProof,
  profilePhotoPreview,
  idProofPreview,
  idProofUrl,
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.borderGold}`,
      }}
    >
      <p className="text-[11px] font-semibold tracking-[2.5px] uppercase"
        style={{ color: C.muted }}>
        My Documents
      </p>

      {canUploadOwnPhoto && (
        <button
          onClick={onPickPhoto}
          disabled={uploading}
          className="flex items-center gap-3 rounded-xl px-4 py-3
            transition-all duration-150 hover:brightness-110
            active:scale-[0.98] disabled:opacity-60 text-left w-full"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-full
              shrink-0 overflow-hidden"
            style={{
              width: "clamp(36px, 9vw, 48px)",
              height: "clamp(36px, 9vw, 48px)",
              backgroundColor: "rgba(201,162,39,0.1)",
              border: `1px solid ${C.borderGold}`,
              color: C.gold,
            }}
          >
            {profilePhotoPreview ? (
              <img
                src={profilePhotoPreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <CameraIcon />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm sm:text-base leading-tight"
              style={{ color: C.white }}>
              Upload Profile Photo
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {profilePhotoPreview
                ? "✓ Photo uploaded"
                : "Choose from gallery or take a photo"}
            </p>
          </div>

          <div style={{ color: C.muted }}>
            {uploading ? <Spinner /> : <UploadIcon />}
          </div>
        </button>
      )}

      {canUploadOwnIdProof && (
        <button
          onClick={onPickIdProof}
          disabled={uploading}
          className="flex items-center gap-3 rounded-xl px-4 py-3
            transition-all duration-150 hover:brightness-110
            active:scale-[0.98] disabled:opacity-60 text-left w-full"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <IdProofThumbnail
            idProofPreview={idProofPreview}
            idProofUrl={idProofUrl}
          />

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm sm:text-base leading-tight"
              style={{ color: C.white }}>
              Upload ID Proof
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {idProofUrl && isPdf(idProofUrl)
                ? "✓ PDF uploaded"
                : idProofPreview
                  ? "✓ ID proof uploaded"
                  : "Image or PDF accepted"}
            </p>
          </div>

          <div style={{ color: C.muted }}>
            {uploading ? <Spinner /> : <UploadIcon />}
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────
function NavCard({ title, icon, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl px-5 py-4
        sm:py-5 w-full text-left transition-all duration-150
        hover:brightness-110 active:scale-[0.98] group"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.borderGold}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold;
        e.currentTarget.style.backgroundColor = "#1f1f1f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.borderGold;
        e.currentTarget.style.backgroundColor = C.card;
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: 42, height: 42,
            backgroundColor: "rgba(201,162,39,0.08)",
            border: `1px solid ${C.borderGold}`,
            color: C.gold,
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base tracking-wide
            leading-tight" style={{ color: C.white }}>
            {title}
          </p>

          {badge !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: C.gold }} />
              <span className="text-xs font-semibold tracking-wide"
                style={{ color: C.gold }}>
                {badge} live
              </span>
            </div>
          )}
        </div>
      </div>

      <span style={{ color: C.gold, opacity: 0.7 }}>
        <ChevronRightIcon />
      </span>
    </button>
  );
}

// ─── No Access Message ────────────────────────────────────────────────────────
function NoAccessMessage() {
  return (
    <div
      className="rounded-2xl px-5 py-6 flex flex-col items-center gap-3 mb-4"
      style={{
        backgroundColor: "rgba(201,162,39,0.07)",
        border: `1px solid ${C.borderGold}`,
      }}
    >
      <div style={{ color: C.goldDim }}>
        <LockIcon />
      </div>
      <p className="text-sm text-center leading-relaxed"
        style={{ color: C.muted }}>
        You don't have access to any modules yet.
        <br />
        Contact your administrator to get permissions assigned.
      </p>
    </div>
  );
}

// ─── Main DashboardScreen ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const permissions = useAuthStore((s) => s.permissions) || [];

  // ── Memoized permission checker ────────────────────────────────────────────
  const can = useCallback(
    (key) => permissions.includes(key),
    [permissions]
  );

  const canAccessSettings = permissions.some((p) => p.startsWith("settings."));
  const canUploadOwnPhoto = !!user?.allowSelfPhotoUpload;
  const canUploadOwnIdProof = !!user?.allowSelfIdUpload;
  const canSelfUpload = canUploadOwnPhoto || canUploadOwnIdProof;

  const hasAnyCard =
    can("event.view_all") ||
    can("attendance.view.dashboard_summary") ||
    can("site.view");

  // ── State ──────────────────────────────────────────────────────────────────
  const [liveAttendanceCount, setLiveAttendanceCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [idModal, setIdModal] = useState(false);
  const [toast, setToast] = useState(null);
  const photoInputRef = useRef(null);
  const idInputRef = useRef(null);

  // ── Seed previews from user ────────────────────────────────────────────────
  useEffect(() => {
    if (user?.profilePhotoUrl) {
      setProfilePhotoPreview(user.profilePhotoUrl);
    }
    if (user?.idProofUrl) {
      if (!isPdf(user.idProofUrl)) {
        setIdProofPreview(user.idProofUrl);
      } else {
        setIdProofPreview(null);
      }
    }
  }, [user]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  // Memoized so it's stable across renders and safe to use in async functions
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load live attendance ───────────────────────────────────────────────────
  const loadLiveAttendance = useCallback(async () => {
    try {
      const res = await api.get("/attendance/dashboard", {
        params: {
          filter: "present",
          date: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          }),
        },
      });
      setLiveAttendanceCount(res.data?.staff?.length || 0);
    } catch (err) {
      console.log("Live attendance load error", err);
    }
  }, []);

  // Correct dep array — was [] before, missing loadLiveAttendance
  useEffect(() => {
    loadLiveAttendance();
  }, [loadLiveAttendance]);

  // ── Refresh on browser back / tab focus ───────────────────────────────────
  useRefreshOnFocus(
    useCallback(() => {
      loadLiveAttendance();
    }, [loadLiveAttendance])
  );

  // ── Realtime ───────────────────────────────────────────────────────────────
  // FIX: memoized with useCallback so the socket listener is NOT torn down
  // and re-added on every render. Empty dep array is correct —
  // setLiveAttendanceCount is always stable from useState.
  const handleAttendanceLiveUpdate = useCallback((data) => {
    if (data?.count !== undefined) setLiveAttendanceCount(data.count);
  }, []);

  useRealtime("attendance_live_update", handleAttendanceLiveUpdate);

  // ── Upload handlers ────────────────────────────────────────────────────────
  const doUploadPhoto = useCallback(async (file) => {
    try {
      setUploading(true);
      setProfilePhotoPreview(URL.createObjectURL(file));
      const updatedUser = await uploadOwnProfilePhoto(file);
      if (updatedUser?.profilePhotoUrl) {
        setProfilePhotoPreview(updatedUser.profilePhotoUrl);
      }
      showToast("Profile photo updated successfully");
    } catch (e) {
      showToast(e.response?.data?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }, [showToast]);

  const doUploadIdProof = useCallback(async (file) => {
    try {
      setUploading(true);
      if (!isPdf(file.name)) {
        setIdProofPreview(URL.createObjectURL(file));
      } else {
        setIdProofPreview(null);
      }
      const updatedUser = await uploadOwnIdProof(file);
      if (updatedUser?.idProofUrl) {
        if (!isPdf(updatedUser.idProofUrl)) {
          setIdProofPreview(updatedUser.idProofUrl);
        } else {
          setIdProofPreview(null);
        }
      }
      showToast("ID proof uploaded successfully");
    } catch (e) {
      showToast(e.response?.data?.message || "Upload failed", "error");
      setIdProofPreview(null);
    } finally {
      setUploading(false);
    }
  }, [showToast]);

  // ── File input handlers ────────────────────────────────────────────────────
  const onPhotoFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) doUploadPhoto(file);
    e.target.value = "";
  }, [doUploadPhoto]);

  const onIdFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) doUploadIdProof(file);
    e.target.value = "";
  }, [doUploadIdProof]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;
    await logout();
    router.replace("/login");
  }, [logout, router]);

  // ── Cards config ───────────────────────────────────────────────────────────
  const cards = [
    can("event.view_all") && {
      key: "booking",
      title: "Booking Calendar",
      icon: <CalendarIcon />,
      onClick: () => router.push("/events"),
    },
    can("attendance.view.dashboard_summary") && {
      key: "attendance",
      title: "Attendance",
      icon: <AttendanceIcon />,
      badge: liveAttendanceCount,
      onClick: () => router.push("/attendance"),
    },
    can("site.view") && {
      key: "venue",
      title: "Venue",
      icon: <VenueIcon />,
      onClick: () => router.push("/sites"),
    },
  ].filter(Boolean);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease forwards; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease forwards; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toastIn { animation: toastIn 0.25s ease forwards; }
      `}</style>

      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoFileChange}
      />
      <input
        ref={idInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onIdFileChange}
      />

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 animate-toastIn
            rounded-xl px-5 py-3 text-sm font-semibold shadow-lg"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: toast.type === "error"
              ? "rgba(229,115,115,0.15)" : "rgba(201,162,39,0.15)",
            border: `1px solid ${toast.type === "error"
              ? "rgba(229,115,115,0.4)" : C.borderGold}`,
            color: toast.type === "error" ? "#E57373" : C.gold,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── File picker modals ── */}
      <FilePickerModal
        open={photoModal}
        title="Upload Profile Photo"
        onClose={() => setPhotoModal(false)}
        options={[
          {
            label: "Choose from Gallery",
            onPress: () => photoInputRef.current?.click(),
          },
          {
            label: "Cancel",
            danger: true,
            onPress: () => { },
          },
        ]}
      />

      <FilePickerModal
        open={idModal}
        title="Upload ID Proof"
        onClose={() => setIdModal(false)}
        options={[
          {
            label: "Choose Image or PDF",
            onPress: () => idInputRef.current?.click(),
          },
          {
            label: "Cancel",
            danger: true,
            onPress: () => { },
          },
        ]}
      />

      {/* ── Page ── */}
      <div
        className="min-h-screen px-4 py-6 sm:px-6 lg:px-10"
        style={{ backgroundColor: C.bg }}
      >
        <div className="max-w-4xl mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start sm:items-end justify-between
            mb-5 animate-fadeIn">
            <div>
              <p className="text-[11px] sm:text-xs font-bold tracking-[3px]
                uppercase mb-1"
                style={{ color: C.gold }}>
                Admin Portal
              </p>
              <h1
                className="font-extrabold tracking-tight leading-none"
                style={{
                  color: C.white,
                  fontSize: "clamp(28px, 6vw, 48px)",
                }}
              >
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-1">
              {canAccessSettings && (
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-2 rounded-xl px-3 py-2
                    sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                    transition-all duration-150 hover:brightness-110
                    active:scale-[0.97]"
                  style={{
                    backgroundColor: C.card,
                    border: `1px solid ${C.borderGold}`,
                    color: C.gold,
                  }}
                >
                  <SettingsIcon />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2
                  sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                  transition-all duration-150 hover:brightness-110
                  active:scale-[0.97]"
                style={{
                  backgroundColor: "rgba(124,29,29,0.25)",
                  border: "1px solid rgba(192,57,43,0.4)",
                  color: "#E57373",
                }}
              >
                <LogoutIcon />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-5"
            style={{ height: 1, backgroundColor: C.border }} />

          {/* ── Clock Widget ── */}
          <div className="animate-fadeIn" style={{ animationDelay: "60ms" }}>
            <ClockWidget />
          </div>

          {/* ── Nav Cards Grid ── */}
          {hasAnyCard ? (
            <div
              className="grid gap-3 sm:gap-4 mb-4 animate-fadeIn
                grid-cols-1 sm:grid-cols-2"
              style={{ animationDelay: "120ms" }}
            >
              {cards.map((card, i) => (
                <div
                  key={card.key}
                  className="animate-slideUp"
                  style={{ animationDelay: `${140 + i * 60}ms` }}
                >
                  <NavCard
                    title={card.title}
                    icon={card.icon}
                    badge={card.badge}
                    onClick={card.onClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fadeIn mb-4"
              style={{ animationDelay: "120ms" }}>
              <NoAccessMessage />
            </div>
          )}

          {/* ── Self Upload Card ── */}
          {canSelfUpload && (
            <div className="mb-4 animate-fadeIn"
              style={{ animationDelay: "200ms" }}>
              <SelfUploadCard
                canUploadOwnPhoto={canUploadOwnPhoto}
                canUploadOwnIdProof={canUploadOwnIdProof}
                uploading={uploading}
                onPickPhoto={() => setPhotoModal(true)}
                onPickIdProof={() => setIdModal(true)}
                profilePhotoPreview={profilePhotoPreview}
                idProofPreview={idProofPreview}
                idProofUrl={user?.idProofUrl}
              />
            </div>
          )}

          {/* ── Powered By ── */}
          <div
            className="flex items-center justify-center gap-2 mt-8
              animate-fadeIn"
            style={{ animationDelay: "260ms" }}
          >
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
            <span
              className="text-[10px] sm:text-[11px] font-medium
                tracking-widest"
              style={{ color: "rgba(201,162,39,0.5)" }}
            >
              POWERED BY FEATHRTECH
            </span>
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
          </div>

        </div>
      </div>
    </>
  );
}