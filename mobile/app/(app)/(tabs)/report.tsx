import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Image, FlatList, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { aiService } from '@/services/ai.service';
import { useAuthStore } from '@/store/auth.store';
import { DamageDetectionResponse } from '@/types/ai.types';

const MAX_PHOTOS = 5;

type ReportItem = {
  id: string;
  description: string;
  photoUri: string | null;
  sentAt: Date;
  status: 'analyzing' | 'done' | 'error';
  aiResult: DamageDetectionResponse | null;
  errorMessage: string | null;
};

function damageScoreLabel(score: number): string {
  if (score >= 0.75) return 'Kritik Hasar';
  if (score >= 0.5) return 'Ağır Hasar';
  if (score >= 0.25) return 'Orta Hasar';
  return 'Hafif Hasar';
}

function damageScoreColor(score: number): string {
  if (score >= 0.75) return Colors.error;
  if (score >= 0.5) return '#f97316';
  if (score >= 0.25) return '#f59e0b';
  return Colors.success;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { openCamera } = useLocalSearchParams<{ openCamera?: string }>();
  const token = useAuthStore((s) => s.tokens?.accessToken);

  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const lastHandledCamera = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (openCamera && openCamera !== lastHandledCamera.current) {
        lastHandledCamera.current = openCamera;
        const timer = setTimeout(() => pickFromCamera(), 400);
        return () => clearTimeout(timer);
      }
    }, [openCamera])
  );

  const pickFromGallery = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  const pickFromCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermelisiniz.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen hasar durumunu açıklayın.');
      return;
    }
    if (!token) {
      Alert.alert('Oturum Hatası', 'Lütfen tekrar giriş yapın.');
      return;
    }

    setLoading(true);

    const newReport: ReportItem = {
      id: Date.now().toString(),
      description: description.trim(),
      photoUri: photos[0] ?? null,
      sentAt: new Date(),
      status: 'analyzing',
      aiResult: null,
      errorMessage: null,
    };

    setReports((prev) => [newReport, ...prev]);
    setDescription('');
    setPhotos([]);
    setLoading(false);

    // Arka planda AI analizi yap
    if (newReport.photoUri) {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        let latitude = 39.9255;
        let longitude = 32.8662;
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }

        const result = await aiService.analyzeDamage(newReport.photoUri, latitude, longitude, token);
        setReports((prev) =>
          prev.map((r) => r.id === newReport.id ? { ...r, status: 'done', aiResult: result } : r)
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        setReports((prev) =>
          prev.map((r) => r.id === newReport.id ? { ...r, status: 'error', errorMessage: msg } : r)
        );
      }
    } else {
      setReports((prev) =>
        prev.map((r) => r.id === newReport.id ? { ...r, status: 'done' } : r)
      );
    }
  };

  const renderReportItem = ({ item }: { item: ReportItem }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => item.status !== 'analyzing' && setSelectedReport(item)}
      activeOpacity={item.status === 'analyzing' ? 1 : 0.75}
    >
      <View style={styles.reportCardLeft}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.reportThumb} />
        ) : (
          <View style={[styles.reportThumb, styles.reportThumbPlaceholder]}>
            <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.reportCardBody}>
        <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.reportTime}>{formatTime(item.sentAt)}</Text>
      </View>

      <View style={styles.reportCardRight}>
        {item.status === 'analyzing' && (
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: '#f59e0b' }]}>İnceleniyor</Text>
          </View>
        )}
        {item.status === 'done' && item.aiResult && (
          <View style={[styles.statusBadge, { borderColor: 'rgba(6,182,212,0.3)', backgroundColor: 'rgba(6,182,212,0.08)' }]}>
            <Ionicons name="analytics" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: Colors.primary }]}>Sonuç</Text>
          </View>
        )}
        {item.status === 'done' && !item.aiResult && (
          <View style={[styles.statusBadge, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' }]}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.success} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: Colors.success }]}>İletildi</Text>
          </View>
        )}
        {item.status === 'error' && (
          <View style={[styles.statusBadge, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }]}>
            <Ionicons name="alert-circle" size={12} color={Colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: Colors.error }]}>Hata</Text>
          </View>
        )}
        {item.status !== 'analyzing' && (
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginTop: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Sabit üst bölüm ── */}
      <View style={styles.topSection}>
        {/* Başlık */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="warning" size={20} color={Colors.error} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Hasar Raporla</Text>
            <Text style={styles.headerSub}>Sahadan anlık hasar bildirimi yapın</Text>
          </View>
        </View>

        {/* Açıklama */}
        <View style={styles.formCard}>
          <TextInput
            style={styles.textInput}
            placeholder={'Hasar durumunu anlatın...\n(konum, şiddet, tehlike, acil ihtiyaçlar vb.)'}
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.divider} />

          {/* Fotoğraf başlık */}
          <View style={styles.photoHeader}>
            <View style={styles.photoTitleRow}>
              <View style={styles.photoTitleBar} />
              <Text style={styles.photoTitle}>FOTOĞRAF</Text>
            </View>
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{photos.length}/{MAX_PHOTOS}</Text>
            </View>
          </View>

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoPreviewRow}>
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoThumbImg} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.photoButtons}>
            <TouchableOpacity style={[styles.photoBtn, { borderColor: Colors.primary }]} onPress={pickFromCamera} activeOpacity={0.8}>
              <Ionicons name="camera" size={20} color={Colors.primary} />
              <Text style={[styles.photoBtnLabel, { color: Colors.primary }]}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoBtn, { borderColor: '#7c3aed' }]} onPress={pickFromGallery} activeOpacity={0.8}>
              <Ionicons name="images" size={20} color="#7c3aed" />
              <Text style={[styles.photoBtnLabel, { color: '#7c3aed' }]}>Galeri</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gönder butonu */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Raporu Gönder</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* ── Rapor listesi ── */}
      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <View style={styles.photoTitleRow}>
            <View style={[styles.photoTitleBar, { backgroundColor: Colors.primary }]} />
            <Text style={styles.listHeaderTitle}>GÖNDERİLEN RAPORLAR</Text>
          </View>
          {reports.length > 0 && (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{reports.length}</Text>
            </View>
          )}
        </View>

        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Henüz rapor gönderilmedi</Text>
            </View>
          }
        />
      </View>

      {/* ── AI Sonuç Modalı ── */}
      <Modal
        visible={selectedReport !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={18} color={Colors.primary} />
              <Text style={styles.modalTitle}>AI Analiz Sonucu</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedReport?.status === 'error' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorBoxText}>{selectedReport.errorMessage}</Text>
              </View>
            )}

            {selectedReport?.aiResult && (
              <>
                {selectedReport.aiResult.is_confirmed && (
                  <View style={styles.confirmedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
                    <Text style={styles.confirmedBadgeText}>Doğrulandı</Text>
                  </View>
                )}

                <View style={styles.aiScoreRow}>
                  <View style={styles.aiScoreItem}>
                    <Text style={styles.aiScoreLabel}>Bina Hasarı</Text>
                    <Text style={[styles.aiScoreValue, { color: damageScoreColor(selectedReport.aiResult.building_damage_score) }]}>
                      {damageScoreLabel(selectedReport.aiResult.building_damage_score)}
                    </Text>
                    <Text style={styles.aiScorePercent}>
                      %{Math.round(selectedReport.aiResult.building_damage_score * 100)}
                    </Text>
                  </View>
                  <View style={styles.aiScoreDivider} />
                  <View style={styles.aiScoreItem}>
                    <Text style={styles.aiScoreLabel}>Yol Hasarı</Text>
                    <Text style={[styles.aiScoreValue, { color: damageScoreColor(selectedReport.aiResult.road_damage_score) }]}>
                      {damageScoreLabel(selectedReport.aiResult.road_damage_score)}
                    </Text>
                    <Text style={styles.aiScorePercent}>
                      %{Math.round(selectedReport.aiResult.road_damage_score * 100)}
                    </Text>
                  </View>
                </View>

                {selectedReport.aiResult.detections.length > 0 && (
                  <View style={styles.detectionsRow}>
                    <Ionicons name="search" size={12} color={Colors.textMuted} />
                    <Text style={styles.detectionsText}>
                      {selectedReport.aiResult.detections.length} nesne:{' '}
                      {[...new Set(selectedReport.aiResult.detections.map((d) => d.class_name))].join(', ')}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.modalDesc}>
              <Text style={styles.modalDescLabel}>Açıklama</Text>
              <Text style={styles.modalDescText}>{selectedReport?.description}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Üst sabit bölüm ──
  topSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 38, height: 38, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  formCard: {
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  textInput: {
    color: Colors.text, fontSize: FontSize.sm,
    minHeight: 70, lineHeight: 20,
  },
  divider: { height: 1, backgroundColor: Colors.border },

  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoTitleBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: Colors.primary },
  photoTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  photoBadge: {
    backgroundColor: 'rgba(6,182,212,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },
  photoBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  photoPreviewRow: { flexDirection: 'row', gap: 8 },
  photoThumb: { width: 56, height: 56, borderRadius: BorderRadius.md, position: 'relative' },
  photoThumbImg: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoButtons: { flexDirection: 'row', gap: Spacing.sm },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  photoBtnLabel: { fontSize: FontSize.sm, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: 13,
  },
  submitBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  // ── Liste bölümü ──
  listSection: { flex: 1, paddingTop: Spacing.sm },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  listHeaderTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  listContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },

  reportCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  reportCardLeft: {},
  reportThumb: {
    width: 52, height: 52, borderRadius: BorderRadius.md,
  },
  reportThumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  reportCardBody: { flex: 1, gap: 3 },
  reportDesc: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 18 },
  reportTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  reportCardRight: { alignItems: 'flex-end', gap: 2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0e1f35',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  modalClose: { padding: 4 },

  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
  },
  confirmedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  aiScoreRow: { flexDirection: 'row', alignItems: 'center' },
  aiScoreItem: { flex: 1, alignItems: 'center', gap: 4 },
  aiScoreDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  aiScoreLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  aiScoreValue: { fontSize: FontSize.md, fontWeight: '700' },
  aiScorePercent: { fontSize: FontSize.xs, color: Colors.textSecondary },

  detectionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detectionsText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },

  modalDesc: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm, gap: 4,
  },
  modalDescLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  modalDescText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: BorderRadius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBoxText: { fontSize: FontSize.sm, color: Colors.error, flex: 1 },
});
