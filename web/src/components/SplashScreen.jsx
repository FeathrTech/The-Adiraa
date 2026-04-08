// src/components/SplashScreen.jsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {
  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* ── Outer gold border ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top:    "clamp(16px, 5vw, 40px)",
          left:   "clamp(16px, 5vw, 40px)",
          right:  "clamp(16px, 5vw, 40px)",
          bottom: "clamp(16px, 5vw, 40px)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(201,162,39,0.55)",
          borderRadius: "clamp(18px, 2vw, 24px)",
        }}
      />

      {/* ── Inner gold border (double-frame effect) ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top:    "clamp(21px, 5.5vw, 45px)",
          left:   "clamp(21px, 5.5vw, 45px)",
          right:  "clamp(21px, 5.5vw, 45px)",
          bottom: "clamp(21px, 5.5vw, 45px)",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: "rgba(201,162,39,0.25)",
          borderRadius: "clamp(14px, 1.8vw, 20px)",
        }}
      />

      {/* ── Radial glow behind logo ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Centered animated logo ── */}
      <div className="relative flex items-center justify-center h-full w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            opacity: {
              duration: 0.9,
              ease: "easeOut",
            },
            scale: {
              type: "spring",
              stiffness: 100,
              damping: 12,
              mass: 0.8,
            },
          }}
          className="flex items-center justify-center"
        >
          {/* Outer glow ring */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width:  "clamp(160px, 30vw, 320px)",
              height: "clamp(160px, 30vw, 320px)",
              backgroundColor: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.2)",
            }}
          >
            {/* Inner ring */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width:  "clamp(130px, 25vw, 270px)",
                height: "clamp(130px, 25vw, 270px)",
                backgroundColor: "rgba(201,162,39,0.15)",
                border: "1px solid rgba(201,162,39,0.3)",
              }}
            >
              {/* Logo image */}
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width:  "clamp(100px, 20vw, 220px)",
                  height: "clamp(100px, 20vw, 220px)",
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
        </motion.div>
      </div>

      {/* ── Bottom powered-by text ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-8 w-full flex items-center justify-center gap-2"
      >
        <div
          className="h-px w-4"
          style={{ backgroundColor: "rgba(201,162,39,0.3)" }}
        />
        <div
          className="h-px w-4"
          style={{ backgroundColor: "rgba(201,162,39,0.3)" }}
        />
      </motion.div>
    </div>
  );
}