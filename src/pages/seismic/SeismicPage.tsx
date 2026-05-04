import { Box, Flex, Grid, Heading, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const seismicEvents = [
  { id:'EQ-2401', loc:'İzmir - Ege Denizi',      mag:3.4, depth:8,  time:'22:14', risk:'Orta'   },
  { id:'EQ-2400', loc:'Kahramanmaraş - Merkez',  mag:2.8, depth:12, time:'21:47', risk:'Düşük'  },
  { id:'EQ-2399', loc:'Muğla - Bodrum',          mag:4.1, depth:6,  time:'20:33', risk:'Yüksek' },
  { id:'EQ-2398', loc:'Kocaeli - İzmit',         mag:2.2, depth:15, time:'19:58', risk:'Düşük'  },
  { id:'EQ-2397', loc:'Bingöl - Merkez',         mag:3.9, depth:9,  time:'18:22', risk:'Orta'   },
  { id:'EQ-2396', loc:'Denizli - Honaz',         mag:4.8, depth:5,  time:'17:05', risk:'Kritik' },
]

const data = [0.8,1.2,0.6,1.8,2.4,1.1,0.9,3.2,2.8,1.4,0.7,1.6,2.1,3.8,2.9,1.3,0.8,1.9,2.6,1.7,0.9,1.1,1.4,0.6]
const mx = Math.max(...data)

const riskStyle: Record<string,{color:string;bg:string}> = {
  'Kritik': { color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  'Yüksek': { color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  'Orta':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  'Düşük':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
}

const card = { bg:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'2xl', overflow:'hidden', backdropFilter:'blur(12px)' }

function SeismicPage() {
  return (
    <Box p={{ base:5, md:6 }}>
      <MotionBox initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="800">Sismik Veriler</Heading>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>Son 24 saat sismik aktivite kaydı</Text>
      </MotionBox>

      {/* Özet */}
      <Grid templateColumns="repeat(4,1fr)" gap={4} mb={5}>
        {[
          { label:'Son 24 Saat',  value:'24',  sub:'kayıt',    color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.2)'  },
          { label:'Maks Magnitüd',value:'4.8', sub:'bugün',    color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)' },
          { label:'Kritik Bölge', value:'3',   sub:'bölge',    color:'#fb923c', bg:'rgba(251,146,60,0.08)',  border:'rgba(251,146,60,0.2)'  },
          { label:'Ort Derinlik', value:'9.2', sub:'km',       color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)'  },
        ].map((s,i) => (
          <MotionBox key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.07, duration:0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl" p={4} textAlign="center" backdropFilter="blur(12px)">
            <Text fontSize="2xl" fontWeight="800" color={s.color}>{s.value}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.35)" mt={1} fontWeight="600" textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.25)">{s.sub}</Text>
          </MotionBox>
        ))}
      </Grid>

      <Grid templateColumns={{ base:'1fr', lg:'1.4fr 1fr' }} gap={5}>
        {/* Grafik */}
        <MotionBox {...card} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25, duration:0.35 } as any}>
          <Flex px={5} py={3.5} justify="space-between" align="center" borderBottom="1px solid rgba(255,255,255,0.06)">
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#4ade80"
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity } as any}/>
              <Text color="white" fontWeight="600" fontSize="sm">Saat Bazlı Aktivite</Text>
            </Flex>
            <Flex align="center" gap={3}>
              {[{ c:'#f87171',l:'Kritik' },{ c:'#fb923c',l:'Yüksek' },{ c:'#818cf8',l:'Normal' }].map(x => (
                <Flex key={x.l} align="center" gap={1}>
                  <Box w={2} h={2} borderRadius="full" bg={x.c}/>
                  <Text fontSize="10px" color="rgba(255,255,255,0.35)">{x.l}</Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Box px={5} pt={5} pb={4}>
            <Flex align="flex-end" h="120px" gap="4px">
              {data.map((v,i) => {
                const pct = v/mx
                const color = pct > 0.75 ? '#f87171' : pct > 0.45 ? '#fb923c' : '#818cf8'
                return (
                  <MotionBox key={i} flex={1} borderRadius="sm" bg={color} opacity={0.8}
                    initial={{ height:0 }} animate={{ height:`${pct*100}%` }}
                    transition={{ duration:0.6, delay:0.4+i*0.025, ease:'easeOut' } as any}
                    whileHover={{ opacity:1, scaleY:1.04 } as any} style={{ transformOrigin:'bottom' }}/>
                )
              })}
            </Flex>
            <Flex justify="space-between" mt={2}>
              {['00:00','06:00','12:00','18:00','24:00'].map(h => (
                <Text key={h} fontSize="10px" color="rgba(255,255,255,0.25)">{h}</Text>
              ))}
            </Flex>
          </Box>
        </MotionBox>

        {/* Son olaylar */}
        <MotionBox {...card} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32, duration:0.35 } as any}>
          <Box px={5} py={3.5} borderBottom="1px solid rgba(255,255,255,0.06)">
            <Text color="white" fontWeight="600" fontSize="sm">Son Sismik Olaylar</Text>
          </Box>
          <Stack spacing={0}>
            {seismicEvents.map((e,i) => (
              <MotionBox key={e.id}
                initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.4+i*0.06, duration:0.3 } as any}
                px={5} py={3.5} borderBottom={i < seismicEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(255,255,255,0.03)' }} cursor="pointer">
                <Flex justify="space-between" align="center" mb={1}>
                  <Flex align="center" gap={2}>
                    <Box w={2} h={2} borderRadius="full" bg={riskStyle[e.risk].color}/>
                    <Text fontSize="xs" color="white" fontWeight="600">M{e.mag}</Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.25)" fontFamily="mono">{e.id}</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Box px={2} py={0.5} borderRadius="full" bg={riskStyle[e.risk].bg}>
                      <Text fontSize="10px" fontWeight="700" color={riskStyle[e.risk].color}>{e.risk}</Text>
                    </Box>
                    <Text fontSize="10px" color="rgba(255,255,255,0.3)">{e.time}</Text>
                  </Flex>
                </Flex>
                <Text fontSize="xs" color="rgba(255,255,255,0.5)">{e.loc} · {e.depth}km</Text>
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>
      </Grid>
    </Box>
  )
}

export default SeismicPage
