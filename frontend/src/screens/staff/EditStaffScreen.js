import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";

import { fetchRoles } from "../../api/roleApi";
import { fetchSites } from "../../api/siteApi";
import { updateUser } from "../../api/userApi";

import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../config/permissionMap";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
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

const LIMITS = {
  name: { min: 2, max: 60 },
  email: { max: 254 },
  password: { min: 8, max: 128 },
  shift: { max: 5 },
};

function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.55 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint, optional, required, cvw, isTablet }) {
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 4} color={C.gold} />
        <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>{label}</Text>
        {required && <Text style={{ color: C.red, fontSize: isTablet ? cvw * 2 : cvw * 3.8, fontWeight: "800", marginLeft: -2 }}>*</Text>}
        {optional && <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>({t("settings.optional", "optional")})</Text>}
      </View>
      {hint && (
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.7 : cvw * 2.8, marginTop: 2, marginLeft: isTablet ? cvw * 2.5 : cvw * 5.5 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function StyledInput({
  value, onChangeText, placeholder, keyboardType, secureTextEntry,
  editable = true, isPhone, maxLength, showCount, cvw, isTablet,
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength >= Math.floor(maxLength * 0.85);
  const isAtLimit = maxLength && currentLength >= maxLength;

  const handleChange = (text) => {
    if (isPhone) {
      const digits = text.replace(/[^0-9]/g, "").slice(0, 10);
      onChangeText(digits);
    } else if (maxLength) {
      if (text.length <= maxLength) onChangeText(text);
    } else {
      onChangeText(text);
    }
  };

  const phoneCount = isPhone ? currentLength : 0;

  if (isPhone) {
    return (
      <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
        <View style={{
          backgroundColor: editable ? C.inputBg : C.faint,
          borderWidth: 1,
          borderColor: !editable ? C.border : focused ? C.gold : C.border,
          borderRadius: 12,
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
        }}>
          <TextInput
            value={value}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={C.muted}
            keyboardType="numeric"
            editable={editable}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={10}
            style={{
              flex: 1,
              color: editable ? C.white : C.muted,
              fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
              paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
            }}
          />
          <Text style={{ color: phoneCount === 10 ? C.gold : C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, fontWeight: "600", marginLeft: 6 }}>
            {phoneCount}/10
          </Text>
        </View>
        {phoneCount > 0 && phoneCount < 10 && (
          <Text style={{ color: C.red, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginTop: 4, marginLeft: 2 }}>
            {t("staff.validation.mobileLen", "Phone number must be 10 digits")}
          </Text>
        )}
      </View>
    );
  }

  const counterColor = isAtLimit ? C.red : isNearLimit ? C.orange : C.muted;

  return (
    <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType || "default"}
        secureTextEntry={secureTextEntry}
        editable={editable}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: editable ? C.inputBg : C.faint,
          borderWidth: 1,
          borderColor: !editable ? C.border : focused ? (isAtLimit ? C.red : C.gold) : (isAtLimit ? "rgba(229,115,115,0.5)" : C.border),
          borderRadius: 12,
          paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
          paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
          color: editable ? C.white : C.muted,
          fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
        }}
      />
      {showCount && maxLength && editable && (
        <Text style={{ color: counterColor, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, textAlign: "right", marginTop: 4, marginRight: 2 }}>
          {currentLength}/{maxLength}
        </Text>
      )}
    </View>
  );
}

// ─── Username row ─────────────────────────────────────────────────────────────
function UsernameRow({ username, cvw, isTablet }) {
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: isTablet ? cvw * 1.8 : cvw * 4 }}>
      <FieldLabel icon="at-outline" label={t("staff.username", "Username")} hint={t("staff.usernameHint", "Login ID — cannot be changed")} cvw={cvw} isTablet={isTablet} />
      <View style={{
        backgroundColor: C.faint, borderWidth: 1, borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
        paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
        flexDirection: "row", alignItems: "center", gap: 8,
      }}>
        <Ionicons name="lock-closed-outline" size={isTablet ? cvw * 2 : cvw * 3.5} color={C.muted} />
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>{username}</Text>
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
      <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}

