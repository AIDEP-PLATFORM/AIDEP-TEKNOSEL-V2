import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { LoadingScreen } from '@/components/common/loading-screen';

export default function AppLayout() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
