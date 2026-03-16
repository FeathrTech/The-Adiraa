import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    StatusBar,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { fetchSiteById } from "../../api/siteApi";
import { fetchHalls } from "../../api/hallApi";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    gold: "#C9A227",
    goldLight: "#E8C45A",
    goldDim: "rgba(201,162,39,0.12)",
    bg: "#0A0A0A",
    surface: "#131313",
    card: "#1A1A1A",
    border: "#2A2A2A",
    borderGold: "rgba(201,162,39,0.35)",
    white: "#FFFFFF",
    muted: "#777",
    faint: "#333",
    green: "#5DBE8A",
    greenDim: "rgba(93,190,138,0.12)",
    greenBorder: "rgba(93,190,138,0.4)",
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
                backgroundColor: C.goldDim,
                borderWidth: 1, borderColor: C.borderGold,
                alignItems: "center", justifyContent: "center",
            }}>
                <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 3.5} color={C.gold} />
            </View>
            <Text style={{
                color: C.gold,
                fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
            }}>
                {title}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </View>
    );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, cvw, isTablet, accent }) {
    return (
        <View style={{
            flexDirection: "row", alignItems: "flex-start",
            paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
            borderBottomWidth: 1, borderBottomColor: C.border,
            gap: isTablet ? cvw * 2 : cvw * 3,
        }}>
            <View style={{
                width: isTablet ? cvw * 3.5 : cvw * 7,
                height: isTablet ? cvw * 3.5 : cvw * 7,
                borderRadius: cvw * 4,
                backgroundColor: C.faint,
                alignItems: "center", justifyContent: "center",
                marginTop: 1, flexShrink: 0,
            }}>
                <Ionicons name={icon} size={isTablet ? cvw * 1.8 : cvw * 3.5} color={accent || C.muted} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    color: C.muted,
                    fontSize: isTablet ? cvw * 1.8 : cvw * 3,
                    marginBottom: 3, letterSpacing: 0.5,
                }}>
                    {label}
                </Text>
                <Text style={{
                    color: accent || C.white,
                    fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                    fontWeight: "600",
                    lineHeight: isTablet ? cvw * 3 : cvw * 5.5,
                }}>
                    {value || "—"}
                </Text>
            </View>
        </View>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, borderColor, bgColor, cvw, isTablet }) {
    return (
        <View style={{
            flex: 1,
            backgroundColor: bgColor || C.card,
            borderRadius: 16, borderWidth: 1,
            borderColor: borderColor || C.border,
            padding: isTablet ? cvw * 2 : cvw * 4,
            alignItems: "center", gap: isTablet ? cvw * 0.8 : cvw * 1.5,
        }}>
            <View style={{
                width: isTablet ? cvw * 5 : cvw * 10,
                height: isTablet ? cvw * 5 : cvw * 10,
                borderRadius: cvw * 5,
                backgroundColor: bgColor || C.goldDim,
                borderWidth: 1, borderColor: borderColor || C.borderGold,
                alignItems: "center", justifyContent: "center",
            }}>
                <Ionicons name={icon} size={isTablet ? cvw * 2.4 : cvw * 4.5} color={color || C.gold} />
            </View>
            <Text style={{
                color: color || C.gold,
                fontSize: isTablet ? cvw * 3.5 : cvw * 6,
                fontWeight: "800", letterSpacing: -0.5,
            }}>
                {value ?? "—"}
            </Text>
            <Text style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 1.8 : cvw * 3,
                textAlign: "center", letterSpacing: 0.3,
            }}>
                {label}
            </Text>
        </View>
    );
}

