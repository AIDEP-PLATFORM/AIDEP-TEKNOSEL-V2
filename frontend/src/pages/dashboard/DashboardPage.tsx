import { useEffect, useState } from 'react'
import { Box, Flex, Grid, Text, Stack, Spinner } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiGetRequests, type HelpRequestResponse } from '@/services/requestService'
import { apiGetEarthquakes, type Earthquake } from '@/services/mapService'

const MotionBox = motion(Box)

// ── Yardımcılar ──────────────────────────────────────────────────
const NEED_LABEL: Record<string, string> = {
  RESCUE:  'Enkaz / Kurtarma',
  MEDICAL: 'Tıbbi Yardım',
  SHELTER: 'Barınak',
  FOOD:    'Gıda Yardımı',
  OTHER:   'Diğer',
}

function urgencyToSeverity(level: number): string {
  if (level >= 5) return 'Kritik'
  if (level >= 4) return 'Yüksek'
  if (level >= 3) return 'Orta'
  return 'Düşük'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dk`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} sa`
  return `${Math.floor(hrs / 24)} gün`
}

const sev: Record<string, { color: string; bg: string }> = {
  'Kritik': { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'Yüksek': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  'Orta':   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  'Düşük':  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
}

const ACTIVE_STATUSES = new Set(['PENDING', 'SCORED', 'ASSIGNED', 'EN_ROUTE'])

// ── KPI kartı ────────────────────────────────────────────────────
function KpiCard({ title, value, label, gradient, glow, icon, path }: {
  title: string; value: number | string; label: string
  gradient: string; glow: string; icon: string; path: string
}) {
  const navigate = useNavigate()
  return (
    <MotionBox
      onClick={() => navigate(path)} cursor="pointer"
      borderRadius="2xl" p={5} position="relative" overflow="hidden"
      bgGradient={gradient}
      boxShadow={`0 4px 28px ${glow}`}
      whileHover={{ y: -4, boxShadow: `0 14px 44px ${glow}` } as any}
      whileTap={{ scale: 0.97 } as any}
      transition={{ duration: 0.2 } as any}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    >
      <Box position="absolute" inset={0} opacity={0.1}
        backgroundImage="radial-gradient(circle at 80% 20%, white 0%, transparent 55%)" />
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.65)"
            letterSpacing="widest" textTransform="uppercase" mb={2}>{title}</Text>
          <Text fontSize="3xl" fontWeight="800" color="white" lineHeight={1} mb={2}>{value}</Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.6)">{label}</Text>
        </Box>
        <Box fontSize="2xl" opacity={0.85}>{icon}</Box>
      </Flex>
    </MotionBox>
  )
}

const cardStyle = {
  bg: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '2xl',
  overflow: 'hidden',
  backdropFilter: 'blur(16px)',
}

// ── Aktif bölgeler (statik) ───────────────────────────────────────
const zones = [
  { name: 'Kadıköy, İstanbul', active: 4, risk: 'Yüksek', color: '#fb923c' },
  { name: 'Bornova, İzmir',    active: 7, risk: 'Kritik',  color: '#f87171' },
  { name: 'Çankaya, Ankara',   active: 2, risk: 'Orta',    color: '#fbbf24' },
  { name: 'Gebze, Kocaeli',    active: 9, risk: 'Kritik',  color: '#f87171' },
]

