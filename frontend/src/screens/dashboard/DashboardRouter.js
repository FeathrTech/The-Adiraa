// screens/dashboard/DashboardRouter.js

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";

import DashboardScreen from "./DashboardScreen";
import StaffDashboard from "./StaffDashboard";
import EventCalendarScreen from "../events/EventCalendarScreen";

import { View, Text } from "react-native";
import CreateEventScreen from "../events/EventFormScreen";

const Stack = createNativeStackNavigator();

export default function DashboardRouter() {
  const permissions = useAuthStore((s) => s.permissions);

  const isAdmin = can(permissions, "dashboard.view");

  const isStaff =
    can(permissions, "attendance.checkin") ||
    can(permissions, "attendance.checkout");

  if (!isAdmin && !isStaff) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No Dashboard Access</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAdmin && (
        <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      )}

      {isStaff && (
        <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
      )}

      {/* Event Calendar */}
      <Stack.Screen
        name="EventCalendar"
        component={EventCalendarScreen}
      />
      <Stack.Screen
        name="EventForm"
        component={CreateEventScreen}
      />
    </Stack.Navigator>
  );
}