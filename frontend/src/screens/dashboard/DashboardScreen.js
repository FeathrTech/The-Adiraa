import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useRealtime } from "../../hooks/useRealtime";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
  muted: "#777",
  faint: "#333",
};

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Live Clock Hook ──────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// ─── Clock/Date Widget ────────────────────────────────────────────────────────
function ClockWidget({ cvw, vh, isTablet }) {
  const now = useClock();

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const timeParts = timeStr.split(" ");
  const timeNumbers = timeParts[0];
  const ampm = timeParts[1];

  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.borderGold,
      paddingVertical: isTablet ? vh * 3.5 : vh * 4,
      paddingHorizontal: cvw * 6,
      marginBottom: isTablet ? vh * 2 : vh * 2.5,
      alignItems: "center",
    }}>
      {/* IST label */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: vh * 1 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold }} />
        <Text style={{
          color: C.gold,
          fontSize: isTablet ? cvw * 1.8 : cvw * 3,
          fontWeight: "600", letterSpacing: 2, textTransform: "uppercase",
        }}>
          IST
        </Text>
      </View>

      {/* Time */}
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Text style={{
          color: C.white,
          fontSize: isTablet ? cvw * 7 : cvw * 13,
          fontWeight: "700", letterSpacing: -1,
          fontVariant: ["tabular-nums"],
        }}>
          {timeNumbers}
        </Text>
        <Text style={{
          color: C.gold,
          fontSize: isTablet ? cvw * 2.8 : cvw * 5,
          fontWeight: "700",
          marginBottom: isTablet ? vh * 0.6 : vh * 0.8,
          marginLeft: cvw * 1.5, letterSpacing: 1,
        }}>
          {ampm}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: C.border, width: "100%", marginVertical: vh * 1.5 }} />

      {/* Date */}
      <Text style={{
        color: C.muted,
        fontSize: isTablet ? cvw * 2 : cvw * 3.5,
        fontWeight: "500", letterSpacing: 0.3, textAlign: "center",
      }}>
        {dateStr}
      </Text>
    </View>
  );
}

