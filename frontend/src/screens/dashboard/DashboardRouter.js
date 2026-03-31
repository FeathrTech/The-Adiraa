import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";

import DashboardScreen from "./DashboardScreen";
import StaffDashboard from "./StaffDashboard";
import EventCalendarScreen from "../events/EventCalendarScreen";
import CreateEventScreen from "../events/EventFormScreen";

import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();

// ─── Palette (mirrors LoginScreen) ───────────────────────────────────────────
const C = {
  bg: "#0A0A0A",
  card: "#161616",
  gold: "#C9A227",
  goldDim: "rgba(201,162,39,0.15)",
  goldGlow: "rgba(201,162,39,0.08)",
  border: "rgba(201,162,39,0.45)",
  borderDim: "rgba(201,162,39,0.2)",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
};

// ─── No Access Screen ─────────────────────────────────────────────────────────
function NoAccessScreen() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const logout = useAuthStore((s) => s.logout);

  const cardWidth = isTablet ? Math.min(width * 0.45, 480) : width - vw * 12;
  const logoSize = isTablet ? cardWidth * 0.28 : cardWidth * 0.32;

  const handleLogout = () => {
    Alert.alert(t("auth.signOut", "Sign Out"), t("roles.signOutAsk", "Are you sure you want to sign out?"), [
      { text: t("settings.cancel", "Cancel") },
      {
        text: t("auth.signOut", "Sign Out"),
        style: "destructive",
        onPress: async () => await logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Subtle radial glow — same as LoginScreen */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: height * 0.15,
          left: width * 0.5 - width * 0.55,
          width: width * 1.1,
          height: width * 1.1,
          borderRadius: width * 0.55,
          backgroundColor: "rgba(201,162,39,0.04)",
        }}
      />

      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: vw * 6,
      }}>

        {/* ── LOGO AREA — identical structure to LoginScreen ── */}
        <View style={{ alignItems: "center", marginBottom: vh * 3.5 }}>
          <View style={{
            width: logoSize + 24,
            height: logoSize + 24,
            borderRadius: (logoSize + 24) / 2,
            backgroundColor: C.goldGlow,
            borderWidth: 1,
            borderColor: C.borderDim,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: vh * 1.8,
          }}>
            <View style={{
              width: logoSize + 8,
              height: logoSize + 8,
              borderRadius: (logoSize + 8) / 2,
              backgroundColor: C.goldDim,
              borderWidth: 1,
              borderColor: "rgba(201,162,39,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Image
                source={require("../../../assets/images/adiraa.png")}
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize / 2,
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Decorative gold line */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.6 }}>
            <View style={{ width: isTablet ? 40 : 28, height: 1, backgroundColor: C.gold }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold }} />
            <View style={{ width: isTablet ? 40 : 28, height: 1, backgroundColor: C.gold }} />
          </View>
        </View>

        {/* ── CARD ── */}
        <View style={{
          width: cardWidth,
          backgroundColor: C.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: C.borderDim,
          paddingHorizontal: vw * 7,
          paddingVertical: vh * 4,
          alignItems: "center",
        }}>

          {/* Icon */}
          <View style={{
            width: isTablet ? 72 : 60,
            height: isTablet ? 72 : 60,
            borderRadius: isTablet ? 36 : 30,
            backgroundColor: "rgba(201,162,39,0.1)",
            borderWidth: 1,
            borderColor: C.borderDim,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: vh * 2,
          }}>
            <Ionicons
              name="lock-closed-outline"
              size={isTablet ? 32 : 26}
              color={C.gold}
            />
          </View>

          {/* Heading */}
          <Text style={{
            color: C.gold,
            fontSize: isTablet ? 22 : 18,
            fontWeight: "700",
            textAlign: "center",
            letterSpacing: 0.3,
            marginBottom: vh * 1.2,
          }}>
            {t("roles.noPermission", "No Access")}
          </Text>

          {/* Subtext */}
          <Text style={{
            color: C.muted,
            fontSize: isTablet ? 15 : 13.5,
            textAlign: "center",
            lineHeight: isTablet ? 24 : 20,
            marginBottom: vh * 3.5,
          }}>
            {t("roles.noDashboardAccess", "Your account doesn't have access to any dashboard.\nPlease contact your admin to get the required permissions.")}
          </Text>

          {/* Divider */}
          <View style={{ width: "100%", height: 1, backgroundColor: "rgba(201,162,39,0.15)", marginBottom: vh * 3 }} />

          {/* Sign Out button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              width: "100%",
              backgroundColor: C.redBg,
              borderWidth: 1,
              borderColor: C.redBorder,
              borderRadius: 12,
              paddingVertical: isTablet ? vh * 1.6 : vh * 1.8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="log-out-outline" size={isTablet ? 20 : 18} color={C.red} />
            <Text style={{
              color: C.red,
              fontWeight: "700",
              fontSize: isTablet ? 16 : 14,
              letterSpacing: 0.4,
            }}>
              {t("auth.signOut", "Sign Out")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Powered by */}
        <View style={{
          marginTop: vh * 3,
          alignItems: "center",
          flexDirection: "row",
          gap: 5,
        }}>
          <View style={{ width: 16, height: 1, backgroundColor: "rgba(201,162,39,0.3)" }} />
          <Text style={{
            color: "rgba(201,162,39,0.5)",
            fontSize: isTablet ? 11 : 10,
            fontWeight: "500",
            letterSpacing: 0.8,
          }}>
            Powered by FeathrTech
          </Text>
          <View style={{ width: 16, height: 1, backgroundColor: "rgba(201,162,39,0.3)" }} />
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function DashboardRouter() {
  const permissions = useAuthStore((s) => s.permissions);

  const isAdmin = can(permissions, "dashboard.view");
  const isStaff =
    can(permissions, "attendance.checkin") ||
    can(permissions, "attendance.checkout");

  if (!isAdmin && !isStaff) {
    return <NoAccessScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAdmin && (
        <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      )}

      {isStaff && (
        <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
      )}

      <Stack.Screen name="EventCalendar" component={EventCalendarScreen} />
      <Stack.Screen name="EventForm" component={CreateEventScreen} />
    </Stack.Navigator>
  );
}