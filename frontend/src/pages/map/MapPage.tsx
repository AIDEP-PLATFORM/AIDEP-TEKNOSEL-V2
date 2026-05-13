import {
  Box, Button, ButtonGroup, Flex, Heading, Spinner, Stack, Text,
} from '@chakra-ui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { getRole } from '@/utils/auth'
import {
  apiGetEarthquakes, apiGetSafeAreas, apiGetTeams, apiGetActiveRoutes, apiGetMapRequests,
  type Earthquake, type SafeArea, type TeamLocation, type ActiveRoute, type ActiveRequestForMap,
} from '@/services/mapService'
import { apiCalculateRoute, type RouteCalculationResult } from '@/services/requestService'

type LayerKey = 'earthquakes' | 'safeAreas' | 'teams' | 'routes' | 'requests'
const MANAGER_ROLES = ['ADMIN', 'NGO_MANAGER', 'OFFICIAL_MANAGER']
const NEED_LABELS_MAP: Record<string, string> = {
  RESCUE: 'Kurtarma', MEDICAL: 'Medikal', SHELTER: 'Barınak', FOOD: 'Gıda', OTHER: 'Diğer',
}
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'

const USER_LOCATION_ICON = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;width:20px;height:20px;border-radius:50%;
        background:rgba(99,102,241,0.25);border:2px solid rgba(99,102,241,0.5);
        animation:aidep-pulse 2s infinite;
      "></div>
      <div style="
        width:10px;height:10px;border-radius:50%;
        background:#818cf8;border:2px solid white;
        box-shadow:0 0 8px #818cf8;position:relative;z-index:1;
      "></div>
    </div>
    <style>
      @keyframes aidep-pulse {
        0%   { transform:scale(1);   opacity:0.8; }
        70%  { transform:scale(2.2); opacity:0;   }
        100% { transform:scale(1);   opacity:0;   }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function magColor(mag: number) {
  if (mag >= 6) return '#f87171'
  if (mag >= 5) return '#fb923c'
  if (mag >= 4) return '#fbbf24'
  return '#a3e635'
}
function magRadius(mag: number) { return Math.max(6, mag * 4) }
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return iso }
}