// ─── Selector chip ────────────────────────────────────────────────────────────
function SelectorChip({ label, selected, onPress, cvw, isTablet }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: selected ? C.gold : C.inputBg,
        borderWidth: 1, borderColor: selected ? C.gold : C.border,
        borderRadius: 12,
        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
        paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
        marginBottom: isTablet ? cvw * 1 : cvw * 2.5,
      }}
    >
      {selected && <Ionicons name="checkmark-circle" size={isTablet ? cvw * 2 : cvw * 3.8} color="#000" />}
      <Text style={{ color: selected ? "#000" : C.muted, fontWeight: selected ? "700" : "400", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Upload button ────────────────────────────────────────────────────────────
function UploadButton({ icon, label, hint, selected, onPress, preview, cvw, isTablet }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: selected ? "rgba(201,162,39,0.08)" : C.inputBg,
        borderWidth: 1, borderColor: selected ? C.borderGold : C.border,
        borderRadius: 14,
        padding: isTablet ? cvw * 2 : cvw * 4,
        flexDirection: "row", alignItems: "center", gap: cvw * 3,
        marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
      }}
    >
      <View style={{
        width: isTablet ? cvw * 7 : cvw * 13,
        height: isTablet ? cvw * 7 : cvw * 13,
        borderRadius: 10,
        backgroundColor: selected ? "rgba(201,162,39,0.15)" : C.faint,
        borderWidth: 1, borderColor: selected ? C.borderGold : C.border,
        alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0,
      }}>
        {preview
          ? <Image source={{ uri: preview }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          : <Ionicons name={icon} size={isTablet ? cvw * 3 : cvw * 5.5} color={selected ? C.gold : C.muted} />
        }
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: selected ? C.white : C.muted, fontWeight: selected ? "700" : "400", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8, marginBottom: 3 }}>
          {label}
        </Text>
        <Text numberOfLines={1} style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>{hint}</Text>
      </View>
      <Ionicons name={selected ? "checkmark-circle" : "cloud-upload-outline"} size={isTablet ? cvw * 2.4 : cvw * 4.5} color={selected ? C.gold : C.muted} />
    </TouchableOpacity>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ icon, label, description, value, onToggle, cvw, isTablet }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: value ? "rgba(201,162,39,0.06)" : C.inputBg,
        borderWidth: 1,
        borderColor: value ? C.borderGold : C.border,
        borderRadius: 14,
        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
        paddingVertical: isTablet ? cvw * 1.4 : cvw * 3.2,
        marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
      }}
    >
      {/* Left: icon + text */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 12 }}>
        <View style={{
          width: isTablet ? cvw * 5 : cvw * 9,
          height: isTablet ? cvw * 5 : cvw * 9,
          borderRadius: cvw * 5,
          backgroundColor: value ? "rgba(201,162,39,0.12)" : C.faint,
          borderWidth: 1,
          borderColor: value ? C.borderGold : C.border,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Ionicons
            name={icon}
            size={isTablet ? cvw * 2.2 : cvw * 4.5}
            color={value ? C.gold : C.muted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: value ? C.white : C.muted,
            fontWeight: value ? "700" : "500",
            fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
            marginBottom: 2,
          }}>
            {label}
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: isTablet ? cvw * 1.7 : cvw * 2.8,
            lineHeight: isTablet ? cvw * 2.6 : cvw * 4.2,
          }}>
            {description}
          </Text>
        </View>
      </View>

      {/* Right: toggle pill */}
      <View style={{
        width: isTablet ? cvw * 8 : cvw * 14,
        height: isTablet ? cvw * 4 : cvw * 7.5,
        borderRadius: 100,
        backgroundColor: value ? C.gold : C.faint,
        justifyContent: "center",
        paddingHorizontal: isTablet ? cvw * 0.4 : cvw * 0.8,
        flexShrink: 0,
      }}>
        <View style={{
          width: isTablet ? cvw * 3 : cvw * 6,
          height: isTablet ? cvw * 3 : cvw * 6,
          borderRadius: 100,
          backgroundColor: C.white,
          alignSelf: value ? "flex-end" : "flex-start",
        }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen header ────────────────────────────────────────────────────────────
function ScreenHeader({ navigation, cvw, vw, vh, isTablet }) {
  const { t } = useTranslation();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: isTablet ? vw * 3 : vw * 5,
      paddingTop: vh * 2,
      paddingBottom: isTablet ? vh * 1.5 : vh * 1.8,
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          flexDirection: "row", alignItems: "center", gap: 4,
          backgroundColor: C.faint,
          paddingHorizontal: 12, paddingVertical: 7,
          borderRadius: 10, borderWidth: 1, borderColor: C.borderGold,
          marginRight: 14,
        }}
      >
        <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
        {isTablet && <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>{t("settings.cancel", "Back")}</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>
          {t("staff.staffManagement", "Staff Management")}
        </Text>
        <Text style={{ color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5, fontWeight: "800", letterSpacing: -0.3 }}>
          {t("staff.editStaff", "Edit Staff")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Text style={{ color: C.red, fontWeight: "800", fontSize: isTablet ? cvw * 2 : cvw * 3.5 }}>*</Text>
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>{t("roles.required", "Required")}</Text>
      </View>
    </View>
  );
}

