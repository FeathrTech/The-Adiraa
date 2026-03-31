import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Switch,
    ScrollView
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../../api/axios";

export default function EditAttendanceRecordScreen() {

    const navigation = useNavigation();
    const route = useRoute();

    const { attendanceId } = route.params;

    const { width, height } = useWindowDimensions();
    const vw = width / 100;
    const vh = height / 100;

    const GOLD = "#C9A227";
    const DARK = "#111";

    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [staff, setStaff] = useState(null);

    const [checkInTime, setCheckInTime] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("");

    const [markAbsent, setMarkAbsent] = useState(false);

    const formatISTTime = (date) => {
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    };

    const loadAttendance = async () => {
        try {

            const res = await api.get(`/attendance/${attendanceId}`);

            const data = res.data;

            setStaff(data.user);

            setCheckInTime(
                data.checkInTime ? formatISTTime(data.checkInTime) : ""
            );

            setCheckOutTime(
                data.checkOutTime ? formatISTTime(data.checkOutTime) : ""
            );

        } catch {
            Alert.alert(t("attendance.error"), t("attendance.unableToLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
    }, []);

    const handleSave = async () => {

        try {

            setSaving(true);

            if (markAbsent) {

                await api.post("/attendance/mark-absent", {
                    userId: staff.id,
                    date: new Date().toLocaleDateString("en-CA", {
                        timeZone: "Asia/Kolkata"
                    })
                });

            } else {

                await api.post("/attendance/manual-mark", {

                    userId: staff.id,
                    date: new Date().toLocaleDateString("en-CA", {
                        timeZone: "Asia/Kolkata"
                    }),

                    checkInTime: checkInTime || null,
                    checkOutTime: checkOutTime || null

                });

            }

            Alert.alert(t("attendance.success"), t("attendance.attendanceUpdated"));
            navigation.goBack();

        } catch (err) {

            Alert.alert(
                t("attendance.error"),
                err.response?.data?.message || t("attendance.updateFailed")
            );

        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: DARK }}>
                <ActivityIndicator size="large" color={GOLD} />
            </View>
        );
    }

    return (

        <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>

            <ScrollView style={{ padding: vw * 5 }}>

                <Text style={{
                    fontSize: vh * 2.5,
                    fontWeight: "600",
                    color: GOLD,
                    marginBottom: vh * 3
                }}>
                    {t("attendance.editAttendance")}
                </Text>

                {/* STAFF CARD */}

                <View style={{
                    backgroundColor: "#1B1B1B",
                    padding: vw * 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: GOLD,
                    marginBottom: vh * 2
                }}>

                    <Text style={{ color: GOLD, fontWeight: "600" }}>
                        {t("attendance.staff")}
                    </Text>

                    <Text style={{ color: "white", marginTop: 4 }}>
                        {staff?.name}
                    </Text>

                </View>


                {/* CHECK IN */}

                <View style={{
                    backgroundColor: "#1B1B1B",
                    padding: vw * 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: GOLD,
                    marginBottom: vh * 2
                }}>

                    <Text style={{ color: GOLD, marginBottom: 8 }}>
                        {t("attendance.checkInTime")}
                    </Text>

                    <TextInput
                        value={checkInTime}
                        onChangeText={setCheckInTime}
                        placeholder={t("attendance.hhmm")}
                        placeholderTextColor="#888"
                        style={{
                            backgroundColor: DARK,
                            borderRadius: 10,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: GOLD,
                            color: "white"
                        }}
                    />

                </View>


                {/* CHECK OUT */}

                <View style={{
                    backgroundColor: "#1B1B1B",
                    padding: vw * 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: GOLD,
                    marginBottom: vh * 2
                }}>

                    <Text style={{ color: GOLD, marginBottom: 8 }}>
                        {t("attendance.checkOutTime")}
                    </Text>

                    <TextInput
                        value={checkOutTime}
                        onChangeText={setCheckOutTime}
                        placeholder={t("attendance.hhmm")}
                        placeholderTextColor="#888"
                        style={{
                            backgroundColor: DARK,
                            borderRadius: 10,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: GOLD,
                            color: "white"
                        }}
                    />

                </View>


                {/* ABSENT SWITCH */}

                <View style={{
                    backgroundColor: "#1B1B1B",
                    padding: vw * 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: GOLD,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: vh * 3
                }}>

                    <Text style={{ color: "white", fontWeight: "500" }}>
                        {t("attendance.markAbsent")}
                    </Text>

                    <Switch
                        value={markAbsent}
                        onValueChange={setMarkAbsent}
                        trackColor={{ false: "#444", true: GOLD }}
                    />

                </View>


                {/* SAVE BUTTON */}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                        backgroundColor: GOLD,
                        paddingVertical: vh * 1.8,
                        borderRadius: 16,
                        alignItems: "center"
                    }}
                >

                    {saving ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={{
                            color: "#000",
                            fontWeight: "600",
                            fontSize: vh * 1.8
                        }}>
                            {t("attendance.saveChanges")}
                        </Text>
                    )}

                </TouchableOpacity>

            </ScrollView>

        </SafeAreaView>

    );
}