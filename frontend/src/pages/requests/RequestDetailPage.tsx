import { useState, useEffect, useCallback } from 'react'
import { Box, Flex, Grid, Text, Stack, Spinner, useToast } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { getRole } from '@/utils/auth'
import {
  apiGetRequest, apiCancelRequest, apiUpdateAssignmentStatus,
  type HelpRequestResponse, type NeedType, type RequestStatus, type AssignmentStatus,
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

  useEffect(() => { load() }, [load])

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
