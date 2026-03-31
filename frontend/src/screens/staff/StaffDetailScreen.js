import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  StatusBar,
  Alert,
  Linking,
} from "react-native";

import { useTranslation } from "react-i18next";
import { Calendar } from "react-native-calendars";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import { useRealtime } from "../../hooks/useRealtime";
import { can, ACTION_PERMISSIONS } from "../../config/permissionMap";
import { deactivateUser } from "../../api/userApi";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "rgba(201,162,39,0.12)",
  goldDimMed: "rgba(201,162,39,0.08)",
  borderGold: "rgba(201,162,39,0.35)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  green: "#5DBE8A",
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
  blue: "#60A5FA",
  blueBg: "rgba(96,165,250,0.12)",
  blueBorder: "rgba(96,165,250,0.35)",
};

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

function IdProofModal({ visible, url, onClose, cvw, isTablet }) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [visible]);

  if (!url) return null;

  const isPdf =
    url.toLowerCase().includes(".pdf") ||
    url.toLowerCase().includes("application/pdf");

  const handleOpenInBrowser = () => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open the document. Please try again.")
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: C.borderGold,
          padding: 18,
          width: "100%",
          maxWidth: 480,
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{
                width: isTablet ? cvw * 4.5 : 36,
                height: isTablet ? cvw * 4.5 : 36,
                borderRadius: 10,
                backgroundColor: C.blueBg,
                borderWidth: 1,
                borderColor: C.blueBorder,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Ionicons
                  name={isPdf ? "document-text-outline" : "id-card-outline"}
                  size={isTablet ? cvw * 2.2 : 17}
                  color={C.blue}
                />
              </View>
              <View>
                <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.2 : 15 }}>
                  {t("staff.idProof", "ID Proof")}
                </Text>
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.7 : 11, marginTop: 1 }}>
                  {isPdf ? t("staff.pdfDocument", "PDF Document") : t("staff.imageDocument", "Image Document")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: C.faint, borderRadius: 8, padding: 7 }}
            >
              <Ionicons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: C.border, marginBottom: 16 }} />

          {isPdf ? (
            <View style={{ alignItems: "center", paddingVertical: 32, gap: 14 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 18,
                backgroundColor: C.blueBg,
                borderWidth: 1, borderColor: C.blueBorder,
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="document-text-outline" size={34} color={C.blue} />
              </View>
              <Text style={{
                color: C.white, fontWeight: "700",
                fontSize: isTablet ? cvw * 2.4 : 15, textAlign: "center",
              }}>
                {t("staff.pdfDocument", "PDF Document")}
              </Text>
              <Text style={{
                color: C.muted, fontSize: isTablet ? cvw * 1.8 : 12,
                textAlign: "center", lineHeight: 18,
              }}>
                {t("staff.pdfPreviewHint", "PDF files cannot be previewed inline.\nTap below to open in your browser.")}
              </Text>
              <TouchableOpacity
                onPress={handleOpenInBrowser}
                activeOpacity={0.8}
                style={{
                  marginTop: 4,
                  backgroundColor: C.blue,
                  borderRadius: 12,
                  paddingHorizontal: 28,
                  paddingVertical: 13,
                  flexDirection: "row", alignItems: "center", gap: 8,
                }}
              >
                <Ionicons name="open-outline" size={18} color="#000" />
                <Text style={{ color: "#000", fontWeight: "700", fontSize: isTablet ? cvw * 2 : 14 }}>
                  {t("staff.openPdf", "Open PDF")}
                </Text>
              </TouchableOpacity>
            </View>

          ) : imageError ? (
            <View style={{ alignItems: "center", paddingVertical: 28, gap: 12 }}>
              <Ionicons name="image-outline" size={52} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : 13, textAlign: "center" }}>
                {t("staff.imageLoadError", "Could not load the document image.")}
              </Text>
              <TouchableOpacity
                onPress={handleOpenInBrowser}
                activeOpacity={0.8}
                style={{
                  backgroundColor: C.blueBg,
                  borderWidth: 1, borderColor: C.blueBorder,
                  borderRadius: 10,
                  paddingHorizontal: 18, paddingVertical: 9,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Ionicons name="open-outline" size={15} color={C.blue} />
                <Text style={{ color: C.blue, fontWeight: "600", fontSize: isTablet ? cvw * 1.9 : 13 }}>
                  {t("staff.openInBrowser", "Open in Browser")}
                </Text>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={{ borderRadius: 12, overflow: "hidden", backgroundColor: C.faint, minHeight: 200 }}>
              {imageLoading && (
                <View style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: "center", justifyContent: "center",
                  zIndex: 1, minHeight: 200,
                }}>
                  <ActivityIndicator color={C.gold} size="large" />
                </View>
              )}
              <Image
                source={{ uri: url }}
                resizeMode="contain"
                style={{ width: "100%", height: 300, borderRadius: 12 }}
                onLoad={() => setImageLoading(false)}
                onError={() => { setImageLoading(false); setImageError(true); }}
              />
            </View>
          )}

          {!isPdf && !imageError && (
            <TouchableOpacity
              onPress={handleOpenInBrowser}
              activeOpacity={0.75}
              style={{
                marginTop: 12,
                flexDirection: "row", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}
            >
              <Ionicons name="open-outline" size={13} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.7 : 12 }}>
                {t("staff.openFullSize", "Open full size in browser")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StaffDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const initialUser = route.params?.user;
  if (!initialUser) return null;

  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({ daysWorked: "--", lateDays: "--", overtime: "--", absents: "--", status: "--" });
  const [calendarData, setCalendarData] = useState({});
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [workHours, setWorkHours] = useState("--");
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [idProofVisible, setIdProofVisible] = useState(false);

  // ✅ currentMonth as both state (for Calendar display) and ref (for stable closure in loadAnalytics)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const currentMonthRef = useRef(currentMonth);

  // Keep ref in sync whenever state changes
  useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);

  const avatarUrlRef = useRef(user.profilePhotoUrl);
  const userIdRef = useRef(user.id);
  const userPermissions = useAuthStore((s) => s.permissions);

  // Keep userIdRef in sync
  useEffect(() => {
    userIdRef.current = user.id;
  }, [user.id]);

  // ─── Sync user state when navigated back from EditStaff ──────────────────
  useEffect(() => {
    if (route.params?.user) {
      const incoming = route.params.user;
      setUser(incoming);
      if (incoming.profilePhotoUrl !== avatarUrlRef.current) {
        avatarUrlRef.current = incoming.profilePhotoUrl;
        setAvatarError(false);
        setAvatarLoading(true);
      }
    }
  }, [route.params?._refresh]);

  // ─── Load user (initial mount) ────────────────────────────────────────────
  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const res = await api.get("/users");
        const foundUser = res.data.find((u) => u.id === initialUser.id);
        if (foundUser) {
          setUser(foundUser);
          if (foundUser.profilePhotoUrl !== avatarUrlRef.current) {
            avatarUrlRef.current = foundUser.profilePhotoUrl;
            setAvatarError(false);
            setAvatarLoading(true);
          }
        }
      } catch (err) {
        console.log("User fetch error:", err);
      }
    };
    loadUserDetails();
  }, [initialUser.id]);

  if (!can(userPermissions, "attendance.view.staff_history")) return null;

  const filteredLogs = selectedDate
    ? logs.filter(
      (l) =>
        new Date(l.attendanceDate).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        }) === selectedDate
    )
    : [];

  // ─── Load analytics ───────────────────────────────────────────────────────
  // ✅ Stable reference via useCallback — always reads currentMonthRef.current
  //    so it never becomes stale when called from useFocusEffect or useRealtime
  const loadAnalytics = useCallback(async () => {
    const month = currentMonthRef.current;
    const userId = userIdRef.current;
    try {
      // setLoading(true);
      const res = await api.get(`/attendance/analytics/${userId}?month=${month}`);
      const { summary, calendar } = res.data;
      setStats(summary);

      const mappedLogs = [];
      calendar.forEach((day) => {
        if (day.checkInTime)
          mappedLogs.push({
            type: "login",
            timestamp: day.checkInTime,
            attendanceDate: day.date,
            photo: day.checkInPhoto,
            location: { latitude: day.lat, longitude: day.lng },
          });
        if (day.checkOutTime)
          mappedLogs.push({
            type: "logout",
            timestamp: day.checkOutTime,
            attendanceDate: day.date,
            photo: day.checkOutPhoto,
            location: { latitude: day.lat, longitude: day.lng },
          });
      });
      setLogs(mappedLogs);

      const marked = {};
      calendar.forEach((day) => {
        const dateKey = new Date(day.date).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
        let color = "#22c55e";
        if (day.status === "Absent") color = "#ef4444";
        if (day.status === "Late") color = "#f97316";
        if (day.status === "OutsideRange") color = "#3b82f6";
        if (day.status === "NotMarked") color = "#6b7280";
        marked[dateKey] = { marked: true, dotColor: color };
      });

      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const todayData = calendar.find((d) => d.date === today);
      if (todayData) setTodayAttendance(todayData);
      setCalendarData(marked);
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false);
    }
  }, []); // ✅ empty deps — safe because it reads from refs, not captured state

  // ✅ On focus: always re-fetch. loadAnalytics is now stable so this never re-subscribes unnecessarily.
  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  // ✅ When user swipes to a new month: update ref + state, then fetch
  const handleMonthChange = useCallback((month) => {
    const newMonth = `${month.year}-${String(month.month).padStart(2, '0')}`;
    currentMonthRef.current = newMonth;  // update ref first so loadAnalytics reads it immediately
    setCurrentMonth(newMonth);           // update state for Calendar display
    loadAnalytics();                     // fetch with the new month
  }, [loadAnalytics]);

  // ─── Midnight refresh ─────────────────────────────────────────────────────
  useEffect(() => {
    let lastDay = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const interval = setInterval(() => {
      const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      if (today !== lastDay) { lastDay = today; loadAnalytics(); }
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  // ─── Work hours calc ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!todayAttendance?.checkInTime) { setWorkHours("--"); return; }
    const calculate = () => {
      try {
        const start = new Date(todayAttendance.checkInTime);
        const end = todayAttendance.checkOutTime ? new Date(todayAttendance.checkOutTime) : new Date();
        const diffMs = end - start;
        if (diffMs <= 0) { setWorkHours("--"); return; }
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setWorkHours(`${hours}h ${minutes}m`);
      } catch { setWorkHours("--"); }
    };
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [todayAttendance]);

  useRealtime("attendance_updated", loadAnalytics);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, fontWeight: "700", letterSpacing: 1.5, fontSize: 13 }}>
          {t("staff.loadingProfile", "LOADING PROFILE")}
        </Text>
      </SafeAreaView>
    );
  }

  const roleLabel = user.roles?.map((r) => r.name).join(", ") || t("staff.noRole", "No Role");
  const initials = user.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const statTiles = [
    { label: t("staff.daysWorked", "Days Worked"), value: stats.daysWorked, icon: "calendar-outline" },
    { label: t("staff.lateDays", "Late Days"), value: stats.lateDays, icon: "time-outline" },
    { label: t("staff.overtime", "Overtime"), value: stats.overtime, icon: "trending-up-outline" },
    { label: t("staff.absents", "Absents"), value: stats.absents, icon: "close-circle-outline" },
  ];

  const getStatusMeta = (s) => ({
    Present: { color: "#5DBE8A", bg: "rgba(93,190,138,0.12)", border: "rgba(93,190,138,0.4)", label: t("staff.presentCaps", "PRESENT") },
    Late: { color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", label: t("staff.lateCaps", "LATE") },
    Completed: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.4)", label: t("staff.completedCaps", "COMPLETED") },
    Absent: { color: "#E57373", bg: "rgba(229,115,115,0.1)", border: "rgba(229,115,115,0.35)", label: t("staff.absentCaps", "ABSENT") },
    NotMarked: { color: "#888888", bg: "rgba(136,136,136,0.1)", border: "rgba(136,136,136,0.3)", label: t("staff.notMarkedCaps", "NOT MARKED") },
  }[s] || { color: C.muted, bg: "rgba(100,100,100,0.1)", border: "rgba(100,100,100,0.3)", label: s?.toUpperCase() ?? "--" });

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{
          flex: 1,
          paddingHorizontal: isTablet ? vw * 4 : vw * 5,
          paddingTop: vh * 3,
          paddingBottom: vh * 3,
        }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            flex: 1,
            overflow: "hidden",
          }}>

            {/* ── HEADER ── */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: isTablet ? vw * 3 : vw * 5,
              paddingTop: vh * 2.5,
              paddingBottom: vh * 2,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: C.faint,
                  paddingHorizontal: 12, paddingVertical: 7,
                  borderRadius: 10, borderWidth: 1, borderColor: C.borderGold,
                  marginRight: 14,
                }}
              >
                <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
                {isTablet && (
                  <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                  letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
                }}>
                  {t("staff.staffManagement", "Staff Management")}
                </Text>
                <Text style={{
                  color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
                  fontWeight: "900", letterSpacing: -0.5,
                }}>
                  {t("staff.staffProfile", "Staff Profile")}
                </Text>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: isTablet ? vw * 3 : vw * 5,
                paddingTop: vh * 2,
                paddingBottom: vh * 4,
              }}
              showsVerticalScrollIndicator={false}
            >

              {/* ── PROFILE CARD ── */}
              <View style={{
                backgroundColor: C.card,
                borderRadius: 24,
                padding: isTablet ? cvw * 3 : cvw * 6,
                marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
                borderWidth: 1, borderColor: C.borderGold,
              }}>
                {isTablet ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3 }}>
                    <AvatarCircle
                      user={user} initials={initials}
                      avatarLoading={avatarLoading} setAvatarLoading={setAvatarLoading}
                      avatarError={avatarError} setAvatarError={setAvatarError}
                      size={cvw * 14} cvw={cvw} isTablet={isTablet}
                    />
                    <ProfileInfo
                      user={user} roleLabel={roleLabel}
                      userPermissions={userPermissions} navigation={navigation}
                      cvw={cvw} isTablet={isTablet}
                      onUserUpdated={setUser}
                      onViewIdProof={() => setIdProofVisible(true)}
                    />
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <AvatarCircle
                      user={user} initials={initials}
                      avatarLoading={avatarLoading} setAvatarLoading={setAvatarLoading}
                      avatarError={avatarError} setAvatarError={setAvatarError}
                      size={cvw * 24} cvw={cvw} isTablet={isTablet}
                    />
                    <ProfileInfo
                      user={user} roleLabel={roleLabel}
                      userPermissions={userPermissions} navigation={navigation}
                      cvw={cvw} isTablet={isTablet} centered
                      onUserUpdated={setUser}
                      onViewIdProof={() => setIdProofVisible(true)}
                    />
                  </View>
                )}
              </View>

              {/* ── STATS GRID ── */}
              <View style={{
                flexDirection: "row", flexWrap: "wrap",
                gap: isTablet ? vw * 1.5 : vw * 3,
                marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
              }}>
                {statTiles.map((tile) => (
                  <View key={tile.label} style={{
                    backgroundColor: C.card,
                    borderRadius: 18, borderWidth: 1, borderColor: C.borderGold,
                    padding: isTablet ? cvw * 2.5 : cvw * 5,
                    width: isTablet ? `${(100 - 4.5) / 4}%` : "47%",
                    minWidth: isTablet ? undefined : "47%",
                    flexGrow: isTablet ? 1 : 0,
                  }}>
                    <View style={{
                      width: isTablet ? cvw * 4.5 : cvw * 8,
                      height: isTablet ? cvw * 4.5 : cvw * 8,
                      borderRadius: cvw * 4,
                      backgroundColor: C.goldDim,
                      borderWidth: 1, borderColor: C.borderGold,
                      alignItems: "center", justifyContent: "center",
                      marginBottom: 8,
                    }}>
                      <Ionicons name={tile.icon} size={isTablet ? cvw * 2.4 : cvw * 4} color={C.gold} />
                    </View>
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3, marginBottom: 4 }}>
                      {tile.label}
                    </Text>
                    <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 3.5 : cvw * 6, fontWeight: "800" }}>
                      {tile.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* ── CURRENT STATUS ── */}
              <View style={{
                backgroundColor: C.card,
                borderRadius: 18, borderWidth: 1, borderColor: C.borderGold,
                padding: isTablet ? cvw * 2.5 : cvw * 5,
                marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between",
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{
                    width: isTablet ? cvw * 4.5 : cvw * 8,
                    height: isTablet ? cvw * 4.5 : cvw * 8,
                    borderRadius: cvw * 4,
                    backgroundColor: C.goldDim,
                    borderWidth: 1, borderColor: C.borderGold,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="pulse-outline" size={isTablet ? cvw * 2.4 : cvw * 4} color={C.gold} />
                  </View>
                  <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.5, fontWeight: "600" }}>
                    {t("staff.today", "Today")}
                  </Text>
                </View>
                {(() => {
                  const meta = getStatusMeta(stats.status);
                  return (
                    <View style={{
                      backgroundColor: meta.bg,
                      borderWidth: 1, borderColor: meta.border,
                      borderRadius: 10,
                      paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                      paddingVertical: isTablet ? vh * 0.6 : vh * 0.85,
                      flexDirection: "row", alignItems: "center", gap: 6,
                    }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: meta.color }} />
                      <Text style={{
                        color: meta.color,
                        fontWeight: "700",
                        fontSize: isTablet ? cvw * 2 : cvw * 3.4,
                        letterSpacing: 0.4,
                      }}>
                        {meta.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* ── CALENDAR ── */}
              <SectionHeader title={t("staff.attendanceCalendar", "Attendance Calendar")} icon="calendar-outline" cvw={cvw} isTablet={isTablet} />
              <View style={{
                backgroundColor: C.card,
                borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
                overflow: "hidden",
                marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
              }}>
                <Calendar
                  markedDates={{
                    ...calendarData,
                    ...(selectedDate && { [selectedDate]: { selected: true, selectedColor: C.gold } }),
                  }}
                  onDayPress={(day) => {
                    setSelectedDate((current) =>
                      current === day.dateString ? null : day.dateString
                    );
                  }}
                  onMonthChange={handleMonthChange}
                  theme={{
                    calendarBackground: C.card,
                    dayTextColor: C.white,
                    textDisabledColor: "rgba(255,255,255,0.2)",
                    monthTextColor: C.gold,
                    todayTextColor: C.gold,
                    arrowColor: C.gold,
                    selectedDayBackgroundColor: C.gold,
                    selectedDayTextColor: "#000",
                    dotColor: C.gold,
                  }}
                />
                <View style={{
                  flexDirection: "row", flexWrap: "wrap",
                  gap: isTablet ? cvw * 2 : cvw * 4,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
                  paddingBottom: isTablet ? cvw * 1.5 : cvw * 4,
                  paddingTop: 4,
                }}>
                  {[
                    { label: t("staff.present", "Present"), color: "#22c55e" },
                    { label: t("staff.late", "Late"), color: "#f97316" },
                    { label: t("staff.absent", "Absent"), color: "#ef4444" },
                    { label: t("staff.outside", "Outside"), color: "#3b82f6" },
                    { label: t("staff.notMarked", "Not Marked"), color: "#6b7280" },
                  ].map((l) => (
                    <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
                      <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>{l.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── ATTENDANCE HISTORY ── */}
              {selectedDate && (
                <>
                  <SectionHeader title={t("staff.attendanceHistory", "Attendance History")} icon="time-outline" cvw={cvw} isTablet={isTablet} />
                  <View style={{
                    backgroundColor: C.card,
                    borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
                    padding: isTablet ? cvw * 2.5 : cvw * 5,
                    marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
                  }}>
                    <View style={{
                      flexDirection: "row", alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: isTablet ? cvw * 1.5 : cvw * 4,
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="calendar-outline" size={isTablet ? cvw * 2 : cvw * 3.5} color={C.gold} />
                        <Text style={{ color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
                          {selectedDate}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setSelectedDate(null)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 4,
                          backgroundColor: C.faint, borderRadius: 8,
                          paddingHorizontal: 10, paddingVertical: 5,
                        }}
                      >
                        <Ionicons name="close" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.muted} />
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>{t("staff.clear", "Clear")}</Text>
                      </TouchableOpacity>
                    </View>

                    {filteredLogs.length === 0 ? (
                      <View style={{ alignItems: "center", paddingVertical: isTablet ? cvw * 3 : cvw * 8 }}>
                        <Ionicons name="time-outline" size={isTablet ? cvw * 6 : cvw * 12} color={C.muted} />
                        <Text style={{ color: C.muted, marginTop: 10, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
                          {t("staff.noRecordsFor", "No records for {{date}}", { date: selectedDate })}
                        </Text>
                      </View>
                    ) : (
                      filteredLogs.map((log, index) => {
                        const logDate = new Date(log.timestamp);
                        const isLogin = log.type === "login";
                        return (
                          <View
                            key={log._id || index}
                            style={{
                              flexDirection: "row", alignItems: "center",
                              backgroundColor: C.cardAlt,
                              borderRadius: 14, borderWidth: 1, borderColor: C.border,
                              padding: isTablet ? cvw * 2 : cvw * 4,
                              marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
                              gap: cvw * 3,
                            }}
                          >
                            <View style={{
                              width: isTablet ? cvw * 5 : cvw * 9,
                              height: isTablet ? cvw * 5 : cvw * 9,
                              borderRadius: cvw * 5,
                              backgroundColor: isLogin ? "rgba(93,190,138,0.12)" : "rgba(229,115,115,0.12)",
                              borderWidth: 1,
                              borderColor: isLogin ? "rgba(93,190,138,0.4)" : "rgba(229,115,115,0.4)",
                              alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Ionicons
                                name={isLogin ? "log-in-outline" : "log-out-outline"}
                                size={isTablet ? cvw * 2.4 : cvw * 4.5}
                                color={isLogin ? "#5DBE8A" : "#E57373"}
                              />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={{
                                color: C.white, fontWeight: "700",
                                fontSize: isTablet ? cvw * 2.4 : cvw * 3.8, marginBottom: 3,
                              }}>
                                {isLogin ? t("staff.checkIn", "Check In") : t("staff.checkOut", "Check Out")}
                              </Text>
                              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.9 : cvw * 3, marginBottom: 3 }}>
                                {logDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {logDate.toLocaleDateString()}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="location-sharp" size={isTablet ? cvw * 1.6 : cvw * 2.8} color={C.muted} />
                                <Text numberOfLines={1} style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, flex: 1 }}>
                                  {log.location?.address ||
                                    log.location?.displayText ||
                                    (log.location
                                      ? `${Number(log.location.latitude).toFixed(4)}, ${Number(log.location.longitude).toFixed(4)}`
                                      : t("staff.locationUnavailable", "Location unavailable"))}
                                </Text>
                              </View>
                            </View>
                            {log.photo && (
                              <TouchableOpacity
                                onPress={() => { setPhotoError(false); setSelectedAttendance(log); }}
                                style={{
                                  width: isTablet ? cvw * 4.5 : cvw * 8,
                                  height: isTablet ? cvw * 4.5 : cvw * 8,
                                  borderRadius: 10,
                                  backgroundColor: C.goldDim,
                                  borderWidth: 1, borderColor: C.borderGold,
                                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}
                              >
                                <Ionicons name="image-outline" size={isTablet ? cvw * 2.4 : cvw * 4} color={C.gold} />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                </>
              )}

              {/* ── TODAY'S ATTENDANCE ── */}
              <SectionHeader title={t("staff.todaysAttendance", "Today's Attendance")} icon="today-outline" cvw={cvw} isTablet={isTablet} />
              <View style={{
                backgroundColor: C.card,
                borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
                padding: isTablet ? cvw * 2.5 : cvw * 5,
                marginBottom: isTablet ? vh * 2 : vh * 2,
              }}>
                {[
                  {
                    label: t("staff.checkInHyphen", "Check-in"), icon: "log-in-outline",
                    value: todayAttendance?.checkInTime
                      ? new Date(todayAttendance.checkInTime).toLocaleTimeString() : "--",
                  },
                  {
                    label: t("staff.checkOutHyphen", "Check-out"), icon: "log-out-outline",
                    value: todayAttendance?.checkOutTime
                      ? new Date(todayAttendance.checkOutTime).toLocaleTimeString() : "--",
                  },
                  { label: t("staff.workHours", "Work Hours"), icon: "timer-outline", value: workHours },
                ].map((row, idx, arr) => (
                  <View
                    key={row.label}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: isTablet ? vh * 1.3 : vh * 1.6,
                      borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                      borderBottomColor: C.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{
                        width: isTablet ? cvw * 4 : cvw * 7,
                        height: isTablet ? cvw * 4 : cvw * 7,
                        borderRadius: cvw * 4,
                        backgroundColor: C.goldDim,
                        borderWidth: 1, borderColor: C.borderGold,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Ionicons name={row.icon} size={isTablet ? cvw * 2 : cvw * 3.5} color={C.gold} />
                      </View>
                      <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8, fontWeight: "500" }}>
                        {row.label}
                      </Text>
                    </View>
                    <Text style={{
                      color: row.value === "--" ? C.muted : C.white,
                      fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : cvw * 4,
                    }}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>

            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      {/* ── ATTENDANCE PHOTO MODAL ── */}
      <Modal
        visible={!!selectedAttendance}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAttendance(null)}
      >
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.92)",
          justifyContent: "center", alignItems: "center", padding: 20,
        }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
            padding: 18, width: "100%", maxWidth: 460,
          }}>
            <TouchableOpacity
              onPress={() => setSelectedAttendance(null)}
              style={{
                alignSelf: "flex-end", marginBottom: 12,
                backgroundColor: C.faint, borderRadius: 8, padding: 6,
              }}
            >
              <Ionicons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
            {!photoError && selectedAttendance?.photo ? (
              <Image
                source={{ uri: selectedAttendance.photo }}
                resizeMode="contain"
                style={{ width: "100%", height: 320, borderRadius: 14 }}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <View style={{ alignItems: "center", padding: 30 }}>
                <Ionicons name="image-outline" size={60} color={C.muted} />
                <Text style={{ color: C.muted, marginTop: 10, textAlign: "center" }}>
                  {t("staff.attendancePhotoExpired", "Attendance photo expired (15 day retention policy)")}
                </Text>
              </View>
            )}
            {selectedAttendance && (
              <View style={{ marginTop: 14, gap: 4 }}>
                <Text style={{ color: C.white, fontWeight: "600", fontSize: 14 }}>
                  {new Date(selectedAttendance.timestamp).toLocaleString()}
                </Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  {selectedAttendance?.location
                    ? `${Number(selectedAttendance.location.latitude).toFixed(4)}, ${Number(selectedAttendance.location.longitude).toFixed(4)}`
                    : t("staff.locationUnavailable", "Location unavailable")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── ID PROOF MODAL ── */}
      <IdProofModal
        visible={idProofVisible}
        url={user.idProofUrl}
        onClose={() => setIdProofVisible(false)}
        cvw={cvw}
        isTablet={isTablet}
      />
    </>
  );
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
function AvatarCircle({ user, initials, avatarLoading, setAvatarLoading, avatarError, setAvatarError, size, cvw, isTablet }) {
  const showImage = user.profilePhotoUrl && !avatarError;
  const cacheBustedUri = user.profilePhotoUrl ? `${user.profilePhotoUrl}?t=${Date.now()}` : null;

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 2, borderColor: "rgba(201,162,39,0.5)",
      overflow: "hidden", flexShrink: 0,
      backgroundColor: "rgba(201,162,39,0.1)",
      alignItems: "center", justifyContent: "center",
      marginBottom: isTablet ? 0 : 16,
    }}>
      {showImage && (
        <Image
          key={cacheBustedUri}
          source={{ uri: cacheBustedUri }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          onLoad={() => setAvatarLoading(false)}
          onError={() => { setAvatarLoading(false); setAvatarError(true); }}
        />
      )}
      {(!showImage || avatarLoading) && (
        <Text style={{ color: "#C9A227", fontWeight: "900", fontSize: size * 0.35, letterSpacing: 1 }}>
          {initials}
        </Text>
      )}
      {showImage && avatarLoading && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center", justifyContent: "center",
        }}>
          <ActivityIndicator size="small" color="#C9A227" />
        </View>
      )}
    </View>
  );
}

// ─── Profile info block ───────────────────────────────────────────────────────
function ProfileInfo({ user, roleLabel, userPermissions, navigation, cvw, isTablet, centered, onUserUpdated, onViewIdProof }) {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState(null);

  const handleDeactivate = () => {
    Alert.alert(
      t("staff.deactivateStaff", "Deactivate Staff"),
      t("staff.deactivatePrompt", "Are you sure you want to deactivate {{name}}? Their account will be disabled.", { name: user.name }),
      [
        { text: t("settings.cancel", "Cancel"), style: "cancel" },
        {
          text: t("staff.deactivate", "Deactivate"), style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("deactivate");
              await deactivateUser(user.id);
              navigation.goBack();
            } catch {
              Alert.alert(t("roles.error", "Error"), t("staff.failedToDeactivate", "Failed to deactivate staff member"));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleActivate = () => {
    Alert.alert(
      t("staff.reactivateStaff", "Reactivate Staff"),
      t("staff.reactivatePrompt", "Restore login access for {{name}}?", { name: user.name }),
      [
        { text: t("settings.cancel", "Cancel"), style: "cancel" },
        {
          text: t("staff.reactivate", "Reactivate"),
          onPress: async () => {
            try {
              setActionLoading("activate");
              await api.patch(`/users/${user.id}`, { isActive: true });
              if (onUserUpdated) onUserUpdated((prev) => ({ ...prev, isActive: true }));
              navigation.goBack();
            } catch {
              Alert.alert(t("roles.error", "Error"), t("staff.failedToReactivate", "Failed to reactivate staff member"));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t("staff.deleteFromSystem", "Delete from System"),
      t("staff.deletePrompt", "Permanently delete {{name}}? This action cannot be undone.", { name: user.name }),
      [
        { text: t("settings.cancel", "Cancel"), style: "cancel" },
        {
          text: t("staff.deletePermanently", "Delete Permanently"), style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("delete");
              await api.delete(`/users/${user.id}/permanent`);
              navigation.goBack();
            } catch {
              Alert.alert(t("roles.error", "Error"), t("staff.failedToDelete", "Failed to delete staff member"));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const canEdit = can(userPermissions, ACTION_PERMISSIONS.staff.edit);
  const canDelete = can(userPermissions, ACTION_PERMISSIONS.staff.delete);
  const isActive = user.isActive;

  return (
    <View style={{ flex: isTablet ? 1 : undefined, alignItems: centered ? "center" : "flex-start" }}>
      <Text style={{
        color: C.white, fontWeight: "800",
        fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
        letterSpacing: -0.3, marginBottom: 4,
        textAlign: centered ? "center" : "left",
      }}>
        {user.name}
      </Text>

      <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.5, marginBottom: 4 }}>
        {roleLabel}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <Ionicons name="call-outline" size={isTablet ? cvw * 1.8 : cvw * 3.2} color={C.muted} />
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>{user.mobile || "—"}</Text>
      </View>

      {/* Status badge */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <View style={{
          backgroundColor: isActive ? C.greenBg : C.redBg,
          borderWidth: 1,
          borderColor: isActive ? C.greenBorder : C.redBorder,
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
          flexDirection: "row", alignItems: "center", gap: 5,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? C.green : C.red }} />
          <Text style={{
            color: isActive ? C.green : C.red,
            fontWeight: "700", fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, letterSpacing: 0.5,
          }}>
            {isActive ? t("staff.activeCaps", "ACTIVE") : t("staff.inactiveCaps", "INACTIVE")}
          </Text>
        </View>
      </View>

      {/* ── ACTION BUTTONS ── */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: centered ? "center" : "flex-start" }}>

        {canEdit && (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditStaff", { user })}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.borderGold,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5,
            }}
          >
            <Ionicons name="pencil-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.gold} />
            <Text style={{ color: C.gold, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>{t("roles.edit", "Edit")}</Text>
          </TouchableOpacity>
        )}

        {!!user.idProofUrl && (
          <TouchableOpacity
            onPress={onViewIdProof}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.blueBg, borderWidth: 1, borderColor: C.blueBorder,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5,
            }}
          >
            <Ionicons name="id-card-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.blue} />
            <Text style={{ color: C.blue, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              {t("staff.idProof", "ID Proof")}
            </Text>
          </TouchableOpacity>
        )}

        {canDelete && isActive && (
          <TouchableOpacity
            activeOpacity={0.8} onPress={handleDeactivate}
            disabled={actionLoading === "deactivate"}
            style={{
              backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBorder,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5,
              opacity: actionLoading === "deactivate" ? 0.6 : 1,
            }}
          >
            {actionLoading === "deactivate"
              ? <ActivityIndicator size="small" color={C.red} />
              : <Ionicons name="person-remove-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.red} />
            }
            <Text style={{ color: C.red, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              {t("staff.deactivate", "Deactivate")}
            </Text>
          </TouchableOpacity>
        )}

        {canEdit && !isActive && (
          <TouchableOpacity
            activeOpacity={0.8} onPress={handleActivate}
            disabled={actionLoading === "activate"}
            style={{
              backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5,
              opacity: actionLoading === "activate" ? 0.6 : 1,
            }}
          >
            {actionLoading === "activate"
              ? <ActivityIndicator size="small" color={C.green} />
              : <Ionicons name="checkmark-circle-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.green} />
            }
            <Text style={{ color: C.green, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              {t("staff.reactivate", "Reactivate")}
            </Text>
          </TouchableOpacity>
        )}

        {canDelete && !isActive && (
          <TouchableOpacity
            activeOpacity={0.8} onPress={handleDelete}
            disabled={actionLoading === "delete"}
            style={{
              backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBorder,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5,
              opacity: actionLoading === "delete" ? 0.6 : 1,
            }}
          >
            {actionLoading === "delete"
              ? <ActivityIndicator size="small" color={C.red} />
              : <Ionicons name="trash-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.red} />
            }
            <Text style={{ color: C.red, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              {t("roles.delete", "Delete")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon, cvw, isTablet }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: isTablet ? cvw * 1.5 : cvw * 3.5 }}>
      <View style={{
        width: isTablet ? cvw * 4 : cvw * 7,
        height: isTablet ? cvw * 4 : cvw * 7,
        borderRadius: cvw * 4,
        backgroundColor: C.goldDim,
        borderWidth: 1, borderColor: C.borderGold,
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 3.5} color={C.gold} />
      </View>
      <Text style={{
        color: C.gold, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
        fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
      }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}