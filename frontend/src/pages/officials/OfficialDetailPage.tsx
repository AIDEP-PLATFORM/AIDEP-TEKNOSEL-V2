import { useEffect, useMemo, useState } from 'react'
import { Box, Flex, Grid, Text, Input, InputGroup, InputLeftElement, Stack, Spinner } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGetOrganizationById, type OrganizationRecord } from '@/services/organizationAdminService'
import { apiGetOfficialOrgMembers, type OfficialMember } from '@/services/officialService'

const MotionBox  = motion(Box)
const MotionFlex = motion(Flex)

// ── İkonlar ──────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const MapPinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const ACCENT = '#60a5fa'

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('tr-TR', { year: '2-digit', month: '2-digit' }) }
  catch { return '—' }
}

function roleLabel(role: string): string {
  if (role === 'OFFICIAL_MANAGER') return 'Yönetici'
  if (role === 'OFFICIAL_STAFF')   return 'Personel'
  return role
}

// ── Ana sayfa ─────────────────────────────────────────────────────
export default function OfficialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [org, setOrg]         = useState<OrganizationRecord | null>(null)
  const [members, setMembers] = useState<OfficialMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [query, setQuery]     = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      apiGetOrganizationById(id),
      apiGetOfficialOrgMembers(id),
    ])
      .then(([o, m]) => { setOrg(o); setMembers(m) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const filtered = useMemo(() => {
    if (!query) return members
    const q = query.toLowerCase()
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  }, [members, query])

  const activeCount  = members.filter(m => m.is_active).length
  const passiveCount = members.filter(m => !m.is_active).length

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center" gap={3}>
        <Spinner color={ACCENT} size="md" />
        <Text color="rgba(255,255,255,0.4)" fontSize="sm">Yükleniyor...</Text>
      </Flex>
    )
  }

  if (error || !org) {
    return (
      <Flex h="60vh" align="center" justify="center" direction="column" gap={3}>
        <Text color="rgba(255,255,255,0.4)" fontSize="lg">Kurum bulunamadı</Text>
        <MotionBox onClick={() => navigate('/officials')} cursor="pointer"
          px={4} py={2} borderRadius="xl" bg={`${ACCENT}12`}
          border={`1px solid ${ACCENT}30`} color={ACCENT}
          whileHover={{ opacity: 0.8 } as any}
          transition={{ duration: 0.15 } as any}>
          <Text fontSize="sm" fontWeight="600">← Geri Dön</Text>
        </MotionBox>
      </Flex>
    )
  }

  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

  return (
    <Box px={6} py={5}>

      {/* Başlık */}
      <MotionFlex align="center" gap={4} mb={6}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 } as any}>

        <MotionBox onClick={() => navigate('/officials')} cursor="pointer"
          w={9} h={9} borderRadius="xl"
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
          display="flex" alignItems="center" justifyContent="center"
          color="rgba(255,255,255,0.5)"
          whileHover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' } as any}
          whileTap={{ scale: 0.9 } as any}
          transition={{ duration: 0.15 } as any}>
          <BackIcon />
        </MotionBox>

        <Flex align="center" gap={3}>
          <Flex w={11} h={11} borderRadius="xl"
            bg={`${ACCENT}18`} border={`1px solid ${ACCENT}40`}
            align="center" justify="center" flexShrink={0}>
            <Text fontSize="14px" fontWeight="800" color={ACCENT}>{initials}</Text>
          </Flex>
          <Box>
            <Text color="white" fontWeight="800" fontSize="lg" lineHeight={1.2}>{org.name}</Text>
            <Flex align="center" gap={2} mt={0.5}>
              <Box color={ACCENT} opacity={0.7} display="flex"><MapPinIcon /></Box>
              <Text fontSize="xs" color="rgba(255,255,255,0.4)">
                {org.city} / {org.district}
              </Text>
              <Box w="1px" h={3} bg="rgba(255,255,255,0.15)" />
              <Box px={2} py={0.5} borderRadius="full"
                bg={`${ACCENT}18`} border={`1px solid ${ACCENT}30`}>
                <Text fontSize="9px" fontWeight="700" color={ACCENT}>RESMİ</Text>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </MotionFlex>

      {/* Özet stat */}
      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
        {[
          { label: 'Toplam Personel', count: members.length, color: ACCENT    },
          { label: 'Aktif',           count: activeCount,    color: '#4ade80' },
          { label: 'Pasif',           count: passiveCount,   color: '#9ca3af' },
        ].map((s, i) => (
          <MotionBox key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 } as any}
            bg="rgba(255,255,255,0.03)" border={`1px solid ${s.color}28`}
            borderRadius="2xl" p={5} textAlign="center">
            <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.count}</Text>
            <Text fontSize="9px" color="rgba(255,255,255,0.35)" mt={1} fontWeight="700"
              textTransform="uppercase" letterSpacing="widest">{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Arama */}
      <MotionBox mb={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1 } as any}>
        <Flex gap={3} align="center">
          <InputGroup flex={1} maxW="340px">
            <InputLeftElement pointerEvents="none" h={8} pl={3} color="rgba(255,255,255,0.3)">
              <SearchIcon />
            </InputLeftElement>
            <Input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Personel adı veya e-posta..."
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="xl" color="white" _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
              _focus={{ borderColor: `${ACCENT}60`, boxShadow: `0 0 0 3px ${ACCENT}20`, bg: 'rgba(255,255,255,0.06)' }}
              h={8} fontSize="sm" pl={10} />
          </InputGroup>
          <Text fontSize="xs" color="rgba(255,255,255,0.3)" ml="auto">
            {filtered.length} personel · <Text as="span" color={ACCENT}>{org.city}</Text>
          </Text>
        </Flex>
      </MotionBox>

      {/* Personel tablosu */}
      <AnimatePresence mode="wait">
        <MotionBox
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 } as any}
          bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl" overflow="hidden">

          <Grid templateColumns="2.4fr 1.4fr 1fr 1fr 1fr"
            px={5} py={3}
            borderBottom="1px solid rgba(255,255,255,0.06)"
            bg="rgba(255,255,255,0.02)">
            {['Ad Soyad / E-posta', 'Unvan', 'Katılım', 'Durum', 'Sicil'].map((h, i) => (
              <Text key={i} fontSize="9px" color="rgba(255,255,255,0.28)"
                fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
            ))}
          </Grid>

          <Stack spacing={0}>
            {filtered.length === 0 ? (
              <Flex align="center" justify="center" py={14} direction="column" gap={2}>
                <Text fontSize="sm" color="rgba(255,255,255,0.25)">
                  {members.length === 0 ? 'Bu kurumda henüz personel yok' : 'Personel bulunamadı'}
                </Text>
              </Flex>
            ) : filtered.map((m, i) => {
              const isActive   = m.is_active
              const rLabel     = roleLabel(m.role)
              const roleColor  = m.role === 'OFFICIAL_MANAGER' ? '#60a5fa' : '#93c5fd'
              const roleBg     = m.role === 'OFFICIAL_MANAGER' ? 'rgba(96,165,250,0.12)' : 'rgba(147,197,253,0.1)'

              return (
                <MotionBox key={m.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.22 } as any}
                  borderBottom={i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                  _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                  style={{ transition: 'background 0.15s' }}>

                  <Grid templateColumns="2.4fr 1.4fr 1fr 1fr 1fr"
                    px={5} py={4} alignItems="center">

                    {/* Ad / E-posta */}
                    <Flex align="center" gap={3} overflow="hidden">
                      <Flex w={9} h={9} borderRadius="lg"
                        bg={`${ACCENT}18`} border={`1px solid ${ACCENT}30`}
                        align="center" justify="center" flexShrink={0}>
                        <Text fontSize="11px" fontWeight="800" color={ACCENT}>
                          {m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </Flex>
                      <Box overflow="hidden">
                        <Text fontSize="sm" color="white" fontWeight="600" isTruncated>{m.full_name}</Text>
                        <Text fontSize="10px" color="rgba(255,255,255,0.3)" isTruncated>
                          {m.phone || m.email}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Unvan */}
                    <Box px={2.5} py={1} borderRadius="full" bg={roleBg} w="fit-content">
                      <Text fontSize="10px" fontWeight="700" color={roleColor}>{rLabel}</Text>
                    </Box>

                    {/* Katılım */}
                    <Text fontSize="xs" color="rgba(255,255,255,0.3)" fontFamily="mono">
                      {fmtDate(m.created_at)}
                    </Text>

                    {/* Durum */}
                    <Flex align="center" gap={2}>
                      <MotionBox w={2} h={2} borderRadius="full"
                        bg={isActive ? '#4ade80' : '#9ca3af'}
                        animate={isActive ? { opacity: [1, 0.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity } as any} />
                      <Box px={2.5} py={1} borderRadius="full"
                        bg={isActive ? 'rgba(74,222,128,0.12)' : 'rgba(156,163,175,0.12)'}>
                        <Text fontSize="10px" fontWeight="700"
                          color={isActive ? '#4ade80' : '#9ca3af'}>
                          {isActive ? 'Aktif' : 'Pasif'}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Sicil no */}
                    <Text fontSize="10px" color="rgba(255,255,255,0.3)" fontFamily="mono" isTruncated>
                      {m.registration_number || '—'}
                    </Text>
                  </Grid>
                </MotionBox>
              )
            })}
          </Stack>
        </MotionBox>
      </AnimatePresence>
    </Box>
  )
}
