// app/signup/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registerTenantRequest } from "../../src/api/authApi";
import { useAuthStore } from "../../src/store/authStore";

// ─── Palette (matches LoginScreen) ───────────────────────────────────────────
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
  inputBg: "rgba(201,162,39,0.08)",
  faint: "#333",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ open, username, onContinue }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      <div
        className="w-full rounded-3xl p-7 animate-fadeIn flex flex-col items-center"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.borderDim}`,
          maxWidth: "400px",
        }}
      >
        {/* Checkmark circle */}
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{
            width: 64,
            height: 64,
            backgroundColor: C.goldDim,
            border: `1px solid ${C.borderDim}`,
          }}
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke={C.gold}
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3
          className="text-lg font-bold mb-2 text-center"
          style={{ color: C.white }}
        >
          Account Created!
        </h3>

        <p
          className="text-sm text-center mb-1 leading-relaxed"
          style={{ color: C.muted }}
        >
          Your company account has been set up successfully.
        </p>

        {/* Username highlight */}
        {username && (
          <div
            className="mt-4 mb-5 px-5 py-3 rounded-xl w-full text-center"
            style={{
              backgroundColor: C.goldGlow,
              border: `1px solid ${C.borderDim}`,
            }}
          >
            <p
              className="text-[11px] mb-1 tracking-widest uppercase"
              style={{ color: C.muted }}
            >
              Your Login Username
            </p>
            <p
              className="text-base font-bold tracking-wide"
              style={{ color: C.gold }}
            >
              {username}
            </p>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full rounded-xl py-3.5 font-bold text-black
            text-sm tracking-wide transition-all duration-200
            hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: C.gold }}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Input Row Component ──────────────────────────────────────────────────────
function InputRow({
  type = "text",
  placeholder,
  value,
  onChange,
  isPhone,
  focused,
  onFocus,
  onBlur,
  onKeyDown,
  rightSlot,
  maxLength,
}) {
  const handleChange = (e) => {
    if (isPhone) {
      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
      onChange(digits);
    } else {
      onChange(e.target.value);
    }
  };

  const phoneCount = isPhone ? (value ? value.length : 0) : 0;

  return (
    <div
      className="flex items-center rounded-xl px-3.5 mb-4
        transition-all duration-200"
      style={{
        backgroundColor: C.inputBg,
        border: `1px solid ${focused ? C.gold : C.border}`,
        boxShadow: focused ? "0 0 0 3px rgba(201,162,39,0.12)" : "none",
      }}
    >
      <input
        type={type}
        inputMode={isPhone ? "numeric" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        maxLength={isPhone ? 10 : maxLength}
        autoComplete="off"
        className="flex-1 bg-transparent outline-none
          text-sm sm:text-base py-3.5"
        style={{
          color: C.white,
          caretColor: C.gold,
        }}
      />

      {/* Phone counter */}
      {isPhone && (
        <span
          className="text-xs font-semibold ml-2 shrink-0 tabular-nums"
          style={{
            color: phoneCount === 10 ? C.gold : C.muted,
          }}
        >
          {phoneCount}/10
        </span>
      )}

      {/* Right slot (eye toggle etc.) */}
      {!isPhone && rightSlot && (
        <div className="ml-2 shrink-0">{rightSlot}</div>
      )}
    </div>
  );
}

// ─── Main Signup Page ─────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");
  const [successModal, setSuccessModal] = useState({
    open: false,
    username: "",
  });

  // ─── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    if (!companyName.trim()) return "Company name is required.";
    if (!name.trim()) return "Owner name is required.";
    if (!mobile.trim()) return "Mobile number is required.";
    if (mobile.length !== 10) return "Mobile number must be 10 digits.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const data = await registerTenantRequest({
        companyName,
        name,
        mobile,
        password,
      });

      if (!data?.token || !data?.user) {
        throw new Error("Something went wrong. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);

      // Show success modal with generated username
      setSuccessModal({ open: true, username: data.user.username });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSignup();
  };

  return (
    <>
      {/* ── Keyframes + autofill override ── */}
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
        /* placeholder gold color */
        input::placeholder { color: rgba(201,162,39,0.7); }
      `}</style>

      {/* ── Page wrapper ── */}
      <div
        className="relative min-h-screen flex flex-col items-center
          justify-center overflow-hidden px-4 py-10 sm:px-6"
        style={{ backgroundColor: C.bg }}
      >
        {/* Radial gold glow */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: "110vw",
            height: "110vw",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(201,162,39,0.03)",
          }}
        />

        {/* ── LOGO ── */}
        <div className="flex flex-col items-center mb-7 animate-fadeIn">
          {/* Outer glow ring */}
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{
              width: "clamp(90px, 14vw, 120px)",
              height: "clamp(90px, 14vw, 120px)",
              backgroundColor: C.goldGlow,
              border: `1px solid ${C.borderDim}`,
            }}
          >
            {/* Inner ring */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: "clamp(72px, 11vw, 98px)",
                height: "clamp(72px, 11vw, 98px)",
                backgroundColor: C.goldDim,
                border: "1px solid rgba(201,162,39,0.3)",
              }}
            >
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: "clamp(54px, 8vw, 74px)",
                  height: "clamp(54px, 8vw, 74px)",
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
              className="h-px w-6 sm:w-8"
              style={{ backgroundColor: C.gold }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: C.gold }}
            />
            <div
              className="h-px w-6 sm:w-8"
              style={{ backgroundColor: C.gold }}
            />
          </div>
        </div>

        {/* ── CARD ── */}
        <div
          className="w-full animate-fadeIn"
          style={{
            maxWidth: "clamp(300px, 88vw, 480px)",
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
            Create Company Account
          </h2>

          {/* ── Error Banner ── */}
          {error && (
            <div
              className="mb-4 px-4 py-2.5 rounded-xl text-sm text-center
                animate-fadeIn"
              style={{
                backgroundColor: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Company Name ── */}
          <InputRow
            placeholder="Company Name"
            value={companyName}
            onChange={setCompanyName}
            focused={focused === "company"}
            onFocus={() => setFocused("company")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
          />

          {/* ── Owner Name ── */}
          <InputRow
            placeholder="Your Name"
            value={name}
            onChange={setName}
            focused={focused === "name"}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
          />

          {/* ── Mobile ── */}
          <InputRow
            placeholder="Mobile Number"
            value={mobile}
            onChange={setMobile}
            isPhone
            focused={focused === "mobile"}
            onFocus={() => setFocused("mobile")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
          />

          {/* ── Password ── */}
          <InputRow
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            focused={focused === "password"}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="p-1 transition-opacity hover:opacity-70"
                style={{ color: C.gold }}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPass} />
              </button>
            }
          />

          {/* ── Submit Button ── */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl py-3.5 font-bold text-black
              text-sm sm:text-base tracking-wide transition-all duration-200
              hover:brightness-110 active:scale-[0.98]
              disabled:cursor-not-allowed flex items-center justify-center gap-2
              mt-2 mb-5"
            style={{
              backgroundColor: loading ? "rgba(201,162,39,0.5)" : C.gold,
              letterSpacing: "0.5px",
            }}
          >
            {loading ? (
              <>
                <Spinner />
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>

          {/* ── Back to Login ── */}
          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center justify-center gap-1.5
              transition-opacity hover:opacity-70 py-1"
            style={{ color: C.muted }}
          >
            <ArrowLeftIcon />
            <span className="text-xs sm:text-sm">Back to Login</span>
          </button>
        </div>

        {/* ── Need Help ── */}
        <p
          className="mt-5 text-xs sm:text-sm"
          style={{ color: C.muted }}
        >
          Need help? Contact support
        </p>

        {/* ── Powered By ── */}
        <div className="flex items-center gap-2 mt-4">
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

      {/* ── Success Modal ── */}
      <SuccessModal
        open={successModal.open}
        username={successModal.username}
        onContinue={() => {
          setSuccessModal({ open: false, username: "" });
          router.push("/dashboard");
        }}
      />
    </>
  );
}