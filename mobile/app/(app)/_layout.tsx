import { Redirect, Stack } from 'expo-router';

// MB-004: Rol bazlı yönlendirme burada implement edilecek
export default function AppLayout() {
  // TODO: Auth kontrolü eklenecek - giriş yapılmamışsa login'e yönlendir
  // const { user } = useAuthStore();
  // if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
