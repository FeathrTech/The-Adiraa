import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/axios";
import {
  uploadOwnProfilePhoto,
  uploadOwnIdProof,
} from "../../api/userApi";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "#7A5E10",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#666",
  faint: "#333",
};

// ─── Responsive hook ─────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser); // ← to refresh user after upload
  const permissions = useAuthStore((s) => s.permissions) || [];
  const logout = useAuthStore((s) => s.logout);

  const canCheckIn = can(permissions, "attendance.checkin");
  const canCheckOut = can(permissions, "attendance.checkout");
  const canViewOwn = can(permissions, "attendance.view.own");

  // ── Self-upload flags — read directly from user object ───────────────────
  const canUploadOwnPhoto = !!user?.allowSelfPhotoUpload;
  const canUploadOwnIdProof = !!user?.allowSelfIdUpload;
  const canSelfUpload = canUploadOwnPhoto || canUploadOwnIdProof;

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false); // ← upload loading state

  const loadAttendance = async () => {
    if (!user) return;
    if (!canViewOwn && !canCheckIn && !canCheckOut) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await api.get("/attendance/today");
      setAttendance(res.data);
      if (res.data?.workingMinutes) setWorkingSeconds(res.data.workingMinutes * 60);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => { if (user) loadAttendance(); }, [user])
  );

  useEffect(() => {
    let interval;
    if (attendance?.checkedIn && !attendance?.checkedOut) {
      interval = setInterval(() => setWorkingSeconds((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [attendance]);

  // ── Upload handlers ───────────────────────────────────────────────────────

  const doUploadPhoto = async (asset) => {
    try {
      setUploading(true);
      const updatedUser = await uploadOwnProfilePhoto(asset);
      if (updatedUser) setUser(updatedUser);
      Alert.alert("Success", "Profile photo updated");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const doUploadIdProof = async (asset) => {
    try {
      setUploading(true);
      const updatedUser = await uploadOwnIdProof(asset);
      if (updatedUser) setUser(updatedUser);
      Alert.alert("Success", "ID proof uploaded");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadPhoto = () => {
    Alert.alert("Profile Photo", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
          });
          if (!r.canceled) await doUploadPhoto(r.assets[0]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
          });
          if (!r.canceled) await doUploadPhoto(r.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickAndUploadIdProof = () => {
    Alert.alert("Upload ID Proof", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!r.canceled) await doUploadIdProof(r.assets[0]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!r.canceled) await doUploadIdProof(r.assets[0]);
        },
      },
      {
        text: "Document",
        onPress: async () => {
          const r = await DocumentPicker.getDocumentAsync({
            type: ["image/*", "application/pdf"],
          });
          if (!r.canceled) await doUploadIdProof(r.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Misc helpers ──────────────────────────────────────────────────────────

  const formatTime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sc = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sc}`;
  };

  const getGreeting = () => {
    const hour = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    });
    const h = parseInt(hour);
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatus = () => {
    if (!canViewOwn) return "--";
    if (!attendance?.checkedIn) return "Not Checked In";
    if (attendance?.checkedOut) return "Completed";
    if (attendance?.isLate) return "Late";
    return "Present";
  };

  const statusColor = () => {
    const s = getStatus();
    if (s === "Present") return C.goldLight;
    if (s === "Late") return "#E8734A";
    if (s === "Completed") return "#5DBE8A";
    return C.muted;
  };

  const handleCheckIn = () => navigation.navigate("Attendance", { screen: "CheckIn" });
  const handleCheckOut = () => navigation.navigate("Attendance", { screen: "CheckOut" });
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => await logout() },
    ]);
  };

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: cvw * 3.5, letterSpacing: 1.5 }}>
          LOADING
        </Text>
      </SafeAreaView>
    );
  }

  const isActive = attendance?.checkedIn && !attendance?.checkedOut;

  // ─── Shared blocks ────────────────────────────────────────────────────────

  const Header = () => (
    <View style={{ marginBottom: isTablet ? vh * 4 : vh * 3.5 }}>
      <Text style={{
        color: C.gold, fontSize: cvw * 2.4, letterSpacing: 3,
        fontWeight: "700", marginBottom: vh * 0.6, marginTop: vh * 1.5,
        textTransform: "uppercase",
      }}>
        Staff Portal
      </Text>
      <Text style={{
        color: C.white,
        fontSize: isTablet ? cvw * 5 : cvw * 6.5,
        fontWeight: "800", letterSpacing: -0.5,
      }}>
        {getGreeting()},
      </Text>
      <Text style={{
        color: C.gold,
        fontSize: isTablet ? cvw * 5 : cvw * 6.5,
        fontWeight: "800", letterSpacing: -0.5,
      }}>
        {user?.name} ✦
      </Text>
    </View>
  );

  const ShiftCard = () => (
    <View style={{
      backgroundColor: C.card, borderRadius: 18,
      padding: isTablet ? vh * 2.5 : vh * 2,
      borderWidth: 1, borderColor: C.borderGold,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    }}>
      <View>
        <Text style={{
          color: C.muted, fontSize: cvw * 2.2,
          letterSpacing: 2.5, fontWeight: "600", textTransform: "uppercase",
        }}>
          Today's Shift
        </Text>
        <Text style={{
          color: C.white,
          fontSize: isTablet ? cvw * 3.8 : cvw * 5,
          fontWeight: "700", marginTop: 5, letterSpacing: 0.5,
        }}>
          {user?.shiftStartTime || "--"}
          <Text style={{ color: C.goldDim }}> – </Text>
          {user?.shiftEndTime || "--"}
        </Text>
      </View>
      <View style={{
        alignItems: "center", justifyContent: "center",
        width: cvw * 10, height: cvw * 10, borderRadius: cvw * 5,
        backgroundColor: isActive ? "rgba(201,162,39,0.12)" : "rgba(50,50,50,0.5)",
        borderWidth: 1, borderColor: isActive ? C.borderGold : C.border,
      }}>
        <View style={{
          width: cvw * 2.5, height: cvw * 2.5, borderRadius: cvw * 1.25,
          backgroundColor: isActive ? C.gold : C.faint,
        }} />
      </View>
    </View>
  );

  const WorkingHeroCard = ({ stretch }) => (
    <View style={{
      backgroundColor: C.surface, borderRadius: 24,
      padding: isTablet ? vh * 3.5 : vh * 3,
      borderWidth: 1, borderColor: isActive ? C.borderGold : C.border,
      alignItems: "center", justifyContent: "center",
      ...(stretch ? { flex: 1 } : {}),
    }}>
      <Text style={{
        color: C.muted, fontSize: cvw * 2.2, letterSpacing: 3,
        fontWeight: "600", textTransform: "uppercase", marginBottom: vh * 1,
      }}>
        Working Hours
      </Text>
      <Text style={{
        color: isActive ? C.gold : C.faint,
        fontSize: isTablet ? cvw * 10 : cvw * 14,
        fontWeight: "800", letterSpacing: -2,
        lineHeight: isTablet ? cvw * 11 : cvw * 14,
      }}>
        {attendance?.checkedIn ? formatTime(workingSeconds) : "00:00:00"}
      </Text>
      <View style={{
        marginTop: vh * 1.5,
        paddingHorizontal: cvw * 4, paddingVertical: vh * 0.6,
        borderRadius: 100,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderWidth: 1, borderColor: statusColor() + "55",
      }}>
        <Text style={{
          color: statusColor(), fontSize: cvw * 2.4,
          fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
        }}>
          {getStatus()}
        </Text>
      </View>
    </View>
  );

  const ActionButtons = () => (
    <View style={{ flexDirection: "row", gap: isTablet ? vw * 1.5 : vw * 3 }}>
      {canCheckIn && (
        <ActionButton
          label="Check In" icon="→"
          disabled={!!attendance?.checkedIn}
          onPress={handleCheckIn}
          cvw={cvw} vh={vh} variant="primary" isTablet={isTablet}
        />
      )}
      {canCheckOut && (
        <ActionButton
          label="Check Out" icon="✓"
          disabled={!attendance?.checkedIn || !!attendance?.checkedOut}
          onPress={handleCheckOut}
          cvw={cvw} vh={vh} variant="secondary" isTablet={isTablet}
        />
      )}
    </View>
  );

  // ── Self-upload card — shown only when at least one flag is true ──────────
  const SelfUploadCard = () => {
    if (!canSelfUpload) return null;
    return (
      <View style={{
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.borderGold,
        padding: isTablet ? vh * 2 : vh * 2,
        gap: isTablet ? vh * 1.2 : vh * 1.5,
      }}>
        {/* Section label */}
        <Text style={{
          color: C.muted,
          fontSize: cvw * 2.2,
          letterSpacing: 2.5,
          fontWeight: "600",
          textTransform: "uppercase",
        }}>
          My Documents
        </Text>

        {/* Profile photo upload row */}
        {canUploadOwnPhoto && (
          <TouchableOpacity
            onPress={pickAndUploadPhoto}
            disabled={uploading}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: cvw * 4,
              paddingVertical: isTablet ? vh * 1.5 : vh * 1.8,
              gap: 12,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <View style={{
              width: isTablet ? cvw * 5 : cvw * 9,
              height: isTablet ? cvw * 5 : cvw * 9,
              borderRadius: cvw * 5,
              backgroundColor: "rgba(201,162,39,0.1)",
              borderWidth: 1, borderColor: C.borderGold,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons
                name="camera-outline"
                size={isTablet ? cvw * 2.4 : cvw * 5}
                color={C.gold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: C.white, fontWeight: "700",
                fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
              }}>
                Upload Profile Photo
              </Text>
              <Text style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 1.7 : cvw * 3,
                marginTop: 2,
              }}>
                Camera or gallery — JPEG
              </Text>
            </View>
            {uploading
              ? <ActivityIndicator size="small" color={C.gold} />
              : <Ionicons name="cloud-upload-outline" size={isTablet ? cvw * 2.2 : cvw * 4.5} color={C.muted} />
            }
          </TouchableOpacity>
        )}

        {/* ID proof upload row */}
        {canUploadOwnIdProof && (
          <TouchableOpacity
            onPress={pickAndUploadIdProof}
            disabled={uploading}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: cvw * 4,
              paddingVertical: isTablet ? vh * 1.5 : vh * 1.8,
              gap: 12,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <View style={{
              width: isTablet ? cvw * 5 : cvw * 9,
              height: isTablet ? cvw * 5 : cvw * 9,
              borderRadius: cvw * 5,
              backgroundColor: "rgba(201,162,39,0.1)",
              borderWidth: 1, borderColor: C.borderGold,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons
                name="id-card-outline"
                size={isTablet ? cvw * 2.4 : cvw * 5}
                color={C.gold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: C.white, fontWeight: "700",
                fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
              }}>
                Upload ID Proof
              </Text>
              <Text style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 1.7 : cvw * 3,
                marginTop: 2,
              }}>
                Image or PDF document
              </Text>
            </View>
            {uploading
              ? <ActivityIndicator size="small" color={C.gold} />
              : <Ionicons name="cloud-upload-outline" size={isTablet ? cvw * 2.2 : cvw * 4.5} color={C.muted} />
            }
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── PHONE layout (<768px) ────────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: vw * 5,
            paddingTop: vh * 3,
            paddingBottom: vh * 6,
          }}
        >
          <Header />
          <View style={{ marginBottom: vh * 2.5 }}><ShiftCard /></View>
          <View style={{ marginBottom: vh * 2.5 }}><WorkingHeroCard /></View>
          <View style={{ marginBottom: vh * 2.5 }}><ActionButtons /></View>

          {/* Self-upload card — only visible if flags are on */}
          {canSelfUpload && (
            <View style={{ marginBottom: vh * 2.5 }}>
              <SelfUploadCard />
            </View>
          )}

          {/* View Attendance Records */}
          {canViewOwn && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Attendance", { screen: "StaffAttendanceHistory" })}
              activeOpacity={0.8}
              style={{
                borderWidth: 1, borderColor: C.borderGold, borderRadius: 16,
                paddingVertical: vh * 1.8, alignItems: "center",
                flexDirection: "row", justifyContent: "center",
                marginBottom: vh * 2, gap: 8,
              }}
            >
              <Text style={{ color: C.gold, fontWeight: "700", fontSize: cvw * 3.5, letterSpacing: 1 }}>
                View Attendance Records
              </Text>
              <Text style={{ color: C.gold, fontSize: cvw * 4 }}>›</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 1, backgroundColor: C.border, marginVertical: vh * 2 }} />

          <TouchableOpacity
            onPress={handleLogout} activeOpacity={0.8}
            style={{
              backgroundColor: "rgba(124,29,29,0.25)",
              borderWidth: 1, borderColor: "rgba(192,57,43,0.4)",
              paddingVertical: vh * 1.8, borderRadius: 14, alignItems: "center",
            }}
          >
            <Text style={{ color: "#E57373", fontWeight: "700", fontSize: cvw * 3.6, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768px) ───────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: vw * 4,
          paddingTop: vh * 3,
          paddingBottom: vh * 5,
        }}
      >
        <Header />

        {/* Two-column main area */}
        <View style={{ flexDirection: "row", gap: vw * 2, marginBottom: vh * 2 }}>
          <View style={{ flex: 1, gap: vh * 2 }}>
            <ShiftCard />
            <ActionButtons />
          </View>
          <View style={{ flex: 1 }}>
            <WorkingHeroCard stretch />
          </View>
        </View>

        {/* Self-upload card — full width, only if at least one flag is on */}
        {canSelfUpload && (
          <View style={{ marginBottom: vh * 2 }}>
            <SelfUploadCard />
          </View>
        )}

        {/* Footer row */}
        <View style={{ flexDirection: "row", gap: vw * 2 }}>
          {canViewOwn && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Attendance")}
              activeOpacity={0.8}
              style={{
                flex: 1.5,
                borderWidth: 1, borderColor: C.borderGold, borderRadius: 16,
                paddingVertical: vh * 2, alignItems: "center",
                flexDirection: "row", justifyContent: "center", gap: 8,
              }}
            >
              <Text style={{ color: C.gold, fontWeight: "700", fontSize: cvw * 3, letterSpacing: 1 }}>
                View Attendance Records
              </Text>
              <Text style={{ color: C.gold, fontSize: cvw * 3.2 }}>›</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleLogout} activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: "rgba(124,29,29,0.25)",
              borderWidth: 1, borderColor: "rgba(192,57,43,0.4)",
              paddingVertical: vh * 2, borderRadius: 14,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ color: "#E57373", fontWeight: "700", fontSize: cvw * 3, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionButton({ label, icon, onPress, disabled, cvw, vh, variant, isTablet }) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      disabled={disabled} onPress={onPress} activeOpacity={0.8}
      style={{ flex: 1, borderRadius: 18, opacity: disabled ? 0.4 : 1 }}
    >
      <View style={{
        backgroundColor: disabled ? C.faint : isPrimary ? C.gold : "transparent",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: C.borderGold,
        borderRadius: 18,
        paddingVertical: isTablet ? vh * 2.8 : vh * 2.4,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{
          fontSize: isTablet ? cvw * 4.5 : cvw * 6,
          marginBottom: 4,
          color: disabled ? C.muted : isPrimary ? "#000" : C.gold,
        }}>
          {icon}
        </Text>
        <Text style={{
          color: disabled ? C.muted : isPrimary ? "#000" : C.gold,
          fontWeight: "800",
          fontSize: isTablet ? cvw * 2.8 : cvw * 3.6,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}