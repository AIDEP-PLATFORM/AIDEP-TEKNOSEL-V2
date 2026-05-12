import { useState, useMemo } from 'react'
import { Box, Flex, Grid, Text, Input, InputGroup, InputLeftElement, Stack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { OFFICIALS, orgConfig, memberStatusCfg } from '@/data/officialsData'

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
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)

// ── Aksiyon butonu ────────────────────────────────────────────────
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
      whileTap={{ scale:0.88 } as any}
      transition={{ duration:0.12 } as any}>
      {icon}
    </MotionBox>
  )
}

// ── Bölge kartı ───────────────────────────────────────────────────
function RegionCard({
  il, ilce, members, color, index, onClick
}: {
  il: string; ilce: string
  members: { status: string }[]
  color: string; index: number
  onClick: () => void
}) {
  const musait  = members.filter(m => m.status === 'Müsait').length
  const gorevde = members.filter(m => m.status === 'Görevde').length
  const pasif   = members.filter(m => m.status === 'Pasif').length

  return (
    <MotionBox
      onClick={onClick} cursor="pointer"
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.07, duration:0.3 } as any}
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
      borderRadius="2xl" p={5} position="relative" overflow="hidden"
      whileHover={{
        bg: `${color}0d`,
        borderColor: `${color}45`,
        y: -3,
        boxShadow: `0 8px 28px ${color}18`
      } as any}
      whileTap={{ scale:0.98 } as any}
      style={{ transition:'all 0.2s' }}>

      {/* Dekoratif arka plan */}
      <Box position="absolute" top="-20px" right="-20px" w="80px" h="80px"
        borderRadius="full" bg={color} opacity={0.05} filter="blur(20px)" />

      {/* İl / İlçe */}
      <Flex align="center" gap={2} mb={4}>
        <Box color={color} opacity={0.8} display="flex"><MapPinIcon /></Box>
        <Box>
          <Text fontSize="xs" color="rgba(255,255,255,0.35)" fontWeight="600"
            textTransform="uppercase" letterSpacing="wider">{il}</Text>
          <Text fontSize="lg" color="white" fontWeight="800" lineHeight={1.1}>{ilce}</Text>
        </Box>
        <Box ml="auto" color="rgba(255,255,255,0.2)" display="flex"><ChevronIcon /></Box>
      </Flex>

      {/* Toplam personel */}
      <Flex align="center" gap={2} mb={4}>
        <Box color={color} display="flex"><UsersIcon /></Box>
        <Text fontSize="2xl" fontWeight="800" color={color}>{members.length}</Text>
        <Text fontSize="xs" color="rgba(255,255,255,0.35)" fontWeight="500">personel</Text>
      </Flex>

      {/* Durum çubukları */}
      <Stack spacing={1.5}>
        {[
          { label:'Müsait',  count: musait,  color:'#4ade80' },
          { label:'Görevde', count: gorevde, color:'#60a5fa' },
          { label:'Pasif',   count: pasif,   color:'#9ca3af' },
        ].filter(s => s.count > 0).map(s => (
          <Flex key={s.label} align="center" gap={2}>
            <Box w={1.5} h={1.5} borderRadius="full" bg={s.color} flexShrink={0} />
            <Text fontSize="11px" color={s.color} fontWeight="600" w="56px">{s.label}</Text>
            <Box flex={1} h="4px" borderRadius="full" bg="rgba(255,255,255,0.06)">
              <Box h="4px" borderRadius="full" bg={s.color}
                w={`${(s.count / members.length) * 100}%`} opacity={0.7} />
            </Box>
            <Text fontSize="11px" color="rgba(255,255,255,0.4)" fontFamily="mono" w={4} textAlign="right">
              {s.count}
            </Text>
          </Flex>
        ))}
      </Stack>
    </MotionBox>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────
