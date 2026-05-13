import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useMapStore } from '@/store/map.store';
import { teamService, MyTeam, ActiveTask, needTypeLabel } from '@/services/team.service';

// ── Yardımcılar ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  NGO_MANAGER:       'STK Yöneticisi',
  NGO_STAFF:         'STK Personeli',
  OFFICIAL_MANAGER:  'Resmi Yetkili',
  OFFICIAL_STAFF:    'Resmi Personel',
  OFFICIAL:          'Resmi Görevli',
  VOLUNTEER:         'Gönüllü',
};

const URGENCY_COLORS = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
const URGENCY_LABELS = ['', 'Düşük', 'Normal', 'Orta', 'Yüksek', 'Kritik'];

const TASK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ASSIGNED:  { label: 'Atandı',      color: '#a78bfa' },
  EN_ROUTE:  { label: 'Yolda',       color: '#38bdf8' },
  COMPLETED: { label: 'Tamamlandı',  color: '#22c55e' },
};

// ── Ana bileşen ──────────────────────────────────────────────────

export default function TeamScreen() {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const token        = useAuthStore((s) => s.tokens?.accessToken);
  const setPendingTaskNav = useMapStore((s) => s.setPendingTaskNav);

  const [team, setTeam]           = useState<MyTeam | null>(null);
  const [task, setTask]           = useState<ActiveTask | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [teamData, taskData] = await Promise.allSettled([
        teamService.getMyTeam(token),
        teamService.getMyTask(token),
      ]);

      if (teamData.status === 'fulfilled') setTeam(teamData.value);
      else setError('Ekip bilgisi alınamadı');

      if (taskData.status === 'fulfilled') setTask(taskData.value);
    } catch {
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGoToTask = () => {
    if (!task) return;
    setPendingTaskNav({
      taskId:          task.id,
      latitude:        task.latitude,
      longitude:       task.longitude,
      taskDescription: task.description ?? needTypeLabel(task.need_type),
    });
    router.push('/(app)/(tabs)/map');
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Üst gradyan */}
      <LinearGradient
        colors={['rgba(10,22,40,0.98)', 'rgba(10,22,40,0.9)', 'transparent']}
        style={[styles.topGradient, { height: insets.top + 80 }]}
        pointerEvents="none"
      />

      {/* Başlık */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ekibim</Text>
          {team && (
            <Text style={styles.headerSub}>
              {team.name} · {team.members.length} üye
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : error && !team ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* ── Ekip Kartı ── */}
          {team && (
            <View style={styles.teamCard}>
              <View style={styles.teamCardHeader}>
                <View style={styles.teamIconBg}>
                  <Ionicons name="shield" size={22} color="#a78bfa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.description ? (
                    <Text style={styles.teamDesc}>{team.description}</Text>
                  ) : null}
                </View>
                <View style={styles.taskBadge}>
                  <Text style={styles.taskBadgeNum}>{team.active_task_count}</Text>
                  <Text style={styles.taskBadgeLabel}>Aktif{'\n'}Görev</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Aktif Görev ── */}
          <Text style={styles.sectionTitle}>Aktif Görev</Text>
          {task ? (
            <View style={styles.taskCard}>
              {/* Üst: tür + aciliyet */}
              <View style={styles.taskTopRow}>
                <View style={styles.needTypeBadge}>
                  <Ionicons name="hand-left-outline" size={13} color={Colors.primary} />
                  <Text style={styles.needTypeText}>{needTypeLabel(task.need_type)}</Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[task.urgency_level] + '22', borderColor: URGENCY_COLORS[task.urgency_level] + '66' }]}>
                  <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[task.urgency_level] }]} />
                  <Text style={[styles.urgencyText, { color: URGENCY_COLORS[task.urgency_level] }]}>
                    {URGENCY_LABELS[task.urgency_level]}
                  </Text>
                </View>
                {task.assignment && (
                  <View style={[styles.statusBadge, { backgroundColor: (TASK_STATUS_LABELS[task.assignment.status]?.color ?? '#888') + '22' }]}>
                    <Text style={[styles.statusText, { color: TASK_STATUS_LABELS[task.assignment.status]?.color ?? '#888' }]}>
                      {TASK_STATUS_LABELS[task.assignment.status]?.label ?? task.assignment.status}
                    </Text>
                  </View>
                )}
              </View>

              {/* Açıklama */}
              {task.description ? (
                <Text style={styles.taskDesc}>{task.description}</Text>
              ) : null}

              {/* Kişi sayısı */}
              <View style={styles.taskMetaRow}>
                <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.taskMetaText}>{task.person_count} kişi ihtiyaç bildirdi</Text>
              </View>

              {/* Rota bilgisi */}
              {task.assignment && (
                <View style={styles.routeInfoRow}>
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="navigate-outline" size={14} color="#a78bfa" />
                    <Text style={styles.routeInfoText}>
                      {task.assignment.route_distance_km?.toFixed(1) ?? '—'} km
                    </Text>
                  </View>
                  <View style={styles.routeInfoDot} />
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="time-outline" size={14} color="#a78bfa" />
                    <Text style={styles.routeInfoText}>
                      {task.assignment.route_duration_minutes
                        ? `${Math.round(task.assignment.route_duration_minutes)} dk`
                        : '—'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Haritaya git butonu */}
              <TouchableOpacity style={styles.goToMapBtn} onPress={handleGoToTask} activeOpacity={0.85}>
                <Ionicons name="map" size={16} color="#fff" />
                <Text style={styles.goToMapBtnText}>Haritada Rotayı Görüntüle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Şu an aktif göreviniz yok</Text>
            </View>
          )}

          {/* ── Ekip Üyeleri ── */}
          <Text style={styles.sectionTitle}>Ekip Üyeleri</Text>
          {team?.members.length ? (
            <View style={styles.membersCard}>
              {team.members.map((member, idx) => (
                <View
                  key={member.user_id}
                  style={[
                    styles.memberRow,
                    idx < team.members.length - 1 && styles.memberRowBorder,
                  ]}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.full_name}</Text>
                    <Text style={styles.memberRole}>{ROLE_LABELS[member.role] ?? member.role}</Text>
                  </View>
                  {member.has_location && (
                    <View style={styles.locationBadge}>
                      <Ionicons name="locate" size={12} color={Colors.success} />
                      <Text style={styles.locationBadgeText}>Aktif</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Ekipte henüz üye yok</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Stiller ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    zIndex: 2,
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  headerSub:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  errorText:   { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: BorderRadius.xl, backgroundColor: Colors.primary,
  },
  retryBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  scroll: { padding: Spacing.md, gap: Spacing.md },

  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: 4,
  },

  // ── Ekip kartı
  teamCard: {
    backgroundColor: '#0e1f35',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  teamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  teamIconBg: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(167,139,250,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)',
  },
  teamName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  teamDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  taskBadge: { alignItems: 'center', paddingHorizontal: 10 },
  taskBadgeNum: { fontSize: 22, fontWeight: '800', color: '#a78bfa' },
  taskBadgeLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },

  // ── Aktif görev kartı
  taskCard: {
    backgroundColor: '#0e1f35',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
  },
  taskTopRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  needTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
  },
  needTypeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  urgencyDot: { width: 6, height: 6, borderRadius: 3 },
  urgencyText: { fontSize: FontSize.xs, fontWeight: '600' },
  statusBadge: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  taskDesc: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  taskMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  routeInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderRadius: BorderRadius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)',
  },
  routeInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeInfoDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  routeInfoText: { fontSize: FontSize.sm, fontWeight: '600', color: '#a78bfa' },

  goToMapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: '#7c3aed',
    borderRadius: BorderRadius.xl, paddingVertical: 13,
  },
  goToMapBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  // ── Boş durum
  emptyCard: {
    backgroundColor: '#0e1f35',
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  // ── Üye listesi
  membersCard: {
    backgroundColor: '#0e1f35',
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  memberRowBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  memberAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(6,182,212,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },
  memberAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  memberName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  memberRole: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  locationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
  },
  locationBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.success },
});
