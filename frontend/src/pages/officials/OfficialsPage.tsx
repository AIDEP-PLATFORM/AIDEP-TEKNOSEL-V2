import { useEffect, useState, useMemo } from 'react'
import { Box, Flex, Grid, Text, Input, InputGroup, InputLeftElement, Stack, Spinner } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiListOrganizations, type OrganizationRecord } from '@/services/organizationAdminService'

const MotionBox = motion(Box)

// ── İkonlar ──────────────────────────────────────────────────────
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
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const ACCENT = '#60a5fa'

// ── Sayfa ────────────────────────────────────────────────────────
export default function OfficialsPage() {
  const navigate = useNavigate()
  const [orgs, setOrgs]       = useState<OrganizationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')

  useEffect(() => {
    apiListOrganizations('OFFICIAL')
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query) return orgs
    const q = query.toLowerCase()
    return orgs.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.district.toLowerCase().includes(q)
    )
  }, [orgs, query])

  const uniqueCities = useMemo(() => new Set(orgs.map(o => o.city)).size, [orgs])

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center" gap={3}>
        <Spinner color={ACCENT} size="md" />
        <Text color="rgba(255,255,255,0.4)" fontSize="sm">Yükleniyor...</Text>
      </Flex>
    )
  }

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* KPI satırı */}
      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
        {[
          { label: 'Toplam Şube',  value: orgs.length,  color: ACCENT    },
          { label: 'İl Sayısı',   value: uniqueCities, color: '#818cf8' },
          { label: 'Kurum Türü',  value: 'Resmi',      color: '#4ade80' },
        ].map((k, i) => (
          <MotionBox key={k.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i*0.08, duration:0.3 } as any}
            bg="rgba(255,255,255,0.03)" border={`1px solid ${k.color}25`}
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="3xl" fontWeight="800" color={k.color}>{k.value}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.35)" mt={1} fontWeight="700"
              textTransform="uppercase" letterSpacing="widest">{k.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Arama */}
      <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.15 } as any} mb={4}>
        <Flex gap={3} align="center">
          <InputGroup flex={1} maxW="400px">
            <InputLeftElement pointerEvents="none" h={8} color="rgba(255,255,255,0.3)">
              <SearchIcon />
            </InputLeftElement>
            <Input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Kurum adı, il veya ilçe ara..."
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="xl" color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }}
              _focus={{ borderColor:`${ACCENT}60`, boxShadow:`0 0 0 3px ${ACCENT}20`, bg:'rgba(255,255,255,0.06)' }}
              h={8} fontSize="sm" pl={10} />
          </InputGroup>
          <Text fontSize="xs" color="rgba(255,255,255,0.3)" ml="auto">
            {filtered.length} kurum
          </Text>
        </Flex>
      </MotionBox>

      {/* Tablo */}
      <MotionBox initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.22, duration:0.35 } as any}
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl" overflow="hidden" backdropFilter="blur(12px)">

        {/* Başlık */}
        <Grid templateColumns="2fr 1.5fr 1.5fr 1fr"
          px={6} py={3}
          borderBottom="1px solid rgba(255,255,255,0.06)"
          bg="rgba(255,255,255,0.02)">
          {['Kurum Adı', 'İl', 'İlçe / Şube', ''].map(h => (
            <Text key={h} fontSize="10px" color="rgba(255,255,255,0.3)"
              fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
          ))}
        </Grid>

        <Stack spacing={0}>
          {filtered.length === 0 ? (
            <Box px={6} py={14} textAlign="center">
              <Text fontSize="sm" color="rgba(255,255,255,0.3)">
                {orgs.length === 0 ? 'Henüz resmi kurum kaydı yok' : 'Eşleşen kayıt bulunamadı'}
              </Text>
            </Box>
          ) : filtered.map((o, i) => {
            const initials = o.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
            return (
              <MotionBox key={o.id}
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: 0.26 + i*0.05, duration:0.25 } as any}
                onClick={() => navigate(`/officials/${o.id}`)}
                cursor="pointer"
                borderBottom={i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(255,255,255,0.04)' }}
                style={{ transition:'background 0.15s' }}>

                <Grid templateColumns="2fr 1.5fr 1.5fr 1fr"
                  px={6} py={4} alignItems="center">

                  {/* Kurum adı */}
                  <Flex align="center" gap={3}>
                    <Flex w={9} h={9} borderRadius="lg" flexShrink={0}
                      align="center" justify="center"
                      bg={`${ACCENT}18`} border={`1px solid ${ACCENT}35`}>
                      <Text fontSize="11px" fontWeight="800" color={ACCENT}>{initials}</Text>
                    </Flex>
                    <Box>
                      <Text fontSize="sm" color="white" fontWeight="700">{o.name}</Text>
                      <Box px={2} py={0.5} borderRadius="full" w="fit-content" mt={0.5}
                        bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                        <Text fontSize="9px" fontWeight="700" color={ACCENT}>RESMİ</Text>
                      </Box>
                    </Box>
                  </Flex>

                  {/* İl */}
                  <Flex align="center" gap={1.5}>
                    <Box color={ACCENT} opacity={0.7} display="flex"><MapPinIcon /></Box>
                    <Text fontSize="sm" color="rgba(255,255,255,0.65)">{o.city}</Text>
                  </Flex>

                  {/* İlçe */}
                  <Text fontSize="sm" color="rgba(255,255,255,0.45)">{o.district}</Text>

                  {/* Ok */}
                  <Flex justify="flex-end">
                    <Box color="rgba(255,255,255,0.25)" display="flex">
                      <ChevronIcon />
                    </Box>
                  </Flex>
                </Grid>
              </MotionBox>
            )
          })}
        </Stack>
      </MotionBox>
    </Box>
  )
}
