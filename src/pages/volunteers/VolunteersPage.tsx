import { Box, Flex, Grid, Heading, Text, Avatar, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
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

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const volunteers = [
  { name: 'Ahmet Yılmaz',   role: 'Arama Kurtarma', status: 'Müsait',  region: 'İstanbul', missions: 14 },
  { name: 'Zeynep Kaya',    role: 'Sağlık',         status: 'Görevde', region: 'Ankara',   missions: 9  },
  { name: 'Murat Demir',    role: 'Lojistik',       status: 'Müsait',  region: 'İzmir',    missions: 21 },
  { name: 'Elif Şahin',     role: 'Arama Kurtarma', status: 'Pasif',   region: 'Bursa',    missions: 6  },
  { name: 'Can Öztürk',     role: 'İletişim',       status: 'Müsait',  region: 'İstanbul', missions: 18 },
  { name: 'Selin Arslan',   role: 'Sağlık',         status: 'Görevde', region: 'İzmir',    missions: 11 },
  { name: 'Burak Çelik',    role: 'Lojistik',       status: 'Müsait',  region: 'Ankara',   missions: 7  },
  { name: 'Deniz Aydın',    role: 'Arama Kurtarma', status: 'Müsait',  region: 'Antalya',  missions: 23 },
]

const statusColor: Record<string, { bg: string; color: string }> = {
  'Müsait':  { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  'Görevde': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  'Pasif':   { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
}

const roleColor: Record<string, string> = {
  'Arama Kurtarma': '#818cf8',
  'Sağlık':         '#34d399',
  'Lojistik':       '#fbbf24',
  'İletişim':       '#38bdf8',
}

function VolunteersPage() {
  return (
    <Box p={{ base: 5, md: 8 }}>
      {/* Başlık */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="700">Gönüllüler</Heading>
        <Text color="whiteAlpha.500" fontSize="sm" mt={1}>Kayıtlı gönüllü listesi ve durum bilgisi</Text>
      </MotionBox>

      {/* Özet kartlar */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        {[
          { label: 'Müsait',  count: 138, color: '#4ade80' },
          { label: 'Görevde', count: 54,  color: '#60a5fa' },
          { label: 'Pasif',   count: 31,  color: '#f87171' },
        ].map((s) => (
          <MotionBox
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 } as any}
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.07)"
            borderRadius="xl"
            p={4}
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="700" color={s.color}>{s.count}</Text>
            <Text fontSize="xs" color="whiteAlpha.500" mt={1}>{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Arama */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 } as any} mb={5}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="whiteAlpha.400" mt={1}>
            <SearchIcon />
          </InputLeftElement>
          <Input
            placeholder="İsim veya bölge ara..."
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="xl"
            color="white"
            _placeholder={{ color: 'whiteAlpha.300' }}
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #7c3aed' }}
            h={11}
            fontSize="sm"
          />
        </InputGroup>
      </MotionBox>

      {/* Tablo */}
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        bg="rgba(255,255,255,0.03)"
        border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl"
        overflow="hidden"
      >
        {/* Tablo başlığı */}
        <Grid
          templateColumns="2fr 1.5fr 1fr 1fr 0.8fr"
          px={6} py={3}
          borderBottom="1px solid rgba(255,255,255,0.06)"
          bg="rgba(255,255,255,0.03)"
        >
          {['Gönüllü', 'Uzmanlık', 'Durum', 'Bölge', 'Görev'].map((h) => (
            <Text key={h} fontSize="xs" color="whiteAlpha.400" fontWeight="600" letterSpacing="wider" textTransform="uppercase">
              {h}
            </Text>
          ))}
        </Grid>

        {/* Satırlar */}
        {volunteers.map((v, i) => (
          <MotionBox
            key={v.name}
            variants={itemVariants}
            whileHover={{ bg: 'rgba(255,255,255,0.04)' } as any}
            transition={{ duration: 0.15 } as any}
          >
            <Grid
              templateColumns="2fr 1.5fr 1fr 1fr 0.8fr"
              px={6} py={4}
              borderBottom={i < volunteers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
              alignItems="center"
            >
              <Flex align="center" gap={3}>
                <Avatar name={v.name} size="sm" bg="rgba(99,102,241,0.3)" color="#818cf8" fontSize="xs" />
                <Text fontSize="sm" color="white" fontWeight="500">{v.name}</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Box w={2} h={2} borderRadius="full" bg={roleColor[v.role] ?? '#888'} flexShrink={0} />
                <Text fontSize="sm" color="whiteAlpha.700">{v.role}</Text>
              </Flex>
              <Box>
                <Box
                  display="inline-block"
                  px={2.5} py={0.5}
                  borderRadius="full"
                  bg={statusColor[v.status].bg}
                >
                  <Text fontSize="xs" fontWeight="600" color={statusColor[v.status].color}>{v.status}</Text>
                </Box>
              </Box>
              <Text fontSize="sm" color="whiteAlpha.600">{v.region}</Text>
              <Text fontSize="sm" color="whiteAlpha.500" fontFamily="mono">{v.missions}</Text>
            </Grid>
          </MotionBox>
        ))}
      </MotionBox>
    </Box>
  )
}

export default VolunteersPage
