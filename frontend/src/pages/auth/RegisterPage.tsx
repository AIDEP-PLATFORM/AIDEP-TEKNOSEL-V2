import {
  Box, Button, Flex, FormControl, FormLabel,
  Input, InputGroup, InputRightElement,
  Stack, Text, Link, Select, Grid,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import AidepLogo from '@/components/common/AidepLogo'
import { useCustomToast } from '@/hooks/useCustomToast'
import {
  apiRegisterNgoManager, apiRegisterOfficial,
  apiGetStkOrganizationNames, apiGetStkCities, apiGetStkBranches,
  apiGetOfficialOrganizationNames, apiGetOfficialCities, apiGetOfficialBranches,
  toInternationalPhone, extractErrorMessage,
  type OrganizationBranch,
} from '@/services/authService'
import { setToken, setRole, setUser } from '@/utils/auth'

const MotionBox = motion(Box)
const MotionStack = motion(Stack)
const MotionFlex = motion(Flex)

type UserType = 'NGO_MANAGER' | 'OFFICIAL_MANAGER'

/* ─── SVG ──────────────────────────────────────────── */
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    }
  </svg>
)

/* ─── Ortak stiller ─────────────────────────────────── */
const inputStyle = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  _hover: { borderColor: 'rgba(99,102,241,0.45)' },
  _focus: { borderColor: '#818cf8', bg: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' },
  color: 'white',
  _placeholder: { color: 'rgba(255,255,255,0.2)' },
  borderRadius: 'xl',
  h: 8,
  fontSize: 'sm',
}

const labelStyle = {
  fontSize: '10px',
  fontWeight: '700',
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: 'widest',
  textTransform: 'uppercase' as const,
  mb: 1.5,
}

const selectStyle = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  borderRadius: 'xl',
  h: 8,
  fontSize: 'sm',
  sx: { option: { background: '#0f0d1f', color: 'white' } },
}

/* ─── Şifreli input ──────────────────────────────────── */
function PwInput({ value, onChange, show, onToggle, isInvalid }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; isInvalid?: boolean
}) {
  return (
    <InputGroup>
      <Input type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="••••••••" {...inputStyle} isInvalid={isInvalid} />
      <InputRightElement h="100%" pr={1}>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
          <EyeIcon open={show} />
        </button>
      </InputRightElement>
    </InputGroup>
  )
}

/* ─── Tür seçim kartı ────────────────────────────────── */
function TypeCard({ type, selected, onClick }: { type: UserType; selected: boolean; onClick: () => void }) {
  const isNgo = type === 'NGO_MANAGER'
  return (
    <MotionBox onClick={onClick} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
      flex={1} p={6} borderRadius="2xl" cursor="pointer" position="relative" overflow="hidden"
      textAlign="left"
      border={selected
        ? `2px solid ${isNgo ? '#34d399' : '#818cf8'}`
        : '2px solid rgba(255,255,255,0.08)'}
      bg={selected
        ? isNgo ? 'rgba(52,211,153,0.07)' : 'rgba(99,102,241,0.08)'
        : 'rgba(255,255,255,0.03)'}
      backdropFilter="blur(20px)"
      style={{ transition: 'all 0.2s' }}>
      {selected && (
        <Box position="absolute" top={3} right={3} w={5} h={5} borderRadius="full"
          bg={isNgo ? '#34d399' : '#818cf8'}
          display="flex" alignItems="center" justifyContent="center">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
      )}
      <Flex w={12} h={12} borderRadius="xl" mb={4}
        bg={isNgo ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)'}
        border={`1px solid ${isNgo ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`}
        align="center" justify="center">
        {isNgo ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )}
      </Flex>
      <Text fontSize="md" fontWeight="800" color="white" mb={1}>
        {isNgo ? 'STK Yetkili' : 'Resmi Yetkili'}
      </Text>
      <Text fontSize="xs" color="rgba(255,255,255,0.4)" lineHeight="1.6">
        {isNgo
          ? 'AKUT, Kızılay ve diğer sivil toplum kuruluşları'
          : 'AFAD, UMKE ve devlet kurumu personeli'}
      </Text>
      <Box mt={4} px={2.5} py={1} borderRadius="full" display="inline-block"
        bg={isNgo ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)'}
        border={`1px solid ${isNgo ? 'rgba(52,211,153,0.25)' : 'rgba(99,102,241,0.25)'}`}>
        <Text fontSize="10px" fontWeight="700" letterSpacing="wider"
          color={isNgo ? '#34d399' : '#818cf8'}>
          {isNgo ? 'ADMIN ONAYI GEREKİR' : 'ANINDA GİRİŞ'}
        </Text>
      </Box>
    </MotionBox>
  )
}

