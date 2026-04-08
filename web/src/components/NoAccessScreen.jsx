// src/components/dashboard/NoAccessScreen.jsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0A",
  card: "#161616",
  gold: "#C9A227",
  goldDim: "rgba(201,162,39,0.15)",
  goldGlow: "rgba(201,162,39,0.08)",
  border: "rgba(201,162,39,0.45)",
  borderDim: "rgba(201,162,39,0.2)",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── NoAccessScreen ───────────────────────────────────────────────────────────
export default function NoAccessScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out?"
    );
    if (!confirmed) return;
    await logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div
        className="relative min-h-screen flex flex-col items-center
          justify-center overflow-hidden px-4 py-10 sm:px-6"
        style={{ backgroundColor: C.bg }}
      >
        {/* ── Radial glow ── */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: "110vw",
            height: "110vw",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(201,162,39,0.04)",
          }}
        />

        {/* ── LOGO AREA ── */}
        <div className="flex flex-col items-center mb-8 sm:mb-10 animate-fadeIn">
          {/* Outer glow ring */}
          <div
            className="flex items-center justify-center rounded-full mb-5"
            style={{
              width: "clamp(120px, 22vw, 164px)",
              height: "clamp(120px, 22vw, 164px)",
              backgroundColor: C.goldGlow,
              border: `1px solid ${C.borderDim}`,
            }}
          >
            {/* Inner ring */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: "clamp(100px, 18vw, 140px)",
                height: "clamp(100px, 18vw, 140px)",
                backgroundColor: C.goldDim,
                border: "1px solid rgba(201,162,39,0.3)",
              }}
            >
              {/* Logo */}
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: "clamp(80px, 14vw, 116px)",
                  height: "clamp(80px, 14vw, 116px)",
                }}
              >
                <Image
                  src="/images/adiraa.png"
                  alt="Adiraa Logo"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Decorative gold line */}
          <div className="flex items-center gap-2" style={{ opacity: 0.6 }}>
            <div
              className="h-px w-7 sm:w-10"
              style={{ backgroundColor: C.gold }}
            />
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: C.gold }}
            />
            <div
              className="h-px w-7 sm:w-10"
              style={{ backgroundColor: C.gold }}
            />
          </div>
        </div>

        {/* ── CARD ── */}
        <div
          className="w-full flex flex-col items-center animate-fadeIn"
          style={{
            maxWidth: "clamp(300px, 88vw, 460px)",
            backgroundColor: C.card,
            border: `1px solid ${C.borderDim}`,
            borderRadius: 24,
            padding: "clamp(24px, 5vw, 40px) clamp(20px, 6vw, 36px)",
          }}
        >
          {/* Lock icon circle */}
          <div
            className="flex items-center justify-center rounded-full mb-5"
            style={{
              width: "clamp(52px, 8vw, 72px)",
              height: "clamp(52px, 8vw, 72px)",
              backgroundColor: "rgba(201,162,39,0.1)",
              border: `1px solid ${C.borderDim}`,
              color: C.gold,
            }}
          >
            <LockIcon />
          </div>

          {/* Heading */}
          <h2
            className="font-bold text-center tracking-wide mb-3
              text-[18px] sm:text-[20px] md:text-[22px]"
            style={{ color: C.gold }}
          >
            No Access
          </h2>

          {/* Subtext */}
          <p
            className="text-center leading-relaxed mb-8
              text-[13px] sm:text-[15px]"
            style={{ color: C.muted }}
          >
            Your account doesn't have access to any dashboard.
            <br className="hidden sm:block" />
            Please contact your admin to get the required permissions.
          </p>

          {/* Divider */}
          <div
            className="w-full mb-6"
            style={{
              height: 1,
              backgroundColor: "rgba(201,162,39,0.15)",
            }}
          />

          {/* Sign Out button */}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl py-3.5 font-bold
              text-sm sm:text-base tracking-wide transition-all duration-200
              hover:brightness-110 active:scale-[0.98]
              flex items-center justify-center gap-2"
            style={{
              backgroundColor: C.redBg,
              border: `1px solid ${C.redBorder}`,
              color: C.red,
              letterSpacing: "0.4px",
            }}
          >
            <LogoutIcon />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── Powered By ── */}
        <div className="flex items-center gap-2 mt-7 animate-fadeIn">
          <div
            className="h-px w-4"
            style={{ backgroundColor: "rgba(201,162,39,0.3)" }}
          />
          <span
            className="text-[10px] sm:text-[11px] font-medium tracking-widest"
            style={{ color: "rgba(201,162,39,0.5)" }}
          >
            POWERED BY FEATHRTECH
          </span>
          <div
            className="h-px w-4"
            style={{ backgroundColor: "rgba(201,162,39,0.3)" }}
          />
        </div>
      </div>
    </>
  );
}