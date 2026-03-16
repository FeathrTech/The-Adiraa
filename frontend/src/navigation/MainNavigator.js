import { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Animated } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuthStore } from "../store/authStore";

import SplashScreen from "../screens/splash/SplashScreen";
import AuthStack from "./AuthStack";
import DashboardRouter from "../screens/dashboard/DashboardRouter";
import RoleStack from "./RoleStack";
import StaffStack from "./StaffStack";
import AttendanceStack from "./AttendanceStack";
import SiteStack from "./SiteStack";
import AttendanceConfigScreen from "../screens/settings/AttendanceConfigScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import GlobalLoader from "../components/layout/GlobalLoader";

const Stack = createNativeStackNavigator();

const SPLASH_DURATION = 4200; // ms — minimum splash display time

export default function MainNavigator() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  const [showSplash, setShowSplash] = useState(true);
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    // Wait until BOTH the minimum splash time has passed
    // AND restoreSession has finished (loading === false)
    if (loading) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, SPLASH_DURATION - elapsed);

    const timer = setTimeout(() => {
      // Fade out splash then unmount it
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, remaining);

    return () => clearTimeout(timer);
  }, [loading]);

  const startTime = useRef(Date.now());

  if (showSplash) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeOut }}>
        <SplashScreen />
      </Animated.View>
    );
  }

  return (
    <>
      <NavigationContainer>
        {!user ? (
          <AuthStack />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DashboardRouter} />
            <Stack.Screen name="Attendance" component={AttendanceStack} />
            <Stack.Screen name="Venue" component={SiteStack} />
            <Stack.Screen name="Staff" component={StaffStack} />
            <Stack.Screen name="Roles" component={RoleStack} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AttendanceConfig" component={AttendanceConfigScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <GlobalLoader />
    </>
  );
}