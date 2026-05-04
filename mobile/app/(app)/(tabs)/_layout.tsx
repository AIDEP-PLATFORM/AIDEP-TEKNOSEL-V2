import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'home', title: 'Ana Sayfa', icon: 'home-outline', iconFocused: 'home' },
  { name: 'map', title: 'Harita', icon: 'map-outline', iconFocused: 'map' },
  { name: 'tasks', title: 'Görevler', icon: 'list-outline', iconFocused: 'list' },
  { name: 'profile', title: 'Profil', icon: 'person-outline', iconFocused: 'person' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
