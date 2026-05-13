import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { mapService, EarthquakePoint, SafeAreaPoint } from '@/services/map.service';

const FILTERS = [
  { key: 'hasar', label: 'Hasar', icon: 'warning-outline', color: Colors.error },
  { key: 'ekip', label: 'Ekip', icon: 'people-outline', color: Colors.primary },
  { key: 'toplanma', label: 'Toplanma', icon: 'location-outline', color: Colors.success },
  { key: 'guvenlirota', label: 'Güvenli Rota', icon: 'shield-outline', color: '#a78bfa' },
];

const TURKEY_REGION = {
  latitude: 37.871,
  longitude: 32.485,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [activeFilter, setActiveFilter] = useState('hasar');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earthquakes, setEarthquakes] = useState<EarthquakePoint[]>([]);
  const [safeAreas, setSafeAreas] = useState<SafeAreaPoint[]>([]);
  const [visibleRegion, setVisibleRegion] = useState(TURKEY_REGION);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coords);
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800);
      } catch {
        setLocationError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    mapService.getEarthquakes().then(setEarthquakes).catch(() => {});
    mapService.getSafeAreas().then(setSafeAreas).catch(() => {});
  }, []);

  const isZoomedIn = visibleRegion.latitudeDelta < 0.5;

  const visibleEarthquakes = useMemo(() => {
    if (!isZoomedIn) return earthquakes.slice(0, 50);
    return earthquakes.filter(eq =>
      Math.abs(eq.latitude - visibleRegion.latitude) < visibleRegion.latitudeDelta &&
      Math.abs(eq.longitude - visibleRegion.longitude) < visibleRegion.longitudeDelta
    );
  }, [earthquakes, visibleRegion, isZoomedIn]);

  const visibleSafeAreas = useMemo(() => {
    if (!isZoomedIn) {
      const step = Math.ceil(safeAreas.length / 25);
      return safeAreas.filter((_, i) => i % step === 0);
    }
    return safeAreas.filter(area =>
      Math.abs(area.latitude - visibleRegion.latitude) < visibleRegion.latitudeDelta &&
      Math.abs(area.longitude - visibleRegion.longitude) < visibleRegion.longitudeDelta
    );
  }, [safeAreas, visibleRegion, isZoomedIn]);

  const goToMyLocation = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {/* Harita */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : TURKEY_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setVisibleRegion}
      >
        {/* Deprem marker'ları */}
        {activeFilter === 'hasar' && visibleEarthquakes.map((eq) => (
          <Marker
            key={eq.event_id}
            coordinate={{ latitude: eq.latitude, longitude: eq.longitude }}
            title={eq.location}
            description={`M${eq.magnitude} · ${eq.depth}km derinlik`}
          >
            <View style={[styles.earthquakeMarker, {
              width: Math.max(16, eq.magnitude * 6),
              height: Math.max(16, eq.magnitude * 6),
              borderRadius: Math.max(8, eq.magnitude * 3),
            }]}>
              <Text style={styles.earthquakeMag}>{eq.magnitude.toFixed(1)}</Text>
            </View>
          </Marker>
        ))}

        {/* Toplanma alanı marker'ları */}
        {activeFilter === 'toplanma' && visibleSafeAreas.map((area) => (
          <Marker
            key={area.osm_id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.name ?? 'Toplanma Alanı'}
            description={area.capacity ? `Kapasite: ${area.capacity}` : undefined}
          >
            <View style={styles.safeAreaMarker}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
          </Marker>
        ))}

        {location && (
          <>
            <Circle
              center={location}
              radius={80}
              fillColor="rgba(6,182,212,0.15)"
              strokeColor="rgba(6,182,212,0.4)"
              strokeWidth={1}
            />
            <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.myLocationMarker}>
                <View style={styles.myLocationDot} />
              </View>
            </Marker>
          </>
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Üst gradyan overlay */}
      <LinearGradient
        colors={['rgba(10,22,40,0.95)', 'rgba(10,22,40,0.85)', 'rgba(10,22,40,0.5)', 'rgba(10,22,40,0.1)', 'transparent']}
        locations={[0, 0.4, 0.68, 0.88, 1]}
        style={[styles.topGradient, { height: insets.top + 200 }]}
        pointerEvents="none"
      />

      {/* Üst overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        {/* Başlık */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Deprem Haritası</Text>
            <Text style={styles.headerSub}>{earthquakes.length} deprem · {safeAreas.length} toplanma alanı</Text>
          </View>
          <TouchableOpacity style={styles.locBtn} onPress={goToMyLocation}>
            <Ionicons name="navigate" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filtre chipları */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: f.color, borderColor: f.color },
                ]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={f.icon as any}
                  size={14}
                  color={active ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.filterLabel, active && { color: '#fff', fontWeight: '700' }]}>
                  {f.label}
                </Text>
                {f.key === 'hasar' && earthquakes.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : Colors.error }]}>
                    <Text style={styles.badgeText}>{earthquakes.length}</Text>
                  </View>
                )}
                {f.key === 'toplanma' && safeAreas.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : Colors.success }]}>
                    <Text style={styles.badgeText}>{safeAreas.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Alt sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 8 }]}>
        {/* İstatistikler */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.statNum}>{earthquakes.length}</Text>
            <Text style={styles.statLabel}>Deprem</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.statNum}>{safeAreas.length}</Text>
            <Text style={styles.statLabel}>Toplanma</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.statNum, { color: Colors.success }]}>Aktif</Text>
            <Text style={styles.statLabel}>Konum</Text>
          </View>
        </View>

        {/* Mesafe bilgisi */}
        <View style={styles.distanceRow}>
          <Ionicons name="location-outline" size={16} color={Colors.primary} />
          <Text style={styles.distanceText}>
            OSRM entegrasyonu bekleniyor
          </Text>
        </View>

        {/* Navigasyon butonu */}
        <TouchableOpacity style={styles.navButton} activeOpacity={0.85} onPress={goToMyLocation}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.navButtonText}>Navigasyona Başla</Text>
        </TouchableOpacity>

        {locationError && (
          <Text style={styles.errorText}>Konum izni verilmedi. Harita Türkiye genelini gösteriyor.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Üst overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(6,182,212,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  locBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
  },

  // Filtreler
  filterRow: { gap: Spacing.xs, paddingRight: Spacing.md },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(10,22,40,0.6)',
    borderColor: Colors.border,
  },
  filterLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Deprem marker
  earthquakeMarker: {
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  earthquakeMag: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Toplanma alanı marker
  safeAreaMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },

  // Konum marker
  myLocationMarker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(6,182,212,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  myLocationDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // Alt sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,22,40,0.95)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statNum: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statDivider: { width: 1, height: 16, backgroundColor: Colors.border },

  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  distanceText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' },
  distanceSep: { color: Colors.textMuted },

  navButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#7c3aed',
    borderRadius: BorderRadius.xl, paddingVertical: 14,
  },
  navButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  errorText: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'center',
  },
});
