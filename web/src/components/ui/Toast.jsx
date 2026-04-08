// src/components/ui/Toast.jsx
"use client";

import { useEffect, useRef } from "react";

const C = {
  green: "#5DBE8A",
  red: "#E57373",
  white: "#FFFFFF",
};

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

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Toast({ toast, onClose }) {
  const progressRef = useRef(null);

  useEffect(() => {
    if (!toast || !progressRef.current) return;
    // Reset then animate
    progressRef.current.style.transition = "none";
    progressRef.current.style.transform = "scaleX(1)";
    // Force reflow
    void progressRef.current.offsetWidth;
    progressRef.current.style.transition = "transform 3.5s linear";
    progressRef.current.style.transform = "scaleX(0)";
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const accentColor = isError ? C.red : C.green;

  return (
    <>
      <style>{`
        @keyframes toastDrop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-24px) scale(0.94); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(5px) scale(1.01); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); }
        }
        .toast-drop {
          animation: toastDrop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div
        className="toast-drop"
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          zIndex: 99999,
          width: "min(420px, 92vw)",
          pointerEvents: "auto",
        }}
      >
        {/* Main pill */}
        <div
          style={{
            backgroundColor: isError
              ? "rgba(20,10,10,0.97)"
              : "rgba(10,18,12,0.97)",
            borderRadius: 18,
            border: `1px solid ${isError
              ? "rgba(229,115,115,0.5)"
              : "rgba(93,190,138,0.5)"}`,
            boxShadow: isError
              ? "0 10px 40px rgba(229,115,115,0.18), 0 2px 10px rgba(0,0,0,0.7)"
              : "0 10px 40px rgba(93,190,138,0.18), 0 2px 10px rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: isError
                ? "rgba(229,115,115,0.15)"
                : "rgba(93,190,138,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: accentColor,
            }}
          >
            {isError ? <XCircleIcon /> : <CheckCircleIcon />}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: accentColor,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: "0 0 3px 0",
              }}
            >
              {isError ? "Error" : "Success"}
            </p>
            <p
              style={{
                color: C.white,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              {toast.msg}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              backgroundColor: isError
                ? "rgba(229,115,115,0.12)"
                : "rgba(93,190,138,0.12)",
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "filter 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = "brightness(1)")
            }
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 2,
            marginTop: 5,
            marginInline: 4,
            overflow: "hidden",
          }}
        >
          <div
            ref={progressRef}
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: accentColor,
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useStateWithRef(null);
  const timerRef = useRef(null);

  function showToast(msg, type = "success") {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }

  function closeToast() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast, closeToast };
}

// tiny helper so useToast works without importing useState separately
function useStateWithRef(initial) {
  const { useState } = require("react");
  return useState(initial);
}