import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box, Flex, Grid, Heading, Text, Input, InputGroup,
  InputLeftElement, Stack, Spinner, useToast,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getRole } from '@/utils/auth'
import { STKS, activityColor, stkStatusCfg } from '@/data/stkData'
import {
  apiGetPendingVolunteers, apiApproveVolunteer, apiRejectVolunteer,
  type OrgMember,
} from '@/services/volunteerService'

const MotionBox = motion(Box)

// ── Icons ─────────────────────────────────────────────────────
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
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dk önce`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} sa önce`
  return `${Math.floor(hrs / 24)} gün önce`
}

// ── Pending volunteer card ────────────────────────────────────
function PendingCard({ member, onApprove, onReject, loading }: {
  member: OrgMember
  onApprove: () => void
  onReject: () => void
  loading: boolean
}) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      bg="rgba(251,191,36,0.04)" border="1px solid rgba(251,191,36,0.18)"
      borderRadius="2xl" p={4} backdropFilter="blur(12px)"
    >
      <Flex align="center" gap={4}>
        {/* Avatar */}
        <Flex w={10} h={10} borderRadius="lg" bg="rgba(251,191,36,0.12)"
          border="1px solid rgba(251,191,36,0.3)" align="center" justify="center" flexShrink={0}>
          <Text fontSize="sm" fontWeight="800" color="#fbbf24">
            {member.full_name.charAt(0).toUpperCase()}
          </Text>
        </Flex>

        {/* Bilgiler */}
        <Box flex={1} minW={0}>
          <Flex align="center" gap={2} mb={0.5}>
            <Text fontSize="sm" fontWeight="700" color="white" isTruncated>{member.full_name}</Text>
            <Box px={2} py={0.5} borderRadius="full" flexShrink={0}
              bg={member.role === 'VOLUNTEER' ? 'rgba(129,140,248,0.15)' : 'rgba(96,165,250,0.15)'}
              border={member.role === 'VOLUNTEER' ? '1px solid rgba(129,140,248,0.35)' : '1px solid rgba(96,165,250,0.35)'}>
              <Text fontSize="9px" fontWeight="700"
                color={member.role === 'VOLUNTEER' ? '#a5b4fc' : '#60a5fa'}>
                {member.role === 'VOLUNTEER' ? 'Gönüllü' : 'Saha Personeli'}
              </Text>
            </Box>
          </Flex>
          <Flex align="center" gap={2} flexWrap="wrap">
            <Text fontSize="xs" color="rgba(255,255,255,0.4)" isTruncated>{member.email}</Text>
            <Box w="1px" h={3} bg="rgba(255,255,255,0.15)" />
            <Flex align="center" gap={1} color="rgba(255,255,255,0.3)">
              <ClockIcon />
              <Text fontSize="10px">{relativeTime(member.created_at)}</Text>
            </Flex>
          </Flex>
          {member.phone && (
            <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={0.5}>{member.phone}</Text>
          )}
        </Box>

        {/* Aksiyon butonları */}
        <Flex gap={2} flexShrink={0}>
          <MotionBox
            onClick={loading ? undefined : onApprove}
            cursor={loading ? 'not-allowed' : 'pointer'}
            w={8} h={8} borderRadius="lg"
            bg="rgba(74,222,128,0.12)" border="1px solid rgba(74,222,128,0.3)"
            display="flex" alignItems="center" justifyContent="center"
            color="#4ade80"
            whileHover={{ bg: 'rgba(74,222,128,0.22)' } as any}
            whileTap={{ scale: 0.93 } as any}
            transition={{ duration: 0.12 } as any}
          >
            {loading ? <Spinner size="xs" color="#4ade80" /> : <CheckIcon />}
          </MotionBox>
          <MotionBox
            onClick={loading ? undefined : onReject}
            cursor={loading ? 'not-allowed' : 'pointer'}
            w={8} h={8} borderRadius="lg"
            bg="rgba(248,113,113,0.12)" border="1px solid rgba(248,113,113,0.3)"
            display="flex" alignItems="center" justifyContent="center"
            color="#f87171"
            whileHover={{ bg: 'rgba(248,113,113,0.22)' } as any}
            whileTap={{ scale: 0.93 } as any}
            transition={{ duration: 0.12 } as any}
          >
            <XIcon />
          </MotionBox>
        </Flex>
      </Flex>
    </MotionBox>
  )
}

