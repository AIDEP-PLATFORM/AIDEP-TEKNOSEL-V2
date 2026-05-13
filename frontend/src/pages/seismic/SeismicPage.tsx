import { useEffect, useState } from 'react'
import { Box, Flex, Grid, Heading, Text, Stack, Spinner } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { apiGetEarthquakes, type Earthquake } from '@/services/mapService'

const MotionBox = motion(Box)

function magToRisk(mag: number): string {
  if (mag >= 4.5) return 'Kritik'
  if (mag >= 3.5) return 'Yüksek'
  if (mag >= 2.5) return 'Orta'
  return 'Düşük'
}

const riskStyle: Record<string, { color: string; bg: string }> = {
  'Kritik': { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'Yüksek': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  'Orta':   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  'Düşük':  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
}

const card = {
  bg: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '2xl',
  overflow: 'hidden',
  backdropFilter: 'blur(12px)',
}

function SeismicPage() {
  const [events, setEvents] = useState<Earthquake[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGetEarthquakes()
      .then(data => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const sorted   = [...events].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recent6  = sorted.slice(0, 6)
  const chartData = sorted.slice(0, 24).map(e => e.magnitude).reverse()
  const mx        = chartData.length ? Math.max(...chartData) : 1

  const maxMag      = events.length ? Math.max(...events.map(e => e.magnitude)).toFixed(1) : '—'
  const criticalCnt = events.filter(e => e.magnitude >= 4.5).length
  const avgDepth    = events.length
    ? (events.reduce((s, e) => s + e.depth, 0) / events.length).toFixed(1)
    : '—'

  function fmtTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '—' }
  }

  return (
    <Box p={{ base: 5, md: 6 }}>
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="800">Sismik Veriler</Heading>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>
          Son deprem aktivitesi — AFAD verisi
        </Text>
      </MotionBox>

      {/* Özet */}
      <Grid templateColumns="repeat(4,1fr)" gap={4} mb={5}>
        {[
          { label: 'Toplam Kayıt',  value: loading ? '…' : String(events.length), sub: 'deprem',    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
          { label: 'Maks Magnitüd', value: loading ? '…' : String(maxMag),         sub: 'bugün',    color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
          { label: 'Kritik (≥4.5)', value: loading ? '…' : String(criticalCnt),    sub: 'kayıt',   color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.2)'  },
          { label: 'Ort Derinlik',  value: loading ? '…' : String(avgDepth),        sub: 'km',      color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
        ].map((s, i) => (
          <MotionBox key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl"
            p={4} textAlign="center" backdropFilter="blur(12px)">
            <Text fontSize="2xl" fontWeight="800" color={s.color}>{s.value}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.35)" mt={1} fontWeight="600"
              textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.25)">{s.sub}</Text>
          </MotionBox>
        ))}
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }} gap={5}>
        {/* Grafik */}
        <MotionBox {...card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center"
            borderBottom="1px solid rgba(255,255,255,0.06)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity } as any} />
              <Text color="white" fontWeight="600" fontSize="sm">
                Son {chartData.length} Deprem — Magnitüd Grafiği
              </Text>
            </Flex>
            <Flex align="center" gap={3}>
              {[{ c: '#f87171', l: 'Kritik' }, { c: '#fb923c', l: 'Yüksek' }, { c: '#818cf8', l: 'Normal' }].map(x => (
                <Flex key={x.l} align="center" gap={1}>
                  <Box w={2} h={2} borderRadius="full" bg={x.c} />
                  <Text fontSize="10px" color="rgba(255,255,255,0.35)">{x.l}</Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Box px={5} pt={5} pb={4}>
            {loading ? (
              <Flex justify="center" align="center" h="120px">
                <Spinner color="#4ade80" />
              </Flex>
            ) : chartData.length === 0 ? (
              <Flex justify="center" align="center" h="120px">
                <Text fontSize="sm" color="rgba(255,255,255,0.3)">Veri yok</Text>
              </Flex>
            ) : (
              <Flex align="flex-end" h="120px" gap="4px">
                {chartData.map((v, i) => {
                  const pct   = v / mx
                  const color = pct > 0.75 ? '#f87171' : pct > 0.45 ? '#fb923c' : '#818cf8'
                  return (
                    <MotionBox key={i} flex={1} borderRadius="sm" bg={color} opacity={0.8}
                      initial={{ height: 0 }} animate={{ height: `${pct * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.025, ease: 'easeOut' } as any}
                      whileHover={{ opacity: 1, scaleY: 1.04 } as any}
                      style={{ transformOrigin: 'bottom' }} />
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
        </MotionBox>

        {/* Son olaylar */}
        <MotionBox {...card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 } as any}>
          <Box px={5} py={3.5} borderBottom="1px solid rgba(255,255,255,0.06)">
            <Text color="white" fontWeight="600" fontSize="sm">Son Sismik Olaylar</Text>
          </Box>

          {loading ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner color="#818cf8" />
            </Flex>
          ) : recent6.length === 0 ? (
            <Flex justify="center" align="center" py={10}>
              <Text fontSize="sm" color="rgba(255,255,255,0.3)">Veri bulunamadı</Text>
            </Flex>
          ) : (
            <Stack spacing={0}>
              {recent6.map((e, i) => {
                const risk = magToRisk(e.magnitude)
                const rs   = riskStyle[risk]
                return (
                  <MotionBox key={e.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.3 } as any}
                    px={5} py={3.5}
                    borderBottom={i < recent6.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                    _hover={{ bg: 'rgba(255,255,255,0.03)' }} cursor="default">
                    <Flex justify="space-between" align="center" mb={1}>
                      <Flex align="center" gap={2}>
                        <Box w={2} h={2} borderRadius="full" bg={rs.color} />
                        <Text fontSize="xs" color="white" fontWeight="600">M{e.magnitude.toFixed(1)}</Text>
                        <Text fontSize="10px" color="rgba(255,255,255,0.25)" fontFamily="mono">
                          {e.id.slice(-6).toUpperCase()}
                        </Text>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Box px={2} py={0.5} borderRadius="full" bg={rs.bg}>
                          <Text fontSize="10px" fontWeight="700" color={rs.color}>{risk}</Text>
                        </Box>
                        <Text fontSize="10px" color="rgba(255,255,255,0.3)">{fmtTime(e.time)}</Text>
                      </Flex>
                    </Flex>
                    <Text fontSize="xs" color="rgba(255,255,255,0.5)">
                      {e.location} · {e.depth} km
                    </Text>
                  </MotionBox>
                )
              })}
            </Stack>
          )}
        </MotionBox>
      </Grid>
    </Box>
  )
}

export default SeismicPage
