import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import { validators } from '@/utils/validators';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function CitizenLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!validators.required(email)) newErrors.email = 'E-posta zorunludur';
    else if (!validators.email(email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (!validators.required(password)) newErrors.password = 'Şifre zorunludur';
    else if (!validators.password(password)) newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setSubmitted(true);
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/(app)/(tabs)/home');
    } catch (err: any) {
      setErrors({ general: err.message ?? 'Giriş başarısız. Bilgilerinizi kontrol edin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Ionicons name="person-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Vatandaş Girişi</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.card}>
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="E-posta"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={submitted ? errors.email : undefined}
          />

          <Input
            label="Şifre"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={submitted ? errors.password : undefined}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            }
          />

          <Button title="Giriş Yap" onPress={handleLogin} loading={loading} style={styles.button} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabın yok mu? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/citizen-register')}>
            <Text style={styles.footerLink}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  backButton: { position: 'absolute', left: 0, top: 0, padding: Spacing.xs },
  iconBox: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(6,182,212,0.1)', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(14,33,55,0.9)', borderRadius: BorderRadius.xl,
    padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  errorBannerText: { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  button: { marginTop: Spacing.xs, backgroundColor: Colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
