import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { useSiteStore } from "../../store/siteStore";
import { createSite } from "../../api/siteApi";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  inputBg: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  red: "#E57373",
  orange: "#F97316",
};

// ─── Limits ───────────────────────────────────────────────────────────────────
const LIMITS = {
  name:        { min: 2, max: 100 },
  description: { max: 500 },
  latitude:    { max: 12 },   // e.g. -90.000000
  longitude:   { max: 13 },   // e.g. -180.000000
};

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.6 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint, cvw, isTablet }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 3.8} color={C.gold} />
      <View>
        <Text style={{
          color: C.white, fontWeight: "700",
          fontSize: isTablet ? cvw * 2.2 : cvw * 3.8, letterSpacing: 0.2,
        }}>
          {label}
        </Text>
        {hint && (
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, marginTop: 1 }}>
            {hint}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChangeText, placeholder, multiline, keyboardType,
  maxLength, showCount, cvw, isTablet,
}) {
  const [focused, setFocused] = useState(false);

  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength >= Math.floor(maxLength * 0.85);
  const isAtLimit = maxLength && currentLength >= maxLength;

  const handleChange = (text) => {
    if (maxLength && text.length > maxLength) return;
    onChangeText(text);
  };

  const counterColor = isAtLimit ? C.red : isNearLimit ? C.orange : C.muted;

  return (
    <View style={{ marginBottom: isTablet ? cvw * 2 : cvw * 4 }}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType || "default"}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: C.inputBg,
          borderWidth: 1,
          borderColor: focused
            ? isAtLimit ? C.red : C.gold
            : isAtLimit ? "rgba(229,115,115,0.5)" : C.border,
          borderRadius: 12,
          paddingHorizontal: isTablet ? cvw * 3 : cvw * 4,
          paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
          color: C.white,
          fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? (isTablet ? cvw * 10 : cvw * 25) : undefined,
        }}
      />
      {showCount && maxLength && (
        <Text style={{
          color: counterColor,
          fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
          textAlign: "right",
          marginTop: 4,
          marginRight: 2,
        }}>
          {currentLength}/{maxLength}
        </Text>
      )}
    </View>
  );
}

