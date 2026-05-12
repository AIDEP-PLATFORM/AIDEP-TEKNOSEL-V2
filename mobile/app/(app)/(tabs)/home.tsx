import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/use-auth';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const MOCK_SAFE = true;

const MOCK_ANNOUNCEMENTS = [
  { id: '1', text: 'Kadıköy\'deki toplanma alanları aktif edildi', time: '5 dk', color: Colors.success },
  { id: '2', text: 'Üsküdar\'da arama kurtarma ekibi konuşlandı', time: '12 dk', color: Colors.primary },
  { id: '3', text: 'Beşiktaş\'ta yardım dağıtım noktası açıldı', time: '28 dk', color: Colors.accent },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] ?? 'Kullanıcı';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Bölgenizdeki son durumu takip edin</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Durum Banner */}
      {MOCK_SAFE ? (
        <View style={styles.safeBanner}>
          <View style={styles.safeBannerIcon}>
            <Ionicons name="checkmark" size={20} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.safeBannerTitle}>Bölgeniz Güvende</Text>
            <Text style={styles.safeBannerSub}>Son güncelleme: 3 dk önce</Text>
          </View>
        </View>
      ) : (
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerIcon}>
            <Ionicons name="warning" size={20} color={Colors.critical} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBannerTitle}>Deprem Uyarısı</Text>
            <Text style={styles.alertBannerSub}>İstanbul Kadıköy'de 5.4 büyüklüğünde deprem.</Text>
          </View>
        </View>
      )}

      {/* Hızlı Aksiyonlar */}
      <Text style={styles.sectionLabel}>HIZLI AKSİYONLAR</Text>

      {/* SOS + İkili Kartlar */}
      <View style={styles.actionsGroup}>
      <TouchableOpacity style={styles.sosButton} activeOpacity={0.85} onPress={() => router.push('/(app)/(tabs)/report')}>
        <View style={styles.sosIconBox}>
          <Ionicons name="camera" size={26} color={Colors.error} />
        </View>
        <View>
          <Text style={styles.sosTitle}>Hasar Raporla</Text>
          <Text style={styles.sosSub}>Hasar bildirimi gönder</Text>
        </View>
      </TouchableOpacity>

      {/* İkili Aksiyon Kartları */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCardBlue} activeOpacity={0.85}>
          <Ionicons name="location" size={28} color={Colors.primary} />
          <Text style={styles.actionCardTitle}>Toplanma{'\n'}Noktaları</Text>
          <Text style={styles.actionCardSub}>En yakın noktaları gör</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCardGreen} activeOpacity={0.85}>
          <Ionicons name="git-branch-outline" size={28} color={Colors.success} />
          <Text style={[styles.actionCardTitle, { color: Colors.success }]}>Güvenli Rota</Text>
          <Text style={styles.actionCardSub}>Tahliye güzergahı</Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* AFAD Duyuruları */}
      <Text style={styles.sectionLabel}>AFAD DUYURULARI</Text>
      <View style={styles.announcementList}>
        {MOCK_ANNOUNCEMENTS.map((ann, index) => (
          <View
            key={ann.id}
            style={[styles.announcementItem, index < MOCK_ANNOUNCEMENTS.length - 1 && styles.announcementBorder]}
          >
            <View style={[styles.annDot, { backgroundColor: ann.color }]} />
            <Text style={styles.annText}>{ann.text}</Text>
            <Text style={styles.annTime}>{ann.time}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Safe banner
  safeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  safeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.success,
  },
  safeBannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  alertBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.critical,
  },
  alertBannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  actionsGroup: {
    gap: Spacing.sm,
  },

  // SOS
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  sosIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  sosIconText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.critical,
    letterSpacing: 1,
  },
  sosTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.critical,
  },
  sosSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Action cards
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCardBlue: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    gap: Spacing.sm,
  },
  actionCardGreen: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    gap: Spacing.sm,
  },
  actionCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  actionCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Announcements
  announcementList: {
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  announcementBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  annDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  annText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  annTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 0,
  },
});
