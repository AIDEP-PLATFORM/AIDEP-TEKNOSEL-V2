import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import { SelectInput } from '@/components/common/select-input';
import { validators } from '@/utils/validators';
import { organizationService, OrganizationBranch } from '@/services/organization.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function StkRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { registerNgoManager, registerNgoStaff } = useAuth();
  const { type } = useLocalSearchParams<{ type: 'yonetim' | 'saha' }>();

  const isYonetim = type === 'yonetim';

  // Kişisel bilgiler
  const [fullName, setFullName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Kurum cascade
  const [orgNames, setOrgNames] = useState<string[]>([]);
  const [selectedOrgName, setSelectedOrgName] = useState('');
  const [orgCities, setOrgCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [orgBranches, setOrgBranches] = useState<OrganizationBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<OrganizationBranch | null>(null);

  // Yönetim personeli ekstra
  const [faaliyetAlani, setFaaliyetAlani] = useState('');
  const [adres, setAdres] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // STK isimlerini yükle
  useEffect(() => {
    organizationService.getNames('STK').then(setOrgNames).catch(() => { });
  }, []);

  useEffect(() => {
    if (selectedOrgName) {
      setSelectedCity('');
      setSelectedBranch(null);
      setOrgBranches([]);
      organizationService.getCities(selectedOrgName, 'STK').then(setOrgCities).catch(() => { });
    } else {
      setOrgCities([]);
      setOrgBranches([]);
      setSelectedCity('');
      setSelectedBranch(null);
    }
  }, [selectedOrgName]);

  useEffect(() => {
    if (selectedOrgName && selectedCity) {
      setSelectedBranch(null);
      organizationService.getBranches(selectedOrgName, selectedCity, 'STK').then(setOrgBranches).catch(() => { });
    } else {
      setOrgBranches([]);
      setSelectedBranch(null);
    }
  }, [selectedCity]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!validators.required(fullName)) newErrors.fullName = 'Ad soyad zorunludur';
    if (!validators.required(tcNo)) newErrors.tcNo = 'TC Kimlik No zorunludur';
    else if (!validators.tcNo(tcNo)) newErrors.tcNo = 'Geçerli bir TC Kimlik No girin (11 hane)';
    if (!validators.required(selectedOrgName)) newErrors.orgName = 'STK / Kurum seçimi zorunludur';
    if (!selectedCity) newErrors.city = 'Şehir seçimi zorunludur';
    if (!selectedBranch) newErrors.branch = 'Şube seçimi zorunludur';
    if (isYonetim) {
      if (!validators.required(faaliyetAlani)) newErrors.faaliyetAlani = 'Faaliyet alanı zorunludur';
      if (!validators.required(adres)) newErrors.adres = 'Açık adres zorunludur';
    }
    if (!validators.required(email)) newErrors.email = 'E-posta zorunludur';
    else if (!validators.email(email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (!validators.required(phone)) newErrors.phone = 'Telefon zorunludur';
    else if (!validators.phone(phone)) newErrors.phone = 'Geçerli bir telefon numarası girin';
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
      if (isYonetim) {
        await registerNgoManager({
          tc_no: tcNo,
          full_name: fullName.trim(),
          organization_id: selectedBranch!.id,
          email: email.trim().toLowerCase(),
          phone,
          password,
          password_confirm: confirmPassword,
          activity_areas: faaliyetAlani.split(',').map((s) => s.trim()).filter(Boolean),
          address: adres || undefined,
        });
      } else {
        await registerNgoStaff({
          tc_no: tcNo,
          full_name: fullName.trim(),
          organization_id: selectedBranch!.id,
          email: email.trim().toLowerCase(),
          phone,
          password,
          password_confirm: confirmPassword,
        });
      }
      Alert.alert(
        'Kayıt Alındı',
        'Kaydınız başarıyla alındı. Onay sürecinden geçtikten sonra giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => router.replace('/(auth)/login') }]
      );
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
            <Ionicons name={isYonetim ? 'briefcase-outline' : 'people-outline'} size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{isYonetim ? 'STK Yönetim Personeli' : 'STK Saha Personeli'}</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
        </View>

        <View style={styles.card}>
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Input label="Ad Soyad" placeholder="Adınız Soyadınız" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={submitted ? errors.fullName : undefined} />
          <Input label="TC Kimlik No" placeholder="12345678901" value={tcNo} onChangeText={setTcNo} keyboardType="number-pad" maxLength={11} error={submitted ? errors.tcNo : undefined} />

          {/* Kurum cascade */}
          <SelectInput
            label="STK / Kurum"
            options={orgNames}
            value={selectedOrgName}
            onSelect={setSelectedOrgName}
            placeholder={orgNames.length === 0 ? 'Yükleniyor...' : 'STK seçiniz'}
            error={submitted ? errors.orgName : undefined}
          />

          {selectedOrgName ? (
            <SelectInput
              label="Şehir"
              options={orgCities}
              value={selectedCity}
              onSelect={setSelectedCity}
              placeholder={orgCities.length === 0 ? 'Yükleniyor...' : 'Şehir seçiniz'}
              error={submitted ? errors.city : undefined}
            />
          ) : null}

          {selectedCity ? (
            <SelectInput
              label="Şube"
              options={orgBranches.map((b) => b.district)}
              value={selectedBranch?.district ?? ''}
              onSelect={(district) => {
                const branch = orgBranches.find((b) => b.district === district) ?? null;
                setSelectedBranch(branch);
              }}
              placeholder={orgBranches.length === 0 ? 'Yükleniyor...' : 'Şube seçiniz'}
              error={submitted ? errors.branch : undefined}
            />
          ) : null}

          {isYonetim && (
            <Input
              label="STK Faaliyet Alanı"
              placeholder="Örn: Arama kurtarma, Lojistik (virgülle ayırın)"
              value={faaliyetAlani}
              onChangeText={setFaaliyetAlani}
              autoCapitalize="sentences"
              error={submitted ? errors.faaliyetAlani : undefined}
            />
          )}

          {isYonetim && (
            <Input
              label="Açık Adres"
              placeholder="Mahalle, sokak, bina no..."
              value={adres}
              onChangeText={setAdres}
              autoCapitalize="sentences"
              error={submitted ? errors.adres : undefined}
            />
          )}

          <Input
            label="E-posta" placeholder="ornek@email.com" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            error={submitted ? errors.email : undefined}
          />
          <Input
            label="Telefon" placeholder="05xx xxx xx xx" value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" error={submitted ? errors.phone : undefined}
          />

          <Input
            label="Şifre" placeholder="••••••••" value={password} onChangeText={setPassword}
            secureTextEntry={!showPassword} error={submitted ? errors.password : undefined}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            }
          />
          <Input
            label="Şifre Tekrar" placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword} error={submitted ? errors.confirmPassword : undefined}
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
