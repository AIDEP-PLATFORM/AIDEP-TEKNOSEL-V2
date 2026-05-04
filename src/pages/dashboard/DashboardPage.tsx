import { Box, Flex, Grid, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const MotionBox = motion(Box)

// ── KPI kartları ──────────────────────────────────────────────────
const kpiData = [
  { title: 'Aktif Talepler',    value: 31,  change: 12,  label: 'geçen haftaya göre', gradient: 'linear(135deg,#dc2626,#b91c1c)', glow: 'rgba(220,38,38,0.28)',   icon: '🚨', path: '/requests'  },
  { title: 'Müsait Gönüllüler', value: 138, change: 8,   label: 'geçen haftaya göre', gradient: 'linear(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.28)',  icon: '👥', path: '/volunteers' },
  { title: 'Çözülen Talepler',  value: 312, change: 23,  label: 'geçen aya göre',     gradient: 'linear(135deg,#059669,#0d9488)', glow: 'rgba(5,150,105,0.28)',   icon: '✅', path: '/requests'  },
  { title: 'Aktif Bölge',       value: 7,   change: -2,  label: 'geçen haftaya göre', gradient: 'linear(135deg,#0369a1,#4338ca)', glow: 'rgba(3,105,161,0.28)',   icon: '📍', path: '/map'       },
]

function KpiCard({ title, value, change, label, gradient, glow, icon, path }: typeof kpiData[0]) {
  const navigate = useNavigate()
  const pos = change >= 0
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
      {/* Arka plan doku */}
      <Box position="absolute" inset={0} opacity={0.1}
        backgroundImage="radial-gradient(circle at 80% 20%, white 0%, transparent 55%)" />
      <Box position="absolute" inset={0} opacity={0.04}
        backgroundImage="radial-gradient(circle at 10% 90%, white 0%, transparent 50%)" />
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.65)" letterSpacing="widest" textTransform="uppercase" mb={2}>
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="white" lineHeight={1} mb={2}>{value}</Text>
          <Flex align="center" gap={1}>
            <Text fontSize="xs" color={pos ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,200,0.9)'} fontWeight="600">
              {pos ? '↑' : '↓'} {Math.abs(change)}%
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.5)">{label}</Text>
          </Flex>
        </Box>
        <Box fontSize="2xl" opacity={0.85}>{icon}</Box>
      </Flex>
    </MotionBox>
  )
}

