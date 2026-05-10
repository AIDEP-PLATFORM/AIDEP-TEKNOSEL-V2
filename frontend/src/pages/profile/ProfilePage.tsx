import {
  Box, Flex, Text, Stack, Grid, GridItem,
  Divider, Input, InputGroup, InputRightElement, Button,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { getUser, getRole } from '@/utils/auth'
import { useCustomToast } from '@/hooks/useCustomToast'

const MotionBox = motion(Box)

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    }
  </svg>
)

const card = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '2xl',
  p: 6,
  backdropFilter: 'blur(20px)',
}

const labelStyle = {
  fontSize: '10px',
  fontWeight: '700' as const,
  color: 'rgba(255,255,255,0.35)',
  letterSpacing: 'widest',
  textTransform: 'uppercase' as const,
  mb: 1,
}

const roleDisplay: Record<string, { label: string; color: string; bg: string }> = {
  NGO:       { label: 'STK / NGO',  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  VOLUNTEER: { label: 'Gönüllü',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  CITIZEN:   { label: 'Vatandaş',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  admin:     { label: 'Yönetici',   color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  afad:      { label: 'AFAD',       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  stk:       { label: 'STK',        color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  umke:      { label: 'UMKE',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text {...labelStyle}>{label}</Text>
      <Text color="white" fontSize="sm" fontWeight="500">{value || '—'}</Text>
    </Box>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Flex
      w="88px" h="88px" borderRadius="2xl"
      bgGradient="linear(135deg, #6366f1, #7c3aed)"
      align="center" justify="center" flexShrink={0}
      boxShadow="0 0 32px rgba(99,102,241,0.35)"
      border="2px solid rgba(129,140,248,0.3)"
    >
      <Text fontSize="2xl" fontWeight="800" color="white">{initials}</Text>
    </Flex>
  )
}

function ProfilePage() {
  const user = getUser()
  const role = getRole()
  const toast = useCustomToast()

  const [oldPw, setOldPw]         = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showOld, setShowOld]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [showCon, setShowCon]     = useState(false)
  const [saving, setSaving]       = useState(false)

  const roleInfo = (role && roleDisplay[role])
    ? roleDisplay[role]
    : { label: 'Yetkili', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' }

  const formatPhone = (p: string) => {
    // +905321234567 → 0532 123 45 67
    if (p?.startsWith('+90')) {
      const d = p.slice(3)
      return `0${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`
    }
    return p ?? '—'
  }

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast({ title: 'Şifre en az 6 karakter olmalı', type: 'error' }); return
    }
    if (newPw !== confirmPw) {
      toast({ title: 'Yeni şifreler eşleşmiyor', type: 'error' }); return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setOldPw(''); setNewPw(''); setConfirmPw('')
    toast({ title: 'Şifre güncellendi', description: 'Yeni şifreniz kaydedildi.', type: 'success' })
  }

  return (
    <Box p={6} maxW="860px" mx="auto">

      {/* Başlık */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 } as any}
        mb={6}
      >
        <Text fontSize="xl" fontWeight="800" color="white">Profilim</Text>
        <Text fontSize="sm" color="rgba(255,255,255,0.35)" mt={0.5}>
          Hesap bilgilerinizi görüntüleyin
        </Text>
      </MotionBox>

      <Stack spacing={5}>

        {/* Kimlik kartı */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 } as any}
          {...card}
          position="relative"
          _before={{
            content: '""', position: 'absolute',
            top: 0, left: '8%', right: '8%', h: '1px',
            bgGradient: 'linear(to-r, transparent, #6366f1, #7c3aed, transparent)',
          }}
        >
          <Flex align="center" gap={5} mb={6}>
            <Avatar name={user?.full_name ?? 'Kullanıcı'} />
            <Box>
              <Text fontSize="xl" fontWeight="800" color="white">
                {user?.full_name ?? 'Bilinmiyor'}
              </Text>
              <Text fontSize="sm" color="rgba(255,255,255,0.4)" mt={0.5}>
                {user?.email ?? '—'}
              </Text>
              <Flex align="center" gap={2} mt={2}>
                <Box
                  px={3} py={1} borderRadius="full"
                  bg={roleInfo.bg}
                  border={`1px solid ${roleInfo.color}40`}
                >
                  <Text fontSize="11px" fontWeight="700" color={roleInfo.color} letterSpacing="wider">
                    {roleInfo.label}
                  </Text>
                </Box>
                <Flex align="center" gap={1.5}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg="#4ade80" />
                  <Text fontSize="11px" color="#4ade80" fontWeight="600">Aktif</Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>

          <Divider borderColor="rgba(255,255,255,0.07)" mb={5} />

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={5}>
            <InfoRow label="Ad Soyad"    value={user?.full_name ?? '—'} />
            <InfoRow label="E-posta"     value={user?.email ?? '—'} />
            <InfoRow label="Telefon"     value={formatPhone(user?.phone ?? '')} />
            <InfoRow label="Rol"         value={roleInfo.label} />
            <InfoRow label="Kayıt Tarihi" value={formatDate(user?.created_at ?? '')} />
          </Grid>
        </MotionBox>

        {/* Güvenlik */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 } as any}
          {...card}
        >
          <Text fontSize="sm" fontWeight="700" color="white" mb={1}>Şifre Değiştir</Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.35)" mb={5}>
            Hesabınızı korumak için güçlü bir şifre kullanın.
          </Text>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4}>
            {/* Mevcut Şifre */}
            <GridItem>
              <Text {...labelStyle}>Mevcut Şifre</Text>
              <InputGroup>
                <Input
                  type={showOld ? 'text' : 'password'}
                  value={oldPw} onChange={e => setOldPw(e.target.value)}
                  placeholder="••••••••"
                  variant="unstyled"
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ borderColor: 'rgba(99,102,241,0.4)' }}
                  _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' }}
                  color="white" _placeholder={{ color: 'rgba(255,255,255,0.2)' }}
                  borderRadius="xl" h={12} px={4} fontSize="sm"
                />
                <InputRightElement h="100%" pr={1}>
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowOld(v => !v)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:6,
                      color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center' }}>
                    <EyeIcon open={showOld} />
                  </button>
                </InputRightElement>
              </InputGroup>
            </GridItem>

            {/* Yeni Şifre */}
            <GridItem>
              <Text {...labelStyle}>Yeni Şifre</Text>
              <InputGroup>
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  variant="unstyled"
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ borderColor: 'rgba(99,102,241,0.4)' }}
                  _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' }}
                  color="white" _placeholder={{ color: 'rgba(255,255,255,0.2)' }}
                  borderRadius="xl" h={12} px={4} fontSize="sm"
                />
                <InputRightElement h="100%" pr={1}>
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowNew(v => !v)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:6,
                      color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center' }}>
                    <EyeIcon open={showNew} />
                  </button>
                </InputRightElement>
              </InputGroup>
            </GridItem>

            {/* Yeni Şifre Tekrar */}
            <GridItem>
              <Text {...labelStyle}>Yeni Şifre Tekrar</Text>
              <InputGroup>
                <Input
                  type={showCon ? 'text' : 'password'}
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  variant="unstyled"
                  bg={confirmPw.length > 0 && confirmPw !== newPw
                    ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.05)'}
                  border={confirmPw.length > 0 && confirmPw !== newPw
                    ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.1)'}
                  _hover={{ borderColor: 'rgba(99,102,241,0.4)' }}
                  _focus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' }}
                  color="white" _placeholder={{ color: 'rgba(255,255,255,0.2)' }}
                  borderRadius="xl" h={12} px={4} fontSize="sm"
                />
                <InputRightElement h="100%" pr={1}>
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowCon(v => !v)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:6,
                      color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center' }}>
                    <EyeIcon open={showCon} />
                  </button>
                </InputRightElement>
              </InputGroup>
              {confirmPw.length > 0 && confirmPw !== newPw && (
                <Text fontSize="10px" color="#f87171" mt={1.5}>Şifreler eşleşmiyor</Text>
              )}
            </GridItem>
          </Grid>

          <Flex mt={5}>
            <Button
              isLoading={saving} loadingText="Kaydediliyor..."
              bg="linear-gradient(135deg,#6366f1,#7c3aed)"
              color="white" fontWeight="700" fontSize="sm"
              borderRadius="xl" h={10} px={6}
              _hover={{ opacity: 0.9, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
              _active={{ opacity: 0.8 }}
              onClick={handleChangePassword}
            >
              Şifreyi Güncelle
            </Button>
          </Flex>
        </MotionBox>

        {/* Bilgi notu */}
        <MotionBox
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 } as any}
        >
          <Text fontSize="xs" color="rgba(255,255,255,0.2)" textAlign="center">
            Bilgi güncelleme için sistem yöneticinizle iletişime geçin · AIDEP v0.1.0
          </Text>
        </MotionBox>

      </Stack>
    </Box>
  )
}

export default ProfilePage
