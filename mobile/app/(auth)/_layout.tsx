import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a1628' } }}>
      <Stack.Screen name="role-select" />
      <Stack.Screen name="citizen-login" />
      <Stack.Screen name="citizen-register" />
      <Stack.Screen name="volunteer-login" />
      <Stack.Screen name="volunteer-register" />
      <Stack.Screen name="afad-login" />
      <Stack.Screen name="afad-register" />
      <Stack.Screen name="stk-register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
