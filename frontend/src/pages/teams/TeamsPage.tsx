import { useState, useEffect, useCallback } from 'react'
import {
  Box, Flex, Grid, Text, Stack, Input, Button,
  Spinner, Textarea, useToast,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRole } from '@/utils/auth'
import {
  apiGetTeams, apiGetTeamDetail, apiCreateTeam, apiDeleteTeam,
  apiAddTeamMember, apiRemoveTeamMember,
  type TeamResponse, type TeamDetailResponse,
} from '@/services/teamService'
import { apiGetOrgMembers, type OrgMember } from '@/services/volunteerService'
import { apiRunMatching } from '@/services/requestService'

const MotionBox  = motion(Box)
const MotionFlex = motion(Flex)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

const labelStyle = {
  fontSize: '10px', fontWeight: '700' as const,
  color: 'rgba(255,255,255,0.35)', letterSpacing: 'widest',
  textTransform: 'uppercase' as const, mb: 1.5,
}

const inputStyle = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white' as const,
  _placeholder: { color: 'rgba(255,255,255,0.2)' },
  _hover: { borderColor: 'rgba(99,102,241,0.4)' },
  _focus: { borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' },
  borderRadius: 'xl',
  h: 9,
  fontSize: 'sm',
}

function TeamsPageInner() {
  const toast  = useToast()
  const role   = getRole()
  const isManager = role === 'NGO_MANAGER' || role === 'OFFICIAL_MANAGER' || role === 'ADMIN'

  const [teams,         setTeams]     = useState<TeamResponse[]>([])
  const [loading,       setLoading]   = useState(true)
  const [selected,      setSelected]  = useState<TeamDetailResponse | null>(null)
  const [detailLoading, setDL]        = useState(false)

  // Org üyeleri (üye seçici için)
  const [orgMembers,    setOrgMembers]    = useState<OrgMember[]>([])
  const [memberSearch,  setMemberSearch]  = useState('')
  const [showPicker,    setShowPicker]    = useState(false)
  const [addingMember,  setAddingM]       = useState(false)

  // Yeni ekip formu
  const [newName,    setNewName]    = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [creating,   setCreating]   = useState(false)

  // Eşleştirme
  const [matching,   setMatching]   = useState(false)

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      setTeams(await apiGetTeams())
    } catch {
      toast({ title: 'Ekipler yüklenemedi', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadOrgMembers = useCallback(async () => {
    try {
      const members = await apiGetOrgMembers()
      setOrgMembers(members.filter(m => m.is_active))
    } catch { /* sessiz */ }
  }, [])

  useEffect(() => {
    loadTeams()
    loadOrgMembers()
  }, [loadTeams, loadOrgMembers])

  const selectTeam = async (id: string) => {
    setDL(true)
    setShowPicker(false)
    setMemberSearch('')
    try {
      setSelected(await apiGetTeamDetail(id))
    } catch {
      toast({ title: 'Ekip detayı alınamadı', status: 'error', duration: 3000 })
    } finally {
      setDL(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      await apiCreateTeam({ name: newName.trim(), description: newDesc.trim() || undefined })
      setNewName(''); setNewDesc('')
      toast({ title: 'Ekip oluşturuldu', status: 'success', duration: 2500 })
      await loadTeams()
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail ?? 'Ekip oluşturulamadı', status: 'error', duration: 3000 })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteTeam(id)
      if (selected?.id === id) setSelected(null)
      toast({ title: 'Ekip silindi', status: 'success', duration: 2500 })
      await loadTeams()
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail ?? 'Silinemedi', status: 'error', duration: 3000 })
    }
  }

  const handleAddMember = async (member: OrgMember) => {
    if (!selected) return
    setAddingM(true)
    try {
      const updated = await apiAddTeamMember(selected.id, member.id)
      setSelected(updated)
      setShowPicker(false)
      setMemberSearch('')
      toast({ title: `${member.full_name} eklendi`, status: 'success', duration: 2500 })
      await loadTeams()
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail ?? 'Üye eklenemedi', status: 'error', duration: 3000 })
    } finally {
      setAddingM(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selected) return
    try {
      const updated = await apiRemoveTeamMember(selected.id, userId)
      setSelected(updated)
      toast({ title: 'Üye çıkarıldı', status: 'success', duration: 2500 })
      await loadTeams()
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail ?? 'Üye çıkarılamadı', status: 'error', duration: 3000 })
    }
  }

  const handleRunMatching = async () => {
    setMatching(true)
    try {
      const res = await apiRunMatching()
      toast({
        title: 'Eşleştirme tamamlandı',
        description: `${res.matched} talep eşleşti, ${res.unmatched} bekliyor.`,
        status: 'success', duration: 5000, isClosable: true,
      })
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail ?? 'Eşleştirme başarısız', status: 'error', duration: 3000 })
    } finally {
      setMatching(false)
    }
  }

  // Zaten ekipte olan üyeleri filtrele
  const alreadyInTeam = new Set(selected?.members.map(m => m.user_id) ?? [])
  const availableMembers = orgMembers.filter(m =>
    !alreadyInTeam.has(m.id) &&
    (memberSearch === '' ||
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()))
  )

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* Başlık */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 } as any} mb={6}>
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xl" fontWeight="800" color="white">Ekip Yönetimi</Text>
            <Text fontSize="sm" color="rgba(255,255,255,0.4)" mt={0.5}>
              Organizasyonunuza ait saha ekiplerini yönetin
            </Text>
          </Box>

          {/* AI Eşleştirme butonu */}
          {isManager && (
            <Button
              onClick={handleRunMatching}
              isLoading={matching}
              loadingText="Eşleştiriliyor..."
              leftIcon={<PlayIcon />}
              h={9} px={5} borderRadius="xl"
              bg="rgba(129,140,248,0.15)"
              border="1px solid rgba(129,140,248,0.35)"
              color="#a5b4fc" fontWeight="700" fontSize="sm"
              _hover={{ bg: 'rgba(129,140,248,0.25)' }}
            >
              AI Eşleştirmeyi Çalıştır
            </Button>
          )}
        </Flex>
      </MotionBox>

      <Grid templateColumns={{ base: '1fr', lg: '320px 1fr' }} gap={6} alignItems="start">

        {/* Sol — yeni ekip formu + liste */}
        <Stack spacing={4}>

          {/* Yeni ekip formu */}
          <Box as="form" onSubmit={handleCreate}
            borderRadius="2xl" bg="rgba(255,255,255,0.03)"
            border="1px solid rgba(255,255,255,0.08)" overflow="hidden">
            <Box px={5} py={4} borderBottom="1px solid rgba(255,255,255,0.06)"
              bg="rgba(255,255,255,0.02)">
              <Text fontSize="sm" fontWeight="700" color="white">Yeni Ekip Oluştur</Text>
            </Box>
            <Stack spacing={4} p={5}>
              <Box>
                <Text {...labelStyle}>Ekip Adı</Text>
                <Input {...inputStyle} value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Örn: Alpha Kurtarma Ekibi" />
              </Box>
              <Box>
                <Text {...labelStyle}>Açıklama (opsiyonel)</Text>
                <Textarea
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Ekibin uzmanlık alanı..."
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                  color="white" _placeholder={{ color: 'rgba(255,255,255,0.2)' }}
                  _hover={{ borderColor: 'rgba(99,102,241,0.4)' }}
                  _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' }}
                  borderRadius="xl" fontSize="sm" rows={2} resize="none" />
              </Box>
              <Button type="submit" isLoading={creating} loadingText="Oluşturuluyor..."
                leftIcon={<PlusIcon />}
                w="full" h={9} borderRadius="xl"
                bg="linear-gradient(135deg,#6366f1,#7c3aed)"
                color="white" fontWeight="700" fontSize="sm"
                _hover={{ opacity: 0.9 }} _active={{ opacity: 0.8 }}>
                Ekip Oluştur
              </Button>
            </Stack>
          </Box>

          {/* Ekip listesi */}
          <Box borderRadius="2xl" bg="rgba(255,255,255,0.02)"
            border="1px solid rgba(255,255,255,0.07)" overflow="hidden">
            <Flex px={5} py={3} align="center" justify="space-between"
              borderBottom="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)">
              <Text fontSize="sm" fontWeight="700" color="white">Ekipler</Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.3)">{teams.length} ekip</Text>
            </Flex>

            {loading ? (
              <Flex align="center" justify="center" py={10} gap={3}>
                <Spinner size="sm" color="#818cf8" />
                <Text fontSize="sm" color="rgba(255,255,255,0.35)">Yükleniyor...</Text>
              </Flex>
            ) : teams.length === 0 ? (
              <Flex align="center" justify="center" py={10}>
                <Text fontSize="sm" color="rgba(255,255,255,0.25)">Henüz ekip yok</Text>
              </Flex>
            ) : (
              <Stack spacing={0}>
                {teams.map((t, i) => (
                  <MotionBox key={t.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 } as any}
                    onClick={() => selectTeam(t.id)}
                    cursor="pointer"
                    px={4} py={3}
                    bg={selected?.id === t.id ? 'rgba(99,102,241,0.1)' : 'transparent'}
                    borderLeft={selected?.id === t.id ? '3px solid #818cf8' : '3px solid transparent'}
                    borderBottom="1px solid rgba(255,255,255,0.04)"
                    _hover={{ bg: 'rgba(129,140,248,0.06)' }}
                    style={{ transition: 'background 0.15s' }}>
                    <Flex align="center" justify="space-between">
                      <Box overflow="hidden">
                        <Text fontSize="sm" color="white" fontWeight="600" isTruncated>{t.name}</Text>
                        <Flex gap={3} mt={0.5}>
                          <Flex align="center" gap={1}>
                            <UsersIcon />
                            <Text fontSize="10px" color="rgba(255,255,255,0.4)">{t.member_count} üye</Text>
                          </Flex>
                          {t.active_task_count > 0 && (
                            <Box px={1.5} py={0.5} borderRadius="full" bg="rgba(251,191,36,0.15)">
                              <Text fontSize="9px" fontWeight="700" color="#fbbf24">{t.active_task_count} aktif</Text>
                            </Box>
                          )}
                        </Flex>
                      </Box>
                      <MotionBox
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(t.id) }}
                        w={7} h={7} borderRadius="lg"
                        bg="rgba(248,113,113,0.08)" border="1px solid rgba(248,113,113,0.2)"
                        display="flex" alignItems="center" justifyContent="center"
                        color="#f87171"
                        whileHover={{ bg: 'rgba(248,113,113,0.2)' } as any}
                        whileTap={{ scale: 0.9 } as any}
                        transition={{ duration: 0.15 } as any}
                        title="Sil"
                      >
                        <TrashIcon />
                      </MotionBox>
                    </Flex>
                  </MotionBox>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Sağ — ekip detayı */}
        <AnimatePresence mode="wait">
          {!selected ? (
            <MotionBox key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 } as any}
              borderRadius="2xl" bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.06)"
              h="300px" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="sm" color="rgba(255,255,255,0.2)">Detayları görmek için bir ekip seçin</Text>
            </MotionBox>
          ) : detailLoading ? (
            <MotionBox key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 } as any}
              borderRadius="2xl" bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.06)"
              h="300px" display="flex" alignItems="center" justifyContent="center" gap={3}>
              <Spinner size="sm" color="#818cf8" />
              <Text fontSize="sm" color="rgba(255,255,255,0.35)">Yükleniyor...</Text>
            </MotionBox>
          ) : (
            <MotionBox key={selected.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 } as any}
              borderRadius="2xl" bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.07)" overflow="hidden">

              {/* Ekip başlığı */}
              <Box px={6} py={4} borderBottom="1px solid rgba(255,255,255,0.06)"
                bg="rgba(255,255,255,0.03)">
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontSize="md" fontWeight="800" color="white">{selected.name}</Text>
                    {selected.description && (
                      <Text fontSize="xs" color="rgba(255,255,255,0.4)" mt={0.5}>{selected.description}</Text>
                    )}
                  </Box>
                  <Flex gap={2}>
                    <Box px={3} py={1} borderRadius="full" bg="rgba(129,140,248,0.1)"
                      border="1px solid rgba(129,140,248,0.2)">
                      <Text fontSize="10px" fontWeight="700" color="#a5b4fc">
                        {selected.members.length} üye
                      </Text>
                    </Box>
                    {selected.active_task_count > 0 && (
                      <Box px={3} py={1} borderRadius="full" bg="rgba(251,191,36,0.1)"
                        border="1px solid rgba(251,191,36,0.25)">
                        <Text fontSize="10px" fontWeight="700" color="#fbbf24">
                          {selected.active_task_count} aktif görev
                        </Text>
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </Box>

              {/* Üye listesi */}
              <Box px={6} py={4}>
                <Text {...labelStyle} mb={3}>Ekip Üyeleri</Text>
                {selected.members.length === 0 ? (
                  <Text fontSize="sm" color="rgba(255,255,255,0.25)" mb={4}>Henüz üye yok</Text>
                ) : (
                  <Stack spacing={1.5} mb={5}>
                    {selected.members.map((m, i) => (
                      <MotionFlex key={m.user_id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 } as any}
                        align="center" justify="space-between"
                        px={4} py={2.5} borderRadius="xl"
                        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }} style={{ transition: 'background 0.15s' }}>
                        <Flex align="center" gap={3}>
                          <Flex w={8} h={8} borderRadius="lg"
                            bg="rgba(99,102,241,0.15)" border="1px solid rgba(129,140,248,0.2)"
                            align="center" justify="center" flexShrink={0}>
                            <Text fontSize="11px" fontWeight="700" color="#a5b4fc">
                              {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                          </Flex>
                          <Box>
                            <Text fontSize="sm" color="white" fontWeight="500">{m.full_name}</Text>
                            <Flex align="center" gap={1.5}>
                              <Text fontSize="10px" color="rgba(255,255,255,0.35)">{m.role}</Text>
                              {m.has_location && (
                                <Box px={1.5} py={0} borderRadius="full" bg="rgba(74,222,128,0.1)">
                                  <Text fontSize="9px" color="#4ade80">📍 Konum var</Text>
                                </Box>
                              )}
                              {!m.has_location && (
                                <Box px={1.5} py={0} borderRadius="full" bg="rgba(248,113,113,0.1)">
                                  <Text fontSize="9px" color="#f87171">📍 Konum yok</Text>
                                </Box>
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                        <MotionBox
                          onClick={() => handleRemoveMember(m.user_id)}
                          w={6} h={6} borderRadius="md"
                          bg="rgba(248,113,113,0.08)" border="1px solid rgba(248,113,113,0.2)"
                          display="flex" alignItems="center" justifyContent="center"
                          color="#f87171" cursor="pointer"
                          whileHover={{ bg: 'rgba(248,113,113,0.2)' } as any}
                          whileTap={{ scale: 0.9 } as any}
                          transition={{ duration: 0.15 } as any}
                          title="Çıkar"
                        >
                          <TrashIcon />
                        </MotionBox>
                      </MotionFlex>
                    ))}
                  </Stack>
                )}

                {/* Üye seçici */}
                <Box borderRadius="xl" bg="rgba(255,255,255,0.02)"
                  border="1px solid rgba(255,255,255,0.06)" overflow="hidden">
                  <Flex
                    px={4} py={3} align="center" justify="space-between"
                    borderBottom={showPicker ? '1px solid rgba(255,255,255,0.06)' : 'none'}
                    cursor="pointer"
                    onClick={() => setShowPicker(p => !p)}
                    _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                  >
                    <Text {...labelStyle} mb={0}>+ Üye Ekle</Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.3)">
                      {showPicker ? '▲ Kapat' : '▼ Listele'}
                    </Text>
                  </Flex>

                  {showPicker && (
                    <Box p={3}>
                      {/* Arama */}
                      <Input
                        {...inputStyle} h={8} mb={2} fontSize="xs"
                        placeholder="İsim veya e-posta ara..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                      />

                      {/* Üye listesi */}
                      <Box maxH="200px" overflowY="auto"
                        sx={{
                          '&::-webkit-scrollbar': { width: '3px' },
                          '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.15)', borderRadius: '3px' },
                        }}>
                        {orgMembers.length === 0 ? (
                          <Text fontSize="xs" color="rgba(255,255,255,0.3)" textAlign="center" py={4}>
                            Organizasyonda aktif üye bulunamadı
                          </Text>
                        ) : availableMembers.length === 0 ? (
                          <Text fontSize="xs" color="rgba(255,255,255,0.3)" textAlign="center" py={4}>
                            {memberSearch ? 'Eşleşen üye yok' : 'Tüm üyeler zaten ekipte'}
                          </Text>
                        ) : (
                          <Stack spacing={1}>
                            {availableMembers.map(member => (
                              <MotionFlex
                                key={member.id}
                                align="center" justify="space-between"
                                px={3} py={2} borderRadius="lg"
                                bg="rgba(255,255,255,0.02)"
                                border="1px solid rgba(255,255,255,0.05)"
                                cursor="pointer"
                                whileHover={{ bg: 'rgba(99,102,241,0.1)' } as any}
                                whileTap={{ scale: 0.97 } as any}
                                transition={{ duration: 0.12 } as any}
                                onClick={() => handleAddMember(member)}
                              >
                                <Flex align="center" gap={2.5}>
                                  <Flex w={7} h={7} borderRadius="md"
                                    bg="rgba(99,102,241,0.12)" border="1px solid rgba(129,140,248,0.2)"
                                    align="center" justify="center" flexShrink={0}>
                                    <Text fontSize="10px" fontWeight="700" color="#a5b4fc">
                                      {member.full_name.charAt(0).toUpperCase()}
                                    </Text>
                                  </Flex>
                                  <Box>
                                    <Text fontSize="xs" color="white" fontWeight="600">{member.full_name}</Text>
                                    <Flex align="center" gap={1.5}>
                                      <Text fontSize="9px" color="rgba(255,255,255,0.35)">{member.email}</Text>
                                      {member.has_location && (
                                        <Text fontSize="9px" color="#4ade80">📍</Text>
                                      )}
                                    </Flex>
                                  </Box>
                                </Flex>
                                {addingMember ? (
                                  <Spinner size="xs" color="#a5b4fc" />
                                ) : (
                                  <Box px={2} py={0.5} borderRadius="md"
                                    bg="rgba(99,102,241,0.12)" border="1px solid rgba(129,140,248,0.25)">
                                    <Text fontSize="9px" fontWeight="700" color="#a5b4fc">Ekle</Text>
                                  </Box>
                                )}
                              </MotionFlex>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Konum uyarısı */}
                {selected.members.some(m => !m.has_location) && (
                  <Box mt={3} px={4} py={2.5} borderRadius="xl"
                    bg="rgba(251,191,36,0.06)" border="1px solid rgba(251,191,36,0.2)">
                    <Text fontSize="10px" color="#fbbf24" fontWeight="600">
                      ⚠️ Konumu olmayan üyeler eşleştirmeye dahil edilemez. Mobil uygulamadan konum paylaşmaları gerekiyor.
                    </Text>
                  </Box>
                )}
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>

      </Grid>
    </Box>
  )
}

export default function TeamsPage() {
  const role = getRole()
  if (role !== 'NGO_MANAGER') {
    return (
      <Flex align="center" justify="center" h="60vh" direction="column" gap={3}>
        <Text fontSize="3xl">🔒</Text>
        <Text fontSize="md" color="white" fontWeight="700">Erişim Kısıtlı</Text>
        <Text fontSize="sm" color="rgba(255,255,255,0.4)" textAlign="center">
          Ekip yönetimi yalnızca STK Yöneticileri tarafından kullanılabilir.
        </Text>
      </Flex>
    )
  }
  return <TeamsPageInner />
}
