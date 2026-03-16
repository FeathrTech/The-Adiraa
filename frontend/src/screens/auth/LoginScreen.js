import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { loginRequest } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0A",
  card: "#161616",
  gold: "#C9A227",
  goldLight: "#D4AC35",
  goldDim: "rgba(201,162,39,0.15)",
  goldGlow: "rgba(201,162,39,0.08)",
  border: "rgba(201,162,39,0.45)",
  borderDim: "rgba(201,162,39,0.2)",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  mutedDim: "rgba(255,255,255,0.2)",
  inputBg: "rgba(201,162,39,0.08)",
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const login = useAuthStore((state) => state.login);

  // ─── Logic unchanged ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Validation Error", "All fields are required");
      return;
    }
    try {
      setLoading(true);
      const data = await loginRequest(username, password);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);
    } catch (error) {
      Alert.alert("Login Failed", error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = isTablet ? Math.min(width * 0.45, 480) : width - vw * 12;

  // Logo size — proportional to card width
  const logoSize = isTablet ? cardWidth * 0.28 : cardWidth * 0.32;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Subtle radial glow behind card */}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: vw * 6,
            paddingVertical: vh * 3,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── LOGO AREA ── */}
          <View style={{
            alignItems: "center",
            marginBottom: vh * 3.5,
          }}>
            {/* Glow ring behind logo */}
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

            {/* Decorative gold line under logo */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: 0.6,
            }}>
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
          }}>

            {/* Title */}
            <Text style={{
              color: C.gold,
              fontSize: isTablet ? 26 : 20,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: vh * 3.5,
              letterSpacing: 0.3,
            }}>
              Login into your account
            </Text>

            {/* Username input */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: C.inputBg,
              borderWidth: 1,
              borderColor: focusedField === "username" ? C.gold : C.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              marginBottom: vh * 2.5,
            }}>
              <TextInput
                placeholder="Username"
                placeholderTextColor={C.gold}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: isTablet ? 16 : 14,
                  paddingVertical: vh * 1.8,
                }}
              />
            </View>

            {/* Password input */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: C.inputBg,
              borderWidth: 1,
              borderColor: focusedField === "password" ? C.gold : C.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              marginBottom: vh * 4,
            }}>
              <TextInput
                placeholder="Password"
                placeholderTextColor={C.gold}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: isTablet ? 16 : 14,
                  paddingVertical: vh * 1.8,
                }}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={C.gold}
                />
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: loading ? "rgba(201,162,39,0.5)" : C.gold,
                borderRadius: 12,
                paddingVertical: vh * 1.8,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: vh * 2.5,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={{
                  color: "#000",
                  fontWeight: "700",
                  fontSize: isTablet ? 17 : 15,
                  letterSpacing: 0.5,
                }}>
                  Login
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot password */}
            <TouchableOpacity style={{ alignItems: "center", marginBottom: vh * 0.5 }}>
              <Text style={{ color: C.muted, fontSize: isTablet ? 14 : 12.5 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

          </View>

          {/* Create account — below card */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            style={{ marginTop: vh * 3, alignItems: "center" }}
          >
            <Text style={{ color: C.gold, fontSize: isTablet ? 14 : 13, fontWeight: "600" }}>
              Create New Company Account
            </Text>
          </TouchableOpacity>

          {/* Support link */}
          <TouchableOpacity style={{ marginTop: vh * 1.5, alignItems: "center" }}>
            <Text style={{ color: C.muted, fontSize: isTablet ? 13 : 12 }}>
              Need Help? Contact Support
            </Text>
          </TouchableOpacity>

          {/* ── POWERED BY ── */}
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

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}