// ─── Self Upload Card ─────────────────────────────────────────────────────────
// Reusable — shared between phone and tablet layouts.
function SelfUploadCard({
  canUploadOwnPhoto,
  canUploadOwnIdProof,
  uploading,
  onPickPhoto,
  onPickIdProof,
  cvw, vh, isTablet,
}) {
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

      {/* Profile photo row */}
      {canUploadOwnPhoto && (
        <TouchableOpacity
          onPress={onPickPhoto}
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

      {/* ID proof row */}
      {canUploadOwnIdProof && (
        <TouchableOpacity
          onPress={onPickIdProof}
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
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout, setUser } = useAuthStore();
  const { vw, vh, cvw, isTablet } = useResponsive();

  // ── Permissions ────────────────────────────────────────────────────────────
  const permissions =
    user?.roles?.flatMap((role) =>
      role?.permissions?.map((perm) => perm.key)
    ) || [];

  const can = (key) => permissions.includes(key);
  const canAccessSettings = permissions.some((p) => p.startsWith("settings."));

  const hasAnyCard =
    can("event.view_all") ||
    can("attendance.view.dashboard_summary") ||
    can("site.view");

  // ── Self-upload flags — same pattern as StaffDashboard ────────────────────
  const canUploadOwnPhoto = !!user?.allowSelfPhotoUpload;
  const canUploadOwnIdProof = !!user?.allowSelfIdUpload;
  const canSelfUpload = canUploadOwnPhoto || canUploadOwnIdProof;

  // ── State ──────────────────────────────────────────────────────────────────
  const [liveAttendanceCount, setLiveAttendanceCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useRealtime("attendance_live_update", (data) => {
    if (data?.count !== undefined) setLiveAttendanceCount(data.count);
  });

  const loadLiveAttendance = async () => {
    try {
      const res = await api.get("/attendance/dashboard", {
        params: {
          filter: "present",
          date: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          }),
        },
      });
      setLiveAttendanceCount(res.data?.staff?.length || 0);
    } catch (err) {
      console.log("Live attendance load error", err);
    }
  };

  useEffect(() => { loadLiveAttendance(); }, []);

  // ── Upload handlers ────────────────────────────────────────────────────────
  const doUploadPhoto = async (asset) => {
    try {
      setUploading(true);
      console.log("--- doUploadPhoto START ---");

      const updatedUser = await uploadOwnProfilePhoto(asset);
      console.log("--- API call done, updatedUser:", !!updatedUser);

      console.log("--- calling setUser ---");
      if (updatedUser) await setUser(updatedUser);
      console.log("--- setUser done ---");

      Alert.alert("Success", "Profile photo updated");
    } catch (e) {
      console.log("--- doUploadPhoto CATCH ---");
      console.log("e.message:", e.message);
      console.log("e.stack:", e.stack);
      console.log("e.response?.status:", e.response?.status);
      console.log("e.response?.data:", JSON.stringify(e.response?.data));
      Alert.alert("Error", e.response?.data?.message || e.message || "Upload failed");
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

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => { await logout(); },
      },
    ]);
  };

  // ── Card component ─────────────────────────────────────────────────────────
  const Card = ({ title, permissionKey, onPress, badge }) => {
    if (!can(permissionKey)) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          backgroundColor: C.card,
          borderRadius: 16,
          marginBottom: isTablet ? vh * 2 : vh * 2.2,
          borderWidth: 1,
          borderColor: C.borderGold,
          paddingHorizontal: cvw * 5,
          paddingVertical: isTablet ? vh * 2.2 : vh * 2.5,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            color: C.white, fontWeight: "700",
            fontSize: isTablet ? cvw * 3.2 : cvw * 4.5,
            letterSpacing: 0.3,
          }}>
            {title}
          </Text>

          {badge !== undefined && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold }} />
              <Text style={{
                color: C.gold,
                fontSize: isTablet ? cvw * 2.4 : cvw * 3.2,
                fontWeight: "600", letterSpacing: 0.5,
              }}>
                {badge} live
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={isTablet ? cvw * 3 : cvw * 5} color={C.gold} />
      </TouchableOpacity>
    );
  };

  // ── No access message ──────────────────────────────────────────────────────
  const NoAccessMessage = () => {
    if (hasAnyCard) return null;
    return (
      <View style={{
        backgroundColor: "rgba(201,162,39,0.07)",
        borderRadius: 14, borderWidth: 1, borderColor: C.borderGold,
        paddingHorizontal: cvw * 5, paddingVertical: vh * 2.5,
        marginBottom: vh * 2.5, alignItems: "center",
      }}>
        <Ionicons
          name="lock-closed-outline"
          size={isTablet ? cvw * 4 : cvw * 7}
          color={C.goldDim}
          style={{ marginBottom: 10 }}
        />
        <Text style={{
          color: C.muted,
          fontSize: isTablet ? cvw * 2 : cvw * 3.5,
          textAlign: "center",
          lineHeight: isTablet ? cvw * 3 : cvw * 5.2,
        }}>
          You don't have access to any modules yet.{"\n"}Contact your
          administrator to get permissions assigned.
        </Text>
      </View>
    );
  };

  // ── Cards list ─────────────────────────────────────────────────────────────
  const CardList = () => (
    <>
      <Card
        title="Booking Calendar"
        permissionKey="event.view_all"
        onPress={() => navigation.navigate("EventCalendar")}
      />
      <Card
        title="Attendance"
        permissionKey="attendance.view.dashboard_summary"
        onPress={() => navigation.navigate("Attendance")}
        badge={liveAttendanceCount}
      />
      <Card
        title="Venue"
        permissionKey="site.view"
        onPress={() => navigation.navigate("Venue")}
      />
    </>
  );

  // ─── PHONE layout (<768px) ────────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: vw * 5,
            paddingTop: vh * 4,
            paddingBottom: vh * 6,
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: "row", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: vh * 4,
          }}>
            <View>
              <Text style={{
                color: C.gold, fontSize: cvw * 2.6, letterSpacing: 3,
                fontWeight: "700", textTransform: "uppercase", marginBottom: 5,
              }}>
                Admin Portal
              </Text>
              <Text style={{
                color: C.white, fontSize: cvw * 6.5,
                fontWeight: "800", letterSpacing: -0.5,
              }}>
                Dashboard
              </Text>
            </View>

            {canAccessSettings && (
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: cvw * 11, height: cvw * 11, borderRadius: cvw * 5.5,
                  backgroundColor: C.card, borderWidth: 1, borderColor: C.borderGold,
                  alignItems: "center", justifyContent: "center", marginTop: 4,
                }}
              >
                <Ionicons name="settings-outline" size={cvw * 5} color={C.gold} />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 3 }} />

          {/* Clock */}
          <ClockWidget cvw={cvw} vh={vh} isTablet={isTablet} />

          <View style={{ height: vh * 1.5 }} />

          <CardList />
          <NoAccessMessage />

          {/* Self-upload card — only if flags are on */}
          {canSelfUpload && (
            <View style={{ marginBottom: vh * 2.5 }}>
              <SelfUploadCard
                canUploadOwnPhoto={canUploadOwnPhoto}
                canUploadOwnIdProof={canUploadOwnIdProof}
                uploading={uploading}
                onPickPhoto={pickAndUploadPhoto}
                onPickIdProof={pickAndUploadIdProof}
                cvw={cvw} vh={vh} isTablet={isTablet}
              />
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout} activeOpacity={0.8}
            style={{
              marginTop: vh * 1,
              backgroundColor: "rgba(124,29,29,0.25)",
              borderWidth: 1, borderColor: "rgba(192,57,43,0.4)",
              paddingVertical: vh * 1.8, borderRadius: 14, alignItems: "center",
            }}
          >
            <Text style={{
              color: "#E57373", fontWeight: "700",
              fontSize: cvw * 3.8, letterSpacing: 1.5, textTransform: "uppercase",
            }}>
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
        {/* Header */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "flex-end", marginBottom: vh * 4,
        }}>
          <View>
            <Text style={{
              color: C.gold, fontSize: cvw * 2.2, letterSpacing: 3,
              fontWeight: "700", textTransform: "uppercase", marginBottom: 5,
            }}>
              Admin Portal
            </Text>
            <Text style={{
              color: C.white, fontSize: cvw * 5,
              fontWeight: "800", letterSpacing: -0.5,
            }}>
              Dashboard ✦
            </Text>
          </View>

          {canAccessSettings && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                backgroundColor: C.card, borderWidth: 1, borderColor: C.borderGold,
                paddingHorizontal: cvw * 3, paddingVertical: vh * 1, borderRadius: 12,
              }}
            >
              <Ionicons name="settings-outline" size={cvw * 2.2} color={C.gold} />
              <Text style={{
                color: C.gold, fontWeight: "700",
                fontSize: cvw * 2.2, letterSpacing: 0.5,
              }}>
                Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 3 }} />

        {/* Clock */}
        <ClockWidget cvw={cvw} vh={vh} isTablet={isTablet} />

        <View style={{ height: vh * 1.5 }} />

        {/* 2-column card grid */}
        <TabletCardGrid
          can={can}
          liveAttendanceCount={liveAttendanceCount}
          navigation={navigation}
          cvw={cvw} vh={vh} isTablet={isTablet}
        />

        <NoAccessMessage />

        {/* Self-upload card — full width, only if flags are on */}
        {canSelfUpload && (
          <View style={{ marginBottom: vh * 2 }}>
            <SelfUploadCard
              canUploadOwnPhoto={canUploadOwnPhoto}
              canUploadOwnIdProof={canUploadOwnIdProof}
              uploading={uploading}
              onPickPhoto={pickAndUploadPhoto}
              onPickIdProof={pickAndUploadIdProof}
              cvw={cvw} vh={vh} isTablet={isTablet}
            />
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout} activeOpacity={0.8}
          style={{
            marginTop: vh * 1,
            backgroundColor: "rgba(124,29,29,0.25)",
            borderWidth: 1, borderColor: "rgba(192,57,43,0.4)",
            paddingVertical: vh * 2, borderRadius: 14, alignItems: "center",
          }}
        >
          <Text style={{
            color: "#E57373", fontWeight: "700",
            fontSize: cvw * 2.8, letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tablet 2-column card grid ────────────────────────────────────────────────
function TabletCardGrid({ can, liveAttendanceCount, navigation, cvw, vh }) {
  const allCards = [
    can("event.view_all") && {
      key: "booking",
      title: "Booking Calendar",
      onPress: () => navigation.navigate("EventCalendar"),
    },
    can("attendance.view.dashboard_summary") && {
      key: "attendance",
      title: "Attendance",
      badge: liveAttendanceCount,
      onPress: () => navigation.navigate("Attendance"),
    },
    can("site.view") && {
      key: "venue",
      title: "Venue",
      onPress: () => navigation.navigate("Venue"),
    },
  ].filter(Boolean);

  if (allCards.length === 0) return null;

  const rows = [];
  for (let i = 0; i < allCards.length; i += 2) {
    rows.push(allCards.slice(i, i + 2));
  }

  return (
    <View>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", gap: cvw * 2, marginBottom: vh * 2 }}>
          {row.map((card) => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.8}
              onPress={card.onPress}
              style={{
                flex: 1,
                backgroundColor: C.card,
                borderRadius: 16, borderWidth: 1, borderColor: C.borderGold,
                paddingHorizontal: cvw * 4, paddingVertical: vh * 2.5,
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: C.white, fontWeight: "700",
                  fontSize: cvw * 3, letterSpacing: 0.3,
                }}>
                  {card.title}
                </Text>

                {card.badge !== undefined && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 5 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.card }} />
                    <Text style={{
                      color: C.gold, fontSize: cvw * 2.2,
                      fontWeight: "600", letterSpacing: 0.5,
                    }}>
                      {card.badge} live
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons name="chevron-forward" size={cvw * 2.5} color={C.gold} />
            </TouchableOpacity>
          ))}

          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}