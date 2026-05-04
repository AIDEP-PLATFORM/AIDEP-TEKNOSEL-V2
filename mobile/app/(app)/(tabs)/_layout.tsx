import { Tabs } from 'expo-router';

// MB-004: Rol bazlı tab görünümü burada yönetilecek
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="map" options={{ title: 'Harita' }} />
      <Tabs.Screen name="report" options={{ title: 'Bildir' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