// ── Ana bileşen ───────────────────────────────────────────────────
function DashboardPage() {
  const [requests, setRequests]       = useState<HelpRequestResponse[]>([])
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [loadingReq, setLoadingReq]   = useState(true)
  const [loadingSeis, setLoadingSeis] = useState(true)

  useEffect(() => {
    apiGetRequests().then(setRequests).catch(() => setRequests([])).finally(() => setLoadingReq(false))
    apiGetEarthquakes().then(setEarthquakes).catch(() => setEarthquakes([])).finally(() => setLoadingSeis(false))
  }, [])

  const activeCount    = requests.filter(r => ACTIVE_STATUSES.has(r.status)).length
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const seismicSorted = [...earthquakes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  const seismicData   = seismicSorted.slice(-32).map(e => e.magnitude)
  const maxSeis       = seismicData.length ? Math.max(...seismicData) : 1

  const kpiCards = [
    { title: 'Aktif Talepler',    value: loadingReq  ? '…' : activeCount,    label: 'aktif görev',     gradient: 'linear(135deg,#dc2626,#b91c1c)', glow: 'rgba(220,38,38,0.28)',  icon: '🚨', path: '/requests'  },
    { title: 'Müsait Gönüllüler', value: '—',                                label: 'bilgi yok',       gradient: 'linear(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.28)', icon: '👥', path: '/volunteers' },
    { title: 'Çözülen Talepler',  value: loadingReq  ? '…' : completedCount, label: 'tamamlandı',      gradient: 'linear(135deg,#059669,#0d9488)', glow: 'rgba(5,150,105,0.28)',  icon: '✅', path: '/requests'  },
    { title: 'Sismik Kayıt',      value: loadingSeis ? '…' : earthquakes.length, label: 'son veriler', gradient: 'linear(135deg,#0369a1,#4338ca)', glow: 'rgba(3,105,161,0.28)',  icon: '📍', path: '/seismic'   },
  ]

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* KPI kartları */}
      <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }} gap={4} mb={5}>
        {kpiCards.map((k, i) => (
          <MotionBox key={k.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 } as any}>
            <KpiCard {...k} />
          </MotionBox>
        ))}
      </Grid>

      {/* Orta satır */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} mb={4}>

        {/* Son talepler */}
        <MotionBox {...cardStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center"
            borderBottom="1px solid rgba(255,255,255,0.05)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity } as any} />
              <Text color="white" fontWeight="600" fontSize="sm">Son Talepler</Text>
            </Flex>
            <Text color="#818cf8" fontSize="xs" fontWeight="600" cursor="pointer">Tümünü gör →</Text>
          </Flex>

          {loadingReq ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="sm" color="#4ade80" />
            </Flex>
          ) : recentRequests.length === 0 ? (
            <Flex justify="center" align="center" py={10}>
              <Text fontSize="sm" color="rgba(255,255,255,0.3)">Henüz talep yok</Text>
            </Flex>
          ) : (
            <Stack spacing={0}>
              {recentRequests.map((r, i) => {
                const severity = urgencyToSeverity(r.urgency_level)
                const sc       = sev[severity]
                const shortId  = `#${r.id.slice(-4).toUpperCase()}`
                const title    = r.description?.slice(0, 38) || NEED_LABEL[r.need_type] || r.need_type
                return (
                  <Flex key={r.id} px={5} py={3} justify="space-between" align="center"
                    borderBottom={i < recentRequests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                    _hover={{ bg: 'rgba(129,140,248,0.04)' }} cursor="pointer" transition="background 0.15s">
                    <Flex align="center" gap={3}>
                      <Text fontSize="10px" color="rgba(255,255,255,0.25)" fontFamily="mono" w={9}>{shortId}</Text>
                      <Text fontSize="sm" color="white" fontWeight="500">{title}</Text>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Box px={2} py={0.5} borderRadius="full" bg={sc.bg}>
                        <Text fontSize="10px" fontWeight="700" color={sc.color}>{severity}</Text>
                      </Box>
                      <Text fontSize="xs" color="rgba(255,255,255,0.3)" w={8} textAlign="right">
                        {relativeTime(r.created_at)}
                      </Text>
                    </Flex>
                  </Flex>
                )
              })}
            </Stack>
          )}
        </MotionBox>

        {/* Aktif bölgeler (statik) */}
        <MotionBox {...cardStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center"
            borderBottom="1px solid rgba(255,255,255,0.05)">
            <Text color="white" fontWeight="600" fontSize="sm">Aktif Bölgeler</Text>
            <Text color="#818cf8" fontSize="xs" fontWeight="600" cursor="pointer">Haritayı aç →</Text>
          </Flex>

          <Box px={5} pt={4} pb={3}>
            <Text fontSize="10px" color="rgba(255,255,255,0.3)" fontWeight="600"
              letterSpacing="wider" textTransform="uppercase" mb={2}>Genel Risk Dağılımı</Text>
            <Flex h={2} borderRadius="full" overflow="hidden" gap="2px">
              {[{ w: '28%', color: '#f87171' }, { w: '28%', color: '#fb923c' }, { w: '29%', color: '#fbbf24' }, { w: '15%', color: '#4ade80' }].map((b, i) => (
                <MotionBox key={i} h="full" bg={b.color} borderRadius="full"
                  initial={{ width: 0 }} animate={{ width: b.w }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' } as any} />
              ))}
            </Flex>
            <Flex justify="space-between" mt={2}>
              {[{ l: 'Kritik', c: '#f87171' }, { l: 'Yüksek', c: '#fb923c' }, { l: 'Orta', c: '#fbbf24' }, { l: 'Düşük', c: '#4ade80' }].map(s => (
                <Flex key={s.l} align="center" gap={1}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg={s.c} />
                  <Text fontSize="10px" color="rgba(255,255,255,0.35)">{s.l}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>

          <Stack spacing={0}>
            {zones.map((z, i) => (
              <Flex key={z.name} px={5} py={3} justify="space-between" align="center"
                borderBottom={i < zones.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg: 'rgba(129,140,248,0.04)' }} cursor="pointer" transition="background 0.15s">
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} borderRadius="full" bg={z.color} />
                  <Text fontSize="sm" color="white" fontWeight="500">{z.name}</Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Text fontSize="xs" color="rgba(255,255,255,0.35)">{z.active} aktif</Text>
                  <Box px={2} py={0.5} borderRadius="full" bg={sev[z.risk].bg}>
                    <Text fontSize="10px" fontWeight="700" color={sev[z.risk].color}>{z.risk}</Text>
                  </Box>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </MotionBox>
      </Grid>

      {/* Alt satır — sismik + son talepler aktivite */}
      <Grid templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }} gap={4}>

        {/* Sismik grafik */}
        <MotionBox {...cardStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center"
            borderBottom="1px solid rgba(255,255,255,0.05)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity } as any} />
              <Text color="white" fontWeight="600" fontSize="sm">
                Sismik Aktivite — Son {seismicData.length} Deprem
              </Text>
            </Flex>
            <Flex align="center" gap={1.5}>
              <Box w={2} h={2} borderRadius="full" bg="#818cf8" />
              <Text fontSize="10px" color="rgba(255,255,255,0.4)">Magnitüd</Text>
            </Flex>
          </Flex>

          <Box px={5} pt={4} pb={2}>
            {loadingSeis ? (
              <Flex justify="center" align="center" h="100px">
                <Spinner size="sm" color="#818cf8" />
              </Flex>
            ) : seismicData.length === 0 ? (
              <Flex justify="center" align="center" h="100px">
                <Text fontSize="sm" color="rgba(255,255,255,0.3)">Sismik veri yok</Text>
              </Flex>
            ) : (
              <Flex align="flex-end" h="100px" gap="3px">
                {seismicData.map((v, i) => {
                  const pct   = v / maxSeis
                  const color = pct > 0.7 ? '#f87171' : pct > 0.45 ? '#fb923c' : '#818cf8'
                  return (
                    <MotionBox key={i} flex={1} borderRadius="sm" bg={color} opacity={0.85}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.02, ease: 'easeOut' } as any}
                      whileHover={{ opacity: 1, scaleY: 1.05 } as any}
                      style={{ transformOrigin: 'bottom' }}
                    />
                  )
                })}
              </Flex>
            )}
            <Flex justify="space-between" mt={2}>
              {['En Eski', '', '', '', 'En Yeni'].map((h, i) => (
                <Text key={i} fontSize="10px" color="rgba(255,255,255,0.25)">{h}</Text>
              ))}
            </Flex>
          </Box>

          {/* AI tahmin kutusu — statik */}
          <Box mx={5} mb={4} mt={1} p={3} borderRadius="xl"
            bg="rgba(99,102,241,0.08)" border="1px solid rgba(129,140,248,0.2)">
            <Flex align="center" gap={2}>
              <Box w={6} h={6} borderRadius="lg" bg="rgba(99,102,241,0.25)"
                display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <Text fontSize="xs">⚡</Text>
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="700" color="#a5b4fc"
                  textTransform="uppercase" letterSpacing="wider">SİSMİK ÖZET</Text>
                <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                  {loadingSeis ? 'Yükleniyor…' : earthquakes.length > 0
                    ? `${earthquakes.length} deprem kaydı · En yüksek M${Math.max(...earthquakes.map(e => e.magnitude)).toFixed(1)}`
                    : 'Sismik veri alınamadı'}
                </Text>
              </Box>
            </Flex>
          </Box>
        </MotionBox>

        {/* Son talep özeti */}
        <MotionBox {...cardStyle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.35 } as any}>
          <Flex px={5} py={3.5} align="center" borderBottom="1px solid rgba(255,255,255,0.05)">
            <Text color="white" fontWeight="600" fontSize="sm">Talep Özeti</Text>
          </Flex>
          {loadingReq ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="sm" color="#818cf8" />
            </Flex>
          ) : (
            <Stack spacing={0}>
              {[
                { label: 'Aktif (Bekleyen / Atanan)', count: activeCount,    color: '#f87171' },
                { label: 'Tamamlandı',                count: completedCount, color: '#4ade80' },
                { label: 'Toplam',                    count: requests.length, color: '#818cf8' },
              ].map((item, i) => (
                <MotionBox key={item.label}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.3 } as any}
                  px={5} py={4}
                  borderBottom={i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                  _hover={{ bg: 'rgba(129,140,248,0.04)' }}>
                  <Flex align="center" gap={3}>
                    <Box w={2} h={2} borderRadius="full" bg={item.color} flexShrink={0} />
                    <Box flex={1}>
                      <Text fontSize="xs" color="rgba(255,255,255,0.7)">{item.label}</Text>
                    </Box>
                    <Text fontSize="lg" fontWeight="800" color={item.color}>{item.count}</Text>
                  </Flex>
                </MotionBox>
              ))}

              {/* Need type dağılımı */}
              <Box px={5} py={4}>
                <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
                  textTransform="uppercase" letterSpacing="wider" mb={3}>İhtiyaç Türü Dağılımı</Text>
                <Stack spacing={2}>
                  {Object.entries(NEED_LABEL).map(([key, label]) => {
                    const count = requests.filter(r => r.need_type === key).length
                    const pct   = requests.length ? (count / requests.length) * 100 : 0
                    return (
                      <Flex key={key} align="center" gap={2}>
                        <Text fontSize="10px" color="rgba(255,255,255,0.4)" w="100px" isTruncated>{label}</Text>
                        <Box flex={1} h="4px" borderRadius="full" bg="rgba(255,255,255,0.06)">
                          <MotionBox h="4px" borderRadius="full" bg="#818cf8"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' } as any} />
                        </Box>
                        <Text fontSize="10px" color="rgba(255,255,255,0.4)" fontFamily="mono" w={4} textAlign="right">
                          {count}
                        </Text>
                      </Flex>
                    )
                  })}
                </Stack>
              </Box>
            </Stack>
          )}
        </MotionBox>
      </Grid>
    </Box>
  )
}

export default DashboardPage
