import { Box, Flex, Grid, Heading, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const zones = [
  { id: 'Z-01', name: 'Kadıköy',   city: 'İstanbul', risk: 'Yüksek',  active: 4, color: '#f87171' },
  { id: 'Z-02', name: 'Bornova',   city: 'İzmir',    risk: 'Kritik',  active: 7, color: '#fb923c' },
  { id: 'Z-03', name: 'Çankaya',   city: 'Ankara',   risk: 'Orta',    active: 2, color: '#facc15' },
  { id: 'Z-04', name: 'Nilüfer',   city: 'Bursa',    risk: 'Yüksek',  active: 3, color: '#f87171' },
  { id: 'Z-05', name: 'Muratpaşa', city: 'Antalya',  risk: 'Düşük',   active: 1, color: '#4ade80' },
  { id: 'Z-06', name: 'Gebze',     city: 'Kocaeli',  risk: 'Kritik',  active: 9, color: '#fb923c' },
  { id: 'Z-07', name: 'Menemen',   city: 'İzmir',    risk: 'Orta',    active: 2, color: '#facc15' },
]

const riskStyle: Record<string, { bg: string; color: string }> = {
  'Kritik': { bg: 'rgba(251,146,60,0.15)', color: '#fb923c' },
  'Yüksek': { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  'Orta':   { bg: 'rgba(250,204,21,0.12)', color: '#facc15' },
  'Düşük':  { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
}

function MapPage() {
  return (
    <Box p={{ base: 5, md: 8 }}>
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="700">Harita</Heading>
        <Text color="whiteAlpha.500" fontSize="sm" mt={1}>Aktif bölgeler ve risk durumu</Text>
      </MotionBox>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={5}>

        {/* Harita placeholder */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 } as any}
          bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl" overflow="hidden" minH="420px" position="relative"
        >
          {/* Sahte harita grid */}
          <Box
            position="absolute" inset={0}
            opacity={0.04}
            backgroundImage="linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)"
            backgroundSize="40px 40px"
          />
          {/* Animasyonlu noktalar */}
          {zones.map((z, i) => (
            <MotionBox
              key={z.id}
              position="absolute"
              w={3} h={3}
              borderRadius="full"
              bg={z.color}
              top={`${20 + (i * 11) % 70}%`}
              left={`${15 + (i * 17) % 70}%`}
              boxShadow={`0 0 10px ${z.color}`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' } as any}
            />
          ))}
          <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap={2}>
            <Text color="whiteAlpha.200" fontSize="sm">Harita entegrasyonu</Text>
            <Text color="whiteAlpha.200" fontSize="xs">Backend hazır olduğunda bağlanacak</Text>
          </Flex>
        </MotionBox>

        {/* Bölge listesi */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 } as any}
          bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl" overflow="hidden"
        >
          <Box px={6} py={4} borderBottom="1px solid rgba(255,255,255,0.06)">
            <Text color="white" fontWeight="600" fontSize="sm">Aktif Bölgeler</Text>
          </Box>
          <Stack spacing={0}>
            {zones.map((z, i) => (
              <MotionBox
                key={z.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.3 } as any}
                whileHover={{ bg: 'rgba(255,255,255,0.04)' } as any}
                px={6} py={3.5}
                borderBottom={i < zones.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                cursor="pointer"
              >
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={3}>
                    <Box w={2.5} h={2.5} borderRadius="full" bg={z.color} boxShadow={`0 0 6px ${z.color}`} />
                    <Box>
                      <Text fontSize="sm" color="white" fontWeight="500">{z.name}</Text>
                      <Text fontSize="xs" color="whiteAlpha.400">{z.city} · {z.id}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap={3}>
                    <Text fontSize="xs" color="whiteAlpha.500">{z.active} aktif</Text>
                    <Box px={2.5} py={0.5} borderRadius="full" bg={riskStyle[z.risk].bg}>
                      <Text fontSize="xs" fontWeight="600" color={riskStyle[z.risk].color}>{z.risk}</Text>
                    </Box>
                  </Flex>
                </Flex>
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>

      </Grid>
    </Box>
  )
}

export default MapPage
