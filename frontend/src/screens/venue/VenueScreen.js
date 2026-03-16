import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useSiteStore } from "../../store/siteStore";
import { fetchSites } from "../../api/siteApi";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
};

// ─── Responsive hook (breakpoint 768 px) ─────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.5 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VenueScreen() {
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const permissions = useAuthStore((s) => s.permissions) || [];
  const sites = useSiteStore((s) => s.sites);
  const setSites = useSiteStore((s) => s.setSites);

  const [loading, setLoading] = useState(false);

  const canView = permissions.includes("site.view");
  const canCreate = permissions.includes("site.create");

  // ─── Load sites (unchanged) ───────────────────────────────────────────────
  const loadSites = async () => {
    try {
      setLoading(true);
      console.log("Fetching sites...");
      const data = await fetchSites();
      console.log("Sites response:", data);
      setSites(data);
    } catch (err) {
      console.log("Site fetch error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { loadSites(); }, [])
  );

  // ─── No access ────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="lock-closed-outline" size={48} color={C.faint} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>No Access</Text>
      </SafeAreaView>
    );
  }

  // ─── Shared: header ───────────────────────────────────────────────────────
  const Header = () => (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: isTablet ? vh * 3 : vh * 3,
      paddingBottom: isTablet ? vh * 2 : vh * 2,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: C.faint,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.borderGold,
          marginRight: 12,
        }}
      >
        <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
        {isTablet && (
          <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
        )}
      </TouchableOpacity>

      <View>
        <Text style={{
          color: C.gold,
          fontSize: isTablet ? cvw * 2 : cvw * 2.8,
          letterSpacing: 3,
          fontWeight: "700",
          textTransform: "uppercase",
          marginBottom: 2,
        }}>
          Management
        </Text>
        <Text style={{
          color: C.white,
          fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
          fontWeight: "800",
          letterSpacing: -0.3,
        }}>
          Venues
        </Text>
      </View>
    </View>
  );

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4 }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            flex: 1,
            padding: vw * 5,
          }}>
            <Header />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={{ color: C.muted, marginTop: 12, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5, letterSpacing: 1.5 }}>
                LOADING
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (sites.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{
          flex: 1,
          paddingHorizontal: vw * 5,
          paddingTop: vh * 4,
          paddingBottom: vh * 4,
          justifyContent: "center",
        }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            padding: vw * 5,
          }}>
            <Header />
            <View style={{ alignItems: "center", paddingVertical: vh * 5 }}>
              <View style={{
                width: isTablet ? cvw * 16 : cvw * 22,
                height: isTablet ? cvw * 16 : cvw * 22,
                borderRadius: cvw * 11,
                backgroundColor: C.faint,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: vh * 2,
              }}>
                <Ionicons name="business-outline" size={isTablet ? cvw * 7 : cvw * 10} color={C.muted} />
              </View>

              <Text style={{
                color: C.white,
                fontSize: isTablet ? cvw * 3 : cvw * 4.5,
                fontWeight: "700",
                marginBottom: 6,
              }}>
                No Venues Yet
              </Text>
              <Text style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                textAlign: "center",
              }}>
                No banquet sites have been created yet
              </Text>

              {canCreate && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("CreateSite")}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: C.gold,
                    paddingHorizontal: vw * 8,
                    paddingVertical: vh * 1.6,
                    borderRadius: 14,
                    marginTop: vh * 3,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={isTablet ? cvw * 2.5 : 18} color="#000" />
                  <Text style={{
                    color: "#000",
                    fontWeight: "800",
                    fontSize: isTablet ? cvw * 2.6 : cvw * 3.8,
                    letterSpacing: 0.3,
                  }}>
                    Create Your First Site
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Site card ────────────────────────────────────────────────────────────
  const SiteCard = ({ site }) => (
    <TouchableOpacity
      key={site.id}
      onPress={() => navigation.navigate("VenueDetails", { siteId: site.id })}
      activeOpacity={0.8}
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderGold,
        paddingHorizontal: cvw * 5,
        paddingVertical: isTablet ? vh * 2.2 : vh * 2.5,
        marginBottom: isTablet ? vh * 1.8 : vh * 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: icon + info */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1 }}>
        <View style={{
          width: cvw * (isTablet ? 6 : 10),
          height: cvw * (isTablet ? 6 : 10),
          borderRadius: cvw * 5,
          backgroundColor: "rgba(201,162,39,0.12)",
          borderWidth: 1,
          borderColor: C.borderGold,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Ionicons
            name="business-outline"
            size={cvw * (isTablet ? 2.8 : 4.5)}
            color={C.gold}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{
            color: C.white,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 3 : cvw * 4.5,
            letterSpacing: 0.2,
          }}>
            {site.name}
          </Text>

          {site.latitude && site.longitude && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
              <Ionicons name="location-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
              <Text style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 2 : cvw * 3,
              }}>
                {site.latitude}, {site.longitude}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: chevron */}
      <Ionicons
        name="chevron-forward"
        size={cvw * (isTablet ? 2.2 : 4)}
        color={C.gold}
      />
    </TouchableOpacity>
  );

  // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4, paddingBottom: vh * 4 }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: C.borderGold,
            flex: 1,
            padding: vw * 5,
          }}>
            <Header />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {sites.map((site) => <SiteCard key={site.id} site={site} />)}
            </ScrollView>

            {/* FAB */}
            {canCreate && (
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateSite")}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  bottom: 24,
                  right: vw * 5,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: C.gold,
                  alignItems: "center",
                  justifyContent: "center",
                  elevation: 6,
                  shadowColor: C.gold,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                }}
              >
                <Ionicons name="add" size={28} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
  //
  //  ┌───────────────────────────────────────────────────┐
  //  │  ← Back   Venues                   [+ Add Site]  │  header
  //  ├───────────────────────────────────────────────────┤
  //  │  Site card        │  Site card                   │  2-col grid
  //  │  Site card        │  Site card                   │
  //  └───────────────────────────────────────────────────┘
  const rows = [];
  for (let i = 0; i < sites.length; i += 2) rows.push(sites.slice(i, i + 2));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingHorizontal: vw * 4, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.borderGold,
          flex: 1,
          padding: vw * 3,
        }}>
          {/* Header row with inline Add button on tablet */}
          <View style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: vh * 3,
            paddingBottom: vh * 2,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}>
            {/* Back + title */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                <Ionicons name="arrow-back" size={cvw * 2.2} color={C.gold} />
                <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
              </TouchableOpacity>

              <View>
                <Text style={{
                  color: C.gold, fontSize: cvw * 2, letterSpacing: 3,
                  fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
                }}>
                  Management
                </Text>
                <Text style={{
                  color: C.white, fontSize: cvw * 3.5,
                  fontWeight: "800", letterSpacing: -0.3,
                }}>
                  Venues
                </Text>
              </View>
            </View>

            {/* Add Site button — inline on tablet */}
            {canCreate && (
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateSite")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: C.gold,
                  paddingHorizontal: cvw * 3,
                  paddingVertical: vh * 1.2,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={cvw * 2.4} color="#000" />
                <Text style={{
                  color: "#000", fontWeight: "800",
                  fontSize: cvw * 2.4, letterSpacing: 0.3,
                }}>
                  Add Site
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 2-col grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: vw * 2, marginBottom: 0 }}>
                {row.map((site) => (
                  <View key={site.id} style={{ flex: 1 }}>
                    <SiteCard site={site} />
                  </View>
                ))}
                {/* Spacer for odd-count rows */}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}