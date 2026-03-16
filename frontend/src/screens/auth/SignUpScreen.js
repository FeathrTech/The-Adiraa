import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { registerTenantRequest } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

// ─── Palette (matches LoginScreen) ───────────────────────────────────────────
const C = {
  bg: "#0A0A0A",
  card: "#161616",
  gold: "#C9A227",
  border: "rgba(201,162,39,0.45)",
  borderDim: "rgba(201,162,39,0.2)",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  inputBg: "rgba(201,162,39,0.08)",
};

// ─── Shared input row ─────────────────────────────────────────────────────────
function InputRow({ placeholder, value, onChangeText, keyboardType, secureTextEntry, focused, onFocus, onBlur, right, isPhone, isTablet }) {
  const handleChange = (text) => {
    if (isPhone) {
      const digits = text.replace(/[^0-9]/g, "").slice(0, 10);
      onChangeText(digits);
    } else {
      onChangeText(text);
    }
  };

  const phoneCount = isPhone ? (value ? value.length : 0) : 0;

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: focused ? C.gold : C.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
    }}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={C.gold}
        value={value}
        onChangeText={handleChange}
        keyboardType={isPhone ? "numeric" : (keyboardType || "default")}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={isPhone ? 10 : undefined}
        style={{
          flex: 1,
          color: C.white,
          fontSize: isTablet ? 16 : 14,
          paddingVertical: 14,
        }}
      />
      {isPhone ? (
        <Text style={{
          color: phoneCount === 10 ? C.gold : "rgba(255,255,255,0.4)",
          fontSize: isTablet ? 13 : 12,
          fontWeight: "600",
          marginLeft: 8,
        }}>
          {phoneCount}/10
        </Text>
      ) : right}
    </View>
  );
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const login = useAuthStore((state) => state.login);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vh = height / 100;

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);

  // ─── Logic unchanged ──────────────────────────────────────────────────────
  const validate = () => {
    if (!companyName.trim()) return "Company name is required";
    if (!name.trim()) return "Owner name is required";
    if (!mobile.trim()) return "Mobile number is required";
    if (!password.trim()) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSignup = async () => {
    const error = validate();
    if (error) { Alert.alert("Validation Error", error); return; }
    try {
      setLoading(true);
      const data = await registerTenantRequest({ companyName, name, mobile, password });
      console.log("Signup response:", data);
      if (!data?.token || !data?.user) throw new Error("Invalid server response");
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);
      Alert.alert(
        "Account Created 🎉",
        `Your login username is:\n\n${data.user.username}\n\nPlease save this.`
      );
    } catch (error) {
      console.log("Signup error:", error);
      Alert.alert("Signup Failed", error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = isTablet ? Math.min(width * 0.45, 480) : width - (width * 0.12);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: vh * 4 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── CARD ── */}
          <View style={{
            width: cardWidth,
            backgroundColor: C.card,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: C.borderDim,
            paddingHorizontal: width * 0.07,
            paddingVertical: vh * 5,
          }}>

            {/* Title */}
            <Text style={{
              color: C.gold,
              fontSize: isTablet ? 26 : 20,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: vh * 4,
              letterSpacing: 0.3,
            }}>
              Create Company Account
            </Text>

            {/* Company Name */}
            <InputRow
              placeholder="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              focused={focused === "company"}
              onFocus={() => setFocused("company")}
              onBlur={() => setFocused(null)}
              isTablet={isTablet}
            />

            {/* Owner Name */}
            <InputRow
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              focused={focused === "name"}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              isTablet={isTablet}
            />

            {/* Mobile */}
            <InputRow
              placeholder="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              isPhone
              focused={focused === "mobile"}
              onFocus={() => setFocused("mobile")}
              onBlur={() => setFocused(null)}
              isTablet={isTablet}
            />

            {/* Password */}
            <InputRow
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              focused={focused === "password"}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              isTablet={isTablet}
              right={
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.gold} />
                </TouchableOpacity>
              }
            />

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: loading ? "rgba(201,162,39,0.5)" : C.gold,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                marginBottom: vh * 2.5,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={{ color: "#000", fontWeight: "700", fontSize: isTablet ? 17 : 15, letterSpacing: 0.5 }}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to login */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: "center" }}>
              <Text style={{ color: C.muted, fontSize: isTablet ? 14 : 12.5 }}>
                Back to Login
              </Text>
            </TouchableOpacity>

          </View>

          {/* Support link below card */}
          <TouchableOpacity style={{ marginTop: vh * 3, alignItems: "center" }}>
            <Text style={{ color: C.muted, fontSize: isTablet ? 13 : 12 }}>
              Need Help? Contact Support
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}