export default function OfficialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const org = OFFICIALS.find(o => o.id === id)

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [members, setMembers] = useState(org?.members ?? [])
  const [query, setQuery] = useState('')

  if (!org) {
    return (
      <Flex h="60vh" align="center" justify="center" direction="column" gap={3}>
        <Text color="rgba(255,255,255,0.4)" fontSize="lg">Kurum bulunamadı</Text>
        <MotionBox onClick={() => navigate('/officials')} cursor="pointer"
          px={4} py={2} borderRadius="xl" bg="rgba(96,165,250,0.12)"
          border="1px solid rgba(96,165,250,0.3)" color="#60a5fa"
          whileHover={{ opacity:0.8 } as any}
          transition={{ duration:0.15 } as any}>
          <Text fontSize="sm" fontWeight="600">← Geri Dön</Text>
        </MotionBox>
      </Flex>
    )
  }

  const cfg = orgConfig[org.org]

  // Benzersiz bölgeler
  const regions = useMemo(() => {
    const map = new Map<string, typeof members>()
    members.forEach(m => {
      const key = `${m.il}___${m.ilce}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    })
    return Array.from(map.entries()).map(([key, mems]) => ({
      key,
      il:   key.split('___')[0],
      ilce: key.split('___')[1],
      members: mems,
    }))
  }, [members])

  // Seçili bölge üyeleri
  const regionMembers = useMemo(() => {
    if (!selectedRegion) return []
    return members.filter(m => `${m.il}___${m.ilce}` === selectedRegion)
  }, [members, selectedRegion])

  const filteredMembers = useMemo(() => {
    if (!query) return regionMembers
    const q = query.toLowerCase()
    return regionMembers.filter(m =>
      m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
    )
  }, [regionMembers, query])

  const toggleMember = (mid: string) => {
    setMembers(prev => prev.map(m => m.id !== mid ? m
      : { ...m, status: m.status === 'Müsait' ? 'Pasif' : 'Müsait' } as typeof m))
  }

  const selectedIlce = selectedRegion ? selectedRegion.split('___')[1] : ''
  const selectedIl   = selectedRegion ? selectedRegion.split('___')[0] : ''

  // ── Kurum başlık ──
  const Header = () => (
    <MotionFlex align="center" gap={4} mb={6}
      initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3 } as any}>

      {/* Geri butonu */}
      <MotionBox
        onClick={() => selectedRegion ? setSelectedRegion(null) : navigate('/officials')}
        cursor="pointer" w={9} h={9} borderRadius="xl"
        bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
        display="flex" alignItems="center" justifyContent="center"
        color="rgba(255,255,255,0.5)"
        whileHover={{ bg:'rgba(255,255,255,0.08)', color:'white' } as any}
        whileTap={{ scale:0.9 } as any}
        transition={{ duration:0.15 } as any}>
        <BackIcon />
      </MotionBox>

      {/* Logo + isim */}
      <Flex align="center" gap={3}>
        <Flex w={11} h={11} borderRadius="xl"
          bg={`${cfg.color}18`} border={`1px solid ${cfg.color}40`}
          align="center" justify="center" flexShrink={0}>
          <Text fontSize="14px" fontWeight="800" color={cfg.color}>
            {org.org.slice(0, 2).toUpperCase()}
          </Text>
        </Flex>
        <Box>
          <Flex align="center" gap={2}>
            <Text color="white" fontWeight="800" fontSize="lg" lineHeight={1.2}
              cursor={selectedRegion ? 'pointer' : 'default'}
              onClick={() => selectedRegion && setSelectedRegion(null)}
              _hover={selectedRegion ? { color: cfg.color } : {}}
              transition="color 0.2s">
              {org.org}
            </Text>
            {selectedRegion && (
              <>
                <Box color="rgba(255,255,255,0.25)"><ChevronIcon /></Box>
                <Flex align="center" gap={1.5}>
                  <Box color={cfg.color} display="flex"><MapPinIcon /></Box>
                  <Text color={cfg.color} fontWeight="700" fontSize="lg">{selectedIlce}</Text>
                  <Text color="rgba(255,255,255,0.3)" fontSize="sm">/ {selectedIl}</Text>
                </Flex>
              </>
            )}
          </Flex>
          <Flex align="center" gap={2} mt={0.5}>
            <Box w={1.5} h={1.5} borderRadius="full" bg={cfg.color} />
            <Text fontSize="xs" color="rgba(255,255,255,0.4)">{org.description}</Text>
            <Box w="1px" h={3} bg="rgba(255,255,255,0.15)" />
            <Flex px={2} py={0.5} borderRadius="full"
              bg={org.status === 'Aktif' ? 'rgba(74,222,128,0.1)' : 'rgba(156,163,175,0.1)'}
              border={`1px solid ${org.status === 'Aktif' ? 'rgba(74,222,128,0.3)' : 'rgba(156,163,175,0.25)'}`}>
              <Text fontSize="9px" fontWeight="700"
                color={org.status === 'Aktif' ? '#4ade80' : '#9ca3af'}>{org.status}</Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </MotionFlex>
  )

  // ── GÖRÜNÜM 1: Bölge kartları ──────────────────────────────────
  if (!selectedRegion) {
    return (
      <Box px={6} py={5}>
        <Header />

        {/* Özet stat */}
        <Grid templateColumns="repeat(3,1fr)" gap={4} mb={6}>
          {[
            { label:'Toplam Bölge',  count: regions.length,                                        color:'#818cf8' },
            { label:'Toplam Personel', count: members.length,                                      color: cfg.color },
            { label:'Görevde',       count: members.filter(m => m.status === 'Görevde').length,   color:'#4ade80' },
          ].map((s, i) => (
            <MotionBox key={s.label}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i*0.07, duration:0.25 } as any}
              bg="rgba(255,255,255,0.03)" border={`1px solid ${s.color}28`}
              borderRadius="2xl" p={5} textAlign="center">
              <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.count}</Text>
              <Text fontSize="9px" color="rgba(255,255,255,0.35)" mt={1} fontWeight="700"
                textTransform="uppercase" letterSpacing="widest">{s.label}</Text>
            </MotionBox>
          ))}
        </Grid>

        {/* Bölge kartları */}
        <Grid templateColumns="repeat(3,1fr)" gap={4}>
          {regions.map((r, i) => (
            <RegionCard
              key={r.key}
              il={r.il} ilce={r.ilce}
              members={r.members}
              color={cfg.color} index={i}
              onClick={() => setSelectedRegion(r.key)}
            />
          ))}
        </Grid>
      </Box>
    )
  }

  // ── GÖRÜNÜM 2: Seçili bölge üyeleri ────────────────────────────
  const musait  = filteredMembers.filter(m => m.status === 'Müsait').length
  const gorevde = filteredMembers.filter(m => m.status === 'Görevde').length
  const pasif   = filteredMembers.filter(m => m.status === 'Pasif').length

  return (
    <Box px={6} py={5}>
      <Header />

      {/* Stat kartları */}
      <Grid templateColumns="repeat(3,1fr)" gap={4} mb={5}>
        {[
          { label:'Müsait',  count: musait,  color:'#4ade80' },
          { label:'Görevde', count: gorevde, color:'#60a5fa' },
          { label:'Pasif',   count: pasif,   color:'#9ca3af' },
        ].map((s, i) => (
          <MotionBox key={s.label}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i*0.06, duration:0.25 } as any}
            bg="rgba(255,255,255,0.03)" border={`1px solid ${s.color}28`}
            borderRadius="xl" p={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="800" color={s.color}>{s.count}</Text>
            <Text fontSize="9px" color="rgba(255,255,255,0.35)" mt={0.5} fontWeight="700"
              textTransform="uppercase" letterSpacing="widest">{s.label}</Text>
          </MotionBox>
        ))}
      </Grid>

      {/* Arama */}
      <MotionBox mb={4} initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.1 } as any}>
        <Flex gap={3} align="center">
          <InputGroup flex={1} maxW="340px">
            <InputLeftElement pointerEvents="none" h={8} pl={3} color="rgba(255,255,255,0.3)">
              <SearchIcon />
            </InputLeftElement>
            <Input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="İsim veya unvan ara..."
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="xl" color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }}
              _focus={{ borderColor:`${cfg.color}60`, boxShadow:`0 0 0 3px ${cfg.color}20`, bg:'rgba(255,255,255,0.06)' }}
              h={8} fontSize="sm" pl={10} />
          </InputGroup>
          <Text fontSize="xs" color="rgba(255,255,255,0.3)" ml="auto">
            {filteredMembers.length} personel · <Text as="span" color={cfg.color}>{selectedIlce}</Text>
          </Text>
        </Flex>
      </MotionBox>

      {/* Personel tablosu */}
      <AnimatePresence mode="wait">
        <MotionBox key={selectedRegion}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.22 } as any}
          bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.07)"
          borderRadius="2xl" overflow="hidden">

          <Grid templateColumns="2.4fr 1.8fr 1fr 1fr 1fr"
            px={5} py={3}
            borderBottom="1px solid rgba(255,255,255,0.06)"
            bg="rgba(255,255,255,0.02)">
            {['Ad Soyad','Unvan','Katılım','Durum',''].map((h, i) => (
              <Text key={i} fontSize="9px" color="rgba(255,255,255,0.28)"
                fontWeight="700" letterSpacing="widest" textTransform="uppercase">{h}</Text>
            ))}
          </Grid>

          <Stack spacing={0}>
            {filteredMembers.length === 0 ? (
              <Flex align="center" justify="center" py={14} direction="column" gap={2}>
                <Text fontSize="sm" color="rgba(255,255,255,0.25)">Personel bulunamadı</Text>
              </Flex>
            ) : filteredMembers.map((m, i) => {
              const mCfg = memberStatusCfg[m.status] ?? memberStatusCfg['Pasif']
              return (
                <MotionBox key={m.id}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i*0.05, duration:0.22 } as any}
                  borderBottom={i < filteredMembers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                  _hover={{ bg:'rgba(255,255,255,0.03)' }}
                  style={{ transition:'background 0.15s' }}>
                  <Grid templateColumns="2.4fr 1.8fr 1fr 1fr 1fr"
                    px={5} py={4} alignItems="center">

                    {/* Ad */}
                    <Flex align="center" gap={3} overflow="hidden">
                      <Flex w={9} h={9} borderRadius="lg"
                        bg={`${cfg.color}18`} border={`1px solid ${cfg.color}30`}
                        align="center" justify="center" flexShrink={0}>
                        <Text fontSize="11px" fontWeight="800" color={cfg.color}>
                          {m.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                        </Text>
                      </Flex>
                      <Box overflow="hidden">
                        <Text fontSize="sm" color="white" fontWeight="600" isTruncated>{m.name}</Text>
                        <Text fontSize="10px" color="rgba(255,255,255,0.3)">{m.phone}</Text>
                      </Box>
                    </Flex>

                    {/* Unvan */}
                    <Text fontSize="sm" color="rgba(255,255,255,0.5)" isTruncated>{m.role}</Text>

                    {/* Katılım */}
                    <Text fontSize="xs" color="rgba(255,255,255,0.3)" fontFamily="mono">{m.joined}</Text>

                    {/* Durum */}
                    <Flex align="center" gap={2}>
                      <MotionBox w={2} h={2} borderRadius="full" bg={mCfg.color}
                        animate={m.status === 'Görevde' ? { opacity:[1,0.2,1] } : {}}
                        transition={{ duration:2, repeat:Infinity } as any}/>
                      <Flex px={2.5} py={1} borderRadius="full" bg={mCfg.bg}>
                        <Text fontSize="10px" fontWeight="700" color={mCfg.color}>{m.status}</Text>
                      </Flex>
                    </Flex>

                    {/* Aksiyonlar */}
                    <Flex gap={1.5} justify="flex-end">
                      <ActionBtn icon={<EditIcon />} color="#60a5fa" title="Düzenle" />
                      <ActionBtn
                        icon={m.status !== 'Pasif' ? <BanIcon /> : <CheckIcon />}
                        color={m.status !== 'Pasif' ? '#f87171' : '#4ade80'}
                        title={m.status !== 'Pasif' ? 'Pasife Al' : 'Aktifleştir'}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleMember(m.id) }}
                      />
                    </Flex>
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
