import { useState, useEffect, useCallback } from 'react'
import {
  Box, Flex, Grid, Text, Stack, Input, Button,
  Spinner, Textarea, useToast,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  apiGetTeams, apiGetTeamDetail, apiCreateTeam, apiDeleteTeam,
  apiAddTeamMember, apiRemoveTeamMember,
  type TeamResponse, type TeamDetailResponse,
} from '@/services/teamService'

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

export default function TeamsPage() {
  const toast = useToast()

  const [teams, setTeams]           = useState<TeamResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<TeamDetailResponse | null>(null)
  const [detailLoading, setDL]      = useState(false)

  // Yeni ekip formu
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [creating, setCreating]     = useState(false)

  // Üye ekleme
  const [memberUUID, setMemberUUID] = useState('')
  const [addingMember, setAddingM]  = useState(false)

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

  useEffect(() => { loadTeams() }, [loadTeams])

  const selectTeam = async (id: string) => {
    setDL(true)
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

  const handleAddMember = async () => {
    if (!selected || !memberUUID.trim()) return
    setAddingM(true)
    try {
      const updated = await apiAddTeamMember(selected.id, memberUUID.trim())
      setSelected(updated); setMemberUUID('')
      toast({ title: 'Üye eklendi', status: 'success', duration: 2500 })
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

  return (
    <Box p={{ base: 5, md: 6 }}>

      {/* Başlık */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 } as any} mb={6}>
        <Text fontSize="xl" fontWeight="800" color="white">Ekip Yönetimi</Text>
        <Text fontSize="sm" color="rgba(255,255,255,0.4)" mt={0.5}>
          Organizasyonunuza ait saha ekiplerini yönetin
        </Text>
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
                        onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
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
                              {m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                          </Flex>
                          <Box>
                            <Text fontSize="sm" color="white" fontWeight="500">{m.full_name}</Text>
                            <Flex align="center" gap={1.5}>
                              <Text fontSize="10px" color="rgba(255,255,255,0.35)">{m.role}</Text>
                              {m.has_location && (
                                <Box px={1.5} py={0} borderRadius="full" bg="rgba(74,222,128,0.1)">
                                  <Text fontSize="9px" color="#4ade80">📍 Konum</Text>
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

                {/* Üye ekle */}
                <Box p={4} borderRadius="xl" bg="rgba(255,255,255,0.02)"
                  border="1px solid rgba(255,255,255,0.06)">
                  <Text {...labelStyle} mb={2}>Üye Ekle (Kullanıcı UUID)</Text>
                  <Flex gap={2}>
                    <Input flex={1} {...inputStyle}
                      value={memberUUID} onChange={e => setMemberUUID(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      fontFamily="mono" fontSize="xs" />
                    <Button
                      onClick={handleAddMember}
                      isLoading={addingMember}
                      h={9} px={4} borderRadius="xl"
                      bg="rgba(99,102,241,0.15)" border="1px solid rgba(129,140,248,0.25)"
                      color="#a5b4fc" fontWeight="700" fontSize="sm"
                      _hover={{ bg: 'rgba(99,102,241,0.25)' }} _active={{ opacity: 0.8 }}
                      flexShrink={0}
                    >
                      Ekle
                    </Button>
                  </Flex>
                </Box>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>

      </Grid>
    </Box>
  )
}
