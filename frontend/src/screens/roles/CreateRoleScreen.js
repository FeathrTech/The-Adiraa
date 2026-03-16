import {
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createRole, assignPermissions } from "../../api/roleApi";
import { fetchPermissions } from "../../api/permissionApi";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { PERMISSION_GROUPS, can } from "../../config/permissionMap";

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
  red: "#E57373",
};

// ─── Char limit ───────────────────────────────────────────────────────────────
const ROLE_NAME_MAX = 50;
const ROLE_NAME_MIN = 2;

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

// ─── Gold switch props ────────────────────────────────────────────────────────
const switchProps = (value) => ({
  trackColor: { false: C.faint, true: "rgba(201,162,39,0.45)" },
  thumbColor: value ? C.gold : C.muted,
  ios_backgroundColor: C.faint,
});

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ label, cvw, vh, isTablet }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: isTablet ? cvw * 1.5 : cvw * 4,
      marginTop: isTablet ? cvw * 1.5 : cvw * 3,
    }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      <Text style={{
        color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3,
        fontWeight: "600", letterSpacing: 2, textTransform: "uppercase",
      }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}

// ─── Screen header ────────────────────────────────────────────────────────────
function ScreenHeader({ navigation, selectedCount, totalCount, cvw, vw, vh, isTablet }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: isTablet ? vw * 3 : vw * 5,
      paddingTop: isTablet ? vh * 2 : vh * 2,
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
        {isTablet && (
          <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={{
          color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
          letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
        }}>
          Role Management
        </Text>
        <Text style={{
          color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
          fontWeight: "800", letterSpacing: -0.3,
        }}>
          Create Role
        </Text>
      </View>

      {/* Live selected count badge */}
      <View style={{
        backgroundColor: selectedCount > 0 ? "rgba(201,162,39,0.15)" : C.faint,
        borderWidth: 1, borderColor: selectedCount > 0 ? C.borderGold : C.border,
        borderRadius: 10,
        paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
        paddingVertical: isTablet ? vh * 0.6 : vh * 0.7,
        alignItems: "center",
      }}>
        <Text style={{
          color: selectedCount > 0 ? C.gold : C.muted,
          fontWeight: "700", fontSize: isTablet ? cvw * 2 : cvw * 3,
        }}>
          {selectedCount}/{totalCount}
        </Text>
        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.6 : cvw * 2.4, letterSpacing: 1 }}>
          PERMS
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateRoleScreen() {
  const navigation = useNavigation();
  const userPermissions = useAuthStore((s) => s.permissions);
  const { vw, vh, cvw, isTablet } = useResponsive();

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [nameInputFocused, setNameInputFocused] = useState(false);

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    try {
      const data = await fetchPermissions();
      setPermissions(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPerms(false);
    }
  };

  const togglePermission = (id) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (groupKeys) => {
    const groupPermissions = permissions.filter((p) => groupKeys.includes(p.key));
    const groupIds = groupPermissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupIds])]);
    }
  };

  const toggleAll = () => {
    const allIds = permissions.map((p) => p.id);
    setSelectedPermissions(selectedPermissions.length === allIds.length ? [] : allIds);
  };

  const formatLabel = (key) =>
    key.split(".").slice(1).join(" ").replace(/_/g, " ").toUpperCase();

  const handleCreate = async () => {
    if (!roleName.trim()) return;
    if (roleName.trim().length < ROLE_NAME_MIN) {
      Alert.alert("Validation", `Role name must be at least ${ROLE_NAME_MIN} characters.`);
      return;
    }
    try {
      setLoading(true);
      const role = await createRole(roleName);
      if (can(userPermissions, "role.assign_permissions")) {
        await assignPermissions(role.id, selectedPermissions);
      }
      navigation.goBack();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPerms) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>LOADING</Text>
      </SafeAreaView>
    );
  }

  const allSelected = selectedPermissions.length === permissions.length;
  const canSubmit = !loading && roleName.trim().length >= ROLE_NAME_MIN;
  const selectedCount = selectedPermissions.length;
  const totalCount = permissions.length;

  // ─── Char counter colour ──────────────────────────────────────────────────
  const nameLen = roleName.length;
  const nameCountColor = nameLen >= ROLE_NAME_MAX
    ? C.red
    : nameLen >= Math.floor(ROLE_NAME_MAX * 0.85)
      ? "#F97316"
      : C.muted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{
        flex: 1,
        paddingHorizontal: isTablet ? vw * 6 : vw * 5,
        paddingTop: vh * 3,
        paddingBottom: isTablet ? vh * 3 : vh * 4,
      }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
          flex: 1, overflow: "hidden",
        }}>

          {/* Header */}
          <ScreenHeader
            navigation={navigation}
            selectedCount={selectedCount}
            totalCount={totalCount}
            cvw={cvw} vw={vw} vh={vh} isTablet={isTablet}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: isTablet ? vw * 3 : vw * 5,
              paddingTop: vh * 2,
              paddingBottom: 100,
            }}
          >

            {/* ── ROLE NAME INPUT ── */}
            <View style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="shield-outline" size={isTablet ? cvw * 2 : cvw * 4} color={C.gold} />
                <Text style={{
                  color: C.white, fontWeight: "700",
                  fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                }}>
                  Role Name
                </Text>
              </View>
              <Text style={{
                color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3,
                marginBottom: 8, marginLeft: isTablet ? cvw * 2.5 : cvw * 5.5,
              }}>
                A unique name for this permission role (e.g. Manager, Supervisor)
              </Text>

              <TextInput
                placeholder="e.g. Manager, Supervisor, Front Desk"
                placeholderTextColor={C.muted}
                value={roleName}
                onChangeText={(text) => {
                  if (text.length <= ROLE_NAME_MAX) setRoleName(text);
                }}
                onFocus={() => setNameInputFocused(true)}
                onBlur={() => setNameInputFocused(false)}
                maxLength={ROLE_NAME_MAX}
                style={{
                  backgroundColor: C.inputBg,
                  borderWidth: 1,
                  borderColor: nameInputFocused
                    ? nameLen >= ROLE_NAME_MAX ? C.red : C.gold
                    : nameLen >= ROLE_NAME_MAX ? "rgba(229,115,115,0.5)" : C.border,
                  borderRadius: 12,
                  paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                  paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                  color: C.white,
                  fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                }}
              />

              {/* Char counter */}
              <Text style={{
                color: nameCountColor,
                fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                textAlign: "right",
                marginTop: 4,
                marginRight: 2,
              }}>
                {nameLen}/{ROLE_NAME_MAX}
              </Text>

              {/* Min length hint — shown only while typing and below min */}
              {nameLen > 0 && nameLen < ROLE_NAME_MIN && (
                <Text style={{
                  color: C.red,
                  fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                  marginTop: 2,
                  marginLeft: 2,
                }}>
                  Role name must be at least {ROLE_NAME_MIN} characters
                </Text>
              )}
            </View>

            <SectionDivider label="Permissions" cvw={cvw} vh={vh} isTablet={isTablet} />

            {/* ── SELECT ALL ROW ── */}
            <View style={{
              backgroundColor: C.card,
              borderRadius: 14, borderWidth: 1,
              borderColor: allSelected ? C.borderGold : C.border,
              paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
              paddingVertical: isTablet ? vh * 1.6 : vh * 1.8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isTablet ? cvw * 2 : cvw * 5,
              gap: cvw * 3,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                <View style={{
                  width: isTablet ? cvw * 5 : cvw * 9,
                  height: isTablet ? cvw * 5 : cvw * 9,
                  borderRadius: cvw * 5, flexShrink: 0,
                  backgroundColor: allSelected ? "rgba(201,162,39,0.15)" : C.faint,
                  borderWidth: 1, borderColor: allSelected ? C.borderGold : C.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons
                    name={allSelected ? "checkmark-done-outline" : "list-outline"}
                    size={isTablet ? cvw * 2.6 : cvw * 4.5}
                    color={allSelected ? C.gold : C.muted}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{
                    color: C.white, fontWeight: "700",
                    fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                  }}>
                    Select All Permissions
                  </Text>
                  <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3, marginTop: 2 }}>
                    {selectedCount} of {totalCount} selected
                  </Text>
                </View>
              </View>
              <Switch value={allSelected} onValueChange={toggleAll} {...switchProps(allSelected)} />
            </View>

            {/* ── PERMISSION GROUPS ── */}
            {Object.entries(PERMISSION_GROUPS).map(([groupName, groupKeys]) => {
              const groupPermissions = permissions.filter((p) => groupKeys.includes(p.key));
              if (groupPermissions.length === 0) return null;

              const groupIds = groupPermissions.map((p) => p.id);
              const groupAllSel = groupIds.every((id) => selectedPermissions.includes(id));
              const groupSomeSel = groupIds.some((id) => selectedPermissions.includes(id));
              const groupCount = groupIds.filter(id => selectedPermissions.includes(id)).length;

              return (
                <View key={groupName} style={{ marginBottom: isTablet ? cvw * 2.5 : cvw * 6 }}>

                  {/* Group header */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: C.card,
                    borderRadius: 14, borderWidth: 1,
                    borderColor: groupAllSel ? C.borderGold : groupSomeSel ? "rgba(201,162,39,0.2)" : C.border,
                    paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                    paddingVertical: isTablet ? vh * 1.4 : vh * 1.6,
                    marginBottom: 2,
                    gap: cvw * 3,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                      <View style={{
                        width: isTablet ? cvw * 4.5 : cvw * 8,
                        height: isTablet ? cvw * 4.5 : cvw * 8,
                        borderRadius: cvw * 4, flexShrink: 0,
                        backgroundColor: groupAllSel
                          ? "rgba(201,162,39,0.15)"
                          : groupSomeSel ? "rgba(201,162,39,0.08)" : C.faint,
                        borderWidth: 1,
                        borderColor: groupAllSel ? C.borderGold : groupSomeSel ? "rgba(201,162,39,0.2)" : C.border,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Ionicons
                          name="shield-half-outline"
                          size={isTablet ? cvw * 2.2 : cvw * 4}
                          color={groupAllSel ? C.gold : groupSomeSel ? C.goldLight : C.muted}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{
                          color: C.white, fontWeight: "700",
                          fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                        }}>
                          {groupName}
                        </Text>
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3, marginTop: 2 }}>
                          {groupCount} / {groupIds.length} selected
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={groupAllSel}
                      onValueChange={() => toggleGroup(groupKeys)}
                      {...switchProps(groupAllSel)}
                    />
                  </View>

                  {/* Individual permissions */}
                  <View style={{
                    backgroundColor: C.cardAlt,
                    borderRadius: 14, borderWidth: 1, borderColor: C.border,
                    overflow: "hidden",
                  }}>
                    {groupPermissions.map((perm, idx) => {
                      const isOn = selectedPermissions.includes(perm.id);
                      const isLast = idx === groupPermissions.length - 1;
                      return (
                        <View
                          key={perm.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                            paddingVertical: isTablet ? vh * 1.3 : vh * 1.6,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: C.border,
                            backgroundColor: isOn ? "rgba(201,162,39,0.04)" : "transparent",
                            gap: cvw * 3,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                            <View style={{
                              width: isTablet ? cvw * 1.5 : cvw * 2.5,
                              height: isTablet ? cvw * 1.5 : cvw * 2.5,
                              borderRadius: cvw * 1.5, flexShrink: 0,
                              backgroundColor: isOn ? C.gold : C.faint,
                            }} />
                            <Text
                              numberOfLines={1}
                              style={{
                                color: isOn ? C.white : C.muted,
                                fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                                fontWeight: isOn ? "600" : "400",
                                flex: 1,
                              }}
                            >
                              {formatLabel(perm.key)}
                            </Text>
                          </View>
                          <Switch
                            value={isOn}
                            onValueChange={() => togglePermission(perm.id)}
                            {...switchProps(isOn)}
                          />
                        </View>
                      );
                    })}
                  </View>

                </View>
              );
            })}

            {/* ── CREATE BUTTON ── */}
            <View style={{ height: 1, backgroundColor: C.border, marginBottom: isTablet ? cvw * 2 : cvw * 5 }} />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!canSubmit}
              activeOpacity={0.8}
              style={{
                backgroundColor: canSubmit ? C.gold : C.faint,
                borderRadius: 14,
                paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
                alignItems: "center", flexDirection: "row",
                justifyContent: "center", gap: 8,
                opacity: canSubmit ? 1 : 0.5,
                marginBottom: isTablet ? cvw * 2 : cvw * 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Ionicons
                  name="add-circle-outline"
                  size={isTablet ? cvw * 2.6 : cvw * 5}
                  color={canSubmit ? "#000" : C.muted}
                />
              )}
              <Text style={{
                color: canSubmit ? "#000" : C.muted,
                fontWeight: "800",
                fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                letterSpacing: 0.3, textTransform: "uppercase",
              }}>
                {loading ? "Creating…" : "Create Role"}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}