import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
};

// ─── Responsive hook (breakpoint 768 px) ─────────────────────────────────────
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
export default function SettingsScreen() {
  const navigation = useNavigation();
  const { permissions, logout } = useAuthStore();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const can = (key) => permissions?.includes(key);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  // ─── Regular nav item ─────────────────────────────────────────────────────
  const Item = ({ title, hint, icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderGold,
        paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
        paddingVertical: isTablet ? vh * 1.8 : vh * 2.2,
        marginBottom: isTablet ? vh * 1.5 : vh * 1.8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: icon circle + label */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1 }}>
        <View style={{
          width: isTablet ? cvw * 5 : cvw * 9,
          height: isTablet ? cvw * 5 : cvw * 9,
          borderRadius: cvw * 5,
          backgroundColor: "rgba(201,162,39,0.12)",
          borderWidth: 1,
          borderColor: C.borderGold,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Ionicons
            name={icon}
            size={isTablet ? cvw * 2.4 : cvw * 4.2}
            color={C.gold}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{
            color: C.white,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 2.8 : cvw * 4.2,
            letterSpacing: 0.2,
          }}>
            {title}
          </Text>
          {hint && (
            <Text
              numberOfLines={1}
              style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 2 : cvw * 3,
                marginTop: 2,
              }}
            >
              {hint}
            </Text>
          )}
        </View>
      </View>

      {/* Right: chevron */}
      <Ionicons
        name="chevron-forward"
        size={isTablet ? cvw * 2.2 : cvw * 4}
        color={C.gold}
      />
    </TouchableOpacity>
  );

  // ─── Logout item (styled separately — danger tone) ────────────────────────
  const LogoutItem = () => (
    <TouchableOpacity
      onPress={handleLogout}
      activeOpacity={0.8}
      style={{
        backgroundColor: "rgba(124,29,29,0.25)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(192,57,43,0.4)",
        paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
        paddingVertical: isTablet ? vh * 1.8 : vh * 2,
        marginTop: isTablet ? vh * 1 : vh * 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Ionicons
        name="log-out-outline"
        size={isTablet ? cvw * 2.4 : cvw * 4.5}
        color="#E57373"
      />
      <Text style={{
        color: "#E57373",
        fontWeight: "700",
        fontSize: isTablet ? cvw * 2.8 : cvw * 4,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}>
        Sign Out
      </Text>
    </TouchableOpacity>
  );

  // ─── Items list (shared between phone + tablet) ───────────────────────────
  const ItemList = () => (
    <>
      {can("role.view") && (
        <Item
          title="Roles"
          hint="Manage permission roles for your team"
          icon="shield-outline"
          onPress={() => navigation.navigate("Roles")}
        />
      )}

      {can("staff.view") && (
        <Item
          title="Staff"
          hint="View and manage staff accounts"
          icon="people-outline"
          onPress={() => navigation.navigate("Staff")}
        />
      )}

      {can("settings.attendance.edit") && (
        <Item
          title="Attendance Configuration"
          hint="Set shift times, radius rules, and check-in policies"
          icon="time-outline"
          onPress={() => navigation.navigate("AttendanceConfig")}
        />
      )}

      {/* {(can("settings.notifications.view") || can("settings.notifications.edit")) && (
        <Item
          title="Notifications"
          hint="Configure push alerts and notification preferences"
          icon="notifications-outline"
          onPress={() => navigation.navigate("Notifications")}
        />
      )} */}

      {/* Divider before logout */}
      <View style={{ height: 1, backgroundColor: C.border, marginVertical: isTablet ? vh * 1.5 : vh * 1.8 }} />

      <LogoutItem />
    </>
  );

  // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4, paddingBottom: vh * 4 }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            flex: 1,
            padding: vw * 5,
          }}>
            <Header navigation={navigation} cvw={cvw} isTablet={isTablet} />
            <ItemList />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
  //  Form column centred, items in 2-col grid
  //
  //  ┌──────────────────────────────────────────────────┐
  //  │  ← Back   Settings                              │
  //  ├──────────────────────┬───────────────────────────┤
  //  │  Roles ›             │  Staff ›                 │
  //  │  Attendance Config › │  Notifications ›         │
  //  ├──────────────────────┴───────────────────────────┤
  //  │  Sign Out  (full width)                          │
  //  └──────────────────────────────────────────────────┘

  // Build visible nav items for 2-col grid
  const navItems = [
    can("role.view") && { title: "Roles", hint: "Manage permission roles", icon: "shield-outline", onPress: () => navigation.navigate("Roles") },
    can("staff.view") && { title: "Staff", hint: "View and manage staff accounts", icon: "people-outline", onPress: () => navigation.navigate("Staff") },
    can("settings.attendance.edit") && { title: "Attendance Configuration", hint: "Shift times, radius and policies", icon: "time-outline", onPress: () => navigation.navigate("AttendanceConfig") },
    (can("settings.notifications.view") || can("settings.notifications.edit")) && { title: "Notifications", hint: "Push alerts and preferences", icon: "notifications-outline", onPress: () => navigation.navigate("Notifications") },
  ].filter(Boolean);

  const rows = [];
  for (let i = 0; i < navItems.length; i += 2) rows.push(navItems.slice(i, i + 2));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingHorizontal: vw * 4, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.borderGold,
          flex: 1,
          padding: vw * 3,
        }}>
          <Header navigation={navigation} cvw={cvw} isTablet={isTablet} />

          {/* 2-col item grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: vw * 2 }}>
              {row.map((item) => (
                <View key={item.title} style={{ flex: 1 }}>
                  <Item
                    title={item.title}
                    hint={item.hint}
                    icon={item.icon}
                    onPress={item.onPress}
                  />
                </View>
              ))}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}

          {/* Divider + logout full-width */}
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: vh * 1.5 }} />
          <LogoutItem />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Screen header ────────────────────────────────────────────────────────────
function Header({ navigation, cvw, isTablet }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: isTablet ? cvw * 2 : cvw * 5,
      paddingBottom: isTablet ? cvw * 1.5 : cvw * 4,
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

      <View>
        <Text style={{
          color: C.gold,
          fontSize: isTablet ? cvw * 2 : cvw * 2.8,
          letterSpacing: 3, fontWeight: "700",
          textTransform: "uppercase", marginBottom: 2,
        }}>
          Admin
        </Text>
        <Text style={{
          color: C.white,
          fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
          fontWeight: "800", letterSpacing: -0.3,
        }}>
          Settings
        </Text>
      </View>
    </View>
  );
}