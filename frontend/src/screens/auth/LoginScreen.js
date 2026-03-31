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
  Modal,
  Linking,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { loginRequest } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

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
  surface: "#131313",
  faint: "#333",
};

// ─── Support contact details ──────────────────────────────────────────────────
const SUPPORT = {
  email: "info@feathrtech.com",
  phone: "+91 84489 98434",
  whatsapp: "+91 84489 98434",
  website: "https://feathrtech.com",
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
  const [supportVisible, setSupportVisible] = useState(false);

  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);

  // ─── Logic unchanged ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t("auth.validationError"), t("auth.allFieldsRequired"));
      return;
    }
    try {
      setLoading(true);
      const data = await loginRequest(username, password);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);
    } catch (error) {
      Alert.alert(t("auth.loginFailed"), error.response?.data?.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = isTablet ? Math.min(width * 0.45, 480) : width - vw * 12;
  const logoSize = isTablet ? cardWidth * 0.28 : cardWidth * 0.32;

  // ─── Support contact actions ──────────────────────────────────────────────
  const contactActions = [
    {
      icon: "mail-outline",
      label: t("auth.emailUs"),
      value: SUPPORT.email,
      onPress: () => Linking.openURL(`mailto:${SUPPORT.email}`),
    },
    {
      icon: "call-outline",
      label: t("auth.callUs"),
      value: SUPPORT.phone,
      onPress: () => Linking.openURL(`tel:${SUPPORT.whatsapp}`),
    },
    {
      icon: "logo-whatsapp",
      label: t("auth.whatsapp"),
      value: SUPPORT.phone,
      onPress: () => Linking.openURL(`https://wa.me/${SUPPORT.whatsapp}`),
      color: "#25D366",
      bg: "rgba(37,211,102,0.1)",
      border: "rgba(37,211,102,0.3)",
    },
    {
      icon: "globe-outline",
      label: t("auth.website"),
      value: SUPPORT.website,
      onPress: () => Linking.openURL(SUPPORT.website),
    },
  ];

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
              {t("auth.loginTitle")}
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
                placeholder={t("auth.usernamePlaceholder")}
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
                placeholder={t("auth.passwordPlaceholder")}
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
                  {t("auth.loginButton")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: "center", marginBottom: vh * 0.5 }} />

          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            style={{ marginTop: vh * 3, alignItems: "center" }}>
            <Text style={{ color: C.gold, fontSize: isTablet ? 14 : 13, fontWeight: "600" }}>
              {t("auth.createNewCompany")}
            </Text>
          </TouchableOpacity>

          {/* ✅ Support link — opens modal on press */}
          <TouchableOpacity
            onPress={() => setSupportVisible(true)}
            style={{ marginTop: vh * 1.5, alignItems: "center" }}
          >
            <Text style={{ color: C.muted, fontSize: isTablet ? 13 : 12 }}>
              {t("auth.needHelp")}
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
              {t("auth.poweredBy")}
            </Text>
            <View style={{ width: 16, height: 1, backgroundColor: "rgba(201,162,39,0.3)" }} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── CONTACT SUPPORT MODAL ── */}
      <Modal
        visible={supportVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.88)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}>
          <View style={{
            backgroundColor: C.card,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: C.borderDim,
            padding: 24,
            width: "100%",
            maxWidth: isTablet ? 420 : 360,
          }}>

            {/* Header */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{
                  width: isTablet ? 44 : 38,
                  height: isTablet ? 44 : 38,
                  borderRadius: isTablet ? 22 : 19,
                  backgroundColor: C.goldDim,
                  borderWidth: 1,
                  borderColor: C.borderDim,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name="headset-outline" size={isTablet ? 22 : 18} color={C.gold} />
                </View>
                <View>
                  <Text style={{
                    color: C.white,
                    fontWeight: "700",
                    fontSize: isTablet ? 17 : 15,
                  }}>
                    {t("auth.contactFeathrTech")}
                  </Text>
                  <Text style={{
                    color: C.muted,
                    fontSize: isTablet ? 12 : 11,
                    marginTop: 1,
                  }}>
                    {t("auth.hereToHelp")}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSupportVisible(false)}
                style={{
                  backgroundColor: C.faint,
                  borderRadius: 8,
                  padding: 7,
                }}
              >
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "rgba(201,162,39,0.15)", marginBottom: 20 }} />

            {/* Contact option rows */}
            {contactActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: action.bg ?? C.goldGlow,
                  borderWidth: 1,
                  borderColor: action.border ?? C.borderDim,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: isTablet ? 14 : 12,
                  marginBottom: 10,
                  gap: 14,
                }}
              >
                <View style={{
                  width: isTablet ? 38 : 34,
                  height: isTablet ? 38 : 34,
                  borderRadius: isTablet ? 19 : 17,
                  backgroundColor: action.bg ?? "rgba(201,162,39,0.12)",
                  borderWidth: 1,
                  borderColor: action.border ?? C.borderDim,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Ionicons
                    name={action.icon}
                    size={isTablet ? 18 : 16}
                    color={action.color ?? C.gold}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: C.white,
                    fontWeight: "600",
                    fontSize: isTablet ? 14 : 13,
                    marginBottom: 2,
                  }}>
                    {action.label}
                  </Text>
                  <Text style={{
                    color: C.muted,
                    fontSize: isTablet ? 12 : 11,
                  }}>
                    {action.value}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-outline"
                  size={isTablet ? 16 : 14}
                  color={action.color ?? C.gold}
                  style={{ opacity: 0.7 }}
                />
              </TouchableOpacity>
            ))}

            {/* Footer note */}
            <Text style={{
              color: C.muted,
              fontSize: isTablet ? 12 : 11,
              textAlign: "center",
              marginTop: 6,
              lineHeight: 16,
            }}>
              {t("auth.supportAvailable")}
            </Text>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}