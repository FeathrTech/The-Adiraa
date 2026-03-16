import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { can } from "../config/permissionMap";

import CheckInScreen from "../screens/attendance/CheckInScreen";
import AdminAttendanceDashboard from "../screens/attendance/AdminAttendanceDashboard";
import LiveAttendanceMonitoringScreen from "../screens/attendance/LiveAttendanceMonitoringScreen";
import EditAttendanceRecordScreen from "../screens/attendance/EditAttendanceRecordScreen";
import CheckOutScreen from "../screens/attendance/CheckOutScreen";
import StaffAttendanceHistory from "../screens/attendance/StaffAttendanceHistory";

const Stack = createNativeStackNavigator();

export default function AttendanceStack() {

  const permissions = useAuthStore((s) => s.permissions) || [];

  const isAdmin = can(permissions, "attendance.view.dashboard_summary");
  const isStaff =
    can(permissions, "attendance.checkin") ||
    can(permissions, "attendance.checkout");
  const canViewOwn = can(permissions, "attendance.view.own");

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* ADMIN DASHBOARD */}
      {isAdmin && (
        <Stack.Screen
          name="AttendanceDashboard"
          component={AdminAttendanceDashboard}
        />
      )}

      {/* STAFF CHECKIN */}
      {isStaff && (
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
        />
      )}

      {isStaff && (
        <Stack.Screen
          name="CheckOut"
          component={CheckOutScreen}
        />
      )}

      {/* STAFF ATTENDANCE HISTORY */}
      {canViewOwn && (
        <Stack.Screen
          name="StaffAttendanceHistory"
          component={StaffAttendanceHistory}
        />
      )}

      {/* LIVE ATTENDANCE MONITOR */}
      {isAdmin && (
        <Stack.Screen
          name="LiveAttendanceMonitoring"
          component={LiveAttendanceMonitoringScreen}
        />
      )}

      {/* EDIT ATTENDANCE RECORD */}
      {isAdmin && (
        <Stack.Screen
          name="EditAttendanceRecord"
          component={EditAttendanceRecordScreen}
        />
      )}
    </Stack.Navigator>
  );
}