// ── Son talepler ──────────────────────────────────────────────────
const recentRequests = [
  { id: '#1042', title: 'Enkaz altında yaralı var', severity: 'Kritik', time: '12 dk' },
  { id: '#1041', title: 'Bina çökmesi',             severity: 'Yüksek', time: '34 dk' },
  { id: '#1040', title: 'Yol kapanması',             severity: 'Orta',   time: '1 sa'  },
  { id: '#1039', title: 'Tıbbi yardım gerekli',      severity: 'Yüksek', time: '2 sa'  },
  { id: '#1038', title: 'Su baskını bildirimi',      severity: 'Orta',   time: '3 sa'  },
  { id: '#1037', title: 'Elektrik kesintisi',        severity: 'Düşük',  time: '4 sa'  },
]
const sev: Record<string,{color:string;bg:string}> = {
  'Kritik':{ color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  'Yüksek':{ color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  'Orta':  { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  'Düşük': { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
}

// ── Aktif bölgeler ────────────────────────────────────────────────
const zones = [
  { name:'Kadıköy, İstanbul', active:4, risk:'Yüksek', color:'#fb923c' },
  { name:'Bornova, İzmir',    active:7, risk:'Kritik',  color:'#f87171' },
  { name:'Çankaya, Ankara',   active:2, risk:'Orta',    color:'#fbbf24' },
  { name:'Gebze, Kocaeli',    active:9, risk:'Kritik',  color:'#f87171' },
]

// ── Sismik grafik ─────────────────────────────────────────────────
const seismicData = [0.8,1.2,0.6,1.8,2.4,1.1,0.9,3.2,2.8,1.4,0.7,1.6,2.1,3.8,2.9,1.3,0.8,1.9,2.6,1.7,0.9,1.1,1.4,0.6,1.2,0.8,1.5,3.1,2.2,1.0,0.7,1.3]
const maxSeis = Math.max(...seismicData)
const hours = ['00:00','06:00','12:00','18:00','24:00']

// ── Son aktiviteler ───────────────────────────────────────────────
const activities = [
  { text:'#1043 talebi çözüldü',                         time:'Az önce',    color:'#4ade80' },
  { text:'AI modeli Marmara için sarı uyarı verdi',       time:'Az önce',    color:'#818cf8' },
  { text:'#1045 yeni talep oluşturuldu · Pendik',         time:'Az önce',    color:'#f87171' },
  { text:'Gebze bölgesinde yeni kritik talep',            time:'Az önce',    color:'#fb923c' },
  { text:'M2.9 sismik olay · Kuzey Ege',                  time:'Az önce',    color:'#fbbf24' },
]

const cardStyle = {
  bg: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '2xl',
  overflow: 'hidden',
  backdropFilter: 'blur(16px)',
}

function DashboardPage() {
  return (
    <Box p={{ base:5, md:6 }}>

      {/* KPI kartları */}
      <Grid templateColumns={{ base:'1fr', sm:'repeat(2,1fr)', xl:'repeat(4,1fr)' }} gap={4} mb={5}>
        {kpiData.map((k,i) => (
          <MotionBox key={k.title} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i*0.08, duration:0.35 } as any}>
            <KpiCard {...k} />
          </MotionBox>
        ))}
      </Grid>

      {/* Orta satır */}
      <Grid templateColumns={{ base:'1fr', lg:'1fr 1fr' }} gap={4} mb={4}>

        {/* Son talepler */}
        <MotionBox {...cardStyle} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.3, duration:0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center" borderBottom="1px solid rgba(255,255,255,0.05)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity } as any}/>
              <Text color="white" fontWeight="600" fontSize="sm">Son Talepler</Text>
            </Flex>
            <Text color="#818cf8" fontSize="xs" fontWeight="600" cursor="pointer">Tümünü gör →</Text>
          </Flex>
          <Stack spacing={0}>
            {recentRequests.map((r,i) => (
              <Flex key={r.id} px={5} py={3} justify="space-between" align="center"
                borderBottom={i < recentRequests.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(129,140,248,0.04)' }} cursor="pointer" transition="background 0.15s">
                <Flex align="center" gap={3}>
                  <Text fontSize="10px" color="rgba(255,255,255,0.25)" fontFamily="mono" w={9}>{r.id}</Text>
                  <Text fontSize="sm" color="white" fontWeight="500">{r.title}</Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box px={2} py={0.5} borderRadius="full" bg={sev[r.severity].bg}>
                    <Text fontSize="10px" fontWeight="700" color={sev[r.severity].color}>{r.severity}</Text>
                  </Box>
                  <Text fontSize="xs" color="rgba(255,255,255,0.3)" w={8} textAlign="right">{r.time}</Text>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </MotionBox>

        {/* Aktif bölgeler */}
        <MotionBox {...cardStyle} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.38, duration:0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center" borderBottom="1px solid rgba(255,255,255,0.05)">
            <Text color="white" fontWeight="600" fontSize="sm">Aktif Bölgeler</Text>
            <Text color="#818cf8" fontSize="xs" fontWeight="600" cursor="pointer">Haritayı aç →</Text>
          </Flex>

          {/* Risk dağılım çubuğu */}
          <Box px={5} pt={4} pb={3}>
            <Text fontSize="10px" color="rgba(255,255,255,0.3)" fontWeight="600" letterSpacing="wider"
              textTransform="uppercase" mb={2}>Genel Risk Dağılımı</Text>
            <Flex h={2} borderRadius="full" overflow="hidden" gap="2px">
              {[{ w:'28%', color:'#f87171' },{ w:'28%', color:'#fb923c' },{ w:'29%', color:'#fbbf24' },{ w:'15%', color:'#4ade80' }].map((b,i) => (
                <MotionBox key={i} h="full" bg={b.color} borderRadius="full"
                  initial={{ width:0 }} animate={{ width:b.w }}
                  transition={{ duration:0.8, delay:0.5+i*0.1, ease:'easeOut' } as any}/>
              ))}
            </Flex>
            <Flex justify="space-between" mt={2}>
              {[{ l:'Kritik',c:'#f87171' },{ l:'Yüksek',c:'#fb923c' },{ l:'Orta',c:'#fbbf24' },{ l:'Düşük',c:'#4ade80' }].map(s => (
                <Flex key={s.l} align="center" gap={1}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg={s.c}/>
                  <Text fontSize="10px" color="rgba(255,255,255,0.35)">{s.l}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>

          <Stack spacing={0}>
            {zones.map((z,i) => (
              <Flex key={z.name} px={5} py={3} justify="space-between" align="center"
                borderBottom={i < zones.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(129,140,248,0.04)' }} cursor="pointer" transition="background 0.15s">
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} borderRadius="full" bg={z.color}/>
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

      {/* Alt satır — sismik + aktivite */}
      <Grid templateColumns={{ base:'1fr', lg:'1.4fr 1fr' }} gap={4}>

        {/* Sismik grafik */}
        <MotionBox {...cardStyle} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.46, duration:0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center" borderBottom="1px solid rgba(255,255,255,0.05)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity } as any}/>
              <Text color="white" fontWeight="600" fontSize="sm">Sismik Aktivite — Son 24 Saat</Text>
            </Flex>
            <Flex align="center" gap={3}>
              <Flex align="center" gap={1.5}>
                <Box w={2} h={2} borderRadius="full" bg="#818cf8"/>
                <Text fontSize="10px" color="rgba(255,255,255,0.4)">Magnitüd</Text>
              </Flex>
              <Text color="#818cf8" fontSize="xs" fontWeight="600" cursor="pointer">Detay →</Text>
            </Flex>
          </Flex>

          <Box px={5} pt={4} pb={2}>
            <Flex align="flex-end" h="100px" gap="3px">
              {seismicData.map((v, i) => {
                const pct = v / maxSeis
                const color = pct > 0.7 ? '#f87171' : pct > 0.45 ? '#fb923c' : '#818cf8'
                return (
                  <MotionBox key={i} flex={1} borderRadius="sm" bg={color} opacity={0.85}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.02, ease: 'easeOut' } as any}
                    whileHover={{ opacity:1, scaleY:1.05 } as any}
                    style={{ transformOrigin:'bottom' }}
                  />
                )
              })}
            </Flex>
            <Flex justify="space-between" mt={2}>
              {hours.map(h => (
                <Text key={h} fontSize="10px" color="rgba(255,255,255,0.25)">{h}</Text>
              ))}
            </Flex>
          </Box>

          {/* AI tahmin kutusu */}
          <Box mx={5} mb={4} mt={1} p={3} borderRadius="xl"
            bg="rgba(99,102,241,0.08)" border="1px solid rgba(129,140,248,0.2)">
            <Flex align="center" gap={2}>
              <Box w={6} h={6} borderRadius="lg" bg="rgba(99,102,241,0.25)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <Text fontSize="xs">⚡</Text>
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="700" color="#a5b4fc" textTransform="uppercase" letterSpacing="wider">AI TAHMİN</Text>
                <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                  Önümüzdeki 6 saatte <Text as="span" color="#c4b5fd" fontWeight="600">M3.2–3.8</Text> aktivite bekleniyor · İzmir-Ege bölgesi
                </Text>
              </Box>
            </Flex>
          </Box>
        </MotionBox>

        {/* Son aktiviteler */}
        <MotionBox {...cardStyle} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.52, duration:0.35 } as any}>
          <Flex px={5} py={3.5} align="center" borderBottom="1px solid rgba(255,255,255,0.05)">
            <Text color="white" fontWeight="600" fontSize="sm">Son Aktiviteler</Text>
          </Flex>
          <Stack spacing={0}>
            {activities.map((a, i) => (
              <MotionBox key={i}
                initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.6 + i*0.08, duration:0.3 } as any}
                px={5} py={3.5}
                borderBottom={i < activities.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(129,140,248,0.04)' }} cursor="pointer"
              >
                <Flex align="flex-start" gap={3}>
                  <Box w={2} h={2} borderRadius="full" bg={a.color} mt={1.5} flexShrink={0}/>
                  <Box>
                    <Text fontSize="xs" color="rgba(255,255,255,0.8)" lineHeight="1.5">{a.text}</Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={0.5}>{a.time}</Text>
                  </Box>
                </Flex>
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>
      </Grid>
    </Box>
  )
}

export default DashboardPage
