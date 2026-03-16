import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StatusBar,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Location from "expo-location";

import { useAuthStore } from "../../store/authStore";
import { fetchSiteById, updateSite } from "../../api/siteApi";
import { fetchHalls, createHall, updateHall, deleteHall } from "../../api/hallApi";

// ─── Palette ──────────────────────────────────────────────────────────────────
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
  latitude: { max: 12 },         // e.g. -90.000000
  longitude: { max: 13 },         // e.g. -180.000000
  radius: { max: 5, cap: 99999 }, // meters, 100km is extreme
  moreInfo: { max: 500 },
  hallName: { min: 2, max: 100 },
  hallDesc: { max: 300 },
  hallCapacity: { max: 6, cap: 999999 },
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
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 4} color={C.gold} />
        <Text style={{
          color: C.white, fontWeight: "700",
          fontSize: isTablet ? cvw * 2.2 : cvw * 3.8, letterSpacing: 0.2,
        }}>
          {label}
        </Text>
      </View>
      {hint && (
        <Text style={{
          color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3,
          marginTop: 2, marginLeft: isTablet ? cvw * 2.5 : cvw * 5,
        }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChangeText, placeholder, multiline, keyboardType,
  cvw, isTablet, editable = true,
  maxLength, showCount,
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
    <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType || "default"}
        editable={editable}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: editable ? C.inputBg : C.faint,
          borderWidth: 1,
          borderColor: !editable
            ? C.border
            : focused
              ? isAtLimit ? C.red : C.gold
              : isAtLimit ? "rgba(229,115,115,0.5)" : C.border,
          borderRadius: 12,
          paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
          paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
          color: editable ? C.white : C.muted,
          fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? (isTablet ? cvw * 10 : cvw * 25) : undefined,
        }}
      />
      {showCount && maxLength && editable && (
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

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon, cvw, isTablet }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: isTablet ? cvw * 1.5 : cvw * 4,
      marginTop: isTablet ? cvw * 1.5 : cvw * 3,
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

// ─── Hall card ────────────────────────────────────────────────────────────────
function HallCard({ hall, onEdit, onDelete, cvw, isTablet }) {
  return (
    <View style={{
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.borderGold,
      padding: isTablet ? cvw * 2.5 : cvw * 5,
      marginBottom: isTablet ? cvw * 2 : cvw * 4,
    }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: cvw * 2.5, flex: 1 }}>
          <View style={{
            width: isTablet ? cvw * 5 : cvw * 9,
            height: isTablet ? cvw * 5 : cvw * 9,
            borderRadius: cvw * 5,
            backgroundColor: "rgba(201,162,39,0.12)",
            borderWidth: 1, borderColor: C.borderGold,
            alignItems: "center", justifyContent: "center", marginTop: 2,
          }}>
            <Ionicons name="business-outline" size={isTablet ? cvw * 2.4 : cvw * 4.5} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.8 : cvw * 4.5, marginBottom: 3 }}>
              {hall.name}
            </Text>
            {hall.description ? (
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2, marginBottom: 4 }}>
                {hall.description}
              </Text>
            ) : null}
            {hall.capacity ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="people-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
                  Capacity: <Text style={{ color: C.goldLight, fontWeight: "600" }}>{hall.capacity}</Text>
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: cvw * 2, marginLeft: cvw * 2 }}>
          <TouchableOpacity
            onPress={() => onEdit(hall)}
            style={{
              backgroundColor: "rgba(201,162,39,0.12)",
              borderWidth: 1, borderColor: C.borderGold,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 1.8,
              borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4,
            }}
          >
            <Ionicons name="pencil-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.gold} />
            <Text style={{ color: C.gold, fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(hall.id)}
            style={{
              backgroundColor: "rgba(229,115,115,0.1)",
              borderWidth: 1, borderColor: "rgba(229,115,115,0.35)",
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? cvw * 0.8 : cvw * 1.8,
              borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4,
            }}
          >
            <Ionicons name="trash-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color="#E57373" />
            <Text style={{ color: "#E57373", fontWeight: "600", fontSize: isTablet ? cvw * 2 : cvw * 3 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Hall modal ───────────────────────────────────────────────────────────────
function HallModal({
  visible, onClose, onSave, editingHallId,
  hallName, setHallName,
  hallDesc, setHallDesc,
  hallCapacity, setHallCapacity,
  cvw, isTablet, vw,
}) {
  const hallNameLen = hallName ? hallName.length : 0;
  const hallDescLen = hallDesc ? hallDesc.length : 0;
  const hallNameNearLimit = hallNameLen >= Math.floor(LIMITS.hallName.max * 0.85);
  const hallNameAtLimit = hallNameLen >= LIMITS.hallName.max;
  const hallDescNearLimit = hallDescLen >= Math.floor(LIMITS.hallDesc.max * 0.85);
  const hallDescAtLimit = hallDescLen >= LIMITS.hallDesc.max;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{
          flex: 1, justifyContent: "center", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}>
          <View style={{
            backgroundColor: C.surface,
            width: isTablet ? "55%" : "92%",
            borderRadius: 24, borderWidth: 1, borderColor: C.borderGold,
            padding: isTablet ? cvw * 3 : vw * 6,
          }}>
            {/* Modal header */}
            <View style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              marginBottom: isTablet ? cvw * 2 : vw * 5,
              paddingBottom: isTablet ? cvw * 1.5 : vw * 4,
              borderBottomWidth: 1, borderBottomColor: C.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  width: isTablet ? cvw * 4.5 : vw * 9,
                  height: isTablet ? cvw * 4.5 : vw * 9,
                  borderRadius: vw * 5,
                  backgroundColor: "rgba(201,162,39,0.12)",
                  borderWidth: 1, borderColor: C.borderGold,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={editingHallId ? "pencil-outline" : "add-outline"} size={isTablet ? cvw * 2.4 : vw * 4.5} color={C.gold} />
                </View>
                <View>
                  <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 2 : vw * 2.8, letterSpacing: 2, fontWeight: "700", textTransform: "uppercase" }}>
                    Hall Management
                  </Text>
                  <Text style={{ color: C.white, fontSize: isTablet ? cvw * 3 : vw * 5, fontWeight: "800" }}>
                    {editingHallId ? "Edit Hall" : "Add Hall"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: isTablet ? cvw * 4 : vw * 8, height: isTablet ? cvw * 4 : vw * 8,
                  borderRadius: vw * 4, backgroundColor: C.faint,
                  borderWidth: 1, borderColor: C.border,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={isTablet ? cvw * 2 : vw * 4} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Hall Name */}
            <FieldLabel icon="storefront-outline" label="Hall Name" hint={`2–${LIMITS.hallName.max} characters`} cvw={cvw} isTablet={isTablet} />
            <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
              <TextInput
                value={hallName}
                onChangeText={(t) => { if (t.length <= LIMITS.hallName.max) setHallName(t); }}
                placeholder="e.g. Crystal Ballroom"
                placeholderTextColor={C.muted}
                maxLength={LIMITS.hallName.max}
                style={{
                  backgroundColor: C.inputBg, borderWidth: 1,
                  borderColor: hallNameAtLimit ? "rgba(229,115,115,0.5)" : C.border,
                  borderRadius: 12,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                  paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                  color: C.white, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                }}
              />
              <Text style={{
                color: hallNameAtLimit ? C.red : hallNameNearLimit ? C.orange : C.muted,
                fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                textAlign: "right", marginTop: 4, marginRight: 2,
              }}>
                {hallNameLen}/{LIMITS.hallName.max}
              </Text>
              {hallName.length > 0 && hallName.trim().length < LIMITS.hallName.min && (
                <Text style={{ color: C.red, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginTop: 2, marginLeft: 2 }}>
                  Hall name must be at least {LIMITS.hallName.min} characters
                </Text>
              )}
            </View>

            {/* Hall Description */}
            <FieldLabel icon="document-text-outline" label="Description" hint="Features, amenities, or access notes" cvw={cvw} isTablet={isTablet} />
            <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
              <TextInput
                value={hallDesc}
                onChangeText={(t) => { if (t.length <= LIMITS.hallDesc.max) setHallDesc(t); }}
                placeholder="e.g. Air-conditioned, stage included, ground floor access"
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={4}
                maxLength={LIMITS.hallDesc.max}
                style={{
                  backgroundColor: C.inputBg, borderWidth: 1,
                  borderColor: hallDescAtLimit ? "rgba(229,115,115,0.5)" : C.border,
                  borderRadius: 12,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                  paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                  color: C.white, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                  textAlignVertical: "top",
                  minHeight: isTablet ? cvw * 10 : cvw * 25,
                }}
              />
              <Text style={{
                color: hallDescAtLimit ? C.red : hallDescNearLimit ? C.orange : C.muted,
                fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                textAlign: "right", marginTop: 4, marginRight: 2,
              }}>
                {hallDescLen}/{LIMITS.hallDesc.max}
              </Text>
            </View>

            {/* Hall Capacity */}
            <FieldLabel icon="people-outline" label="Capacity" hint={`Max guests (up to ${LIMITS.hallCapacity.cap.toLocaleString()})`} cvw={cvw} isTablet={isTablet} />
            <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
              <TextInput
                value={hallCapacity}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9]/g, "");
                  if (cleaned === "") { setHallCapacity(""); return; }
                  const num = parseInt(cleaned, 10);
                  if (num > LIMITS.hallCapacity.cap) {
                    setHallCapacity(String(LIMITS.hallCapacity.cap));
                  } else {
                    setHallCapacity(cleaned);
                  }
                }}
                placeholder="e.g. 250"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                maxLength={LIMITS.hallCapacity.max}
                style={{
                  backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
                  borderRadius: 12,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                  paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                  color: C.white, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                }}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.8}
              style={{
                backgroundColor: C.gold, borderRadius: 14, marginTop: 4,
                paddingVertical: isTablet ? cvw * 1.5 : vw * 4,
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
              }}
            >
              <Ionicons name={editingHallId ? "cloud-upload-outline" : "checkmark-circle-outline"} size={isTablet ? cvw * 2.6 : vw * 5} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.6 : vw * 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                {editingHallId ? "Update Hall" : "Create Hall"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen header ────────────────────────────────────────────────────────────
function ScreenHeader({ siteName, onBack, onAddHall, cvw, isTablet }) {
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
          backgroundColor: C.faint, paddingHorizontal: 12, paddingVertical: 7,
          borderRadius: 10, borderWidth: 1, borderColor: C.borderGold, marginRight: 14,
        }}
      >
        <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
        {isTablet && <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>
          Venue Management
        </Text>
        <Text style={{ color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5, fontWeight: "800", letterSpacing: -0.3 }} numberOfLines={1}>
          {siteName}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onAddHall}
        style={{
          backgroundColor: C.gold,
          paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
          paddingVertical: isTablet ? cvw * 0.9 : cvw * 2,
          borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5,
        }}
      >
        <Ionicons name="add" size={isTablet ? cvw * 2.2 : cvw * 4.5} color="#000" />
        <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.2 : cvw * 3.5 }}>Add Hall</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main scrollable content ──────────────────────────────────────────────────
