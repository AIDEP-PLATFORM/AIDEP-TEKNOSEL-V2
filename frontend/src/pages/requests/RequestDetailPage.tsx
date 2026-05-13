import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Flex, Grid, Text, Stack, Spinner, useToast } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getRole } from '@/utils/auth'
import {
  apiGetRequest, apiCancelRequest, apiUpdateAssignmentStatus, apiCalculateRoute,
  apiGetRequestPhotos,
  type HelpRequestResponse, type NeedType, type RequestStatus, type AssignmentStatus,
  type RouteStep, type RouteCalculationResult, type DamagePhotoItem,
} from '@/services/requestService'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

// ── Icons ─────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const RouteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ── Config maps ───────────────────────────────────────────────────
const NEED_LABELS: Record<NeedType, { label: string; icon: string }> = {
  RESCUE:  { label: 'Kurtarma', icon: '🆘' },
  MEDICAL: { label: 'Medikal',  icon: '🏥' },
  SHELTER: { label: 'Barınak',  icon: '🏠' },
  FOOD:    { label: 'Gıda',     icon: '🍱' },
  OTHER:   { label: 'Diğer',    icon: '📋' },
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Beklemede', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  SCORED:    { label: 'Skorlandı', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  ASSIGNED:  { label: 'Atandı',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  EN_ROUTE:  { label: 'Yolda',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)'   },
  COMPLETED: { label: 'Tamamlandı',color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  CANCELLED: { label: 'İptal',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

const ASSIGN_STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: string }> = {
  ASSIGNED:  { label: 'Atandı',    color: '#fbbf24' },
  EN_ROUTE:  { label: 'Yolda',     color: '#fb923c' },
  COMPLETED: { label: 'Tamamlandı',color: '#4ade80' },
  CANCELLED: { label: 'İptal',     color: '#94a3b8' },
}

function urgencyLabel(level: number) {
  if (level >= 5) return { label: 'Kritik',  color: '#f87171' }
  if (level >= 4) return { label: 'Yüksek',  color: '#fb923c' }
  if (level >= 3) return { label: 'Orta',    color: '#fbbf24' }
  if (level >= 2) return { label: 'Düşük',   color: '#4ade80' }
  return             { label: 'Çok Düşük', color: '#94a3b8' }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dk önce`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} sa önce`
  return `${Math.floor(hrs / 24)} gün önce`
}

// ── RouteMap ──────────────────────────────────────────────────────
function RouteMap({
  routeGeometry, destLat, destLon, liveRoute,
}: {
  routeGeometry: [number, number][]
  destLat: number
  destLon: number
  liveRoute?: RouteCalculationResult | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const liveLayerRef = useRef<L.LayerGroup | null>(null)

  // İlk kurulum
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
    mapRef.current = map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', { maxZoom: 19 }).addTo(map)

    // Atama rotası (mor) — [[lon,lat]] → [[lat,lon]]
    const latlngs: L.LatLngTuple[] = routeGeometry.map(([lon, lat]) => [lat, lon])
    if (latlngs.length > 0) {
      const poly = L.polyline(latlngs, { color: '#818cf8', weight: 4, opacity: 0.75, dashArray: '8,5' }).addTo(map)
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;border-radius:50%;background:#4ade80;border:2px solid white;box-shadow:0 0 6px #4ade80;"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5],
      })
      L.marker(latlngs[0], { icon: startIcon }).bindPopup('Ekip konumu').addTo(map)
      map.fitBounds(poly.getBounds(), { padding: [20, 20] })
    } else {
      // Atama rotası yoksa sadece hedef merkezle
      map.setView([destLat, destLon], 13)
    }

    // Hedef marker
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="width:13px;height:13px;border-radius:50%;background:#f87171;border:2px solid white;box-shadow:0 0 8px #f87171;"></div>`,
      iconSize: [13, 13], iconAnchor: [6, 6],
    })
    L.marker([destLat, destLon], { icon: destIcon }).bindPopup('Talep konumu').addTo(map)

    liveLayerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      liveLayerRef.current = null
    }
  }, [routeGeometry, destLat, destLon])

  // Canlı rota güncellenince çiz
  useEffect(() => {
    const layer = liveLayerRef.current
    const map   = mapRef.current
    if (!layer || !map) return
    layer.clearLayers()
    if (!liveRoute?.geometry?.length) return

    const latlngs: L.LatLngTuple[] = liveRoute.geometry.map(([lon, lat]) => [lat, lon])
    const poly = L.polyline(latlngs, { color: '#fb923c', weight: 5, opacity: 0.9 }).addTo(layer)

    // Kullanıcı konumu marker (pulsing)
    const userIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:18px;height:18px;border-radius:50%;background:rgba(251,146,60,0.25);border:2px solid rgba(251,146,60,0.6);animation:aidep-pulse 2s infinite;"></div>
          <div style="width:9px;height:9px;border-radius:50%;background:#fb923c;border:2px solid white;box-shadow:0 0 6px #fb923c;position:relative;z-index:1;"></div>
        </div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    })
    L.marker(latlngs[0], { icon: userIcon })
      .bindPopup(`Konumunuz · ${liveRoute.distance_km.toFixed(1)} km · ~${Math.round(liveRoute.duration_min)} dk`)
      .addTo(layer)

    map.fitBounds(poly.getBounds(), { padding: [24, 24] })
  }, [liveRoute])

  return (
    <Box ref={containerRef} h="240px" w="100%" borderRadius="xl" overflow="hidden"
      border="1px solid rgba(129,140,248,0.2)" />
  )
}

// ── ManeuverIcon ──────────────────────────────────────────────────
function ManeuverIcon({ maneuver }: { maneuver: string }) {
  const icons: Record<string, string> = {
    turn: '↩',
    'new name': '→',
    depart: '▶',
    arrive: '🏁',
    merge: '⤵',
    'on ramp': '↗',
    'off ramp': '↘',
    fork: '⑂',
    roundabout: '↻',
    rotary: '↻',
  }
  return <>{icons[maneuver] ?? '→'}</>
}

// ── RouteSteps ────────────────────────────────────────────────────
function RouteSteps({ steps }: { steps: RouteStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? steps : steps.slice(0, 4)

  return (
    <Box>
      <Stack spacing={1}>
        {visible.map((step, i) => (
          <Flex key={i} align="flex-start" gap={3} py={2}
            borderBottom={i < visible.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}>
            <Box
              w={7} h={7} borderRadius="lg" flexShrink={0}
              bg="rgba(129,140,248,0.12)" border="1px solid rgba(129,140,248,0.2)"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="12px" color="#818cf8"
            >
              <ManeuverIcon maneuver={step.maneuver} />
            </Box>
            <Box flex={1} minW={0}>
              <Text fontSize="sm" color="rgba(255,255,255,0.8)" fontWeight="500" noOfLines={1}>
                {step.instruction}
              </Text>
              {step.street_name && (
                <Text fontSize="11px" color="rgba(255,255,255,0.35)" noOfLines={1}>
                  {step.street_name}
                </Text>
              )}
            </Box>
            <Box textAlign="right" flexShrink={0}>
              <Text fontSize="11px" color="rgba(255,255,255,0.4)" fontFamily="mono">
                {step.distance_m >= 1000
                  ? `${(step.distance_m / 1000).toFixed(1)} km`
                  : `${step.distance_m} m`}
              </Text>
            </Box>
          </Flex>
        ))}
      </Stack>

      {steps.length > 4 && (
        <Box
          mt={2} cursor="pointer" textAlign="center"
          onClick={() => setExpanded(e => !e)}
        >
          <Text fontSize="12px" color="#818cf8" fontWeight="600">
            {expanded ? '▲ Daha az göster' : `▼ ${steps.length - 4} adım daha`}
          </Text>
        </Box>
      )}
    </Box>
  )
}

// ── InfoRow ───────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Flex align="flex-start" gap={3}>
      <Box color="rgba(255,255,255,0.25)" display="flex" mt={0.5} flexShrink={0}>{icon}</Box>
      <Box flex={1}>
        <Text fontSize="9px" color="rgba(255,255,255,0.25)" fontWeight="700"
          textTransform="uppercase" letterSpacing="wider">{label}</Text>
        <Text fontSize="sm" color="rgba(255,255,255,0.75)" fontWeight="500" mt={0.5}>{value}</Text>
      </Box>
    </Flex>
  )
}

// ── ActionButton ──────────────────────────────────────────────────
function ActionButton({ label, color, bg, border, onClick, loading }: {
  label: string; color: string; bg: string; border: string
  onClick?: () => void; loading?: boolean
}) {
  return (
    <MotionBox cursor={loading ? 'not-allowed' : 'pointer'}
      px={4} py={2.5} borderRadius="xl" bg={bg} border={`1px solid ${border}`}
      whileHover={{ opacity: loading ? 1 : 0.85 } as any}
      whileTap={{ scale: loading ? 1 : 0.97 } as any}
      transition={{ duration: 0.12 } as any}
      onClick={loading ? undefined : onClick}>
      <Flex align="center" gap={2}>
        {loading && <Spinner size="xs" color={color} />}
        <Text fontSize="sm" fontWeight="600" color={color}>{label}</Text>
      </Flex>
    </MotionBox>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const role = getRole()

  const [request, setRequest] = useState<HelpRequestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [liveRoute, setLiveRoute] = useState<RouteCalculationResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [photos, setPhotos] = useState<DamagePhotoItem[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<DamagePhotoItem | null>(null)

  const load = useCallback(async () => {
    if (!id) { setNotFound(true); setLoading(false); return }
    try {
      const data = await apiGetRequest(id)
      setRequest(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadPhotos = useCallback(async () => {
    if (!id) return
    setPhotosLoading(true)
    try {
      const data = await apiGetRequestPhotos(id)
      setPhotos(data)
    } catch { /* fotoğraf yüklenemedi */ } finally {
      setPhotosLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadPhotos() }, [loadPhotos])

  // photo_count değişince fotoğrafları yenile (mobil yükleme sonrası)
  useEffect(() => {
    if (request?.photo_count) loadPhotos()
  }, [request?.photo_count, loadPhotos])

  const handleCalculateRoute = async () => {
    if (!request) return
    if (!navigator.geolocation) {
      toast({ title: 'Tarayıcınız konum desteklemiyor', status: 'error', duration: 3000, isClosable: true })
      return
    }
    setRouteLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await apiCalculateRoute(
            request.id,
            pos.coords.latitude,
            pos.coords.longitude,
          )
          setLiveRoute(result)
          toast({
            title: `Rota hesaplandı: ${result.distance_km.toFixed(1)} km · ~${Math.round(result.duration_min)} dk`,
            status: 'success', duration: 4000, isClosable: true,
          })
        } catch {
          toast({ title: 'Rota hesaplanamadı', status: 'error', duration: 3000, isClosable: true })
        } finally {
          setRouteLoading(false)
        }
      },
      () => {
        toast({ title: 'Konum alınamadı. Tarayıcı iznini kontrol edin.', status: 'warning', duration: 3000, isClosable: true })
        setRouteLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleCancel = async () => {
    if (!request) return
    setActionLoading('cancel')
    try {
      await apiCancelRequest(request.id)
      toast({ title: 'Talep iptal edildi', status: 'warning', duration: 3000, isClosable: true })
      load()
    } catch {
      toast({ title: 'İptal edilemedi', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignmentStatus = async (status: AssignmentStatus) => {
    if (!request) return
    setActionLoading(status)
    try {
      await apiUpdateAssignmentStatus(request.id, status)
      const labels: Record<AssignmentStatus, string> = {
        ASSIGNED: 'Atandı', EN_ROUTE: 'Yola çıkıldı', COMPLETED: 'Tamamlandı', CANCELLED: 'İptal edildi',
      }
      toast({ title: labels[status], status: 'success', duration: 3000, isClosable: true })
      load()
    } catch {
      toast({ title: 'Durum güncellenemedi', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center">
        <Spinner size="xl" color="#818cf8" thickness="3px" />
      </Flex>
    )
  }

  if (notFound || !request) {
    return (
      <Flex h="60vh" align="center" justify="center" direction="column" gap={3}>
        <Text color="rgba(255,255,255,0.4)" fontSize="lg">Talep bulunamadı</Text>
        <MotionBox onClick={() => navigate('/requests')} cursor="pointer"
          px={4} py={2} borderRadius="xl" bg="rgba(96,165,250,0.12)"
          border="1px solid rgba(96,165,250,0.3)" color="#60a5fa"
          whileHover={{ opacity: 0.8 } as any} transition={{ duration: 0.15 } as any}>
          <Text fontSize="sm" fontWeight="600">← Taleplere Dön</Text>
        </MotionBox>
      </Flex>
    )
  }

  const staCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING
  const needCfg = NEED_LABELS[request.need_type]
  const urgCfg = urgencyLabel(request.urgency_level)
  const isAdmin = role === 'ADMIN' || role === 'NGO_MANAGER' || role === 'OFFICIAL_MANAGER'
  const canCancelRequest = isAdmin && (request.status === 'PENDING' || request.status === 'SCORED')
  const assignment = request.assignment

  return (
    <Box px={6} py={5}>

      {/* Başlık */}
      <MotionFlex align="center" gap={4} mb={6}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 } as any}>

        <MotionBox onClick={() => navigate('/requests')}
          cursor="pointer" w={9} h={9} borderRadius="xl"
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
          display="flex" alignItems="center" justifyContent="center"
          color="rgba(255,255,255,0.5)"
          whileHover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' } as any}
          whileTap={{ scale: 0.9 } as any} transition={{ duration: 0.15 } as any}>
          <BackIcon />
        </MotionBox>

        <Box flex={1}>
          <Flex align="center" gap={3} flexWrap="wrap">
            <Text color="rgba(255,255,255,0.35)" fontSize="sm" fontFamily="mono">
              #{request.id.slice(0, 8)}
            </Text>
            <Text fontSize="lg" mr={1}>{needCfg.icon}</Text>
            <Text color="white" fontWeight="800" fontSize="lg">
              {needCfg.label} Talebi
            </Text>
          </Flex>
          <Flex align="center" gap={2} mt={1}>
            <Box color="rgba(255,255,255,0.3)" display="flex"><MapPinIcon /></Box>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)">
              {request.latitude.toFixed(5)}, {request.longitude.toFixed(5)}
            </Text>
            <Box w="1px" h={3} bg="rgba(255,255,255,0.15)" />
            <Box color="rgba(255,255,255,0.3)" display="flex"><ClockIcon /></Box>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)">{relativeTime(request.created_at)}</Text>
          </Flex>
        </Box>

        {/* Rozet grubu */}
        <Flex gap={2} align="center" flexWrap="wrap" justifyContent="flex-end">
          <Flex px={3} py={1.5} borderRadius="full"
            bg={`${urgCfg.color}20`} border={`1px solid ${urgCfg.color}40`}>
            <Text fontSize="11px" fontWeight="700" color={urgCfg.color}>
              Aciliyet {request.urgency_level}/5 — {urgCfg.label}
            </Text>
          </Flex>
          <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="full"
            bg={staCfg.bg} border={`1px solid ${staCfg.color}40`}>
            {(request.status === 'ASSIGNED' || request.status === 'EN_ROUTE') && (
              <MotionBox w={1.5} h={1.5} borderRadius="full" bg={staCfg.color}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity } as any} />
            )}
            {request.status === 'COMPLETED' && <Box color={staCfg.color} display="flex"><CheckIcon /></Box>}
            <Text fontSize="11px" fontWeight="700" color={staCfg.color}>{staCfg.label}</Text>
          </Flex>
        </Flex>
      </MotionFlex>

      {/* İçerik grid */}
      <Grid templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }} gap={5}>

        {/* Sol — Açıklama + Atama bilgisi */}
        <Stack spacing={4}>

          {/* Açıklama */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={3}>Talep Açıklaması</Text>
            {request.description ? (
              <Text fontSize="sm" color="rgba(255,255,255,0.75)" lineHeight="1.8">
                {request.description}
              </Text>
            ) : (
              <Text fontSize="sm" color="rgba(255,255,255,0.25)" fontStyle="italic">
                Açıklama girilmemiş
              </Text>
            )}
          </MotionBox>

          {/* Atama bilgisi */}
          {assignment && (
            <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 } as any}
              bg="rgba(251,191,36,0.04)" border="1px solid rgba(251,191,36,0.15)"
              borderRadius="2xl" p={5} backdropFilter="blur(12px)">
              <Flex align="center" gap={2} mb={4}>
                <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                  textTransform="uppercase" letterSpacing="widest">Atama Bilgisi</Text>
                <Flex px={2} py={0.5} borderRadius="full"
                  bg={`${ASSIGN_STATUS_CONFIG[assignment.status].color}20`}
                  border={`1px solid ${ASSIGN_STATUS_CONFIG[assignment.status].color}40`}>
                  <Text fontSize="9px" fontWeight="700"
                    color={ASSIGN_STATUS_CONFIG[assignment.status].color}>
                    {ASSIGN_STATUS_CONFIG[assignment.status].label}
                  </Text>
                </Flex>
              </Flex>

              <Grid templateColumns="1fr 1fr" gap={4}>
                {[
                  { label: 'Mesafe', value: `${assignment.route_distance_km?.toFixed(1) ?? '-'} km`, icon: <RouteIcon /> },
                  { label: 'Tahmini Süre', value: `${assignment.route_duration_minutes ?? '-'} dk`, icon: <ClockIcon /> },
                  { label: 'Güvenlik Skoru', value: assignment.safety_score != null ? `${(assignment.safety_score * 100).toFixed(0)}%` : '-', icon: <StarIcon /> },
                  { label: 'Kompozit Skor', value: assignment.composite_score?.toFixed(3) ?? '-', icon: <StarIcon /> },
                ].map(item => (
                  <Flex key={item.label} align="flex-start" gap={2}>
                    <Box color="rgba(255,255,255,0.25)" display="flex" mt={0.5} flexShrink={0}>{item.icon}</Box>
                    <Box>
                      <Text fontSize="9px" color="rgba(255,255,255,0.25)" fontWeight="700"
                        textTransform="uppercase" letterSpacing="wider">{item.label}</Text>
                      <Text fontSize="sm" color="rgba(255,255,255,0.8)" fontWeight="600" mt={0.5}>
                        {item.value}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </Grid>
            </MotionBox>
          )}

          {/* Rota Haritası — atama rotası VEYA canlı rota varsa göster */}
          {(assignment?.route_geometry?.length || liveRoute) && (
            <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 } as any}
              bg="rgba(129,140,248,0.04)" border="1px solid rgba(129,140,248,0.15)"
              borderRadius="2xl" p={5} backdropFilter="blur(12px)">

              {/* Başlık + legend */}
              <Flex align="center" justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                  textTransform="uppercase" letterSpacing="widest">Rota</Text>
                <Flex gap={3} align="center" flexWrap="wrap">
                  <Flex align="center" gap={1.5}>
                    <Box w={4} h="2px" borderRadius="full" bg="#818cf8" opacity={0.7} />
                    <Text fontSize="10px" color="rgba(255,255,255,0.35)">Ekip rotası</Text>
                  </Flex>
                  {liveRoute && (
                    <Flex align="center" gap={1.5}>
                      <Box w={4} h="2px" borderRadius="full" bg="#fb923c" />
                      <Text fontSize="10px" color="rgba(255,255,255,0.35)">Konumunuzdan</Text>
                    </Flex>
                  )}
                  <Flex align="center" gap={1.5}>
                    <Box w={2} h={2} borderRadius="full" bg="#4ade80" />
                    <Text fontSize="10px" color="rgba(255,255,255,0.35)">Başlangıç</Text>
                  </Flex>
                  <Flex align="center" gap={1.5}>
                    <Box w={2} h={2} borderRadius="full" bg="#f87171" />
                    <Text fontSize="10px" color="rgba(255,255,255,0.35)">Hedef</Text>
                  </Flex>
                </Flex>
              </Flex>

              {/* Canlı rota özeti */}
              {liveRoute && (
                <Flex gap={5} mb={3} px={3} py={2} borderRadius="lg"
                  bg="rgba(251,146,60,0.08)" border="1px solid rgba(251,146,60,0.2)">
                  <Box>
                    <Text fontSize="9px" color="rgba(255,255,255,0.3)" textTransform="uppercase" letterSpacing="wider">Mesafe</Text>
                    <Text fontSize="sm" fontWeight="700" color="#fb923c">{liveRoute.distance_km.toFixed(1)} km</Text>
                  </Box>
                  <Box>
                    <Text fontSize="9px" color="rgba(255,255,255,0.3)" textTransform="uppercase" letterSpacing="wider">Tahmini Süre</Text>
                    <Text fontSize="sm" fontWeight="700" color="#fb923c">~{Math.round(liveRoute.duration_min)} dk</Text>
                  </Box>
                  <Box>
                    <Text fontSize="9px" color="rgba(255,255,255,0.3)" textTransform="uppercase" letterSpacing="wider">Yol Durumu</Text>
                    <Text fontSize="sm" fontWeight="700" color={liveRoute.damage_score > 3 ? '#f87171' : '#4ade80'}>
                      {liveRoute.damage_score === 0 ? 'Temiz' : `⚠️ ${liveRoute.damage_score} hasar`}
                    </Text>
                  </Box>
                </Flex>
              )}

              <RouteMap
                routeGeometry={assignment?.route_geometry ?? []}
                destLat={request.latitude}
                destLon={request.longitude}
                liveRoute={liveRoute}
              />

              {/* Konumdan Hesapla butonu */}
              <MotionBox mt={3} cursor={routeLoading ? 'not-allowed' : 'pointer'}
                px={4} py={2.5} borderRadius="xl"
                bg="rgba(251,146,60,0.1)" border="1px solid rgba(251,146,60,0.3)"
                whileHover={{ opacity: routeLoading ? 1 : 0.85 } as any}
                whileTap={{ scale: routeLoading ? 1 : 0.97 } as any}
                transition={{ duration: 0.12 } as any}
                onClick={routeLoading ? undefined : handleCalculateRoute}>
                <Flex align="center" justify="center" gap={2}>
                  {routeLoading && <Spinner size="xs" color="#fb923c" />}
                  <Text fontSize="sm" fontWeight="600" color="#fb923c">
                    {routeLoading ? 'Konum alınıyor...' : liveRoute ? '🔄 Rotayı Yenile' : '📍 Konumdan Rota Hesapla'}
                  </Text>
                </Flex>
              </MotionBox>
            </MotionBox>
          )}

          {/* Adım Adım Navigasyon — önce canlı rota, yoksa atama rotası */}
          {(() => {
            const steps = liveRoute?.steps?.length
              ? liveRoute.steps
              : assignment?.route_steps?.length
                ? assignment.route_steps
                : null
            const isLive = !!(liveRoute?.steps?.length)
            if (!steps) return null
            return (
              <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.3 } as any}
                bg={isLive ? 'rgba(251,146,60,0.04)' : 'rgba(129,140,248,0.04)'}
                border={`1px solid ${isLive ? 'rgba(251,146,60,0.2)' : 'rgba(129,140,248,0.15)'}`}
                borderRadius="2xl" p={5} backdropFilter="blur(12px)">
                <Flex align="center" gap={2} mb={3}>
                  <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                    textTransform="uppercase" letterSpacing="widest">
                    {isLive ? 'Konumunuzdan Navigasyon' : 'Navigasyon'}
                  </Text>
                  <Box px={2} py={0.5} borderRadius="full"
                    bg={isLive ? 'rgba(251,146,60,0.15)' : 'rgba(129,140,248,0.15)'}
                    border={`1px solid ${isLive ? 'rgba(251,146,60,0.3)' : 'rgba(129,140,248,0.3)'}`}>
                    <Text fontSize="9px" fontWeight="700" color={isLive ? '#fb923c' : '#818cf8'}>
                      {steps.length} adım
                    </Text>
                  </Box>
                </Flex>
                <RouteSteps steps={steps} />
              </MotionBox>
            )
          })()}

          {/* Skor bilgisi */}
          {(request.priority_score != null || request.area_damage_score != null) && (
            <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 } as any}
              bg="rgba(167,139,250,0.04)" border="1px solid rgba(167,139,250,0.15)"
              borderRadius="2xl" p={5} backdropFilter="blur(12px)">
              <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                textTransform="uppercase" letterSpacing="widest" mb={4}>AI Skor Analizi</Text>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box>
                  <Text fontSize="9px" color="rgba(255,255,255,0.25)" fontWeight="700"
                    textTransform="uppercase" letterSpacing="wider">Öncelik Skoru</Text>
                  <Text fontSize="xl" color="#a78bfa" fontWeight="800" mt={1}>
                    {request.priority_score?.toFixed(3) ?? '—'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="9px" color="rgba(255,255,255,0.25)" fontWeight="700"
                    textTransform="uppercase" letterSpacing="wider">Alan Hasar Skoru</Text>
                  <Text fontSize="xl" color="#fb923c" fontWeight="800" mt={1}>
                    {request.area_damage_score?.toFixed(3) ?? '—'}
                  </Text>
                </Box>
              </Grid>
            </MotionBox>
          )}

          {/* Hasar Fotoğrafları & AI Sonuçları */}
          {(photos.length > 0 || photosLoading || request.photo_count > 0) && (
            <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.3 } as any}
              bg="rgba(248,113,113,0.03)" border="1px solid rgba(248,113,113,0.15)"
              borderRadius="2xl" p={5} backdropFilter="blur(12px)">

              <Flex align="center" justify="space-between" mb={4}>
                <Flex align="center" gap={2}>
                  <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                    textTransform="uppercase" letterSpacing="widest">
                    Hasar Fotoğrafları & AI Sonuçları
                  </Text>
                  <Box px={2} py={0.5} borderRadius="full"
                    bg="rgba(248,113,113,0.15)" border="1px solid rgba(248,113,113,0.3)">
                    <Text fontSize="9px" fontWeight="700" color="#f87171">
                      {photos.length} fotoğraf
                    </Text>
                  </Box>
                </Flex>
                <Box
                  cursor="pointer" px={2.5} py={1} borderRadius="lg"
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                  onClick={loadPhotos}
                  _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                >
                  <Text fontSize="10px" color="rgba(255,255,255,0.4)" fontWeight="600">
                    {photosLoading ? '⟳' : '↻'} Yenile
                  </Text>
                </Box>
              </Flex>

              {photosLoading && photos.length === 0 ? (
                <Flex justify="center" py={6}>
                  <Spinner size="md" color="#f87171" thickness="2px" />
                </Flex>
              ) : (
                <Stack spacing={3}>
                  {photos.map(photo => (
                    <DamagePhotoCard
                      key={photo.id}
                      photo={photo}
                      isSelected={selectedPhoto?.id === photo.id}
                      onSelect={() => setSelectedPhoto(p => p?.id === photo.id ? null : photo)}
                    />
                  ))}
                </Stack>
              )}

              {/* Lightbox */}
              {selectedPhoto?.photo_url && (
                <Box
                  mt={3} borderRadius="xl" overflow="hidden"
                  border="1px solid rgba(248,113,113,0.25)"
                  cursor="pointer" onClick={() => setSelectedPhoto(null)}
                  position="relative"
                >
                  <img
                    src={selectedPhoto.photo_url}
                    alt={selectedPhoto.original_filename ?? 'Hasar fotoğrafı'}
                    style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: 'rgba(0,0,0,0.4)' }}
                  />
                  <Box position="absolute" top={2} right={2}
                    bg="rgba(0,0,0,0.6)" borderRadius="full" px={2} py={0.5}>
                    <Text fontSize="10px" color="rgba(255,255,255,0.6)">✕ Kapat</Text>
                  </Box>
                </Box>
              )}
            </MotionBox>
          )}
        </Stack>

        {/* Sağ — Detay + İşlemler */}
        <Stack spacing={4}>

          {/* Talep bilgileri */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={4}>Talep Bilgileri</Text>
            <Stack spacing={3.5}>
              <InfoRow icon={<MapPinIcon />} label="Koordinat"
                value={`${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`} />
              <InfoRow icon={<UserIcon />} label="Kişi Sayısı"
                value={`${request.person_count} kişi`} />
              <InfoRow icon={<ClockIcon />} label="Oluşturulma"
                value={new Date(request.created_at).toLocaleString('tr-TR')} />
              <InfoRow icon={<ClockIcon />} label="Son Güncelleme"
                value={new Date(request.updated_at).toLocaleString('tr-TR')} />
              {request.photo_count > 0 && (
                <InfoRow icon={<StarIcon />} label="Fotoğraf"
                  value={`${request.photo_count} adet`} />
              )}
            </Stack>
          </MotionBox>

          {/* Hızlı aksiyonlar */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={4}>Hızlı İşlemler</Text>
            <Stack spacing={2}>

              {/* Haritada göster — her zaman */}
              <ActionButton
                label="Haritada Göster"
                color="#60a5fa" bg="rgba(96,165,250,0.1)" border="rgba(96,165,250,0.25)"
                onClick={() => navigate('/map')}
              />

              {/* Konumdan Rota Hesapla — her zaman */}
              <ActionButton
                label={routeLoading ? 'Konum alınıyor...' : liveRoute ? '🔄 Rotayı Yenile' : '📍 Konumdan Rota Hesapla'}
                color="#fb923c" bg="rgba(251,146,60,0.1)" border="rgba(251,146,60,0.25)"
                loading={routeLoading}
                onClick={handleCalculateRoute}
              />

              {/* Atandı → Yola Çık */}
              {assignment?.status === 'ASSIGNED' && (
                <ActionButton
                  label="Yola Çıktım"
                  color="#fb923c" bg="rgba(251,146,60,0.1)" border="rgba(251,146,60,0.25)"
                  loading={actionLoading === 'EN_ROUTE'}
                  onClick={() => handleAssignmentStatus('EN_ROUTE')}
                />
              )}

              {/* Yolda → Tamamlandı */}
              {assignment?.status === 'EN_ROUTE' && (
                <ActionButton
                  label="Görevi Tamamla"
                  color="#4ade80" bg="rgba(74,222,128,0.1)" border="rgba(74,222,128,0.25)"
                  loading={actionLoading === 'COMPLETED'}
                  onClick={() => handleAssignmentStatus('COMPLETED')}
                />
              )}

              {/* Admin — İptal Et */}
              {canCancelRequest && (
                <ActionButton
                  label="Talebi İptal Et"
                  color="#f87171" bg="rgba(248,113,113,0.1)" border="rgba(248,113,113,0.25)"
                  loading={actionLoading === 'cancel'}
                  onClick={handleCancel}
                />
              )}
            </Stack>
          </MotionBox>
        </Stack>
      </Grid>
    </Box>
  )
}

// ── DamagePhotoCard ───────────────────────────────────────────────
function DamagePhotoCard({ photo, isSelected, onSelect }: {
  photo: DamagePhotoItem
  isSelected: boolean
  onSelect: () => void
}) {
  const score = photo.damage_score
  const scoreColor = score == null ? '#94a3b8' : score >= 0.7 ? '#f87171' : score >= 0.4 ? '#fb923c' : '#4ade80'
  const scoreLabel = score == null ? 'Analiz bekleniyor' : score >= 0.7 ? 'Ağır Hasar' : score >= 0.4 ? 'Orta Hasar' : 'Hafif Hasar'

  const labelEntries: [string, number][] = photo.damage_labels
    ? Array.isArray(photo.damage_labels)
      ? (photo.damage_labels as any[]).map((d: any) => [d.label ?? d.class ?? 'Hasar', d.confidence ?? 1])
      : Object.entries(photo.damage_labels as Record<string, number>)
    : []

  return (
    <Box
      borderRadius="xl"
      bg={isSelected ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)'}
      border={`1px solid ${isSelected ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.07)'}`}
      overflow="hidden"
      transition="all 0.15s"
    >
      <Flex align="center" gap={3} px={4} py={3}>
        {/* Thumbnail */}
        <Box
          w={12} h={12} borderRadius="lg" flexShrink={0} overflow="hidden"
          bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
          cursor={photo.photo_url ? 'pointer' : 'default'}
          onClick={photo.photo_url ? onSelect : undefined}
          _hover={photo.photo_url ? { opacity: 0.85 } : {}}
        >
          {photo.photo_url ? (
            <img src={photo.photo_url} alt="hasar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Flex w="full" h="full" align="center" justify="center">
              <Text fontSize="18px">📷</Text>
            </Flex>
          )}
        </Box>

        <Box flex={1} minW={0}>
          <Flex align="center" gap={2} mb={1}>
            <Box px={2} py={0.5} borderRadius="full"
              bg={`${scoreColor}18`} border={`1px solid ${scoreColor}40`}>
              <Text fontSize="9px" fontWeight="700" color={scoreColor}>{scoreLabel}</Text>
            </Box>
            {!photo.analysis_success && (
              <Box px={2} py={0.5} borderRadius="full"
                bg="rgba(148,163,184,0.12)" border="1px solid rgba(148,163,184,0.3)">
                <Text fontSize="9px" color="#94a3b8">AI analiz bekleniyor</Text>
              </Box>
            )}
          </Flex>
          <Text fontSize="10px" color="rgba(255,255,255,0.3)">
            {new Date(photo.created_at).toLocaleString('tr-TR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </Box>

        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="lg" fontWeight="800" color={scoreColor} lineHeight="1">
            {score != null ? `${(score * 100).toFixed(0)}%` : '—'}
          </Text>
          <Text fontSize="9px" color="rgba(255,255,255,0.3)">hasar</Text>
        </Box>
      </Flex>

      {score != null && (
        <Box px={4} pb={2}>
          <Box h="3px" bg="rgba(255,255,255,0.08)" borderRadius="full" overflow="hidden">
            <Box h="full" borderRadius="full" bg={scoreColor}
              style={{ width: `${(score * 100).toFixed(0)}%`, transition: 'width 0.5s' }} />
          </Box>
        </Box>
      )}

      {labelEntries.length > 0 && (
        <Flex gap={1.5} px={4} pb={3} flexWrap="wrap">
          {labelEntries.slice(0, 6).map(([label, count]) => (
            <Box key={label} px={2} py={0.5} borderRadius="md"
              bg="rgba(248,113,113,0.1)" border="1px solid rgba(248,113,113,0.2)">
              <Text fontSize="9px" color="#fca5a5" fontWeight="600">
                {label}{typeof count === 'number' && count > 1 ? ` ×${count}` : ''}
              </Text>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
