import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  StatusBar,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState, useCallback } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";
import api from "../../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldDim: "rgba(201,162,39,0.15)",
  goldDimMed: "rgba(201,162,39,0.08)",
  borderGold: "rgba(201,162,39,0.4)",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  border: "#2A2A2A",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#222",
  green: "#5DBE8A",
  greenDim: "rgba(93,190,138,0.12)",
  greenBorder: "rgba(93,190,138,0.4)",
  orange: "#F97316",
  orangeDim: "rgba(249,115,22,0.12)",
  orangeBorder: "rgba(249,115,22,0.4)",
  blue: "#60A5FA",
  blueDim: "rgba(96,165,250,0.12)",
  blueBorder: "rgba(96,165,250,0.35)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNowParts() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return { timeStr, dateStr };
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const vw = width / 100;
  const vh = height / 100;
  const colWidth = isTablet ? width * 0.55 : width;
  const cvw = colWidth / 100;
  return { width, height, vw, vh, cvw, isTablet };
}

// ─── Clock Card — hero style ──────────────────────────────────────────────────
function ClockCard({ cvw, vh, isTablet }) {
  const [parts, setParts] = useState(() => getNowParts());

  useEffect(() => {
    const t = setInterval(() => setParts(getNowParts()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 24,
        paddingVertical: isTablet ? vh * 2.5 : vh * 2.2,
        paddingHorizontal: isTablet ? cvw * 4 : cvw * 6,
        borderWidth: 1,
        borderColor: C.borderGold,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: C.muted,
          fontSize: cvw * 2.2,
          letterSpacing: 3,
          fontWeight: "600",
          textTransform: "uppercase",
          marginBottom: vh * 0.8,
        }}
      >
        Current Time
      </Text>

      <Text
        style={{
          color: C.gold,
          fontSize: isTablet ? cvw * 8 : cvw * 12,
          fontWeight: "800",
          letterSpacing: -2,
          lineHeight: isTablet ? cvw * 9 : cvw * 13,
          fontVariant: ["tabular-nums"],
        }}
      >
        {parts.timeStr}
      </Text>

      <View
        style={{
          marginTop: vh * 1.2,
          paddingHorizontal: cvw * 4,
          paddingVertical: vh * 0.5,
          borderRadius: 100,
          backgroundColor: "rgba(0,0,0,0.4)",
          borderWidth: 1,
          borderColor: C.borderGold + "88",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text
          style={{
            color: C.gold,
            fontSize: cvw * 2.2,
            fontWeight: "700",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          IST
        </Text>
        <View style={{ width: 1, height: 10, backgroundColor: C.borderGold }} />
        <Text
          style={{
            color: C.muted,
            fontSize: cvw * 2.2,
            fontWeight: "500",
            letterSpacing: 0.5,
          }}
        >
          {parts.dateStr}
        </Text>
      </View>
    </View>
  );
}

// ─── Site Status Card ─────────────────────────────────────────────────────────
function SiteStatusCard({
  site,
  withinRadius,
  checkingLocation,
  allowOutsideRadius,
  distance,
  realUserLocation,
  currentAddress,
  cvw,
  vh,
  isTablet,
}) {
  const borderColor = checkingLocation
    ? C.border
    : withinRadius
      ? C.greenBorder
      : C.orangeBorder;

  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        padding: isTablet ? cvw * 2.5 : cvw * 5,
        marginBottom: vh * 1.5,
      }}
    >
      {/* Row 1: icon + site name */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: vh * 1.2,
        }}
      >
        <View
          style={{
            width: isTablet ? cvw * 5 : cvw * 9,
            height: isTablet ? cvw * 5 : cvw * 9,
            borderRadius: cvw * 5,
            backgroundColor: checkingLocation
              ? C.goldDim
              : withinRadius
                ? C.greenDim
                : C.orangeDim,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={
              checkingLocation
                ? "locate-outline"
                : withinRadius
                  ? "location"
                  : "location-outline"
            }
            size={isTablet ? cvw * 2.4 : cvw * 4.5}
            color={checkingLocation ? C.gold : withinRadius ? C.green : C.orange}
          />
        </View>
        <View>
          <Text
            style={{
              color: C.muted,
              fontSize: isTablet ? cvw * 1.8 : cvw * 3,
              marginBottom: 2,
            }}
          >
            Assigned Site
          </Text>
          <Text
            style={{
              color: C.white,
              fontWeight: "700",
              fontSize: isTablet ? cvw * 2.2 : cvw * 3.8,
            }}
          >
            {site?.name ?? "—"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{ height: 1, backgroundColor: C.border, marginBottom: vh * 1.2 }}
      />

      {/* Row 2: status */}
      {checkingLocation ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" color={C.gold} />
          <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3.2 }}>
            Fetching location…
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Range badge */}
          <View
            style={{
              backgroundColor: withinRadius ? C.greenDim : C.orangeDim,
              borderWidth: 1,
              borderColor: withinRadius ? C.greenBorder : C.orangeBorder,
              borderRadius: 10,
              paddingHorizontal: isTablet ? cvw * 2 : cvw * 3.5,
              paddingVertical: isTablet ? vh * 0.5 : vh * 0.7,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name={withinRadius ? "checkmark-circle" : "close-circle"}
              size={isTablet ? cvw * 1.8 : cvw * 4}
              color={withinRadius ? C.green : C.orange}
            />
            <Text
              style={{
                color: withinRadius ? C.green : C.orange,
                fontWeight: "800",
                fontSize: isTablet ? cvw * 1.8 : cvw * 3.2,
                letterSpacing: 0.5,
              }}
            >
              {withinRadius ? "IN RANGE" : "OUT OF RANGE"}
            </Text>
          </View>

          {/* Distance pill */}
          {distance != null && (
            <Text
              style={{
                color: C.muted,
                fontSize: isTablet ? cvw * 1.6 : cvw * 2.8,
                fontVariant: ["tabular-nums"],
              }}
            >
              {distance.toFixed(0)} m away
            </Text>
          )}
        </View>
      )}

      {/* ── OUTSIDE RADIUS: show current location + override note ── */}
      {!checkingLocation && !withinRadius && (
        <>
          {/* Current location box */}
          {realUserLocation && (
            <View
              style={{
                marginTop: vh * 1.2,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.border,
                padding: isTablet ? cvw * 1.5 : cvw * 3,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={isTablet ? cvw * 1.8 : cvw * 3.8}
                  color={C.muted}
                />
                <Text
                  style={{
                    color: C.muted,
                    fontSize: isTablet ? cvw * 1.4 : cvw * 2.8,
                    fontWeight: "600",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Your Current Location
                </Text>
              </View>

              {/* Reverse-geocoded address */}
              {currentAddress ? (
                <Text
                  style={{
                    color: C.white,
                    fontSize: isTablet ? cvw * 1.6 : cvw * 3.2,
                    fontWeight: "500",
                    lineHeight: isTablet ? cvw * 2.4 : cvw * 4.5,
                  }}
                >
                  {currentAddress}
                </Text>
              ) : null}

              {/* Raw coords — always shown */}
              <Text
                style={{
                  color: C.muted,
                  fontSize: isTablet ? cvw * 1.4 : cvw * 2.6,
                  fontVariant: ["tabular-nums"],
                  letterSpacing: 0.3,
                }}
              >
                {realUserLocation.latitude.toFixed(6)}, {realUserLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Override / blocked note */}
          <View
            style={{
              marginTop: vh * 1,
              backgroundColor: allowOutsideRadius
                ? "rgba(96,165,250,0.06)"
                : "rgba(249,115,22,0.06)",
              borderRadius: 8,
              padding: isTablet ? cvw * 1.5 : cvw * 3,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 7,
            }}
          >
            <Ionicons
              name={allowOutsideRadius ? "shield-checkmark-outline" : "ban-outline"}
              size={isTablet ? cvw * 1.8 : cvw * 3.8}
              color={allowOutsideRadius ? C.blue : C.orange}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                color: allowOutsideRadius ? C.blue : C.orange,
                fontSize: isTablet ? cvw * 1.5 : cvw * 2.8,
                flex: 1,
                lineHeight: isTablet ? cvw * 2.4 : cvw * 4.2,
              }}
            >
              {allowOutsideRadius
                ? "Your role permits check-in outside the site radius. The coordinates above will be recorded."
                : "Your role does not permit check-in outside the assigned site radius. Please move closer to the site."}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckInScreen() {
  const navigation = useNavigation();
  const { vw, vh, cvw, isTablet } = useResponsive();

  const permissions = useAuthStore((s) => s.permissions);
 

  const cameraRef = useRef(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [cameraType, setCameraType] = useState("front");

  const [photo, setPhoto] = useState(null);
  const [realUserLocation, setRealUserLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null); // reverse-geocoded
  const [site, setSite] = useState(null);
  const [withinRadius, setWithinRadius] = useState(false);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [allowOutsideRadius, setAllowOutsideRadius] = useState(false);
   if (!can(permissions, "attendance.checkin")) return null;

  // ── GPS fetch ─────────────────────────────────────────────────────────────
  const fetchLocation = useCallback(async (siteData) => {
    if (!siteData) return;
    try {
      setCheckingLocation(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      const dist = getDistanceInMeters(
        latitude, longitude,
        siteData.latitude, siteData.longitude
      );
      const inRange = dist <= siteData.radius + 15;

      console.log("──────── LOCATION DEBUG ────────");
      console.log("User:", latitude, longitude);
      console.log("Site:", siteData.latitude, siteData.longitude);
      console.log("Distance (m):", dist.toFixed(1));
      console.log("Radius:", siteData.radius);
      console.log("In range:", inRange);
      console.log("────────────────────────────────");

      setDistance(dist);
      setWithinRadius(inRange);
      setRealUserLocation({ latitude, longitude });

      // Reverse geocode only when outside radius
      if (!inRange) {
        try {
          const places = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (places?.length > 0) {
            const p = places[0];
            const parts = [p.name, p.street, p.district, p.city, p.region]
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
            setCurrentAddress(parts.slice(0, 3).join(", "));
          }
        } catch {
          setCurrentAddress(null);
        }
      } else {
        setCurrentAddress(null);
      }
    } catch {
      Alert.alert("Location Error", "Unable to fetch location");
    } finally {
      setCheckingLocation(false);
    }
  }, []);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [, locPerm] = await Promise.all([
          requestCameraPermission(),
          Location.requestForegroundPermissionsAsync(),
        ]);
        setLocationPermission(locPerm.status === "granted");

        if (locPerm.status !== "granted") {
          Alert.alert("Permission required", "Location access is needed for check-in.");
          setCheckingLocation(false);
          return;
        }

        const [siteRes, configRes] = await Promise.allSettled([
          api.get("/users/me/site"),
          api.get("/attendance/config/me"),
        ]);

        if (siteRes.status !== "fulfilled") {
          Alert.alert("Error", "Could not load assigned site");
          setCheckingLocation(false);
          return;
        }

        const siteData = siteRes.value.data;
        if (!siteData) {
          Alert.alert("Error", "No site assigned to your account");
          setCheckingLocation(false);
          return;
        }

        setSite(siteData);

        if (configRes.status === "fulfilled") {
          setAllowOutsideRadius(!!configRes.value.data?.allowOutsideRadius);
        }

        await fetchLocation(siteData);
      } catch (err) {
        console.log("Bootstrap error:", err?.response?.data || err.message);
        Alert.alert("Error", "Could not initialise check-in");
        setCheckingLocation(false);
      }
    })();
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    setPhoto(result);
    if (site) await fetchLocation(site);
  };

  const redoPhoto = () => setPhoto(null);
  const toggleCamera = () =>
    setCameraType((p) => (p === "front" ? "back" : "front"));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!realUserLocation) {
      Alert.alert("Location Error", "Location not captured");
      return;
    }
    if (!withinRadius && !allowOutsideRadius) {
      Alert.alert(
        "Out of Range",
        "Your role does not permit check-in outside the site radius."
      );
      return;
    }

    const submitLat = withinRadius ? site.latitude : realUserLocation.latitude;
    const submitLng = withinRadius ? site.longitude : realUserLocation.longitude;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        name: "checkin.jpg",
        type: "image/jpeg",
      });
      formData.append("lat", String(submitLat));
      formData.append("lng", String(submitLng));
      await api.post("/attendance/checkin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", "Check-in successful");
      navigation.navigate("Dashboard");
    } catch (error) {
      Alert.alert(
        "Check-in Failed",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const locationReady = !checkingLocation && realUserLocation !== null;
  const canSubmit =
    photo !== null &&
    locationReady &&
    (withinRadius || allowOutsideRadius) &&
    !loading;
  const submitDisabled = !canSubmit;

  let btnLabel = "Capture Photo";
  let btnIcon = "camera-outline";
  if (photo) {
    if (checkingLocation) {
      btnLabel = "Checking Location…";
      btnIcon = "locate-outline";
    } else if (!withinRadius && !allowOutsideRadius) {
      btnLabel = "Cannot Submit";
      btnIcon = "ban-outline";
    } else {
      btnLabel = "Submit Check-In";
      btnIcon = "checkmark-circle-outline";
    }
  }

  // ── Permissions splash ────────────────────────────────────────────────────
  if (!cameraPermission?.granted || locationPermission === null) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ color: C.muted, marginTop: 12, letterSpacing: 1.5, fontSize: 13 }}>
          REQUESTING PERMISSIONS
        </Text>
      </SafeAreaView>
    );
  }

  const cameraH = isTablet ? vh * 50 : vh * 42;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          flex: 1,
          margin: vw * 4,
          backgroundColor: C.surface,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.borderGold,
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ── */}
        <View
          style={{
            paddingHorizontal: isTablet ? cvw * 3 : cvw * 6,
            paddingTop: vh * 2.5,
            paddingBottom: vh * 2,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          <Text
            style={{
              color: C.gold,
              fontSize: isTablet ? cvw * 2 : cvw * 2.8,
              letterSpacing: 3,
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Attendance
          </Text>
          <Text
            style={{
              color: C.white,
              fontSize: isTablet ? cvw * 3.5 : cvw * 5.5,
              fontWeight: "900",
              letterSpacing: -0.5,
            }}
          >
            Check In
          </Text>
        </View>

        {/* ── SCROLL CONTENT ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: isTablet ? cvw * 3 : cvw * 6,
            paddingTop: vh * 2,
            paddingBottom: vh * 2.5,
            gap: vh * 2,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CLOCK ── */}
          <ClockCard cvw={cvw} vh={vh} isTablet={isTablet} />

          {/* ── CAMERA / PHOTO ── */}
          {/* 
            FIX: On Android, CameraView intercepts all touch events and prevents
            the Capture Photo button below from firing. Wrapping CameraView in a
            pointerEvents="none" View stops it from consuming touches while still
            rendering the preview. The outer container uses pointerEvents="box-none"
            so its own touches (Flip button) still work.
          */}
          <View
            pointerEvents="box-none"
            style={{
              borderRadius: 20,
              overflow: "hidden",
              height: cameraH,
              backgroundColor: C.faint,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            {!photo ? (
              <>
                {/* Camera preview — non-interactive so touches pass through */}
                <View style={{ flex: 1 }} pointerEvents="none">
                  <CameraView ref={cameraRef} facing={cameraType} style={{ flex: 1 }} />
                </View>

                {/* Flip — sits above the pointerEvents="none" layer */}
                <TouchableOpacity
                  onPress={toggleCamera}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    borderWidth: 1,
                    borderColor: C.borderGold,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={isTablet ? cvw * 2.4 : cvw * 4.5}
                    color={C.gold}
                  />
                  <Text
                    style={{
                      color: C.gold,
                      fontWeight: "600",
                      fontSize: isTablet ? cvw * 1.8 : cvw * 3.2,
                    }}
                  >
                    Flip
                  </Text>
                </TouchableOpacity>

                {/* Guide hint */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 1.8 : cvw * 3 }}>
                      Position your face in frame
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Image
                source={{ uri: photo.uri }}
                style={{ flex: 1 }}
                resizeMode="cover"
              />
            )}
          </View>

          {/* ── SITE STATUS ── */}
          {site && (
            <SiteStatusCard
              site={site}
              withinRadius={withinRadius}
              checkingLocation={checkingLocation}
              allowOutsideRadius={allowOutsideRadius}
              distance={distance}
              realUserLocation={realUserLocation}
              currentAddress={currentAddress}
              cvw={cvw}
              vh={vh}
              isTablet={isTablet}
            />
          )}

          {/* ── RETAKE ── */}
          {photo && (
            <TouchableOpacity
              onPress={redoPhoto}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="refresh-outline"
                size={isTablet ? cvw * 2 : cvw * 4}
                color={C.muted}
              />
              <Text style={{ color: C.muted, fontSize: isTablet ? cvw * 2 : cvw * 3.5 }}>
                Retake Photo
              </Text>
            </TouchableOpacity>
          )}

          {/* ── ACTION BUTTON ── */}
          <TouchableOpacity
            onPress={!photo ? takePhoto : handleSubmit}
            disabled={photo ? submitDisabled : false}
            activeOpacity={0.85}
            style={{
              backgroundColor:
                photo && submitDisabled ? "rgba(201,162,39,0.28)" : C.gold,
              borderRadius: 16,
              paddingVertical: isTablet ? cvw * 1.6 : cvw * 4,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons
                  name={btnIcon}
                  size={isTablet ? cvw * 2.6 : cvw * 5}
                  color={photo && submitDisabled ? "rgba(0,0,0,0.35)" : "#000"}
                />
                <Text
                  style={{
                    color: photo && submitDisabled ? "rgba(0,0,0,0.35)" : "#000",
                    fontWeight: "800",
                    fontSize: isTablet ? cvw * 2.6 : cvw * 4,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {btnLabel}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}