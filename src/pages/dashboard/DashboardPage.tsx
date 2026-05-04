import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Stack,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const MotionBox = motion(Box)

interface KpiCardProps {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ReactNode
  gradient: string
  glow: string
  delay: number
  path: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// KPI ikon SVG'leri
const AlertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const MapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)

const kpiData = [
  {
    title: 'Aktif Talepler',
    value: 24,
    change: 12,
    changeLabel: 'geçen haftaya göre',
    icon: <AlertIcon />,
    gradient: 'linear(135deg, #dc2626, #ea580c)',
    glow: 'rgba(220,38,38,0.3)',
    path: '/requests',
  },
  {
    title: 'Müsait Gönüllüler',
    value: 138,
    change: 8,
    changeLabel: 'geçen haftaya göre',
    icon: <UsersIcon />,
    gradient: 'linear(135deg, #4f46e5, #7c3aed)',
    glow: 'rgba(79,70,229,0.3)',
    path: '/volunteers',
  },
  {
    title: 'Çözülen Talepler',
    value: 312,
    change: 23,
    changeLabel: 'geçen aya göre',
    icon: <CheckIcon />,
    gradient: 'linear(135deg, #059669, #0d9488)',
    glow: 'rgba(5,150,105,0.3)',
    path: '/requests',
  },
  {
    title: 'Aktif Bölge',
    value: 7,
    change: -2,
    changeLabel: 'geçen haftaya göre',
    icon: <MapIcon />,
    gradient: 'linear(135deg, #d97706, #b45309)',
    glow: 'rgba(217,119,6,0.3)',
    path: '/map',
  },
]

function KpiCard({ title, value, change, changeLabel, icon, gradient, glow, delay, path }: KpiCardProps) {
  const navigate = useNavigate()
  return (
    <MotionBox
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: `0 12px 40px ${glow}` } as any}
      whileTap={{ scale: 0.98 } as any}
      transition={{ duration: 0.2 } as any}
      onClick={() => navigate(path)}
      cursor="pointer"
      bg="rgba(255,255,255,0.04)"
      border="1px solid rgba(255,255,255,0.07)"
      borderRadius="2xl"
      p={6}
      backdropFilter="blur(10px)"
      position="relative"
      overflow="hidden"
      cursor="default"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        h: '1px',
        bgGradient: gradient,
        opacity: 0.6,
      }}
    >
      <Flex justify="space-between" align="flex-start">
        <Stack spacing={3}>
          <Text color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase">
            {title}
          </Text>
          <Text color="white" fontSize="4xl" fontWeight="700" lineHeight={1}>
            {value}
          </Text>
          <Flex align="center" gap={1}>
            <Text fontSize="xs" color={change >= 0 ? 'green.400' : 'red.400'} fontWeight="600">
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </Text>
            <Text fontSize="xs" color="whiteAlpha.400">{changeLabel}</Text>
          </Flex>
        </Stack>

        {/* İkon kutusu */}
        <Box
          w={12} h={12}
          borderRadius="xl"
          bgGradient={gradient}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          boxShadow={`0 4px 16px ${glow}`}
          flexShrink={0}
        >
          {icon}
        </Box>
      </Flex>
    </MotionBox>
  )
}

function DashboardPage() {
  return (
    <Box p={{ base: 5, md: 8 }} maxW="1400px">
      {/* Başlık */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 } as any}
        mb={8}
      >
        <Heading size="lg" color="white" fontWeight="700">Dashboard</Heading>
        <Text color="whiteAlpha.500" fontSize="sm" mt={1}>
          Platforma genel bakış — veriler statiktir
        </Text>
      </MotionBox>

      {/* KPI Kartları */}
      <MotionBox variants={containerVariants} initial="hidden" animate="visible" mb={8}>
        <Grid
          templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }}
          gap={5}
        >
          {kpiData.map((kpi, i) => (
            <KpiCard key={kpi.title} {...kpi} delay={i * 0.1} />
          ))}
        </Grid>
      </MotionBox>

      {/* Alt satır — özet kartlar */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={5}>

        {/* Son talepler */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 } as any}
          bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl"
          p={6}
          backdropFilter="blur(10px)"
        >
          <Text color="white" fontWeight="600" fontSize="sm" mb={4}>Son Talepler</Text>
          <Stack spacing={3}>
            {[
              { id: '#1042', loc: 'Kadıköy, İstanbul', severity: 'Yüksek', color: 'red.400' },
              { id: '#1041', loc: 'Bornova, İzmir', severity: 'Orta', color: 'orange.400' },
              { id: '#1040', loc: 'Çankaya, Ankara', severity: 'Düşük', color: 'green.400' },
              { id: '#1039', loc: 'Nilüfer, Bursa', severity: 'Orta', color: 'orange.400' },
            ].map((item) => (
              <Flex key={item.id} justify="space-between" align="center" py={2} borderBottom="1px solid rgba(255,255,255,0.05)">
                <Flex align="center" gap={3}>
                  <Text color="whiteAlpha.400" fontSize="xs" fontFamily="mono">{item.id}</Text>
                  <Text color="whiteAlpha.700" fontSize="sm">{item.loc}</Text>
                </Flex>
                <Box px={2} py={0.5} borderRadius="md" bg="rgba(255,255,255,0.06)">
                  <Text fontSize="xs" fontWeight="600" color={item.color}>{item.severity}</Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </MotionBox>

        {/* Gönüllü durumu */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 } as any}
          bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl"
          p={6}
          backdropFilter="blur(10px)"
        >
          <Text color="white" fontWeight="600" fontSize="sm" mb={4}>Gönüllü Durumu</Text>
          <Stack spacing={3}>
            {[
              { label: 'Müsait', count: 138, color: '#4ade80', pct: 62 },
              { label: 'Görevde', count: 54, color: '#60a5fa', pct: 24 },
              { label: 'Pasif', count: 31, color: '#f87171', pct: 14 },
            ].map((item) => (
              <Box key={item.label}>
                <Flex justify="space-between" mb={1.5}>
                  <Text fontSize="xs" color="whiteAlpha.600">{item.label}</Text>
                  <Text fontSize="xs" color="whiteAlpha.500" fontFamily="mono">{item.count}</Text>
                </Flex>
                <Box h="5px" bg="rgba(255,255,255,0.07)" borderRadius="full" overflow="hidden">
                  <MotionBox
                    h="full"
                    borderRadius="full"
                    bg={item.color}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' } as any}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </MotionBox>

      </Grid>
    </Box>
  )
}

export default DashboardPage
