import { useEffect, useRef } from "react";
import {
    View,
    Image,
    Animated,
    useWindowDimensions,
    StatusBar,
    Platform,
} from "react-native";

export default function SplashScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const borderInset = isTablet ? width * 0.04 : width * 0.05;
    const logoSize = isTablet ? width * 0.28 : width * 0.55;

    // Hardcoded safe padding — no useSafeAreaInsets needed at root level
    // iOS notch/Dynamic Island ~59px top, home indicator ~34px bottom
    // Android status bar ~24px top, nav ~16px bottom
    const topPad = Platform.OS === "ios" ? 59 : 24;
    const bottomPad = Platform.OS === "ios" ? 34 : 16;

    const safeTop = borderInset + topPad + 8;
    const safeBottom = borderInset + bottomPad + 8;

    return (
        <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Outer gold border */}
            <View style={{
                position: "absolute",
                top: safeTop,
                left: borderInset,
                right: borderInset,
                bottom: safeBottom,
                borderWidth: 1,
                borderColor: "rgba(201,162,39,0.55)",
                borderRadius: isTablet ? 24 : 18,
            }} />

            {/* Inner gold border (double-frame effect) */}
            <View style={{
                position: "absolute",
                top: safeTop + 5,
                left: borderInset + 5,
                right: borderInset + 5,
                bottom: safeBottom + 5,
                borderWidth: 0.5,
                borderColor: "rgba(201,162,39,0.25)",
                borderRadius: isTablet ? 20 : 14,
            }} />

            {/* Centred logo */}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    alignItems: "center",
                }}>
                    <Image
                        source={require("../../../assets/images/adiraa.png")}
                        style={{
                            width: logoSize,
                            height: logoSize,
                            resizeMode: "contain",
                        }}
                    />
                </Animated.View>
            </View>
        </View>
    );
}