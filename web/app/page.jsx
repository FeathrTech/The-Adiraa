// app/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "../src/components/SplashScreen";
import { useAuthStore } from "../src/store/authStore";

const SPLASH_DURATION = 4200;

export default function Page() {
  const router = useRouter();
  // ← REMOVED: restoreSession (AuthBootstrap in layout handles it)
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  const [showSplash, setShowSplash] = useState(true);
  const startTime = useRef(Date.now());

  // Wait for BOTH splash duration AND session restore to finish
  useEffect(() => {
    if (loading) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, SPLASH_DURATION - elapsed);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [loading]);

  // Navigate after splash unmounts
  // ✅ Add user and router to deps
  useEffect(() => {
    if (!showSplash) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [showSplash, user, router]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-50"
        >
          <SplashScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}