// ─── Screen header ────────────────────────────────────────────────────────────
function ScreenHeader({ onBack, cvw, isTablet }) {
  const { t } = useTranslation();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      marginBottom: isTablet ? cvw * 2 : cvw * 5,
      paddingBottom: isTablet ? cvw * 1.5 : cvw * 4,
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <TouchableOpacity
        onPress={onBack}
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
          <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>{t("settings.cancel", "Back")}</Text>
        )}
      </TouchableOpacity>
      <View>
        <Text style={{
          color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
          letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
        }}>
          {t("venue.venueManagement", "Venue Management")}
        </Text>
        <Text style={{
          color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
          fontWeight: "800", letterSpacing: -0.3,
        }}>
          {t("venue.createSite", "Create Site")}
        </Text>
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon, cvw, isTablet }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: isTablet ? cvw * 1.5 : cvw * 4,
      marginTop: isTablet ? cvw * 1 : cvw * 2,
    }}>
      <View style={{
        width: isTablet ? cvw * 4 : cvw * 7,
        height: isTablet ? cvw * 4 : cvw * 7,
        borderRadius: cvw * 4,
        backgroundColor: "rgba(201,162,39,0.12)",
        borderWidth: 1, borderColor: C.borderGold,
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 3.5} color={C.gold} />
      </View>
      <Text style={{
        color: C.gold, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
        fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
      }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}

// ─── Form content ─────────────────────────────────────────────────────────────
function FormContent({
  cvw, isTablet,
  name, setName,
  description, setDescription,
  latitude, setLatitude,
  longitude, setLongitude,
  hasLocation,
  loadingLocation, onFetchLocation,
  saving, onSave,
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── SITE INFO ── */}
      <SectionHeader title={t("venue.siteInformation", "Site Information")} icon="business-outline" cvw={cvw} isTablet={isTablet} />

      <FieldLabel
        icon="storefront-outline"
        label={t("venue.banquetName", "Banquet Name")}
        hint={t("venue.nameHint", "2–{{max}} characters", { max: LIMITS.name.max })}
        cvw={cvw} isTablet={isTablet}
      />
      <StyledInput
        value={name}
        onChangeText={setName}
        placeholder={t("venue.namePlaceholder", "e.g. The Grand Pavilion, Rose Banquet Hall")}
        maxLength={LIMITS.name.max}
        showCount
        cvw={cvw} isTablet={isTablet}
      />
      {/* Inline min-length hint while typing */}
      {name.length > 0 && name.trim().length < LIMITS.name.min && (
        <Text style={{
          color: C.red,
          fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
          marginTop: -(isTablet ? cvw * 1.5 : cvw * 3),
          marginBottom: isTablet ? cvw * 1 : cvw * 2,
          marginLeft: 2,
        }}>
          {t("venue.nameMin", "Name must be at least {{min}} characters", { min: LIMITS.name.min })}
        </Text>
      )}

      <FieldLabel
        icon="document-text-outline"
        label={t("staff.description", "Description")}
        hint={t("venue.descHint", "Address, facilities, or any notes about this site")}
        cvw={cvw} isTablet={isTablet}
      />
      <StyledInput
        value={description}
        onChangeText={setDescription}
        placeholder={t("venue.descPlaceholder", "e.g. Located on 5th Avenue, capacity 500, includes outdoor garden area...")}
        multiline
        maxLength={LIMITS.description.max}
        showCount
        cvw={cvw} isTablet={isTablet}
      />

      {/* ── GPS LOCATION ── */}
      <SectionHeader title={t("venue.gpsLocation", "GPS Location")} icon="location-outline" cvw={cvw} isTablet={isTablet} />

      <View style={{ flexDirection: "row", gap: cvw * 3 }}>
        <View style={{ flex: 1 }}>
          <FieldLabel
            icon="navigate-circle-outline"
            label={t("venue.latitude", "Latitude")}
            hint={t("venue.latHint", "e.g. 28.6139")}
            cvw={cvw} isTablet={isTablet}
          />
          <StyledInput
            value={latitude}
            onChangeText={setLatitude}
            placeholder="28.6139"
            keyboardType="decimal-pad"
            maxLength={LIMITS.latitude.max}
            cvw={cvw} isTablet={isTablet}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel
            icon="compass-outline"
            label={t("venue.longitude", "Longitude")}
            hint={t("venue.lngHint", "e.g. 77.2090")}
            cvw={cvw} isTablet={isTablet}
          />
          <StyledInput
            value={longitude}
            onChangeText={setLongitude}
            placeholder="77.2090"
            keyboardType="decimal-pad"
            maxLength={LIMITS.longitude.max}
            cvw={cvw} isTablet={isTablet}
          />
        </View>
      </View>

      {/* Location status card */}
      <View style={{
        backgroundColor: hasLocation ? "rgba(93,190,138,0.1)" : "rgba(201,162,39,0.08)",
        borderWidth: 1,
        borderColor: hasLocation ? "rgba(93,190,138,0.35)" : C.borderGold,
        borderRadius: 12,
        padding: isTablet ? cvw * 2 : cvw * 4,
        flexDirection: "row", alignItems: "center", gap: 10,
        marginBottom: isTablet ? cvw * 2 : cvw * 4,
      }}>
        <Ionicons
          name={hasLocation ? "checkmark-circle" : "information-circle-outline"}
          size={isTablet ? cvw * 2.5 : cvw * 5}
          color={hasLocation ? "#5DBE8A" : C.gold}
        />
        <Text style={{
          color: hasLocation ? "#5DBE8A" : C.gold,
          fontSize: isTablet ? cvw * 2 : cvw * 3.2,
          fontWeight: "600", flex: 1,
        }}>
          {hasLocation
            ? t("venue.locationSet", "Location set: {{lat}}, {{lng}}", { lat: parseFloat(latitude).toFixed(5), lng: parseFloat(longitude).toFixed(5) })
            : t("venue.noLocationSet", "No location set — fill in manually or use Auto Fetch below")}
        </Text>
      </View>

      {/* Auto Fetch button */}
      <TouchableOpacity
        onPress={onFetchLocation}
        disabled={loadingLocation}
        activeOpacity={0.8}
        style={{
          backgroundColor: loadingLocation ? C.faint : C.card,
          borderWidth: 1, borderColor: C.borderGold,
          borderRadius: 14,
          paddingVertical: isTablet ? cvw * 1.5 : cvw * 4,
          alignItems: "center", flexDirection: "row",
          justifyContent: "center", gap: 8,
          marginBottom: isTablet ? cvw * 3 : cvw * 6,
          opacity: loadingLocation ? 0.7 : 1,
        }}
      >
        {loadingLocation ? (
          <ActivityIndicator color={C.gold} size="small" />
        ) : (
          <Ionicons name="locate-outline" size={isTablet ? cvw * 2.4 : cvw * 5} color={C.gold} />
        )}
        <Text style={{
          color: loadingLocation ? C.muted : C.gold,
          fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : cvw * 3.8, letterSpacing: 0.3,
        }}>
          {loadingLocation ? t("venue.fetchingLocation", "Fetching Location…") : t("venue.autoFetchLocation", "Auto Fetch Live Location")}
        </Text>
      </TouchableOpacity>

      {/* ── HALLS ── */}
      <SectionHeader title={t("venue.halls", "Halls")} icon="grid-outline" cvw={cvw} isTablet={isTablet} />
      <View style={{
        backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
        borderRadius: 14,
        padding: isTablet ? cvw * 2.5 : cvw * 5,
        alignItems: "center", gap: 8,
        marginBottom: isTablet ? cvw * 3 : cvw * 6,
      }}>
        <View style={{
          width: isTablet ? cvw * 8 : cvw * 16,
          height: isTablet ? cvw * 8 : cvw * 16,
          borderRadius: cvw * 8,
          backgroundColor: C.faint, borderWidth: 1, borderColor: C.border,
          alignItems: "center", justifyContent: "center", marginBottom: 4,
        }}>
          <Ionicons name="grid-outline" size={isTablet ? cvw * 4 : cvw * 8} color={C.muted} />
        </View>
        <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : cvw * 4 }}>
          {t("venue.noHallsAdded", "No Halls Added Yet")}
        </Text>
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2, textAlign: "center" }}>
          {t("venue.saveSiteFirst", "Save this site first, then add individual halls from the venue detail screen.")}
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: C.border, marginBottom: isTablet ? cvw * 3 : cvw * 5 }} />

      {/* ── CREATE BUTTON ── */}
      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.8}
        style={{
          backgroundColor: saving ? C.faint : C.gold,
          borderRadius: 14,
          paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
          alignItems: "center", flexDirection: "row",
          justifyContent: "center", gap: 8,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? (
          <>
            <ActivityIndicator color="#000" size="small" />
            <Text style={{ color: C.muted, fontWeight: "700", fontSize: isTablet ? cvw * 2.6 : cvw * 4, letterSpacing: 0.3 }}>
              {t("venue.creatingSite", "Creating Site…")}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={isTablet ? cvw * 2.6 : cvw * 5} color="#000" />
            <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.6 : cvw * 4, letterSpacing: 0.3, textTransform: "uppercase" }}>
              {t("venue.createSiteButton", "Create Site")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SiteDetailsScreen({ navigation }) {
  const { t } = useTranslation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const permissions = useAuthStore((s) => s.permissions) || [];
  const addSite = useSiteStore((s) => s.addSite);
  const canCreate = permissions.includes("site.create");

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!canCreate) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="lock-closed-outline" size={48} color={C.faint} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>{t("roles.noPermission", "No Permission")}</Text>
      </SafeAreaView>
    );
  }

  const fetchLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("roles.error", "Error"), t("venue.locationDenied", "Location permission denied"));
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } catch {
      Alert.alert(t("roles.error", "Error"), t("venue.locationFailed", "Failed to fetch location"));
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) { Alert.alert(t("roles.validationError", "Validation Error"), t("venue.nameReq", "Banquet name is required")); return; }
    if (name.trim().length < LIMITS.name.min) {
      Alert.alert(t("roles.validationError", "Validation Error"), t("venue.nameMin", "Name must be at least {{min}} characters", { min: LIMITS.name.min }));
      return;
    }
    if (!latitude || !longitude) { Alert.alert(t("roles.validationError", "Validation Error"), t("venue.locationReq", "Location is required")); return; }
    // Basic coordinate range check
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert(t("roles.validationError", "Validation Error"), t("venue.latRange", "Latitude must be between -90 and 90"));
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert(t("roles.validationError", "Validation Error"), t("venue.lngRange", "Longitude must be between -180 and 180"));
      return;
    }
    try {
      setSaving(true);
      const savedSite = await createSite({ name: name.trim(), address: description, latitude, longitude });
      addSite(savedSite);
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("roles.error", "Error"), error?.response?.data?.message || t("venue.failedToCreate", "Failed to create site"));
    } finally {
      setSaving(false);
    }
  };

  const hasLocation = !!(latitude && longitude);

  const formProps = {
    cvw, isTablet,
    name, setName,
    description, setDescription,
    latitude, setLatitude,
    longitude, setLongitude,
    hasLocation,
    loadingLocation, onFetchLocation: fetchLocation,
    saving, onSave: handleSave,
  };

  // ─── PHONE layout ─────────────────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4, paddingBottom: vh * 4 }}>
            <View style={{
              backgroundColor: C.surface, borderRadius: 28,
              borderWidth: 1, borderColor: C.borderGold, flex: 1, padding: vw * 5,
            }}>
              <ScreenHeader onBack={() => navigation.goBack()} cvw={cvw} isTablet={isTablet} />
              <FormContent {...formProps} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, paddingHorizontal: vw * 10, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
          <View style={{
            backgroundColor: C.surface, borderRadius: 28,
            borderWidth: 1, borderColor: C.borderGold, flex: 1, padding: vw * 4,
          }}>
            <ScreenHeader onBack={() => navigation.goBack()} cvw={cvw} isTablet={isTablet} />
            <FormContent {...formProps} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}