export default function MapPage() {
  const role = getRole()
  const canSeeTeams = MANAGER_ROLES.includes(role ?? '')

  const [earthquakes,   setEarthquakes]   = useState<Earthquake[]>([])
  const [safeAreas,     setSafeAreas]     = useState<SafeArea[]>([])
  const [teams,         setTeams]         = useState<TeamLocation[]>([])
  const [activeRoutes,      setActiveRoutes]      = useState<ActiveRoute[]>([])
  const [activeMapRequests, setActiveMapRequests] = useState<ActiveRequestForMap[]>([])
  const [selectedMapRequest, setSelectedMapRequest] = useState<ActiveRequestForMap | null>(null)
  const [mapLiveRoute,      setMapLiveRoute]      = useState<RouteCalculationResult | null>(null)
  const [mapRouteLoading,   setMapRouteLoading]   = useState(false)
  const [mapRouteError,     setMapRouteError]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [lightMode,  setLightMode]  = useState(false)
  const [eqSort,     setEqSort]     = useState<'time' | 'mag'>('time')
  const [selectedEq, setSelectedEq] = useState<Earthquake | null>(null)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    earthquakes: true, safeAreas: true, teams: canSeeTeams, routes: canSeeTeams, requests: canSeeTeams,
  })

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<L.Map | null>(null)
  const tileRef   = useRef<L.TileLayer | null>(null)
  const eqRef     = useRef<L.LayerGroup | null>(null)
  const saRef     = useRef<L.LayerGroup | null>(null)
  const tmRef     = useRef<L.LayerGroup | null>(null)
  const rtRef          = useRef<L.LayerGroup | null>(null)
  const reqRef         = useRef<L.LayerGroup | null>(null)
  const liveRouteMapRef = useRef<L.LayerGroup | null>(null)
  const userLocRef     = useRef<L.Marker | null>(null)
  const tileSwapReady = useRef(false)

  // ── Init map (once, survive StrictMode) ─────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if ((el as any)._leaflet_id) {
      mapRef.current?.remove()
      mapRef.current = null
      delete (el as any)._leaflet_id
    }

    const map = L.map(el, { center: [39.0, 35.0], zoom: 6, zoomControl: true })

    const tile = L.tileLayer(TILE_DARK, {
      attribution: '&copy; CARTO &copy; OSM',
      maxZoom: 19,
      subdomains: 'abcd',
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(map)

    tileRef.current  = tile
    eqRef.current         = L.layerGroup().addTo(map)
    saRef.current         = L.layerGroup().addTo(map)
    rtRef.current         = L.layerGroup().addTo(map)
    tmRef.current         = L.layerGroup().addTo(map)
    reqRef.current        = L.layerGroup().addTo(map)
    liveRouteMapRef.current = L.layerGroup().addTo(map)
    mapRef.current        = map

    requestAnimationFrame(() => {
      requestAnimationFrame(() => map.invalidateSize())
    })

    tileSwapReady.current = true

    return () => {
      tileSwapReady.current = false
      map.remove()
      mapRef.current = null
      tileRef.current        = null
      eqRef.current          = null
      saRef.current          = null
      tmRef.current          = null
      rtRef.current          = null
      reqRef.current         = null
      liveRouteMapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile on theme toggle ────────────────────────────────────
  useEffect(() => {
    if (!tileSwapReady.current) return
    const map = mapRef.current
    const old = tileRef.current
    if (!map) return
    if (old) map.removeLayer(old)
    const next = L.tileLayer(lightMode ? TILE_LIGHT : TILE_DARK, {
      attribution: '&copy; CARTO &copy; OSM',
      maxZoom: 19,
      subdomains: 'abcd',
      tileSize: 512,
      zoomOffset: -1,
    })
    next.setZIndex(0)
    next.addTo(map)
    tileRef.current = next
  }, [lightMode])

  // ── Load data ────────────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    if (!canSeeTeams) return
    try { setTeams(await apiGetTeams()) } catch { /* teams unavailable */ }
    try { setActiveRoutes(await apiGetActiveRoutes()) } catch { /* routes unavailable */ }
    try { setActiveMapRequests(await apiGetMapRequests()) } catch { /* requests unavailable */ }
  }, [canSeeTeams])

  useEffect(() => {
    ;(async () => {
      setLoading(true); setError('')
      try {
        const [eq, sa] = await Promise.all([apiGetEarthquakes(), apiGetSafeAreas()])
        setEarthquakes(eq); setSafeAreas(sa)
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? 'Harita verisi yüklenemedi.')
      } finally {
        setLoading(false)
      }
      await loadRoutes()
    })()
  }, [canSeeTeams, loadRoutes])

  // ── 30s auto-refresh rotalar için ───────────────────────────────
  useEffect(() => {
    if (!canSeeTeams) return
    const interval = setInterval(loadRoutes, 30_000)
    return () => clearInterval(interval)
  }, [canSeeTeams, loadRoutes])

  // ── Earthquake markers ───────────────────────────────────────────
  useEffect(() => {
    const layer = eqRef.current; if (!layer) return
    layer.clearLayers()
    if (!layers.earthquakes) return
    earthquakes.forEach(eq => {
      L.circleMarker([eq.latitude, eq.longitude], {
        radius: magRadius(eq.magnitude),
        color: magColor(eq.magnitude), fillColor: magColor(eq.magnitude),
        fillOpacity: 0.55, weight: 1.5,
      }).bindPopup(`
        <b style="color:#fb923c">M${eq.magnitude.toFixed(1)}</b><br/>
        ${eq.location}<br/>
        <span style="color:#888">Derinlik: ${eq.depth} km · ${fmtTime(eq.time)}</span>
      `).addTo(layer)
    })
  }, [earthquakes, layers.earthquakes])

  // ── Safe area markers ────────────────────────────────────────────
  useEffect(() => {
    const layer = saRef.current; if (!layer) return
    layer.clearLayers()
    if (!layers.safeAreas) return
    safeAreas.forEach(sa => {
      L.circleMarker([sa.latitude, sa.longitude], {
        radius: 8, color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.4, weight: 2,
      }).bindPopup(`
        <b style="color:#4ade80">${sa.name ?? 'Toplanma Alanı'}</b><br/>
        <span style="color:#888">${sa.type}${sa.capacity ? ' · Kapasite: ' + sa.capacity : ''}</span>
      `).addTo(layer)
    })
  }, [safeAreas, layers.safeAreas])

  // ── Team markers ─────────────────────────────────────────────────
  useEffect(() => {
    const layer = tmRef.current; if (!layer) return
    layer.clearLayers()
    if (!layers.teams || !canSeeTeams) return
    teams.forEach(t => {
      L.circleMarker([t.latitude, t.longitude], {
        radius: 7, color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.6, weight: 2,
      }).bindPopup(`
        <b style="color:#60a5fa">${t.name}</b><br/>
        ${t.organization}<br/>
        <span style="color:#888">${t.role} · ${fmtTime(t.last_updated)}</span>
      `).addTo(layer)
    })
  }, [teams, layers.teams, canSeeTeams])

  // ── Active request markers (clickable, pulsing) ──────────────────
  useEffect(() => {
    const layer = reqRef.current; if (!layer) return
    layer.clearLayers()
    if (!layers.requests || !canSeeTeams) return

    const NEED_LABELS: Record<string, string> = {
      RESCUE: 'Kurtarma', MEDICAL: 'Medikal', SHELTER: 'Barınak',
      FOOD: 'Gıda', OTHER: 'Diğer',
    }

    activeMapRequests.forEach(req => {
      const uc = req.urgencyLevel >= 4 ? '#f87171' : req.urgencyLevel >= 3 ? '#fb923c' : '#fbbf24'
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:24px;height:24px;border-radius:50%;
              background:${uc}33;border:2px solid ${uc}88;animation:aidep-pulse 1.8s infinite;"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:${uc};
              border:2px solid white;box-shadow:0 0 8px ${uc};position:relative;z-index:1;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      L.marker([req.latitude, req.longitude], { icon })
        .on('click', () => {
          setSelectedMapRequest(req)
          setMapLiveRoute(null)
          setMapRouteError('')
          mapRef.current?.panTo([req.latitude, req.longitude])
        })
        .bindTooltip(`${NEED_LABELS[req.needType] ?? req.needType} · ${req.personCount} kişi`, {
          direction: 'top', offset: [0, -14],
        })
        .addTo(layer)
    })
  }, [activeMapRequests, layers.requests, canSeeTeams])

  // ── Live route polyline on map ────────────────────────────────────
  useEffect(() => {
    const layer = liveRouteMapRef.current; if (!layer) return
    layer.clearLayers()
    if (!mapLiveRoute) return

    const latlngs: L.LatLngTuple[] = mapLiveRoute.geometry.map(([lon, lat]) => [lat, lon])
    if (latlngs.length === 0) return

    L.polyline(latlngs, { color: '#fb923c', weight: 5, opacity: 0.92 }).addTo(layer)

    const originIcon = L.divIcon({
      className: '',
      html: `<div style="width:12px;height:12px;border-radius:50%;background:#818cf8;border:2px solid white;box-shadow:0 0 8px #818cf8;"></div>`,
      iconSize: [12, 12], iconAnchor: [6, 6],
    })
    L.marker([mapLiveRoute.origin.lat, mapLiveRoute.origin.lon], { icon: originIcon })
      .bindPopup('<b style="color:#818cf8">Başlangıç Konumunuz</b>')
      .addTo(layer)

    if (mapRef.current && latlngs.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] })
    }
  }, [mapLiveRoute])

  // ── Active route polylines ───────────────────────────────────────
  useEffect(() => {
    const layer = rtRef.current; if (!layer) return
    layer.clearLayers()
    if (!layers.routes || !canSeeTeams) return

    const NEED_LABELS: Record<string, string> = {
      RESCUE: 'Kurtarma', MEDICAL: 'Medikal', SHELTER: 'Barınak',
      FOOD: 'Gıda', OTHER: 'Diğer',
    }

    activeRoutes.forEach(route => {
      const isEnRoute = route.assignmentStatus === 'EN_ROUTE'
      const color     = isEnRoute ? '#fb923c' : '#fbbf24'
      const dashArray = isEnRoute ? undefined : '8, 6'

      // [[lon,lat]] → [[lat,lon]] için Leaflet
      const latlngs: L.LatLngTuple[] = route.geometry.map(([lon, lat]) => [lat, lon])
      if (latlngs.length === 0) return

      L.polyline(latlngs, {
        color, weight: isEnRoute ? 4 : 3,
        opacity: 0.85, dashArray,
      }).bindPopup(`
        <b style="color:${color}">${isEnRoute ? '🚐 Yolda' : '📋 Atandı'} — ${NEED_LABELS[route.needType] ?? route.needType}</b><br/>
        <span style="color:#aaa">Mesafe: ${route.distanceKm.toFixed(1)} km · ~${Math.round(route.durationMin)} dk</span>
      `).addTo(layer)

      // Başlangıç noktası (ekip konumu)
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:9px;height:9px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 5px ${color};"></div>`,
        iconSize: [9, 9], iconAnchor: [4, 4],
      })
      L.marker(latlngs[0], { icon: startIcon }).addTo(layer)

      // Hedef marker (talep konumu)
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:11px;height:11px;border-radius:50%;background:#f87171;border:2px solid white;box-shadow:0 0 6px #f87171;"></div>`,
        iconSize: [11, 11], iconAnchor: [5, 5],
      })
      L.marker([route.destLat, route.destLon], { icon: destIcon })
        .bindPopup(`<b style="color:#f87171">Talep Konumu</b><br/><span style="color:#aaa">${NEED_LABELS[route.needType] ?? route.needType}</span>`)
        .addTo(layer)
    })
  }, [activeRoutes, layers.routes, canSeeTeams])

  // ── User location ────────────────────────────────────────────────
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Tarayıcınız konum desteklemiyor.')
      return
    }
    setLocLoading(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        setLocLoading(false)
        mapRef.current?.flyTo([lat, lng], 13, { duration: 1.4 })
      },
      () => {
        setLocError('Konum alınamadı. Tarayıcı iznini kontrol edin.')
        setLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Calculate route from browser location ───────────────────────
  const handleMapCalculateRoute = () => {
    if (!selectedMapRequest) return
    if (!navigator.geolocation) {
      setMapRouteError('Tarayıcınız konum desteklemiyor.')
      return
    }
    setMapRouteLoading(true)
    setMapRouteError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const result = await apiCalculateRoute(
            selectedMapRequest.id,
            pos.coords.latitude,
            pos.coords.longitude,
          )
          setMapLiveRoute(result)
        } catch {
          setMapRouteError('Rota hesaplanamadı.')
        } finally {
          setMapRouteLoading(false)
        }
      },
      () => {
        setMapRouteError('Konum alınamadı. Tarayıcı iznini kontrol edin.')
        setMapRouteLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Draw / update user location marker ──────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (userLocRef.current) {
      map.removeLayer(userLocRef.current)
      userLocRef.current = null
    }
    if (!userLocation) return
    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: USER_LOCATION_ICON })
      .bindPopup(`
        <b style="color:#818cf8">Aktif Konumunuz</b><br/>
        <span style="color:#888">${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</span>
      `)
      .addTo(map)
    userLocRef.current = marker
  }, [userLocation])

  const toggle = (k: LayerKey) => setLayers(p => ({ ...p, [k]: !p[k] }))

  const selectEq = (eq: Earthquake) => {
    setSelectedEq(eq)
    mapRef.current?.flyTo([eq.latitude, eq.longitude], 9, { duration: 1.2 })
  }

  const sortedEqs = [...earthquakes].sort((a, b) =>
    eqSort === 'mag'
      ? b.magnitude - a.magnitude
      : new Date(b.time).getTime() - new Date(a.time).getTime()
  )

  const light = lightMode
  const panelBg     = light ? '#f8fafc'  : 'rgba(8,9,26,0.85)'
  const panelBorder = light ? '#e2e8f0'  : 'rgba(255,255,255,0.08)'
  const textMuted   = light ? '#64748b'  : 'rgba(255,255,255,0.4)'
  const textFaint   = light ? '#94a3b8'  : 'rgba(255,255,255,0.3)'
  const txtMain     = light ? '#0f172a'  : 'white'

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* Header */}
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={4}>
        <Box>
          <Heading size="lg" color="white" fontWeight="800">Harita</Heading>
          <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={0.5}>
            Depremler · Toplanma Alanları{canSeeTeams ? ' · Ekipler · Aktif Rotalar' : ''}
          </Text>
        </Box>
        <Flex align="center" gap={2} flexWrap="wrap">
          {/* Aktif konum butonu */}
          <Button
            size="sm"
            onClick={goToMyLocation}
            isLoading={locLoading}
            loadingText="Konum alınıyor..."
            bg={userLocation ? 'rgba(129,140,248,0.18)' : 'rgba(255,255,255,0.05)'}
            color={userLocation ? '#818cf8' : 'rgba(255,255,255,0.55)'}
            border={`1px solid ${userLocation ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.1)'}`}
            borderRadius="lg" fontWeight="600" fontSize="xs"
            _hover={{ opacity: 0.85 }}
            leftIcon={<Box w={2} h={2} borderRadius="full" bg={userLocation ? '#818cf8' : 'rgba(255,255,255,0.3)'} />}
          >
            {userLocation ? 'Konumundasınız' : '📍 Konumumu Göster'}
          </Button>

          {/* Theme toggle */}
          <Button
            size="sm"
            onClick={() => setLightMode(m => !m)}
            bg={light ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)'}
            color={light ? '#1a1a2e' : 'rgba(255,255,255,0.55)'}
            border={`1px solid ${light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'}`}
            borderRadius="lg" fontWeight="600" fontSize="xs"
            _hover={{ opacity: 0.85 }}
          >
            {light ? '☀️  Açık Tema' : '🌙  Koyu Tema'}
          </Button>

          <ButtonGroup size="sm" spacing={2}>
            <LayerBtn active={layers.earthquakes} color="#fb923c"
              onClick={() => toggle('earthquakes')} label={`Depremler (${earthquakes.length})`} />
            <LayerBtn active={layers.safeAreas} color="#4ade80"
              onClick={() => toggle('safeAreas')} label={`Toplanma (${safeAreas.length})`} />
            {canSeeTeams && (
              <LayerBtn active={layers.teams} color="#60a5fa"
                onClick={() => toggle('teams')} label={`Ekipler (${teams.length})`} />
            )}
            {canSeeTeams && (
              <LayerBtn active={layers.routes} color="#fb923c"
                onClick={() => toggle('routes')} label={`Rotalar (${activeRoutes.length})`} />
            )}
            {canSeeTeams && (
              <LayerBtn active={layers.requests} color="#f87171"
                onClick={() => toggle('requests')} label={`Talepler (${activeMapRequests.length})`} />
            )}
          </ButtonGroup>
        </Flex>
      </Flex>

      {/* Map wrapper */}
      <Box
        borderRadius="2xl" overflow="hidden"
        border={`1px solid ${panelBorder}`}
        position="relative"
        style={{ height: 'calc(100vh - 350px)', minHeight: '360px' }}
      >
        {/* Loading overlay */}
        {loading && (
          <Flex position="absolute" inset={0} zIndex={1000}
            align="center" justify="center"
            bg="rgba(8,9,26,0.8)" backdropFilter="blur(8px)">
            <Stack align="center" spacing={3}>
              <Spinner size="xl" color="#f97316" thickness="3px" />
              <Text color="rgba(255,255,255,0.5)" fontSize="sm">Harita verisi yükleniyor...</Text>
            </Stack>
          </Flex>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <Flex position="absolute" inset={0} zIndex={1000}
            align="center" justify="center" direction="column" gap={3}
            bg="rgba(8,9,26,0.9)">
            <Text color="#f87171" fontSize="sm" fontWeight="600">{error}</Text>
            <Button size="sm" colorScheme="orange" variant="outline"
              onClick={() => window.location.reload()}>Yeniden Dene</Button>
          </Flex>
        )}

        {/* Konum hatası */}
        {locError && (
          <Box position="absolute" top={4} left="50%" transform="translateX(-50%)" zIndex={1000}
            bg="rgba(248,113,113,0.15)" border="1px solid rgba(248,113,113,0.4)"
            borderRadius="xl" px={4} py={2} backdropFilter="blur(12px)">
            <Text fontSize="xs" color="#f87171" fontWeight="600">{locError}</Text>
          </Box>
        )}

        {/* Leaflet container */}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Selected request panel */}
        {selectedMapRequest && (
          <Box
            position="absolute" top={4} right={4} zIndex={1001}
            w="270px"
            bg={panelBg} backdropFilter="blur(16px)"
            border={`1px solid ${panelBorder}`} borderRadius="2xl"
            maxH="calc(100% - 32px)" overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.15)', borderRadius: '3px' },
            }}
          >
            {/* Panel header */}
            <Flex align="center" justify="space-between" px={4} pt={4} pb={3}
              borderBottom={`1px solid ${panelBorder}`}>
              <Box>
                <Text fontSize="xs" fontWeight="700" color={txtMain}>
                  {NEED_LABELS_MAP[selectedMapRequest.needType] ?? selectedMapRequest.needType}
                </Text>
                <Text fontSize="10px" color={textFaint} mt={0.5}>
                  {selectedMapRequest.personCount} kişi · Aciliyet {selectedMapRequest.urgencyLevel}/5
                </Text>
              </Box>
              <Button size="xs" variant="ghost"
                color={textMuted} onClick={() => { setSelectedMapRequest(null); setMapLiveRoute(null) }}
                minW={0} px={1.5} _hover={{ color: '#f87171' }}>✕</Button>
            </Flex>

            {/* Status badge */}
            <Box px={4} py={3} borderBottom={`1px solid ${panelBorder}`}>
              <Flex gap={2} align="center">
                <Box w={2} h={2} borderRadius="full"
                  bg={selectedMapRequest.assignmentStatus === 'EN_ROUTE' ? '#fb923c' : '#fbbf24'} />
                <Text fontSize="11px" color={selectedMapRequest.assignmentStatus === 'EN_ROUTE' ? '#fb923c' : '#fbbf24'}
                  fontWeight="700">
                  {selectedMapRequest.assignmentStatus === 'EN_ROUTE' ? 'Ekip Yolda' : 'Ekip Atandı'}
                </Text>
              </Flex>
              <Text fontSize="10px" color={textFaint} mt={1}>
                {selectedMapRequest.latitude.toFixed(5)}, {selectedMapRequest.longitude.toFixed(5)}
              </Text>
            </Box>

            {/* Route calc button */}
            <Box px={4} py={3} borderBottom={`1px solid ${panelBorder}`}>
              <Button
                size="sm" w="full"
                onClick={handleMapCalculateRoute}
                isLoading={mapRouteLoading}
                loadingText="Hesaplanıyor..."
                bg="rgba(251,146,60,0.12)" color="#fb923c"
                border="1px solid rgba(251,146,60,0.35)"
                borderRadius="lg" fontWeight="700" fontSize="xs"
                _hover={{ bg: 'rgba(251,146,60,0.2)' }}
              >
                📍 Konumdan Rota Hesapla
              </Button>
              {mapRouteError && (
                <Text fontSize="10px" color="#f87171" mt={1.5} textAlign="center">{mapRouteError}</Text>
              )}
            </Box>

            {/* Route result */}
            {mapLiveRoute && (
              <>
                <Box px={4} py={3} borderBottom={`1px solid ${panelBorder}`}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="10px" color={textFaint}>Mesafe</Text>
                    <Text fontSize="11px" fontWeight="700" color="#fb923c">
                      {mapLiveRoute.distance_km.toFixed(1)} km
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="10px" color={textFaint}>Süre</Text>
                    <Text fontSize="11px" fontWeight="700" color="#fb923c">
                      ~{Math.round(mapLiveRoute.duration_min)} dk
                    </Text>
                  </Flex>
                  {mapLiveRoute.damage_score > 0 && (
                    <Flex justify="space-between">
                      <Text fontSize="10px" color={textFaint}>Yol Hasarı</Text>
                      <Text fontSize="11px" fontWeight="700"
                        color={mapLiveRoute.damage_score > 0.7 ? '#f87171' : mapLiveRoute.damage_score > 0.4 ? '#fb923c' : '#4ade80'}>
                        {(mapLiveRoute.damage_score * 100).toFixed(0)}%
                      </Text>
                    </Flex>
                  )}
                </Box>

                {/* Nav steps */}
                {mapLiveRoute.steps && mapLiveRoute.steps.length > 0 && (
                  <Box px={4} py={3}>
                    <Text fontSize="10px" fontWeight="700" color={textMuted}
                      textTransform="uppercase" letterSpacing="wider" mb={2}>Yol Tarifi</Text>
                    <Stack spacing={1.5}>
                      {mapLiveRoute.steps.slice(0, 8).map((step, i) => (
                        <Flex key={i} gap={2} align="flex-start">
                          <Box
                            flexShrink={0} w={5} h={5} borderRadius="md"
                            bg={light ? '#f1f5f9' : 'rgba(255,255,255,0.06)'}
                            border={`1px solid ${panelBorder}`}
                            display="flex" alignItems="center" justifyContent="center"
                          >
                            <Text fontSize="8px" fontWeight="800" color="#fb923c">{i + 1}</Text>
                          </Box>
                          <Box flex={1}>
                            <Text fontSize="10px" color={txtMain} lineHeight="1.3">{step.instruction}</Text>
                            {step.street_name && (
                              <Text fontSize="9px" color={textFaint} mt={0.5}>{step.street_name}</Text>
                            )}
                            <Text fontSize="9px" color={textFaint}>
                              {step.distance_m < 1000
                                ? `${step.distance_m.toFixed(0)} m`
                                : `${(step.distance_m / 1000).toFixed(1)} km`}
                            </Text>
                          </Box>
                        </Flex>
                      ))}
                      {mapLiveRoute.steps.length > 8 && (
                        <Text fontSize="9px" color={textFaint} textAlign="center">
                          +{mapLiveRoute.steps.length - 8} adım daha
                        </Text>
                      )}
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Legend */}
        <Box position="absolute" bottom={4} right={4} zIndex={999}
          bg={panelBg} backdropFilter="blur(12px)"
          border={`1px solid ${panelBorder}`} borderRadius="xl" px={4} py={3}>
          <Text fontSize="10px" fontWeight="700" color={textMuted}
            letterSpacing="widest" textTransform="uppercase" mb={2}>Açıklama</Text>
          <Stack spacing={1.5}>
            {[
              { c:'#f87171', l:'Deprem M≥6' }, { c:'#fb923c', l:'Deprem M≥5' },
              { c:'#fbbf24', l:'Deprem M≥4' }, { c:'#a3e635', l:'Deprem M<4' },
              { c:'#4ade80', l:'Toplanma Alanı' },
            ].map(r => (
              <Flex key={r.l} align="center" gap={2}>
                <Box w={3} h={3} borderRadius="full" bg={r.c} opacity={0.8} flexShrink={0} />
                <Text fontSize="xs" color={textFaint}>{r.l}</Text>
              </Flex>
            ))}
            {canSeeTeams && (
              <Flex align="center" gap={2}>
                <Box w={3} h={3} borderRadius="full" bg="#60a5fa" opacity={0.8} flexShrink={0} />
                <Text fontSize="xs" color={textFaint}>Ekip Konumu</Text>
              </Flex>
            )}
            {canSeeTeams && (
              <Flex align="center" gap={2}>
                <Box w={5} h={0.5} bg="#fbbf24" opacity={0.9} flexShrink={0} borderRadius="full" />
                <Text fontSize="xs" color={textFaint}>Rota (Atandı)</Text>
              </Flex>
            )}
            {canSeeTeams && (
              <Flex align="center" gap={2}>
                <Box w={5} h={0.5} bg="#fb923c" opacity={0.9} flexShrink={0} borderRadius="full" />
                <Text fontSize="xs" color={textFaint}>Rota (Yolda)</Text>
              </Flex>
            )}
            {canSeeTeams && (
              <Flex align="center" gap={2}>
                <Box w={3} h={3} borderRadius="full" bg="#f87171" opacity={0.85} flexShrink={0}
                  boxShadow="0 0 5px #f87171" />
                <Text fontSize="xs" color={textFaint}>Aktif Talep</Text>
              </Flex>
            )}
            {userLocation && (
              <Flex align="center" gap={2}>
                <Box w={3} h={3} borderRadius="full" bg="#818cf8" flexShrink={0}
                  boxShadow="0 0 6px #818cf8" />
                <Text fontSize="xs" color={textFaint}>Aktif Konumunuz</Text>
              </Flex>
            )}
          </Stack>
        </Box>

        {/* Stats */}
        {!loading && !error && (
          <Box position="absolute" top={4} left={4} zIndex={999}
            bg={panelBg} backdropFilter="blur(12px)"
            border={`1px solid ${panelBorder}`} borderRadius="xl" px={4} py={2.5}>
            <Flex gap={5}>
              {[
                { v: earthquakes.length,  l:'Deprem',   c:'#fb923c' },
                { v: safeAreas.length,    l:'Toplanma', c:'#4ade80' },
                ...(canSeeTeams ? [
                  { v: teams.length,             l:'Ekip',   c:'#60a5fa' },
                  { v: activeRoutes.length,      l:'Rota',   c:'#fbbf24' },
                  { v: activeMapRequests.length, l:'Talep',  c:'#f87171' },
                ] : []),
              ].map(s => (
                <Box key={s.l} textAlign="center">
                  <Text fontSize="sm" fontWeight="700" color={s.c}>{s.v}</Text>
                  <Text fontSize="10px" color={textFaint}>{s.l}</Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Box>

      {/* ── Earthquake Panel ───────────────────────────────────────── */}
      {!loading && !error && earthquakes.length > 0 && (
        <Box
          mt={3}
          bg={light ? 'white' : 'rgba(255,255,255,0.02)'}
          border={`1px solid ${panelBorder}`}
          borderRadius="2xl"
          overflow="hidden"
        >
          {/* Panel header */}
          <Flex
            align="center" justify="space-between"
            px={4} py={3}
            borderBottom={`1px solid ${panelBorder}`}
            bg={light ? '#f8fafc' : 'rgba(255,255,255,0.02)'}
          >
            <Flex align="center" gap={2.5}>
              <Box w={2} h={2} borderRadius="full" bg="#fb923c" boxShadow="0 0 6px #fb923c" />
              <Text fontSize="sm" fontWeight="700" color={txtMain}>Son Depremler</Text>
              <Box px={2} py={0.5} borderRadius="full"
                bg="rgba(251,146,60,0.15)" border="1px solid rgba(251,146,60,0.3)">
                <Text fontSize="10px" fontWeight="700" color="#fb923c">{earthquakes.length}</Text>
              </Box>
            </Flex>
            <Flex gap={1}>
              {(['time', 'mag'] as const).map(s => (
                <Button key={s} size="xs" onClick={() => setEqSort(s)}
                  bg={eqSort === s ? 'rgba(251,146,60,0.18)' : (light ? '#f1f5f9' : 'rgba(255,255,255,0.04)')}
                  color={eqSort === s ? '#fb923c' : textMuted}
                  border={`1px solid ${eqSort === s ? 'rgba(251,146,60,0.35)' : panelBorder}`}
                  borderRadius="md" fontWeight="600" fontSize="10px"
                  _hover={{ bg: 'rgba(251,146,60,0.12)' }}
                >
                  {s === 'time' ? 'Yeniden Eskiye' : 'Büyüklük'}
                </Button>
              ))}
            </Flex>
          </Flex>

          {/* Master-detail body */}
          <Flex h="300px">
            {/* ── Left: scrollable list ── */}
            <Box
              w="42%" flexShrink={0}
              overflowY="auto"
              borderRight={`1px solid ${panelBorder}`}
              sx={{
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-track': { bg: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bg: light ? '#cbd5e1' : 'rgba(255,255,255,0.15)', borderRadius: '3px' },
              }}
            >
              {sortedEqs.map(eq => (
                <EqListRow
                  key={eq.id}
                  eq={eq}
                  light={light}
                  selected={selectedEq?.id === eq.id}
                  panelBorder={panelBorder}
                  txtMain={txtMain}
                  textFaint={textFaint}
                  onClick={() => selectEq(eq)}
                />
              ))}
            </Box>

            {/* ── Right: detail panel ── */}
            <Box flex={1} overflowY="auto" p={4}
              bg={light ? '#f8fafc' : 'rgba(0,0,0,0.15)'}
              sx={{
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-track': { bg: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bg: light ? '#cbd5e1' : 'rgba(255,255,255,0.15)', borderRadius: '3px' },
              }}
            >
              {selectedEq ? (
                <EqDetail
                  eq={selectedEq}
                  light={light}
                  panelBorder={panelBorder}
                  txtMain={txtMain}
                  textMuted={textMuted}
                  textFaint={textFaint}
                />
              ) : (
                <Flex h="100%" align="center" justify="center" direction="column" gap={2}>
                  <Box
                    w={10} h={10} borderRadius="full"
                    bg={light ? '#f1f5f9' : 'rgba(255,255,255,0.05)'}
                    border={`1px solid ${panelBorder}`}
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </Box>
                  <Text fontSize="xs" color={textMuted} textAlign="center">
                    Detay görmek için<br/>bir deprem seçin
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  )
}

function magLabel(m: number) {
  if (m >= 7)   return { text: 'Büyük',        risk: 'YÜKSEK',    riskColor: '#f87171' }
  if (m >= 6)   return { text: 'Güçlü',        risk: 'YÜKSEK',    riskColor: '#f87171' }
  if (m >= 5)   return { text: 'Orta Güçlü',   risk: 'ORTA-YÜK',  riskColor: '#fb923c' }
  if (m >= 4)   return { text: 'Orta',          risk: 'ORTA',      riskColor: '#fbbf24' }
  if (m >= 3)   return { text: 'Hafif-Orta',   risk: 'DÜŞÜK-ORT', riskColor: '#a3e635' }
  return           { text: 'Hafif',            risk: 'DÜŞÜK',     riskColor: '#4ade80' }
}
function depthLabel(d: number) {
  if (d < 10)  return 'Çok Sığ (<10 km)'
  if (d < 35)  return 'Sığ (10–35 km)'
  if (d < 70)  return 'Orta Derin (35–70 km)'
  return              'Derin (>70 km)'
}
function impactRadius(m: number) {
  if (m >= 6)  return '~200+ km'
  if (m >= 5)  return '~100 km'
  if (m >= 4)  return '~50 km'
  if (m >= 3)  return '~25 km'
  return              '~10 km'
}
function fmtTimeFull(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return iso }
}

/* ── Compact list row (left column) ─────────────────────────── */
function EqListRow({ eq, light, selected, panelBorder, txtMain, textFaint, onClick }: {
  eq: Earthquake; light: boolean; selected: boolean
  panelBorder: string; txtMain: string; textFaint: string
  onClick: () => void
}) {
  const color = magColor(eq.magnitude)
  return (
    <Flex
      align="center" gap={2.5} px={3} py={2.5}
      cursor="pointer"
      borderBottom={`1px solid ${panelBorder}`}
      bg={selected
        ? (light ? '#fff7ed' : 'rgba(251,146,60,0.1)')
        : 'transparent'}
      borderLeft={`3px solid ${selected ? color : 'transparent'}`}
      transition="all 0.12s"
      _hover={{ bg: light ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }}
      onClick={onClick}
    >
      {/* Mag badge */}
      <Box
        flexShrink={0} minW="46px" textAlign="center"
        bg={color + '1a'} border={`1px solid ${color}44`}
        borderRadius="md" px={1.5} py={0.5}
      >
        <Text fontSize="11px" fontWeight="800" color={color} lineHeight="1.2">
          M{eq.magnitude.toFixed(1)}
        </Text>
      </Box>

      {/* Info */}
      <Box flex={1} minW={0}>
        <Text fontSize="11px" fontWeight="600" color={txtMain} noOfLines={1} lineHeight="1.3">
          {eq.location}
        </Text>
        <Text fontSize="10px" color={textFaint} mt={0.5}>
          {fmtTime(eq.time)}
        </Text>
      </Box>
    </Flex>
  )
}

/* ── Detail panel (right column) ─────────────────────────────── */
function EqDetail({ eq, light, panelBorder, txtMain, textMuted, textFaint }: {
  eq: Earthquake; light: boolean
  panelBorder: string; txtMain: string; textMuted: string; textFaint: string
}) {
  const color  = magColor(eq.magnitude)
  const mLabel = magLabel(eq.magnitude)

  return (
    <Box>
      {/* Big magnitude header */}
      <Flex align="center" gap={3} mb={4}>
        <Flex
          w={14} h={14} borderRadius="xl" flexShrink={0}
          bg={color + '18'} border={`2px solid ${color}40`}
          direction="column" align="center" justify="center"
        >
          <Text fontSize="lg" fontWeight="900" color={color} lineHeight="1">
            M{eq.magnitude.toFixed(1)}
          </Text>
          <Text fontSize="9px" color={color} fontWeight="700" mt={0.5}>
            {mLabel.text}
          </Text>
        </Flex>
        <Box>
          <Text fontSize="xs" fontWeight="700" color={txtMain} lineHeight="1.4">
            {eq.location}
          </Text>
          <Box
            mt={1} display="inline-block"
            px={2} py={0.5} borderRadius="full"
            bg={mLabel.riskColor + '18'} border={`1px solid ${mLabel.riskColor}40`}
          >
            <Text fontSize="9px" fontWeight="800" color={mLabel.riskColor}>
              Risk: {mLabel.risk}
            </Text>
          </Box>
        </Box>
      </Flex>

      {/* Date/time */}
      <Box
        mb={3} px={3} py={2.5} borderRadius="lg"
        bg={light ? 'white' : 'rgba(255,255,255,0.04)'}
        border={`1px solid ${panelBorder}`}
      >
        <Text fontSize="9px" color={textMuted} textTransform="uppercase"
          letterSpacing="wider" fontWeight="700" mb={1}>Tarih &amp; Saat</Text>
        <Text fontSize="11px" fontWeight="600" color={txtMain} lineHeight="1.5">
          {fmtTimeFull(eq.time)}
        </Text>
      </Box>

      {/* Stat grid */}
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr"
        gap={2}
      >
        {[
          { label: 'Enlem',         value: `${eq.latitude.toFixed(4)}° K`  },
          { label: 'Boylam',        value: `${eq.longitude.toFixed(4)}° D` },
          { label: 'Derinlik',      value: `${eq.depth} km`                },
          { label: 'Derinlik Türü', value: depthLabel(eq.depth)            },
          { label: 'Tahmini Etki',  value: impactRadius(eq.magnitude)      },
        ].map(({ label, value }) => (
          <Box
            key={label}
            px={2.5} py={2} borderRadius="lg"
            bg={light ? 'white' : 'rgba(255,255,255,0.04)'}
            border={`1px solid ${panelBorder}`}
          >
            <Text fontSize="9px" color={textMuted} textTransform="uppercase"
              letterSpacing="wider" fontWeight="700" mb={0.5}>{label}</Text>
            <Text fontSize="11px" fontWeight="700" color={txtMain}>{value}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function LayerBtn({ active, color, onClick, label }: {
  active: boolean; color: string; onClick: () => void; label: string
}) {
  return (
    <Button size="sm" onClick={onClick}
      bg={active ? `${color}18` : 'rgba(255,255,255,0.04)'}
      color={active ? color : 'rgba(255,255,255,0.4)'}
      border={`1px solid ${active ? color + '44' : 'rgba(255,255,255,0.08)'}`}
      borderRadius="lg" fontWeight="600" fontSize="xs"
      _hover={{ bg: `${color}22` }} _active={{ bg: `${color}30` }}
      leftIcon={<Box w={2} h={2} borderRadius="full" bg={active ? color : 'rgba(255,255,255,0.2)'} />}
    >{label}</Button>
  )
}
