import { Box, Grid, Heading, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const requests = [
  { id: '#1042', title: 'Enkaz altında yaralı var',   location: 'Kadıköy, İstanbul', severity: 'Yüksek', status: 'Açık',     time: '12 dk önce' },
  { id: '#1041', title: 'Bina çökmesi',               location: 'Bornova, İzmir',    severity: 'Kritik', status: 'Devam',    time: '34 dk önce' },
  { id: '#1040', title: 'Yol kapanması',               location: 'Çankaya, Ankara',   severity: 'Orta',   status: 'Açık',     time: '1 sa önce'  },
  { id: '#1039', title: 'Tıbbi yardım gerekli',        location: 'Nilüfer, Bursa',    severity: 'Yüksek', status: 'Devam',    time: '2 sa önce'  },
  { id: '#1038', title: 'Altyapı hasarı',              location: 'Muratpaşa, Antalya',severity: 'Düşük',  status: 'Çözüldü',  time: '3 sa önce'  },
  { id: '#1037', title: 'Mahsur kalan vatandaşlar',    location: 'Gebze, Kocaeli',    severity: 'Kritik', status: 'Açık',     time: '4 sa önce'  },
  { id: '#1036', title: 'Su baskını',                  location: 'Menemen, İzmir',    severity: 'Orta',   status: 'Çözüldü',  time: '5 sa önce'  },
]

const severityStyle: Record<string, { bg: string; color: string }> = {
  'Kritik':  { bg: 'rgba(220,38,38,0.15)',   color: '#f87171' },
  'Yüksek':  { bg: 'rgba(234,88,12,0.15)',   color: '#fb923c' },
  'Orta':    { bg: 'rgba(234,179,8,0.15)',   color: '#facc15' },
  'Düşük':   { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Açık':    { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
  'Devam':   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  'Çözüldü': { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
}

function RequestsPage() {
  return (
    <Box p={{ base: 5, md: 8 }}>
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="700">Talepler</Heading>
        <Text color="whiteAlpha.500" fontSize="sm" mt={1}>Aktif ve geçmiş yardım talepleri</Text>
      </MotionBox>

      {/* Özet */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        {[
          { label: 'Açık',    count: 24, color: '#60a5fa' },
          { label: 'Devam',   count: 8,  color: '#fbbf24' },
          { label: 'Çözüldü', count: 312, color: '#4ade80' },
        ].map((s) => (
          <MotionBox
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 } as any}
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="xl" p={4} textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="700" color={s.color}>{s.count}</Text>
            <Text fontSize="xs" color="whiteAlpha.500" mt={1}>{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Liste */}
      <MotionBox
        variants={containerVariants} initial="hidden" animate="visible"
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl" overflow="hidden"
      >
        <Grid
          templateColumns="0.6fr 2fr 1.5fr 1fr 1fr 1fr"
          px={6} py={3}
          borderBottom="1px solid rgba(255,255,255,0.06)"
          bg="rgba(255,255,255,0.03)"
        >
          {['ID', 'Talep', 'Konum', 'Aciliyet', 'Durum', 'Zaman'].map((h) => (
            <Text key={h} fontSize="xs" color="whiteAlpha.400" fontWeight="600" letterSpacing="wider" textTransform="uppercase">
              {h}
            </Text>
          ))}
        </Grid>

        {requests.map((r, i) => (
          <MotionBox
            key={r.id} variants={itemVariants}
            whileHover={{ bg: 'rgba(255,255,255,0.04)' } as any}
            transition={{ duration: 0.15 } as any}
            cursor="pointer"
          >
            <Grid
              templateColumns="0.6fr 2fr 1.5fr 1fr 1fr 1fr"
              px={6} py={4}
              borderBottom={i < requests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
              alignItems="center"
            >
              <Text fontSize="xs" color="whiteAlpha.400" fontFamily="mono">{r.id}</Text>
              <Text fontSize="sm" color="white" fontWeight="500">{r.title}</Text>
              <Text fontSize="sm" color="whiteAlpha.600">{r.location}</Text>
              <Box>
                <Box display="inline-block" px={2.5} py={0.5} borderRadius="full" bg={severityStyle[r.severity].bg}>
                  <Text fontSize="xs" fontWeight="600" color={severityStyle[r.severity].color}>{r.severity}</Text>
                </Box>
              </Box>
              <Box>
                <Box display="inline-block" px={2.5} py={0.5} borderRadius="full" bg={statusStyle[r.status].bg}>
                  <Text fontSize="xs" fontWeight="600" color={statusStyle[r.status].color}>{r.status}</Text>
                </Box>
              </Box>
              <Text fontSize="xs" color="whiteAlpha.400">{r.time}</Text>
            </Grid>
          </MotionBox>
        ))}
      </MotionBox>
    </Box>
  )
}

export default RequestsPage
