import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { fetchRoles } from "../../api/roleApi";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldDim: "rgba(201,162,39,0.15)",
  goldDimMed: "rgba(201,162,39,0.08)",
  borderGold: "rgba(201,162,39,0.4)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#222",
  green: "#5DBE8A",
  greenDim: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#F87171",
  redDim: "rgba(248,113,113,0.12)",
  redBorder: "rgba(248,113,113,0.35)",
};

// ─── Limits ───────────────────────────────────────────────────────────────────
const LATE_THRESHOLD_MAX = 999;

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.6 : width;
  const cvw = colWidth / 100;
  return { vw, vh, cvw, isTablet };
}

// ─── Time Input ───────────────────────────────────────────────────────────────
function TimeInput({ value, onChange, placeholder, cvw, vh, isTablet }) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState(value ?? "");
  const [error, setError] = useState(false);

  // Keep local raw in sync when parent resets (e.g. loading a saved config)
  useEffect(() => {
    setRaw(value ?? "");
    setError(false);
  }, [value]);

  // Full validation — used on blur as a final check
  const validate = (text) => {
    if (!text) { setError(false); onChange(null); return; }
    const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (match) {
      setError(false);
      onChange(text);
    } else {
      setError(true);
      onChange(null);
    }
  };

  const handleChange = (text) => {
    let formatted = text.replace(/[^0-9:]/g, "");

    // Auto-insert colon after 2 digits when typing forward (not deleting)
    if (
      formatted.length === 2 &&
      !formatted.includes(":") &&
      text.length > raw.length
    ) {
      formatted = formatted + ":";
    }

    if (formatted.length > 5) return;
    setRaw(formatted);

    if (formatted.length === 0) {
      setError(false);
      onChange(null);
      return;
    }

    // Commit value immediately when complete and valid — don't wait for blur
    const match = formatted.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (match) {
      setError(false);
      onChange(formatted);
    } else if (formatted.length === 5) {
      // 5 chars typed but invalid format
      setError(true);
      onChange(null);
    }
    // While still typing (< 5 chars) — wait for more input, no error yet
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.faint,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? C.redBorder : raw ? C.borderGold : C.border,
          paddingHorizontal: isTablet ? cvw * 2 : cvw * 4,
          paddingVertical: isTablet ? vh * 0.8 : vh * 1,
          gap: 8,
        }}
      >
        <Ionicons
          name="time-outline"
          size={isTablet ? cvw * 2 : cvw * 4.5}
          color={error ? C.red : raw ? C.gold : C.muted}
        />
        <TextInput
          value={raw}
          onChangeText={handleChange}
          onBlur={() => validate(raw)}
          placeholder={placeholder ?? "HH:MM"}
          placeholderTextColor={C.muted}
          keyboardType="numeric"
          maxLength={5}
          style={{
            flex: 1,
            color: error ? C.red : C.white,
            fontSize: isTablet ? cvw * 1.8 : cvw * 3.8,
            fontWeight: "600",
            fontVariant: ["tabular-nums"],
            letterSpacing: 1,
          }}
        />
        {raw && !error && (
          <View
            style={{
              backgroundColor: C.greenDim,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: C.green, fontSize: isTablet ? cvw * 1.4 : cvw * 2.8, fontWeight: "700" }}>
              IST
            </Text>
          </View>
        )}
        {raw ? (
          <TouchableOpacity onPress={() => { setRaw(""); setError(false); onChange(null); }}>
            <Ionicons name="close-circle" size={isTablet ? cvw * 1.8 : cvw * 4} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && (
        <Text style={{ color: C.red, fontSize: isTablet ? cvw * 1.4 : cvw * 2.8, marginTop: 4, marginLeft: 4 }}>
          {t("settings.timeFormatError")}
        </Text>
      )}
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, cvw, vh, isTablet }) {
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        padding: isTablet ? cvw * 2.5 : cvw * 5,
        marginBottom: vh * 1.8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: vh * 1.5 }}>
        <View
          style={{
            width: isTablet ? cvw * 4 : cvw * 8,
            height: isTablet ? cvw * 4 : cvw * 8,
            borderRadius: cvw * 4,
            backgroundColor: C.goldDim,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={isTablet ? cvw * 1.8 : cvw * 3.8} color={C.gold} />
        </View>
        <Text
          style={{
            color: C.gold,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 1.8 : cvw * 3.5,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, sublabel, value, onChange, cvw, vh, isTablet }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: vh * 0.5,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: C.white, fontWeight: "600", fontSize: isTablet ? cvw * 1.8 : cvw * 3.5 }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.5 : cvw * 2.8, marginTop: 2 }}>
            {sublabel}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.gold }}
        thumbColor={value ? "#000" : C.muted}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AttendanceConfigScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const [allowOutsideRadius, setAllowOutsideRadius] = useState(false);
  const [allowLateCheckIn, setAllowLateCheckIn] = useState(true);
  const [lateThreshold, setLateThreshold] = useState("0");
  const [lateThresholdError, setLateThresholdError] = useState(false);
  const [checkoutReminder1, setCheckoutReminder1] = useState(null);
  const [checkoutReminder2, setCheckoutReminder2] = useState(null);

  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load roles ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
          const data = await fetchRoles();
          setRoles(data);
        } catch {
          Alert.alert(t("roles.error"), t("roles.failedToLoadRoles"));
        } finally {
          setLoading(false);
        }
    })();
  }, []);

  // ── Load config for selected role ───────────────────────────────────────────
  const loadRoleConfig = async (roleId) => {
    try {
      setConfigLoading(true);
      const res = await api.get(`/attendance/config/${roleId}`);
      const d = res.data;
      setAllowOutsideRadius(!!d.allowOutsideRadius);
      setAllowLateCheckIn(d.allowLateCheckIn !== false);
      setLateThreshold(String(d.lateThreshold ?? 0));
      setLateThresholdError(false);
      setCheckoutReminder1(d.checkoutReminder1 ?? null);
      setCheckoutReminder2(d.checkoutReminder2 ?? null);
    } catch {
      setAllowOutsideRadius(false);
      setAllowLateCheckIn(true);
      setLateThreshold("0");
      setLateThresholdError(false);
      setCheckoutReminder1(null);
      setCheckoutReminder2(null);
    } finally {
      setConfigLoading(false);
    }
  };

  // ── Late threshold change handler ───────────────────────────────────────────
  const handleLateThresholdChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      setLateThreshold("");
      setLateThresholdError(false);
      return;
    }
    const num = parseInt(cleaned, 10);
    if (num > LATE_THRESHOLD_MAX) {
      setLateThreshold(String(LATE_THRESHOLD_MAX));
      setLateThresholdError(false);
    } else {
      setLateThreshold(cleaned);
      setLateThresholdError(false);
    }
  };

  const handleLateThresholdBlur = () => {
    const num = parseInt(lateThreshold, 10);
    if (lateThreshold === "" || isNaN(num) || num < 0) {
      setLateThreshold("0");
      setLateThresholdError(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveConfig = async () => {
    if (!selectedRole) { Alert.alert(t("settings.selectRoleFirst")); return; }

    const threshold = Number(lateThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > LATE_THRESHOLD_MAX) {
      Alert.alert(t("roles.validation"), t("settings.lateThresholdValidation", { max: LATE_THRESHOLD_MAX }));
      return;
    }

    try {
      setSaving(true);
      await api.post("/attendance/config", {
        roleId: selectedRole,
        allowOutsideRadius,
        allowLateCheckIn,
        lateThreshold: threshold,
        checkoutReminder1: checkoutReminder1 || null,
        checkoutReminder2: checkoutReminder2 || null,
      });
      Alert.alert(t("settings.saved"), t("settings.configSavedSuccess"), [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert(t("roles.error"), t("settings.failedToSaveConfig"));
    } finally {
      setSaving(false);
    }
  };

  // ── Loading splash ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  const thresholdNum = parseInt(lateThreshold, 10);
  const thresholdNearMax = !isNaN(thresholdNum) && thresholdNum >= Math.floor(LATE_THRESHOLD_MAX * 0.9);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            margin: vw * 4,
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            overflow: "hidden",
          }}
        >
          {/* ── HEADER ── */}
          <View
            style={{
              paddingHorizontal: isTablet ? cvw * 3 : cvw * 6,
              paddingTop: vh * 2.5,
              paddingBottom: vh * 2,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text
              style={{
                color: C.gold,
                fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                letterSpacing: 3,
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {t("settings.settingsTitle")}
            </Text>
            <Text
              style={{
                color: C.white,
                fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
                fontWeight: "900",
                letterSpacing: -0.5,
              }}
            >
              {t("settings.attendanceConfigMenu")}
            </Text>
          </View>

          {/* ── SCROLL ── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: isTablet ? cvw * 3 : cvw * 6,
              paddingTop: vh * 2,
              paddingBottom: vh * 3,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── ROLE SELECTION ── */}
            <SectionCard title={t("settings.selectRole")} icon="people-outline" cvw={cvw} vh={vh} isTablet={isTablet}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => {
                    setSelectedRole(role.id);
                    loadRoleConfig(role.id);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: vh * 1,
                    paddingHorizontal: isTablet ? cvw * 2 : cvw * 4,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: selectedRole === role.id ? C.goldDim : C.faint,
                    borderWidth: 1,
                    borderColor: selectedRole === role.id ? C.borderGold : C.border,
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      color: selectedRole === role.id ? C.gold : C.white,
                      fontWeight: selectedRole === role.id ? "700" : "500",
                      fontSize: isTablet ? cvw * 1.8 : cvw * 3.5,
                    }}
                  >
                    {role.name}
                  </Text>
                  {selectedRole === role.id && (
                    <Ionicons name="checkmark-circle" size={isTablet ? cvw * 2 : cvw * 4.5} color={C.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </SectionCard>

            {/* ── CONFIG FIELDS — only show once a role is selected ── */}
            {selectedRole && (
              <>
                {configLoading ? (
                  <View style={{ alignItems: "center", paddingVertical: vh * 3 }}>
                    <ActivityIndicator color={C.gold} />
                    <Text style={{ color: C.muted, marginTop: 8, fontSize: cvw * 3 }}>
                      {t("settings.loadingConfig")}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* ── LOCATION RULES ── */}
                    <SectionCard title={t("settings.locationRules")} icon="location-outline" cvw={cvw} vh={vh} isTablet={isTablet}>
                      <ToggleRow
                        label={t("settings.allowOutsideRadius")}
                        sublabel={t("settings.allowOutsideRadiusHint")}
                        value={allowOutsideRadius}
                        onChange={setAllowOutsideRadius}
                        cvw={cvw} vh={vh} isTablet={isTablet}
                      />
                    </SectionCard>

                    {/* ── LATE POLICY ── */}
                    <SectionCard title={t("settings.latePolicy")} icon="alarm-outline" cvw={cvw} vh={vh} isTablet={isTablet}>
                      <ToggleRow
                        label={t("settings.allowLateCheckIn")}
                        sublabel={t("settings.allowLateCheckInHint")}
                        value={allowLateCheckIn}
                        onChange={setAllowLateCheckIn}
                        cvw={cvw} vh={vh} isTablet={isTablet}
                      />

                      <View style={{ height: 1, backgroundColor: C.border, marginVertical: vh * 1.2 }} />

                      <Text
                        style={{
                          color: C.muted,
                          fontSize: isTablet ? cvw * 1.5 : cvw * 3,
                          marginBottom: vh * 0.8,
                        }}
                      >
                        {t("settings.gracePeriodHint", { max: LATE_THRESHOLD_MAX })}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: C.faint,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: lateThresholdError
                            ? C.redBorder
                            : thresholdNearMax
                              ? "rgba(249,115,22,0.5)"
                              : C.border,
                          paddingHorizontal: isTablet ? cvw * 2 : cvw * 4,
                          paddingVertical: isTablet ? vh * 0.8 : vh * 1,
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name="hourglass-outline"
                          size={isTablet ? cvw * 2 : cvw * 4.5}
                          color={lateThresholdError ? C.red : C.muted}
                        />
                        <TextInput
                          value={lateThreshold}
                          onChangeText={handleLateThresholdChange}
                          onBlur={handleLateThresholdBlur}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={C.muted}
                          maxLength={3}
                          style={{
                            flex: 1,
                            color: lateThresholdError ? C.red : C.white,
                            fontSize: isTablet ? cvw * 1.8 : cvw * 3.8,
                            fontWeight: "600",
                          }}
                        />
                        <Text style={{
                          color: thresholdNearMax ? "#F97316" : C.muted,
                          fontSize: isTablet ? cvw * 1.6 : cvw * 3,
                        }}>
                          {t("settings.maxGracePeriod", { max: LATE_THRESHOLD_MAX })}
                        </Text>
                      </View>

                      {thresholdNearMax && !lateThresholdError && (
                        <Text style={{
                          color: "#F97316",
                          fontSize: isTablet ? cvw * 1.4 : cvw * 2.8,
                          marginTop: 4,
                          marginLeft: 2,
                        }}>
                          {t("settings.maxGracePeriodError", { max: LATE_THRESHOLD_MAX })}
                        </Text>
                      )}
                    </SectionCard>

                    {/* ── CHECKOUT REMINDERS ── */}
                    <SectionCard title={t("settings.checkoutReminders")} icon="notifications-outline" cvw={cvw} vh={vh} isTablet={isTablet}>
                      <Text
                        style={{
                          color: C.muted,
                          fontSize: isTablet ? cvw * 1.5 : cvw * 3,
                          marginBottom: vh * 1.5,
                          lineHeight: isTablet ? cvw * 2.2 : cvw * 4.5,
                        }}
                      >
                        {t("settings.checkoutRemindersHint")}
                      </Text>

                      <Text
                        style={{
                          color: C.white,
                          fontWeight: "600",
                          fontSize: isTablet ? cvw * 1.6 : cvw * 3.2,
                          marginBottom: vh * 0.6,
                        }}
                      >
                        {t("settings.firstReminder")}
                      </Text>
                      <TimeInput
                        value={checkoutReminder1}
                        onChange={setCheckoutReminder1}
                        placeholder="e.g. 17:00"
                        cvw={cvw} vh={vh} isTablet={isTablet}
                      />

                      <View style={{ height: 1, backgroundColor: C.border, marginVertical: vh * 1.5 }} />

                      <Text
                        style={{
                          color: C.white,
                          fontWeight: "600",
                          fontSize: isTablet ? cvw * 1.6 : cvw * 3.2,
                          marginBottom: vh * 0.6,
                        }}
                      >
                        {t("settings.secondReminder")}
                      </Text>
                      <TimeInput
                        value={checkoutReminder2}
                        onChange={setCheckoutReminder2}
                        placeholder="e.g. 18:30"
                        cvw={cvw} vh={vh} isTablet={isTablet}
                      />

                      {(checkoutReminder1 || checkoutReminder2) && (
                        <View
                          style={{
                            marginTop: vh * 1.5,
                            backgroundColor: C.goldDimMed,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: C.borderGold,
                            padding: isTablet ? cvw * 1.5 : cvw * 3,
                            gap: 6,
                          }}
                        >
                          <Text style={{ color: C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 1.5 : cvw * 2.8, letterSpacing: 1, textTransform: "uppercase" }}>
                            {t("settings.activeReminders")}
                          </Text>
                          {checkoutReminder1 && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Ionicons name="notifications" size={isTablet ? cvw * 1.6 : cvw * 3.5} color={C.gold} />
                              <Text style={{ color: C.white, fontSize: isTablet ? cvw * 1.6 : cvw * 3.2 }}>
                                {checkoutReminder1} IST
                              </Text>
                            </View>
                          )}
                          {checkoutReminder2 && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Ionicons name="notifications" size={isTablet ? cvw * 1.6 : cvw * 3.5} color={C.gold} />
                              <Text style={{ color: C.white, fontSize: isTablet ? cvw * 1.6 : cvw * 3.2 }}>
                                {checkoutReminder2} IST
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </SectionCard>
                  </>
                )}
              </>
            )}

            {/* ── SAVE BUTTON ── */}
            {selectedRole && !configLoading && (
              <TouchableOpacity
                onPress={saveConfig}
                disabled={saving}
                activeOpacity={0.85}
                style={{
                  backgroundColor: saving ? "rgba(201,162,39,0.4)" : C.gold,
                  borderRadius: 16,
                  paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: vh * 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={isTablet ? cvw * 2.4 : cvw * 5} color="#000" />
                    <Text
                      style={{
                        color: "#000",
                        fontWeight: "800",
                        fontSize: isTablet ? cvw * 2.2 : cvw * 4,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("settings.saveConfiguration")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}