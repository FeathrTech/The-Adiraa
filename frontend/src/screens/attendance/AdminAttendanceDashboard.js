import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState, useRef } from "react";
import { fetchAttendanceDashboard } from "../../api/attendanceApi";
import { useRealtime } from "../../hooks/useRealtime";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "rgba(201,162,39,0.15)",
  goldBorder: "rgba(201,162,39,0.30)",
  bg: "#0A0A0A",
  surface: "#111111",
  card: "#181818",
  border: "#252525",
  white: "#FFFFFF",
  muted: "#555",

  // Status colours
  presentBg: "rgba(52,199,89,0.12)",
  presentText: "#34C759",
  presentBorder: "rgba(52,199,89,0.30)",

  absentBg: "rgba(255,69,58,0.12)",
  absentText: "#FF453A",
  absentBorder: "rgba(255,69,58,0.30)",

  lateBg: "rgba(255,159,10,0.12)",
  lateText: "#FF9F0A",
  lateBorder: "rgba(255,159,10,0.30)",

  allBg: "rgba(201,162,39,0.12)",
  allText: "#C9A227",
  allBorder: "rgba(201,162,39,0.30)",
};

// ─── Per-filter colour map ─────────────────────────────────────────────────────
const FILTER_COLOR = {
  all: { bg: C.allBg, text: C.allText, border: C.allBorder, icon: C.gold },
  present: { bg: C.presentBg, text: C.presentText, border: C.presentBorder, icon: C.presentText },
  absent: { bg: C.absentBg, text: C.absentText, border: C.absentBorder, icon: C.absentText },
  late: { bg: C.lateBg, text: C.lateText, border: C.lateBorder, icon: C.lateText },
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

// ─── Shimmer badge (shown while loading) ──────────────────────────────────────
function ShimmerBadge({ cvw, isTablet }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.45] });

  return (
    <Animated.View
      style={{
        opacity,
        width: cvw * (isTablet ? 7 : 10),
        height: cvw * (isTablet ? 3.4 : 5.2),
        borderRadius: cvw * 2,
        backgroundColor: "#444",
        marginRight: cvw * 2.5,
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminAttendanceDashboard() {
  const navigation = useNavigation();
  const permissions = useAuthStore((s) => s.permissions) || [];
  const can = (key) => permissions.includes(key);
  const { vw, vh, cvw, isTablet } = useResponsive();

  const [summary, setSummary] = useState({ all: null, present: null, absent: null, late: null });
  const [loading, setLoading] = useState(true);

  // ── IST-safe: todayIST recomputed fresh on every call ────────────────────
  const loadSummary = async () => {
    try {
      const todayIST = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const filters = ["all", "present", "absent", "late"];
      const results = await Promise.all(
        filters.map((filter) =>
          fetchAttendanceDashboard({ filter, date: todayIST })
            .then((res) => ({ filter, total: res.data.total ?? 0 }))
            .catch(() => ({ filter, total: null }))
        )
      );
      const next = {};
      results.forEach(({ filter, total }) => (next[filter] = total));
      setSummary(next);
    } catch (err) {
      console.log("Dashboard summary error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  useRealtime("attendance:updated", loadSummary);
  useRealtime("attendance:checkin", loadSummary);
  useRealtime("attendance:checkout", loadSummary);

  // ── Divider with centre gold accent ──────────────────────────────────────
  const Divider = ({ mb }) => (
    <View style={{ alignItems: "center", marginBottom: mb }}>
      <View style={{ height: 1, backgroundColor: C.border, width: "100%" }} />
      <View style={{
        position: "absolute",
        top: -1,
        width: cvw * (isTablet ? 18 : 28),
        height: 2,
        backgroundColor: C.gold,
        borderRadius: 2,
        opacity: 0.45,
      }} />
    </View>
  );

  // ── Single tile ───────────────────────────────────────────────────────────
  const Item = ({ title, filter, permission, icon, count }) => {
    if (!can(permission)) return null;
    const fc = FILTER_COLOR[filter] || FILTER_COLOR.all;

    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={() => navigation.navigate("LiveAttendanceMonitoring", { filter })}
        style={{
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 16,
          paddingHorizontal: cvw * 5,
          paddingVertical: isTablet ? vh * 1.8 : vh * 2,
          marginBottom: isTablet ? vh * 1.4 : vh * 1.6,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Coloured icon bubble */}
        <View style={{
          width: cvw * (isTablet ? 5.5 : 9),
          height: cvw * (isTablet ? 5.5 : 9),
          borderRadius: cvw * 3,
          backgroundColor: fc.bg,
          borderWidth: 1,
          borderColor: fc.border,
          alignItems: "center",
          justifyContent: "center",
          marginRight: cvw * 3.5,
          flexShrink: 0,
        }}>
          <Ionicons
            name={icon}
            size={cvw * (isTablet ? 2.6 : 4.2)}
            color={fc.icon}
          />
        </View>

        {/* Title */}
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: C.white,
            fontWeight: "600",
            fontSize: isTablet ? cvw * 2.8 : cvw * 4,
            letterSpacing: 0.1,
          }}
        >
          {title}
        </Text>

        {/* Shimmer while loading, coloured pill after */}
        {loading ? (
          <ShimmerBadge cvw={cvw} isTablet={isTablet} />
        ) : count !== null && count !== undefined ? (
          <View style={{
            backgroundColor: fc.bg,
            borderWidth: 1,
            borderColor: fc.border,
            borderRadius: cvw * 3,
            paddingHorizontal: cvw * (isTablet ? 2 : 3.2),
            paddingVertical: isTablet ? vh * 0.45 : vh * 0.55,
            marginRight: cvw * 2.5,
            minWidth: cvw * (isTablet ? 6 : 9),
            alignItems: "center",
          }}>
            <Text style={{
              color: fc.text,
              fontWeight: "800",
              fontSize: isTablet ? cvw * 2.6 : cvw * 3.8,
            }}>
              {count}
            </Text>
          </View>
        ) : null}

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={cvw * (isTablet ? 2.2 : 3.8)}
          color={C.muted}
        />
      </TouchableOpacity>
    );
  };

  // ── Items list ────────────────────────────────────────────────────────────
  const ItemList = () => (
    <>
      <Item title="Total Staff" filter="all" permission="attendance.view.dashboard_summary" icon="people-outline" count={summary.all} />
      <Item title="Present Today" filter="present" permission="attendance.view.live_status" icon="checkmark-circle-outline" count={summary.present} />
      <Item title="Absent Today" filter="absent" permission="attendance.view.live_status" icon="close-circle-outline" count={summary.absent} />
      <Item title="Late Today" filter="late" permission="attendance.view.live_status" icon="time-outline" count={summary.late} />
    </>
  );

  // ── Report button ─────────────────────────────────────────────────────────
  const ReportButton = () => {
    if (!can("attendance.view.photos_and_location")) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("LiveAttendanceMonitoring", { filter: "report" })}
        style={{
          backgroundColor: C.gold,
          borderRadius: 14,
          paddingVertical: vh * 2,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: vh * 1.5,
        }}
      >
        <Ionicons name="document-text-outline" size={cvw * (isTablet ? 2.4 : 4.5)} color="#000" />
        <Text style={{
          color: "#000",
          fontWeight: "800",
          fontSize: isTablet ? cvw * 2.8 : cvw * 4,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}>
          View Attendance Report
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />

        <View style={{ flex: 1, paddingHorizontal: vw * 5, justifyContent: "center" }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.goldBorder,
            paddingHorizontal: vw * 5,
            paddingTop: vh * 3.5,
            paddingBottom: vh * 3,
          }}>
            {/* Title */}
            <Text style={{
              color: C.white,
              textAlign: "center",
              fontSize: cvw * 5,
              fontWeight: "800",
              letterSpacing: -0.3,
              marginBottom: vh * 0.5,
            }}>
              Attendance
            </Text>
            <Text style={{
              color: C.gold,
              textAlign: "center",
              fontSize: cvw * 2.8,
              fontWeight: "700",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: vh * 2.8,
            }}>
              Overview
            </Text>

            <Divider mb={vh * 2.5} />

            <ItemList />

            <View style={{ marginTop: vh * 0.5 }}>
              <ReportButton />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingHorizontal: vw * 4, justifyContent: "center" }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.goldBorder,
          paddingHorizontal: vw * 4,
          paddingTop: vh * 4,
          paddingBottom: vh * 3.5,
        }}>
          {/* Title */}
          <Text style={{
            color: C.white,
            textAlign: "center",
            fontSize: cvw * 4.5,
            fontWeight: "800",
            letterSpacing: -0.3,
            marginBottom: vh * 0.5,
          }}>
            Attendance
          </Text>
          <Text style={{
            color: C.gold,
            textAlign: "center",
            fontSize: cvw * 2.2,
            fontWeight: "700",
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: vh * 3,
          }}>
            Overview
          </Text>

          <Divider mb={vh * 3} />

          <TabletItemGrid
            can={can}
            navigation={navigation}
            cvw={cvw}
            vh={vh}
            summary={summary}
            loading={loading}
          />

          <ReportButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Tablet 2-col item grid ───────────────────────────────────────────────────
function TabletItemGrid({ can, navigation, cvw, vh, summary, loading }) {
  const items = [
    { title: "Total Staff", filter: "all", permission: "attendance.view.dashboard_summary", icon: "people-outline", count: summary.all },
    { title: "Present Today", filter: "present", permission: "attendance.view.live_status", icon: "checkmark-circle-outline", count: summary.present },
    { title: "Absent Today", filter: "absent", permission: "attendance.view.live_status", icon: "close-circle-outline", count: summary.absent },
    { title: "Late Today", filter: "late", permission: "attendance.view.live_status", icon: "time-outline", count: summary.late },
  ].filter((item) => can(item.permission));

  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: cvw * 2, marginBottom: vh * 1.8 }}>
          {row.map((item) => {
            const fc = FILTER_COLOR[item.filter] || FILTER_COLOR.all;
            return (
              <TouchableOpacity
                key={item.filter}
                activeOpacity={0.72}
                onPress={() =>
                  navigation.navigate("LiveAttendanceMonitoring", { filter: item.filter })
                }
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 16,
                  paddingHorizontal: cvw * 3.5,
                  paddingVertical: vh * 1.8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {/* Coloured icon bubble */}
                <View style={{
                  width: cvw * 5.5,
                  height: cvw * 5.5,
                  borderRadius: cvw * 3,
                  backgroundColor: fc.bg,
                  borderWidth: 1,
                  borderColor: fc.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: cvw * 2.2,
                  flexShrink: 0,
                }}>
                  <Ionicons name={item.icon} size={cvw * 2.6} color={fc.icon} />
                </View>

                {/* Title */}
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: C.white,
                    fontWeight: "600",
                    fontSize: cvw * 2.8,
                    letterSpacing: 0.1,
                  }}
                >
                  {item.title}
                </Text>

                {/* Shimmer or coloured count */}
                {loading ? (
                  <ShimmerBadge cvw={cvw} isTablet />
                ) : item.count !== null && item.count !== undefined ? (
                  <View style={{
                    backgroundColor: fc.bg,
                    borderWidth: 1,
                    borderColor: fc.border,
                    borderRadius: cvw * 2.5,
                    paddingHorizontal: cvw * 1.8,
                    paddingVertical: vh * 0.4,
                    marginRight: cvw * 1.5,
                    minWidth: cvw * 5,
                    alignItems: "center",
                  }}>
                    <Text style={{
                      color: fc.text,
                      fontWeight: "800",
                      fontSize: cvw * 2.6,
                    }}>
                      {item.count}
                    </Text>
                  </View>
                ) : null}

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={cvw * 2.2} color={C.muted} />
              </TouchableOpacity>
            );
          })}
          {/* Spacer for odd-count rows */}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}