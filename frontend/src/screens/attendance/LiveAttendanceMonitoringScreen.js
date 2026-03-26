import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  StatusBar,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import { useEffect, useState } from "react";

import api from "../../api/axios";
import { useRealtime } from "../../hooks/useRealtime";
import { can } from "../../config/permissionMap";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
};

// ─── Status badge colours ─────────────────────────────────────────────────────
// ─── Status badge colours ─────────────────────────────────────────────────────
const STATUS = {
  Present: { bg: "rgba(93,190,138,0.15)", text: "#5DBE8A", border: "rgba(93,190,138,0.35)" },
  Absent: { bg: "rgba(229,115,115,0.15)", text: "#E57373", border: "rgba(229,115,115,0.35)" },
  Late: { bg: "rgba(232,195,74,0.15)", text: "#E8C34A", border: "rgba(232,195,74,0.35)" },
  NotMarked: { bg: "rgba(120,120,120,0.15)", text: "#999999", border: "rgba(120,120,120,0.35)" },
};

// ─── Responsive hook (breakpoint at 768 px) ───────────────────────────────────
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
export default function LiveAttendanceMonitoringScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const initialFilter = route.params?.filter || "all";
  const userPermissions = useAuthStore((state) => state.permissions || []);

  const [filter, setFilter] = useState(initialFilter);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const formattedDate = date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attendance/dashboard", {
        params: { filter, date: formattedDate },
      });
      setData(res.data.staff || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.log("Attendance load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, date]);

  // ─── Midnight IST reset ───────────────────────────────────────────────────
  // ─── Detect day change (IST safe) ──────────────────────────────────────────
  useEffect(() => {

    let lastDay = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const interval = setInterval(() => {

      const today = new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      if (today !== lastDay) {

        lastDay = today;

        const newDate = new Date();
        setDate(newDate);

        load(); // refresh stats automatically

      }

    }, 60000);

    return () => clearInterval(interval);

  }, []);

  useRealtime("attendance:updated", load);
  useRealtime("attendance:checkin", load);
  useRealtime("attendance:checkout", load);

  const handleAttendanceAction = async (item, action) => {
    try {

      const attendanceId = item.attendanceId;

      setLoading(true);

      // MARK PRESENT (for absent staff without record)
      if (action === "mark_present" && !attendanceId) {

        await api.post("/attendance/manual-mark", {
          userId: item.id,
          date: formattedDate,
          checkInTime: new Date().toTimeString().slice(0, 5)
        });

      }

      // MARK ABSENT (existing behaviour)
      else if (action === "mark_absent") {

        await api.post("/attendance/mark-absent", {
          userId: item.id,
          date: formattedDate
        });

      }

      // OTHER ACTIONS
      else {

        await api.patch(`/attendance/${attendanceId}/action`, { action });

      }

      await load();

    } catch (err) {

      console.log("Attendance action error", err);
      alert("Action failed");

    } finally {

      setLoading(false);

    }
  };

  const getActions = (item) => {
    const actions = [];
    if (can(userPermissions, "attendance.edit_record") && item.attendanceId) {
      actions.push({
        label: "Edit Record",
        action: () =>
          navigation.navigate("EditAttendanceRecord", {
            attendanceId: item.attendanceId,
          }),
      });
    }
    if (can(userPermissions, "attendance.mark_present"))
      actions.push({
        label: "Mark Present",
        action: () => handleAttendanceAction(item, "mark_present"),
      });
    if (can(userPermissions, "attendance.mark_absent"))
      actions.push({ label: "Mark Absent", action: () => handleAttendanceAction(item, "mark_absent") });
    if (can(userPermissions, "attendance.override_late"))
      actions.push({ label: "Override Late", action: () => handleAttendanceAction(item, "override_late") });
    if (can(userPermissions, "attendance.override_halfday"))
      actions.push({ label: "Override Half Day", action: () => handleAttendanceAction(item, "override_halfday") });
    if (can(userPermissions, "attendance.delete_record"))
      actions.push({ label: "Delete Record", action: () => handleAttendanceAction(item, "delete") });
    return actions;
  };

  const renderStatus = (status) => {
    const s = STATUS[status];
    if (!s) return null;

    const labels = {
      Present: "Present",
      Absent: "Absent",
      Late: "Late",
      NotMarked: "Not Marked",
    };

    const label = labels[status] ?? status;
    const isLong = label.length > 7; // "Not Marked" is long, others are short

    return (
      <View style={{
        paddingHorizontal: isLong ? vw * 1.5 : vw * 2.5,
        paddingVertical: vh * 0.5,
        borderRadius: 20,
        alignSelf: "center",
        backgroundColor: s.bg,
        borderWidth: 1,
        borderColor: s.border,
      }}>
        <Text
          numberOfLines={1}
          style={{
            color: s.text,
            fontSize: isLong ? vh * 1.2 : vh * 1.4,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    );
  };

  // ── Column widths differ phone vs tablet ───────────────────────────────────
  const colStaff = isTablet ? vw * 35 : vw * 40;
  const colStatus = isTablet ? vw * 18 : vw * 20;

  // ── Shared: table header ───────────────────────────────────────────────────
  const TableHeader = () => (
    <View style={{
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingBottom: vh * 1.2,
      marginBottom: vh * 0.5,
    }}>
      <Text style={{ width: colStaff, color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : vh * 1.6, letterSpacing: 1, textTransform: "uppercase" }}>Staff</Text>
      <Text style={{ width: colStatus, color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : vh * 1.6, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>Status</Text>
      <Text style={{ flex: 1, color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : vh * 1.6, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" }}>Actions</Text>
    </View>
  );

  // ── Shared: staff row ──────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const avatar = item.name?.charAt(0)?.toUpperCase() || "U";
    const actions = getActions(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Staff", { screen: "StaffDetail", params: { user: item } })}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: isTablet ? vh * 1.6 : vh * 1.4,
          borderBottomWidth: 1,
          borderBottomColor: C.border,

          zIndex: openMenu === item.id ? 1000 : 1,
          elevation: openMenu === item.id ? 1000 : 1,
        }}
      >
        {/* Avatar + name */}
        <View style={{ width: colStaff, flexDirection: "row", alignItems: "center" }}>
          <View style={{
            width: vw * (isTablet ? 5 : 8),
            height: vw * (isTablet ? 5 : 8),
            borderRadius: vw * 4,
            backgroundColor: C.faint,
            borderWidth: 1,
            borderColor: C.borderGold,
            justifyContent: "center",
            alignItems: "center",
            marginRight: vw * 2,
          }}>
            <Text style={{ color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.5 : vw * 3.5 }}>
              {avatar}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontWeight: "600", fontSize: isTablet ? cvw * 2.6 : vh * 1.7 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : vh * 1.4 }} numberOfLines={1}>
              {item.roles?.map((r) => r.name).join(", ")}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={{ width: colStatus }}>
          {renderStatus(item.status)}
        </View>

        {/* Actions menu */}
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <TouchableOpacity
            onPress={() => setOpenMenu(openMenu === item.id ? null : item.id)}
            style={{ padding: vw * 1 }}
          >
            <Ionicons name="ellipsis-vertical" size={vh * 2.2} color={C.muted} />
          </TouchableOpacity>

          {openMenu === item.id && actions.length > 0 && (
            <View style={{
              position: "absolute",
              top: vh * 3.5,
              right: vw * 1,
              width: vw * (isTablet ? 26 : 48),
              backgroundColor: C.cardAlt,
              borderRadius: 12,
              elevation: 2000,
              shadowColor: "#000",
              shadowOpacity: 0.4,
              shadowRadius: 10,
              borderWidth: 1,
              borderColor: C.borderGold,
              overflow: "hidden",
              zIndex: 2000,
            }}>
              {actions.map((a, i) => (
                <TouchableOpacity
                  key={a.label}
                  onPress={() => { setOpenMenu(null); a.action(); }}
                  style={{
                    paddingVertical: vh * 1.3,
                    paddingHorizontal: vw * 4,
                    borderBottomWidth: i !== actions.length - 1 ? 1 : 0,
                    borderBottomColor: C.border,
                  }}
                >
                  <Text style={{
                    fontSize: isTablet ? cvw * 2.2 : vh * 1.55,
                    color: a.label === "Delete Record" ? "#E57373" : C.white,
                    fontWeight: a.label === "Delete Record" ? "700" : "500",
                  }}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Shared: date picker + filter bar ───────────────────────────────────────
  const Controls = () => (
    <View style={{ paddingHorizontal: vw * 4, marginTop: vh * 2 }}>
      {/* Date picker */}
      <TouchableOpacity
        onPress={() => setShowCalendar(true)}
        style={{
          backgroundColor: C.card,
          borderRadius: 10,
          paddingVertical: vh * 1.1,
          paddingHorizontal: vw * 3,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderWidth: 1,
          borderColor: C.borderGold,
        }}
      >
        <Text style={{ color: C.white, fontSize: isTablet ? cvw * 2.6 : vh * 1.6 }}>
          {date.toDateString()}
        </Text>
        <Ionicons name="calendar" size={vh * 2} color={C.gold} />
      </TouchableOpacity>

      {/* Filter chips */}
      <View style={{ flexDirection: "row", marginTop: vh * 1.5, gap: vw * 2, flexWrap: "wrap" }}>
        {["all", "present", "absent", "late", "not_marked"].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={{
              paddingHorizontal: vw * (isTablet ? 3 : 4),
              paddingVertical: vh * 0.8,
              borderRadius: 20,
              backgroundColor: filter === item ? C.gold : C.faint,
              borderWidth: 1,
              borderColor: filter === item ? C.gold : C.border,
            }}
          >
            <Text style={{
              fontSize: isTablet ? cvw * 2.2 : vh * 1.5,
              textTransform: "capitalize",
              color: filter === item ? "#000" : C.muted,
              fontWeight: filter === item ? "700" : "500",
            }}>
              {item === "not_marked" ? "Not Marked" : item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total count */}
      <Text style={{ color: C.muted, marginTop: vh * 1, fontSize: isTablet ? cvw * 2.2 : vh * 1.6 }}>
        Total Staff:{" "}
        <Text style={{ color: C.gold, fontWeight: "700" }}>{total}</Text>
      </Text>
    </View>
  );

  // ── Calendar modal (shared) ─────────────────────────────────────────────────
  const CalendarModal = () =>
    showCalendar ? (
      <Pressable
        onPress={() => setShowCalendar(false)}
        style={{
          position: "absolute",
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable>
          <Calendar
            current={formattedDate}
            onDayPress={(day) => {
              setDate(new Date(day.dateString));
              setShowCalendar(false);
            }}
            markedDates={{ [formattedDate]: { selected: true, selectedColor: C.gold } }}
            theme={{
              backgroundColor: C.card,
              calendarBackground: C.card,
              textSectionTitleColor: C.gold,
              selectedDayBackgroundColor: C.gold,
              selectedDayTextColor: "#000",
              todayTextColor: C.goldLight,
              dayTextColor: C.white,
              textDisabledColor: C.faint,
              arrowColor: C.gold,
              monthTextColor: C.white,
              indicatorColor: C.gold,
            }}
            style={{
              width: vw * 90,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.borderGold,
              overflow: "hidden",
            }}
          />
        </Pressable>
      </Pressable>
    ) : null;

  // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: vw * 4,
          marginTop: vh * 1,
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={vh * 2.5} color={C.gold} />
          </TouchableOpacity>
          <Text style={{ color: C.white, fontSize: vh * 2, fontWeight: "700" }}>
            Live Attendance
          </Text>
          <Ionicons name="person-circle-outline" size={vh * 3} color={C.gold} />
        </View>

        <Controls />

        {/* Table card */}
        <View style={{
          flex: 1,
          marginTop: vh * 2,
          marginHorizontal: vw * 4,
          marginBottom: vh * 2,
          backgroundColor: C.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: C.borderGold,
          padding: vw * 4,
        }}>
          <TableHeader />
          {loading && (
            <View style={{ paddingVertical: vh * 2 }}>
              <ActivityIndicator size="small" color={C.gold} />
            </View>
          )}
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ alignItems: "center", marginTop: vh * 10 }}>
                <Ionicons name="people-outline" size={vh * 5} color={C.faint} />
                <Text style={{ color: C.muted, fontSize: vh * 1.6, marginTop: vh * 1 }}>
                  No attendance records
                </Text>
              </View>
            )}
          />
        </View>

        <CalendarModal />
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
  //
  //  ┌─────────────────────────────────────────────────┐
  //  │  ← Back   Live Attendance Monitoring   👤       │  header
  //  ├──────────────────────────────────────────────────┤
  //  │  [Date picker]    [all] [present] [absent] [late]│  controls row
  //  │  Total Staff: N                                  │
  //  ├──────────────────────────────────────────────────┤
  //  │  Staff              │  Status  │  Actions        │  table (full width)
  //  │  ...rows...                                      │
  //  └─────────────────────────────────────────────────┘
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: vw * 4,
        marginTop: vh * 1,
        marginBottom: vh * 0.5,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: C.card,
            paddingHorizontal: cvw * 3,
            paddingVertical: vh * 0.9,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: C.borderGold,
          }}
        >
          <Ionicons name="arrow-back" size={cvw * 2.2} color={C.gold} />
          <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ color: C.white, fontSize: cvw * 3, fontWeight: "800", letterSpacing: -0.3 }}>
          Live Attendance Monitoring
        </Text>

        <Ionicons name="person-circle-outline" size={cvw * 4} color={C.gold} />
      </View>

      {/* Controls — horizontal on tablet */}
      <View style={{
        paddingHorizontal: vw * 4,
        marginTop: vh * 1.5,
        flexDirection: "row",
        alignItems: "center",
        gap: vw * 2,
        flexWrap: "wrap",
      }}>
        {/* Date picker */}
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          style={{
            backgroundColor: C.card,
            borderRadius: 10,
            paddingVertical: vh * 1,
            paddingHorizontal: vw * 2.5,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: C.borderGold,
          }}
        >
          <Ionicons name="calendar" size={cvw * 2.2} color={C.gold} />
          <Text style={{ color: C.white, fontSize: cvw * 2.4 }}>
            {date.toDateString()}
          </Text>
        </TouchableOpacity>

        {/* Filter chips */}
        {["all", "present", "absent", "late"].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={{
              paddingHorizontal: vw * 2.5,
              paddingVertical: vh * 0.8,
              borderRadius: 20,
              backgroundColor: filter === item ? C.gold : C.faint,
              borderWidth: 1,
              borderColor: filter === item ? C.gold : C.border,
            }}
          >
            <Text style={{
              fontSize: cvw * 2.2,
              textTransform: "capitalize",
              color: filter === item ? "#000" : C.muted,
              fontWeight: filter === item ? "700" : "500",
            }}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Total badge */}
        <View style={{
          marginLeft: "auto",
          backgroundColor: C.card,
          paddingHorizontal: vw * 2.5,
          paddingVertical: vh * 0.9,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.borderGold,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}>
          <Ionicons name="people-outline" size={cvw * 2.2} color={C.gold} />
          <Text style={{ color: C.muted, fontSize: cvw * 2.2 }}>
            Total: <Text style={{ color: C.gold, fontWeight: "700" }}>{total}</Text>
          </Text>
        </View>
      </View>

      {/* Table card — full width on tablet */}
      <View style={{
        flex: 1,
        marginTop: vh * 2,
        marginHorizontal: vw * 4,
        marginBottom: vh * 2,
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.borderGold,
        padding: vw * 3,
      }}>
        <TableHeader />
        {loading && (
          <View style={{ paddingVertical: vh * 2 }}>
            <ActivityIndicator size="small" color={C.gold} />
          </View>
        )}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: vh * 10 }}>
              <Ionicons name="people-outline" size={vh * 5} color={C.faint} />
              <Text style={{ color: C.muted, fontSize: cvw * 2.4, marginTop: vh * 1 }}>
                No attendance records
              </Text>
            </View>
          )}
        />
      </View>

      <CalendarModal />
    </SafeAreaView>
  );
}