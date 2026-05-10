import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import { SelectInput } from '@/components/common/select-input';
import { validators } from '@/utils/validators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const STK_OPTIONS = [
  'AKUT Arama Kurtarma Derneği',
  'Kızılay',
  'İHH İnsani Yardım Vakfı',
  'ARKS Arama Kurtarma',
  'TEGV',
  'Diğer',
];

export default function VolunteerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStk, setSelectedStk] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!validators.required(fullName)) newErrors.fullName = 'Ad soyad zorunludur';
    if (!validators.required(tcNo)) newErrors.tcNo = 'TC Kimlik No zorunludur';
    else if (!validators.tcNo(tcNo)) newErrors.tcNo = 'Geçerli bir TC Kimlik No girin (11 hane)';
    if (!validators.required(email)) newErrors.email = 'E-posta zorunludur';
    else if (!validators.email(email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (!validators.required(phone)) newErrors.phone = 'Telefon zorunludur';
    else if (!validators.phone(phone)) newErrors.phone = 'Geçerli bir telefon numarası girin';
    if (!validators.required(selectedStk)) newErrors.stk = 'STK / Kurum seçimi zorunludur';
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
        role: 'volunteer',
        phone,
      });
      router.replace('/(app)/(tabs)/home');
    } catch (err: any) {
      setErrors({ general: err.message ?? 'Kayıt başarısız. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Ionicons name="heart-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>STK Yetkilisi Kaydı</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
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
            label="TC Kimlik No"
            placeholder="12345678901"
            value={tcNo}
            onChangeText={setTcNo}
            keyboardType="number-pad"
            maxLength={11}
            error={submitted ? errors.tcNo : undefined}
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
            label="Telefon"
            placeholder="05xx xxx xx xx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={submitted ? errors.phone : undefined}
          />

          <SelectInput
            label="STK / Kurum"
            options={STK_OPTIONS}
            value={selectedStk}
            onSelect={setSelectedStk}
            placeholder="STK seçiniz"
            error={submitted ? errors.stk : undefined}
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

          <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} style={styles.button} />
        </View>

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
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg },
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
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
