// components/GlobalLoader.js
import { View, ActivityIndicator } from "react-native";
import { useUIStore } from "../../store/uiStore";

export default function GlobalLoader() {
  const loading = useUIStore((s) => s.loading);

  if (!loading) return null;

  return (
    <View className="absolute w-full h-full justify-center items-center bg-black/30 z-50">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
