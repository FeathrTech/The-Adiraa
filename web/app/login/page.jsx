  // app/login/page.jsx
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Image from "next/image";
  import { loginRequest } from "../../src/api/authApi";
  import { useAuthStore } from "../../src/store/authStore";

  // ─── Palette ─────────────────────────────────────────────────────────────────
  const C = {
    bg: "#0A0A0A",
    card: "#161616",
    gold: "#C9A227",
    goldLight: "#D4AC35",
    goldDim: "rgba(201,162,39,0.15)",
    goldGlow: "rgba(201,162,39,0.08)",
    border: "rgba(201,162,39,0.45)",
    borderDim: "rgba(201,162,39,0.2)",
    white: "#FFFFFF",
    muted: "rgba(255,255,255,0.4)",
    inputBg: "rgba(201,162,39,0.08)",
    surface: "#131313",
    faint: "#333",
  };

  // ─── Support contact details ──────────────────────────────────────────────────
  const SUPPORT = {
    email: "info@feathrtech.com",
    phone: "+91 84489 98434",
    whatsapp: "+9184489 98434",
    website: "https://feathrtech.com",
  };

  // ─── Icons ────────────────────────────────────────────────────────────────────
  function EyeIcon({ open }) {
    return open ? (
      <svg width="18" height="18" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg width="18" height="18" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  function MailIcon() {
    return (
      <svg width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }

  function PhoneIcon() {
    return (
      <svg width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.14 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.07-1.35a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    );
  }

  function WhatsappIcon() {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L0 24l6.335-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.977.994-3.634-.234-.374A9.818 9.818 0 1112 21.818z" />
      </svg>
    );
  }

  function GlobeIcon() {
    return (
      <svg width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    );
  }

  function HeadsetIcon() {
    return (
      <svg width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    );
  }

  function ChevronRightIcon() {
    return (
      <svg width="14" height="14" fill="none" stroke="currentColor"
        strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }

  function CloseIcon() {
    return (
      <svg width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  function ArrowRightIcon() {
    return (
      <svg width="14" height="14" fill="none" stroke="currentColor"
        strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="9 18 15 12 9 6" transform="rotate(180 12 12)" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }

  // ─── Spinner ──────────────────────────────────────────────────────────────────
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

  // ─── Support Modal ────────────────────────────────────────────────────────────
  function SupportModal({ open, onClose }) {
    if (!open) return null;

    const contactActions = [
      {
        icon: <MailIcon />,
        label: "Email Us",
        value: SUPPORT.email,
        href: `mailto:${SUPPORT.email}`,
        color: C.gold,
        bg: C.goldGlow,
        border: C.borderDim,
      },
      {
        icon: <PhoneIcon />,
        label: "Call Us",
        value: SUPPORT.phone,
        href: `tel:${SUPPORT.phone}`,
        color: C.gold,
        bg: C.goldGlow,
        border: C.borderDim,
      },
      {
        icon: <WhatsappIcon />,
        label: "WhatsApp",
        value: SUPPORT.phone,
        href: `https://wa.me/${SUPPORT.whatsapp}`,
        color: "#25D366",
        bg: "rgba(37,211,102,0.1)",
        border: "rgba(37,211,102,0.3)",
      },
      {
        icon: <GlobeIcon />,
        label: "Website",
        value: SUPPORT.website,
        href: SUPPORT.website,
        color: C.gold,
        bg: C.goldGlow,
        border: C.borderDim,
      },
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
        style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
        onClick={onClose}
      >
        <div
          className="w-full rounded-3xl p-6 animate-fadeIn"
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.borderDim}`,
            maxWidth: "420px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 42, height: 42,
                  backgroundColor: C.goldDim,
                  border: `1px solid ${C.borderDim}`,
                  color: C.gold,
                }}
              >
                <HeadsetIcon />
              </div>
              <div>
                <p className="font-bold text-[15px] leading-tight"
                  style={{ color: C.white }}>
                  Contact FeathrTech
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  We're here to help
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg p-1.5
                transition-opacity hover:opacity-70"
              style={{ backgroundColor: C.faint, color: C.muted }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Divider */}
          <div className="mb-5"
            style={{ height: 1, backgroundColor: "rgba(201,162,39,0.15)" }} />

          {/* Contact rows */}
          {contactActions.map((action, i) => (
            <a
              key={i}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2.5
                transition-opacity hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: action.bg,
                border: `1px solid ${action.border}`,
                textDecoration: "none",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 36, height: 36,
                  backgroundColor: action.bg,
                  border: `1px solid ${action.border}`,
                  color: action.color,
                }}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] leading-tight"
                  style={{ color: C.white }}>
                  {action.label}
                </p>
                <p className="text-[11px] mt-0.5 truncate"
                  style={{ color: C.muted }}>
                  {action.value}
                </p>
              </div>
              <span className="opacity-70 shrink-0" style={{ color: action.color }}>
                <ChevronRightIcon />
              </span>
            </a>
          ))}

          {/* Footer */}
          <p className="text-center text-[11px] mt-3 leading-relaxed"
            style={{ color: C.muted }}>
            Available Mon – Sat, 9 AM to 6 PM IST
          </p>
        </div>
      </div>
    );
  }

  // ─── Main Login Page ──────────────────────────────────────────────────────────
  export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [supportVisible, setSupportVisible] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
      setError("");
      if (!username || !password) {
        setError("Please fill in all fields.");
        return;
      }
      try {
        setLoading(true);
        const data = await loginRequest(username, password);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        login(data.user, data.token);
        router.push("/dashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Invalid username or password.");
      } finally {
        setLoading(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter") handleLogin();
    };

    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1);    }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
          }
          input:-webkit-autofill,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px rgba(201,162,39,0.08) inset !important;
            -webkit-text-fill-color: #ffffff !important;
            caret-color: #ffffff;
          }
          input::placeholder { color: rgba(201,162,39,0.7); }
        `}</style>

        <div
          className="relative min-h-screen flex flex-col items-center
            justify-center overflow-hidden px-4 py-10 sm:px-6"
          style={{ backgroundColor: C.bg }}
        >
          {/* Radial gold glow */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              width: "110vw", height: "110vw",
              top: "10%", left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(201,162,39,0.04)",
            }}
          />

          {/* ── LOGO AREA ── */}
          <div className="flex flex-col items-center mb-8 sm:mb-10 animate-fadeIn">
            <div
              className="flex items-center justify-center rounded-full mb-5"
              style={{
                width: "clamp(120px, 22vw, 164px)",
                height: "clamp(120px, 22vw, 164px)",
                backgroundColor: C.goldGlow,
                border: `1px solid ${C.borderDim}`,
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "clamp(100px, 18vw, 140px)",
                  height: "clamp(100px, 18vw, 140px)",
                  backgroundColor: C.goldDim,
                  border: "1px solid rgba(201,162,39,0.3)",
                }}
              >
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
              <div className="h-px w-7 sm:w-10"
                style={{ backgroundColor: C.gold }} />
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: C.gold }} />
              <div className="h-px w-7 sm:w-10"
                style={{ backgroundColor: C.gold }} />
            </div>
          </div>

          {/* ── CARD ── */}
          <div
            className="w-full animate-fadeIn"
            style={{
              maxWidth: "clamp(300px, 88vw, 460px)",
              backgroundColor: C.card,
              border: `1px solid ${C.borderDim}`,
              borderRadius: 24,
              padding: "clamp(24px, 5vw, 40px) clamp(20px, 6vw, 36px)",
            }}
          >
            {/* Title */}
            <h2
              className="text-center font-semibold tracking-wide mb-7
                text-[18px] sm:text-[20px] md:text-[24px]"
              style={{ color: C.gold }}
            >
              Welcome Back
            </h2>

            {/* Error Banner */}
            {error && (
              <div
                className="mb-4 px-4 py-2.5 rounded-xl text-sm text-center animate-fadeIn"
                style={{
                  backgroundColor: "rgba(220,38,38,0.1)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  color: "#FCA5A5",
                }}
              >
                {error}
              </div>
            )}

            {/* Username */}
            <div
              className="flex items-center rounded-xl px-3.5 mb-4
                transition-all duration-200"
              style={{
                backgroundColor: C.inputBg,
                border: `1px solid ${focusedField === "username" ? C.gold : C.border}`,
                boxShadow: focusedField === "username"
                  ? "0 0 0 3px rgba(201,162,39,0.12)" : "none",
              }}
            >
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={onKeyDown}
                autoComplete="username"
                className="flex-1 bg-transparent outline-none text-sm sm:text-base py-3.5"
                style={{ color: C.white, caretColor: C.gold }}
              />
            </div>

            {/* Password */}
            <div
              className="flex items-center rounded-xl px-3.5 mb-6
                transition-all duration-200"
              style={{
                backgroundColor: C.inputBg,
                border: `1px solid ${focusedField === "password" ? C.gold : C.border}`,
                boxShadow: focusedField === "password"
                  ? "0 0 0 3px rgba(201,162,39,0.12)" : "none",
              }}
            >
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={onKeyDown}
                autoComplete="current-password"
                className="flex-1 bg-transparent outline-none text-sm sm:text-base py-3.5"
                style={{ color: C.white, caretColor: C.gold }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="p-1 ml-2 transition-opacity hover:opacity-70"
                style={{ color: C.gold }}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-black
                text-sm sm:text-base tracking-wide transition-all duration-200
                hover:brightness-110 active:scale-[0.98]
                disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: loading ? "rgba(201,162,39,0.5)" : C.gold,
                letterSpacing: "0.5px",
              }}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Signing in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>

            {/* ── Divider ── */}
            

          </div>

          {/* Need Help */}
          <button
            onClick={() => setSupportVisible(true)}
            className="mt-5 text-xs sm:text-sm transition-opacity
              hover:opacity-80 cursor-pointer"
            style={{ color: C.muted }}
          >
            Need help? Contact support
          </button>

          {/* Powered By */}
          <div className="flex items-center gap-2 mt-4">
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
            <span
              className="text-[10px] sm:text-[11px] font-medium tracking-widest"
              style={{ color: "rgba(201,162,39,0.5)" }}
            >
              POWERED BY FEATHRTECH
            </span>
            <div className="h-px w-4"
              style={{ backgroundColor: "rgba(201,162,39,0.3)" }} />
          </div>
        </div>

        {/* Support Modal */}
        <SupportModal
          open={supportVisible}
          onClose={() => setSupportVisible(false)}
        />
      </>
    );
  }