// src/components/StaffDashboardScreen.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { can } from "../config/permissionMap";
import api from "../api/axios";
import { uploadOwnProfilePhoto, uploadOwnIdProof } from "../api/userApi";

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
    muted: "#666",
    faint: "#333",
    red: "#E57373",
    green: "#5DBE8A",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function CameraIcon({ size = 20, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}
function DocumentIcon({ size = 20, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
function IdCardIcon({ size = 20, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <circle cx="8" cy="12" r="2" />
            <path d="M14 9h4M14 12h4M14 15h2" />
        </svg>
    );
}
function UploadIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
    );
}
function ClockIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function LogOutIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}
function MobileIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    );
}
function HistoryIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
    );
}
function Spinner({ size = 18, color = C.gold }) {
    return (
        <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
            style={{ animation: "sd-spin .8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
            <path fill={color} style={{ opacity: 0.75 }}
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
    // ✅ Keep onDone in a ref — always points to latest version
    const onDoneRef = useRef(onDone);
    useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

    useEffect(() => {
        const t = setTimeout(() => onDoneRef.current(), 2800);
        return () => clearTimeout(t);
    }, []); // ✅ empty deps is now safe — ref never goes stale

    const isErr = type === "error";
    return (
        <div style={{
            position: "fixed", bottom: 28, left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: isErr ? "rgba(229,115,115,0.15)" : "rgba(93,190,138,0.15)",
            border: `1px solid ${isErr ? "rgba(229,115,115,0.4)" : "rgba(93,190,138,0.4)"}`,
            borderRadius: 12, padding: "12px 22px",
            color: isErr ? C.red : C.green,
            fontWeight: 600, fontSize: 13,
            zIndex: 9999, whiteSpace: "nowrap",
            animation: "sd-fadeIn .25s ease",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
            {message}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sc = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sc}`;
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffDashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const permissions = useAuthStore((s) => s.permissions) || [];
    const logout = useAuthStore((s) => s.logout);

    const canCheckIn = can(permissions, "attendance.checkin");
    const canCheckOut = can(permissions, "attendance.checkout");
    const canViewOwn = can(permissions, "attendance.view.own");

    const canUploadOwnPhoto = !!user?.allowSelfPhotoUpload;
    const canUploadOwnIdProof = !!user?.allowSelfIdUpload;
    const canSelfUpload = canUploadOwnPhoto || canUploadOwnIdProof;

    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState(null);
    const [workingSeconds, setWorkingSeconds] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const [profilePhotoPreview, setProfilePhotoPreview] = useState(
        () => user?.profilePhotoUrl ?? null
    );
    const [idProofPreview, setIdProofPreview] = useState(
        () => (user?.idProofUrl && !user.idProofUrl.endsWith(".pdf"))
            ? user.idProofUrl : null
    );

    const showToast = (message, type = "success") => setToast({ message, type });

    // ── Load attendance ────────────────────────────────────────────────────────
    const loadAttendance = useCallback(async () => {
        if (!user) return;
        if (!canViewOwn && !canCheckIn && !canCheckOut) { setLoading(false); return; }
        try {
            setLoading(true);
            const res = await api.get("/attendance/today");
            setAttendance(res.data);
            if (res.data?.workingMinutes) setWorkingSeconds(res.data.workingMinutes * 60);
        } catch (err) {
            showToast(err?.response?.data?.message || "Failed to load attendance", "error");
        } finally {
            setLoading(false);
        }
    }, [user, canViewOwn, canCheckIn, canCheckOut]);

    useEffect(() => { loadAttendance(); }, [loadAttendance]);

    // ── Timer ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!attendance?.checkedIn || attendance?.checkedOut) return;
        const id = setInterval(() => setWorkingSeconds((p) => p + 1), 1000);
        return () => clearInterval(id);
    }, [attendance?.checkedIn, attendance?.checkedOut]);

    // ── Upload photo ───────────────────────────────────────────────────────────
    const photoInputRef = useRef(null);
    const idInputRef = useRef(null);

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setProfilePhotoPreview(previewUrl);
        try {
            setUploading(true);
            const updated = await uploadOwnProfilePhoto(file); // ← fixed
            if (updated?.profilePhotoUrl) setProfilePhotoPreview(updated.profilePhotoUrl);
            showToast("Profile photo updated");
        } catch (err) {
            showToast(err?.response?.data?.message || "Upload failed", "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleIdChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isPdf = file.type === "application/pdf";
        if (!isPdf) setIdProofPreview(URL.createObjectURL(file));
        try {
            setUploading(true);
            const updated = await uploadOwnIdProof(file); // ← fixed
            if (updated?.idProofUrl && !updated.idProofUrl.endsWith(".pdf"))
                setIdProofPreview(updated.idProofUrl);
            showToast("ID proof uploaded");
        } catch (err) {
            showToast(err?.response?.data?.message || "Upload failed", "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // ── Status helpers ─────────────────────────────────────────────────────────
    const getStatus = () => {
        if (!canViewOwn) return "--";
        if (!attendance?.checkedIn) return "Not Checked In";
        if (attendance?.checkedOut) return "Completed";
        if (attendance?.isLate) return "Late";
        return "Present";
    };

    const statusColor = () => {
        const s = getStatus();
        if (s === "Present") return C.goldLight;
        if (s === "Late") return "#E8734A";
        if (s === "Completed") return C.green;
        return C.muted;
    };

    const isActive = attendance?.checkedIn && !attendance?.checkedOut;

    if (!user) return null;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <style>{`
          @keyframes sd-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @keyframes sd-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sd-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sd-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .sd-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          padding: 24px 20px 60px;
          animation: sd-fadeIn .35s ease forwards;
        }

        .sd-inner {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .sd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sd-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 6px;
        }
        .sd-greeting {
          color: ${C.white};
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.4px;
          margin: 0;
          line-height: 1.15;
        }
        .sd-name {
          color: ${C.gold};
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.4px;
          margin: 0;
        }
        @media (min-width: 768px) {
          .sd-greeting, .sd-name { font-size: 32px; }
          .sd-outer { padding: 36px 32px 60px; }
        }

        /* ── Main grid ── */
        .sd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (min-width: 768px) {
          .sd-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* ── Cards ── */
        .sd-card {
          background-color: ${C.card};
          border-radius: 20px;
          border: 1px solid ${C.borderGold};
          padding: 22px 20px;
        }
        .sd-card-label {
          color: ${C.muted};
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin: 0 0 10px;
        }

        /* ── Shift card ── */
        .sd-shift-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sd-shift-time {
          color: ${C.white};
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin: 0;
        }
        .sd-dot-ring {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          border-width: 1px;
          border-style: solid;
          align-items: center;
          justify-content: center;
        }
        .sd-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        /* ── Hero timer ── */
        .sd-hero {
          background-color: ${C.surface};
          border-radius: 20px;
          border: 1px solid ${C.borderGold};
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .sd-timer {
          font-size: 52px;
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1;
          margin: 10px 0;
          font-variant-numeric: tabular-nums;
          font-family: monospace;
        }
        @media (min-width: 768px) {
          .sd-timer { font-size: 64px; }
        }
        .sd-status-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 999px;
          background-color: rgba(0,0,0,0.4);
          border-width: 1px;
          border-style: solid;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 10px;
        }

        /* ── Mobile-only CTA buttons ── */
        .sd-mobile-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .sd-mobile-btn {
          border-radius: 18px;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: not-allowed;
          opacity: 0.45;
          border: 1px solid ${C.borderGold};
          background: transparent;
          transition: none;
        }
        .sd-mobile-btn-primary {
          background-color: ${C.faint};
          border: none;
        }
        .sd-mobile-btn-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .sd-mobile-only-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: rgba(201,162,39,0.07);
          border: 1px solid ${C.borderGold};
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 16px;
        }

        /* ── Upload card ── */
        .sd-upload-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: ${C.surface};
          border-radius: 12px;
          border: 1px solid ${C.border};
          padding: 13px 14px;
          cursor: pointer;
          transition: border-color .15s, background-color .15s;
        }
        .sd-upload-row:hover {
          border-color: ${C.borderGold};
          background-color: #1e1e1e;
        }
        .sd-upload-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: rgba(201,162,39,0.1);
          border: 1px solid ${C.borderGold};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* ── Bottom row ── */
        .sd-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 640px) {
          .sd-bottom { flex-direction: row; }
          .sd-bottom > * { flex: 1; }
        }

        .sd-history-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid ${C.borderGold};
          border-radius: 16px;
          padding: 14px 20px;
          background: transparent;
          color: ${C.gold};
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: filter .15s, background-color .15s;
        }
        .sd-history-btn:hover {
          background-color: rgba(201,162,39,0.07);
          filter: brightness(1.1);
        }

        .sd-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: rgba(124,29,29,0.25);
          border: 1px solid rgba(192,57,43,0.4);
          border-radius: 16px;
          padding: 14px 20px;
          color: ${C.red};
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter .15s;
        }
        .sd-logout-btn:hover { filter: brightness(1.15); }

        /* ── Confirm overlay ── */
        .sd-confirm-overlay {
          position: fixed; inset: 0;
          background-color: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center;
          z-index: 9000; padding: 20px;
        }
        .sd-confirm-box {
          background-color: ${C.surface};
          border: 1px solid ${C.borderGold};
          border-radius: 20px;
          padding: 28px 28px 22px;
          width: 100%; max-width: 360px;
          animation: sd-fadeIn .2s ease;
        }

        /* inputs hidden */
        .sd-file-input { display: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.25); border-radius: 4px; }
      `}</style>

            <div className="sd-outer">
                <div className="sd-inner">

                    {/* ── Header ── */}
                    <div className="sd-header">
                        <div>
                            <p className="sd-eyebrow">Staff Portal</p>
                            <p className="sd-greeting">{getGreeting()},</p>
                            <p className="sd-name">{user?.name} ✦</p>
                        </div>
                        <button className="sd-logout-btn" onClick={() => setConfirmLogout(true)}>
                            <LogOutIcon size={16} color={C.red} />
                            Sign Out
                        </button>
                    </div>

                    {/* ── Mobile-only notice ── */}
                    {(canCheckIn || canCheckOut) && (
                        <div className="sd-mobile-only-note">
                            <MobileIcon size={15} color={C.gold} />
                            <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
                                Check-in &amp; Check-out are only available on the mobile app
                            </span>
                        </div>
                    )}

                    {/* ── Main grid ── */}
                    <div className="sd-grid">

                        {/* Left col */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                            {/* Shift card */}
                            <div className="sd-card">
                                <p className="sd-card-label">Today's Shift</p>
                                <div className="sd-shift-row">
                                    <p className="sd-shift-time">
                                        {user?.shiftStartTime || "--"}
                                        <span style={{ color: C.goldDim }}> – </span>
                                        {user?.shiftEndTime || "--"}
                                    </p>
                                    <div
                                        className="sd-dot-ring"
                                        style={{
                                            backgroundColor: isActive ? "rgba(201,162,39,0.12)" : "rgba(50,50,50,0.5)",
                                            borderColor: isActive ? C.borderGold : C.border,
                                        }}
                                    >
                                        <div
                                            className="sd-dot"
                                            style={{
                                                backgroundColor: isActive ? C.gold : C.faint,
                                                animation: isActive ? "sd-pulse 2s ease infinite" : "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons — disabled on web */}
                            {(canCheckIn || canCheckOut) && (
                                <div className="sd-mobile-btns">
                                    {canCheckIn && (
                                        <div
                                            className="sd-mobile-btn sd-mobile-btn-primary"
                                            title="Only available on mobile app"
                                        >
                                            <span style={{ fontSize: 20, color: C.muted }}>→</span>
                                            <span className="sd-mobile-btn-label" style={{ color: C.muted }}>Check In</span>
                                        </div>
                                    )}
                                    {canCheckOut && (
                                        <div
                                            className="sd-mobile-btn"
                                            title="Only available on mobile app"
                                        >
                                            <span style={{ fontSize: 20, color: C.muted }}>✓</span>
                                            <span className="sd-mobile-btn-label" style={{ color: C.muted }}>Check Out</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Self upload */}
                            {canSelfUpload && (
                                <div style={{
                                    backgroundColor: C.card,
                                    borderRadius: 18,
                                    border: `1px solid ${C.borderGold}`,
                                    padding: "18px 18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}>
                                    <p className="sd-card-label" style={{ margin: 0 }}>My Documents</p>

                                    {/* Profile Photo */}
                                    {canUploadOwnPhoto && (
                                        <>
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="sd-file-input"
                                                onChange={handlePhotoChange}
                                            />
                                            <div
                                                className="sd-upload-row"
                                                onClick={() => !uploading && photoInputRef.current?.click()}
                                                style={{ opacity: uploading ? 0.6 : 1 }}
                                            >
                                                <div className="sd-upload-avatar">
                                                    {profilePhotoPreview ? (
                                                        <img
                                                            src={profilePhotoPreview}
                                                            alt="Profile"
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <CameraIcon size={18} color={C.gold} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>
                                                        Upload Profile Photo
                                                    </div>
                                                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                                                        JPG, PNG supported
                                                    </div>
                                                </div>
                                                {uploading
                                                    ? <Spinner size={16} color={C.gold} />
                                                    : <UploadIcon size={16} color={C.muted} />}
                                            </div>
                                        </>
                                    )}

                                    {/* ID Proof */}
                                    {canUploadOwnIdProof && (
                                        <>
                                            <input
                                                ref={idInputRef}
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="sd-file-input"
                                                onChange={handleIdChange}
                                            />
                                            <div
                                                className="sd-upload-row"
                                                onClick={() => !uploading && idInputRef.current?.click()}
                                                style={{ opacity: uploading ? 0.6 : 1 }}
                                            >
                                                <div className="sd-upload-avatar">
                                                    {idProofPreview ? (
                                                        <img
                                                            src={idProofPreview}
                                                            alt="ID"
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : user?.idProofUrl ? (
                                                        <DocumentIcon size={18} color={C.gold} />
                                                    ) : (
                                                        <IdCardIcon size={18} color={C.gold} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>
                                                        Upload ID Proof
                                                    </div>
                                                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                                                        Image or PDF
                                                    </div>
                                                </div>
                                                {uploading
                                                    ? <Spinner size={16} color={C.gold} />
                                                    : <UploadIcon size={16} color={C.muted} />}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right col — Hero timer */}
                        <div className="sd-hero">
                            <ClockIcon size={22} color={isActive ? C.gold : C.muted} />
                            <p className="sd-card-label" style={{ margin: "10px 0 0" }}>Working Hours</p>
                            <div
                                className="sd-timer"
                                style={{ color: isActive ? C.gold : C.faint }}
                            >
                                {attendance?.checkedIn ? formatTime(workingSeconds) : "00:00:00"}
                            </div>
                            <div
                                className="sd-status-badge"
                                style={{
                                    color: statusColor(),
                                    borderColor: statusColor() + "55",
                                }}
                            >
                                {getStatus()}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom row ── */}
                    <div className="sd-bottom">
                        {canViewOwn && (
                            <button
                                className="sd-history-btn"
                                onClick={() => router.push("/attendance/history")}
                            >
                                <HistoryIcon size={16} color={C.gold} />
                                View Attendance Records
                            </button>
                        )}
                        <button
                            className="sd-logout-btn"
                            onClick={() => setConfirmLogout(true)}
                        >
                            <LogOutIcon size={16} color={C.red} />
                            Sign Out
                        </button>
                    </div>

                </div>
            </div>

            {/* ── Confirm logout ── */}
            {confirmLogout && (
                <div className="sd-confirm-overlay">
                    <div className="sd-confirm-box">
                        <p style={{
                            color: C.white, fontSize: 15,
                            fontWeight: 600, margin: "0 0 20px", lineHeight: 1.5,
                        }}>
                            Are you sure you want to sign out?
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setConfirmLogout(false)}
                                style={{
                                    backgroundColor: C.faint,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: "9px 18px",
                                    color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => { setConfirmLogout(false); await logout(); }}
                                style={{
                                    backgroundColor: "rgba(229,115,115,0.15)",
                                    border: "1px solid rgba(229,115,115,0.4)",
                                    borderRadius: 10, padding: "9px 18px",
                                    color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer",
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
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