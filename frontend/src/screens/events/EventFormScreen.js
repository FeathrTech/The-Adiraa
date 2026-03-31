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
import { useTranslation } from "react-i18next";

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
    orange: "#F97316",
};

// ─── Char limits ──────────────────────────────────────────────────────────────
const LIMITS = { title: 100, notes: 500, clientName: 60 };

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
    const { t } = useTranslation();
    return (
        <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 4} color={C.gold} />
                <Text style={{ color: C.white, fontWeight: "700", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>
                    {label}
                </Text>
                {optional && (
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, fontWeight: "400" }}>
                        {t("events.optional")}
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
    const { t } = useTranslation();
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

    if (isPhone) {
        return (
            <View style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                <View style={{
                    backgroundColor: C.inputBg, borderWidth: 1,
                    borderColor: focused ? C.gold : C.border,
                    borderRadius: 12, flexDirection: "row", alignItems: "center",
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
                            flex: 1, color: C.white,
                            fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
                            paddingVertical: isTablet ? cvw * 1.2 : cvw * 3,
                        }}
                    />
                    <Text style={{
                        color: currentLength === 10 ? C.gold : C.muted,
                        fontSize: isTablet ? cvw * 1.8 : cvw * 3,
                        fontWeight: "600", marginLeft: 6,
                    }}>
                        {currentLength}/10
                    </Text>
                </View>
                {currentLength > 0 && currentLength < 10 && (
                    <Text style={{ color: C.red, fontSize: isTablet ? cvw * 1.6 : cvw * 2.8, marginTop: 4, marginLeft: 4 }}>
                        {t("events.phoneLengthError")}
                    </Text>
                )}
            </View>
        );
    }

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
                    backgroundColor: C.inputBg, borderWidth: 1,
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
            {showCount && maxLength && (
                <Text style={{
                    color: isAtLimit ? C.red : isNearLimit ? C.orange : C.muted,
                    fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                    textAlign: "right", marginTop: 4, marginRight: 2,
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
    const { t } = useTranslation();
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
                    {isEdit ? t("events.editingEvent") : t("events.newBooking")}
                </Text>
                <Text style={{
                    color: C.white, fontSize: isTablet ? cvw * 3.2 : cvw * 5.5,
                    fontWeight: "800", letterSpacing: -0.3,
                }}>
                    {isEdit ? t("events.editEvent") : t("events.addEvent")}
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
    bookedHallSlots, handleSubmit, vw, cvw, isTablet,
}) {
    const { t } = useTranslation();
    /*
     bookedHallSlots: Array of { hallName, eventSlot } objects where status === "booked"
     Used to:
       1. Disable a hall chip when that hall is fully booked for the selected slot
       2. Disable a slot chip when ALL halls (or the selected hall) are booked for that slot
       3. Show warning on in_talks entries in the event list (handled in calendar screen)
    */

    // Is a specific slot fully booked for the currently selected hall?
    const isSlotBookedForHall = (slot) => {
        if (!form.hallName) {
            // No hall selected — slot is blocked only if booked across all halls
            // (backend will catch it anyway; keep UX permissive here)
            return false;
        }
        return bookedHallSlots.some(
            (b) => b.hallName === form.hallName && b.eventSlot === slot
        );
    };

    // Is a specific hall booked for the currently selected slot?
    const isHallBookedForSlot = (hallName) => {
        return bookedHallSlots.some(
            (b) => b.hallName === hallName && b.eventSlot === form.eventSlot
        );
    };

    const slotBookedForSelectedHall = isSlotBookedForHall(form.eventSlot);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: isTablet ? vw * 3 : vw * 5, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* ── EVENT DETAILS ── */}
            <SectionHeader title={t("events.eventDetails")} icon="calendar-outline" cvw={cvw} isTablet={isTablet} />

            <FieldLabel
                icon="ribbon-outline" label={t("events.eventTitle")}
                hint={t("events.eventTitleHint")}
                cvw={cvw} isTablet={isTablet}
            />
            <StyledInput
                value={form.title}
                onChangeText={(v) => update("title", v)}
                placeholder={t("events.eventTitlePlaceholder")}
                maxLength={LIMITS.title} showCount
                cvw={cvw} isTablet={isTablet}
            />

            <FieldLabel
                icon="document-text-outline" label={t("events.notes")}
                hint={t("events.notesHint")}
                cvw={cvw} isTablet={isTablet}
            />
            <StyledInput
                value={form.notes}
                onChangeText={(v) => update("notes", v)}
                placeholder={t("events.notesPlaceholder")}
                multiline maxLength={LIMITS.notes} showCount
                cvw={cvw} isTablet={isTablet}
            />

            {/* ── CLIENT INFO ── */}
            <SectionHeader title={t("events.clientInformation")} icon="person-outline" cvw={cvw} isTablet={isTablet} />

            {isTablet ? (
                <View style={{ flexDirection: "row", gap: cvw * 3 }}>
                    <View style={{ flex: 1 }}>
                        <FieldLabel icon="person-circle-outline" label={t("events.clientName")} hint={t("events.clientNameHint")} cvw={cvw} isTablet={isTablet} />
                        <StyledInput value={form.clientName} onChangeText={(v) => update("clientName", v)} placeholder={t("events.clientNamePlaceholder")} maxLength={LIMITS.clientName} showCount cvw={cvw} isTablet={isTablet} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FieldLabel icon="call-outline" label={t("events.contactNumber")} hint={t("events.contactNumberHint")} cvw={cvw} isTablet={isTablet} />
                        <StyledInput value={form.clientContact} onChangeText={(v) => update("clientContact", v)} placeholder="e.g. 9876543210" keyboardType="phone-pad" isPhone cvw={cvw} isTablet={isTablet} />
                    </View>
                </View>
            ) : (
                <>
                    <FieldLabel icon="person-circle-outline" label={t("events.clientName")} hint={t("events.clientNameHint")} cvw={cvw} isTablet={isTablet} />
                    <StyledInput value={form.clientName} onChangeText={(v) => update("clientName", v)} placeholder={t("events.clientNamePlaceholder")} maxLength={LIMITS.clientName} showCount cvw={cvw} isTablet={isTablet} />
                    <FieldLabel icon="call-outline" label={t("events.contactNumber")} hint={t("events.contactNumberHint")} cvw={cvw} isTablet={isTablet} />
                    <StyledInput value={form.clientContact} onChangeText={(v) => update("clientContact", v)} placeholder="e.g. 9876543210" keyboardType="phone-pad" isPhone cvw={cvw} isTablet={isTablet} />
                </>
            )}

            {/* ── BOOKING OPTIONS ── */}
            <SectionHeader title={t("events.bookingOptions")} icon="options-outline" cvw={cvw} isTablet={isTablet} />

            {/* ── SLOT PICKER ── */}
            <FieldLabel
                icon="time-outline" label={t("events.eventSlot")}
                hint={t("events.eventSlotHint")}
                cvw={cvw} isTablet={isTablet}
            />
            <View style={{ flexDirection: "row", gap: cvw * 3, marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                {["lunch", "dinner"].map((slot) => {
                    // Disabled if: this slot is in bookedSlots (old logic — slot booked regardless of hall)
                    // AND we are not currently editing that very slot
                    const globallyBooked = bookedSlots.includes(slot) && (!isEdit || form.eventSlot !== slot);
                    const isActive = form.eventSlot === slot;
                    const isDisabled = globallyBooked;

                    return (
                        <TouchableOpacity
                            key={slot}
                            disabled={isDisabled}
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
                                opacity: isDisabled ? 0.35 : 1,
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
                                    {t(`events.${slot}`)}
                                </Text>
                                {isDisabled && (
                                    <Text style={{ fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, color: C.red, marginTop: 1 }}>
                                        {t("events.alreadyBooked")}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── STATUS PICKER ── */}
            <FieldLabel
                icon="flag-outline" label={t("events.bookingStatus")}
                hint={t("events.bookingStatusHint")}
                cvw={cvw} isTablet={isTablet}
            />

            {/* Warning when selected hall+slot is already booked — in_talks not allowed */}
            {slotBookedForSelectedHall && !isEdit && (
                <View style={{
                    flexDirection: "row", alignItems: "flex-start", gap: 8,
                    backgroundColor: "rgba(249,115,22,0.1)",
                    borderWidth: 1, borderColor: "rgba(249,115,22,0.4)",
                    borderRadius: 10, padding: 10, marginBottom: isTablet ? cvw * 1.5 : cvw * 3,
                }}>
                    <Ionicons name="warning-outline" size={isTablet ? cvw * 2.2 : 16} color={C.orange} style={{ marginTop: 1 }} />
                    <Text style={{ color: C.orange, fontSize: isTablet ? cvw * 2 : cvw * 3.2, flex: 1, lineHeight: 18 }}>
                        {t("events.slotConfirmedFor")} <Text style={{ fontWeight: "700" }}>{form.hallName}</Text>. {t("events.onlyInTalksAllowed")}
                    </Text>
                </View>
            )}

            <View style={{ flexDirection: "row", gap: cvw * 3, marginBottom: isTablet ? cvw * 2 : cvw * 5 }}>
                {["booked", "in_talks"].map((s) => {
                    const isActive = form.status === s;
                    const meta = STATUS_META[s];
                    // Disable "booked" option if the selected hall+slot is already booked
                    const isDisabled = s === "booked" && slotBookedForSelectedHall && !isEdit;

                    return (
                        <TouchableOpacity
                            key={s}
                            disabled={isDisabled}
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
                                opacity: isDisabled ? 0.35 : 1,
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
                            <View style={{ alignItems: "center" }}>
                                <Text style={{
                                    color: isActive ? meta.color : C.muted,
                                    fontWeight: "700",
                                    fontSize: isTablet ? cvw * 2.4 : cvw * 3.8,
                                    textTransform: "capitalize",
                                }}>
                                    {t(`events.${s === "in_talks" ? "inTalks" : s}`)}
                                </Text>
                                {isDisabled && (
                                    <Text style={{ fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, color: C.red, marginTop: 1 }}>
                                        {t("events.slotConfirmed")}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── HALL PICKER ── */}
            {halls.length > 0 && (
                <>
                    <FieldLabel
                        icon="business-outline" label={t("events.hall")}
                        hint={t("events.hallHint")}
                        optional cvw={cvw} isTablet={isTablet}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ marginBottom: isTablet ? cvw * 2 : cvw * 5 }}
                    >
                        {/* None chip */}
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
                                {t("events.none")}
                            </Text>
                        </TouchableOpacity>

                        {halls.map((hall) => {
                            const hallName = hall.name ?? hall;
                            const isActive = form.hallName === hallName;
                            const isHallBooked = isHallBookedForSlot(hallName);
                            // Only disable if editing is not for this hall's existing event
                            const isDisabled = isHallBooked && !isActive;

                            return (
                                <TouchableOpacity
                                    key={hall.id ?? hallName}
                                    disabled={isDisabled}
                                    onPress={() => update("hallName", hallName)}
                                    style={{
                                        paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
                                        paddingVertical: isTablet ? cvw * 1 : cvw * 2.5,
                                        borderRadius: 20, marginRight: 8,
                                        backgroundColor: isActive ? C.gold : C.inputBg,
                                        borderWidth: 1,
                                        borderColor: isActive ? C.gold : isHallBooked ? "rgba(229,115,115,0.4)" : C.border,
                                        opacity: isDisabled ? 0.4 : 1,
                                        flexDirection: "row", alignItems: "center", gap: 5,
                                    }}
                                >
                                    {isActive && (
                                        <Ionicons name="checkmark" size={isTablet ? cvw * 2 : cvw * 3.5} color="#000" />
                                    )}
                                    {isHallBooked && !isActive && (
                                        <Ionicons name="lock-closed-outline" size={isTablet ? cvw * 2 : cvw * 3.5} color={C.red} />
                                    )}
                                    <View>
                                        <Text style={{
                                            color: isActive ? "#000" : isHallBooked ? C.red : C.muted,
                                            fontWeight: isActive ? "700" : "500",
                                            fontSize: isTablet ? cvw * 2.2 : cvw * 3.5,
                                        }}>
                                            {hallName}
                                        </Text>
                                        {isHallBooked && !isActive && (
                                            <Text style={{ fontSize: isTablet ? cvw * 1.6 : cvw * 2.6, color: C.red }}>
                                                Booked
                                            </Text>
                                        )}
                                    </View>
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
                    {loading ? t("events.savingBtn") : isEdit ? t("events.saveChangesBtn") : t("events.createEventBtn")}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EventFormScreen() {
    const { t } = useTranslation();
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
        bookedHallSlots = [],   // [{ hallName, eventSlot }] where status === "booked"
        preselectedHall = null,
    } = route.params;

    const isEdit = mode === "edit";

    // Default slot: skip booked ones
    const defaultSlot = (() => {
        if (event?.eventSlot) return event.eventSlot;
        if (!bookedSlots.includes("lunch")) return "lunch";
        if (!bookedSlots.includes("dinner")) return "dinner";
        return "lunch";
    })();

    // Default status: if preselectedHall+defaultSlot is booked → force in_talks
    const defaultStatus = (() => {
        if (event?.status) return event.status;
        if (
            preselectedHall &&
            bookedHallSlots.some(
                (b) => b.hallName === preselectedHall && b.eventSlot === defaultSlot
            )
        ) return "in_talks";
        return "booked";
    })();

    const [form, setForm] = useState({
        title: event?.title || "",
        clientName: event?.clientName || "",
        clientContact: event?.clientContact || "",
        notes: event?.notes || "",
        eventSlot: defaultSlot,
        status: event?.status || defaultStatus,
        hallName: event?.hallName || preselectedHall || "",
    });

    const [loading, setLoading] = useState(false);
    const update = (key, value) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };

            // When hall changes, auto-adjust status if the new hall+slot is already booked
            if (key === "hallName" || key === "eventSlot") {
                const targetHall = key === "hallName" ? value : prev.hallName;
                const targetSlot = key === "eventSlot" ? value : prev.eventSlot;
                const nowBooked = bookedHallSlots.some(
                    (b) => b.hallName === targetHall && b.eventSlot === targetSlot
                );
                if (nowBooked && next.status === "booked") {
                    next.status = "in_talks";
                }
            }

            return next;
        });
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) { Alert.alert(t("events.validation"), t("events.eventTitleRequired")); return; }
        if (form.title.trim().length < 3) { Alert.alert(t("events.validation"), t("events.eventTitleMin")); return; }
        if (!form.clientName.trim()) { Alert.alert(t("events.validation"), t("events.clientNameRequired")); return; }
        if (form.clientName.trim().length < 2) { Alert.alert(t("events.validation"), t("events.clientNameMin")); return; }
        if (form.clientContact && form.clientContact.length !== 10) { Alert.alert(t("events.validation"), t("events.contactNumberLen")); return; }

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
        borderRadius: 24, borderWidth: 1,
        borderColor: C.borderGold,
        flex: 1, overflow: "hidden",
    };

    const formBodyProps = {
        form, update, loading, isEdit, halls, bookedSlots,
        bookedHallSlots, handleSubmit, vw, cvw, isTablet,
    };

    const headerProps = { navigation, isEdit, dateLabel, cvw, isTablet };

    if (!isTablet) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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