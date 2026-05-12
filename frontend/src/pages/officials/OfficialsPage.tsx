import { useState, useMemo } from 'react'
import { Box, Flex, Grid, Text, Input, InputGroup, InputLeftElement, Stack, Select } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { OFFICIALS, orgConfig, type OrgKey } from '@/data/officialsData'

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
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const BanIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Avatar ───────────────────────────────────────────────────────
function OrgAvatar({ name, color }: { name: string; color: string }) {
  return (
    <Flex w={9} h={9} borderRadius="lg" flexShrink={0}
      align="center" justify="center"
      bg={`${color}18`} border={`1px solid ${color}35`}>
      <Text fontSize="11px" fontWeight="800" color={color}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </Flex>
  )
}

// ── Aksiyon butonu ───────────────────────────────────────────────
function ActionBtn({ icon, color, title, onClick }: {
  icon: React.ReactNode; color: string; title?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  return (
    <MotionBox onClick={onClick} cursor="pointer" title={title}
      w={7} h={7} borderRadius="lg"
      bg={`${color}12`} border={`1px solid ${color}28`}
      display="flex" alignItems="center" justifyContent="center" color={color}
      whileHover={{ opacity: 0.8 } as any}
      whileTap={{ scale: 0.88 } as any}
      transition={{ duration: 0.12 } as any}>
      {icon}
    </MotionBox>
  )
}

// ── Sayfa ────────────────────────────────────────────────────────
export default function OfficialsPage() {
  const navigate = useNavigate()
  const [query, setQuery]           = useState('')
  const [orgFilter, setOrgFilter]   = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return OFFICIALS.filter(o => {
      if (orgFilter && o.org !== orgFilter) return false
      if (statusFilter && o.status !== statusFilter) return false
      if (query) {
        const q = query.toLowerCase()
        return o.org.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [query, orgFilter, statusFilter])

  // KPI kartları
  const totalPersonnel = OFFICIALS.reduce((a, o) => a + o.members.length, 0)
  const onDuty = OFFICIALS.reduce((a, o) => a + o.members.filter(m => m.status === 'Görevde').length, 0)
  const available = OFFICIALS.reduce((a, o) => a + o.members.filter(m => m.status === 'Müsait').length, 0)

  const selectStyle = {
    bg: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'xl',
    color: 'white',
    fontSize: 'sm',
    h: 8,
    _hover: { borderColor: 'rgba(96,165,250,0.4)' },
    _focus: { borderColor: '#60a5fa', boxShadow: '0 0 0 3px rgba(96,165,250,0.12)' },
  } as const

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* KPI satırı */}
      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
        {[
          { label:'Toplam Personel', value: totalPersonnel, color:'#60a5fa' },
          { label:'Görevde',         value: onDuty,         color:'#818cf8' },
          { label:'Müsait',          value: available,      color:'#4ade80' },
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

      {/* Filtreler */}
      <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.15 } as any} mb={4}>
        <Flex gap={3} align="center">
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none" h={8} color="rgba(255,255,255,0.3)">
              <SearchIcon />
            </InputLeftElement>
            <Input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Kurum veya açıklama ara..."
              {...selectStyle} pl={10} />
          </InputGroup>

          <Select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
            {...selectStyle} maxW="160px" sx={{ option: { bg:'#1a1b2e' } }}>
            <option value="">Tüm Kurumlar</option>
            <option value="AFAD">AFAD</option>
            <option value="UMKE">UMKE</option>
            <option value="Kızılay">Kızılay</option>
          </Select>

          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            {...selectStyle} maxW="140px" sx={{ option: { bg:'#1a1b2e' } }}>
            <option value="">Tüm Durum</option>
            <option value="Aktif">Aktif</option>
            <option value="Pasif">Pasif</option>
          </Select>
        </Flex>
      </MotionBox>

      {/* Tablo */}
      <MotionBox initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.22, duration:0.35 } as any}
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="2xl" overflow="hidden" backdropFilter="blur(12px)">

        {/* Başlık */}
        <Grid templateColumns="2.2fr 2fr 0.8fr 1fr 0.8fr 80px"
          px={6} py={3}
          borderBottom="1px solid rgba(255,255,255,0.06)"
          bg="rgba(255,255,255,0.02)">
          {['Kurum', 'Açıklama', 'Personel', 'Bölge', 'Durum', ''].map(h => (
            <Text key={h} fontSize="10px" color="rgba(255,255,255,0.3)"
              fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
          ))}
        </Grid>

        <Stack spacing={0}>
          {filtered.map((o, i) => {
            const cfg = orgConfig[o.org as OrgKey]
            const regionCount = new Set(o.members.map(m => `${m.il}___${m.ilce}`)).size
            const isActive = o.status === 'Aktif'

            return (
              <MotionBox key={o.id}
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: 0.26 + i*0.06, duration:0.28 } as any}
                onClick={() => navigate(`/officials/${o.id}`)}
                cursor="pointer"
                borderBottom={i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg:'rgba(255,255,255,0.04)' }}
                style={{ transition:'background 0.15s' }}>

                <Grid templateColumns="2.2fr 2fr 0.8fr 1fr 0.8fr 80px"
                  px={6} py={4} alignItems="center">

                  {/* Kurum adı */}
                  <Flex align="center" gap={3}>
                    <OrgAvatar name={o.org} color={cfg.color} />
                    <Box>
                      <Text fontSize="sm" color="white" fontWeight="700">{o.org}</Text>
                    </Box>
                  </Flex>

                  {/* Açıklama */}
                  <Flex align="center" gap={2}>
                    <Box w={1.5} h={1.5} borderRadius="full" bg={cfg.color} flexShrink={0} />
                    <Text fontSize="sm" color="rgba(255,255,255,0.5)" isTruncated>{o.description}</Text>
                  </Flex>

                  {/* Personel */}
                  <Flex align="center" gap={1.5}>
                    <Text fontSize="sm" color={cfg.color} fontWeight="700">{o.members.length}</Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.3)">kişi</Text>
                  </Flex>

                  {/* Bölge sayısı */}
                  <Flex align="center" gap={1.5}>
                    <Text fontSize="sm" color="rgba(255,255,255,0.6)" fontWeight="600">{regionCount}</Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.3)">ilçe</Text>
                  </Flex>

                  {/* Durum */}
                  <Box>
                    <Flex display="inline-flex" align="center" gap={1.5}
                      px={2.5} py={1} borderRadius="full"
                      bg={isActive ? 'rgba(74,222,128,0.1)' : 'rgba(156,163,175,0.1)'}
                      border={`1px solid ${isActive ? 'rgba(74,222,128,0.25)' : 'rgba(156,163,175,0.2)'}`}>
                      <MotionBox w={1.5} h={1.5} borderRadius="full"
                        bg={isActive ? '#4ade80' : '#9ca3af'}
                        animate={isActive ? { opacity:[1,0.3,1] } : {}}
                        transition={{ duration:2, repeat:Infinity } as any}/>
                      <Text fontSize="10px" fontWeight="700"
                        color={isActive ? '#4ade80' : '#9ca3af'}>{o.status}</Text>
                    </Flex>
                  </Box>

                  {/* Aksiyonlar */}
                  <Flex gap={1.5} justify="flex-end" onClick={e => e.stopPropagation()}>
                    <ActionBtn icon={<EditIcon />} color="#60a5fa" title="Düzenle" />
                    <ActionBtn
                      icon={isActive ? <BanIcon /> : <CheckIcon />}
                      color={isActive ? '#f87171' : '#4ade80'}
                      title={isActive ? 'Askıya Al' : 'Aktifleştir'}
                    />
                    <Box color="rgba(255,255,255,0.25)" display="flex" alignItems="center">
                      <ChevronIcon />
                    </Box>
                  </Flex>
                </Grid>
              </MotionBox>
            )
          })}

          {filtered.length === 0 && (
            <Box px={6} py={14} textAlign="center">
              <Text fontSize="sm" color="rgba(255,255,255,0.3)">Eşleşen kayıt bulunamadı</Text>
            </Box>
          )}
        </Stack>
      </MotionBox>
    </Box>
  )
}
