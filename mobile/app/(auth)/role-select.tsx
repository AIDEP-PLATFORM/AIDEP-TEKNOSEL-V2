import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const ROLES = [
  {
    key: 'citizen',
    label: 'Vatandaş',
    tag: 'VATANDAŞ',
    icon: 'person-outline' as const,
    description: 'Hasar bildirimi yapın, yardım talep edin',
    registerPath: '/(auth)/citizen-register',
    color: Colors.primary,
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.3)',
  },
  {
    key: 'stk',
    label: 'STK Çalışanı',
    tag: 'STK',
    icon: 'people-outline' as const,
    description: 'Sivil toplum kuruluşu görevlisi',
    registerPath: '/(auth)/stk-register',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
  },
  {
    key: 'afad',
    label: 'AFAD / UMKE',
    tag: 'KURUM',
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
    <View style={styles.container}>

      {/* Üst header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoBox}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.logoText}>AIDEP</Text>
        <Text style={styles.logoSub}>Afet Yönetim Platformu</Text>
      </View>

      {/* Alt kart — header üzerine taşıyor */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.handle} />
        <Text style={styles.sectionLabel}>KULLANICI ROLÜNÜZÜ SEÇİN</Text>

        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.key}
            style={[styles.card, { backgroundColor: role.bg, borderColor: role.border }]}
            onPress={() => router.push(role.registerPath as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: role.bg, borderColor: role.border }]}>
              <Ionicons name={role.icon} size={26} color={role.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: role.color }]}>{role.label}</Text>
              <Text style={styles.cardDesc}>{role.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={role.color} />
          </TouchableOpacity>
        ))}

        <Text style={styles.disclaimer}>
          Rol seçiminiz hesabınıza kaydedilir. Daha sonra profil ayarlarından değiştirebilirsiniz.
        </Text>
      </ScrollView>

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
    marginTop: -28,
  },
  sheetContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
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
    marginBottom: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});