// ── Main ─────────────────────────────────────────────────────
function VolunteersPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const role = getRole()
  const isNgoManager = role === 'NGO_MANAGER'

  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<OrgMember[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filtered = useMemo(() =>
    STKS.filter(s =>
      s.org.toLowerCase().includes(search.toLowerCase()) ||
      s.activity.toLowerCase().includes(search.toLowerCase())
    ), [search])

  const totalMembers = STKS.reduce((acc, s) => acc + s.members.length, 0)
  const activeCount  = STKS.filter(s => s.status === 'Aktif').length

  const loadPending = useCallback(async () => {
    if (!isNgoManager) return
    setLoadingPending(true)
    try {
      setPending(await apiGetPendingVolunteers())
    } catch {
      // sessiz başarısız
    } finally {
      setLoadingPending(false)
    }
  }, [isNgoManager])

  useEffect(() => { loadPending() }, [loadPending])

  const handleApprove = async (member: OrgMember) => {
    setActionLoading(member.id)
    try {
      await apiApproveVolunteer(member.id)
      toast({ title: `${member.full_name} onaylandı`, status: 'success', duration: 3000, isClosable: true })
      loadPending()
    } catch {
      toast({ title: 'Onaylama başarısız', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (member: OrgMember) => {
    setActionLoading(member.id)
    try {
      await apiRejectVolunteer(member.id)
      toast({ title: `${member.full_name} reddedildi`, status: 'warning', duration: 3000, isClosable: true })
      loadPending()
    } catch {
      toast({ title: 'İşlem başarısız', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setActionLoading(null)
    }
  }

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

      {/* ── Bekleyen Onaylar (sadece NGO_MANAGER) ─────────────── */}
      {isNgoManager && (
        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 } as any} mb={6}
          bg="rgba(255,255,255,0.02)" border="1px solid rgba(251,191,36,0.15)"
          borderRadius="2xl" p={5} backdropFilter="blur(12px)">

          <Flex align="center" gap={3} mb={4}>
            <Flex align="center" gap={2}>
              <MotionBox w={2} h={2} borderRadius="full" bg="#fbbf24"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity } as any} />
              <Text fontSize="sm" fontWeight="700" color="white">Onay Bekleyenler</Text>
            </Flex>
            {pending.length > 0 && (
              <Box px={2} py={0.5} borderRadius="full"
                bg="rgba(251,191,36,0.15)" border="1px solid rgba(251,191,36,0.35)">
                <Text fontSize="10px" fontWeight="700" color="#fbbf24">{pending.length}</Text>
              </Box>
            )}
          </Flex>

          {loadingPending ? (
            <Flex justify="center" py={4}>
              <Spinner size="sm" color="#fbbf24" />
            </Flex>
          ) : pending.length === 0 ? (
            <Flex align="center" justify="center" py={5} direction="column" gap={2}>
              <Text fontSize="sm" color="rgba(255,255,255,0.25)">Bekleyen gönüllü yok</Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.15)">
                Mobilden kayıt olan gönüllüler burada görünür
              </Text>
            </Flex>
          ) : (
            <Stack spacing={2}>
              {pending.map(member => (
                <PendingCard
                  key={member.id}
                  member={member}
                  loading={actionLoading === member.id}
                  onApprove={() => handleApprove(member)}
                  onReject={() => handleReject(member)}
                />
              ))}
            </Stack>
          )}
        </MotionBox>
      )}

      {/* ── İstatistik kartları ────────────────────────────────── */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={5}>
        {[
          { label: 'Toplam STK',  count: STKS.length,  color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
          { label: 'Aktif',       count: activeCount,   color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
          { label: 'Toplam Üye',  count: totalMembers,  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
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

      {/* ── Arama ─────────────────────────────────────────────── */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2 } as any} mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" h={8} color="rgba(255,255,255,0.3)">
            <SearchIcon />
          </InputLeftElement>
          <Input
            placeholder="STK adı veya faaliyet alanı ara..."
            value={search} onChange={e => setSearch(e.target.value)}
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="xl" color="white"
            _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
            _hover={{ borderColor: 'rgba(52,211,153,0.4)' }}
            _focus={{ borderColor: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,0.12)' }}
            h={8} fontSize="sm" pl={10}
          />
        </InputGroup>
      </MotionBox>

      {/* ── STK Listesi ───────────────────────────────────────── */}
      <Stack spacing={3}>
        {filtered.map((stk, i) => {
          const cfg    = stkStatusCfg[stk.status]
          const aColor = activityColor[stk.activity] ?? '#9ca3af'
          const ils    = [...new Set(stk.members.map(m => m.il))]

          return (
            <MotionBox key={stk.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.32 } as any}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.14)' } as any}
              onClick={() => navigate(`/volunteers/${stk.id}`)}
              cursor="pointer"
              bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
              borderRadius="2xl" overflow="hidden" backdropFilter="blur(12px)">
              <Flex align="center" px={6} py={4} gap={4}>
                <Flex w={12} h={12} borderRadius="xl" flexShrink={0}
                  bg={`${aColor}18`} border={`1px solid ${aColor}33`}
                  align="center" justify="center">
                  <Box color={aColor}><UsersIcon /></Box>
                </Flex>
                <Box flex={1} minW={0}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="sm" fontWeight="700" color="white" isTruncated>{stk.org}</Text>
                    <Box px={2} py={0.5} borderRadius="full" bg={cfg.bg} flexShrink={0}>
                      <Text fontSize="10px" fontWeight="700" color={cfg.color}>{stk.status}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap={3} flexWrap="wrap">
                    <Flex align="center" gap={1.5}>
                      <Box w={2} h={2} borderRadius="full" bg={aColor} />
                      <Text fontSize="xs" color="rgba(255,255,255,0.45)">{stk.activity}</Text>
                    </Flex>
                    <Flex align="center" gap={1.5} color="rgba(255,255,255,0.35)">
                      <UsersIcon />
                      <Text fontSize="xs">{stk.members.length} üye</Text>
                    </Flex>
                    <Flex align="center" gap={1} color="rgba(255,255,255,0.35)">
                      <MapPinIcon />
                      <Text fontSize="xs">{ils.join(' · ')}</Text>
                    </Flex>
                  </Flex>
                </Box>
                <Box color="rgba(255,255,255,0.25)" flexShrink={0}><ChevronIcon /></Box>
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
