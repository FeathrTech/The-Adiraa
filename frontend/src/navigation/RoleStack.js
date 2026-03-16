import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleListScreen from "../screens/roles/RoleListScreen";
import CreateRoleScreen from "../screens/roles/CreateRoleScreen";
import EditRoleScreen from "../screens/roles/EditRoleScreen";

const Stack = createNativeStackNavigator();

export default function RoleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="RoleList"
        component={RoleListScreen}
        options={{ title: "Roles" }}
      />

      <Stack.Screen
        name="CreateRole"
        component={CreateRoleScreen}
        options={{ title: "Create Role" }}
      />

      <Stack.Screen
        name="EditRole"
        component={EditRoleScreen}
        options={{ title: "Edit Role" }}
      />

    </Stack.Navigator>
  );
}
