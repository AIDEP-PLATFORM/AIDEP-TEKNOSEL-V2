import { Box, Flex, Grid, Heading, Text, Avatar, Input, InputGroup, InputLeftElement, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const volunteers = [
  { name:'Ahmet Yılmaz',   role:'Arama Kurtarma', status:'Müsait',  region:'İstanbul', missions:14 },
  { name:'Zeynep Kaya',    role:'Sağlık',         status:'Görevde', region:'Ankara',   missions:9  },
  { name:'Murat Demir',    role:'Lojistik',       status:'Müsait',  region:'İzmir',    missions:21 },
  { name:'Elif Şahin',     role:'Arama Kurtarma', status:'Pasif',   region:'Bursa',    missions:6  },
  { name:'Can Öztürk',     role:'İletişim',       status:'Müsait',  region:'İstanbul', missions:18 },
  { name:'Selin Arslan',   role:'Sağlık',         status:'Görevde', region:'İzmir',    missions:11 },
  { name:'Burak Çelik',    role:'Lojistik',       status:'Müsait',  region:'Ankara',   missions:7  },
  { name:'Deniz Aydın',    role:'Arama Kurtarma', status:'Müsait',  region:'Antalya',  missions:23 },
]

const statusStyle: Record<string,{color:string;bg:string}> = {
  'Müsait':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
  'Görevde': { color:'#60a5fa', bg:'rgba(96,165,250,0.12)'  },
  'Pasif':   { color:'#9ca3af', bg:'rgba(156,163,175,0.12)' },
}
const roleColor: Record<string,string> = {
  'Arama Kurtarma':'#f87171',
  'Sağlık':        '#34d399',
  'Lojistik':      '#fbbf24',
  'İletişim':      '#60a5fa',
}
const roleAvatarBg: Record<string,string> = {
  'Arama Kurtarma':'rgba(248,113,113,0.15)',
  'Sağlık':        'rgba(52,211,153,0.15)',
  'Lojistik':      'rgba(251,191,36,0.15)',
  'İletişim':      'rgba(96,165,250,0.15)',
}

function VolunteersPage() {
  return (
    <Box p={{ base:5, md:6 }}>
      <MotionBox initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="800">Gönüllüler</Heading>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>Kayıtlı gönüllü listesi ve durum bilgisi</Text>
      </MotionBox>

      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={5}>
        {[
          { label:'Müsait',  count:138, color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)'  },
          { label:'Görevde', count:54,  color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.2)'  },
          { label:'Pasif',   count:31,  color:'#9ca3af', bg:'rgba(156,163,175,0.08)', border:'rgba(156,163,175,0.2)' },
        ].map((s,i) => (
          <MotionBox key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.08, duration:0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl" p={5} textAlign="center"
            backdropFilter="blur(12px)">
            <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.count}</Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)" mt={1} fontWeight="500" textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 } as any} mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="rgba(255,255,255,0.25)" mt={1}>
            <SearchIcon/>
          </InputLeftElement>
          <Input placeholder="İsim veya bölge ara..."
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="xl" color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }}
            _hover={{ borderColor:'rgba(249,115,22,0.5)' }}
            _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
            h={11} fontSize="sm"/>
        </InputGroup>
      </MotionBox>

      <MotionBox initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25, duration:0.35 } as any}
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl" overflow="hidden" backdropFilter="blur(12px)">
        <Grid templateColumns="2fr 1.5fr 1fr 1fr 0.8fr"
          px={6} py={3} borderBottom="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)">
          {['Gönüllü','Uzmanlık','Durum','Bölge','Görev'].map(h => (
            <Text key={h} fontSize="10px" color="rgba(255,255,255,0.3)" fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
          ))}
        </Grid>
        <Stack spacing={0}>
          {volunteers.map((v,i) => (
            <MotionBox key={v.name}
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:0.3+i*0.05, duration:0.3 } as any}
              whileHover={{ bg:'rgba(255,255,255,0.04)' } as any}>
              <Grid templateColumns="2fr 1.5fr 1fr 1fr 0.8fr"
                px={6} py={4} alignItems="center"
                borderBottom={i < volunteers.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>
                <Flex align="center" gap={3}>
                  <Avatar name={v.name} size="sm" bg={roleAvatarBg[v.role] ?? 'rgba(156,163,175,0.15)'} color={roleColor[v.role] ?? '#9ca3af'} fontSize="xs"/>
                  <Text fontSize="sm" color="white" fontWeight="500">{v.name}</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Box w={2} h={2} borderRadius="full" bg={roleColor[v.role] ?? '#9ca3af'} flexShrink={0}/>
                  <Text fontSize="sm" color="rgba(255,255,255,0.55)">{v.role}</Text>
                </Flex>
                <Box>
                  <Box display="inline-block" px={2.5} py={0.5} borderRadius="full" bg={statusStyle[v.status].bg}>
                    <Text fontSize="10px" fontWeight="700" color={statusStyle[v.status].color}>{v.status}</Text>
                  </Box>
                </Box>
                <Text fontSize="sm" color="rgba(255,255,255,0.5)">{v.region}</Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.35)" fontFamily="mono">{v.missions}</Text>
              </Grid>
            </MotionBox>
          ))}
        </Stack>
      </MotionBox>
    </Box>
  )
}

export default VolunteersPage
