import React, { useState, useEffect } from "react";
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
} from "react-native";

import { Calendar } from "react-native-calendars";
import { useRoute, useNavigation } from "@react-navigation/native";
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StaffDetailScreen() {
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
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [workHours, setWorkHours] = useState("--");
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  const userPermissions = useAuthStore((s) => s.permissions);

  // ─── Load user ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const res = await api.get("/users");
        const foundUser = res.data.find((u) => u.id === initialUser.id);
        if (foundUser) setUser(foundUser);
      } catch (err) {
        console.log("User fetch error:", err);
      }
    };
    loadUserDetails();
  }, [initialUser.id]);

  if (!can(userPermissions, "attendance.view.staff_history")) return null;

  const filteredLogs = selectedDate
    ? logs.filter(
      l =>
        new Date(l.attendanceDate).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        }) === selectedDate
    )
    : [];

  // ─── Load analytics ───────────────────────────────────────────────────────
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/analytics/${user.id}`);
      const { summary, calendar } = res.data;
      setStats(summary);

      const mappedLogs = [];
      calendar.forEach(day => {
        if (day.checkInTime) mappedLogs.push({ type: "login", timestamp: day.checkInTime, attendanceDate: day.date, photo: day.checkInPhoto, location: { latitude: day.lat, longitude: day.lng } });
        if (day.checkOutTime) mappedLogs.push({ type: "logout", timestamp: day.checkOutTime, attendanceDate: day.date, photo: day.checkOutPhoto, location: { latitude: day.lat, longitude: day.lng } });
      });
      setLogs(mappedLogs);

      const marked = {};
      calendar.forEach(day => {
        const dateKey = new Date(day.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        let color = "#22c55e";
        if (day.status === "Absent") color = "#ef4444";
        if (day.status === "Late") color = "#f97316";
        if (day.status === "OutsideRange") color = "#3b82f6";
        marked[dateKey] = { marked: true, dotColor: color };
      });

      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const todayData = calendar.find(d => d.date === today);
      if (todayData) setTodayAttendance(todayData);
      setCalendarData(marked);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, []);

  // ─── Midnight refresh ─────────────────────────────────────────────────────
  useEffect(() => {
    let lastDay = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const interval = setInterval(() => {
      const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      if (today !== lastDay) { lastDay = today; loadAnalytics(); }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, fontWeight: "700", letterSpacing: 1.5, fontSize: 13 }}>
          LOADING PROFILE
        </Text>
      </SafeAreaView>
    );
  }

  const roleLabel = user.roles?.map(r => r.name).join(", ") || "No Role";
  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const statTiles = [
    { label: "Days Worked", value: stats.daysWorked, icon: "calendar-outline" },
    { label: "Late Days", value: stats.lateDays, icon: "time-outline" },
    { label: "Overtime", value: stats.overtime, icon: "trending-up-outline" },
    { label: "Absents", value: stats.absents, icon: "close-circle-outline" },
  ];

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
                  color: C.gold,
                  fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                  letterSpacing: 3, fontWeight: "700",
                  textTransform: "uppercase", marginBottom: 2,
                }}>
                  Staff Management
                </Text>
                <Text style={{
                  color: C.white,
                  fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
                  fontWeight: "900", letterSpacing: -0.5,
                }}>
                  Staff Profile
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
                  <View
                    key={tile.label}
                    style={{
                      backgroundColor: C.card,
                      borderRadius: 18, borderWidth: 1, borderColor: C.borderGold,
                      padding: isTablet ? cvw * 2.5 : cvw * 5,
                      width: isTablet ? `${(100 - 4.5) / 4}%` : "47%",
                      minWidth: isTablet ? undefined : "47%",
                      flexGrow: isTablet ? 1 : 0,
                    }}
                  >
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
                    <Text style={{
                      color: C.gold, fontSize: isTablet ? cvw * 3.5 : cvw * 6,
                      fontWeight: "800",
                    }}>
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
                    Current Status
                  </Text>
                </View>
                {(() => {
                  const s = stats.status;
                  const meta = {
                    Present: { color: "#5DBE8A", bg: "rgba(93,190,138,0.12)", border: "rgba(93,190,138,0.4)" },
                    Late: { color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)" },
                    Completed: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.4)" },
                    Absent: { color: "#E57373", bg: "rgba(229,115,115,0.1)", border: "rgba(229,115,115,0.35)" },
                  }[s] || { color: C.gold, bg: C.goldDim, border: C.borderGold };
                  return (
                    <View style={{
                      backgroundColor: meta.bg,
                      borderWidth: 1, borderColor: meta.border,
                      borderRadius: 10,
                      paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
                      paddingVertical: isTablet ? vh * 0.5 : vh * 0.7,
                      flexDirection: "row", alignItems: "center", gap: 5,
                    }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.color }} />
                      <Text style={{
                        color: meta.color, fontWeight: "700",
                        fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                        letterSpacing: 0.5,
                      }}>
                        {s?.toUpperCase() ?? "--"}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* ── CALENDAR ── */}
              <SectionHeader title="Attendance Calendar" icon="calendar-outline" cvw={cvw} isTablet={isTablet} />

              <View style={{
                backgroundColor: C.card,
                borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
                overflow: "hidden",
                marginBottom: isTablet ? vh * 2.5 : vh * 2.5,
              }}>
                <Calendar
                  markedDates={{
                    ...calendarData,
                    ...(selectedDate && { [selectedDate]: { selected: true, selectedColor: C.gold } })
                  }}
                  onDayPress={(day) => {
                    setSelectedDate(current =>
                      current === day.dateString ? null : day.dateString
                    );
                  }}
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

                {/* Legend */}
                <View style={{
                  flexDirection: "row", flexWrap: "wrap",
                  gap: isTablet ? cvw * 2 : cvw * 4,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
                  paddingBottom: isTablet ? cvw * 1.5 : cvw * 4,
                  paddingTop: 4,
                }}>
                  {[
                    { label: "Present", color: "#22c55e" },
                    { label: "Late", color: "#f97316" },
                    { label: "Absent", color: "#ef4444" },
                    { label: "Outside", color: "#3b82f6" },
                  ].map(l => (
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
                  <SectionHeader title="Attendance History" icon="time-outline" cvw={cvw} isTablet={isTablet} />

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
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>Clear</Text>
                      </TouchableOpacity>
                    </View>

                    {filteredLogs.length === 0 ? (
                      <View style={{ alignItems: "center", paddingVertical: isTablet ? cvw * 3 : cvw * 8 }}>
                        <Ionicons name="time-outline" size={isTablet ? cvw * 6 : cvw * 12} color={C.muted} />
                        <Text style={{ color: C.muted, marginTop: 10, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
                          No records for {selectedDate}
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
                                {isLogin ? "Check In" : "Check Out"}
                              </Text>
                              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.9 : cvw * 3, marginBottom: 3 }}>
                                {logDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {logDate.toLocaleDateString()}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="location-sharp" size={isTablet ? cvw * 1.6 : cvw * 2.8} color={C.muted} />
                                <Text numberOfLines={1} style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, flex: 1 }}>
                                  {log.location?.address || log.location?.displayText ||
                                    (log.location
                                      ? `${Number(log.location.latitude).toFixed(4)}, ${Number(log.location.longitude).toFixed(4)}`
                                      : "Location unavailable")}
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
              <SectionHeader title="Today's Attendance" icon="today-outline" cvw={cvw} isTablet={isTablet} />

              <View style={{
                backgroundColor: C.card,
                borderRadius: 20, borderWidth: 1, borderColor: C.borderGold,
                padding: isTablet ? cvw * 2.5 : cvw * 5,
                marginBottom: isTablet ? vh * 2 : vh * 2,
              }}>
                {[
                  { label: "Check-in", icon: "log-in-outline", value: todayAttendance?.checkInTime ? new Date(todayAttendance.checkInTime).toLocaleTimeString() : "--" },
                  { label: "Check-out", icon: "log-out-outline", value: todayAttendance?.checkOutTime ? new Date(todayAttendance.checkOutTime).toLocaleTimeString() : "--" },
                  { label: "Work Hours", icon: "timer-outline", value: workHours },
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

      {/* ── PHOTO MODAL ── */}
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
                  Attendance photo expired (15 day retention policy)
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
                    : "Location unavailable"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
function AvatarCircle({ user, initials, avatarLoading, setAvatarLoading, avatarError, setAvatarError, size, cvw, isTablet }) {
  const showImage = user.profilePhotoUrl && !avatarError;

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
          source={{ uri: user.profilePhotoUrl }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          onLoad={() => setAvatarLoading(false)}
          onError={() => { setAvatarLoading(false); setAvatarError(true); }}
        />
      )}
      {(!showImage || avatarLoading) && (
        <Text style={{
          color: "#C9A227",
          fontWeight: "900",
          fontSize: size * 0.35,
          letterSpacing: 1,
        }}>
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
function ProfileInfo({ user, roleLabel, userPermissions, navigation, cvw, isTablet, centered }) {
  return (
    <View style={{ flex: isTablet ? 1 : undefined, alignItems: centered ? "center" : "flex-start" }}>
      <Text style={{
        color: "#FFFFFF", fontWeight: "800",
        fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
        letterSpacing: -0.3, marginBottom: 4,
        textAlign: centered ? "center" : "left",
      }}>
        {user.name}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <Text style={{ color: "#777", fontSize: isTablet ? cvw * 2 : cvw * 3.5 }}>
          {roleLabel}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <Ionicons name="call-outline" size={isTablet ? cvw * 1.8 : cvw * 3.2} color="#777" />
        <Text style={{ color: "#777", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
          {user.mobile || "—"}
        </Text>
      </View>

      {/* Status badge */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <View style={{
          backgroundColor: user.isActive ? "rgba(93,190,138,0.12)" : "rgba(229,115,115,0.1)",
          borderWidth: 1,
          borderColor: user.isActive ? "rgba(93,190,138,0.4)" : "rgba(229,115,115,0.35)",
          borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 4,
          flexDirection: "row", alignItems: "center", gap: 5,
        }}>
          <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: user.isActive ? "#5DBE8A" : "#E57373",
          }} />
          <Text style={{
            color: user.isActive ? "#5DBE8A" : "#E57373",
            fontWeight: "700", fontSize: isTablet ? cvw * 1.8 : cvw * 2.8,
            letterSpacing: 0.5,
          }}>
            {user.isActive ? "ACTIVE" : "INACTIVE"}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {can(userPermissions, ACTION_PERMISSIONS.staff.edit) && (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditStaff", { user })}
            activeOpacity={0.8}
            style={{
              backgroundColor: "rgba(201,162,39,0.15)",
              borderWidth: 1, borderColor: "rgba(201,162,39,0.4)",
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10,
              flexDirection: "row", alignItems: "center", gap: 5,
            }}
          >
            <Ionicons name="pencil-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color="#C9A227" />
            <Text style={{ color: "#C9A227", fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        )}

        {can(userPermissions, ACTION_PERMISSIONS.staff.delete) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                "Deactivate Staff",
                `Are you sure you want to deactivate ${user.name}? Their account will be disabled.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deactivateUser(user.id);
                        navigation.goBack();
                      } catch {
                        Alert.alert("Error", "Failed to deactivate staff member");
                      }
                    },
                  },
                ]
              );
            }}
            style={{
              backgroundColor: "rgba(229,115,115,0.1)",
              borderWidth: 1, borderColor: "rgba(229,115,115,0.35)",
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 2,
              borderRadius: 10,
              flexDirection: "row", alignItems: "center", gap: 5,
            }}
          >
            <Ionicons name="person-remove-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color="#E57373" />
            <Text style={{ color: "#E57373", fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
              Deactivate
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
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: isTablet ? cvw * 1.5 : cvw * 3.5,
    }}>
      <View style={{
        width: isTablet ? cvw * 4 : cvw * 7,
        height: isTablet ? cvw * 4 : cvw * 7,
        borderRadius: cvw * 4,
        backgroundColor: "rgba(201,162,39,0.12)",
        borderWidth: 1, borderColor: "rgba(201,162,39,0.35)",
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 3.5} color="#C9A227" />
      </View>
      <Text style={{
        color: "#C9A227",
        fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
        fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
      }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "#2A2A2A" }} />
    </View>
  );
}