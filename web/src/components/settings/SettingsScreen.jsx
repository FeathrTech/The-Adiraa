// src/components/settings/SettingsScreen.jsx
"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TimeIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ title, hint, icon, onClick, delay = 0 }) {
  return (
    <div
      className="animate-slideUp w-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onClick}
        className="flex items-center justify-between rounded-2xl px-5 py-4
          sm:py-5 w-full text-left transition-all duration-150
          hover:brightness-110 active:scale-[0.98]"
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
            <p
              className="font-bold text-sm sm:text-base tracking-wide
                leading-tight"
              style={{ color: C.white }}
            >
              {title}
            </p>
            {hint && (
              <p className="text-xs mt-0.5 truncate"
                style={{ color: C.muted }}>
                {hint}
              </p>
            )}
          </div>
        </div>

        <span style={{ color: C.gold, opacity: 0.7, flexShrink: 0 }}>
          <ChevronRightIcon />
        </span>
      </button>
    </div>
  );
}

// ─── Main SettingsScreen ──────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { permissions, logout } = useAuthStore();

  const can = (key) => permissions?.includes(key);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;
    await logout();
    router.replace("/login");
  };

  const navItems = [
    can("role.view") && {
      key: "roles",
      title: "Roles",
      hint: "Manage roles and permission groups",
      icon: <ShieldIcon />,
      onClick: () => router.push("/settings/roles"),
    },
    can("staff.view") && {
      key: "staff",
      title: "Staff",
      hint: "View and manage staff members",
      icon: <PeopleIcon />,
      onClick: () => router.push("/settings/staff"),
    },
    can("settings.attendance.edit") && {
      key: "attendance",
      title: "Attendance Config",
      hint: "Configure shifts, check-in rules and policies",
      icon: <TimeIcon />,
      onClick: () => router.push("/settings/attendance-config"),
    },
    // (can("settings.notifications.view") ||
    //   can("settings.notifications.edit")) && {
    //   key: "notifications",
    //   title: "Notifications",
    //   hint: "Push alerts and notification preferences",
    //   icon: <BellIcon />,
    //   onClick: () => router.push("/settings/notifications"),
    // },
  ].filter(Boolean);

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
      `}</style>

      {/* ── Full screen — centred both axes ── */}
      <div
        className="min-h-screen flex items-center justify-center
          px-4 py-8 sm:px-6 lg:px-10"
        style={{ backgroundColor: C.bg }}
      >
        {/* ── Card — fixed max width, fills height naturally ── */}
        <div
          className="w-full animate-fadeIn"
          style={{ maxWidth: "480px" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-start sm:items-end justify-between mb-5"
          >
            <div>
              <p
                className="text-[11px] sm:text-xs font-bold tracking-[3px]
                  uppercase mb-1"
                style={{ color: C.gold }}
              >
                Admin Portal
              </p>
              <h1
                className="font-extrabold tracking-tight leading-none"
                style={{
                  color: C.white,
                  fontSize: "clamp(28px, 6vw, 48px)",
                }}
              >
                Settings
              </h1>
            </div>

            {/* Back button */}
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 rounded-xl px-3 py-2
                sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm
                transition-all duration-150 hover:brightness-110
                active:scale-[0.97] mt-1"
              style={{
                backgroundColor: C.card,
                border: `1px solid ${C.borderGold}`,
                color: C.gold,
              }}
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>

          {/* ── Divider ── */}
          <div
            className="mb-5"
            style={{ height: 1, backgroundColor: C.border }}
          />

          {/* ── Nav items ── */}
          {navItems.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-10 flex flex-col
                items-center gap-3"
              style={{
                backgroundColor: "rgba(201,162,39,0.07)",
                border: `1px solid ${C.borderGold}`,
              }}
            >
              <div style={{ color: C.muted }}>
                <LockIcon />
              </div>
              <p
                className="text-sm text-center leading-relaxed"
                style={{ color: C.muted }}
              >
                No settings available for your role.
                <br />
                Contact your administrator.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {navItems.map((item, i) => (
                <NavItem
                  key={item.key}
                  title={item.title}
                  hint={item.hint}
                  icon={item.icon}
                  onClick={item.onClick}
                  delay={i * 60}
                />
              ))}
            </div>
          )}

          {/* ── Divider before logout ── */}
          <div
            className="my-5"
            style={{ height: 1, backgroundColor: C.border }}
          />

          {/* ── Logout ── */}
          <div
            className="animate-slideUp"
            style={{
              animationDelay: `${navItems.length * 60 + 80}ms`,
            }}
          >
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full
                rounded-2xl py-4 sm:py-5 font-bold text-sm tracking-widest
                uppercase transition-all duration-150 hover:brightness-110
                active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(124,29,29,0.25)",
                border: "1px solid rgba(192,57,43,0.4)",
                color: "#E57373",
              }}
            >
              <LogoutIcon />
              Sign Out
            </button>
          </div>

          {/* ── Powered By ── */}
          <div
            className="flex items-center justify-center gap-2 mt-8
              animate-fadeIn"
            style={{
              animationDelay: `${navItems.length * 60 + 120}ms`,
            }}
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