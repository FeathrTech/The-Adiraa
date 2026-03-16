import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold:       "#C9A227",
  goldLight:  "#E8C45A",
  bg:         "#0A0A0A",
  surface:    "#131313",
  card:       "#1A1A1A",
  border:     "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white:      "#FFFFFF",
  muted:      "#777",
  faint:      "#333",
};

// ─── Responsive hook (breakpoint at 768 px) ───────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw       = width  / 100;
  const vh       = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw      = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminAttendanceDashboard() {
  const navigation  = useNavigation();
  const permissions = useAuthStore((s) => s.permissions) || [];
  const can         = (key) => permissions.includes(key);

  const { vw, vh, cvw, isTablet } = useResponsive();

  // ── Item row ──────────────────────────────────────────────────────────────
  const Item = ({ title, filter, permission, icon }) => {
    if (!can(permission)) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("LiveAttendanceMonitoring", { filter })}
        style={{
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.borderGold,
          borderRadius: 14,
          paddingHorizontal: cvw * 5,
          paddingVertical: isTablet ? vh * 2 : vh * 2.2,
          marginBottom: isTablet ? vh * 1.5 : vh * 1.8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: icon + title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3 }}>
          <View style={{
            width:  cvw * (isTablet ? 5 : 8),
            height: cvw * (isTablet ? 5 : 8),
            borderRadius: cvw * 4,
            backgroundColor: "rgba(201,162,39,0.12)",
            borderWidth: 1,
            borderColor: C.borderGold,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Ionicons
              name={icon}
              size={cvw * (isTablet ? 2.4 : 4)}
              color={C.gold}
            />
          </View>
          <Text style={{
            color: C.white,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 3 : cvw * 4.2,
            letterSpacing: 0.2,
          }}>
            {title}
          </Text>
        </View>

        {/* Right: chevron */}
        <Ionicons
          name="chevron-forward"
          size={cvw * (isTablet ? 2.2 : 4)}
          color={C.gold}
        />
      </TouchableOpacity>
    );
  };

  // ── Items list ────────────────────────────────────────────────────────────
  const ItemList = () => (
    <>
      <Item
        title="Total Staff"
        filter="all"
        permission="attendance.view.dashboard_summary"
        icon="people-outline"
      />
      <Item
        title="Present Today"
        filter="present"
        permission="attendance.view.live_status"
        icon="checkmark-circle-outline"
      />
      <Item
        title="Absent Today"
        filter="absent"
        permission="attendance.view.live_status"
        icon="close-circle-outline"
      />
      <Item
        title="Late Today"
        filter="late"
        permission="attendance.view.live_status"
        icon="time-outline"
      />
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
          paddingVertical: isTablet ? vh * 2 : vh * 2,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: isTablet ? vh * 1 : vh * 1,
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

          {/* Card container — mirrors the screenshot's rounded white card */}
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
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
              marginBottom: vh * 3,
            }}>
              Overview
            </Text>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 2.5 }} />

            <ItemList />

            {/* Spacer then report button pinned to bottom of card */}
            <View style={{ marginTop: vh * 1.5 }}>
              <ReportButton />
            </View>

          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
  //
  //  ┌─────────────────────────────────────────────────────┐
  //  │  Attendance  /  OVERVIEW              (full header) │
  //  ├──────────────────────────────────────────────────────┤
  //  │  Total Staff ›       │  Present Today ›             │   2-col grid
  //  │  Absent Today ›      │  Late Today ›                │
  //  ├──────────────────────────────────────────────────────┤
  //  │  View Attendance Report  (full width)               │
  //  └─────────────────────────────────────────────────────┘
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingHorizontal: vw * 4, justifyContent: "center" }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.borderGold,
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

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 3 }} />

          {/* 2-column item grid */}
          <TabletItemGrid
            can={can}
            navigation={navigation}
            cvw={cvw}
            vh={vh}
          />

          {/* Full-width report button */}
          <ReportButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Tablet 2-col item grid ───────────────────────────────────────────────────
function TabletItemGrid({ can, navigation, cvw, vh }) {
  const items = [
    { title: "Total Staff",    filter: "all",     permission: "attendance.view.dashboard_summary", icon: "people-outline" },
    { title: "Present Today",  filter: "present", permission: "attendance.view.live_status",       icon: "checkmark-circle-outline" },
    { title: "Absent Today",   filter: "absent",  permission: "attendance.view.live_status",       icon: "close-circle-outline" },
    { title: "Late Today",     filter: "late",    permission: "attendance.view.live_status",       icon: "time-outline" },
  ].filter((item) => can(item.permission));

  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: cvw * 2, marginBottom: vh * 1.8 }}>
          {row.map((item) => (
            <TouchableOpacity
              key={item.filter}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("LiveAttendanceMonitoring", { filter: item.filter })}
              style={{
                flex: 1,
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.borderGold,
                borderRadius: 14,
                paddingHorizontal: cvw * 4,
                paddingVertical: vh * 2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 2.5 }}>
                <View style={{
                  width: cvw * 5,
                  height: cvw * 5,
                  borderRadius: cvw * 2.5,
                  backgroundColor: "rgba(201,162,39,0.12)",
                  borderWidth: 1,
                  borderColor: C.borderGold,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name={item.icon} size={cvw * 2.4} color={C.gold} />
                </View>
                <Text style={{
                  color: C.white,
                  fontWeight: "700",
                  fontSize: cvw * 3,
                  letterSpacing: 0.2,
                }}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={cvw * 2.2} color={C.gold} />
            </TouchableOpacity>
          ))}
          {/* Spacer for odd-count rows */}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}