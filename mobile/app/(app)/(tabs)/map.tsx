import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Alert, TextInput,
} from 'react-native';
import MapView, {
  Marker, Circle, Polyline, Callout, PROVIDER_DEFAULT,
  type MapPressEvent,
} from 'react-native-maps';
// Circle kullanıcı konumu için hâlâ kullanılıyor
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import ScreenTransition from '@/components/ScreenTransition';
import { mapService, EarthquakePoint, SafeAreaPoint, RouteData, RouteStep, AlternativeRoute } from '@/services/map.service';
import { aiService } from '@/services/ai.service';
import { useAuthStore } from '@/store/auth.store';
import { useMapStore } from '@/store/map.store';
import { useDamageStore } from '@/store/damage.store';
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

/**
 * Bir noktanın (px,py) bir çizgi segmentine (ax,ay)-(bx,by) olan
 * minimum mesafesini metre cinsinden döner.
 * Koordinatlar derece, hesaplama düzlemsel yaklaşım (kısa mesafeler için yeterli).
 */
function pointToSegmentM(
  plat: number, plon: number,
  alat: number, alon: number,
  blat: number, blon: number,
): number {
  // Metre cinsine çevir (yaklaşık)
  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos(plat * Math.PI / 180);

  const px = plon * metersPerDegLon;
  const py = plat * metersPerDegLat;
  const ax = alon * metersPerDegLon;
  const ay = alat * metersPerDegLat;
  const bx = blon * metersPerDegLon;
  const by = blat * metersPerDegLat;

  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Bir rota (coords dizisi) ile bir hasar hücresi arasındaki
 * minimum mesafeyi metre cinsinden döner.
 */
function minDistRouteToCell(
  coords: { latitude: number; longitude: number }[],
  cellLat: number, cellLon: number,
): number {
  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentM(
      cellLat, cellLon,
      coords[i].latitude, coords[i].longitude,
      coords[i + 1].latitude, coords[i + 1].longitude,
    );
    if (d < minDist) minDist = d;
  }
  // Son nokta için de kontrol et
  if (coords.length > 0)
    minDist = Math.min(minDist, haversineM(cellLat, cellLon, coords[coords.length - 1].latitude, coords[coords.length - 1].longitude));
  return minDist;
}

// Eşikler area_score formülüne (road×0.7 + bldg×0.3) göre ayarlandı:
// yol_yikilmis(1.0)×0.7 = 0.70 → kırmızı
// yol_cok_hasarli(0.8)×0.7 = 0.56 → kırmızı
// yol_orta_hasarli(0.5)×0.7 = 0.35 → turuncu
function damageGridColor(score: number): string {
  if (score >= 0.5)  return 'rgba(239,68,68,0.80)';   // kritik  → kırmızı
  if (score >= 0.3)  return 'rgba(249,115,22,0.75)';  // riskli  → turuncu
  if (score >= 0.1)  return 'rgba(234,179,8,0.72)';   // hafif   → sarı
  return 'rgba(34,197,94,0.68)';                       // güvenli → yeşil
}