function MainContent({
  cvw, isTablet,
  latitude, setLatitude,
  longitude, setLongitude,
  allowedRadius, setAllowedRadius,
  moreInfo, setMoreInfo,
  hasLocation,
  loadingLocation, onFetchLocation,
  saving, onSave,
  halls, onAddHall, onEditHall, onDeleteHall,
}) {
  const moreInfoLen = moreInfo ? moreInfo.length : 0;
  const moreInfoNearLimit = moreInfoLen >= Math.floor(LIMITS.moreInfo.max * 0.85);
  const moreInfoAtLimit = moreInfoLen >= LIMITS.moreInfo.max;

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── LOCATION ── */}
      <SectionHeader title="GPS Location" icon="location-outline" cvw={cvw} isTablet={isTablet} />

      <View style={{ flexDirection: "row", gap: cvw * 3 }}>
        <View style={{ flex: 1 }}>
          <FieldLabel icon="navigate-circle-outline" label="Latitude" hint="e.g. 28.6139" cvw={cvw} isTablet={isTablet} />
          <StyledInput
            value={latitude} onChangeText={setLatitude}
            placeholder="28.6139" keyboardType="decimal-pad"
            maxLength={LIMITS.latitude.max}
            cvw={cvw} isTablet={isTablet}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel icon="compass-outline" label="Longitude" hint="e.g. 77.2090" cvw={cvw} isTablet={isTablet} />
          <StyledInput
            value={longitude} onChangeText={setLongitude}
            placeholder="77.2090" keyboardType="decimal-pad"
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
        padding: isTablet ? cvw * 1.8 : cvw * 4,
        flexDirection: "row", alignItems: "center", gap: 10,
        marginBottom: isTablet ? cvw * 1.8 : cvw * 4,
      }}>
        <Ionicons
          name={hasLocation ? "checkmark-circle" : "information-circle-outline"}
          size={isTablet ? cvw * 2.5 : cvw * 5}
          color={hasLocation ? "#5DBE8A" : C.gold}
        />
        <Text style={{ color: hasLocation ? "#5DBE8A" : C.gold, fontSize: isTablet ? cvw * 2 : cvw * 3.2, fontWeight: "600", flex: 1 }}>
          {hasLocation
            ? `Location: ${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
            : "No location set — fill in manually or auto fetch below"}
        </Text>
      </View>

      {/* Auto Fetch */}
      <TouchableOpacity
        onPress={onFetchLocation}
        disabled={loadingLocation}
        activeOpacity={0.8}
        style={{
          backgroundColor: C.card, borderWidth: 1, borderColor: C.borderGold,
          borderRadius: 14,
          paddingVertical: isTablet ? cvw * 1.4 : cvw * 4,
          alignItems: "center", flexDirection: "row", justifyContent: "center",
          gap: 8, marginBottom: isTablet ? cvw * 2 : cvw * 5,
          opacity: loadingLocation ? 0.7 : 1,
        }}
      >
        {loadingLocation
          ? <ActivityIndicator color={C.gold} size="small" />
          : <Ionicons name="locate-outline" size={isTablet ? cvw * 2.4 : cvw * 5} color={C.gold} />
        }
        <Text style={{ color: loadingLocation ? C.muted : C.gold, fontWeight: "700", fontSize: isTablet ? cvw * 2.4 : cvw * 3.8, letterSpacing: 0.3 }}>
          {loadingLocation ? "Fetching…" : "Auto Fetch Live Location"}
        </Text>
      </TouchableOpacity>

      {/* ── CONFIGURATION ── */}
      <SectionHeader title="Configuration" icon="settings-outline" cvw={cvw} isTablet={isTablet} />

      <FieldLabel
        icon="radio-button-on-outline"
        label="Attendance Radius"
        hint={`Meters staff can check in from (max ${LIMITS.radius.cap.toLocaleString()}m)`}
        cvw={cvw} isTablet={isTablet}
      />
      <StyledInput
        value={allowedRadius}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9]/g, "");
          if (cleaned === "") { setAllowedRadius(""); return; }
          const num = parseInt(cleaned, 10);
          setAllowedRadius(num > LIMITS.radius.cap ? String(LIMITS.radius.cap) : cleaned);
        }}
        placeholder="100"
        keyboardType="numeric"
        maxLength={LIMITS.radius.max}
        cvw={cvw} isTablet={isTablet}
      />

      <FieldLabel
        icon="document-text-outline"
        label="Additional Information"
        hint="Address, access notes, parking, or any relevant site details"
        cvw={cvw} isTablet={isTablet}
      />
      {/* Multiline with counter — inline since StyledInput doesn't pass showCount through MainContent props */}
      <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
        <TextInput
          value={moreInfo}
          onChangeText={(t) => { if (t.length <= LIMITS.moreInfo.max) setMoreInfo(t); }}
          placeholder="e.g. Main entrance on North side, parking available on Level B2..."
          placeholderTextColor={C.muted}
          multiline
          numberOfLines={4}
          maxLength={LIMITS.moreInfo.max}
          style={{
            backgroundColor: C.inputBg, borderWidth: 1,
            borderColor: moreInfoAtLimit ? "rgba(229,115,115,0.5)" : C.border,
            borderRadius: 12,
            paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
            paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
            color: C.white, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
            textAlignVertical: "top",
            minHeight: isTablet ? cvw * 10 : cvw * 25,
          }}
        />
        <Text style={{
          color: moreInfoAtLimit ? C.red : moreInfoNearLimit ? C.orange : C.muted,
          fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
          textAlign: "right", marginTop: 4, marginRight: 2,
        }}>
          {moreInfoLen}/{LIMITS.moreInfo.max}
        </Text>
      </View>

      {/* Save config button */}
      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.8}
        style={{
          backgroundColor: saving ? C.faint : C.gold,
          borderRadius: 14,
          paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
          alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
          marginBottom: isTablet ? cvw * 3 : cvw * 6,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving
          ? <><ActivityIndicator color="#000" size="small" /><Text style={{ color: C.muted, fontWeight: "700", fontSize: isTablet ? cvw * 2.6 : cvw * 4 }}>Saving…</Text></>
          : <><Ionicons name="cloud-upload-outline" size={isTablet ? cvw * 2.6 : cvw * 5} color="#000" />
            <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.6 : cvw * 4, letterSpacing: 0.3, textTransform: "uppercase" }}>
              Save Configuration
            </Text></>
        }
      </TouchableOpacity>

      {/* ── HALLS ── */}
      <SectionHeader title="Halls" icon="grid-outline" cvw={cvw} isTablet={isTablet} />

      {halls.length === 0 ? (
        <View style={{
          backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
          borderRadius: 16, padding: isTablet ? cvw * 3 : cvw * 6,
          alignItems: "center", gap: 8, marginBottom: isTablet ? cvw * 2 : cvw * 4,
        }}>
          <View style={{
            width: isTablet ? cvw * 10 : cvw * 18,
            height: isTablet ? cvw * 10 : cvw * 18,
            borderRadius: cvw * 9,
            backgroundColor: C.faint, borderWidth: 1, borderColor: C.border,
            alignItems: "center", justifyContent: "center", marginBottom: 6,
          }}>
            <Ionicons name="grid-outline" size={isTablet ? cvw * 5 : cvw * 9} color={C.muted} />
          </View>
          <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.6 : cvw * 4.5 }}>No Halls Added</Text>
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2, textAlign: "center" }}>
            Add halls to this venue so events can be assigned to a specific space
          </Text>
          <TouchableOpacity
            onPress={onAddHall}
            activeOpacity={0.8}
            style={{
              marginTop: 8, backgroundColor: C.gold,
              paddingHorizontal: isTablet ? cvw * 4 : cvw * 7,
              paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
              borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6,
            }}
          >
            <Ionicons name="add-circle-outline" size={isTablet ? cvw * 2.4 : cvw * 4.5} color="#000" />
            <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.4 : cvw * 3.8 }}>Add First Hall</Text>
          </TouchableOpacity>
        </View>
      ) : (
        isTablet ? (
          <View>
            {(() => {
              const rows = [];
              for (let i = 0; i < halls.length; i += 2) rows.push(halls.slice(i, i + 2));
              return rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: cvw * 2 }}>
                  {row.map(hall => (
                    <View key={hall.id} style={{ flex: 1 }}>
                      <HallCard hall={hall} onEdit={onEditHall} onDelete={onDeleteHall} cvw={cvw} isTablet={isTablet} />
                    </View>
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ));
            })()}
          </View>
        ) : (
          halls.map(hall => (
            <HallCard key={hall.id} hall={hall} onEdit={onEditHall} onDelete={onDeleteHall} cvw={cvw} isTablet={isTablet} />
          ))
        )
      )}
    </KeyboardAwareScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditVenueScreen({ navigation, route }) {
  const { siteId } = route.params;
  const { vw, vh, cvw, isTablet } = useResponsive();

  const permissions = useAuthStore((s) => s.permissions) || [];
  const canEdit = permissions.includes("site.edit");

  const [site, setSite] = useState(null);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [allowedRadius, setAllowedRadius] = useState("100");
  const [moreInfo, setMoreInfo] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [hallName, setHallName] = useState("");
  const [hallDesc, setHallDesc] = useState("");
  const [hallCapacity, setHallCapacity] = useState("");
  const [editingHallId, setEditingHallId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const venue = await fetchSiteById(siteId);
        const hallData = await fetchHalls(siteId);
        setSite(venue);
        setHalls(hallData);
        setLatitude(venue.latitude?.toString() || "");
        setLongitude(venue.longitude?.toString() || "");
        setAllowedRadius(venue.allowedRadius?.toString() || "100");
        setMoreInfo(venue.address || "");
      } catch {
        Alert.alert("Error", "Failed to load venue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!canEdit) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="lock-closed-outline" size={48} color={C.faint} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>No Permission</Text>
      </SafeAreaView>
    );
  }

  if (loading || !site) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>LOADING VENUE</Text>
      </SafeAreaView>
    );
  }

  const fetchLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Location permission denied"); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      Alert.alert("Location updated");
    } catch {
      Alert.alert("Failed to fetch location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    // Coordinate range validation
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      Alert.alert("Validation", "Latitude must be between -90 and 90");
      return;
    }
    if (longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      Alert.alert("Validation", "Longitude must be between -180 and 180");
      return;
    }
    const radius = Number(allowedRadius);
    if (allowedRadius && (isNaN(radius) || radius < 0 || radius > LIMITS.radius.cap)) {
      Alert.alert("Validation", `Radius must be between 0 and ${LIMITS.radius.cap.toLocaleString()} meters`);
      return;
    }
    try {
      setSaving(true);
      const updated = await updateSite(siteId, {
        latitude, longitude,
        allowedRadius: radius || 100,
        address: moreInfo,
      });
      setSite(updated);
      Alert.alert("Success", "Venue updated successfully");
    } catch {
      Alert.alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHall = async () => {
    if (!hallName.trim()) { Alert.alert("Hall name required"); return; }
    if (hallName.trim().length < LIMITS.hallName.min) {
      Alert.alert("Validation", `Hall name must be at least ${LIMITS.hallName.min} characters`);
      return;
    }
    try {
      if (editingHallId) {
        const updated = await updateHall(siteId, editingHallId, {
          name: hallName.trim(), description: hallDesc, capacity: Number(hallCapacity),
        });
        setHalls(halls.map(h => h.id === editingHallId ? updated : h));
        Alert.alert("Hall updated");
      } else {
        const newHall = await createHall(siteId, {
          name: hallName.trim(), description: hallDesc, capacity: Number(hallCapacity),
        });
        setHalls([...halls, newHall]);
        Alert.alert("Hall created");
      }
      setModalVisible(false);
      setEditingHallId(null);
      setHallName(""); setHallDesc(""); setHallCapacity("");
    } catch {
      Alert.alert("Operation failed");
    }
  };

  const handleDeleteHall = async (id) => {
    Alert.alert("Delete Hall", "Are you sure you want to delete this hall?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteHall(siteId, id);
            setHalls(halls.filter(h => h.id !== id));
          } catch { Alert.alert("Delete failed"); }
        },
      },
    ]);
  };

  const openEditHall = (hall) => {
    setEditingHallId(hall.id);
    setHallName(hall.name);
    setHallDesc(hall.description || "");
    setHallCapacity(hall.capacity?.toString() || "");
    setModalVisible(true);
  };

  const openAddHall = () => {
    setEditingHallId(null);
    setHallName(""); setHallDesc(""); setHallCapacity("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingHallId(null);
    setHallName(""); setHallDesc(""); setHallCapacity("");
  };

  const hasLocation = !!(latitude && longitude);

  const sharedModalProps = {
    visible: modalVisible, onClose: closeModal, onSave: handleSaveHall, editingHallId,
    hallName, setHallName, hallDesc, setHallDesc, hallCapacity, setHallCapacity,
    cvw, isTablet, vw,
  };

  const sharedContentProps = {
    cvw, isTablet,
    latitude, setLatitude, longitude, setLongitude,
    allowedRadius, setAllowedRadius, moreInfo, setMoreInfo,
    hasLocation, loadingLocation, onFetchLocation: fetchLocation,
    saving, onSave: handleSave,
    halls, onAddHall: openAddHall, onEditHall: openEditHall, onDeleteHall: handleDeleteHall,
  };

  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4, paddingBottom: vh * 4 }}>
          <View style={{ backgroundColor: C.surface, borderRadius: 28, borderWidth: 1, borderColor: C.borderGold, flex: 1, padding: vw * 5 }}>
            <ScreenHeader siteName={site.name} onBack={() => navigation.goBack()} onAddHall={openAddHall} cvw={cvw} isTablet={isTablet} />
            <MainContent {...sharedContentProps} />
          </View>
        </View>
        <HallModal {...sharedModalProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
        <View style={{ backgroundColor: C.surface, borderRadius: 28, borderWidth: 1, borderColor: C.borderGold, flex: 1, padding: vw * 3 }}>
          <ScreenHeader siteName={site.name} onBack={() => navigation.goBack()} onAddHall={openAddHall} cvw={cvw} isTablet={isTablet} />
          <MainContent {...sharedContentProps} />
        </View>
      </View>
      <HallModal {...sharedModalProps} />
    </SafeAreaView>
  );
}