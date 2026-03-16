import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useRealtime } from "../../hooks/useRealtime";
import api from "../../api/axios";

// ─── Palette ────────────────────────────────────────────────────────────────
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
  muted: "#777",
  faint: "#333",
};

// ─── Responsive hook (breakpoint at 768px, mirrors CSS media query) ──────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { vw, vh, cvw, isTablet } = useResponsive();

  // Extract permissions — unchanged from original
  const permissions =
    user?.roles?.flatMap((role) =>
      role?.permissions?.map((perm) => perm.key)
    ) || [];

  const can = (key) => permissions.includes(key);

  const canAccessSettings = permissions.some((p) => p.startsWith("settings."));

  const [liveAttendanceCount, setLiveAttendanceCount] = useState(0);

  // Realtime listener — unchanged
  useRealtime("attendance_live_update", (data) => {
    if (data?.count !== undefined) {
      setLiveAttendanceCount(data.count);
    }
  });

  const loadLiveAttendance = async () => {
    try {
      const res = await api.get("/attendance/dashboard", {
        params: {
          filter: "present",
          date: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          }),
        },
      });
      setLiveAttendanceCount(res.data?.staff?.length || 0);
    } catch (err) {
      console.log("Live attendance load error", err);
    }
  };

  useEffect(() => {
    loadLiveAttendance();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => { await logout(); },
      },
    ]);
  };

  // ─── Card component ─────────────────────────────────────────────────────
  const Card = ({ title, permissionKey, onPress, badge }) => {
    if (!can(permissionKey)) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          backgroundColor: C.card,
          borderRadius: 16,
          marginBottom: isTablet ? vh * 2 : vh * 2.2,
          borderWidth: 1,
          borderColor: C.borderGold,
          paddingHorizontal: cvw * 5,
          paddingVertical: isTablet ? vh * 2.2 : vh * 2.5,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: title + badge */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: C.white,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 3.2 : cvw * 4.5,
            letterSpacing: 0.3,
          }}>
            {title}
          </Text>

          {badge !== undefined && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 5,
              gap: 5,
            }}>
              {/* Live pulse dot */}
              <View style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: C.gold,
              }} />
              <Text style={{
                color: C.gold,
                fontSize: isTablet ? cvw * 2.4 : cvw * 3.2,
                fontWeight: "600",
                letterSpacing: 0.5,
              }}>
                {badge} live
              </Text>
            </View>
          )}
        </View>

        {/* Right: chevron */}
        <Ionicons
          name="chevron-forward"
          size={isTablet ? cvw * 3 : cvw * 5}
          color={C.gold}
        />
      </TouchableOpacity>
    );
  };

  // ─── Cards list (shared between phone + tablet) ──────────────────────────
  const CardList = () => (
    <>
      <Card
        title="Booking Calendar"
        permissionKey="event.view_all"
        onPress={() => navigation.navigate("EventCalendar")}
      />
      <Card
        title="Attendance"
        permissionKey="attendance.view.dashboard_summary"
        onPress={() => navigation.navigate("Attendance")}
        badge={liveAttendanceCount}
      />
      <Card
        title="Venue"
        permissionKey="site.view"
        onPress={() => navigation.navigate("Venue")}
      />
    </>
  );

  // ─── PHONE layout (<768px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: vw * 5,
            paddingTop: vh * 4,
            paddingBottom: vh * 6,
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: vh * 4,
          }}>
            <View>
              <Text style={{
                color: C.gold,
                fontSize: cvw * 2.6,
                letterSpacing: 3,
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: 5,
              }}>
                Admin Portal
              </Text>
              <Text style={{
                color: C.white,
                fontSize: cvw * 6.5,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}>
                Dashboard
              </Text>
            </View>

            {canAccessSettings && (
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: cvw * 11,
                  height: cvw * 11,
                  borderRadius: cvw * 5.5,
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: C.borderGold,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="settings-outline" size={cvw * 5} color={C.gold} />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 3 }} />

          <CardList />

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              marginTop: vh * 1,
              backgroundColor: "rgba(124,29,29,0.25)",
              borderWidth: 1,
              borderColor: "rgba(192,57,43,0.4)",
              paddingVertical: vh * 1.8,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{
              color: "#E57373",
              fontWeight: "700",
              fontSize: cvw * 3.8,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768px) ──────────────────────────────────────────────
  //
  //  ┌──────────────────────────────────────────────────┐
  //  │  Admin Portal / Dashboard        [Settings icon] │  ← full-width header
  //  ├──────────────────────────────────────────────────┤
  //  │  Booking Calendar  ›  │  Attendance (live) ›    │  ← 2-col card grid
  //  ├───────────────────────┴─────────────────────────┤
  //  │  Venue  ›             │  (empty / future card)  │
  //  ├──────────────────────────────────────────────────┤
  //  │  Sign Out                                        │  ← full-width footer
  //  └──────────────────────────────────────────────────┘
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: vw * 4,
          paddingTop: vh * 3,
          paddingBottom: vh * 5,
        }}
      >
        {/* Full-width header */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: vh * 4,
        }}>
          <View>
            <Text style={{
              color: C.gold,
              fontSize: cvw * 2.2,
              letterSpacing: 3,
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: 5,
            }}>
              Admin Portal
            </Text>
            <Text style={{
              color: C.white,
              fontSize: cvw * 5,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}>
              Dashboard ✦
            </Text>
          </View>

          {canAccessSettings && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.borderGold,
                paddingHorizontal: cvw * 3,
                paddingVertical: vh * 1,
                borderRadius: 12,
              }}
            >
              <Ionicons name="settings-outline" size={cvw * 2.2} color={C.gold} />
              <Text style={{
                color: C.gold,
                fontWeight: "700",
                fontSize: cvw * 2.2,
                letterSpacing: 0.5,
              }}>
                Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 3 }} />

        {/* 2-column card grid */}
        <TabletCardGrid
          can={can}
          liveAttendanceCount={liveAttendanceCount}
          navigation={navigation}
          cvw={cvw}
          vh={vh}
          isTablet={isTablet}
        />

        {/* Full-width sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            marginTop: vh * 1,
            backgroundColor: "rgba(124,29,29,0.25)",
            borderWidth: 1,
            borderColor: "rgba(192,57,43,0.4)",
            paddingVertical: vh * 2,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{
            color: "#E57373",
            fontWeight: "700",
            fontSize: cvw * 2.8,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tablet 2-column card grid ───────────────────────────────────────────────
// Renders cards in rows of 2, keeping permission checks intact.
function TabletCardGrid({ can, liveAttendanceCount, navigation, cvw, vh }) {
  const allCards = [
    can("event.view_all") && {
      key: "booking",
      title: "Booking Calendar",
      onPress: () => navigation.navigate("EventCalendar"),
    },
    can("attendance.view.dashboard_summary") && {
      key: "attendance",
      title: "Attendance",
      badge: liveAttendanceCount,
      onPress: () => navigation.navigate("Attendance"),
    },
    can("site.view") && {
      key: "venue",
      title: "Venue",
      onPress: () => navigation.navigate("Venue"),
    },
  ].filter(Boolean);

  // Pair cards into rows of 2
  const rows = [];
  for (let i = 0; i < allCards.length; i += 2) {
    rows.push(allCards.slice(i, i + 2));
  }

  return (
    <View>
      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={{ flexDirection: "row", gap: cvw * 2, marginBottom: vh * 2 }}
        >
          {row.map((card) => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.8}
              onPress={card.onPress}
              style={{
                flex: 1,
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.borderGold,
                paddingHorizontal: cvw * 4,
                paddingVertical: vh * 2.5,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: C.white,
                  fontWeight: "700",
                  fontSize: cvw * 3,
                  letterSpacing: 0.3,
                }}>
                  {card.title}
                </Text>

                {card.badge !== undefined && (
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 5,
                    gap: 5,
                  }}>
                    <View style={{
                      width: 7, height: 7, borderRadius: 4,
                      backgroundColor: C.gold,
                    }} />
                    <Text style={{
                      color: C.gold,
                      fontSize: cvw * 2.2,
                      fontWeight: "600",
                      letterSpacing: 0.5,
                    }}>
                      {card.badge} live
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons name="chevron-forward" size={cvw * 2.5} color={C.gold} />
            </TouchableOpacity>
          ))}

          {/* If odd number of cards, fill the last slot with an empty spacer */}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}