function damageGridStroke(score: number): string {
  if (score >= 0.5)  return '#ef4444';
  if (score >= 0.3)  return '#f97316';
  if (score >= 0.1)  return '#eab308';
  return '#22c55e';
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
  const localDamageReports = useDamageStore((s) => s.reports);
  const pendingTaskNav    = useMapStore((s) => s.pendingTaskNav);
  const setPendingTaskNav = useMapStore((s) => s.setPendingTaskNav);
  const pendingFilter     = useMapStore((s) => s.pendingFilter);
  const setPendingFilter  = useMapStore((s) => s.setPendingFilter);

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

  // Seçili toplanma alanı (bilgi kartı)
  const [selectedSafeArea, setSelectedSafeArea] = useState<SafeAreaPoint | null>(null);

  // Navigasyon durumu
  const [routeMode, setRouteMode]       = useState<RouteMode>('idle');
  const [destination, setDestination]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute]               = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [userWaypoints, setUserWaypoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
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
        // visibleRegion'ı da güncelle ki marker filtreleri doğru çalışsın
        setVisibleRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
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

  // Harita her odaklandığında damage grid'i yenile (yeni raporlar görünsün)
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      aiService.getDamageMap(token).then(setDamageGrid).catch(() => {});
    }, [token])
  );

  // ── Ana ekrandan gelen filtre isteği ─────────────────────────
  useEffect(() => {
    if (!pendingFilter) return;
    setActiveFilter(pendingFilter);
    if (pendingFilter === 'guvenlirota') setRouteMode('selecting');
    setPendingFilter(null);
  }, [pendingFilter]);

  // ── Ekibim tab'ından gelen görev navigasyonu ──────────────────
  useEffect(() => {
    if (!pendingTaskNav || !location) return;
    // Store'u hemen temizle (tekrar tetiklenmesin)
    setPendingTaskNav(null);
    const dest = { latitude: pendingTaskNav.latitude, longitude: pendingTaskNav.longitude };
    setDestination(dest);
    setActiveFilter('guvenlirota');
    setRouteMode('selecting');
    // Kısa gecikme sonra rota hesapla (konum state settle olsun)
    setTimeout(() => fetchRoute(dest), 200);
  }, [pendingTaskNav, location]);

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
    // Görünür bölgedeki alanları filtrele
    const deltaLat = Math.max(visibleRegion.latitudeDelta, 0.15);
    const deltaLon = Math.max(visibleRegion.longitudeDelta, 0.15);

    const inView = safeAreas.filter(area =>
      Math.abs(area.latitude - visibleRegion.latitude) < deltaLat &&
      Math.abs(area.longitude - visibleRegion.longitude) < deltaLon
    );

    // Android performansı için max 80 marker
    if (inView.length <= 80) return inView;
    const step = Math.ceil(inView.length / 80);
    return inView.filter((_, i) => i % step === 0);
  }, [safeAreas, visibleRegion]);

  // ── Rota polyline koordinatları ───────────────────────────────

  const routeCoords = useMemo(() => {
    if (!route) return [];
    return route.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  }, [route]);

  // ── Frontend hasar kontrolü: rota koordinatları ↔ güncel hasar hücreleri ──
  const routeDamageCheck = useMemo(() => {
    if (!route || routeCoords.length === 0) return { isRisky: false, count: 0, safeAltIdx: -1 };

    // 1) Frontend kontrolü — haritadaki anlık hücrelerle karşılaştır
    const allCells = [
      ...damageGrid.map(c => ({ lat: c.latitude, lon: c.longitude })),
      ...localDamageReports.map(r => ({ lat: r.coordinates.latitude, lon: r.coordinates.longitude })),
    ];

    // Segment bazlı kontrol: geometri noktaları seyrek olsa bile
    // rota çizgisinin hasar hücresine olan minimum mesafeyi hesapla
    const DAMAGE_RADIUS_M = 180;
    let hitCount = 0;
    if (allCells.length > 0) {
      for (const cell of allCells) {
        if (minDistRouteToCell(routeCoords, cell.lat, cell.lon) <= DAMAGE_RADIUS_M)
          hitCount++;
      }
    }
    // Kaç hasar hücresi rotaya yakın? En az 1 tanesi yeterliyse riskli say
    const frontendHit = hitCount > 0;

    // 2) Backend kontrolü — fallback olarak (damage grid henüz yüklenmediyse yakalar)
    const backendRatio = route.geometry.length > 0 ? route.damage_score / route.geometry.length : 0;

    // İkisinden biri tetiklenirse riskli say
    const isRisky = frontendHit || backendRatio > 0.15;

    // 3) En güvenli alternatifi bul — segment bazlı kontrol
    let safeAltIdx = -1;
    if (isRisky && route.alternatives && route.alternatives.length > 0) {
      route.alternatives.forEach((alt, idx) => {
        const altCoords = alt.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
        // Bu alternatif herhangi bir hasar hücresine yakın mı?
        const altHit = allCells.some(
          cell => minDistRouteToCell(altCoords, cell.lat, cell.lon) <= DAMAGE_RADIUS_M
        );
        // Backend fallback
        const altBackendRatio = alt.geometry.length > 0 ? alt.damage_score / alt.geometry.length : 0;
        const altRisky = altHit || altBackendRatio > 0.15;
        // İlk güvenli alternatifi seç
        if (!altRisky && safeAltIdx === -1) safeAltIdx = idx;
      });
    }

    return { isRisky, count: hitCount, safeAltIdx };
  }, [route, routeCoords, damageGrid, localDamageReports]);

  // ── Hasarlı + alternatif yok → hedefe ~200m yakın güvenli nokta ara ────
  const [nearbySafeRoute, setNearbySafeRoute] = useState<{
    coord: { latitude: number; longitude: number };
    routeData: RouteData;
  } | null>(null);
  const [searchingNearbySafe, setSearchingNearbySafe] = useState(false);

  useEffect(() => {
    if (!routeDamageCheck.isRisky || routeDamageCheck.safeAltIdx >= 0 || !destination || !location || !token) {
      setNearbySafeRoute(null);
      return;
    }

    const allCells = [
      ...damageGrid.map(c => ({ lat: c.latitude, lon: c.longitude })),
      ...localDamageReports.map(r => ({ lat: r.coordinates.latitude, lon: r.coordinates.longitude })),
    ];

    // ~200m offset (Türkiye enlemleri için yaklaşık)
    const D = 0.0018;
    const candidates = [
      { latitude: destination.latitude + D,            longitude: destination.longitude },
      { latitude: destination.latitude - D,            longitude: destination.longitude },
      { latitude: destination.latitude,                longitude: destination.longitude + D },
      { latitude: destination.latitude,                longitude: destination.longitude - D },
      { latitude: destination.latitude + D * 0.7,      longitude: destination.longitude + D * 0.7 },
      { latitude: destination.latitude + D * 0.7,      longitude: destination.longitude - D * 0.7 },
      { latitude: destination.latitude - D * 0.7,      longitude: destination.longitude + D * 0.7 },
      { latitude: destination.latitude - D * 0.7,      longitude: destination.longitude - D * 0.7 },
    ].filter(c =>
      // Adayın kendisi hasar bölgesinde olmasın
      !allCells.some(cell => haversineM(c.latitude, c.longitude, cell.lat, cell.lon) <= 200)
    );

    let cancelled = false;
    const find = async () => {
      setSearchingNearbySafe(true);
      setNearbySafeRoute(null);
      for (const candidate of candidates.slice(0, 3)) {
        if (cancelled) break;
        try {
          const data = await mapService.getRoute(
            location.latitude, location.longitude,
            candidate.latitude, candidate.longitude,
            token, [],
          );
          if (cancelled) break;
          const coords = data.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
          const hit = allCells.some(cell => minDistRouteToCell(coords, cell.lat, cell.lon) <= 180);
          const backendRatio = data.geometry.length > 0 ? data.damage_score / data.geometry.length : 0;
          if (!hit && backendRatio <= 0.15) {
            setNearbySafeRoute({ coord: candidate, routeData: data });
            break;
          }
        } catch { /* bu adayı atla */ }
      }
      if (!cancelled) setSearchingNearbySafe(false);
    };
    find();
    return () => { cancelled = true; };
  }, [
    routeDamageCheck.isRisky, routeDamageCheck.safeAltIdx,
    destination?.latitude, destination?.longitude,
    damageGrid, localDamageReports, token,
  ]);

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
    const coord = e.nativeEvent.coordinate;
    if (isAddingWaypoint) {
      // Sadece yola yakın noktalara izin ver
      const snapped = await mapService.nearestRoad(coord.latitude, coord.longitude, token!);
      if (!snapped) {
        Alert.alert('Yol Bulunamadı', 'Lütfen bir yol üzerine dokunun.');
        return;
      }
      const updatedWaypoints = [...userWaypoints, snapped];
      setUserWaypoints(updatedWaypoints);
      setIsAddingWaypoint(false);
      if (destination) await fetchRoute(destination, updatedWaypoints);
      return;
    }
    if (routeMode !== 'selecting') return;
    setDestination(coord);
    await fetchRoute(coord);
  };

  // ── Rota hesapla ──────────────────────────────────────────────

  const fetchRoute = async (
    dest: { latitude: number; longitude: number },
    wps?: { latitude: number; longitude: number }[],
  ) => {
    if (!location || !token) return;
    setRouteLoading(true);
    setRouteMode('preview');
    const waypointsToUse = wps ?? userWaypoints;
    try {
      const data = await mapService.getRoute(
        location.latitude, location.longitude,
        dest.latitude, dest.longitude,
        token,
        waypointsToUse,
      );
      setRoute(data);
      setRemainingKm(data.distance_km);
      setRemainingMin(data.duration_min);
      setCurrentStepIdx(0);
      // Rota çekildikten hemen sonra damage grid'i yenile (hasar kontrolü güncel olsun)
      if (token) aiService.getDamageMap(token).then(setDamageGrid).catch(() => {});

      // Tüm rotayı gösterecek şekilde haritayı büyüt
      const allCoords = data.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
      mapRef.current?.fitToCoordinates(
        allCoords.length > 0 ? allCoords : [location, dest],
        { edgePadding: { top: 140, right: 50, bottom: 280, left: 50 }, animated: true },
      );
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

    // Konuma odaklan
    mapRef.current?.animateCamera(
      {
        center: location,
        heading: 0,
        pitch: 45,
        zoom: Platform.OS === 'android' ? 18 : undefined,
        altitude: Platform.OS === 'ios' ? 300 : undefined,
      } as any,
      { duration: 800 },
    );

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
    setUserWaypoints([]);
    setIsAddingWaypoint(false);
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
    <ScreenTransition style={styles.container} slideAmount={0}>
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
        onRegionChangeComplete={(region) => setVisibleRegion(region)}
        onPress={(isSelecting || isAddingWaypoint) ? handleMapPress : undefined}
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

        {/* AI hasar grid — hasar filtresi veya güvenli rota modunda göster */}
        {(activeFilter === 'hasar' || activeFilter === 'guvenlirota' || isPreview || isNavigating) && damageGrid.map((cell) => (
          <Circle
            key={cell.grid_cell_id}
            center={{ latitude: cell.latitude, longitude: cell.longitude }}
            radius={40}
            fillColor={damageGridColor(cell.aggregated_score)}
            strokeColor={damageGridStroke(cell.aggregated_score)}
            strokeWidth={2.5}
          />
        ))}

        {/* Yerel hasar raporu daireleri — AI işleyene kadar geçici gösterim */}
        {(activeFilter === 'hasar' || activeFilter === 'guvenlirota' || isPreview || isNavigating) && localDamageReports
          .filter(r => !damageGrid.some(
            cell => Math.abs(cell.latitude - r.coordinates.latitude) < 0.001 &&
                    Math.abs(cell.longitude - r.coordinates.longitude) < 0.001
          ))
          .map((report) => (
            <Circle
              key={`local-${report.id}`}
              center={{ latitude: report.coordinates.latitude, longitude: report.coordinates.longitude }}
              radius={40}
              fillColor="rgba(249,115,22,0.72)"
              strokeColor="#f97316"
              strokeWidth={2.5}
            />
          ))}

        {/* Toplanma alanları */}
        {(activeFilter === 'toplanma' || isPreview || isNavigating || isSelecting) && visibleSafeAreas.map((area) => (
          <Marker
            key={area.osm_id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            pinColor="#22c55e"
            tracksViewChanges={false}
            onPress={() => setSelectedSafeArea(area)}
          />
        ))}

        {/* Kullanıcı konumu */}
        {(location || navLocation) && (() => {
          const pos = navLocation ?? location!;
          return (
            <>
              {/* Hassasiyet halkası — sadece normal modda */}
              {!isNavigating && (
                <Circle
                  center={pos}
                  radius={80}
                  fillColor="rgba(91,33,182,0.10)"
                  strokeColor="rgba(91,33,182,0.3)"
                  strokeWidth={1}
                />
              )}

              <Marker coordinate={pos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.myLocationMarker}>
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

        {/* Yakın güvenli rota — hasarlı + alternatif yok durumunda */}
        {nearbySafeRoute && (isPreview || isNavigating) && (() => {
          const coords = nearbySafeRoute.routeData.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
          return (
            <>
              {/* Rota çizgisi — mor kesik */}
              <Polyline coordinates={coords} strokeColor="rgba(124,58,237,0.3)" strokeWidth={8} lineDashPattern={[8,5]} />
              <Polyline coordinates={coords} strokeColor="#7c3aed" strokeWidth={4} lineDashPattern={[8,5]} />
              {/* Hedef marker */}
              <Marker coordinate={nearbySafeRoute.coord} tracksViewChanges={false}>
                <View style={styles.safeNearbyMarker}>
                  <Ionicons name="shield-checkmark" size={15} color="#fff" />
                </View>
              </Marker>
            </>
          );
        })()}

        {/* Kullanıcı ara durak marker'ları */}
        {userWaypoints.map((wp, idx) => (
          <Marker
            key={`wp-${idx}`}
            coordinate={wp}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => {
              const updated = userWaypoints.filter((_, i) => i !== idx);
              setUserWaypoints(updated);
              if (destination) fetchRoute(destination, updated);
            }}
          >
            <View collapsable={false} style={styles.waypointMarker}>
              <Text style={styles.waypointMarkerText}>{idx + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Alternatif rotalar — şeffaf, hafif border görünümü */}
        {(isPreview || isNavigating) && route?.alternatives?.map((alt, idx) => {
          const altCoords = alt.geometry.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
          // Segment bazlı hasar kontrolü (ana rota ile aynı yöntem)
          const allDamageCells = [
            ...damageGrid.map(c => ({ lat: c.latitude, lon: c.longitude })),
            ...localDamageReports.map(r => ({ lat: r.coordinates.latitude, lon: r.coordinates.longitude })),
          ];
          const altFrontendHit = allDamageCells.some(
            cell => minDistRouteToCell(altCoords, cell.lat, cell.lon) <= 180
          );
          const altBackendRatio = alt.geometry.length > 0 ? alt.damage_score / alt.geometry.length : 0;
          const isDamaged = altFrontendHit || altBackendRatio > 0.15;
          return (
            <React.Fragment key={`alt-${idx}`}>
              {/* Mor dış çizgi (border) */}
              <Polyline
                coordinates={altCoords}
                strokeColor={isDamaged ? '#ef4444' : '#7c3aed'}
                strokeWidth={7}
                tappable
                onPress={() => {
                  const newRoute: RouteData = {
                    ...alt,
                    steps: route.steps,
                    alternatives: [
                      {
                        distance_km: route.distance_km,
                        duration_min: route.duration_min,
                        geometry: route.geometry,
                        damage_score: route.damage_score,
                      },
                      ...route.alternatives!.filter((_, i) => i !== idx),
                    ],
                  };
                  setRoute(newRoute);
                  setRemainingKm(alt.distance_km);
                  setRemainingMin(alt.duration_min);
                }}
              />
              {/* Açık iç dolgu */}
              <Polyline
                coordinates={altCoords}
                strokeColor={isDamaged ? 'rgba(254,202,202,0.75)' : 'rgba(233,213,255,0.75)'}
                strokeWidth={4}
              />
            </React.Fragment>
          );
        })}

        {/* Konumdan rota başlangıcına kesik bağlantı çizgisi */}
        {routeCoords.length > 0 && (isPreview || isNavigating) && (location || navLocation) && (() => {
          const userPos = navLocation ?? location!;
          const routeStart = routeCoords[0];
          const dlat = Math.abs(userPos.latitude - routeStart.latitude);
          const dlon = Math.abs(userPos.longitude - routeStart.longitude);
          // Kullanıcı rota başlangıcından uzaktaysa kesik çizgi göster (~50m eşik)
          if (dlat < 0.0005 && dlon < 0.0005) return null;
          return (
            <Polyline
              coordinates={[userPos, routeStart]}
              strokeColor="rgba(124,58,237,0.5)"
              strokeWidth={2.5}
              lineDashPattern={[6, 5]}
            />
          );
        })()}

        {/* Ana rota — kalın, düz, opak */}
        {routeCoords.length > 0 && (isPreview || isNavigating) && (
          <>
            {/* Gölge */}
            <Polyline
              coordinates={routeCoords}
              strokeColor="rgba(0,0,0,0.5)"
              strokeWidth={9}
            />
            {/* Ana renk — tam opak, Google Maps tarzı */}
            {(() => {
              const mainDamaged = routeDamageCheck.isRisky;
              return (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={mainDamaged ? '#dc2626' : '#5b21b6'}
                  strokeWidth={6}
                />
              );
            })()}
          </>
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* ── Toplanma alanı bilgi kartı ── */}
      {selectedSafeArea && (
        <View style={styles.safeAreaCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: Colors.success, borderRadius: 20, padding: 6 }}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safeAreaCardTitle}>{selectedSafeArea.name ?? 'Toplanma Alanı'}</Text>
              {selectedSafeArea.capacity ? (
                <Text style={styles.safeAreaCardSub}>Kapasite: {selectedSafeArea.capacity} kişi</Text>
              ) : (
                <Text style={styles.safeAreaCardSub}>Güvenli Toplanma Noktası</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedSafeArea(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
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
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
          {isPreview && route ? (
            /* Rota önizleme */
            <>
              {/* İstatistik + uyarı + butonlar tek kompakt blok */}
              <View style={styles.routeInfoRow}>
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoValue}>{route.distance_km.toFixed(1)} km</Text>
                  <Text style={styles.routeInfoLabel}>Mesafe</Text>
                </View>
                <View style={styles.routeInfoDivider} />
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoValue}>{formatDuration(route.duration_min)}</Text>
                  <Text style={styles.routeInfoLabel}>Süre</Text>
                </View>
                <View style={styles.routeInfoDivider} />
                <View style={styles.routeInfoItem}>
                  <Ionicons name="shield-outline" size={14} color={routeDamageCheck.isRisky ? '#f97316' : Colors.success} />
                  <Text style={[styles.routeInfoValue, { color: routeDamageCheck.isRisky ? '#f97316' : Colors.success }]}>
                    {routeDamageCheck.isRisky ? 'Riskli' : 'Güvenli'}
                  </Text>
                  <Text style={styles.routeInfoLabel}>Güzergah</Text>
                </View>
              </View>
              {/* Riskli uyarı */}
              {routeDamageCheck.isRisky && (
                <>
                  <View style={[styles.riskyRouteBanner, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }]}>
                    <Ionicons name="warning" size={13} color="#ef4444" />
                    <Text style={[styles.riskyRouteBannerText, { flex: 1, color: '#ef4444' }]}>
                      Rota hasarlı bölgeden geçiyor!
                    </Text>
                    {routeDamageCheck.safeAltIdx >= 0 && route?.alternatives && (
                      <TouchableOpacity
                        onPress={() => {
                          const alt = route.alternatives![routeDamageCheck.safeAltIdx];
                          const newRoute: RouteData = {
                            ...alt,
                            steps: route.steps,
                            alternatives: [
                              { distance_km: route.distance_km, duration_min: route.duration_min, geometry: route.geometry, damage_score: route.damage_score },
                              ...route.alternatives!.filter((_, i) => i !== routeDamageCheck.safeAltIdx),
                            ],
                          };
                          setRoute(newRoute);
                          setRemainingKm(alt.distance_km);
                          setRemainingMin(alt.duration_min);
                        }}
                        style={styles.safeAltBtn}
                      >
                        <Ionicons name="shield-checkmark" size={12} color="#fff" />
                        <Text style={styles.safeAltBtnText}>Güvenli Rotaya Geç</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Alternatif yok → hedefe ~200m yakın güvenli nokta öner */}
                  {routeDamageCheck.safeAltIdx === -1 && (
                    <View style={styles.safeNearbyBanner}>
                      <Ionicons
                        name={searchingNearbySafe ? 'sync' : nearbySafeRoute ? 'shield-checkmark' : 'close-circle'}
                        size={13}
                        color={nearbySafeRoute ? '#7c3aed' : '#6b7280'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.safeNearbyTitle}>
                          {searchingNearbySafe
                            ? 'Yakın güvenli nokta aranıyor...'
                            : nearbySafeRoute
                              ? 'Hedefe ~200m yakın güvenli nokta bulundu'
                              : 'Yakın güvenli nokta bulunamadı'}
                        </Text>
                        {nearbySafeRoute && (
                          <Text style={styles.safeNearbySubtitle}>
                            {`${(nearbySafeRoute.routeData.distance_km).toFixed(1)} km · ${Math.round(nearbySafeRoute.routeData.duration_min)} dk`}
                          </Text>
                        )}
                      </View>
                      {nearbySafeRoute && (
                        <TouchableOpacity
                          style={styles.safeAltBtn}
                          onPress={() => {
                            setDestination(nearbySafeRoute.coord);
                            setRoute(nearbySafeRoute.routeData);
                            setRemainingKm(nearbySafeRoute.routeData.distance_km);
                            setRemainingMin(nearbySafeRoute.routeData.duration_min);
                            setNearbySafeRoute(null);
                          }}
                        >
                          <Ionicons name="navigate" size={12} color="#fff" />
                          <Text style={styles.safeAltBtnText}>Oraya Git</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
              {/* Durak bilgi satırı — sadece durak varsa */}
              {userWaypoints.length > 0 && (
                <View style={styles.waypointInfoRow}>
                  <Ionicons name="location" size={13} color="#f59e0b" />
                  <Text style={styles.waypointInfoText}>
                    {userWaypoints.length} durak eklendi
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setUserWaypoints([]); if (destination) fetchRoute(destination, []); }}
                  >
                    <Text style={styles.waypointClearText}>Temizle</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Ana buton satırı: Durak | Değiştir | Başla */}
              <View style={styles.previewBtnRow}>
                <TouchableOpacity
                  style={[styles.addWaypointBtn, isAddingWaypoint && styles.addWaypointBtnActive]}
                  onPress={() => setIsAddingWaypoint(v => !v)}
                >
                  <Ionicons name="add-circle-outline" size={15} color={isAddingWaypoint ? '#a78bfa' : Colors.textSecondary} />
                  <Text style={[styles.addWaypointBtnText, isAddingWaypoint && { color: '#a78bfa' }]}>
                    {isAddingWaypoint ? 'Dokun' : 'Durak'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelRouteBtn}
                  onPress={() => { setRouteMode('selecting'); setRoute(null); setDestination(null); setUserWaypoints([]); clearSearch(); }}
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
    </ScreenTransition>
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
  damageCircleMarker: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2.5,
  },
  localDamageCircleMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(249,115,22,0.45)',
    borderWidth: 2.5, borderColor: '#f97316',
  },
  damageDot: { width: 8, height: 8, borderRadius: 4 },

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
    backgroundColor: 'rgba(91,33,182,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#5b21b6',
  },
  myLocationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5b21b6' },

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

  safeAreaCard: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#0e1f35',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  safeAreaCardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  safeAreaCardSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

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
    position: 'absolute', bottom: -4, left: 0, right: 0,
    backgroundColor: 'rgba(10,22,40,0.97)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm,
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
  routeInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 2 },
  routeInfoItem: { alignItems: 'center', gap: 2 },
  routeInfoValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  routeInfoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  routeInfoDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  riskyRouteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  riskyRouteBannerText: { fontSize: 11, color: '#f97316', flex: 1 },
  safeAltBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#16a34a',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  safeAltBtnText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  safeNearbyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    marginTop: 4,
  },
  safeNearbyTitle: { fontSize: 11, color: '#7c3aed', fontWeight: '700' },
  safeNearbySubtitle: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  safeNearbyMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  waypointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waypointBtnGroup: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  waypointInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  waypointInfoText: { flex: 1, fontSize: FontSize.xs, color: '#f59e0b', fontWeight: '500' },
  waypointClearText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  addWaypointBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border,
  },
  addWaypointBtnActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)' },
  addWaypointBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  clearWaypointsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  clearWaypointsBtnText: { fontSize: 12, color: Colors.error },
  waypointMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  waypointMarkerText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  previewBtnRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  cancelRouteBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: BorderRadius.xl, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center',
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
