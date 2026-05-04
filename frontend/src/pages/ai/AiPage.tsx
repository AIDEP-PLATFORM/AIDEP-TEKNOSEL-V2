import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const predictions = [
  { region:'İzmir - Ege Denizi',     range:'M3.2–3.8', prob:78, timeframe:'6 saat',  risk:'Orta',   icon:'🌊' },
  { region:'Kahramanmaraş - Doğu',   range:'M2.5–3.2', prob:62, timeframe:'12 saat', risk:'Düşük',  icon:'⛰️' },
  { region:'İstanbul - Marmara',     range:'M3.8–4.5', prob:45, timeframe:'24 saat', risk:'Yüksek', icon:'🏙️' },
  { region:'Muğla - Güneybatı',      range:'M2.8–3.5', prob:55, timeframe:'18 saat', risk:'Orta',   icon:'🏝️' },
]

const riskStyle: Record<string,{color:string;bg:string}> = {
  'Kritik': { color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  'Yüksek': { color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  'Orta':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  'Düşük':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
}

const card = { bg:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'2xl', overflow:'hidden', backdropFilter:'blur(12px)' }

function AiPage() {
  return (
    <Box p={{ base:5, md:6 }}>
      <MotionBox initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 } as any} mb={6}>
        <Flex align="center" gap={3}>
          <Heading size="lg" color="white" fontWeight="800">AI Tahminler</Heading>
          <Box px={2.5} py={1} borderRadius="full" bg="rgba(251,191,36,0.12)" border="1px solid rgba(251,191,36,0.25)">
            <Text fontSize="10px" fontWeight="700" color="#fbbf24" letterSpacing="wider">CANLI</Text>
          </Box>
        </Flex>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>Yapay zeka destekli sismik aktivite öngörüleri</Text>
      </MotionBox>

      {/* AI bilgi kartı */}
      <MotionBox initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.4 } as any}
        mb={5} p={5} borderRadius="2xl" backdropFilter="blur(12px)"
        bg="linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))"
        border="1px solid rgba(124,58,237,0.25)">
        <Flex align="center" gap={4}>
          <MotionBox w={12} h={12} borderRadius="xl"
            bg="linear-gradient(135deg,#7c3aed,#4f46e5)"
            display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            boxShadow="0 0 24px rgba(124,58,237,0.4)"
            animate={{ scale:[1,1.05,1] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' } as any}>
            <Text fontSize="xl">🤖</Text>
          </MotionBox>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="white">AIDEP Neural Network v2.1</Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.5)" mt={0.5}>
              Son 72 saatlik sismik veri işlendi · Model güvenilirliği: <Text as="span" color="#a78bfa" fontWeight="600">%87</Text>
            </Text>
          </Box>
          <Box ml="auto" textAlign="right">
            <Text fontSize="xs" color="rgba(255,255,255,0.3)">Son güncelleme</Text>
            <Text fontSize="sm" fontWeight="600" color="white">22:14</Text>
          </Box>
        </Flex>
      </MotionBox>

      {/* Tahmin kartları */}
      <Grid templateColumns={{ base:'1fr', md:'repeat(2,1fr)' }} gap={4} mb={5}>
        {predictions.map((p,i) => (
          <MotionBox key={p.region} {...card}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.15+i*0.08, duration:0.35 } as any}
            p={5}>
            <Flex justify="space-between" align="flex-start" mb={3}>
              <Flex align="center" gap={3}>
                <Text fontSize="2xl">{p.icon}</Text>
                <Box>
                  <Text fontSize="sm" color="white" fontWeight="600">{p.region}</Text>
                  <Text fontSize="xs" color="rgba(255,255,255,0.4)" mt={0.5}>{p.timeframe} içinde</Text>
                </Box>
              </Flex>
              <Box px={2.5} py={0.5} borderRadius="full" bg={riskStyle[p.risk].bg}>
                <Text fontSize="10px" fontWeight="700" color={riskStyle[p.risk].color}>{p.risk}</Text>
              </Box>
            </Flex>

            <Flex align="center" gap={3} mb={3}>
              <Text fontSize="2xl" fontWeight="800" color={riskStyle[p.risk].color}>{p.range}</Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.3)">magnitüd</Text>
            </Flex>

            {/* Olasılık çubuğu */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="10px" color="rgba(255,255,255,0.4)" fontWeight="600" textTransform="uppercase" letterSpacing="wider">Olasılık</Text>
                <Text fontSize="10px" color={riskStyle[p.risk].color} fontWeight="700">%{p.prob}</Text>
              </Flex>
              <Box h={1.5} bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
                <MotionBox h="full" bg={riskStyle[p.risk].color} borderRadius="full"
                  initial={{ width:0 }} animate={{ width:`${p.prob}%` }}
                  transition={{ duration:0.8, delay:0.4+i*0.1, ease:'easeOut' } as any}/>
              </Box>
            </Box>
          </MotionBox>
        ))}
      </Grid>

      {/* Uyarı notu */}
      <MotionBox {...card} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.55, duration:0.35 } as any} p={4}>
        <Flex align="center" gap={3}>
          <Text fontSize="lg">⚠️</Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.4)" lineHeight="1.6">
            Bu tahminler istatistiksel modelleme ve geçmiş sismik verilere dayanmaktadır. Kesin deprem tahmini mümkün değildir. Acil durumlarda resmi AFAD açıklamalarını takip ediniz.
          </Text>
        </Flex>
      </MotionBox>
    </Box>
  )
}

export default AiPage
