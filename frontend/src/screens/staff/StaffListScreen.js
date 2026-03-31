import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { fetchUsers } from "../../api/userApi";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRealtime } from "../../hooks/useRealtime";
import { useAuthStore } from "../../store/authStore";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  inputBg: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  green: "#5DBE8A",
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.1)",
  redBorder: "rgba(229,115,115,0.35)",
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

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
function FilterTabs({ filter, setFilter, users, cvw, isTablet }) {
  const { t } = useTranslation();
  const tabs = [
    { key: "all", label: t("staff.all", "All"), count: users.length },
    { key: "active", label: t("staff.active", "Active"), count: users.filter((u) => u.isActive).length },
    { key: "inactive", label: t("staff.inactive", "Inactive"), count: users.filter((u) => !u.isActive).length },
  ];

  return (
    <View style={{
      flexDirection: "row",
      gap: isTablet ? cvw * 1.5 : cvw * 2.5,
      marginBottom: isTablet ? 12 : 14,
    }}>
      {tabs.map((tab) => {
        const isSelected = filter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.75}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: isTablet ? cvw * 0.8 : cvw * 1.5,
              paddingVertical: isTablet ? 8 : 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isSelected ? C.gold : C.border,
              backgroundColor: isSelected ? "rgba(201,162,39,0.1)" : C.inputBg,
            }}
          >
            <Text style={{
              color: isSelected ? C.gold : C.muted,
              fontWeight: isSelected ? "700" : "500",
              fontSize: isTablet ? cvw * 1.9 : cvw * 3.2,
            }}>
              {tab.label}
            </Text>
            <View style={{
              backgroundColor: isSelected ? "rgba(201,162,39,0.2)" : C.faint,
              borderRadius: 6,
              paddingHorizontal: isTablet ? cvw * 0.8 : cvw * 1.8,
              paddingVertical: 2,
            }}>
              <Text style={{
                color: isSelected ? C.gold : C.muted,
                fontWeight: "700",
                fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
              }}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Staff card — defined OUTSIDE ────────────────────────────────────────────
function StaffCard({ item, onPress, cvw, isTablet }) {
  const { t } = useTranslation();
  const roleLabel = item.roles?.map((r) => r.name).join(", ") || t("staff.noRole", "No Role");
  const isActive = item.isActive;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderGold,
        padding: isTablet ? cvw * 2.5 : cvw * 5,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: cvw * 3,
      }}
    >
      <View style={{
        width: isTablet ? cvw * 6 : cvw * 11,
        height: isTablet ? cvw * 6 : cvw * 11,
        borderRadius: cvw * 6,
        backgroundColor: "rgba(201,162,39,0.12)",
        borderWidth: 1,
        borderColor: C.borderGold,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Text style={{ color: C.gold, fontWeight: "800", fontSize: isTablet ? cvw * 2.8 : cvw * 4.5 }}>
          {item.name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.6 : cvw * 4.2, marginBottom: 3 }}>
          {item.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <Ionicons name="call-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
          <Text numberOfLines={1} style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
            {item.mobile || "—"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="shield-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
          <Text numberOfLines={1} style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2, flex: 1 }}>
            {roleLabel}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <View style={{
          backgroundColor: isActive ? C.greenBg : C.redBg,
          borderWidth: 1,
          borderColor: isActive ? C.greenBorder : C.redBorder,
          borderRadius: 8,
          paddingHorizontal: isTablet ? cvw * 1.5 : cvw * 2.5,
          paddingVertical: 4,
        }}>
          <Text style={{
            color: isActive ? C.green : C.red,
            fontWeight: "700",
            fontSize: isTablet ? cvw * 1.8 : cvw * 2.8,
            letterSpacing: 0.5,
          }}>
            {isActive ? t("staff.activeCaps", "ACTIVE") : t("staff.inactiveCaps", "INACTIVE")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={isTablet ? cvw * 2 : cvw * 3.8} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty state — defined OUTSIDE ───────────────────────────────────────────
function EmptyState({ search, filter, cvw, isTablet }) {
  const { t } = useTranslation();
  const isFiltered = filter !== "all";
  const label = search.trim()
    ? t("staff.noResultsFound", "No Results Found")
    : isFiltered
      ? filter === "active" ? t("staff.noActiveStaff", "No Active Staff") : t("staff.noInactiveStaff", "No Inactive Staff")
      : t("staff.noStaffFound", "No Staff Found");
  const sub = search.trim()
    ? t("staff.noStaffMatching", 'No staff matching "{{search}}"', { search })
    : isFiltered
      ? filter === "active" ? t("staff.noActiveStaffSub", "No staff members are currently active") : t("staff.noInactiveStaffSub", "No staff members are currently inactive")
      : t("staff.addStaffToGetStarted", "Add staff members to get started");

  return (
    <View style={{ alignItems: "center", paddingTop: 64 }}>
      <View style={{
        width: isTablet ? cvw * 14 : cvw * 22,
        height: isTablet ? cvw * 14 : cvw * 22,
        borderRadius: cvw * 11,
        backgroundColor: C.faint,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <Ionicons name="people-outline" size={isTablet ? cvw * 7 : cvw * 10} color={C.muted} />
      </View>
      <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 3 : cvw * 4.5, marginBottom: 6 }}>
        {label}
      </Text>
      <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5, textAlign: "center" }}>
        {sub}
      </Text>
    </View>
  );
}

// ─── Screen header — defined OUTSIDE ─────────────────────────────────────────
function ScreenHeader({ navigation, canCreate, cvw, vh, isTablet }) {
  const { t } = useTranslation();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: isTablet ? 16 : 20,
      paddingBottom: isTablet ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
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
        {isTablet && (
          <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>{t("settings.cancel", "Back")}</Text>
        )}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{
          color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
          letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
        }}>
          {t("staff.admin", "Admin")}
        </Text>
        <Text style={{
          color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
          fontWeight: "800", letterSpacing: -0.3,
        }}>
          {t("staff.staffSettings", "Staff")}
        </Text>
      </View>
      {canCreate && (
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateStaff")}
          activeOpacity={0.8}
          style={{
            backgroundColor: C.gold,
            paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
            paddingVertical: isTablet ? vh * 1 : vh * 1.2,
            borderRadius: 12,
            flexDirection: "row", alignItems: "center", gap: 5,
          }}
        >
          <Ionicons name="add" size={isTablet ? cvw * 2.2 : cvw * 4.5} color="#000" />
          <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.2 : cvw * 3.5 }}>
            {t("staff.addStaff", "Add Staff")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StaffListScreen() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState("all");

  const navigation = useNavigation();
  const route = useRoute();
  const permissions = useAuthStore((s) => s.permissions);
  const { vw, vh, cvw, isTablet } = useResponsive();

  const canCreate = permissions.includes("staff.create");

  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.log("STAFF LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useRealtime("user:created", load);
  useRealtime("user:updated", load);
  useRealtime("user:deleted", load);

  useEffect(() => {
    if (route.params?._refresh) load();
  }, [route.params?._refresh]);

  // ─── Filter + Search ───────────────────────────────────────────────────────
  useEffect(() => {
    let result = users;

    if (filter === "active") result = result.filter((u) => u.isActive);
    else if (filter === "inactive") result = result.filter((u) => !u.isActive);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.mobile?.includes(q)
      );
    }

    setFiltered(result);
  }, [search, users, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
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

      <View style={{
        flex: 1,
        paddingHorizontal: isTablet ? vw * 4 : vw * 5,
        paddingTop: vh * 3,
        paddingBottom: isTablet ? vh * 3 : vh * 4,
      }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.borderGold,
          flex: 1,
          padding: isTablet ? vw * 3 : vw * 5,
        }}>

          {/* Header — stable outside component */}
          <ScreenHeader
            navigation={navigation}
            canCreate={canCreate}
            cvw={cvw}
            vh={vh}
            isTablet={isTablet}
          />

          {/* Search bar — inlined to keep keyboard stable */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: C.inputBg,
            borderWidth: 1, borderColor: searchFocused ? C.gold : C.border,
            borderRadius: 14,
            paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
            paddingVertical: isTablet ? 10 : 12,
            marginBottom: isTablet ? 12 : 14,
            gap: 10,
          }}>
            <Ionicons
              name="search-outline"
              size={isTablet ? cvw * 2.2 : cvw * 4.5}
              color={searchFocused ? C.gold : C.muted}
            />
            <TextInput
              placeholder={t("staff.searchPlaceholder", "Search by name or mobile...")}
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, color: C.white, fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={isTablet ? cvw * 2.2 : cvw * 4.5} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            users={users}
            cvw={cvw}
            isTablet={isTablet}
          />

          {/* Count row */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: isTablet ? 12 : 14,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="people-outline" size={isTablet ? cvw * 2 : cvw * 3.5} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
                {filtered.length} {filtered.length === 1 ? t("staff.member", "member") : t("staff.members", "members")}
                {search.trim()
                  ? t("staff.foundFor", ' found for "{{search}}"', { search })
                  : filter !== "all"
                    ? ` ${filter === "active" ? t("staff.active", "Active").toLowerCase() : t("staff.inactive", "Inactive").toLowerCase()}`
                    : t("staff.total", " total")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8 }}>
                {users.filter((u) => u.isActive).length} {t("staff.active", "Active").toLowerCase()}
              </Text>
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? "tablet" : "phone"}
            columnWrapperStyle={isTablet ? { gap: vw * 2 } : undefined}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.gold}
                colors={[C.gold]}
              />
            }
            ListEmptyComponent={
              <EmptyState search={search} filter={filter} cvw={cvw} isTablet={isTablet} />
            }
            renderItem={({ item }) => {
              const card = (
                <StaffCard
                  item={item}
                  onPress={() => navigation.navigate("StaffDetail", { user: item })}
                  cvw={cvw}
                  isTablet={isTablet}
                />
              );
              return isTablet ? <View style={{ flex: 1 }}>{card}</View> : card;
            }}
          />

        </View>
      </View>
    </SafeAreaView>
  );
}