import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box, Flex, Grid, Text, Stack, Select, Input,
  InputGroup, InputLeftElement, Spinner, Button,
  useToast,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getRole } from '@/utils/auth'
import {
  apiGetRequests, apiRunMatching,
  type HelpRequestResponse, type NeedType, type RequestStatus,
} from '@/services/requestService'

const MotionBox = motion(Box)

// ── Sabit eşlemeler ───────────────────────────────────────────────
const NEED_LABELS: Record<NeedType, { label: string; icon: string }> = {
  RESCUE:  { label: 'Kurtarma', icon: '🆘' },
  MEDICAL: { label: 'Medikal',  icon: '🏥' },
  SHELTER: { label: 'Barınak',  icon: '🏠' },
  FOOD:    { label: 'Gıda',     icon: '🍱' },
  OTHER:   { label: 'Diğer',    icon: '📋' },
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Beklemede', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  SCORED:    { label: 'Skorlandı', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  ASSIGNED:  { label: 'Atandı',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  EN_ROUTE:  { label: 'Yolda',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)'   },
  COMPLETED: { label: 'Tamamlandı',color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  CANCELLED: { label: 'İptal',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function urgencyConfig(level: number) {
  if (level >= 5) return { label: 'Kritik',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
  if (level >= 4) return { label: 'Yüksek',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  }
  if (level >= 3) return { label: 'Orta',      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  }
  if (level >= 2) return { label: 'Düşük',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  }
  return               { label: 'Çok Düşük', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
}

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m} dk önce`
  if (m < 1440) return `${Math.floor(m/60)} sa önce`
  return `${Math.floor(m/1440)} gün önce`
}

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const MatchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)

export default function RequestsPage() {
  const navigate = useNavigate()
  const toast    = useToast()
  const role     = getRole()

  const [requests, setRequests]     = useState<HelpRequestResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [matching, setMatching]     = useState(false)
  const [query, setQuery]           = useState('')
  const [statusFilter, setStatus]   = useState<string>('all')
  const [typeFilter, setType]       = useState<string>('all')

  const canMatch = ['NGO_MANAGER', 'OFFICIAL_MANAGER', 'ADMIN'].includes(role ?? '')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGetRequests()
      setRequests(data)
    } catch {
      toast({ title: 'Talepler yüklenemedi', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleMatch = async () => {
    setMatching(true)
    try {
      const res = await apiRunMatching()
      toast({
        title: `Eşleştirme tamamlandı`,
        description: `${res.matched} talep eşleşti, ${res.unmatched} bekliyor.`,
        status: 'success',
        duration: 5000,
      })
      await load()
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Eşleştirme başarısız'
      toast({ title: msg, status: 'error', duration: 4000 })
    } finally {
      setMatching(false)
    }
  }

  const stats = useMemo(() => ({
    open:      requests.filter(r => ['PENDING','SCORED'].includes(r.status)).length,
    active:    requests.filter(r => ['ASSIGNED','EN_ROUTE'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
  }), [requests])

  const filtered = useMemo(() => requests.filter(r => {
    const q = query.toLowerCase()
    const matchQ = !q
      || (r.description ?? '').toLowerCase().includes(q)
      || NEED_LABELS[r.need_type].label.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || r.status === statusFilter
    const matchT = typeFilter === 'all' || r.need_type === typeFilter
    return matchQ && matchS && matchT
  }), [requests, query, statusFilter, typeFilter])

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* Başlık */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 } as any} mb={6}>
        <Flex align="center" justify="space-between">
          <Box>
            <Text fontSize="xl" fontWeight="800" color="white">Talepler</Text>
            <Text color="rgba(255,255,255,0.4)" fontSize="sm" mt={0.5}>
              Aktif ve geçmiş yardım talepleri
            </Text>
          </Box>
          {canMatch && (
            <Button
              leftIcon={<MatchIcon />}
              isLoading={matching} loadingText="Eşleştiriliyor..."
              onClick={handleMatch}
              bg="linear-gradient(135deg,#6366f1,#7c3aed)"
              color="white" fontWeight="700" fontSize="sm"
              borderRadius="xl" h={9} px={5}
              _hover={{ opacity: 0.9, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
              _active={{ opacity: 0.8 }}
            >
              AI Eşleştir
            </Button>
          )}
        </Flex>
      </MotionBox>

      {/* KPI kartları */}
      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
        {[
          { label: 'Açık / Skorlandı', count: stats.open,      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)'  },
          { label: 'Atandı / Yolda',   count: stats.active,    color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)'  },
          { label: 'Tamamlandı',       count: stats.completed, color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)'  },
        ].map((s, i) => (
          <MotionBox key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 } as any}
            bg={s.bg} border={`1px solid ${s.border}`} borderRadius="2xl" p={5} textAlign="center"
            backdropFilter="blur(12px)">
            <Text fontSize="3xl" fontWeight="800" color={s.color}>
              {loading ? '—' : s.count}
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.45)" mt={1}
              fontWeight="500" textTransform="uppercase" letterSpacing="wider">
              {s.label}
            </Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Filtreler */}
      <Flex gap={3} mb={4} align="center" flexWrap="wrap">
        <InputGroup flex={1} maxW="320px">
          <InputLeftElement h={8} pl={3} color="rgba(255,255,255,0.3)">
            <SearchIcon />
          </InputLeftElement>
          <Input h={8} pl={10} fontSize="sm"
            placeholder="Açıklama, talep türü..."
            value={query} onChange={e => setQuery(e.target.value)}
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
            color="white" _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
            _hover={{ borderColor: 'rgba(129,140,248,0.4)' }}
            _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(129,140,248,0.12)' }}
            borderRadius="xl" />
        </InputGroup>

        <Select h={8} w="160px" fontSize="sm"
          value={statusFilter} onChange={e => setStatus(e.target.value)}
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
          color="rgba(255,255,255,0.7)" borderRadius="xl"
          _hover={{ borderColor: 'rgba(129,140,248,0.4)' }}
          _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(129,140,248,0.12)' }}
          sx={{ option: { background: '#0d0e20', color: 'white' } }}>
          <option value="all">Tüm Durumlar</option>
          <option value="PENDING">Beklemede</option>
          <option value="SCORED">Skorlandı</option>
          <option value="ASSIGNED">Atandı</option>
          <option value="EN_ROUTE">Yolda</option>
          <option value="COMPLETED">Tamamlandı</option>
          <option value="CANCELLED">İptal</option>
        </Select>

        <Select h={8} w="150px" fontSize="sm"
          value={typeFilter} onChange={e => setType(e.target.value)}
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
          color="rgba(255,255,255,0.7)" borderRadius="xl"
          _hover={{ borderColor: 'rgba(129,140,248,0.4)' }}
          _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(129,140,248,0.12)' }}
          sx={{ option: { background: '#0d0e20', color: 'white' } }}>
          <option value="all">Tüm Türler</option>
          <option value="RESCUE">Kurtarma</option>
          <option value="MEDICAL">Medikal</option>
          <option value="SHELTER">Barınak</option>
          <option value="FOOD">Gıda</option>
          <option value="OTHER">Diğer</option>
        </Select>

        <Text fontSize="xs" color="rgba(255,255,255,0.3)" ml="auto">
          {filtered.length} / {requests.length} talep
        </Text>
      </Flex>

      {/* Tablo */}
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 } as any}
        bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
        borderRadius="2xl" overflow="hidden">

        {/* Başlık */}
        <Grid templateColumns="2fr 1.2fr 1fr 1fr 1fr 1fr"
          px={5} py={3} bg="rgba(255,255,255,0.02)"
          borderBottom="1px solid rgba(255,255,255,0.06)">
          {['Talep', 'Konum', 'Tür', 'Aciliyet', 'Durum', 'Zaman'].map(h => (
            <Text key={h} fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.3)"
              letterSpacing="widest" textTransform="uppercase">{h}</Text>
          ))}
        </Grid>

        {loading ? (
          <Flex align="center" justify="center" py={14} gap={3}>
            <Spinner size="sm" color="#818cf8" />
            <Text fontSize="sm" color="rgba(255,255,255,0.35)">Yükleniyor...</Text>
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex align="center" justify="center" py={14}>
            <Text fontSize="sm" color="rgba(255,255,255,0.25)">
              {requests.length === 0 ? 'Henüz talep yok' : 'Talep bulunamadı'}
            </Text>
          </Flex>
        ) : (
          <Stack spacing={0}>
            {filtered.map((r, i) => {
              const need   = NEED_LABELS[r.need_type]
              const status = STATUS_CONFIG[r.status]
              const urg    = urgencyConfig(r.urgency_level)
              return (
                <MotionBox key={r.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.28 } as any}
                  onClick={() => navigate(`/requests/${r.id}`)}
                  cursor="pointer"
                  whileHover={{ bg: 'rgba(129,140,248,0.06)' } as any}
                  style={{ transition: 'background 0.15s' }}>
                  <Grid templateColumns="2fr 1.2fr 1fr 1fr 1fr 1fr"
                    px={5} py={4} alignItems="center"
                    borderBottom={i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>

                    {/* Talep */}
                    <Box overflow="hidden">
                      <Text fontSize="sm" color="white" fontWeight="500" isTruncated>
                        {r.description ?? `${need.icon} ${need.label} talebi`}
                      </Text>
                      <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={0.5}>
                        {r.person_count} kişi
                        {r.priority_score != null && ` · Öncelik: ${r.priority_score.toFixed(1)}`}
                      </Text>
                    </Box>

                    {/* Konum */}
                    <Text fontSize="xs" color="rgba(255,255,255,0.5)" isTruncated>
                      {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </Text>

                    {/* Tür */}
                    <Text fontSize="sm">{need.icon} {need.label}</Text>

                    {/* Aciliyet */}
                    <Box>
                      <Box display="inline-flex" px={2.5} py={0.5} borderRadius="full" bg={urg.bg}>
                        <Text fontSize="10px" fontWeight="700" color={urg.color}>{urg.label}</Text>
                      </Box>
                    </Box>

                    {/* Durum */}
                    <Box>
                      <Box display="inline-flex" align="center" gap={1.5} px={2.5} py={0.5} borderRadius="full" bg={status.bg}>
                        <Text fontSize="10px" fontWeight="700" color={status.color}>{status.label}</Text>
                      </Box>
                    </Box>

                    {/* Zaman */}
                    <Text fontSize="xs" color="rgba(255,255,255,0.3)">{fmtTime(r.created_at)}</Text>
                  </Grid>
                </MotionBox>
              )
            })}
          </Stack>
        )}
      </MotionBox>
    </Box>
  )
}
