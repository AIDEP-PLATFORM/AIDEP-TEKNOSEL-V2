import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const MAX_PHOTOS = 5;

const MOCK_PAST_REPORTS = [
  { id: '1', description: 'Bina cephesinde çatlak ve dökülme mevcut.', date: '12 May 2026', status: 'inceleniyor', photos: 2 },
  { id: '2', description: 'Zemin katta su baskını, yapısal hasar var.', date: '10 May 2026', status: 'onaylandı', photos: 3 },
];

const STATUS_COLOR: Record<string, string> = {
  inceleniyor: '#f59e0b',
  onaylandı: Colors.success,
  reddedildi: Colors.error,
};

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { openCamera } = useLocalSearchParams<{ openCamera?: string }>();
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDescription('');
      setPhotos([]);
      Alert.alert('Başarılı', 'Hasar raporunuz iletildi.');
    }, 1500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Başlık */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="warning" size={22} color={Colors.error} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Hasar Raporla</Text>
          <Text style={styles.headerSub}>Sahadan anlık hasar bildirimi yapın</Text>
        </View>
      </View>

      {/* Ana form kartı — tek kart içinde açıklama + fotoğraf */}
      <View style={styles.formCard}>

        {/* Açıklama */}
        <TextInput
          style={styles.textInput}
          placeholder={'Hasar durumunu detaylıca anlatın...\n(konum, şiddet seviyesi, tehlike durumu, acil ihtiyaçlar vb.)'}
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
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

        <Text style={styles.photoHintText}>📷  AI analizi için en az 1 fotoğraf eklemeniz önerilir</Text>

        {/* Seçilen fotoğraflar */}
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

        {/* Kamera / Galeri */}
        <View style={styles.photoButtons}>
          <TouchableOpacity style={[styles.photoBtn, { borderColor: Colors.primary }]} onPress={pickFromCamera} activeOpacity={0.8}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
            <Text style={[styles.photoBtnLabel, { color: Colors.primary }]}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.photoBtn, { borderColor: '#7c3aed' }]} onPress={pickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images" size={24} color="#7c3aed" />
            <Text style={[styles.photoBtnLabel, { color: '#7c3aed' }]}>Galeri</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gönder */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>{loading ? 'Gönderiliyor...' : 'Raporu Gönder'}</Text>
        {!loading && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />}
      </TouchableOpacity>

      {/* Geçmiş raporlar */}
      <Text style={styles.sectionTitle}>ÖNCEKİ RAPORLARIM</Text>

      <View style={styles.pastList}>
        {MOCK_PAST_REPORTS.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz rapor göndermediniz</Text>
          </View>
        ) : (
          MOCK_PAST_REPORTS.map((report, index) => (
            <View key={report.id}>
              <View style={styles.pastRow}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[report.status] ?? Colors.textMuted }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.pastTopLine}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[report.status] }]}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Text>
                    <Text style={styles.pastDate}>{report.date}</Text>
                  </View>
                  <Text style={styles.pastDesc} numberOfLines={1}>{report.description}</Text>
                  <View style={styles.pastMeta}>
                    <Ionicons name="image-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.pastMetaText}>{report.photos} fotoğraf</Text>
                  </View>
                </View>
              </View>
              {index < MOCK_PAST_REPORTS.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Form kartı
  formCard: {
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  textInput: {
    color: Colors.text, fontSize: FontSize.sm,
    minHeight: 100, lineHeight: 22,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },

  // Fotoğraf
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoTitleBar: { width: 3, height: 13, borderRadius: 2, backgroundColor: Colors.primary },
  photoTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  photoBadge: {
    backgroundColor: 'rgba(6,182,212,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },
  photoBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  photoHintText: { fontSize: FontSize.xs, color: Colors.textMuted },
  photoPreviewRow: { flexDirection: 'row', gap: 8 },
  photoThumb: { width: 66, height: 66, borderRadius: BorderRadius.md, position: 'relative' },
  photoThumbImg: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoButtons: { flexDirection: 'row', gap: Spacing.sm },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: BorderRadius.lg,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  photoBtnLabel: { fontSize: FontSize.md, fontWeight: '600' },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: 15,
  },
  submitBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  // Geçmiş
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 1,
  },
  pastList: {
    backgroundColor: 'rgba(14,33,55,0.9)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  pastRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.sm, padding: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  pastTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  pastDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  pastDesc: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20, marginBottom: 4 },
  pastMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  rowDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  emptyState: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
