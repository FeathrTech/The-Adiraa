import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
} from "react-native";

import { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { fetchRoles, deleteRole } from "../../api/roleApi";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useRealtime } from "../../hooks/useRealtime";
import { useAuthStore } from "../../store/authStore";
import { can, ACTION_PERMISSIONS } from "../../config/permissionMap";
import { useTranslation } from "react-i18next";

// ─── Palette ──────────────────────────────────────────────────────────────────
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
export default function RoleListScreen() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();
  const userPermissions = useAuthStore((s) => s.permissions);
  const { vw, vh, cvw, isTablet } = useResponsive();

  // ─── Load ─────────────────────────────────────────────────────────────────
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      Alert.alert(t("roles.error"), error.response?.data?.message || t("roles.failedToLoadRoles"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadRoles(); }, []));
  useRealtime("role:updated", loadRoles);
  useRealtime("role:created", loadRoles);
  useRealtime("role:deleted", loadRoles);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoles();
    setRefreshing(false);
  };

  const handleDelete = (roleId, roleName) => {
    if (roleName === "Owner") {
      Alert.alert(t("roles.protectedRole"), t("roles.ownerCannotBeDeleted"));
      return;
    }
    Alert.alert(t("roles.deleteRoleTitle"), t("roles.deleteRoleConfirm"), [
      { text: t("roles.cancel") },
      {
        text: t("roles.delete"), style: "destructive",
        onPress: async () => {
          try {
            await deleteRole(roleId);
            loadRoles();
          } catch {
            Alert.alert(t("roles.error"), t("roles.deleteFailed"));
          }
        },
      },
    ]);
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>LOADING</Text>
      </SafeAreaView>
    );
  }

  // ─── Role card ────────────────────────────────────────────────────────────
  const RoleCard = ({ item }) => {
    const isOwnerRole = item.name === "Owner";

    return (
      <View style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderGold,
        padding: isTablet ? cvw * 2.5 : cvw * 5,
        marginBottom: isTablet ? vh * 1.8 : vh * 2,
      }}>
        {/* Top row: icon + name + permission count */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, marginBottom: 10 }}>
          <View style={{
            width: isTablet ? cvw * 5.5 : cvw * 10,
            height: isTablet ? cvw * 5.5 : cvw * 10,
            borderRadius: cvw * 5,
            backgroundColor: "rgba(201,162,39,0.12)",
            borderWidth: 1, borderColor: C.borderGold,
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="shield-outline" size={isTablet ? cvw * 2.8 : cvw * 4.5} color={C.gold} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{
                color: C.white, fontWeight: "700",
                fontSize: isTablet ? cvw * 2.8 : cvw * 4.5,
                letterSpacing: 0.2,
              }}>
                {item.name}
              </Text>
              {/* Protected badge */}
              {isOwnerRole && (
                <View style={{
                  backgroundColor: "rgba(201,162,39,0.12)",
                  borderWidth: 1, borderColor: C.borderGold,
                  borderRadius: 6,
                  paddingHorizontal: 7, paddingVertical: 2,
                  flexDirection: "row", alignItems: "center", gap: 4,
                }}>
                  <Ionicons name="lock-closed-outline" size={isTablet ? cvw * 1.5 : cvw * 2.5} color={C.gold} />
                  <Text style={{ color: C.gold, fontWeight: "600", fontSize: isTablet ? cvw * 1.6 : cvw * 2.5 }}>
                    {t("roles.protected")}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
              <Ionicons name="key-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.2 }}>
                {t("roles.permissionCount", { count: item.permissions?.length || 0 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: C.border, marginBottom: 10 }} />

        {/* Action buttons — Owner role only shows delete guard, no manage permissions */}
        {!isOwnerRole && (
          <View style={{ flexDirection: "row", gap: cvw * 2 }}>
            {can(userPermissions, ACTION_PERMISSIONS.role.assignPermissions) && (
              <TouchableOpacity
                onPress={() => navigation.navigate("EditRole", { roleId: item.id })}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(201,162,39,0.12)",
                  borderWidth: 1, borderColor: C.borderGold,
                  paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
                  borderRadius: 10,
                  flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 6,
                }}
              >
                <Ionicons name="key-outline" size={isTablet ? cvw * 2 : cvw * 3.8} color={C.gold} />
                <Text style={{ color: C.gold, fontWeight: "600", fontSize: isTablet ? cvw * 2.2 : cvw * 3.5 }}>
                  {t("roles.managePermissions")}
                </Text>
              </TouchableOpacity>
            )}

            {can(userPermissions, ACTION_PERMISSIONS.role.delete) && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "rgba(229,115,115,0.1)",
                  borderWidth: 1, borderColor: "rgba(229,115,115,0.35)",
                  paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
                  paddingHorizontal: isTablet ? cvw * 2 : cvw * 4,
                  borderRadius: 10,
                  flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 5,
                }}
              >
                <Ionicons name="trash-outline" size={isTablet ? cvw * 2 : cvw * 3.8} color="#E57373" />
                <Text style={{ color: "#E57373", fontWeight: "600", fontSize: isTablet ? cvw * 2.2 : cvw * 3.5 }}>
                  {t("roles.delete")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ─── Empty state ──────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={{ alignItems: "center", marginTop: vh * 8 }}>
      <View style={{
        width: isTablet ? cvw * 14 : cvw * 22,
        height: isTablet ? cvw * 14 : cvw * 22,
        borderRadius: cvw * 11,
        backgroundColor: C.faint,
        borderWidth: 1, borderColor: C.border,
        alignItems: "center", justifyContent: "center",
        marginBottom: vh * 2,
      }}>
        <Ionicons name="shield-outline" size={isTablet ? cvw * 7 : cvw * 10} color={C.muted} />
      </View>
      <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 3 : cvw * 4.5, marginBottom: 6 }}>
        {t("roles.noRolesFound")}
      </Text>
      <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.5, textAlign: "center" }}>
        {t("roles.createRoleHint")}
      </Text>
    </View>
  );

  const canCreate = can(userPermissions, ACTION_PERMISSIONS.role.create);

  // ─── Inner card content (shared) ─────────────────────────────────────────
  const CardContent = () => (
    <FlatList
      data={isTablet ? null : roles}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: canCreate ? 90 : 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={C.gold}
          colors={[C.gold]}
        />
      }
      ListEmptyComponent={<EmptyState />}
      renderItem={({ item }) => <RoleCard item={item} />}
    />
  );

  // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
  if (!isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 4, paddingBottom: vh * 4 }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
            flex: 1, padding: vw * 5,
          }}>
            <View style={{
              flexDirection: "row", alignItems: "center",
              marginBottom: vh * 3,
              paddingBottom: vh * 2,
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
                <Ionicons name="arrow-back" size={18} color={C.gold} />
              </TouchableOpacity>

              <View>
                <Text style={{
                  color: C.gold, fontSize: cvw * 2.8, letterSpacing: 3,
                  fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
                }}>
                  {t("roles.admin")}
                </Text>
                <Text style={{ color: C.white, fontSize: cvw * 5.5, fontWeight: "800", letterSpacing: -0.3 }}>
                  {t("roles.rolesTitle")}
                </Text>
              </View>
            </View>

            <CardContent />
          </View>

          {canCreate && (
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateRole")}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                bottom: vh * 6,
                alignSelf: "center",
                backgroundColor: C.gold,
                paddingHorizontal: vw * 8,
                paddingVertical: vh * 1.6,
                borderRadius: 50,
                flexDirection: "row", alignItems: "center", gap: 8,
                elevation: 6,
                shadowColor: C.gold, shadowOpacity: 0.4, shadowRadius: 10,
              }}
            >
              <Ionicons name="add-circle-outline" size={cvw * 5} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800", fontSize: cvw * 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {t("roles.createRole")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── TABLET layout (≥768 px) — 2-col grid ────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingHorizontal: vw * 4, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
          flex: 1, padding: vw * 3,
        }}>
          <View style={{
            flexDirection: "row", alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: vh * 3,
            paddingBottom: vh * 2,
            borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
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
                  {t("roles.admin")}
                </Text>
                <Text style={{ color: C.white, fontSize: cvw * 3.5, fontWeight: "800", letterSpacing: -0.3 }}>
                  {t("roles.rolesTitle")}
                </Text>
              </View>
            </View>

            {canCreate && (
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateRole")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: C.gold,
                  paddingHorizontal: cvw * 3,
                  paddingVertical: vh * 1.2,
                  borderRadius: 12,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={cvw * 2.4} color="#000" />
                <Text style={{ color: "#000", fontWeight: "800", fontSize: cvw * 2.4, letterSpacing: 0.3 }}>
                  {t("roles.createRole")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={roles}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            numColumns={2}
            columnWrapperStyle={{ gap: vw * 2 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.gold}
                colors={[C.gold]}
              />
            }
            ListEmptyComponent={<EmptyState />}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <RoleCard item={item} />
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}