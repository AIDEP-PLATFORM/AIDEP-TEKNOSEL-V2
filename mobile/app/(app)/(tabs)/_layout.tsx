import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#0e2137',
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Harita',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Hasar Raporla',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'warning' : 'warning-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Ekibim',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
