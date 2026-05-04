import { Redirect } from 'expo-router';

// Auth durumuna göre yönlendirme MB-004'te implement edilecek
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
