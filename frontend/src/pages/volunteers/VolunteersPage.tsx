import { useState, useMemo } from 'react'
import { Box, Flex, Grid, Heading, Text, Input, InputGroup, InputLeftElement, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { STKS, activityColor, stkStatusCfg } from '@/data/stkData'

const MotionBox = motion(Box)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

function VolunteersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    STKS.filter(s =>
      s.org.toLowerCase().includes(search.toLowerCase()) ||
      s.activity.toLowerCase().includes(search.toLowerCase())
    ), [search])

  const totalMembers = STKS.reduce((acc, s) => acc + s.members.length, 0)
  const activeCount  = STKS.filter(s => s.status === 'Aktif').length

  return (
    <Box p={{ base: 5, md: 6 }}>
      {/* Başlık */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 } as any} mb={6}>
        <Heading size="lg" color="white" fontWeight="800">STK Yetkililer</Heading>
        <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={1}>
          Kayıtlı sivil toplum kuruluşları ve personel bilgileri
        </Text>
      </MotionBox>

      {/* İstatistik kartları */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={5}>
        {[
          { label: 'Toplam STK',   count: STKS.length,  color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
          { label: 'Aktif',        count: activeCount,   color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
          { label: 'Toplam Üye',   count: totalMembers,  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
        ].map((s, i) => (
          <MotionBox key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl" p={5} textAlign="center"
            backdropFilter="blur(12px)">
            <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.count}</Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)" mt={1} fontWeight="500"
              textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Arama */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2 } as any} mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" h={8} color="rgba(255,255,255,0.3)">
            <SearchIcon />
          </InputLeftElement>
          <Input
            placeholder="STK adı veya faaliyet alanı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="xl"
            color="white"
            _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
            _hover={{ borderColor: 'rgba(52,211,153,0.4)' }}
            _focus={{ borderColor: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,0.12)' }}
            h={8} fontSize="sm" pl={10}
          />
        </InputGroup>
      </MotionBox>

      {/* STK Listesi */}
      <Stack spacing={3}>
        {filtered.map((stk, i) => {
          const cfg    = stkStatusCfg[stk.status]
          const aColor = activityColor[stk.activity] ?? '#9ca3af'
          const ils    = [...new Set(stk.members.map(m => m.il))]

          return (
            <MotionBox
              key={stk.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.32 } as any}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.14)' } as any}
              onClick={() => navigate(`/volunteers/${stk.id}`)}
              cursor="pointer"
              bg="rgba(255,255,255,0.03)"
              border="1px solid rgba(255,255,255,0.07)"
              borderRadius="2xl"
              overflow="hidden"
              backdropFilter="blur(12px)"
            >
              <Flex align="center" px={6} py={4} gap={4}>
                {/* İkon */}
                <Flex w={12} h={12} borderRadius="xl" flexShrink={0}
                  bg={`${aColor}18`} border={`1px solid ${aColor}33`}
                  align="center" justify="center">
                  <Box color={aColor}>
                    <UsersIcon />
                  </Box>
                </Flex>

                {/* Bilgiler */}
                <Box flex={1} minW={0}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="sm" fontWeight="700" color="white" isTruncated>
                      {stk.org}
                    </Text>
                    {/* Durum rozeti */}
                    <Box px={2} py={0.5} borderRadius="full" bg={cfg.bg} flexShrink={0}>
                      <Text fontSize="10px" fontWeight="700" color={cfg.color}>{stk.status}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap={3} flexWrap="wrap">
                    {/* Faaliyet */}
                    <Flex align="center" gap={1.5}>
                      <Box w={2} h={2} borderRadius="full" bg={aColor} />
                      <Text fontSize="xs" color="rgba(255,255,255,0.45)">{stk.activity}</Text>
                    </Flex>
                    {/* Üye sayısı */}
                    <Flex align="center" gap={1.5} color="rgba(255,255,255,0.35)">
                      <UsersIcon />
                      <Text fontSize="xs">{stk.members.length} üye</Text>
                    </Flex>
                    {/* İller */}
                    <Flex align="center" gap={1} color="rgba(255,255,255,0.35)">
                      <MapPinIcon />
                      <Text fontSize="xs">{ils.join(' · ')}</Text>
                    </Flex>
                  </Flex>
                </Box>

                {/* Ok */}
                <Box color="rgba(255,255,255,0.25)" flexShrink={0}>
                  <ChevronIcon />
                </Box>
              </Flex>
            </MotionBox>
          )
        })}

        {filtered.length === 0 && (
          <Box textAlign="center" py={12}>
            <Text color="rgba(255,255,255,0.3)" fontSize="sm">Sonuç bulunamadı</Text>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

export default VolunteersPage
