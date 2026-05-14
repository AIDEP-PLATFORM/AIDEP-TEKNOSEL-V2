import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth.types';
import { useMapStore } from '@/store/map.store';
import { mapService, EarthquakePoint } from '@/services/map.service';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import ScreenTransition from '@/components/ScreenTransition';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SafetyStatus = 'safe' | 'risk' | 'critical';

const ROLE_LABELS: Record<UserRole, string> = {
  CITIZEN:          'Vatandaş',
  VOLUNTEER:        'Gönüllü',
  NGO_MANAGER:      'STK Yöneticisi',
  NGO_STAFF:        'STK Personeli',
  OFFICIAL_MANAGER: 'Resmi Yönetici',
  OFFICIAL_STAFF:   'Resmi Personel',
  ADMIN:            'Yönetici',
};

const MOCK_ANNOUNCEMENTS = [
  { id: '1', text: 'Kadıköy\'deki toplanma alanları aktif edildi', time: '5 dk', color: Colors.success },
  { id: '2', text: 'Üsküdar\'da arama kurtarma ekibi konuşlandı', time: '12 dk', color: Colors.primary },
  { id: '3', text: 'Beşiktaş\'ta yardım dağıtım noktası açıldı', time: '28 dk', color: Colors.accent },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const setPendingFilter = useMapStore((s) => s.setPendingFilter);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Kullanıcı';

  const [safetyStatus, setSafetyStatus]   = useState<SafetyStatus>('safe');
  const [nearestEq, setNearestEq]         = useState<{ km: number; eq: EarthquakePoint } | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  const checkSafety = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const earthquakes = await mapService.getEarthquakes();
      if (!earthquakes.length) return;
      let minKm = Infinity;
      let closest: EarthquakePoint = earthquakes[0];
      for (const eq of earthquakes) {
        const km = haversineKm(latitude, longitude, eq.latitude, eq.longitude);
        if (km < minKm) { minKm = km; closest = eq; }
      }
      setNearestEq({ km: minKm, eq: closest });
      if (closest.magnitude < 4.0)                          setSafetyStatus('safe');
      else if (minKm <= 100)                                setSafetyStatus('critical');
      else if (minKm <= 400 || closest.magnitude >= 6)     setSafetyStatus('risk');
      else                                                  setSafetyStatus('safe');
    } catch { /* konum alınamazsa safe kalır */ }
  };

  useEffect(() => { checkSafety(); }, []);

  const handleGoToSafeAreas = () => {
    setPendingFilter('toplanma');
    router.push('/(app)/(tabs)/map');
  };

  const handleGoToRoute = () => {
    setPendingFilter('guvenlirota');
    router.push('/(app)/(tabs)/map');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  return (
    <ScreenTransition style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
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
          <TouchableOpacity style={styles.headerBtn} onPress={() => setProfileVisible(true)}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Durum Banner */}
      {safetyStatus === 'safe' && (
        <View style={styles.safeBanner}>
          <View style={styles.safeBannerIcon}>
            <Ionicons name="checkmark" size={20} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safeBannerTitle}>Bölgeniz Güvende</Text>
            <Text style={styles.safeBannerSub}>
              {nearestEq ? `En yakın deprem ${Math.round(nearestEq.km)} km uzakta` : 'Yakın çevrede deprem bulunmuyor'}
            </Text>
          </View>
          <TouchableOpacity onPress={checkSafety} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={18} color={Colors.success} />
          </TouchableOpacity>
        </View>
      )}
      {safetyStatus === 'risk' && (
        <View style={styles.riskBanner}>
          <View style={styles.riskBannerIcon}>
            <Ionicons name="warning-outline" size={20} color="#f97316" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.riskBannerTitle}>Risk Altındasınız</Text>
            <Text style={styles.safeBannerSub}>
              {nearestEq ? `${Math.round(nearestEq.km)} km yakınınızda M${nearestEq.eq.magnitude.toFixed(1)} deprem · ${nearestEq.eq.location}` : '400 km içinde deprem mevcut'}
            </Text>
          </View>
          <TouchableOpacity onPress={checkSafety} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={18} color="#f97316" />
          </TouchableOpacity>
        </View>
      )}
      {safetyStatus === 'critical' && (
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerIcon}>
            <Ionicons name="warning" size={20} color={Colors.critical} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBannerTitle}>Kritik Durum</Text>
            <Text style={styles.alertBannerSub}>
              {nearestEq ? `${Math.round(nearestEq.km)} km yakınınızda M${nearestEq.eq.magnitude.toFixed(1)} deprem · ${nearestEq.eq.location}` : '100 km içinde deprem mevcut'}
            </Text>
          </View>
          <TouchableOpacity onPress={checkSafety} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={18} color={Colors.critical} />
          </TouchableOpacity>
        </View>
      )}

      {/* Hızlı Aksiyonlar */}
      <Text style={styles.sectionLabel}>HIZLI AKSİYONLAR</Text>

      {/* SOS + İkili Kartlar */}
      <View style={styles.actionsGroup}>
        <TouchableOpacity style={styles.sosButton} activeOpacity={0.85} onPress={() => router.push({ pathname: '/(app)/(tabs)/report', params: { openCamera: Date.now().toString() } })}>
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
          <TouchableOpacity style={styles.actionCardBlue} activeOpacity={0.85} onPress={handleGoToSafeAreas}>
            <Ionicons name="location" size={28} color={Colors.primary} />
            <Text style={styles.actionCardTitle}>Toplanma{'\n'}Noktaları</Text>
            <Text style={styles.actionCardSub}>En yakın noktaları gör</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCardGreen} activeOpacity={0.85} onPress={handleGoToRoute}>
            <Ionicons name="git-branch-outline" size={28} color={Colors.success} />
            <Text style={[styles.actionCardTitle, { color: Colors.success }]}>Güvenli Rota</Text>
            <Text style={styles.actionCardSub}>Tahliye güzergahı</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AFAD Duyuruları */}
      <Text style={[styles.sectionLabel, { paddingHorizontal: Spacing.lg }]}>AFAD DUYURULARI</Text>
      <ScrollView
        style={styles.announcementScroll}
        contentContainerStyle={styles.announcementList}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      {/* Profil Modal */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            {/* Tutamaç */}
            <View style={styles.modalHandle} />

            {/* Avatar */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.fullName?.trim().charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* İsim & Rol */}
            <Text style={styles.profileName}>{user?.fullName ?? '—'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role ? ROLE_LABELS[user.role] : '—'}
              </Text>
            </View>

            {/* Bilgi satırları */}
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{user?.email ?? '—'}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{user?.phone ?? '—'}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </Text>
              </View>
            </View>

            {/* Çıkış Yap */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  announcementScroll: {
    flex: 1,
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

  // Profil Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0e2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.15)',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  roleBadge: {
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 24,
  },
  roleBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  infoList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  infoText: { fontSize: 14, color: Colors.text },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 14, paddingVertical: 14,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },

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

  // Risk banner
  riskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
  },
  riskBannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(249,115,22,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  riskBannerTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#f97316' },

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
