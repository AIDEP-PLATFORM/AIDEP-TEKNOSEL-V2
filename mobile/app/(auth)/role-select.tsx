import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const ROLES = [
  {
    key: 'citizen',
    label: 'Vatandaş',
    icon: 'person-outline' as const,
    description: 'Hasar bildirimi yapın, yardım talep edin',
    registerPath: '/(auth)/citizen-register',
    color: Colors.primary,
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.3)',
  },
  {
    key: 'stk_manager',
    label: 'STK Yönetim Personeli',
    icon: 'briefcase-outline' as const,
    description: 'STK kurum yöneticisi veya koordinatörü',
    registerPath: '/(auth)/stk-register?type=yonetim',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
  },
  {
    key: 'stk_field',
    label: 'STK Saha Personeli',
    icon: 'people-outline' as const,
    description: 'Saha operasyonlarında görev alan personel',
    registerPath: '/(auth)/stk-register?type=saha',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.3)',
  },
  {
    key: 'afad',
    label: 'AFAD / UMKE',
    icon: 'shield-outline' as const,
    description: 'Resmi afet yönetim görevlisi',
    registerPath: '/(auth)/afad-register',
    color: Colors.accent,
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.3)',
  },
];

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Üst header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/aideplogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>AIDEP</Text>
        <Text style={styles.logoSub}>Afet Yönetim Platformu</Text>
      </View>

      {/* Alt kart */}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sectionLabel}>KULLANICI ROLÜNÜZÜ SEÇİN</Text>

        <View style={styles.cardsContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.card, { backgroundColor: role.bg, borderColor: role.border }]}
              onPress={() => router.push(role.registerPath as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: role.bg, borderColor: role.border }]}>
                <Ionicons name={role.icon} size={22} color={role.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: role.color }]}>{role.label}</Text>
                <Text style={styles.cardDesc}>{role.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={role.color} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 56,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: Spacing.sm,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
  },
  logoText: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#0e2137',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  cardsContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
});
