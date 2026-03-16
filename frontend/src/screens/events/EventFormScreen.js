import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
    StatusBar,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createEvent, updateEvent } from "../../api/eventsApi";

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
};

// ─── Char limits ──────────────────────────────────────────────────────────────
const LIMITS = {
    title: 100,
    notes: 500,
    clientName: 60,
};

const SLOT_ICON = { lunch: "restaurant-outline", dinner: "moon-outline" };
const STATUS_META = {
    booked: { icon: "checkmark-circle-outline", color: "#5DBE8A" },
    in_talks: { icon: "chatbubble-ellipses-outline", color: C.gold },
};

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const vw = width / 100;
    const vh = height / 100;
    const colWidth = isTablet ? width * 0.62 : width;
    const cvw = colWidth / 100;
    return { width, height, vw, vh, cvw, isTablet };
}

// ─── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ icon, label, hint, optional, cvw, isTablet }) {
    return (
        <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 4} color={C.gold} />
                <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
                    {label}
                </Text>
                {optional && (
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, fontWeight: "400" }}>
                        (optional)
                    </Text>
                )}
            </View>
            {hint && (
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, marginTop: 2, marginLeft: isTablet ? cvw * 2.5 : cvw * 5.5 }}>
                    {hint}
                </Text>
            )}
        </View>
    );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function StyledInput({ value, onChangeText, placeholder, multiline, keyboardType, isPhone, maxLength, showCount, cvw, isTablet }) {
    const [focused, setFocused] = useState(false);

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

    const currentLength = value ? value.length : 0;
    const isNearLimit = maxLength && currentLength >= maxLength * 0.85;
    const isAtLimit = maxLength && currentLength >= maxLength;

    // ── Phone input ──
    if (isPhone) {
        return (
            <View style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                <View style={{
                    backgroundColor: C.inputBg,
                    borderWidth: 1,
                    borderColor: focused ? C.gold : C.border,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                }}>
                    <TextInput
                        value={value}
                        onChangeText={handleChange}
                        placeholder={placeholder}
                        placeholderTextColor={C.muted}
                        keyboardType="numeric"
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        maxLength={10}
                        style={{
                            flex: 1,
                            color: C.white,
                            fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                            paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                        }}
                    />
                    <Text style={{
                        color: currentLength === 10 ? C.gold : C.muted,
                        fontSize: isTablet ? cvw * 1.8 : cvw * 3,
                        fontWeight: "600",
                        marginLeft: 6,
                    }}>
                        {currentLength}/10
                    </Text>
                </View>
                {currentLength > 0 && currentLength < 10 && (
                    <Text style={{
                        color: C.red,
                        fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                        marginTop: 4,
                        marginLeft: 4,
                    }}>
                        Phone number must be 10 digits
                    </Text>
                )}
            </View>
        );
    }

    // ── Standard input ──
    return (
        <View style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
            <TextInput
                value={value}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor={C.muted}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType || "default"}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={maxLength}
                style={{
                    backgroundColor: C.inputBg,
                    borderWidth: 1,
                    borderColor: focused
                        ? isAtLimit ? C.red : C.gold
                        : isAtLimit ? "rgba(229,115,115,0.5)" : C.border,
                    borderRadius: 12,
                    paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 4,
                    paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                    color: C.white,
                    fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                    textAlignVertical: multiline ? "top" : "center",
                    minHeight: multiline ? (isTablet ? cvw * 10 : cvw * 24) : undefined,
                }}
            />
            {/* Char counter — only when showCount is true */}
            {showCount && maxLength && (
                <Text style={{
                    color: isAtLimit ? C.red : isNearLimit ? "#F97316" : C.muted,
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

// ─── Screen header ────────────────────────────────────────────────────────────
function ScreenHeader({ navigation, isEdit, dateLabel, cvw, isTablet }) {
    return (
        <View style={{
            paddingHorizontal: isTablet ? cvw * 3 : cvw * 5,
            paddingTop: isTablet ? cvw * 2 : cvw * 4,
            paddingBottom: isTablet ? cvw * 1.5 : cvw * 3.5,
            borderBottomWidth: 1, borderBottomColor: C.border,
            flexDirection: "row", alignItems: "center", gap: 12,
        }}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: C.faint,
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 10, borderWidth: 1, borderColor: C.borderGold,
                }}
            >
                <Ionicons name="chevron-back" size={isTablet ? cvw * 2.2 : 18} color={C.gold} />
                {isTablet && (
                    <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
                )}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
                <Text style={{
                    color: C.gold, fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                    fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 2,
                }}>
                    {isEdit ? "Editing Event" : "New Booking"}
                </Text>
                <Text style={{
                    color: C.white, fontSize: isTablet ? cvw * 3.2 : cvw * 5.5,
                    fontWeight: "800", letterSpacing: -0.3,
                }}>
                    {isEdit ? "Edit Event" : "Add Event"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <Ionicons name="calendar-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.9 : cvw * 3 }}>
                        {dateLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Form body ────────────────────────────────────────────────────────────────
function FormBody({
    form, update, loading, isEdit, halls, bookedSlots,
    handleSubmit, vw, cvw, isTablet,
}) {
    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                padding: isTablet ? vw * 3 : vw * 5,
                paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* ── EVENT DETAILS ── */}
            <SectionHeader title="Event Details" icon="calendar-outline" cvw={cvw} isTablet={isTablet} />

            <FieldLabel
                icon="ribbon-outline" label="Event Title"
                hint="Name of the event or function (e.g. Singh Wedding Reception)"
                cvw={cvw} isTablet={isTablet}
            />
            <StyledInput
                value={form.title}
                onChangeText={(v) => update("title", v)}
                placeholder="e.g. Singh Wedding Reception, Corporate Gala 2025"
                maxLength={LIMITS.title}
                showCount
                cvw={cvw} isTablet={isTablet}
            />

            <FieldLabel
                icon="document-text-outline" label="Notes"
                hint="Special requirements, décor preferences, dietary notes, etc."
                cvw={cvw} isTablet={isTablet}
            />
            <StyledInput
                value={form.notes}
                onChangeText={(v) => update("notes", v)}
                placeholder="e.g. Vegan menu required, floral arrangement on main stage, live band setup..."
                multiline
                maxLength={LIMITS.notes}
                showCount
                cvw={cvw} isTablet={isTablet}
            />

            {/* ── CLIENT INFO ── */}
            <SectionHeader title="Client Information" icon="person-outline" cvw={cvw} isTablet={isTablet} />

            {isTablet ? (
                <View style={{ flexDirection: "row", gap: cvw * 3 }}>
                    <View style={{ flex: 1 }}>
                        <FieldLabel
                            icon="person-circle-outline" label="Client Name"
                            hint="Full name of the booking contact"
                            cvw={cvw} isTablet={isTablet}
                        />
                        <StyledInput
                            value={form.clientName}
                            onChangeText={(v) => update("clientName", v)}
                            placeholder="e.g. Priya Sharma"
                            maxLength={LIMITS.clientName}
                            showCount
                            cvw={cvw} isTablet={isTablet}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FieldLabel
                            icon="call-outline" label="Contact Number"
                            hint="Phone or WhatsApp number"
                            cvw={cvw} isTablet={isTablet}
                        />
                        <StyledInput
                            value={form.clientContact}
                            onChangeText={(v) => update("clientContact", v)}
                            placeholder="e.g. 9876543210"
                            keyboardType="phone-pad"
                            isPhone
                            cvw={cvw} isTablet={isTablet}
                        />
                    </View>
                </View>
            ) : (
                <>
                    <FieldLabel
                        icon="person-circle-outline" label="Client Name"
                        hint="Full name of the booking contact"
                        cvw={cvw} isTablet={isTablet}
                    />
                    <StyledInput
                        value={form.clientName}
                        onChangeText={(v) => update("clientName", v)}
                        placeholder="e.g. Priya Sharma"
                        maxLength={LIMITS.clientName}
                        showCount
                        cvw={cvw} isTablet={isTablet}
                    />
                    <FieldLabel
                        icon="call-outline" label="Contact Number"
                        hint="Phone or WhatsApp number"
                        cvw={cvw} isTablet={isTablet}
                    />
                    <StyledInput
                        value={form.clientContact}
                        onChangeText={(v) => update("clientContact", v)}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        isPhone
                        cvw={cvw} isTablet={isTablet}
                    />
                </>
            )}

            {/* ── BOOKING OPTIONS ── */}
            <SectionHeader title="Booking Options" icon="options-outline" cvw={cvw} isTablet={isTablet} />

            <FieldLabel
                icon="time-outline" label="Event Slot"
                hint="Choose the meal slot for this booking"
                cvw={cvw} isTablet={isTablet}
            />
            <View style={{ flexDirection: "row", gap: cvw * 3, marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                {["lunch", "dinner"].map((slot) => {
                    const isBooked = bookedSlots.includes(slot) && form.eventSlot !== slot;
                    const isActive = form.eventSlot === slot;
                    return (
                        <TouchableOpacity
                            key={slot}
                            disabled={isBooked}
                            onPress={() => update("eventSlot", slot)}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                paddingVertical: isTablet ? cvw * 1.4 : cvw * 3.5,
                                borderRadius: 12,
                                alignItems: "center",
                                backgroundColor: isActive ? C.gold : C.inputBg,
                                borderWidth: 1,
                                borderColor: isActive ? C.gold : C.border,
                                opacity: isBooked ? 0.35 : 1,
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 6,
                            }}
                        >
                            <Ionicons
                                name={SLOT_ICON[slot]}
                                size={isTablet ? cvw * 2.4 : cvw * 4.5}
                                color={isActive ? "#000" : C.muted}
                            />
                            <View style={{ alignItems: "center" }}>
                                <Text style={{
                                    color: isActive ? "#000" : C.muted,
                                    fontWeight: "700",
                                    fontSize: isTablet ? cvw * 2.4 : cvw * 3.8,
                                    textTransform: "capitalize",
                                }}>
                                    {slot}
                                </Text>
                                {isBooked && (
                                    <Text style={{ fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, color: C.red, marginTop: 1 }}>
                                        Already booked
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FieldLabel
                icon="flag-outline" label="Booking Status"
                hint="Current stage of this booking"
                cvw={cvw} isTablet={isTablet}
            />
            <View style={{ flexDirection: "row", gap: cvw * 3, marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                {["booked", "in_talks"].map((s) => {
                    const isActive = form.status === s;
                    const meta = STATUS_META[s];
                    return (
                        <TouchableOpacity
                            key={s}
                            onPress={() => update("status", s)}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                paddingVertical: isTablet ? cvw * 1.4 : cvw * 3.5,
                                borderRadius: 12,
                                alignItems: "center",
                                backgroundColor: isActive
                                    ? (s === "booked" ? "rgba(93,190,138,0.15)" : "rgba(201,162,39,0.15)")
                                    : C.inputBg,
                                borderWidth: 1,
                                borderColor: isActive ? meta.color : C.border,
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 6,
                            }}
                        >
                            <Ionicons
                                name={meta.icon}
                                size={isTablet ? cvw * 2.4 : cvw * 4.5}
                                color={isActive ? meta.color : C.muted}
                            />
                            <Text style={{
                                color: isActive ? meta.color : C.muted,
                                fontWeight: "700",
                                fontSize: isTablet ? cvw * 2.4 : cvw * 3.8,
                                textTransform: "capitalize",
                            }}>
                                {s.replace("_", " ")}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {halls.length > 0 && (
                <>
                    <FieldLabel
                        icon="business-outline" label="Hall"
                        hint="Select which hall this event will be held in"
                        optional cvw={cvw} isTablet={isTablet}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}
                    >
                        <TouchableOpacity
                            onPress={() => update("hallName", "")}
                            style={{
                                paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
                                paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
                                borderRadius: 20, marginRight: 8,
                                backgroundColor: !form.hallName ? C.gold : C.inputBg,
                                borderWidth: 1,
                                borderColor: !form.hallName ? C.gold : C.border,
                            }}
                        >
                            <Text style={{
                                color: !form.hallName ? "#000" : C.muted,
                                fontWeight: !form.hallName ? "700" : "500",
                                fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                            }}>
                                None
                            </Text>
                        </TouchableOpacity>

                        {halls.map((hall) => {
                            const isActive = form.hallName === hall.name;
                            return (
                                <TouchableOpacity
                                    key={hall.id}
                                    onPress={() => update("hallName", hall.name)}
                                    style={{
                                        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
                                        paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
                                        borderRadius: 20, marginRight: 8,
                                        backgroundColor: isActive ? C.gold : C.inputBg,
                                        borderWidth: 1, borderColor: isActive ? C.gold : C.border,
                                        flexDirection: "row", alignItems: "center", gap: 5,
                                    }}
                                >
                                    {isActive && (
                                        <Ionicons name="checkmark" size={isTablet ? cvw * 2 : cvw * 3.5} color="#000" />
                                    )}
                                    <Text style={{
                                        color: isActive ? "#000" : C.muted,
                                        fontWeight: isActive ? "700" : "500",
                                        fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                                    }}>
                                        {hall.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </>
            )}

            <View style={{ height: 1, backgroundColor: C.border, marginBottom: isTablet ? cvw * 2 : cvw * 5 }} />

            <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                    backgroundColor: loading ? C.faint : C.gold,
                    borderRadius: 14,
                    paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
                    alignItems: "center", flexDirection: "row",
                    justifyContent: "center", gap: 8,
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                ) : (
                    <Ionicons
                        name={isEdit ? "cloud-upload-outline" : "add-circle-outline"}
                        size={isTablet ? cvw * 2.6 : cvw * 5}
                        color="#000"
                    />
                )}
                <Text style={{
                    color: loading ? C.muted : "#000",
                    fontWeight: "800",
                    fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                }}>
                    {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EventFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { vw, vh, cvw, isTablet } = useResponsive();

    const {
        mode,
        event,
        date,
        locationId,
        halls = [],
        bookedSlots = [],
    } = route.params;

    const isEdit = mode === "edit";

    const [form, setForm] = useState({
        title: event?.title || "",
        clientName: event?.clientName || "",
        clientContact: event?.clientContact || "",
        notes: event?.notes || "",
        eventSlot: event?.eventSlot || (bookedSlots.includes("lunch") ? "dinner" : "lunch"),
        status: event?.status || "booked",
        hallName: event?.hallName || "",
    });

    const [loading, setLoading] = useState(false);
    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        // ── Validation ──
        if (!form.title.trim()) {
            Alert.alert("Validation", "Event title is required.");
            return;
        }
        if (form.title.trim().length < 3) {
            Alert.alert("Validation", "Event title must be at least 3 characters.");
            return;
        }
        if (!form.clientName.trim()) {
            Alert.alert("Validation", "Client name is required.");
            return;
        }
        if (form.clientName.trim().length < 2) {
            Alert.alert("Validation", "Client name must be at least 2 characters.");
            return;
        }
        if (form.clientContact && form.clientContact.length !== 10) {
            Alert.alert("Validation", "Contact number must be exactly 10 digits.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                title: form.title,
                clientName: form.clientName,
                clientContact: form.clientContact,
                notes: form.notes,
                eventSlot: form.eventSlot,
                status: form.status,
                hallName: form.hallName || null,
                date,
                location: { id: locationId },
            };
            if (isEdit) { await updateEvent(event.id, payload); }
            else { await createEvent(payload); }
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    const cardStyle = {
        backgroundColor: C.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.borderGold,
        flex: 1,
        overflow: "hidden",
    };

    const formBodyProps = {
        form, update, loading, isEdit, halls, bookedSlots,
        handleSubmit, vw, cvw, isTablet,
    };

    const headerProps = {
        navigation, isEdit, dateLabel, cvw, isTablet,
    };

    if (!isTablet) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={{ flex: 1, margin: vw * 4, marginBottom: vw * 4 }}>
                        <View style={cardStyle}>
                            <ScreenHeader {...headerProps} />
                            <FormBody {...formBodyProps} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={{ flex: 1, marginHorizontal: vw * 8, marginVertical: vh * 3 }}>
                    <View style={cardStyle}>
                        <ScreenHeader {...headerProps} />
                        <FormBody {...formBodyProps} />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}