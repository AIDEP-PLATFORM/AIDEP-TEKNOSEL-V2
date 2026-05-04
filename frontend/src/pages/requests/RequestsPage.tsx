import { Box, Grid, Heading, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const requests = [
  { id:'#1042', title:'Enkaz altında yaralı var',    location:'Kadıköy, İstanbul',   severity:'Yüksek', status:'Açık',    time:'12 dk önce' },
  { id:'#1041', title:'Bina çökmesi',                location:'Bornova, İzmir',      severity:'Kritik', status:'Devam',   time:'34 dk önce' },
  { id:'#1040', title:'Yol kapanması',               location:'Çankaya, Ankara',     severity:'Orta',   status:'Açık',    time:'1 sa önce'  },
  { id:'#1039', title:'Tıbbi yardım gerekli',        location:'Nilüfer, Bursa',      severity:'Yüksek', status:'Devam',   time:'2 sa önce'  },
  { id:'#1038', title:'Altyapı hasarı',              location:'Muratpaşa, Antalya',  severity:'Düşük',  status:'Çözüldü', time:'3 sa önce'  },
  { id:'#1037', title:'Mahsur kalan vatandaşlar',    location:'Gebze, Kocaeli',      severity:'Kritik', status:'Açık',    time:'4 sa önce'  },
  { id:'#1036', title:'Su baskını',                  location:'Menemen, İzmir',      severity:'Orta',   status:'Çözüldü', time:'5 sa önce'  },
]

const sev: Record<string,{color:string;bg:string}> = {
  'Kritik': { color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  'Yüksek': { color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  'Orta':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  'Düşük':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
}
const sta: Record<string,{color:string;bg:string}> = {
  'Açık':    { color:'#60a5fa', bg:'rgba(96,165,250,0.12)' },
  'Devam':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)' },
  'Çözüldü': { color:'#4ade80', bg:'rgba(74,222,128,0.12)' },
}

function RequestsPage() {
  return (
    <Box p={{ base:5, md:6 }}>
      <MotionBox initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="800">Talepler</Heading>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>Aktif ve geçmiş yardım talepleri</Text>
      </MotionBox>

      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
        {[
          { label:'Açık',    count:24,  color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.2)'  },
          { label:'Devam',   count:8,   color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)'  },
          { label:'Çözüldü', count:312, color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)'  },
        ].map((s,i) => (
          <MotionBox key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.08, duration:0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl" p={5} textAlign="center"
            backdropFilter="blur(12px)">
            <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.count}</Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.45)" mt={1} fontWeight="500" textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      <MotionBox initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.35 } as any}
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl" overflow="hidden" backdropFilter="blur(12px)">
        <Grid templateColumns="0.5fr 2fr 1.5fr 1fr 1fr 1fr"
          px={6} py={3} borderBottom="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)">
          {['ID','Talep','Konum','Aciliyet','Durum','Zaman'].map(h => (
            <Text key={h} fontSize="10px" color="rgba(255,255,255,0.3)" fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
          ))}
        </Grid>
        <Stack spacing={0}>
          {requests.map((r,i) => (
            <MotionBox key={r.id}
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:0.25+i*0.05, duration:0.3 } as any}
              whileHover={{ bg:'rgba(255,255,255,0.04)' } as any}
              cursor="pointer">
              <Grid templateColumns="0.5fr 2fr 1.5fr 1fr 1fr 1fr"
                px={6} py={4} alignItems="center"
                borderBottom={i < requests.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>
                <Text fontSize="xs" color="rgba(255,255,255,0.25)" fontFamily="mono">{r.id}</Text>
                <Text fontSize="sm" color="white" fontWeight="500">{r.title}</Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.5)">{r.location}</Text>
                <Box><Box display="inline-block" px={2.5} py={0.5} borderRadius="full" bg={sev[r.severity].bg}>
                  <Text fontSize="10px" fontWeight="700" color={sev[r.severity].color}>{r.severity}</Text>
                </Box></Box>
                <Box><Box display="inline-block" px={2.5} py={0.5} borderRadius="full" bg={sta[r.status].bg}>
                  <Text fontSize="10px" fontWeight="700" color={sta[r.status].color}>{r.status}</Text>
                </Box></Box>
                <Text fontSize="xs" color="rgba(255,255,255,0.3)">{r.time}</Text>
              </Grid>
            </MotionBox>
          ))}
        </Stack>
      </MotionBox>
    </Box>
  )
}

export default RequestsPage
