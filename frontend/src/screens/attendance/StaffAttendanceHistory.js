import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  goldDim: "#7A5E10",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#202020",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#666",
  faint: "#333",
  green: "#5DBE8A",
  greenBg: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.35)",
  orange: "#F97316",
  orangeBg: "rgba(249,115,22,0.12)",
  orangeBorder: "rgba(249,115,22,0.35)",
  red: "#E57373",
  redBg: "rgba(229,115,115,0.10)",
  redBorder: "rgba(229,115,115,0.35)",
  blue: "#60A5FA",
  blueBg: "rgba(96,165,250,0.12)",
  blueBorder: "rgba(96,165,250,0.35)",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function calcDuration(checkIn, checkOut) {
  if (!checkIn) return "--";
  const start = new Date(checkIn);
  const end = checkOut ? new Date(checkOut) : new Date();
  const ms = end - start;
  if (ms <= 0) return "--";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ✅ Returns true if a photo URL's attendance date is older than 15 days
function isPhotoExpired(attendanceDateStr) {
  if (!attendanceDateStr) return false;
  const attendanceDate = new Date(attendanceDateStr + "T00:00:00");
  const now = new Date();
  const diffMs = now - attendanceDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 15;
}

function getStatusMeta(record) {
  if (!record) return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
  if (record.isAbsent) return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
  if (record.checkOutTime) return { label: record.isLate ? "Late • Done" : "Completed", color: C.green, bg: C.greenBg, border: C.greenBorder, dot: "#22c55e" };
  if (record.checkInTime && record.isLate) return { label: "Late", color: C.orange, bg: C.orangeBg, border: C.orangeBorder, dot: "#f97316" };
  if (record.checkInTime) return { label: "Present", color: C.goldLight, bg: "rgba(201,162,39,0.12)", border: C.borderGold, dot: C.gold };
  return { label: "Absent", color: C.red, bg: C.redBg, border: C.redBorder, dot: "#ef4444" };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StaffAttendanceHistory() {
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [calendarMarked, setCalendarMarked] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [photoModal, setPhotoModal] = useState(null); // { uri, label, attendanceDate }
  const [photoLoadError, setPhotoLoadError] = useState(false); // ✅ tracks if modal image failed to load
  const [summaryStats, setSummaryStats] = useState({ daysWorked: 0, lateDays: 0, absents: 0, avgHours: "--" });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ─── Fetch own attendance for a given month ───────────────────────────────
  const loadRecords = useCallback(async (yearMonth) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance/my-history?month=${yearMonth}`);
      const data = res.data;

      setRecords(data);

      const marked = {};
      let worked = 0, late = 0, absent = 0, totalMs = 0, countedDays = 0;

      data.forEach((r) => {
        const meta = getStatusMeta(r);
        marked[r.attendanceDate] = { marked: true, dotColor: meta.dot };
        if (r.isAbsent) { absent++; return; }
        if (r.checkInTime) {
          worked++;
          if (r.isLate) late++;
          if (r.checkOutTime) {
            totalMs += new Date(r.checkOutTime) - new Date(r.checkInTime);
            countedDays++;
          }
        }
      });

      const avgMs = countedDays > 0 ? totalMs / countedDays : 0;
      const avgH = Math.floor(avgMs / 3600000);
      const avgM = Math.floor((avgMs % 3600000) / 60000);

      setSummaryStats({
        daysWorked: worked,
        lateDays: late,
        absents: absent,
        avgHours: countedDays > 0 ? `${avgH}h ${avgM}m` : "--",
      });
      setCalendarMarked(marked);
    } catch (err) {
      console.log("Attendance history error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadRecords(currentMonth); }, [currentMonth]);

  const onMonthChange = (month) => {
    const ym = `${month.year}-${String(month.month).padStart(2, "0")}`;
    setCurrentMonth(ym);
    setSelectedDate(null);
  };

  const onDayPress = (day) => {
    const date = day.dateString;
    if (selectedDate === date) { setSelectedDate(null); setSelectedRecord(null); return; }
    setSelectedDate(date);
    const rec = records.find((r) => r.attendanceDate === date) || null;
    setSelectedRecord(rec);
  };

  // ✅ Reset error state when photo modal opens/closes
  const openPhotoModal = (uri, label, attendanceDate) => {
    setPhotoLoadError(false);
    setPhotoModal({ uri, label, attendanceDate });
  };

  const closePhotoModal = () => {
    setPhotoModal(null);
    setPhotoLoadError(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: cvw * 3.5, letterSpacing: 1.5 }}>LOADING</Text>
      </SafeAreaView>
    );
  }

  const markedWithSelected = {
    ...calendarMarked,
    ...(selectedDate && {
      [selectedDate]: {
        ...(calendarMarked[selectedDate] || {}),
        selected: true,
        selectedColor: C.gold,
      },
    }),
  };

  const tiles = [
    { label: "Days Worked", value: summaryStats.daysWorked, icon: "checkmark-circle-outline", color: C.green },
    { label: "Late Days", value: summaryStats.lateDays, icon: "time-outline", color: C.orange },
    { label: "Absents", value: summaryStats.absents, icon: "close-circle-outline", color: C.red },
    { label: "Avg Hours", value: summaryStats.avgHours, icon: "timer-outline", color: C.goldLight },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: isTablet ? vw * 5 : vw * 4,
            paddingTop: vh * 4,
            paddingBottom: vh * 6,
          }}
        >
          {/* ── HEADER ── */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: vh * 3 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={{
                width: cvw * 10, height: cvw * 10, borderRadius: cvw * 5,
                backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
                alignItems: "center", justifyContent: "center", marginRight: 14,
              }}
            >
              <Ionicons name="arrow-back" size={isTablet ? cvw * 2.2 : 18} color={C.white} />
            </TouchableOpacity>
            <View>
              <Text style={{ color: C.gold, fontSize: cvw * 2.2, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase" }}>
                Staff Portal
              </Text>
              <Text style={{ color: C.white, fontSize: isTablet ? cvw * 4 : cvw * 5.5, fontWeight: "800", letterSpacing: -0.5 }}>
                My Attendance
              </Text>
            </View>
          </View>

          {/* ── SUMMARY TILES ── */}
          <View style={{
            flexDirection: "row", flexWrap: "wrap",
            gap: isTablet ? vw * 1.5 : vw * 3,
            marginBottom: vh * 2.5,
          }}>
            {tiles.map((t) => (
              <View key={t.label} style={{
                backgroundColor: C.card,
                borderRadius: 18, borderWidth: 1, borderColor: C.border,
                padding: isTablet ? cvw * 2 : cvw * 4,
                width: isTablet ? `${(100 - 4.5) / 4}%` : "47%",
                flexGrow: isTablet ? 1 : 0,
              }}>
                <View style={{
                  width: isTablet ? cvw * 4 : cvw * 8,
                  height: isTablet ? cvw * 4 : cvw * 8,
                  borderRadius: cvw * 4,
                  backgroundColor: t.color + "20",
                  alignItems: "center", justifyContent: "center", marginBottom: 8,
                }}>
                  <Ionicons name={t.icon} size={isTablet ? cvw * 2.2 : cvw * 4} color={t.color} />
                </View>
                <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8, marginBottom: 3 }}>{t.label}</Text>
                <Text style={{ color: t.color, fontSize: isTablet ? cvw * 3.5 : cvw * 6, fontWeight: "800" }}>{t.value}</Text>
              </View>
            ))}
          </View>

          {/* ── CALENDAR ── */}
          <SectionLabel title="Attendance Calendar" icon="calendar-outline" cvw={cvw} isTablet={isTablet} />
          <View style={{
            backgroundColor: C.card, borderRadius: 20,
            borderWidth: 1, borderColor: C.border,
            overflow: "hidden", marginBottom: vh * 2.5,
          }}>
            <Calendar
              current={`${currentMonth}-01`}
              markedDates={markedWithSelected}
              onDayPress={onDayPress}
              onMonthChange={onMonthChange}
              theme={{
                calendarBackground: C.card,
                dayTextColor: C.white,
                textDisabledColor: "rgba(255,255,255,0.2)",
                monthTextColor: C.gold,
                todayTextColor: C.goldLight,
                arrowColor: C.gold,
                selectedDayBackgroundColor: C.gold,
                selectedDayTextColor: "#000",
                dotColor: C.gold,
                textSectionTitleColor: C.muted,
              }}
            />
            <View style={{
              flexDirection: "row", flexWrap: "wrap",
              gap: isTablet ? cvw * 2 : cvw * 4,
              paddingHorizontal: isTablet ? cvw * 2.5 : cvw * 5,
              paddingBottom: cvw * 4, paddingTop: 4,
            }}>
              {[
                { label: "Present", color: C.gold },
                { label: "Late", color: "#f97316" },
                { label: "Completed", color: "#22c55e" },
                { label: "Absent", color: "#ef4444" },
              ].map((l) => (
                <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
                  <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── SELECTED DAY DETAIL ── */}
          {selectedDate && (
            <>
              <SectionLabel title={fmtDate(selectedDate)} icon="today-outline" cvw={cvw} isTablet={isTablet} />
              {selectedRecord ? (
                <DayDetailCard
                  record={selectedRecord}
                  onPhotoPress={openPhotoModal}
                  onClear={() => { setSelectedDate(null); setSelectedRecord(null); }}
                  cvw={cvw} vh={vh} vw={vw} isTablet={isTablet}
                />
              ) : (
                <View style={{
                  backgroundColor: C.card, borderRadius: 20,
                  borderWidth: 1, borderColor: C.border,
                  alignItems: "center", justifyContent: "center",
                  paddingVertical: vh * 5, marginBottom: vh * 2.5,
                }}>
                  <Ionicons name="calendar-clear-outline" size={cvw * 10} color={C.faint} />
                  <Text style={{ color: C.muted, marginTop: 12, fontSize: cvw * 3.5, fontWeight: "600" }}>No attendance record</Text>
                  <Text style={{ color: C.faint, marginTop: 4, fontSize: cvw * 3 }}>{selectedDate}</Text>
                  <TouchableOpacity
                    onPress={() => { setSelectedDate(null); setSelectedRecord(null); }}
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border }}
                  >
                    <Text style={{ color: C.muted, fontSize: cvw * 3 }}>Clear selection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── RECORDS LIST ── */}
          <SectionLabel title="This Month's Records" icon="list-outline" cvw={cvw} isTablet={isTablet} />
          {records.length === 0 ? (
            <View style={{
              backgroundColor: C.card, borderRadius: 20,
              borderWidth: 1, borderColor: C.border,
              alignItems: "center", paddingVertical: vh * 5,
            }}>
              <Ionicons name="document-outline" size={cvw * 10} color={C.faint} />
              <Text style={{ color: C.muted, marginTop: 12, fontSize: cvw * 3.5 }}>No records this month</Text>
            </View>
          ) : (
            [...records]
              .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
              .map((r) => (
                <RecordRow
                  key={r.attendanceDate}
                  record={r}
                  isSelected={selectedDate === r.attendanceDate}
                  onPress={() => {
                    if (selectedDate === r.attendanceDate) { setSelectedDate(null); setSelectedRecord(null); }
                    else { setSelectedDate(r.attendanceDate); setSelectedRecord(r); }
                  }}
                  onPhotoPress={openPhotoModal}
                  cvw={cvw} vh={vh} isTablet={isTablet}
                />
              ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── PHOTO MODAL ── */}
      <Modal
        visible={!!photoModal}
        transparent
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.95)",
          justifyContent: "center", alignItems: "center", padding: 20,
        }}>
          <View style={{
            backgroundColor: C.surface, borderRadius: 24,
            borderWidth: 1, borderColor: C.borderGold,
            padding: 18, width: "100%", maxWidth: 480,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="camera-outline" size={18} color={C.gold} />
                <Text style={{ color: C.gold, fontWeight: "700", fontSize: 14, letterSpacing: 1 }}>
                  {photoModal?.label?.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={closePhotoModal} style={{ backgroundColor: C.faint, borderRadius: 8, padding: 6 }}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* ✅ Three states:
                1. Photo expired (>15 days old) — show expiry notice without even trying to load
                2. Photo URL exists but failed to load (deleted from R2) — show expiry notice
                3. Photo loaded fine — show it */}
            {(() => {
              const expired = isPhotoExpired(photoModal?.attendanceDate);

              if (expired || photoLoadError) {
                return (
                  <View style={{
                    alignItems: "center",
                    paddingVertical: 32,
                    backgroundColor: "rgba(229,115,115,0.06)",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: C.redBorder,
                  }}>
                    <View style={{
                      width: 60, height: 60, borderRadius: 30,
                      backgroundColor: C.redBg,
                      borderWidth: 1, borderColor: C.redBorder,
                      alignItems: "center", justifyContent: "center",
                      marginBottom: 14,
                    }}>
                      <Ionicons name="trash-outline" size={26} color={C.red} />
                    </View>
                    <Text style={{ color: C.red, fontWeight: "700", fontSize: 15, marginBottom: 6 }}>
                      Photo Deleted
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 12.5, textAlign: "center", lineHeight: 18, paddingHorizontal: 16 }}>
                      Attendance photos are automatically deleted{"\n"}after 15 days to protect your storage.
                    </Text>
                    <View style={{
                      marginTop: 14,
                      flexDirection: "row", alignItems: "center", gap: 6,
                      backgroundColor: C.redBg,
                      borderWidth: 1, borderColor: C.redBorder,
                      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5,
                    }}>
                      <Ionicons name="time-outline" size={13} color={C.red} />
                      <Text style={{ color: C.red, fontSize: 12, fontWeight: "600" }}>
                        15-day retention policy
                      </Text>
                    </View>
                  </View>
                );
              }

              return photoModal?.uri ? (
                <Image
                  source={{ uri: photoModal.uri }}
                  resizeMode="contain"
                  style={{ width: "100%", height: 340, borderRadius: 16 }}
                  // ✅ If image fails to load (R2 returned 404/403), show the expiry screen
                  onError={() => setPhotoLoadError(true)}
                />
              ) : (
                <View style={{ alignItems: "center", padding: 40 }}>
                  <Ionicons name="image-outline" size={60} color={C.muted} />
                  <Text style={{ color: C.muted, marginTop: 10, textAlign: "center", fontSize: 13 }}>Photo unavailable</Text>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Day Detail Card ──────────────────────────────────────────────────────────
function DayDetailCard({ record, onPhotoPress, onClear, cvw, vh, vw, isTablet }) {
  const meta = getStatusMeta(record);
  const duration = calcDuration(record.checkInTime, record.checkOutTime);
  const photoExpired = isPhotoExpired(record.attendanceDate);

  return (
    <View style={{
      backgroundColor: C.card, borderRadius: 20,
      borderWidth: 1, borderColor: meta.border,
      padding: isTablet ? cvw * 2.5 : cvw * 5,
      marginBottom: vh * 2.5,
    }}>
      {/* Top row: status + clear */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vh * 2 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: meta.bg, borderWidth: 1, borderColor: meta.border,
          borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color }} />
          <Text style={{ color: meta.color, fontWeight: "800", fontSize: cvw * 3, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {meta.label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClear}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.faint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Ionicons name="close" size={14} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: cvw * 2.8 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Flags */}
      {(record.isLate || record.isHalfDay) && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: vh * 1.5 }}>
          {record.isLate && (
            <View style={{
              backgroundColor: C.orangeBg, borderWidth: 1, borderColor: C.orangeBorder,
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              flexDirection: "row", alignItems: "center", gap: 5,
            }}>
              <Ionicons name="alert-circle-outline" size={13} color={C.orange} />
              <Text style={{ color: C.orange, fontWeight: "700", fontSize: cvw * 2.6 }}>LATE ARRIVAL</Text>
            </View>
          )}
          {record.isHalfDay && (
            <View style={{
              backgroundColor: C.blueBg, borderWidth: 1, borderColor: C.blueBorder,
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              flexDirection: "row", alignItems: "center", gap: 5,
            }}>
              <Ionicons name="partly-sunny-outline" size={13} color={C.blue} />
              <Text style={{ color: C.blue, fontWeight: "700", fontSize: cvw * 2.6 }}>HALF DAY</Text>
            </View>
          )}
        </View>
      )}

      {/* ✅ Photo expiry notice inside day detail card */}
      {photoExpired && (record.checkInPhoto || record.checkOutPhoto) && (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: "rgba(229,115,115,0.06)",
          borderWidth: 1, borderColor: C.redBorder,
          borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
          marginBottom: vh * 1.5,
        }}>
          <Ionicons name="information-circle-outline" size={15} color={C.red} />
          <Text style={{ color: C.red, fontSize: cvw * 2.8, flex: 1 }}>
            Attendance photos for this day have been deleted (15-day retention policy)
          </Text>
        </View>
      )}

      {/* Time blocks */}
      <View style={{ flexDirection: isTablet ? "row" : "column", gap: isTablet ? vw * 2 : vh * 1.5, marginBottom: vh * 2 }}>
        <TimeBlock
          label="Check In"
          time={fmtTime(record.checkInTime)}
          icon="log-in-outline"
          color={C.green}
          bg={C.greenBg}
          border={C.greenBorder}
          photo={record.checkInPhoto}
          photoExpired={photoExpired}
          lat={record.checkInLat}
          lng={record.checkInLng}
          onPhotoPress={() => onPhotoPress(record.checkInPhoto, "Check In Photo", record.attendanceDate)}
          cvw={cvw} vh={vh} isTablet={isTablet}
        />
        <TimeBlock
          label="Check Out"
          time={fmtTime(record.checkOutTime)}
          icon="log-out-outline"
          color={C.red}
          bg={C.redBg}
          border={C.redBorder}
          photo={record.checkOutPhoto}
          photoExpired={photoExpired}
          lat={record.checkOutLat}
          lng={record.checkOutLng}
          onPhotoPress={() => onPhotoPress(record.checkOutPhoto, "Check Out Photo", record.attendanceDate)}
          cvw={cvw} vh={vh} isTablet={isTablet}
        />
      </View>

      {/* Duration bar */}
      <View style={{
        backgroundColor: C.surface, borderRadius: 14,
        borderWidth: 1, borderColor: C.border,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: cvw * 4, paddingVertical: vh * 1.4,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{
            width: cvw * 7, height: cvw * 7, borderRadius: cvw * 3.5,
            backgroundColor: "rgba(201,162,39,0.15)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="timer-outline" size={cvw * 3.5} color={C.gold} />
          </View>
          <Text style={{ color: C.muted, fontSize: cvw * 3, fontWeight: "600" }}>Total Working Hours</Text>
        </View>
        <Text style={{ color: C.gold, fontWeight: "800", fontSize: cvw * 4.5 }}>{duration}</Text>
      </View>
    </View>
  );
}

// ─── Time Block ───────────────────────────────────────────────────────────────
function TimeBlock({ label, time, icon, color, bg, border, photo, photoExpired, lat, lng, onPhotoPress, cvw, vh, isTablet }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: isTablet ? cvw * 2 : cvw * 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: vh * 1 }}>
        <Ionicons name={icon} size={isTablet ? cvw * 2 : cvw * 4} color={color} />
        <Text style={{ color, fontWeight: "700", fontSize: isTablet ? cvw * 2 : cvw * 3.2, letterSpacing: 1, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>

      <Text style={{
        color: time === "--" ? C.muted : C.white,
        fontSize: isTablet ? cvw * 4 : cvw * 7,
        fontWeight: "800", letterSpacing: -1, marginBottom: vh * 1,
      }}>
        {time}
      </Text>

      {lat && lng ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: vh * 1 }}>
          <Ionicons name="location-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8 }}>
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: vh * 1 }}>
          <Ionicons name="location-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.faint} />
          <Text style={{ color: C.faint, fontSize: isTablet ? cvw * 1.8 : cvw * 2.8 }}>Location unavailable</Text>
        </View>
      )}

      {/* ✅ Photo button — shows "Expired" state if > 15 days, otherwise normal */}
      {photo ? (
        photoExpired ? (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: C.redBg,
            borderWidth: 1, borderColor: C.redBorder,
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
            alignSelf: "flex-start",
          }}>
            <Ionicons name="trash-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.red} />
            <Text style={{ color: C.red, fontWeight: "600", fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>Photo Deleted</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onPhotoPress}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: "rgba(0,0,0,0.3)",
              borderWidth: 1, borderColor: border,
              borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name="camera-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={color} />
            <Text style={{ color, fontWeight: "600", fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>View Photo</Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 6,
          backgroundColor: "rgba(0,0,0,0.2)",
          borderWidth: 1, borderColor: C.border,
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
          alignSelf: "flex-start", opacity: 0.5,
        }}>
          <Ionicons name="camera-off-outline" size={isTablet ? cvw * 1.8 : cvw * 3.5} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>No photo</Text>
        </View>
      )}
    </View>
  );
}

// ─── Record Row ───────────────────────────────────────────────────────────────
function RecordRow({ record, isSelected, onPress, onPhotoPress, cvw, vh, isTablet }) {
  const meta = getStatusMeta(record);
  const duration = calcDuration(record.checkInTime, record.checkOutTime);
  const photoExpired = isPhotoExpired(record.attendanceDate);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: isSelected ? C.surface : C.card,
        borderRadius: 16, borderWidth: 1,
        borderColor: isSelected ? C.borderGold : C.border,
        padding: isTablet ? cvw * 2 : cvw * 4,
        marginBottom: vh * 1.2,
        flexDirection: "row", alignItems: "center", gap: cvw * 3,
      }}
    >
      {/* Date circle */}
      <View style={{
        width: isTablet ? cvw * 7 : cvw * 13,
        height: isTablet ? cvw * 7 : cvw * 13,
        borderRadius: cvw * 7,
        backgroundColor: meta.bg, borderWidth: 1, borderColor: meta.border,
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Text style={{ color: meta.color, fontWeight: "800", fontSize: isTablet ? cvw * 2.2 : cvw * 4 }}>
          {record.attendanceDate?.split("-")[2]}
        </Text>
        <Text style={{ color: meta.color, fontSize: isTablet ? cvw * 1.4 : cvw * 2.4, fontWeight: "600", opacity: 0.7 }}>
          {new Date(record.attendanceDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" })}
        </Text>
      </View>

      {/* Middle */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <View style={{
            backgroundColor: meta.bg, borderWidth: 1, borderColor: meta.border,
            borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ color: meta.color, fontWeight: "700", fontSize: isTablet ? cvw * 1.6 : cvw * 2.6, letterSpacing: 1 }}>
              {meta.label.toUpperCase()}
            </Text>
          </View>
          {record.isHalfDay && (
            <View style={{
              backgroundColor: C.blueBg, borderWidth: 1, borderColor: C.blueBorder,
              borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
            }}>
              <Text style={{ color: C.blue, fontWeight: "700", fontSize: isTablet ? cvw * 1.6 : cvw * 2.6 }}>HALF</Text>
            </View>
          )}
          {/* ✅ Show a small "Photo deleted" pill on rows older than 15 days */}
          {photoExpired && (record.checkInPhoto || record.checkOutPhoto) && (
            <View style={{
              backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBorder,
              borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
              flexDirection: "row", alignItems: "center", gap: 3,
            }}>
              <Ionicons name="trash-outline" size={10} color={C.red} />
              <Text style={{ color: C.red, fontWeight: "600", fontSize: isTablet ? cvw * 1.4 : cvw * 2.4 }}>Photos deleted</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="log-in-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.green} />
            <Text style={{ color: record.checkInTime ? C.white : C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, fontWeight: "600" }}>
              {fmtTime(record.checkInTime)}
            </Text>
          </View>
          <Text style={{ color: C.faint, fontSize: cvw * 3 }}>→</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="log-out-outline" size={isTablet ? cvw * 1.8 : cvw * 3} color={C.red} />
            <Text style={{ color: record.checkOutTime ? C.white : C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3, fontWeight: "600" }}>
              {fmtTime(record.checkOutTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: duration + photo icons */}
      <View style={{ alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <Text style={{ color: C.gold, fontWeight: "800", fontSize: isTablet ? cvw * 2.2 : cvw * 3.8 }}>{duration}</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {/* ✅ Photo icons: show trash icon if expired, camera icon if not */}
          {record.checkInPhoto && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onPhotoPress(record.checkInPhoto, "Check In Photo", record.attendanceDate); }}
              style={{
                width: isTablet ? cvw * 3.5 : cvw * 7,
                height: isTablet ? cvw * 3.5 : cvw * 7,
                borderRadius: 8,
                backgroundColor: photoExpired ? C.redBg : C.greenBg,
                borderWidth: 1,
                borderColor: photoExpired ? C.redBorder : C.greenBorder,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons
                name={photoExpired ? "trash-outline" : "image-outline"}
                size={isTablet ? cvw * 1.8 : cvw * 3.5}
                color={photoExpired ? C.red : C.green}
              />
            </TouchableOpacity>
          )}
          {record.checkOutPhoto && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onPhotoPress(record.checkOutPhoto, "Check Out Photo", record.attendanceDate); }}
              style={{
                width: isTablet ? cvw * 3.5 : cvw * 7,
                height: isTablet ? cvw * 3.5 : cvw * 7,
                borderRadius: 8,
                backgroundColor: photoExpired ? C.redBg : C.redBg,
                borderWidth: 1,
                borderColor: photoExpired ? C.redBorder : C.redBorder,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons
                name={photoExpired ? "trash-outline" : "image-outline"}
                size={isTablet ? cvw * 1.8 : cvw * 3.5}
                color={C.red}
              />
            </TouchableOpacity>
          )}
        </View>
        <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={isTablet ? cvw * 2 : cvw * 3.5} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ title, icon, cvw, isTablet }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: isTablet ? cvw * 1.5 : cvw * 3 }}>
      <Ionicons name={icon} size={isTablet ? cvw * 2.2 : cvw * 4} color={C.gold} />
      <Text style={{ color: C.white, fontSize: isTablet ? cvw * 2.4 : cvw * 4, fontWeight: "800", letterSpacing: 0.2 }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}