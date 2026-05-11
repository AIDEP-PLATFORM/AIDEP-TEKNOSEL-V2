import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import { validators } from '@/utils/validators';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { UserRole } from '@/types/auth.types';

const ROLES: { value: UserRole; label: string; icon: string; description: string }[] = [
  { value: 'citizen', label: 'Vatandaş', icon: 'person-outline', description: 'Hasar bildirimi yapabilirsiniz' },
  { value: 'volunteer', label: 'STK Gönüllü', icon: 'heart-outline', description: 'Kurtarma operasyonlarına katılabilirsiniz' },
  { value: 'afad', label: 'AFAD / UMKE', icon: 'shield-outline', description: 'Resmi afet yönetim görevlisi' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!validators.required(fullName)) newErrors.fullName = 'Ad soyad zorunludur';
    if (!validators.required(email)) newErrors.email = 'E-posta zorunludur';
    else if (!validators.email(email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (phone && !validators.phone(phone)) newErrors.phone = 'Geçerli bir telefon numarası girin';
    if (!validators.required(password)) newErrors.password = 'Şifre zorunludur';
    else if (!validators.password(password)) newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setSubmitted(true);
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        phone: phone || undefined,
      });
      router.replace('/(app)/(tabs)/home');
    } catch (err: any) {
      setErrors({ general: err.message ?? 'Kayıt başarısız. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        style={styles.container}
      >

        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>AIDEP platformuna katıl</Text>
        </View>

        <View style={styles.card}>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="Ad Soyad"
            placeholder="Adınız Soyadınız"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={submitted ? errors.fullName : undefined}
          />

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
            label="Telefon (isteğe bağlı)"
            placeholder="05xx xxx xx xx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={submitted ? errors.phone : undefined}
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
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="Şifre Tekrar"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            error={submitted ? errors.confirmPassword : undefined}
          />

          {/* Rol seçimi */}
          <View>
            <Text style={styles.roleLabel}>Rolünüz</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleCard, selectedRole === role.value && styles.roleCardActive]}
                  onPress={() => setSelectedRole(role.value)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={role.icon as any}
                    size={22}
                    color={selectedRole === role.value ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.roleTitle, selectedRole === role.value && styles.roleTitleActive]}>
                    {role.label}
                  </Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Kayıt Ol"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
        </View>

        {/* Giriş yap */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.xs,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  roleLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  roleGrid: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  roleCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: 'rgba(15,23,42,0.6)',
    gap: 4,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  roleTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTitleActive: {
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  registerButton: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
