import { useEffect } from 'react';
import { router } from 'expo-router';

// Gönüllü kaydı citizen-register.tsx içindeki opsiyonel STK bölümü üzerinden yapılır.
export default function VolunteerRegisterScreen() {
  useEffect(() => {
    router.replace('/(auth)/citizen-register');
  }, []);
  return null;
}