const isValidTime = (t) => !t || /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const formatShiftTime = (text) => {
  const digits = text.replace(/[^0-9]/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ":" + digits.slice(2, 4);
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditStaffScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const userPermissions = useAuthStore((s) => s.permissions);
  const { vw, vh, cvw, isTablet } = useResponsive();

  const user = route.params?.user ?? null;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [existingProfileUrl, setExistingProfileUrl] = useState(null);
  const [existingIdProofUrl, setExistingIdProofUrl] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Self-upload toggles — pre-filled from user record ────────────────────
  const [allowSelfPhotoUpload, setAllowSelfPhotoUpload] = useState(false);
  const [allowSelfIdUpload, setAllowSelfIdUpload] = useState(false);

  useEffect(() => {
    if (!can(userPermissions, ACTION_PERMISSIONS.staff.edit)) navigation.goBack();
  }, [userPermissions]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setMobile(user.mobile || "");
      setEmail(user.email || "");
      setShiftStart(user.shiftStartTime || "");
      setShiftEnd(user.shiftEndTime || "");
      setExistingProfileUrl(user.profilePhotoUrl || null);
      setExistingIdProofUrl(user.idProofUrl || null);
      setSelectedRole(
        Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].id : null
      );
      setSelectedSites(
        Array.isArray(user.locations) ? user.locations.map((l) => l.id) : []
      );
      // ── Pre-fill toggles from user flags set during creation ──
      setAllowSelfPhotoUpload(!!user.allowSelfPhotoUpload);
      setAllowSelfIdUpload(!!user.allowSelfIdUpload);
    }
  }, [user]);

  const load = async () => {
    try {
      const roleData = await fetchRoles();
      const siteData = await fetchSites();
      setRoles(Array.isArray(roleData) ? roleData : []);
      setSites(Array.isArray(siteData) ? siteData : []);
    } catch {
      Alert.alert(t("roles.error", "Error"), t("staff.failedToLoadRolesSites", "Failed to load roles/locations"));
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleSite = (id) => {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const pickProfilePhoto = async () => {
    Alert.alert("Profile Photo", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
          if (!r.canceled) setProfilePhoto(r.assets[0]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
          if (!r.canceled) setProfilePhoto(r.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickIdProof = async () => {
    Alert.alert("ID Proof", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
          if (!r.canceled) setIdProof(r.assets[0]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
          if (!r.canceled) setIdProof(r.assets[0]);
        },
      },
      {
        text: "Document",
        onPress: async () => {
          const r = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
          if (!r.canceled) setIdProof(r.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validate = () => {
    if (!name.trim()) return t("staff.validation.nameReq", "Full name is required");
    if (name.trim().length < LIMITS.name.min) return t("staff.validation.nameMin", { min: LIMITS.name.min });
    if (mobile && mobile.length !== 10) return t("staff.validation.mobileLen", "Mobile number must be exactly 10 digits");
    if (email && !isValidEmail(email)) return t("staff.validation.email", "Enter a valid email address");
    if (password && password.length < LIMITS.password.min) return t("staff.validation.newPasswordMin", { min: LIMITS.password.min });
    if (shiftStart && !isValidTime(shiftStart)) return t("staff.validation.timeFormatStart", "Shift start must be in HH:MM format (e.g. 09:00)");
    if (shiftEnd && !isValidTime(shiftEnd)) return t("staff.validation.timeFormatEnd", "Shift end must be in HH:MM format (e.g. 18:00)");
    if (roles.length > 0 && !selectedRole) return t("staff.validation.selectRole", "Please select a role");
    return null;
  };

  const handleUpdate = async () => {
    const err = validate();
    if (err) { Alert.alert(t("roles.validationError", "Validation Error"), err); return; }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      if (mobile) formData.append("mobile", mobile);
      formData.append("email", email?.trim() ?? "");
      if (password) formData.append("password", password);
      if (shiftStart) formData.append("shiftStartTime", shiftStart);
      if (shiftEnd) formData.append("shiftEndTime", shiftEnd);
      if (selectedRole) formData.append("roleIds", JSON.stringify([selectedRole]));
      if (selectedSites.length > 0) formData.append("locationIds", JSON.stringify(selectedSites));

      // ── Self-upload flags ──────────────────────────────────────────────────
      formData.append("allowSelfPhotoUpload", String(allowSelfPhotoUpload));
      formData.append("allowSelfIdUpload", String(allowSelfIdUpload));

      if (profilePhoto) formData.append("profilePhoto", { uri: profilePhoto.uri, name: "profile.jpg", type: "image/jpeg" });
      if (idProof) formData.append("idProof", { uri: idProof.uri, name: idProof.name || "document.pdf", type: idProof.mimeType || "application/pdf" });

      const updatedUser = await updateUser(user.id, formData);

      Alert.alert(t("settings.success", "Success"), t("staff.staffUpdated", "Staff updated"), [
        {
          text: t("roles.ok", "OK"),
          onPress: () => {
            navigation.dispatch((state) => {
              const routes = state.routes.filter(r => r.name !== "EditStaff").map(r => {
                if (r.name === "StaffDetail") {
                  return {
                    ...r,
                    params: { ...r.params, user: updatedUser, _refresh: Date.now() },
                  };
                }
                return r;
              });
              return CommonActions.reset({ ...state, routes, index: routes.length - 1 });
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t("roles.error", "Error"), error.response?.data?.message || t("staff.failedToUpdate", "Failed to update staff"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="person-outline" size={48} color={C.muted} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>{t("staff.noUserFound", "No user found")}</Text>
      </SafeAreaView>
    );
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>{t("roles.loading", "LOADING")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingHorizontal: isTablet ? vw * 6 : vw * 5, paddingTop: vh * 3, paddingBottom: isTablet ? vh * 3 : vh * 4 }}>
        <View style={{ backgroundColor: C.surface, borderRadius: 28, borderWidth: 1, borderColor: C.borderGold, flex: 1, overflow: "hidden" }}>

          <ScreenHeader navigation={navigation} cvw={cvw} vw={vw} vh={vh} isTablet={isTablet} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: isTablet ? vw * 3 : vw * 5, paddingTop: vh * 2, paddingBottom: 80 }}
          >
            {/* ── PERSONAL INFO ── */}
            <SectionHeader title={t("staff.personalInfo", "Personal Info")} icon="person-outline" cvw={cvw} isTablet={isTablet} />

            <FieldLabel icon="text-outline" label={t("staff.fullName", "Full Name")} hint={t("staff.nameHint", "2–{{max}} characters", { max: LIMITS.name.max })} required cvw={cvw} isTablet={isTablet} />
            <StyledInput value={name} onChangeText={setName} placeholder={t("staff.namePlaceholder", "e.g. Rahul Sharma")} maxLength={LIMITS.name.max} showCount cvw={cvw} isTablet={isTablet} />

            {isTablet ? (
              <View style={{ flexDirection: "row", gap: cvw * 3 }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel icon="call-outline" label={t("staff.mobileNumber", "Mobile Number")} hint={t("staff.tenDigitNumber", "10-digit number")} optional cvw={cvw} isTablet={isTablet} />
                  <StyledInput value={mobile} onChangeText={setMobile} placeholder={t("staff.mobilePlaceholder", "e.g. 9876543210")} isPhone cvw={cvw} isTablet={isTablet} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel icon="mail-outline" label={t("staff.email", "Email")} hint={t("staff.emailHint", "Notifications and recovery")} optional cvw={cvw} isTablet={isTablet} />
                  <StyledInput value={email} onChangeText={setEmail} placeholder={t("staff.emailPlaceholder", "e.g. rahul@company.com")} keyboardType="email-address" maxLength={LIMITS.email.max} showCount cvw={cvw} isTablet={isTablet} />
                </View>
              </View>
            ) : (
              <>
                <FieldLabel icon="call-outline" label={t("staff.mobileNumber", "Mobile Number")} hint={t("staff.tenDigitNumber", "10-digit number")} optional cvw={cvw} isTablet={isTablet} />
                <StyledInput value={mobile} onChangeText={setMobile} placeholder={t("staff.mobilePlaceholder", "e.g. 9876543210")} isPhone cvw={cvw} isTablet={isTablet} />
                <FieldLabel icon="mail-outline" label={t("staff.email", "Email")} hint={t("staff.emailHint", "Notifications and recovery")} optional cvw={cvw} isTablet={isTablet} />
                <StyledInput value={email} onChangeText={setEmail} placeholder={t("staff.emailPlaceholder", "e.g. rahul@company.com")} keyboardType="email-address" maxLength={LIMITS.email.max} showCount cvw={cvw} isTablet={isTablet} />
              </>
            )}

            <UsernameRow username={user.username} cvw={cvw} isTablet={isTablet} />

            <FieldLabel
              icon="lock-closed-outline" label={t("staff.newPassword", "New Password")}
              hint={t("staff.newPasswordHint", "Leave blank to keep current") + (password ? " · " + t("staff.minPassword", { min: LIMITS.password.min }) : "")}
              optional cvw={cvw} isTablet={isTablet}
            />
            <StyledInput value={password} onChangeText={setPassword} placeholder={t("staff.enterNewPassword", "Enter new password to change")} secureTextEntry maxLength={LIMITS.password.max} showCount cvw={cvw} isTablet={isTablet} />
            {password.length > 0 && password.length < LIMITS.password.min && (
              <Text style={{ color: C.red, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginTop: -(isTablet ? cvw * 1.4 : cvw * 3), marginBottom: isTablet ? cvw * 1 : cvw * 2, marginLeft: 2 }}>
                {t("staff.validation.newPasswordMin", { min: LIMITS.password.min })}
              </Text>
            )}

            {/* ── SHIFT TIMINGS ── */}
            <SectionHeader title={t("staff.shiftTimings", "Shift Timings")} icon="time-outline" cvw={cvw} isTablet={isTablet} />
            <View style={{ flexDirection: "row", gap: cvw * 3 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel icon="sunny-outline" label={t("staff.startTime", "Start Time")} hint={t("staff.timeFormatHint", "24-hr format (HH:MM)")} optional cvw={cvw} isTablet={isTablet} />
                <StyledInput value={shiftStart} onChangeText={(tVal) => setShiftStart(formatShiftTime(tVal))} placeholder="09:00" keyboardType="numeric" maxLength={5} cvw={cvw} isTablet={isTablet} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel icon="moon-outline" label={t("staff.endTime", "End Time")} hint={t("staff.timeFormatHint", "24-hr format (HH:MM)")} optional cvw={cvw} isTablet={isTablet} />
                <StyledInput value={shiftEnd} onChangeText={(tVal) => setShiftEnd(formatShiftTime(tVal))} placeholder="18:00" keyboardType="numeric" maxLength={5} cvw={cvw} isTablet={isTablet} />
              </View>
            </View>

            {/* ── ROLE ── */}
            {/* ── ROLE ── */}
            {roles.length > 0 && (
              <>
                <SectionHeader title={t("staff.role", "Role")} icon="shield-outline" cvw={cvw} isTablet={isTablet} />
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, marginBottom: isTablet ? cvw * 1.5 : cvw * 3 }}>
                  {t("staff.roleHintEdit", "Controls what this staff member can access in the system")}
                </Text>
                {isTablet ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: cvw * 1.5, marginBottom: cvw * 2 }}>
                    {roles
                      .filter((role) => role.name?.toLowerCase() !== "owner")
                      .map((role) => (
                        <View key={role.id} style={{ minWidth: "30%" }}>
                          <SelectorChip label={role.name} selected={selectedRole === role.id} onPress={() => setSelectedRole(role.id)} cvw={cvw} isTablet={isTablet} />
                        </View>
                      ))}
                  </View>
                ) : (
                  roles
                    .filter((role) => role.name?.toLowerCase() !== "owner")
                    .map((role) => (
                      <SelectorChip key={role.id} label={role.name} selected={selectedRole === role.id} onPress={() => setSelectedRole(role.id)} cvw={cvw} isTablet={isTablet} />
                    ))
                )}
              </>
            )}

            {/* ── ASSIGN LOCATION ── */}
            {sites.length > 0 && (
              <>
                <SectionHeader title={t("staff.assignLocation", "Assign Location")} icon="location-outline" cvw={cvw} isTablet={isTablet} />
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, marginBottom: isTablet ? cvw * 1.5 : cvw * 3 }}>
                  {t("staff.assignLocationHint", "Select one or more sites for attendance tracking")}
                </Text>
                {isTablet ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: cvw * 1.5, marginBottom: cvw * 2 }}>
                    {sites.map((site) => (
                      <View key={site.id} style={{ minWidth: "30%" }}>
                        <SelectorChip label={site.name} selected={selectedSites.includes(site.id)} onPress={() => toggleSite(site.id)} cvw={cvw} isTablet={isTablet} />
                      </View>
                    ))}
                  </View>
                ) : (
                  sites.map((site) => (
                    <SelectorChip key={site.id} label={site.name} selected={selectedSites.includes(site.id)} onPress={() => toggleSite(site.id)} cvw={cvw} isTablet={isTablet} />
                  ))
                )}
              </>
            )}

            {/* ── DOCUMENTS ── */}
            <SectionHeader title={t("staff.documents", "Documents")} icon="document-outline" cvw={cvw} isTablet={isTablet} />
            <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, marginBottom: isTablet ? cvw * 1.5 : cvw * 3 }}>
              {t("staff.replaceFilesHint", "Replace existing files by uploading new ones — leave unchanged to keep current")}
            </Text>

            <UploadButton
              icon="camera-outline"
              label={profilePhoto ? t("staff.profilePhotoUpdated", "Profile Photo Updated") : t("staff.changeProfilePhoto", "Change Profile Photo")}
              hint={profilePhoto ? profilePhoto.uri?.split("/").pop() : existingProfileUrl ? t("staff.photoOnFile", "Photo on file — tap to replace") : t("staff.noPhotoYet", "No photo yet — tap to upload")}
              selected={!!profilePhoto || !!existingProfileUrl}
              onPress={pickProfilePhoto}
              preview={profilePhoto?.uri ?? existingProfileUrl ?? null}
              cvw={cvw} isTablet={isTablet}
            />
            <UploadButton
              icon="id-card-outline"
              label={idProof ? t("staff.idProofUpdated", "ID Proof Updated") : t("staff.changeIdProof", "Change ID Proof")}
              hint={idProof ? (idProof.name || idProof.uri?.split("/").pop()) : existingIdProofUrl ? t("staff.idProofOnFile", "ID proof on file — tap to replace") : t("staff.noIdProofYet", "No ID proof yet — tap to upload")}
              selected={!!idProof || !!existingIdProofUrl}
              onPress={pickIdProof}
              preview={
                idProof?.uri && !idProof.name?.endsWith(".pdf")
                  ? idProof.uri
                  : existingIdProofUrl && !existingIdProofUrl.endsWith(".pdf")
                    ? existingIdProofUrl
                    : null
              }
              cvw={cvw} isTablet={isTablet}
            />

            {/* ── SELF-UPLOAD PERMISSIONS ── */}
            <View style={{
              height: 1,
              backgroundColor: C.border,
              marginTop: isTablet ? cvw * 1 : cvw * 2,
              marginBottom: isTablet ? cvw * 2 : cvw * 4,
            }} />

            <SectionHeader title={t("staff.selfUpload", "Self Upload")} icon="cloud-upload-outline" cvw={cvw} isTablet={isTablet} />
            <Text style={{
              color: C.muted,
              fontSize: isTablet ? cvw * 1.8 : cvw * 3,
              marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
              lineHeight: isTablet ? cvw * 2.8 : cvw * 4.5,
            }}>
              {t("staff.selfUploadHint", "Allow this staff member to upload their own documents from the app")}
            </Text>

            {/* Tablet: side-by-side | Phone: stacked */}
            {isTablet ? (
              <View style={{ flexDirection: "row", gap: cvw * 2 }}>
                <View style={{ flex: 1 }}>
                  <ToggleRow
                    icon="camera-outline"
                    label={t("staff.profilePhotoUpload", "Profile Photo Upload")}
                    description={t("staff.profilePhotoUploadHint", "Staff can update their own profile photo")}
                    value={allowSelfPhotoUpload}
                    onToggle={() => setAllowSelfPhotoUpload((p) => !p)}
                    cvw={cvw} isTablet={isTablet}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ToggleRow
                    icon="id-card-outline"
                    label={t("staff.idProofUploadToggle", "ID Proof Upload")}
                    description={t("staff.idProofUploadHint", "Staff can upload their own ID proof document")}
                    value={allowSelfIdUpload}
                    onToggle={() => setAllowSelfIdUpload((p) => !p)}
                    cvw={cvw} isTablet={isTablet}
                  />
                </View>
              </View>
            ) : (
              <>
                <ToggleRow
                  icon="camera-outline"
                  label={t("staff.profilePhotoUpload", "Profile Photo Upload")}
                  description={t("staff.profilePhotoUploadHint", "Staff can update their own profile photo")}
                  value={allowSelfPhotoUpload}
                  onToggle={() => setAllowSelfPhotoUpload((p) => !p)}
                  cvw={cvw} isTablet={isTablet}
                />
                <ToggleRow
                  icon="id-card-outline"
                  label={t("staff.idProofUploadToggle", "ID Proof Upload")}
                  description={t("staff.idProofUploadHint", "Staff can upload their own ID proof document")}
                  value={allowSelfIdUpload}
                  onToggle={() => setAllowSelfIdUpload((p) => !p)}
                  cvw={cvw} isTablet={isTablet}
                />
              </>
            )}

            <View style={{ height: 1, backgroundColor: C.border, marginVertical: isTablet ? cvw * 2 : cvw * 5 }} />

            {/* ── SAVE BUTTON ── */}
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={saving}
              activeOpacity={0.8}
              style={{
                backgroundColor: saving ? C.faint : C.gold,
                borderRadius: 14,
                paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? <ActivityIndicator color="#000" size="small" />
                : <Ionicons name="save-outline" size={isTablet ? cvw * 2.6 : cvw * 5} color="#000" />
              }
              <Text style={{ color: saving ? C.muted : "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.6 : cvw * 4, letterSpacing: 0.3, textTransform: "uppercase" }}>
                {saving ? t("roles.saving", "Saving Changes…") : t("settings.saveChanges", "Save Changes")}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}