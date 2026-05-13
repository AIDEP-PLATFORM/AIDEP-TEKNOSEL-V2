import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Alert, TextInput,
} from 'react-native';
import MapView, {
  Marker, Circle, Polyline, Callout, PROVIDER_DEFAULT,
  type MapPressEvent,
} from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { mapService, EarthquakePoint, SafeAreaPoint, RouteData, RouteStep } from '@/services/map.service';
import { aiService } from '@/services/ai.service';
import { useAuthStore } from '@/store/auth.store';
import { DamageMapCell } from '@/types/ai.types';

// ── Sabitler ────────────────────────────────────────────────────

const FILTERS = [
  { key: 'hasar',       label: 'Hasar',        icon: 'warning-outline',   color: Colors.error },
  { key: 'ekip',        label: 'Ekip',          icon: 'people-outline',    color: Colors.primary },
  { key: 'toplanma',    label: 'Toplanma',      icon: 'location-outline',  color: Colors.success },
  { key: 'guvenlirota', label: 'Güvenli Rota',  icon: 'shield-outline',    color: '#a78bfa' },
];

const TURKEY_REGION = {
  latitude: 37.871, longitude: 32.485,
  latitudeDelta: 0.05, longitudeDelta: 0.05,
};

const STEP_ADVANCE_RADIUS_M = 35;

type RouteMode = 'idle' | 'selecting' | 'preview' | 'navigating';

type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };

// ── Yardımcı fonksiyonlar ────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function damageGridColor(score: number): string {
  if (score >= 0.75) return 'rgba(239,68,68,0.55)';
  if (score >= 0.5)  return 'rgba(249,115,22,0.5)';
  if (score >= 0.25) return 'rgba(234,179,8,0.45)';
  return 'rgba(34,197,94,0.4)';
}

