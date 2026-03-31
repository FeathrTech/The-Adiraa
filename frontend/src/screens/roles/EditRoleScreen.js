import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    StatusBar,
    TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchPermissions } from "../../api/permissionApi";
import { updateRole, fetchRoleById } from "../../api/roleApi";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useUIStore } from "../../store/uiStore";
import { PERMISSION_GROUPS } from "../../config/permissionMap";
import { useTranslation } from "react-i18next";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    gold: "#C9A227",
    goldLight: "#E8C45A",
    bg: "#0A0A0A",
    surface: "#131313",
    card: "#1A1A1A",
    cardAlt: "#1F1F1F",
    border: "#2A2A2A",
    borderGold: "rgba(201,162,39,0.35)",
    white: "#FFFFFF",
    muted: "#777",
    faint: "#333",
    inputBg: "#1C1C1C",
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

const switchProps = (value) => ({
    trackColor: { false: C.faint, true: "rgba(201,162,39,0.45)" },
    thumbColor: value ? C.gold : C.muted,
    ios_backgroundColor: C.faint,
});

// ─── Screen Header ────────────────────────────────────────────────────────────
function ScreenHeader({ navigation, roleName, selectedCount, totalCount, isTablet, vw, vh, cvw }) {
    const { t } = useTranslation();
    return (
        <View style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: isTablet ? vw * 3 : vw * 5,
            paddingTop: vh * 2,
            paddingBottom: isTablet ? vh * 1.5 : vh * 1.8,
            borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
            {/* Back button */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: C.faint,
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 10, borderWidth: 1, borderColor: C.borderGold,
                    marginRight: 14,
                    flexShrink: 0,
                }}
            >
                <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
                {isTablet && (
                    <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
                )}
            </TouchableOpacity>

            {/* Title */}
            <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <Text style={{
                    color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                    letterSpacing: 3, fontWeight: "700", textTransform: "uppercase", marginBottom: 2,
                }}>
                    {t("roles.roleManagement")}
                </Text>
                <Text
                    style={{
                        color: C.white, fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
                        fontWeight: "800", letterSpacing: -0.3,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {roleName || t("roles.editRole")}
                </Text>
            </View>

            {/* Permission counter badge */}
            <View style={{
                backgroundColor: selectedCount > 0 ? "rgba(201,162,39,0.15)" : C.faint,
                borderWidth: 1, borderColor: selectedCount > 0 ? C.borderGold : C.border,
                borderRadius: 10,
                paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
                paddingVertical: isTablet ? vh * 0.6 : vh * 0.7,
                alignItems: "center",
                flexShrink: 0,
            }}>
                <Text style={{
                    color: selectedCount > 0 ? C.gold : C.muted,
                    fontWeight: "700",
                    fontSize: isTablet ? cvw * 2 : cvw * 3,
                }}>
                    {selectedCount}/{totalCount}
                </Text>
                <Text style={{
                    color: C.muted,
                    fontSize: isTablet ? cvw * 1.6 : cvw * 2.4,
                    letterSpacing: 1,
                }}>
                    {t("roles.perms")}
                </Text>
            </View>
        </View>
    );
}

// ─── Form Content ─────────────────────────────────────────────────────────────
function FormContent({
    permissions,
    selectedPermissions,
    roleNameInput,
    setRoleNameInput,
    toggleAll,
    toggleGroup,
    togglePermission,
    handleSave,
    initialRoleName,
    initialPermissions,
    isTablet,
    vw,
    vh,
    cvw,
}) {
    const { t } = useTranslation();
    const allSelected = selectedPermissions.length === permissions.length;
    const nameChanged = roleNameInput.trim() !== initialRoleName.trim();

    const permissionsChanged =
        selectedPermissions.length !== initialPermissions.length ||
        !selectedPermissions.every((id) => initialPermissions.includes(id));

    const canSave =
        roleNameInput.trim() && 
        (nameChanged || permissionsChanged);
    const selectedCount = selectedPermissions.length;
    const totalCount = permissions.length;

    const formatLabel = (key) =>
        key.split(".").slice(1).join(" ").replace(/_/g, " ").toUpperCase();

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
                paddingHorizontal: isTablet ? vw * 3 : vw * 5,
                paddingTop: isTablet ? vh * 2 : vh * 2,
                paddingBottom: 100,
            }}
        >
            {/* ── ROLE NAME INPUT ── */}
            <View style={{
                backgroundColor: C.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.borderGold,
                paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                paddingVertical: isTablet ? vh * 1.6 : vh * 1.8,
                marginBottom: isTablet ? cvw * 2 : cvw * 4,
            }}>
                {/* Label row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <View style={{
                        width: isTablet ? cvw * 4 : cvw * 7,
                        height: isTablet ? cvw * 4 : cvw * 7,
                        borderRadius: cvw * 4,
                        backgroundColor: "rgba(201,162,39,0.12)",
                        borderWidth: 1, borderColor: C.borderGold,
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <Ionicons
                            name="create-outline"
                            size={isTablet ? cvw * 2 : cvw * 3.5}
                            color={C.gold}
                        />
                    </View>
                    <Text style={{
                        color: C.white,
                        fontWeight: "700",
                        fontSize: isTablet ? cvw * 2.4 : cvw * 3.8,
                    }}>
                        {t("roles.roleName")}
                    </Text>
                    <Text style={{
                        color: C.red,
                        fontWeight: "800",
                        fontSize: isTablet ? cvw * 2 : cvw * 3.8,
                        marginLeft: -4,
                    }}>*</Text>
                </View>

                {/* Input */}
                <TextInput
                    value={roleNameInput}
                    onChangeText={setRoleNameInput}
                    placeholder={t("roles.editRoleNamePlaceholder")}
                    placeholderTextColor={C.muted}
                    style={{
                        backgroundColor: C.inputBg,
                        borderWidth: 1,
                        borderColor: roleNameInput.trim() ? C.borderGold : C.border,
                        borderRadius: 12,
                        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                        paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                        color: C.white,
                        fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                    }}
                />
            </View>

            {/* ── SELECT ALL PERMISSIONS ── */}
            <View style={{
                backgroundColor: C.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: allSelected ? C.borderGold : C.border,
                paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                paddingVertical: isTablet ? vh * 1.6 : vh * 1.8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: isTablet ? cvw * 2 : cvw * 5,
            }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                    <View style={{
                        width: isTablet ? cvw * 5 : cvw * 9,
                        height: isTablet ? cvw * 5 : cvw * 9,
                        borderRadius: cvw * 5,
                        backgroundColor: allSelected ? "rgba(201,162,39,0.15)" : C.faint,
                        borderWidth: 1, borderColor: allSelected ? C.borderGold : C.border,
                        alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Ionicons
                            name={allSelected ? "checkmark-done-outline" : "list-outline"}
                            size={isTablet ? cvw * 2.6 : cvw * 4.5}
                            color={allSelected ? C.gold : C.muted}
                        />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{
                            color: C.white, fontWeight: "700",
                            fontSize: isTablet ? cvw * 2.6 : cvw * 3.5,
                        }}>
                            {t("roles.selectAllPermissions")}
                        </Text>
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3, marginTop: 2 }}>
                            {t("roles.countSelected", { selectedCount, totalCount })}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={allSelected}
                    onValueChange={toggleAll}
                    {...switchProps(allSelected)}
                    style={{ flexShrink: 0, marginLeft: 12 }}
                />
            </View>

            {/* ── PERMISSION GROUPS ── */}
            {Object.entries(PERMISSION_GROUPS).map(([groupName, groupKeys]) => {
                const groupPermissions = permissions.filter((p) => groupKeys.includes(p.key));
                if (groupPermissions.length === 0) return null;

                const groupIds = groupPermissions.map((p) => p.id);
                const allGroupSelected = groupIds.every((id) => selectedPermissions.includes(id));
                const someSelected = groupIds.some((id) => selectedPermissions.includes(id));

                return (
                    <View key={groupName} style={{ marginBottom: isTablet ? cvw * 2.5 : cvw * 6 }}>

                        {/* Group header */}
                        <View style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: C.card,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: allGroupSelected
                                ? C.borderGold
                                : someSelected
                                    ? "rgba(201,162,39,0.2)"
                                    : C.border,
                            paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                            paddingVertical: isTablet ? vh * 1.4 : vh * 1.6,
                            marginBottom: 2,
                        }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                                <View style={{
                                    width: isTablet ? cvw * 4.5 : cvw * 8,
                                    height: isTablet ? cvw * 4.5 : cvw * 8,
                                    borderRadius: cvw * 4,
                                    backgroundColor: allGroupSelected
                                        ? "rgba(201,162,39,0.15)"
                                        : someSelected
                                            ? "rgba(201,162,39,0.08)"
                                            : C.faint,
                                    borderWidth: 1,
                                    borderColor: allGroupSelected
                                        ? C.borderGold
                                        : someSelected
                                            ? "rgba(201,162,39,0.2)"
                                            : C.border,
                                    alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Ionicons
                                        name="shield-half-outline"
                                        size={isTablet ? cvw * 2.2 : cvw * 4}
                                        color={allGroupSelected ? C.gold : someSelected ? C.goldLight : C.muted}
                                    />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{
                                        color: C.white, fontWeight: "700",
                                        fontSize: isTablet ? cvw * 2.6 : cvw * 3,
                                    }} numberOfLines={1}>
                                        {groupName}
                                    </Text>
                                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3, marginTop: 2 }}>
                                        {t("roles.countSelected", { selectedCount: groupIds.filter(id => selectedPermissions.includes(id)).length, totalCount: groupIds.length })}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={allGroupSelected}
                                onValueChange={() => toggleGroup(groupKeys)}
                                {...switchProps(allGroupSelected)}
                                style={{ flexShrink: 0, marginLeft: 12 }}
                            />
                        </View>

                        {/* Individual permissions */}
                        <View style={{
                            backgroundColor: C.cardAlt,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: C.border,
                            overflow: "hidden",
                            marginTop: 10,
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
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: cvw * 3, flex: 1, minWidth: 0 }}>
                                            <View style={{
                                                width: isTablet ? cvw * 1.5 : cvw * 2.5,
                                                height: isTablet ? cvw * 1.5 : cvw * 2.5,
                                                borderRadius: cvw * 1.5,
                                                backgroundColor: isOn ? C.gold : C.faint,
                                                flexShrink: 0,
                                            }} />
                                            <Text style={{
                                                color: isOn ? C.white : C.muted,
                                                fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                                                fontWeight: isOn ? "600" : "400",
                                                flex: 1,
                                            }} numberOfLines={2}>
                                                {formatLabel(perm.key)}
                                            </Text>
                                        </View>
                                        <Switch
                                            value={isOn}
                                            onValueChange={() => togglePermission(perm.id)}
                                            {...switchProps(isOn)}
                                            style={{ flexShrink: 0, marginLeft: 12 }}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}

            {/* ── SAVE BUTTON ── */}
            <View style={{ height: 1, backgroundColor: C.border, marginBottom: isTablet ? cvw * 2 : cvw * 5 }} />
            <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
                style={{
                    backgroundColor: canSave ? C.gold : C.faint,
                    borderRadius: 14,
                    paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
                    alignItems: "center", flexDirection: "row",
                    justifyContent: "center", gap: 8,
                    opacity: canSave ? 1 : 0.5,
                    marginBottom: isTablet ? cvw * 2 : cvw * 4,
                }}
            >
                <Ionicons
                    name="cloud-upload-outline"
                    size={isTablet ? cvw * 2.6 : cvw * 5}
                    color={canSave ? "#000" : C.muted}
                />
                <Text style={{
                    color: canSave ? "#000" : C.muted,
                    fontWeight: "800",
                    fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                    letterSpacing: 0.3, textTransform: "uppercase",
                }}>
                    {t("events.saveChangesBtn")}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditRoleScreen() {
    const { t } = useTranslation();
    const route = useRoute();
    const navigation = useNavigation();
    const { roleId } = route.params;
    const { vw, vh, cvw, isTablet } = useResponsive();

    const setGlobalLoading = useUIStore((s) => s.setLoading);

    const [roleNameInput, setRoleNameInput] = useState("");
    const [permissions, setPermissions] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialRoleName, setInitialRoleName] = useState("");
    const [initialPermissions, setInitialPermissions] = useState([]);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [allPermissions, roleDetails] = await Promise.all([
                fetchPermissions(),
                fetchRoleById(roleId),
            ]);
            setPermissions(allPermissions);
            const perms = (roleDetails.permissions || []).map((p) => p.id);

            setRoleNameInput(roleDetails.name);
            setSelectedPermissions(perms);

            setInitialRoleName(roleDetails.name);
            setInitialPermissions(perms);
        } catch (error) {
            console.log("PERMISSION LOAD ERROR:", error.response?.data || error.message);
            Alert.alert(t("roles.error"), t("roles.failedToLoadPermissions"));
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (id) => {
        setSelectedPermissions((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const toggleGroup = (groupKeys) => {
        const groupIds = permissions.filter((p) => groupKeys.includes(p.key)).map((p) => p.id);
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

    const handleSave = async () => {
        if (!roleNameInput.trim()) {
            Alert.alert(t("roles.error"), t("roles.roleNameRequired"));
            return;
        }
        if (!selectedPermissions.length) {
            Alert.alert(t("roles.validation"), t("roles.roleMinPermission"));
            return;
        }
        try {
            setGlobalLoading(true);
            await updateRole(roleId, {
                name: roleNameInput.trim(),
                permissionIds: selectedPermissions,
            });
            Alert.alert(t("roles.success"), t("roles.roleUpdated"));
            navigation.goBack();
        } catch (error) {
            Alert.alert(t("roles.error"), error.response?.data?.message || t("roles.updateFailed"));
        } finally {
            setGlobalLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={C.gold} />
                <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>LOADING</Text>
            </SafeAreaView>
        );
    }

    const selectedCount = selectedPermissions.length;
    const totalCount = permissions.length;
    const sharedProps = { isTablet, vw, vh, cvw };

    const innerContent = (
        <>
            <ScreenHeader
                navigation={navigation}
                roleName={roleNameInput}
                selectedCount={selectedCount}
                totalCount={totalCount}
                {...sharedProps}
            />
            <FormContent
                permissions={permissions}
                initialRoleName={initialRoleName}
                initialPermissions={initialPermissions}
                selectedPermissions={selectedPermissions}
                roleNameInput={roleNameInput}
                setRoleNameInput={setRoleNameInput}
                toggleAll={toggleAll}
                toggleGroup={toggleGroup}
                togglePermission={togglePermission}
                handleSave={handleSave}
                {...sharedProps}
            />
        </>
    );

    if (!isTablet) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="light-content" />
                <View style={{ flex: 1, paddingHorizontal: vw * 5, paddingTop: vh * 3, paddingBottom: vh * 4 }}>
                    <View style={{
                        backgroundColor: C.surface,
                        borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
                        flex: 1, overflow: "hidden",
                    }}>
                        {innerContent}
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, paddingHorizontal: vw * 6, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
                <View style={{
                    backgroundColor: C.surface,
                    borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
                    flex: 1, overflow: "hidden",
                }}>
                    {innerContent}
                </View>
            </View>
        </SafeAreaView>
    );
}