/* ─── Bölüm başlığı ──────────────────────────────────── */
function SectionLabel({ icon, text, color = 'rgba(255,255,255,0.5)' }: {
  icon: string; text: string; color?: string
}) {
  return (
    <Flex align="center" gap={2.5} pt={1}>
      <Text fontSize="sm">{icon}</Text>
      <Text fontSize="11px" fontWeight="700" color={color} letterSpacing="widest" textTransform="uppercase">{text}</Text>
      <Box flex={1} h="1px" bg="rgba(255,255,255,0.07)" />
    </Flex>
  )
}

/* ─── 3 kademeli kurum dropdown ─────────────────────── */
function OrgSelector({ orgType, onSelect }: {
  orgType: 'STK' | 'OFFICIAL'
  onSelect: (id: string, name: string, city: string) => void
}) {
  const [names, setNames] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [branches, setBranches] = useState<OrganizationBranch[]>([])
  const [selName, setSelName] = useState('')
  const [selCity, setSelCity] = useState('')
  const [selBranch, setSelBranch] = useState('')
  const [loading, setLoading] = useState(false)

  const isStk = orgType === 'STK'

  useEffect(() => {
    setLoading(true)
    const fn = isStk ? apiGetStkOrganizationNames : apiGetOfficialOrganizationNames
    fn().then(setNames).catch(() => setNames([])).finally(() => setLoading(false))
  }, [orgType])

  const handleNameChange = async (name: string) => {
    setSelName(name); setSelCity(''); setSelBranch(''); setBranches([])
    if (!name) { setCities([]); return }
    const fn = isStk ? apiGetStkCities : apiGetOfficialCities
    const c = await fn(name).catch(() => [])
    setCities(c)
  }

  const handleCityChange = async (city: string) => {
    setSelCity(city); setSelBranch('')
    if (!city || !selName) { setBranches([]); return }
    const fn = isStk ? apiGetStkBranches : apiGetOfficialBranches
    const b = await fn(selName, city).catch(() => [])
    setBranches(b)
  }

  const handleBranchChange = (branchId: string) => {
    setSelBranch(branchId)
    const b = branches.find(x => x.id === branchId)
    if (b) onSelect(b.id, b.name, b.city)
  }

  const accent = isStk ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.4)'
  const focusBorder = isStk ? '#34d399' : '#818cf8'

  return (
    <Stack spacing={3}>
      <FormControl isRequired>
        <FormLabel {...labelStyle}>Kurum Adı</FormLabel>
        <Select value={selName} onChange={e => handleNameChange(e.target.value)}
          placeholder={loading ? 'Yükleniyor...' : 'Kurum seçin'}
          {...selectStyle}
          _hover={{ borderColor: accent }}
          _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 3px ${focusBorder}22` }}
          color={selName ? 'white' : 'rgba(255,255,255,0.2)'}>
          {names.map(n => <option key={n} value={n}>{n}</option>)}
        </Select>
      </FormControl>

      {selName && (
        <FormControl isRequired>
          <FormLabel {...labelStyle}>İl</FormLabel>
          <Select value={selCity} onChange={e => handleCityChange(e.target.value)}
            placeholder="İl seçin"
            {...selectStyle}
            _hover={{ borderColor: accent }}
            _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 3px ${focusBorder}22` }}
            color={selCity ? 'white' : 'rgba(255,255,255,0.2)'}>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormControl>
      )}

      {selCity && (
        <FormControl isRequired>
          <FormLabel {...labelStyle}>Şube / İlçe</FormLabel>
          <Select value={selBranch} onChange={e => handleBranchChange(e.target.value)}
            placeholder="Şube seçin"
            {...selectStyle}
            _hover={{ borderColor: accent }}
            _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 3px ${focusBorder}22` }}
            color={selBranch ? 'white' : 'rgba(255,255,255,0.2)'}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.district}</option>)}
          </Select>
        </FormControl>
      )}
    </Stack>
  )
}

/* ═══════════════════════════════════════════════════════════
   Ana bileşen
═══════════════════════════════════════════════════════════ */
function RegisterPage() {
  const [step, setStep]           = useState<1 | 2>(1)
  const [userType, setUserType]   = useState<UserType | null>(null)

  /* Ortak */
  const [fullName, setFullName]   = useState('')
  const [tc, setTc]               = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCon, setShowCon]     = useState(false)
  const [address, setAddress]     = useState('')

  /* NGO Manager */
  const [ngoOrgId, setNgoOrgId]     = useState('')
  const [ngoOrgName, setNgoOrgName] = useState('')
  const [ngoOrgCity, setNgoOrgCity] = useState('')
  const [activityAreasText, setActivityAreasText] = useState('')

  /* Official */
  const [offOrgId, setOffOrgId]       = useState('')
  const [offOrgName, setOffOrgName]   = useState('')
  const [offOrgCity, setOffOrgCity]   = useState('')
  const [registrationNo, setRegistrationNo] = useState('')

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useCustomToast()

  const handleTc    = (v: string) => setTc(v.replace(/\D/g, '').slice(0, 11))
  const handlePhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    let f = d
    if (d.length > 4) f = d.slice(0,4) + ' ' + d.slice(4)
    if (d.length > 7) f = d.slice(0,4) + ' ' + d.slice(4,7) + ' ' + d.slice(7)
    if (d.length > 9) f = d.slice(0,4) + ' ' + d.slice(4,7) + ' ' + d.slice(7,9) + ' ' + d.slice(9)
    setPhone(f)
  }

  const validateCommon = (): boolean => {
    const tcD = tc.replace(/\D/g, '')
    if (tcD.length !== 11 || tcD[0] === '0') {
      toast({ title: 'Geçersiz TC Kimlik No', description: '11 haneli olmalı, 0 ile başlamamalı.', type: 'error' })
      return false
    }
    const phD = phone.replace(/\D/g, '')
    if (phD.length !== 11 || !phD.startsWith('0')) {
      toast({ title: 'Geçersiz telefon', description: '05XX XXX XX XX formatında girin.', type: 'error' })
      return false
    }
    if (password.length < 6) {
      toast({ title: 'Şifre çok kısa', description: 'En az 6 karakter olmalı.', type: 'error' })
      return false
    }
    if (password !== confirm) {
      toast({ title: 'Şifreler eşleşmiyor', type: 'error' })
      return false
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCommon()) return

    const intlPhone = toInternationalPhone(phone)
    const tcDigits  = tc.replace(/\D/g, '')

    if (userType === 'NGO_MANAGER') {
      if (!ngoOrgId) {
        toast({ title: 'Kurum şubesi seçiniz', type: 'error' }); return
      }
      const areas = activityAreasText.split(',').map(a => a.trim()).filter(Boolean)
      if (!areas.length) {
        toast({ title: 'En az bir faaliyet alanı girin', type: 'error' }); return
      }
      setLoading(true)
      try {
        await apiRegisterNgoManager({
          tc_no: tcDigits, full_name: fullName,
          email, phone: intlPhone,
          password, password_confirm: confirm,
          organization_id: ngoOrgId,
          activity_areas: areas,
          address: address.trim() || undefined,
        })
        toast({
          title: 'Kayıt alındı!',
          description: 'Hesabınız admin onayına gönderildi. Onaylandığında giriş yapabilirsiniz.',
          type: 'success',
          duration: 7000,
        })
        navigate('/login')
      } catch (err) {
        toast({ title: 'Kayıt Hatası', description: extractErrorMessage(err), type: 'error', duration: 5000 })
      } finally {
        setLoading(false)
      }
      return
    }

    /* OFFICIAL_MANAGER */
    if (!offOrgId) {
      toast({ title: 'Kurum şubesi seçiniz', type: 'error' }); return
    }
    const regNo = registrationNo.replace(/\D/g, '')
    if (regNo.length !== 10) {
      toast({ title: 'Sicil numarası 10 haneli olmalı', type: 'error' }); return
    }
    setLoading(true)
    try {
      const res = await apiRegisterOfficial({
        tc_no: tcDigits, full_name: fullName,
        email, phone: intlPhone,
        password, password_confirm: confirm,
        organization_id: offOrgId,
        registration_number: regNo,
        address: address.trim() || undefined,
      })
      setToken(res.access_token)
      setRole(res.user.role)
      setUser({
        ...res.user,
        organization_name: offOrgName,
        organization_city: offOrgCity,
        registration_number: regNo,
        address: address.trim() || undefined,
      })
      toast({ title: 'Kayıt başarılı', description: 'Hoş geldiniz!', type: 'success' })
      navigate('/dashboard')
    } catch (err) {
      toast({ title: 'Kayıt Hatası', description: extractErrorMessage(err), type: 'error', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const Orbs = () => (
    <>
      <MotionBox position="absolute" w="700px" h="700px" borderRadius="full" bg="#2d1b69"
        opacity={0.22} top="-200px" right="-150px" filter="blur(120px)" zIndex={0}
        animate={{ scale: [1, 1.1, 1], opacity: [0.22, 0.32, 0.22] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' } as any} />
      <MotionBox position="absolute" w="500px" h="500px" borderRadius="full" bg="#4c1d95"
        opacity={0.18} bottom="-150px" left="-80px" filter="blur(100px)" zIndex={0}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 2 } as any} />
      <Box position="absolute" inset={0} zIndex={0} opacity={0.03}
        backgroundImage="linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)"
        backgroundSize="60px 60px" />
    </>
  )

  /* ── Adım 1: Tür seçimi ── */
  if (step === 1) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#08091a" position="relative" overflow="hidden" py={10}>
        <Orbs />
        <MotionBox zIndex={1} w="full" maxW="520px" mx={4}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' } as any}>
          <Stack spacing={8}>
            <Stack align="center" spacing={3}>
              <MotionBox animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' } as any}>
                <AidepLogo size={72} variant="auth" showText={true} />
              </MotionBox>
              <Text color="rgba(255,255,255,0.35)" fontSize="xs">Yapay Zekâ Destekli Deprem Yönetim Platformu</Text>
            </Stack>

            <Box bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="2xl" p={7} backdropFilter="blur(20px)"
              boxShadow="0 8px 48px rgba(0,0,0,0.4)" position="relative"
              _before={{
                content: '""', position: 'absolute',
                top: 0, left: '10%', right: '10%', h: '1px',
                bgGradient: 'linear(to-r, transparent, #6366f1, #7c3aed, transparent)',
              }}>
              <Stack spacing={6}>
                <Box>
                  <Text fontSize="lg" fontWeight="800" color="white">Hesap Türü Seçin</Text>
                  <Text color="rgba(255,255,255,0.35)" fontSize="xs" mt={1}>Sisteme nasıl katılmak istiyorsunuz?</Text>
                </Box>
                <Flex gap={4}>
                  <TypeCard type="NGO_MANAGER" selected={userType === 'NGO_MANAGER'} onClick={() => { setUserType('NGO_MANAGER'); setStep(2) }} />
                  <TypeCard type="OFFICIAL_MANAGER" selected={userType === 'OFFICIAL_MANAGER'} onClick={() => { setUserType('OFFICIAL_MANAGER'); setStep(2) }} />
                </Flex>
                <Text textAlign="center" color="rgba(255,255,255,0.3)" fontSize="xs">
                  Zaten hesabınız var mı?{' '}
                  <Link as={RouterLink} to="/login" color="#818cf8" fontWeight="600"
                    _hover={{ color: '#a5b4fc', textDecoration: 'none' }}>Giriş Yap</Link>
                </Text>
              </Stack>
            </Box>

            <Text color="rgba(255,255,255,0.12)" fontSize="xs" textAlign="center">
              Yalnızca yetkili STK, AFAD ve UMKE personeli · v0.1.0
            </Text>
          </Stack>
        </MotionBox>
      </Flex>
    )
  }

  /* ── Adım 2: Form ── */
  const isNgo = userType === 'NGO_MANAGER'
  const accent = isNgo ? '#34d399' : '#818cf8'

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08091a" position="relative" overflow="hidden" py={8}>
      <Orbs />
      <AnimatePresence mode="wait">
        <MotionBox key="step2" zIndex={1} w="full" maxW="560px" mx={4}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.38, ease: 'easeOut' } as any}>
          <Stack spacing={6}>

            <Flex align="center" justify="space-between">
              <AidepLogo size={36} variant="auth" showText={false} />
              <Box px={3} py={1} borderRadius="full"
                bg={isNgo ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)'}
                border={`1px solid ${accent}40`}>
                <Text fontSize="11px" fontWeight="700" color={accent} letterSpacing="wider">
                  {isNgo ? 'STK YETKİLİ KAYDI' : 'RESMİ YETKİLİ KAYDI'}
                </Text>
              </Box>
            </Flex>

            <Box as="form" onSubmit={handleRegister}
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="2xl" p={7} backdropFilter="blur(20px)"
              boxShadow="0 8px 48px rgba(0,0,0,0.4)" position="relative"
              _before={{
                content: '""', position: 'absolute',
                top: 0, left: '8%', right: '8%', h: '1px',
                bgGradient: `linear(to-r, transparent, ${accent}, transparent)`,
              }}>
              <Stack spacing={5}>

                {/* Geri + başlık */}
                <Flex align="center" gap={3}>
                  <Box as="button" type="button" onClick={() => setStep(1)}
                    w={8} h={8} borderRadius="lg" display="flex" alignItems="center" justifyContent="center"
                    bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
                    color="rgba(255,255,255,0.6)"
                    _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'white' }}
                    transition="all 0.15s" cursor="pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5m7-7l-7 7 7 7" />
                    </svg>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="800" color="white">
                      {isNgo ? 'STK Yetkili Kaydı' : 'Resmi Yetkili Kaydı'}
                    </Text>
                    <Text fontSize="10px" color="rgba(255,255,255,0.3)">Tüm alanları doldurun</Text>
                  </Box>
                </Flex>

                {/* Genel Bilgiler */}
                <SectionLabel icon="👤" text="Genel Bilgiler" />

                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Ad Soyad</FormLabel>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Ahmet Yılmaz" {...inputStyle} />
                </FormControl>

                <Grid templateColumns="1fr 1fr" gap={3}>
                  <FormControl isRequired>
                    <FormLabel {...labelStyle}>TC Kimlik No</FormLabel>
                    <Input value={tc} onChange={e => handleTc(e.target.value)}
                      placeholder="12345678901" inputMode="numeric" maxLength={11} {...inputStyle}
                      isInvalid={tc.length > 0 && (tc.length < 11 || tc[0] === '0')} />
                    {tc.length > 0 && tc.length < 11 && (
                      <Text fontSize="10px" color="#f87171" mt={1}>{tc.length}/11 hane</Text>
                    )}
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel {...labelStyle}>Telefon</FormLabel>
                    <Input value={phone} onChange={e => handlePhone(e.target.value)}
                      placeholder="0532 123 45 67" inputMode="numeric" {...inputStyle} />
                  </FormControl>
                </Grid>

                <FormControl isRequired>
                  <FormLabel {...labelStyle}>E-posta</FormLabel>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@mail.com" {...inputStyle} />
                </FormControl>

                <Grid templateColumns="1fr 1fr" gap={3}>
                  <FormControl isRequired>
                    <FormLabel {...labelStyle}>Şifre</FormLabel>
                    <PwInput value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(v => !v)} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel {...labelStyle}>Şifre Tekrar</FormLabel>
                    <PwInput value={confirm} onChange={setConfirm} show={showCon}
                      onToggle={() => setShowCon(v => !v)}
                      isInvalid={confirm.length > 0 && confirm !== password} />
                    {confirm.length > 0 && confirm !== password && (
                      <Text fontSize="10px" color="#f87171" mt={1}>Şifreler eşleşmiyor</Text>
                    )}
                  </FormControl>
                </Grid>

                {/* Tür'e göre özel alanlar */}
                {isNgo ? (
                  <>
                    <SectionLabel icon="🤝" text="STK Bilgileri" color={accent} />
                    <OrgSelector orgType="STK" onSelect={(id, name, city) => {
                      setNgoOrgId(id); setNgoOrgName(name); setNgoOrgCity(city)
                    }} />
                    <FormControl isRequired>
                      <FormLabel {...labelStyle}>Faaliyet Alanları</FormLabel>
                      <Input value={activityAreasText} onChange={e => setActivityAreasText(e.target.value)}
                        placeholder="Arama kurtarma, insani yardım, eğitim (virgülle ayırın)"
                        {...inputStyle} />
                      <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={1}>
                        Birden fazla alan virgülle ayrın
                      </Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyle}>Açık Adres (Opsiyonel)</FormLabel>
                      <Input value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="Mahalle, sokak, kapı no..." {...inputStyle} />
                    </FormControl>
                    {/* Bilgi notu */}
                    <Flex align="flex-start" gap={2.5} p={3} borderRadius="xl"
                      bg="rgba(251,191,36,0.06)" border="1px solid rgba(251,191,36,0.2)">
                      <Text color="#fbbf24" fontSize="xs" mt={0.5}>⚠</Text>
                      <Text fontSize="xs" color="rgba(255,255,255,0.5)" lineHeight="1.6">
                        STK Yetkili kaydı admin onayı gerektirir. Onay sonrası giriş yapabilirsiniz.
                      </Text>
                    </Flex>
                  </>
                ) : (
                  <>
                    <SectionLabel icon="🏛" text="Kurum Bilgileri" color={accent} />
                    <OrgSelector orgType="OFFICIAL" onSelect={(id, name, city) => {
                      setOffOrgId(id); setOffOrgName(name); setOffOrgCity(city)
                    }} />
                    <FormControl isRequired>
                      <FormLabel {...labelStyle}>Sicil Numarası (10 hane)</FormLabel>
                      <Input value={registrationNo}
                        onChange={e => setRegistrationNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="1234567890" inputMode="numeric" maxLength={10} {...inputStyle}
                        isInvalid={registrationNo.length > 0 && registrationNo.length < 10} />
                      {registrationNo.length > 0 && registrationNo.length < 10 && (
                        <Text fontSize="10px" color="#f87171" mt={1}>{registrationNo.length}/10 hane</Text>
                      )}
                      <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={1}>
                        Sicil başı "1" → web+mobil erişim | diğer → sadece mobil
                      </Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyle}>Açık Adres (Opsiyonel)</FormLabel>
                      <Input value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="Mahalle, sokak, bina no..." {...inputStyle} />
                    </FormControl>
                  </>
                )}

                {/* Submit */}
                <MotionBox whileHover={{ scale: 1.02 } as any} whileTap={{ scale: 0.97 } as any} pt={1}>
                  <Button type="submit" isLoading={loading}
                    loadingText={isNgo ? 'Kaydediliyor...' : 'Kaydediliyor...'}
                    w="full" h={8}
                    bg={isNgo
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #6366f1, #7c3aed)'}
                    color="white" fontWeight="700" fontSize="sm" borderRadius="8px" border="none"
                    _hover={{ opacity: 0.9, boxShadow: `0 0 32px ${isNgo ? 'rgba(16,185,129,0.45)' : 'rgba(99,102,241,0.5)'}` }}
                    _active={{ opacity: 0.8 }}>
                    {isNgo ? 'Kayıt Yaptır (Admin Onayına Gönder)' : 'Kayıt Ol ve Giriş Yap'}
                  </Button>
                </MotionBox>

                <Text textAlign="center" color="rgba(255,255,255,0.3)" fontSize="xs">
                  Zaten hesabınız var mı?{' '}
                  <Link as={RouterLink} to="/login" color="#818cf8" fontWeight="600"
                    _hover={{ color: '#a5b4fc', textDecoration: 'none' }}>Giriş Yap</Link>
                </Text>
              </Stack>
            </Box>

            <Text color="rgba(255,255,255,0.12)" fontSize="xs" textAlign="center">
              Yalnızca yetkili STK, AFAD ve UMKE personeli · v0.1.0
            </Text>
          </Stack>
        </MotionBox>
      </AnimatePresence>
    </Flex>
  )
}

export default RegisterPage