function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)} dk`;
  return `${Math.floor(min / 60)} sa ${Math.round(min % 60)} dk`;
}

function maneuverIcon(maneuver: string, instruction: string): string {
  if (maneuver === 'arrive')     return 'flag';
  if (maneuver === 'depart')     return 'navigate';
  if (maneuver === 'roundabout' || maneuver === 'rotary') return 'sync-circle-outline';
  if (instruction.toLowerCase().includes('sağa'))  return 'arrow-forward-outline';
  if (instruction.toLowerCase().includes('sola'))  return 'arrow-back-outline';
  if (instruction.toLowerCase().includes('geri'))  return 'refresh-outline';
  return 'arrow-up-outline';
}

// ── Ana bileşen ──────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useAuthStore((s) => s.tokens?.accessToken);

  // Harita verisi
  const [activeFilter, setActiveFilter] = useState('hasar');
  const [location, setLocation]         = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [earthquakes, setEarthquakes]   = useState<EarthquakePoint[]>([]);
  const [safeAreas, setSafeAreas]       = useState<SafeAreaPoint[]>([]);
  const [damageGrid, setDamageGrid]     = useState<DamageMapCell[]>([]);
  const [visibleRegion, setVisibleRegion] = useState(TURKEY_REGION);

  // Adres arama durumu
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Navigasyon durumu
  const [routeMode, setRouteMode]       = useState<RouteMode>('idle');
  const [destination, setDestination]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute]               = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [navLocation, setNavLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [remainingKm, setRemainingKm]   = useState<number>(0);
  const [remainingMin, setRemainingMin] = useState<number>(0);

  // ── Konum izni + ilk konum ────────────────────────────────────

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
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      } catch {
        setLocationError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Harita verileri ───────────────────────────────────────────

  useEffect(() => {
    mapService.getEarthquakes().then(setEarthquakes).catch(() => {});
    mapService.getSafeAreas().then(setSafeAreas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    aiService.getDamageMap(token).then(setDamageGrid).catch(() => {});
  }, [token]);

  // ── Görünür marker'ları optimize et ──────────────────────────

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

  // ── Rota polyline koordinatları ───────────────────────────────

  const routeCoords = useMemo(() => {
    if (!route) return [];
    return route.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  }, [route]);

  // ── Nominatim adres arama ─────────────────────────────────────

  const searchAddress = async (q: string) => {
    if (q.length < 3) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=tr&format=json&limit=5&accept-language=tr`,
        { headers: { 'User-Agent': 'AIDEP/1.0' } },
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultPress = (result: NominatimResult) => {
    const dest = { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) };
    setSearchQuery('');
    setSearchResults([]);
    setDestination(dest);
    fetchRoute(dest);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  // ── Haritaya tıklama → varış noktası seç ─────────────────────

  const handleMapPress = async (e: MapPressEvent) => {
    if (routeMode !== 'selecting') return;
    const dest = e.nativeEvent.coordinate;
    setDestination(dest);
    await fetchRoute(dest);
  };

  // ── Rota hesapla ──────────────────────────────────────────────

  const fetchRoute = async (dest: { latitude: number; longitude: number }) => {
    if (!location || !token) return;
    setRouteLoading(true);
    setRouteMode('preview');
    try {
      const data = await mapService.getRoute(
        location.latitude, location.longitude,
        dest.latitude, dest.longitude,
        token,
      );
      setRoute(data);
      setRemainingKm(data.distance_km);
      setRemainingMin(data.duration_min);
      setCurrentStepIdx(0);

      // Rotayı haritada göster
      if (routeCoords.length > 0) {
        mapRef.current?.fitToCoordinates(
          [location, dest],
          { edgePadding: { top: 120, right: 40, bottom: 240, left: 40 }, animated: true },
        );
      }
    } catch {
      Alert.alert('Rota Hatası', 'Rota hesaplanamadı. OSRM servisi erişilemez olabilir.');
      setRouteMode('selecting');
      setDestination(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // ── Navigasyonu başlat ────────────────────────────────────────

  const startNavigation = async () => {
    if (!route || !location) return;
    setRouteMode('navigating');
    setNavLocation(location);

    // Yüksek hassasiyetli konum takibi
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (loc) => {
        const newPos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setNavLocation(newPos);

        // Kamerayı konuma takip ettir (Google Maps tarzı)
        mapRef.current?.animateCamera(
          {
            center: newPos,
            heading: loc.coords.heading ?? 0,
            pitch: 45,
            zoom: Platform.OS === 'android' ? 18 : undefined,
            altitude: Platform.OS === 'ios' ? 300 : undefined,
          } as any,
          { duration: 600 },
        );

        // Adım ilerletme
        setCurrentStepIdx((prev) => {
          if (!route || prev >= route.steps.length - 1) return prev;
          const nextStep = route.steps[prev + 1];
          const [sLon, sLat] = nextStep.location;
          const dist = haversineM(newPos.latitude, newPos.longitude, sLat, sLon);
          if (dist < STEP_ADVANCE_RADIUS_M) return prev + 1;
          return prev;
        });

        // Kalan mesafe/süre tahmini (hedefe düz mesafe + düzeltme)
        if (destination) {
          const distM = haversineM(newPos.latitude, newPos.longitude, destination.latitude, destination.longitude);
          setRemainingKm(parseFloat((distM / 1000 * 1.3).toFixed(1)));
          setRemainingMin(parseFloat((distM / 1000 * 1.3 / 50 * 60).toFixed(0)));
        }
      },
    );
    locationSubRef.current = sub;
  };

  // ── Navigasyonu bitir ─────────────────────────────────────────

  const stopNavigation = () => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    setRouteMode('idle');
    setRoute(null);
    setDestination(null);
    setNavLocation(null);
    setCurrentStepIdx(0);
    setActiveFilter('hasar');
    clearSearch();

    if (location) {
      mapRef.current?.animateCamera(
        { center: location, pitch: 0, heading: 0, zoom: 14 } as any,
        { duration: 600 },
      );
    }
  };

  // ── Güvenli Rota filtresi ─────────────────────────────────────

  const handleFilterPress = (key: string) => {
    if (key === 'guvenlirota') {
      if (routeMode !== 'idle') {
        stopNavigation();
      } else {
        setActiveFilter('guvenlirota');
        setRouteMode('selecting');
      }
    } else {
      if (routeMode !== 'idle') stopNavigation();
      setActiveFilter(key);
    }
  };

  const goToMyLocation = () => {
    const pos = navLocation ?? location;
    if (!pos || !mapRef.current) return;
    if (isNavigating) {
      mapRef.current.animateCamera(
        { center: pos, pitch: 45, zoom: Platform.OS === 'android' ? 18 : undefined, altitude: Platform.OS === 'ios' ? 300 : undefined } as any,
        { duration: 600 },
      );
    } else {
      mapRef.current.animateToRegion({ ...pos, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
    }
  };

  const currentStep: RouteStep | null = route?.steps[currentStepIdx] ?? null;
  const isNavigating = routeMode === 'navigating';
  const isSelecting  = routeMode === 'selecting';
  const isPreview    = routeMode === 'preview';

  // ── Render ────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── Harita ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={location ? { ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 } : TURKEY_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={isNavigating}
        toolbarEnabled={false}
        onRegionChangeComplete={setVisibleRegion}
        onPress={isSelecting ? handleMapPress : undefined}
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

        {/* AI hasar grid */}
        {activeFilter === 'hasar' && damageGrid.map((cell) => (
          <Circle
            key={cell.grid_cell_id}
            center={{ latitude: cell.latitude, longitude: cell.longitude }}
            radius={300}
            fillColor={damageGridColor(cell.aggregated_score)}
            strokeColor={cell.is_confirmed ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.2)'}
            strokeWidth={cell.is_confirmed ? 2 : 1}
          />
        ))}

        {/* Toplanma alanları — filtreden bağımsız, rota modunda da göster */}
        {(activeFilter === 'toplanma' || isPreview || isNavigating || isSelecting) && visibleSafeAreas.map((area) => (
          <Marker
            key={area.osm_id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.safeAreaMarker}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
            <Callout tooltip>
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>{area.name ?? 'Toplanma Alanı'}</Text>
                {area.capacity ? (
                  <Text style={styles.calloutSub}>Kapasite: {area.capacity} kişi</Text>
                ) : null}
                <Text style={styles.calloutTag}>🛡️ Güvenli Toplanma Noktası</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Kullanıcı konumu */}
        {(location || navLocation) && (() => {
          const pos = navLocation ?? location!;
          return (
            <>
              <Circle
                center={pos}
                radius={isNavigating ? 20 : 80}
                fillColor="rgba(6,182,212,0.15)"
                strokeColor="rgba(6,182,212,0.4)"
                strokeWidth={1}
              />
              <Marker coordinate={pos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={[styles.myLocationMarker, isNavigating && styles.myLocationMarkerNav]}>
                  <View style={styles.myLocationDot} />
                </View>
              </Marker>
            </>
          );
        })()}

        {/* Varış noktası marker */}
        {destination && (isPreview || isNavigating) && (
          <Marker coordinate={destination} title="Varış Noktası">
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Rota çizgisi */}
        {routeCoords.length > 0 && (isPreview || isNavigating) && (
          <>
            {/* Gölge çizgi */}
            <Polyline
              coordinates={routeCoords}
              strokeColor="rgba(0,0,0,0.3)"
              strokeWidth={8}
            />
            {/* Ana rota */}
            <Polyline
              coordinates={routeCoords}
              strokeColor={route && route.damage_score > 0 ? '#f97316' : '#a78bfa'}
              strokeWidth={5}
            />
          </>
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* ── Üst gradyan ── */}
      {!isNavigating && (
        <LinearGradient
          colors={['rgba(10,22,40,0.95)', 'rgba(10,22,40,0.85)', 'rgba(10,22,40,0.5)', 'rgba(10,22,40,0.1)', 'transparent']}
          locations={[0, 0.4, 0.68, 0.88, 1]}
          style={[styles.topGradient, { height: insets.top + 200 }]}
          pointerEvents="none"
        />
      )}

      {/* ── Üst overlay (normal mod) ── */}
      {!isNavigating && (
        <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="location" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isSelecting ? 'Varış Noktası Seç' : 'Deprem Haritası'}
              </Text>
              <Text style={styles.headerSub}>
                {isSelecting
                  ? 'Haritaya dokunarak varış noktasını seçin'
                  : `${earthquakes.length} deprem · ${safeAreas.length} toplanma · ${damageGrid.length} hasar bölgesi`
                }
              </Text>
            </View>
            {isSelecting ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRouteMode('idle'); setActiveFilter('hasar'); clearSearch(); }}>
                <Ionicons name="close" size={18} color={Colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.locBtn} onPress={goToMyLocation}>
                <Ionicons name="navigate" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Nominatim adres arama — sadece selecting modda */}
          {isSelecting && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Adres yaz... (veya haritaya dokun)"
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    searchDebounceRef.current = setTimeout(() => searchAddress(text), 400);
                  }}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={() => searchAddress(searchQuery)}
                />
                {searchLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {searchResults.length > 0 && (
                <ScrollView
                  style={styles.searchResultsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {searchResults.map((r) => (
                    <TouchableOpacity
                      key={r.place_id}
                      style={styles.searchResultItem}
                      onPress={() => handleSearchResultPress(r)}
                    >
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} style={{ marginTop: 1 }} />
                      <Text style={styles.searchResultText} numberOfLines={2}>{r.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Filtre chipları */}
          {!isSelecting && !isPreview && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = activeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
                    onPress={() => handleFilterPress(f.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={f.icon as any} size={14} color={active ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.filterLabel, active && { color: '#fff', fontWeight: '700' }]}>{f.label}</Text>
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
          )}
        </View>
      )}

      {/* ── Navigasyon: üst adım kartı ── */}
      {isNavigating && currentStep && (
        <View style={[styles.navStepCard, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navStepInner}>
            <View style={styles.navStepIcon}>
              <Ionicons name={maneuverIcon(currentStep.maneuver, currentStep.instruction) as any} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navStepInstruction}>{currentStep.instruction}</Text>
              {currentStep.street_name ? (
                <Text style={styles.navStepStreet}>{currentStep.street_name}</Text>
              ) : null}
            </View>
            <Text style={styles.navStepDist}>
              {currentStep.distance_m >= 1000
                ? `${(currentStep.distance_m / 1000).toFixed(1)} km`
                : `${currentStep.distance_m} m`}
            </Text>
          </View>
          {/* Sonraki adım önizleme */}
          {route && currentStepIdx < route.steps.length - 1 && (
            <View style={styles.navNextStep}>
              <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
              <Text style={styles.navNextStepText} numberOfLines={1}>
                Sonraki: {route.steps[currentStepIdx + 1].instruction}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Ortala butonu (rota önizleme + navigasyon) ── */}
      {(isPreview || isNavigating) && (
        <TouchableOpacity
          style={[styles.navLocBtn, { bottom: insets.bottom + (isNavigating ? 200 : 220) }]}
          onPress={goToMyLocation}
        >
          <Ionicons name="navigate" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* ── Alt sheet: normal mod ── */}
      {!isNavigating && !isSelecting && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 8 }]}>
          {isPreview && route ? (
            /* Rota önizleme */
            <>
              <View style={styles.routeInfoRow}>
                <View style={styles.routeInfoItem}>
                  <Ionicons name="navigate" size={16} color="#a78bfa" />
                  <Text style={styles.routeInfoValue}>{route.distance_km.toFixed(1)} km</Text>
                  <Text style={styles.routeInfoLabel}>Mesafe</Text>
                </View>
                <View style={styles.routeInfoDivider} />
                <View style={styles.routeInfoItem}>
                  <Ionicons name="time-outline" size={16} color="#a78bfa" />
                  <Text style={styles.routeInfoValue}>{formatDuration(route.duration_min)}</Text>
                  <Text style={styles.routeInfoLabel}>Süre</Text>
                </View>
                <View style={styles.routeInfoDivider} />
                <View style={styles.routeInfoItem}>
                  <Ionicons name="shield-outline" size={16} color={route.damage_score > 0 ? '#f97316' : Colors.success} />
                  <Text style={[styles.routeInfoValue, { color: route.damage_score > 0 ? '#f97316' : Colors.success }]}>
                    {route.damage_score > 0 ? 'Riskli' : 'Güvenli'}
                  </Text>
                  <Text style={styles.routeInfoLabel}>Güzergah</Text>
                </View>
              </View>
              <View style={styles.previewBtnRow}>
                <TouchableOpacity
                  style={styles.cancelRouteBtn}
                  onPress={() => { setRouteMode('selecting'); setRoute(null); setDestination(null); clearSearch(); }}
                >
                  <Text style={styles.cancelRouteBtnText}>Değiştir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.startNavBtn} onPress={startNavigation}>
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.startNavBtnText}>Başla</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : routeLoading ? (
            /* Rota hesaplanıyor */
            <View style={styles.routeLoadingRow}>
              <ActivityIndicator size="small" color="#a78bfa" />
              <Text style={styles.routeLoadingText}>Güvenli rota hesaplanıyor...</Text>
            </View>
          ) : (
            /* Normal istatistikler */
            <>
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
                  <View style={[styles.statDot, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.statNum}>{damageGrid.length}</Text>
                  <Text style={styles.statLabel}>Hasar Bölgesi</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.navButton}
                activeOpacity={0.85}
                onPress={() => handleFilterPress('guvenlirota')}
              >
                <Ionicons name="shield-outline" size={18} color="#fff" />
                <Text style={styles.navButtonText}>Güvenli Rota Oluştur</Text>
              </TouchableOpacity>
            </>
          )}
          {locationError && (
            <Text style={styles.errorText}>Konum izni verilmedi. Harita Türkiye genelini gösteriyor.</Text>
          )}
        </View>
      )}

      {/* ── Alt sheet: navigasyon modu ── */}
      {isNavigating && (
        <View style={[styles.navBottomSheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.navProgressRow}>
            <View style={styles.navProgressItem}>
              <Text style={styles.navProgressValue}>{remainingKm.toFixed(1)} km</Text>
              <Text style={styles.navProgressLabel}>Kalan mesafe</Text>
            </View>
            <View style={styles.navProgressDivider} />
            <View style={styles.navProgressItem}>
              <Text style={styles.navProgressValue}>{formatDuration(remainingMin)}</Text>
              <Text style={styles.navProgressLabel}>Tahmini süre</Text>
            </View>
            <View style={styles.navProgressDivider} />
            <View style={styles.navProgressItem}>
              <Text style={styles.navProgressValue}>
                {route ? `${currentStepIdx + 1}/${route.steps.length}` : '-'}
              </Text>
              <Text style={styles.navProgressLabel}>Adım</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.stopNavBtn} onPress={stopNavigation}>
            <Ionicons name="stop-circle-outline" size={18} color="#fff" />
            <Text style={styles.stopNavBtnText}>Navigasyonu Bitir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Stiller ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },

  topGradient: { position: 'absolute', top: 0, left: 0, right: 0 },

  // Üst overlay
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, gap: Spacing.sm, paddingHorizontal: Spacing.md },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
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
  cancelBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },

  // Filtreler
  filterRow: { gap: Spacing.xs, paddingRight: Spacing.md },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(10,22,40,0.6)', borderColor: Colors.border,
  },
  filterLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Marker'lar
  earthquakeMarker: {
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  earthquakeMag: { fontSize: 9, fontWeight: '700', color: '#fff' },
  safeAreaMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  myLocationMarker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(6,182,212,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  myLocationMarkerNav: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(6,182,212,0.4)',
    borderWidth: 3,
  },
  myLocationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  destinationMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#a78bfa',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  // Callout (toplanma alanı popup)
  calloutBox: {
    backgroundColor: '#0e1f35',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    gap: 4,
  },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  calloutSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  calloutTag:   { fontSize: 11, color: '#4ade80', marginTop: 2 },

  // Navigasyon — üst adım kartı
  navStepCard: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,22,40,0.97)',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    borderBottomWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  navStepInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  navStepIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  navStepInstruction: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, lineHeight: 22 },
  navStepStreet: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  navStepDist: { fontSize: FontSize.sm, fontWeight: '700', color: '#a78bfa', flexShrink: 0 },
  navNextStep: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 60 },
  navNextStepText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },

  // Navigasyon — konum butonu
  navLocBtn: {
    position: 'absolute', right: Spacing.md,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(10,22,40,0.9)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  // Alt sheet — normal
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,22,40,0.95)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.md,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statNum: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statDivider: { width: 1, height: 16, backgroundColor: Colors.border },
  navButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#7c3aed',
    borderRadius: BorderRadius.xl, paddingVertical: 14,
  },
  navButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  errorText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  // Rota yükleniyor
  routeLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  routeLoadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Rota önizleme
  routeInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  routeInfoItem: { alignItems: 'center', gap: 3 },
  routeInfoValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  routeInfoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  routeInfoDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  previewBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  cancelRouteBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: BorderRadius.xl, borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelRouteBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  startNavBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: '#7c3aed',
    borderRadius: BorderRadius.xl, paddingVertical: 13,
  },
  startNavBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  // Navigasyon — alt sheet
  navBottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,22,40,0.97)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
    padding: Spacing.lg, gap: Spacing.md,
  },
  navProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  navProgressItem: { alignItems: 'center', gap: 3 },
  navProgressValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  navProgressLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  navProgressDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  stopNavBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl, paddingVertical: 13,
  },
  stopNavBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  // Adres arama
  searchContainer: { gap: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(10,22,40,0.97)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, color: Colors.text,
    fontSize: FontSize.sm, paddingVertical: 0,
  },
  searchResultsList: {
    backgroundColor: 'rgba(10,22,40,0.97)',
    borderRadius: 12, maxHeight: 220,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchResultText: {
    flex: 1, fontSize: FontSize.xs, color: Colors.text, lineHeight: 16,
  },
});
