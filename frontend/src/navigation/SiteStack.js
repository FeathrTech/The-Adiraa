import { createNativeStackNavigator } from "@react-navigation/native-stack";

import VenueScreen from "../screens/venue/VenueScreen";
import SiteDetailsScreen from "../screens/venue/CreateVenueScreen";
import EditVenueScreen from "../screens/venue/EditVenueScreen";
import VenueDetailsScreen from "../screens/venue/VenueDetailsScreen";

const Stack = createNativeStackNavigator();

export default function SiteStack() {
  return (
    <Stack.Navigator
      initialRouteName="VenueList"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="VenueList" component={VenueScreen} />
      <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
      <Stack.Screen name="CreateSite" component={SiteDetailsScreen} />
      <Stack.Screen name="EditVenue" component={EditVenueScreen} />
    </Stack.Navigator>
  );
}