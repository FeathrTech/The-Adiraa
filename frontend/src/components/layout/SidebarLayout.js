import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function SidebarLayout({ children }) {
  const permissions = useAuthStore((s) => s.permissions);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View className="flex-1 flex-row bg-white">
      {/* Sidebar */}
      <View className="w-[22vw] bg-black p-6">
        <Text className="text-white text-2xl mb-10 font-bold">
          The Adiraa
        </Text>

        {permissions.includes("dashboard.view") && (
          <MenuItem label="Dashboard" />
        )}

        {permissions.includes("staff.view") && (
          <MenuItem label="Staff" />
        )}

        {permissions.includes("role.view") && (
          <MenuItem label="Roles" />
        )}

        {permissions.includes("attendance.report.view") && (
          <MenuItem label="Reports" />
        )}

        <TouchableOpacity onPress={logout} className="mt-10">
          <Text className="text-red-400 text-lg">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 p-8 bg-gray-50">{children}</View>
    </View>
  );
}

function MenuItem({ label }) {
  return (
    <TouchableOpacity className="mb-6">
      <Text className="text-white text-lg">{label}</Text>
    </TouchableOpacity>
  );
}