// ─── Hall card (read-only) ────────────────────────────────────────────────────
function HallCard({ hall, cvw, isTablet }) {
    return (
        <View style={{
            backgroundColor: C.card,
            borderRadius: 14, borderWidth: 1, borderColor: C.borderGold,
            padding: isTablet ? cvw * 2 : cvw * 4,
            marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
            flexDirection: "row", alignItems: "center", gap: cvw * 3,
        }}>
            <View style={{
                width: isTablet ? cvw * 5 : cvw * 9,
                height: isTablet ? cvw * 5 : cvw * 9,
                borderRadius: cvw * 5,
                backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.borderGold,
                alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Ionicons name="business-outline" size={isTablet ? cvw * 2.4 : cvw * 4.5} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    color: C.white, fontWeight: "700",
                    fontSize: isTablet ? cvw * 2.4 : cvw * 4,
                    marginBottom: 2,
                }}>
                    {hall.name}
                </Text>
                {hall.description ? (
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3.2, marginBottom: 2 }}>
                        {hall.description}
                    </Text>
                ) : null}
                {hall.capacity ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="people-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>
                            Capacity:{" "}
                            <Text style={{ color: C.goldLight, fontWeight: "600" }}>{hall.capacity}</Text>
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VenueDetailsScreen({ route }) {
    const { siteId } = route.params;
    const navigation = useNavigation();
    const { vw, vh, cvw, isTablet } = useResponsive();

    const permissions = useAuthStore((s) => s.permissions) || [];
    const canEdit = permissions.includes("site.edit");

    const [site, setSite] = useState(null);
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [siteData, hallData] = await Promise.all([
                    fetchSiteById(siteId),
                    fetchHalls(siteId).catch(() => []),
                ]);
                setSite(siteData);
                setHalls(hallData);
            } catch (err) {
                Alert.alert("Error", "Failed to load venue details");
                console.log("VenueDetails load error:", err?.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [siteId]);

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading || !site) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={C.gold} />
                <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>
                    LOADING VENUE
                </Text>
            </SafeAreaView>
        );
    }

    const hasLocation = !!(site.latitude && site.longitude);

    const openMaps = () => {
        if (!hasLocation) return;
        const url = `https://maps.google.com/?q=${site.latitude},${site.longitude}`;
        Linking.openURL(url).catch(() => Alert.alert("Could not open Maps"));
    };

    const formattedDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
        });
    };

    // ─── Shared scroll content ────────────────────────────────────────────────
    const Content = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
        >
            {/* ── STATS ROW ── */}
            <View style={{
                flexDirection: "row",
                gap: isTablet ? vw * 2 : vw * 3,
                marginBottom: isTablet ? cvw * 2 : cvw * 4,
            }}>
                <StatCard
                    icon="grid-outline"
                    label="Halls"
                    value={halls.length}
                    color={C.gold}
                    bgColor={C.goldDim}
                    borderColor={C.borderGold}
                    cvw={cvw}
                    isTablet={isTablet}
                />
                <StatCard
                    icon="radio-button-on-outline"
                    label="Radius (m)"
                    value={site.allowedRadius ?? 100}
                    color={C.green}
                    bgColor={C.greenDim}
                    borderColor={C.greenBorder}
                    cvw={cvw}
                    isTablet={isTablet}
                />
            </View>

            {/* ── SITE INFORMATION ── */}
            <SectionHeader title="Site Information" icon="business-outline" cvw={cvw} isTablet={isTablet} />

            <View style={{
                backgroundColor: C.card,
                borderRadius: 16, borderWidth: 1, borderColor: C.borderGold,
                paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
                marginBottom: isTablet ? cvw * 2 : cvw * 4,
                overflow: "hidden",
            }}>
                <InfoRow
                    icon="storefront-outline"
                    label="Venue Name"
                    value={site.name}
                    cvw={cvw} isTablet={isTablet}
                    accent={C.gold}
                />
                <InfoRow
                    icon="document-text-outline"
                    label="Address / Description"
                    value={site.address || "No address provided"}
                    cvw={cvw} isTablet={isTablet}
                />
                <InfoRow
                    icon="calendar-outline"
                    label="Created"
                    value={formattedDate(site.createdAt)}
                    cvw={cvw} isTablet={isTablet}
                />
                <InfoRow
                    icon="refresh-outline"
                    label="Last Updated"
                    value={formattedDate(site.updatedAt)}
                    cvw={cvw} isTablet={isTablet}
                />
            </View>

            {/* ── GPS LOCATION ── */}
            <SectionHeader title="GPS Location" icon="location-outline" cvw={cvw} isTablet={isTablet} />

            <View style={{
                backgroundColor: hasLocation ? "rgba(93,190,138,0.08)" : C.card,
                borderRadius: 16, borderWidth: 1,
                borderColor: hasLocation ? C.greenBorder : C.border,
                padding: isTablet ? cvw * 2.5 : cvw * 5,
                marginBottom: isTablet ? cvw * 2 : cvw * 4,
                gap: isTablet ? cvw * 1.5 : cvw * 3,
            }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons
                        name={hasLocation ? "location" : "location-outline"}
                        size={isTablet ? cvw * 2.4 : cvw * 5}
                        color={hasLocation ? C.green : C.muted}
                    />
                    <Text style={{
                        color: hasLocation ? C.green : C.muted,
                        fontWeight: "700",
                        fontSize: isTablet ? cvw * 2 : cvw * 3.5,
                        letterSpacing: 0.5,
                    }}>
                        {hasLocation ? "Location Set" : "No Location Data"}
                    </Text>
                </View>

                {hasLocation && (
                    <>
                        <View style={{ flexDirection: "row", gap: isTablet ? vw * 2 : vw * 3 }}>
                            <View style={{
                                flex: 1, backgroundColor: C.faint, borderRadius: 10,
                                padding: isTablet ? cvw * 1.5 : cvw * 3,
                            }}>
                                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginBottom: 3 }}>
                                    Latitude
                                </Text>
                                <Text style={{
                                    color: C.white, fontWeight: "600",
                                    fontSize: isTablet ? cvw * 2 : cvw * 3.5,
                                    fontVariant: ["tabular-nums"],
                                }}>
                                    {site.latitude.toFixed(6)}
                                </Text>
                            </View>
                            <View style={{
                                flex: 1, backgroundColor: C.faint, borderRadius: 10,
                                padding: isTablet ? cvw * 1.5 : cvw * 3,
                            }}>
                                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginBottom: 3 }}>
                                    Longitude
                                </Text>
                                <Text style={{
                                    color: C.white, fontWeight: "600",
                                    fontSize: isTablet ? cvw * 2 : cvw * 3.5,
                                    fontVariant: ["tabular-nums"],
                                }}>
                                    {site.longitude.toFixed(6)}
                                </Text>
                            </View>
                        </View>

                        {/* Open in Maps */}
                        <TouchableOpacity
                            onPress={openMaps}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: C.faint,
                                borderWidth: 1, borderColor: C.greenBorder,
                                borderRadius: 12,
                                paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "center", gap: 8,
                            }}
                        >
                            <Ionicons name="map-outline" size={isTablet ? cvw * 2 : cvw * 4} color={C.green} />
                            <Text style={{
                                color: C.green, fontWeight: "700",
                                fontSize: isTablet ? cvw * 2 : cvw * 3.5,
                            }}>
                                Open in Google Maps
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* ── HALLS ── */}
            <SectionHeader title={`Halls (${halls.length})`} icon="grid-outline" cvw={cvw} isTablet={isTablet} />

            {halls.length === 0 ? (
                <View style={{
                    backgroundColor: C.card, borderRadius: 14,
                    borderWidth: 1, borderColor: C.border,
                    padding: isTablet ? cvw * 3 : cvw * 6,
                    alignItems: "center", gap: 8,
                    marginBottom: isTablet ? cvw * 2 : cvw * 4,
                }}>
                    <Ionicons name="grid-outline" size={isTablet ? cvw * 5 : cvw * 10} color={C.faint} />
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.5, textAlign: "center" }}>
                        No halls have been added to this venue yet
                    </Text>
                </View>
            ) : isTablet ? (
                <View style={{ marginBottom: cvw * 2 }}>
                    {(() => {
                        const rows = [];
                        for (let i = 0; i < halls.length; i += 2) rows.push(halls.slice(i, i + 2));
                        return rows.map((row, ri) => (
                            <View key={ri} style={{ flexDirection: "row", gap: vw * 2 }}>
                                {row.map((hall) => (
                                    <View key={hall.id} style={{ flex: 1 }}>
                                        <HallCard hall={hall} cvw={cvw} isTablet={isTablet} />
                                    </View>
                                ))}
                                {row.length === 1 && <View style={{ flex: 1 }} />}
                            </View>
                        ));
                    })()}
                </View>
            ) : (
                <View style={{ marginBottom: cvw * 4 }}>
                    {halls.map((hall) => (
                        <HallCard key={hall.id} hall={hall} cvw={cvw} isTablet={isTablet} />
                    ))}
                </View>
            )}
        </ScrollView>
    );

    // ─── Screen header ────────────────────────────────────────────────────────
    const Header = () => (
        <View style={{
            flexDirection: "row", alignItems: "center",
            marginBottom: isTablet ? cvw * 2 : cvw * 5,
            paddingBottom: isTablet ? cvw * 1.5 : cvw * 4,
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
                    color: C.gold,
                    fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                    letterSpacing: 3, fontWeight: "700",
                    textTransform: "uppercase", marginBottom: 2,
                }}>
                    Venue Management
                </Text>
                <Text
                    numberOfLines={1}
                    style={{
                        color: C.white,
                        fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
                        fontWeight: "800", letterSpacing: -0.3,
                    }}
                >
                    {site.name}
                </Text>
            </View>

            {canEdit && (
                <TouchableOpacity
                    onPress={() => navigation.navigate("EditVenue", { siteId })}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: C.gold,
                        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                        paddingVertical: isTablet ? cvw * 0.9 : cvw * 2,
                        borderRadius: 12,
                        flexDirection: "row", alignItems: "center", gap: 5,
                    }}
                >
                    <Ionicons name="pencil-outline" size={isTablet ? cvw * 2.2 : cvw * 4.5} color="#000" />
                    <Text style={{ color: "#000", fontWeight: "800", fontSize: isTablet ? cvw * 2.2 : cvw * 3.5 }}>
                        Edit
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // ─── PHONE layout ─────────────────────────────────────────────────────────
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
                        <Header />
                        <Content />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ─── TABLET layout ────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, paddingHorizontal: vw * 4, paddingTop: vh * 3, paddingBottom: vh * 3 }}>
                <View style={{
                    backgroundColor: C.surface,
                    borderRadius: 28, borderWidth: 1, borderColor: C.borderGold,
                    flex: 1, padding: vw * 3,
                }}>
                    <Header />
                    <Content />
                </View>
            </View>
        </SafeAreaView>
    );
}