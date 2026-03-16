import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StaffListScreen from "../screens/staff/StaffListScreen";
import StaffDetailScreen from "../screens/staff/StaffDetailScreen";
import CreateStaffScreen from "../screens/staff/CreateStaffScreen";
import EditUserScreen from "../screens/staff/EditStaffScreen";

const Stack = createNativeStackNavigator();

export default function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false
    }}>

      <Stack.Screen
        name="StaffList"
        component={StaffListScreen}
        options={{ title: "Staff" }}
      />

      <Stack.Screen
        name="StaffDetail"
        component={StaffDetailScreen}
        options={{ title: "Staff Profile" }}
      />

      <Stack.Screen
        name="CreateStaff"
        component={CreateStaffScreen}
        options={{ title: "Add Staff" }}
      />

      <Stack.Screen
        name="EditStaff"
        component={EditUserScreen}
        options={{ title: "Edit Staff" }}
      />

    </Stack.Navigator>
  );
}
