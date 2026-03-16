import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
    StatusBar,
    Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { getCalendarSummary, getEventsByDate } from "../../api/eventsApi";
import { fetchSites, fetchSiteById } from "../../api/siteApi";

import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { deleteEvent } from "../../api/eventsApi";

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
};

// ─── Status colours ───────────────────────────────────────────────────────────
const DOT = {
    booked: "#E57373",
    in_talks: "#E8C34A",
    available: "#5DBE8A",
};

const STATUS_BADGE = {
    booked: { bg: "rgba(229,115,115,0.15)", text: "#E57373", border: "rgba(229,115,115,0.35)" },
    in_talks: { bg: "rgba(232,195,74,0.15)", text: "#E8C34A", border: "rgba(232,195,74,0.35)" },
    available: { bg: "rgba(93,190,138,0.15)", text: "#5DBE8A", border: "rgba(93,190,138,0.35)" },
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
export default function EventCalendarScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { width, vw, vh, cvw, isTablet } = useResponsive();

    const permissions =
        user?.roles?.flatMap((r) => r.permissions?.map((p) => p.key)) || [];
    const can = (perm) => permissions.includes(perm);

    // ─── Sites ────────────────────────────────────────────────────────────────
    const [sites, setSites] = useState([]);
    const [selectedSite, setSelectedSite] = useState(null);
    const [halls, setHalls] = useState([]);
    const [loadingSites, setLoadingSites] = useState(true);

    // ─── Calendar ─────────────────────────────────────────────────────────────
    const [calendarData, setCalendarData] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    });
    const [loadingCalendar, setLoadingCalendar] = useState(false);

    // ─── Events ───────────────────────────────────────────────────────────────
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
    });

    // ─── Build marks ──────────────────────────────────────────────────────────
    const buildMarks = (summary, selected, year, month) => {
        const marks = {};
        const daysInMonth = new Date(year, month, 0).getDate();

        const getColor = (status) => {
            if (status === "booked") return DOT.booked;
            if (status === "in_talks") return DOT.in_talks;
            return DOT.available;
        };

        for (let i = 1; i <= daysInMonth; i++) {
            const date = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
            marks[date] = {
                dots: [
                    { key: "lunch", color: getColor(summary[date]?.lunch) },
                    { key: "dinner", color: getColor(summary[date]?.dinner) },
                ],
            };
        }

        if (selected) {
            marks[selected] = {
                ...(marks[selected] || {}),
                selected: true,
                selectedColor: C.gold,
                selectedTextColor: "#000",
            };
        }

        return marks;
    };

    // ─── Loaders (unchanged logic) ────────────────────────────────────────────
    const loadCalendar = async (siteId, selected, year, month) => {
        if (!siteId) return;
        try {
            setLoadingCalendar(true);
            const summary = await getCalendarSummary({ siteId, year, month });
            setCalendarData(buildMarks(summary, selected, year, month));
        } catch (err) {
            console.log("loadCalendar error:", err);
        } finally {
            setLoadingCalendar(false);
        }
    };

    const loadEvents = async (date) => {
        if (!selectedSite?.id || !date) return;
        try {
            setLoadingEvents(true);
            const res = await getEventsByDate(date, { locationId: selectedSite.id });
            setEvents(res);
        } catch (err) {
            console.log("loadEvents error:", err);
            setEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    const loadSites = async () => {
        try {
            setLoadingSites(true);
            const data = await fetchSites();
            setSites(data);
            if (data.length > 0) setSelectedSite(data[0]);
        } catch (err) {
            console.log("Failed to load sites:", err);
        } finally {
            setLoadingSites(false);
        }
    };

    useEffect(() => { loadSites(); }, []);

    useEffect(() => {
        if (!selectedSite?.id) return;
        const loadHalls = async () => {
            try {
                const data = await fetchSiteById(selectedSite.id);
                setHalls(Array.isArray(data) ? data : data?.halls || []);
            } catch (err) {
                console.log("Failed to load halls:", err);
                setHalls([]);
            }
        };
        loadHalls();
        setSelectedDate(null);
        setEvents([]);
        loadCalendar(selectedSite.id, null, currentMonth.year, currentMonth.month);
    }, [selectedSite?.id]);

    useEffect(() => {
        if (!selectedSite?.id) return;
        loadCalendar(selectedSite.id, selectedDate, currentMonth.year, currentMonth.month);
    }, [currentMonth.year, currentMonth.month]);

    useFocusEffect(
        React.useCallback(() => {
            if (!selectedSite?.id) return;
            loadCalendar(selectedSite.id, selectedDate, currentMonth.year, currentMonth.month);
            if (selectedDate) loadEvents(selectedDate);
        }, [selectedSite?.id, selectedDate, currentMonth.year, currentMonth.month])
    );

    // ─── Handlers (unchanged) ─────────────────────────────────────────────────
    const handleDayPress = (day) => {
        const date = day.dateString;
        setSelectedDate(date);
        loadEvents(date);
        loadCalendar(selectedSite?.id, date, currentMonth.year, currentMonth.month);
    };

    const handleMonthChange = (month) => {
        const newYear = month.year;
        const newMonth = month.month;
        setCurrentMonth({ year: newYear, month: newMonth });
        loadCalendar(selectedSite?.id, selectedDate, newYear, newMonth);
    };

    // ─── Slot helpers (unchanged) ─────────────────────────────────────────────
    const lunchEvent = events.find((e) => e.eventSlot === "lunch");
    const dinnerEvent = events.find((e) => e.eventSlot === "dinner");
    const bookedSlots = events.map((e) => e.eventSlot);
    const isPast = selectedDate < today;
    const getHallName = (hallName) => hallName || null;

    const goToAddEvent = () => {
        navigation.navigate("EventForm", {
            mode: "create",
            date: selectedDate,
            locationId: selectedSite?.id,
            halls,
            bookedSlots,
        });
    };

    const goToEditEvent = (event) => {
        navigation.navigate("EventForm", {
            mode: "edit",
            event,
            date: selectedDate,
            locationId: selectedSite?.id,
            halls,
        });
    };

    // ─── Custom day cell ──────────────────────────────────────────────────────
    const DayCell = ({ date, state, marking }) => {
        const isSelected = marking?.selected;
        const isToday = date.dateString === today;
        const isDisabled = state === "disabled";
        const dots = marking?.dots?.length === 2
            ? marking.dots
            : [{ key: "lunch", color: DOT.available }, { key: "dinner", color: DOT.available }];

        return (
            <TouchableOpacity
                onPress={() => handleDayPress(date)}
                style={{ alignItems: "center", paddingVertical: 2, width: 36 }}
            >
                <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: isSelected
                        ? C.gold
                        : isToday
                            ? "rgba(201,162,39,0.15)"
                            : "transparent",
                    borderWidth: isToday && !isSelected ? 1 : 0,
                    borderColor: C.borderGold,
                }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: isToday || isSelected ? "700" : "400",
                        color: isSelected
                            ? "#000"
                            : isDisabled
                                ? C.faint
                                : isToday
                                    ? C.gold
                                    : C.white,
                    }}>
                        {date.day}
                    </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 3, height: 8 }}>
                    {dots.map((dot, i) => (
                        <View key={i} style={{
                            width: 5, height: 5, borderRadius: 3,
                            backgroundColor: isDisabled ? C.faint : dot.color,
                        }} />
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    // ─── Slot card ────────────────────────────────────────────────────────────
    const SlotCard = ({ title, slotIcon, event }) => {
        const hallName = event?.hallName ? getHallName(event.hallName) : null;
        const badge = event ? STATUS_BADGE[event.status] || STATUS_BADGE.available : null;

        return (
            <View style={{
                borderWidth: 1,
                borderColor: event ? C.borderGold : C.border,
                borderRadius: 16,
                padding: isTablet ? vw * 3 : vw * 4,
                marginBottom: 12,
                backgroundColor: C.card,
            }}>
                {/* Slot title row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View style={{
                        width: cvw * (isTablet ? 4 : 7),
                        height: cvw * (isTablet ? 4 : 7),
                        borderRadius: cvw * 4,
                        backgroundColor: "rgba(201,162,39,0.12)",
                        borderWidth: 1,
                        borderColor: C.borderGold,
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Ionicons name={slotIcon} size={cvw * (isTablet ? 2 : 3.5)} color={C.gold} />
                    </View>
                    <Text style={{
                        fontWeight: "700",
                        fontSize: isTablet ? cvw * 2.8 : cvw * 4,
                        color: C.white,
                        letterSpacing: 0.2,
                    }}>
                        {title}
                    </Text>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: C.border, marginBottom: 10 }} />

                {event ? (
                    <>
                        <Text style={{ fontSize: isTablet ? cvw * 2.6 : cvw * 3.8, fontWeight: "600", color: C.white }}>
                            {event.title}
                        </Text>
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.2, marginTop: 3 }}>
                            {event.clientName}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8, flexWrap: "wrap" }}>
                            {/* Status badge */}
                            {badge && (
                                <View style={{
                                    paddingHorizontal: 10, paddingVertical: 3,
                                    borderRadius: 20, backgroundColor: badge.bg,
                                    borderWidth: 1, borderColor: badge.border,
                                }}>
                                    <Text style={{
                                        fontSize: isTablet ? cvw * 2 : cvw * 2.8,
                                        fontWeight: "600", color: badge.text,
                                        textTransform: "capitalize",
                                    }}>
                                        {event.status.replace("_", " ")}
                                    </Text>
                                </View>
                            )}

                            {/* Hall badge */}
                            {hallName && (
                                <View style={{
                                    paddingHorizontal: 10, paddingVertical: 3,
                                    borderRadius: 20,
                                    backgroundColor: "rgba(201,162,39,0.12)",
                                    borderWidth: 1, borderColor: C.borderGold,
                                    flexDirection: "row", alignItems: "center", gap: 4,
                                }}>
                                    <Ionicons name="business-outline" size={isTablet ? cvw * 1.8 : cvw * 2.8} color={C.gold} />
                                    <Text style={{ fontSize: isTablet ? cvw * 2 : cvw * 2.8, color: C.gold, fontWeight: "600" }}>
                                        {hallName}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {event.hallNote ? (
                            <Text style={{ marginTop: 5, fontSize: isTablet ? cvw * 2 : cvw * 2.8, color: C.muted, fontStyle: "italic" }}>
                                {event.hallNote}
                            </Text>
                        ) : null}

                      

                        {can("event.edit") && !isPast && (
                            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                                <TouchableOpacity
                                    onPress={() => goToEditEvent(event)}
                                    style={{
                                        flexDirection: "row", alignItems: "center", gap: 4,
                                        backgroundColor: "rgba(201,162,39,0.1)",
                                        paddingHorizontal: 12, paddingVertical: 5,
                                        borderRadius: 8, borderWidth: 1, borderColor: C.borderGold,
                                    }}
                                >
                                    <Ionicons name="pencil-outline" size={isTablet ? cvw * 2 : 14} color={C.gold} />
                                    <Text style={{ color: C.gold, fontSize: isTablet ? cvw * 2.2 : 13, fontWeight: "600" }}>
                                        Edit
                                    </Text>
                                </TouchableOpacity>

                                {can("event.delete") && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert.alert(
                                                "Delete Event",
                                                "Are you sure you want to delete this event?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Delete",
                                                        style: "destructive",
                                                        onPress: async () => {
                                                            try {
                                                                await deleteEvent(event.id);
                                                                loadEvents(selectedDate);
                                                                loadCalendar(selectedSite?.id, selectedDate, currentMonth.year, currentMonth.month);
                                                            } catch {
                                                                Alert.alert("Error", "Failed to delete event");
                                                            }
                                                        },
                                                    },
                                                ]
                                            );
                                        }}
                                        style={{
                                            flexDirection: "row", alignItems: "center", gap: 4,
                                            backgroundColor: "rgba(229,115,115,0.1)",
                                            paddingHorizontal: 12, paddingVertical: 5,
                                            borderRadius: 8, borderWidth: 1, borderColor: "rgba(229,115,115,0.35)",
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={isTablet ? cvw * 2 : 14} color="#E57373" />
                                        <Text style={{ color: "#E57373", fontSize: isTablet ? cvw * 2.2 : 13, fontWeight: "600" }}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DOT.available }} />
                        <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2.2 : cvw * 3.2 }}>Available</Text>
                    </View>
                )}
            </View>
        );
    };

    // ─── Shared: fixed header ─────────────────────────────────────────────────
    const ScreenHeader = () => (
        <View style={{
            paddingHorizontal: vw * 5,
            paddingTop: vw * 4,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
        }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 10, borderWidth: 1, borderColor: C.borderGold,
                    }}
                >
                    <Ionicons name="chevron-back" size={isTablet ? cvw * 2.2 : 20} color={C.gold} />
                    {isTablet && (
                        <Text style={{ color: C.gold, fontWeight: "600", fontSize: cvw * 2.2 }}>Back</Text>
                    )}
                </TouchableOpacity>

                <Text style={{
                    fontSize: isTablet ? cvw * 3.2 : 20,
                    fontWeight: "800",
                    marginLeft: 12,
                    color: C.white,
                    letterSpacing: -0.3,
                }}>
                    Event Calendar
                </Text>
            </View>

            {/* Location chips */}
            {loadingSites ? (
                <ActivityIndicator style={{ marginTop: 12 }} color={C.gold} />
            ) : sites.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                    <Text style={{
                        fontSize: isTablet ? cvw * 2 : 12,
                        color: C.muted,
                        marginBottom: 8,
                        letterSpacing: 2,
                        fontWeight: "600",
                        textTransform: "uppercase",
                    }}>
                        Location
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {sites.map((site) => (
                            <TouchableOpacity
                                key={site.id}
                                onPress={() => setSelectedSite(site)}
                                style={{
                                    paddingHorizontal: 16, paddingVertical: 8,
                                    borderRadius: 20, marginRight: 8,
                                    backgroundColor: selectedSite?.id === site.id ? C.gold : C.faint,
                                    borderWidth: 1,
                                    borderColor: selectedSite?.id === site.id ? C.gold : C.border,
                                }}
                            >
                                <Text style={{
                                    color: selectedSite?.id === site.id ? "#000" : C.muted,
                                    fontWeight: selectedSite?.id === site.id ? "700" : "500",
                                    fontSize: isTablet ? cvw * 2.2 : 13,
                                }}>
                                    {site.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );

    // ─── Shared: calendar widget ──────────────────────────────────────────────
    const CalendarWidget = () => (
        loadingCalendar ? (
            <ActivityIndicator color={C.gold} style={{ marginVertical: 40 }} />
        ) : (
            <Calendar
                key={selectedSite?.id}
                markingType="multi-dot"
                markedDates={calendarData}
                current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-01`}
                onDayPress={handleDayPress}
                onMonthChange={handleMonthChange}
                disableMonthChange={false}
                enableSwipeMonths={true}
                style={{ borderRadius: 12, backgroundColor: C.surface }}
                theme={{
                    backgroundColor: C.surface,
                    calendarBackground: C.surface,
                    textSectionTitleColor: C.gold,
                    arrowColor: C.gold,
                    monthTextColor: C.white,
                    textDayFontWeight: "500",
                    dotColor: "transparent",
                    selectedDotColor: "transparent",
                }}
                dayComponent={({ date, state, marking }) => (
                    <DayCell date={date} state={state} marking={marking} />
                )}
            />
        )
    );

    // ─── Shared: legend ───────────────────────────────────────────────────────
    const Legend = () => (
        <View style={{ flexDirection: "row", gap: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 4 }}>
            {[
                { color: DOT.booked, label: "Booked" },
                { color: DOT.in_talks, label: "In Talks" },
                { color: DOT.available, label: "Available" },
            ].map(({ color, label }) => (
                <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                    <Text style={{ fontSize: isTablet ? cvw * 2 : 11, color: C.muted }}>{label}</Text>
                </View>
            ))}
        </View>
    );

    // ─── Shared: date detail panel ────────────────────────────────────────────
    const DateDetail = () => (
        selectedDate ? (
            <View style={{ marginTop: 20 }}>
                {/* Date heading */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <View style={{
                        width: 4, height: isTablet ? cvw * 4 : 28,
                        borderRadius: 2, backgroundColor: C.gold,
                    }} />
                    <Text style={{
                        fontWeight: "700",
                        fontSize: isTablet ? cvw * 2.8 : 16,
                        color: C.white,
                    }}>
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })}
                    </Text>
                </View>

                {loadingEvents ? (
                    <ActivityIndicator color={C.gold} />
                ) : (
                    <>
                        <SlotCard title="Lunch" slotIcon="restaurant-outline" event={lunchEvent} />
                        <SlotCard title="Dinner" slotIcon="moon-outline" event={dinnerEvent} />
                    </>
                )}

                {can("event.create") && selectedDate >= today && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: C.gold,
                            padding: 15, borderRadius: 14, marginTop: 6,
                            flexDirection: "row", justifyContent: "center",
                            alignItems: "center", gap: 8,
                        }}
                        onPress={goToAddEvent}
                    >
                        <Ionicons name="add-circle-outline" size={isTablet ? cvw * 2.5 : 18} color="#000" />
                        <Text style={{
                            color: "#000", fontWeight: "700",
                            fontSize: isTablet ? cvw * 2.6 : 15,
                            letterSpacing: 0.3,
                        }}>
                            Add Event
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        ) : (
            !loadingCalendar && (
                <View style={{ alignItems: "center", marginTop: 40, opacity: 0.4 }}>
                    <Ionicons name="calendar-outline" size={isTablet ? cvw * 5 : 40} color={C.muted} />
                    <Text style={{ color: C.muted, marginTop: 8, fontSize: isTablet ? cvw * 2.2 : 13 }}>
                        Tap a date to view bookings
                    </Text>
                </View>
            )
        )
    );

    // ─── PHONE layout (<768 px) ───────────────────────────────────────────────
    if (!isTablet) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="light-content" />
                <View style={{ flex: 1, margin: vw * 4, marginBottom: vw * 4 }}>
                    <View style={{
                        backgroundColor: C.surface,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: C.borderGold,
                        flex: 1,
                        overflow: "hidden",
                    }}>
                        <ScreenHeader />
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: vw * 5, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <CalendarWidget />
                            <Legend />
                            <DateDetail />
                        </ScrollView>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ─── TABLET layout (≥768 px) ──────────────────────────────────────────────
    //
    //  ┌──────────────────────────────────────────────────┐
    //  │  ← Back   Event Calendar   [Location chips]      │  fixed header
    //  ├──────────────────────┬───────────────────────────┤
    //  │                      │  Selected date heading    │
    //  │   Calendar           │  Lunch card               │
    //  │                      │  Dinner card              │
    //  │   Legend             │  Add Event button         │
    //  └──────────────────────┴───────────────────────────┘
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, margin: vw * 3, marginBottom: vw * 3 }}>
                <View style={{
                    backgroundColor: C.surface,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: C.borderGold,
                    flex: 1,
                    overflow: "hidden",
                }}>
                    <ScreenHeader />

                    {/* Two-column body */}
                    <View style={{ flex: 1, flexDirection: "row" }}>

                        {/* LEFT — calendar */}
                        <View style={{
                            flex: 1,
                            borderRightWidth: 1,
                            borderRightColor: C.border,
                            padding: vw * 2.5,
                        }}>
                            <CalendarWidget />
                            <Legend />
                        </View>

                        {/* RIGHT — date detail */}
                        <View style={{ flex: 1 }}>
                            <ScrollView
                                contentContainerStyle={{ padding: vw * 2.5, paddingBottom: 40 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <DateDetail />
                            </ScrollView>
                        </View>

                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}