import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChatScreen } from '../screens/ChatScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof AppTabsParamList, { active: IoniconsName; inactive: IoniconsName }> = {
  Chat:      { active: 'chatbubble',        inactive: 'chatbubble-outline' },
  Dashboard: { active: 'bar-chart',         inactive: 'bar-chart-outline' },
  Profile:   { active: 'person-circle',     inactive: 'person-circle-outline' },
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name as keyof AppTabsParamList];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={focused ? colors.primary : colors.textSecondary} />;
        },
      })}
    >
      <Tab.Screen name="Chat"      component={ChatScreen}      options={{ title: 'Asesor IA' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Portfolio' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
