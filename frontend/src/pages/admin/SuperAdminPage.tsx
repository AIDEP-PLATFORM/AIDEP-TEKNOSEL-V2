import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box, Button, Flex, Text, Grid, Stack,
  Input, InputGroup, InputLeftElement, Select, Spinner,
  useToast,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  apiCreateOrganization, apiListOrganizations,
  type OrgType, type OrganizationCreate, type OrganizationRecord,
} from '@/services/organizationAdminService'
import {
  apiAdminGetUsers, apiAdminGetPending,
  apiAdminApprove, apiAdminDeactivate, apiAdminActivate,
  getUserOrg, getUserCity,
  type AdminUserResponse,
} from '@/services/adminService'

const MotionBox  = motion(Box)
const MotionFlex = motion(Flex)

// ── Rol config (gerçek backend rolleri) ─────────────────────────
const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:            { label: 'Admin',          color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  NGO_MANAGER:      { label: 'STK Yönetici',   color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  NGO_STAFF:        { label: 'STK Personel',   color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)' },
  OFFICIAL_MANAGER: { label: 'Resmi Yönetici', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  OFFICIAL_STAFF:   { label: 'Resmi Personel', color: '#93c5fd', bg: 'rgba(147,197,253,0.12)' },
  VOLUNTEER:        { label: 'Gönüllü',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  CITIZEN:          { label: 'Vatandaş',       color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
}

function getUserStatusDisplay(u: AdminUserResponse) {
  if (!u.is_active && u.role === 'NGO_MANAGER')
    return { label: 'Onay Bekliyor', color: '#fbbf24', dot: '#fbbf24' }
  if (u.is_active)
    return { label: 'Aktif', color: '#4ade80', dot: '#4ade80' }
  return { label: 'Pasif', color: '#f87171', dot: '#f87171' }
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('tr-TR') } catch { return iso }
}

// ── Sistem logları ───────────────────────────────────────────────
const LOGS = [
  { id:1, time:'10:42:15', type:'user',    msg:'Yeni kayıt: Fatma Şahin (STK Yetkili - Hayata Destek)',    color:'#818cf8' },
  { id:2, time:'10:38:02', type:'system',  msg:'Sismik veri servisi güncellendi (AFAD API v2.3)',           color:'#34d399' },
  { id:3, time:'10:21:47', type:'warning', msg:'Zeynep Arslan hesabı askıya alındı (yetkisiz erişim)',      color:'#fbbf24' },
  { id:4, time:'09:55:30', type:'user',    msg:'Yeni kayıt: Tarık Bozkurt (STK Yetkili - Hayata Destek)', color:'#818cf8' },
  { id:5, time:'09:44:18', type:'system',  msg:'Otomatik yedekleme tamamlandı (DB snapshot)',               color:'#34d399' },
  { id:6, time:'09:32:05', type:'request', msg:'Kritik talep #1042: Enkaz altında yaralı — Bornova/İzmir', color:'#f87171' },
  { id:7, time:'09:18:50', type:'user',    msg:'Seda Yılmaz kaydı onay bekliyor (UMKE)',                   color:'#818cf8' },
  { id:8, time:'08:51:22', type:'system',  msg:'Platform başlatıldı — tüm servisler aktif',                color:'#34d399' },
  { id:9, time:'08:44:10', type:'request', msg:'Yüksek öncelikli talep #1041: Bina çökmesi — Kadıköy',     color:'#fb923c' },
  { id:10,time:'08:30:00', type:'system',  msg:'Günlük rapor oluşturuldu ve arşivlendi',                   color:'#34d399' },
]


// ── Yardımcı bileşenler ──────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)

const CpuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
)

const LogIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="18" height="13" rx="2"/>
    <path d="M8 9V5a2 2 0 012-2h4a2 2 0 012 2v4"/>
    <line x1="12" y1="12" x2="12" y2="17"/>
    <line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const BanIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)

// ── KPI kartı ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, glow, icon, onClick }: {
  label: string; value: number|string; sub: string; color: string; glow: string; icon: string
  onClick?: () => void
}) {
  return (
    <MotionBox
      borderRadius="2xl" p={5} position="relative" overflow="hidden"
      bg="rgba(255,255,255,0.03)" border={`1px solid ${color}30`}
      boxShadow={`0 0 20px ${glow}`}
      whileHover={{ y: -3, boxShadow: `0 8px 32px ${glow}` } as any}
      transition={{ duration: 0.2 } as any}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
    >
      <Box position="absolute" top="-30px" right="-20px" w="90px" h="90px"
        borderRadius="full" bg={color} opacity={0.07} filter="blur(30px)" />
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.4)"
            letterSpacing="widest" textTransform="uppercase" mb={2}>{label}</Text>
          <Text fontSize="2xl" fontWeight="800" color="white" lineHeight={1} mb={1.5}>{value}</Text>
          <Text fontSize="11px" color={`${color}`} fontWeight="600">{sub}</Text>
        </Box>
        <Text fontSize="2xl" opacity={0.75}>{icon}</Text>
      </Flex>
      {onClick && (
        <Text fontSize="9px" color={color} opacity={0.6} mt={2} letterSpacing="wider">
          GÖRÜNTÜLE →
        </Text>
      )}
    </MotionBox>
  )
}

// ── Kullanıcı tablosu satırı ──────────────────────────────────────
function UserRow({ user, idx, onAction }: {
  user: AdminUserResponse
  idx: number
  onAction: (id: string, action: 'approve' | 'deactivate' | 'activate') => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const rConf = roleConfig[user.role] ?? { label: user.role, color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' }
  const sConf = getUserStatusDisplay(user)
  const org   = getUserOrg(user)
  const city  = getUserCity(user)

  const act = async (action: 'approve' | 'deactivate' | 'activate') => {
    setBusy(true)
    try { await onAction(user.id, action) } finally { setBusy(false) }
  }

  const isPending  = !user.is_active && user.role === 'NGO_MANAGER'
  const isActive   = user.is_active
  const isAdmin    = user.role === 'ADMIN'

  return (
    <MotionBox
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.04 } as any}
      px={4} py={3}
      display="grid"
      gridTemplateColumns="2fr 2fr 1.4fr 1.1fr 1.1fr 1fr"
      gap={3} alignItems="center"
      bg={idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
      borderBottom="1px solid rgba(255,255,255,0.04)"
      _hover={{ bg: 'rgba(129,140,248,0.06)' }}
      style={{ transition: 'background 0.15s' }}
    >
      {/* Ad Soyad */}
      <Flex align="center" gap={2.5} overflow="hidden">
        <Flex w={8} h={8} borderRadius="lg" bg={`${rConf.color}20`}
          border={`1px solid ${rConf.color}30`} align="center" justify="center" flexShrink={0}>
          <Text fontSize="11px" fontWeight="700" color={rConf.color}>
            {user.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </Text>
        </Flex>
        <Box overflow="hidden">
          <Text fontSize="sm" color="white" fontWeight="600" isTruncated>{user.full_name}</Text>
          <Text fontSize="10px" color="rgba(255,255,255,0.35)" isTruncated>{user.email}</Text>
        </Box>
      </Flex>

      {/* Kurum / İl */}
      <Box overflow="hidden">
        <Text fontSize="sm" color="rgba(255,255,255,0.75)" isTruncated>{org}</Text>
        <Text fontSize="10px" color="rgba(255,255,255,0.3)">{city}</Text>
      </Box>

      {/* Rol */}
      <Flex align="center" gap={1.5} px={2.5} py={1} borderRadius="full"
        bg={rConf.bg} border={`1px solid ${rConf.color}30`} w="fit-content">
        <Text fontSize="10px" fontWeight="700" color={rConf.color} letterSpacing="wide">
          {rConf.label}
        </Text>
      </Flex>

      {/* Kayıt tarihi */}
      <Text fontSize="xs" color="rgba(255,255,255,0.4)">{fmtDate(user.created_at)}</Text>

      {/* Durum */}
      <Flex align="center" gap={1.5}>
        <MotionBox w={1.5} h={1.5} borderRadius="full" bg={sConf.dot}
          animate={isActive ? { opacity:[1,0.3,1] } : {}}
          transition={{ duration:2, repeat:Infinity } as any} />
        <Text fontSize="xs" fontWeight="600" color={sConf.color}>{sConf.label}</Text>
      </Flex>

      {/* Aksiyonlar */}
      <Flex gap={1.5} justify="flex-end">
        {/* Onayla — sadece NGO_MANAGER + pasif */}
        {isPending && (
          <MotionBox
            onClick={() => act('approve')}
            cursor={busy ? 'wait' : 'pointer'}
            w={7} h={7} borderRadius="lg"
            bg="rgba(74,222,128,0.1)" border="1px solid rgba(74,222,128,0.25)"
            display="flex" alignItems="center" justifyContent="center"
            color="#4ade80" opacity={busy ? 0.5 : 1}
            whileHover={{ bg: 'rgba(74,222,128,0.2)' } as any}
            whileTap={{ scale: 0.9 } as any}
            transition={{ duration: 0.15 } as any}
            title="Onayla"
          >
            <CheckIcon />
          </MotionBox>
        )}
        {/* Aktif Et — pasif ama onay beklemiyorsa */}
        {!isActive && !isPending && (
          <MotionBox
            onClick={() => act('activate')}
            cursor={busy ? 'wait' : 'pointer'}
            w={7} h={7} borderRadius="lg"
            bg="rgba(74,222,128,0.1)" border="1px solid rgba(74,222,128,0.25)"
            display="flex" alignItems="center" justifyContent="center"
            color="#4ade80" opacity={busy ? 0.5 : 1}
            whileHover={{ bg: 'rgba(74,222,128,0.2)' } as any}
            whileTap={{ scale: 0.9 } as any}
            transition={{ duration: 0.15 } as any}
            title="Aktif Et"
          >
            <CheckIcon />
          </MotionBox>
        )}
        {/* Askıya Al — aktif + admin değil */}
        {isActive && !isAdmin && (
          <MotionBox
            onClick={() => act('deactivate')}
            cursor={busy ? 'wait' : 'pointer'}
            w={7} h={7} borderRadius="lg"
            bg="rgba(248,113,113,0.1)" border="1px solid rgba(248,113,113,0.25)"
            display="flex" alignItems="center" justifyContent="center"
            color="#f87171" opacity={busy ? 0.5 : 1}
            whileHover={{ bg: 'rgba(248,113,113,0.2)' } as any}
            whileTap={{ scale: 0.9 } as any}
            transition={{ duration: 0.15 } as any}
            title="Askıya Al"
          >
            <BanIcon />
          </MotionBox>
        )}
      </Flex>
    </MotionBox>
  )
}

// ── Sistem servis kartı ──────────────────────────────────────────
function ServiceCard({ name, status, uptime, detail }: {
  name: string; status: 'up'|'down'|'warn'; uptime: string; detail: string
}) {
  const cfg = {
    up:   { color:'#4ade80', label:'Çalışıyor', bg:'rgba(74,222,128,0.1)'   },
    down: { color:'#f87171', label:'Çöktü',     bg:'rgba(248,113,113,0.1)' },
    warn: { color:'#fbbf24', label:'Uyarı',      bg:'rgba(251,191,36,0.1)'  },
  }[status]

  return (
    <Flex align="center" justify="space-between"
      px={4} py={3} borderRadius="xl"
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
      _hover={{ bg:'rgba(255,255,255,0.05)' }} transition="background 0.2s">
      <Flex align="center" gap={3}>
        <MotionBox w={2} h={2} borderRadius="full" bg={cfg.color}
          animate={status==='up' ? { opacity:[1,0.3,1] } : {}}
          transition={{ duration:2, repeat:Infinity } as any}/>
        <Box>
          <Text fontSize="sm" color="white" fontWeight="600">{name}</Text>
          <Text fontSize="10px" color="rgba(255,255,255,0.35)">{detail}</Text>
        </Box>
      </Flex>
      <Flex align="center" gap={3}>
        <Text fontSize="xs" color="rgba(255,255,255,0.4)" fontFamily="mono">{uptime}</Text>
        <Flex px={2.5} py={1} borderRadius="full" bg={cfg.bg} border={`1px solid ${cfg.color}30`}>
          <Text fontSize="10px" fontWeight="700" color={cfg.color}>{cfg.label}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

// ── Env satırı ──────────────────────────────────────────────────
function EnvRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <Flex align="center" justify="space-between"
      px={4} py={2.5} borderRadius="lg"
      bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.05)">
      <Text fontSize="xs" color="rgba(255,255,255,0.45)" fontFamily="mono" w="180px">{label}</Text>
      <Flex align="center" gap={2} flex={1} overflow="hidden">
        <Text fontSize="xs" color={secret && !show ? 'rgba(255,255,255,0.2)' : '#a5b4fc'}
          fontFamily="mono" isTruncated>
          {secret && !show ? '••••••••••••••••' : value}
        </Text>
      </Flex>
      {secret && (
        <Box cursor="pointer" color="rgba(255,255,255,0.3)" _hover={{ color:'#818cf8' }}
          transition="color 0.2s" onClick={() => setShow(!show)} px={1} fontSize="10px" fontWeight="600">
          {show ? 'GİZLE' : 'GÖSTER'}
        </Box>
      )}
    </Flex>
  )
}

// ── Kurum Yönetimi Tab ─────────────────────────────────────────────
const CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak',
  'Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan',
  'Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
]

const STK_NAMES  = ['AKUT','Kızılay','İHH','TEGV','Hayata Destek','UKAM','TOG','Ahbap','Sığınaklar']
const OFF_NAMES  = ['AFAD','UMKE','İtfaiye','Jandarma','Emniyet','Sağlık Bakanlığı']

function OrgManagementTab() {
  const toast = useToast()
  const [orgs, setOrgs]       = useState<OrganizationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState<OrgType | 'all'>('all')
  const [form, setForm]       = useState<OrganizationCreate>({
    name: '', city: '', district: '', org_type: 'STK',
  })

  const loadOrgs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiListOrganizations()
      setOrgs(data)
    } catch {
      toast({ title: 'Kurumlar yüklenemedi', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadOrgs() }, [loadOrgs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.city || !form.district.trim()) {
      toast({ title: 'Tüm alanları doldurun', status: 'warning', duration: 3000 })
      return
    }
    setSaving(true)
    try {
      const created = await apiCreateOrganization(form)
      setOrgs(prev => [...prev, created])
      setForm({ name: '', city: '', district: '', org_type: 'STK' })
      toast({ title: 'Kurum eklendi ✓', status: 'success', duration: 3000 })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const status = err?.response?.status
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? d).join(', ')
        : (detail ?? err?.message ?? 'Kurum eklenemedi')
      toast({
        title: `Kurum eklenemedi${status ? ` (${status})` : ''}`,
        description: msg,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const nameOptions = form.org_type === 'STK' ? STK_NAMES : OFF_NAMES
  const filtered = filter === 'all' ? orgs : orgs.filter(o => o.org_type === filter)

  return (
    <MotionBox key="orgs"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
      transition={{ duration:0.2 } as any}>

      <Grid templateColumns={{ base:'1fr', lg:'380px 1fr' }} gap={6} alignItems="start">

        {/* Form */}
        <Box as="form" onSubmit={handleSubmit}
          borderRadius="2xl" overflow="hidden"
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
          boxShadow="0 4px 32px rgba(0,0,0,0.3)">
          <Box px={5} py={4} borderBottom="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.04)">
            <Text fontSize="sm" fontWeight="700" color="white">Yeni Kurum Ekle</Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.35)" mt={0.5}>
              Kayıt formunda görünmesi için kurum şubesi oluşturun
            </Text>
          </Box>
          <Stack spacing={4} p={5}>
            {/* Kurum Türü */}
            <Box>
              <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                letterSpacing="widest" textTransform="uppercase" mb={1.5}>Kurum Türü</Text>
              <Flex gap={2}>
                {(['STK','OFFICIAL'] as OrgType[]).map(t => (
                  <Box key={t} flex={1} py={2} borderRadius="xl" cursor="pointer" textAlign="center"
                    onClick={() => setForm(f => ({ ...f, org_type: t, name: '' }))}
                    bg={form.org_type === t ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${form.org_type === t ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`}
                    transition="all 0.15s"
                    _hover={{ bg: form.org_type === t ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.07)' }}>
                    <Text fontSize="xs" fontWeight="700"
                      color={form.org_type === t ? '#f97316' : 'rgba(255,255,255,0.45)'}>
                      {t === 'STK' ? '🤝 STK' : '🏛️ Resmi'}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>

            {/* Kurum Adı */}
            <Box>
              <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                letterSpacing="widest" textTransform="uppercase" mb={1.5}>Kurum Adı</Text>
              <Select value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                color={form.name ? 'white' : 'rgba(255,255,255,0.3)'} borderRadius="xl" h={9} fontSize="sm"
                _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
                sx={{ option:{ background:'#0d0e20', color:'white' } }}>
                <option value="">Seçiniz...</option>
                {nameOptions.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__custom__">Diğer (elle gir)</option>
              </Select>
              {form.name === '__custom__' && (
                <Input mt={2} h={9} fontSize="sm" placeholder="Kurum adını yazın"
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                  color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }} borderRadius="xl"
                  _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                  _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              )}
            </Box>

            {/* İl */}
            <Box>
              <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                letterSpacing="widest" textTransform="uppercase" mb={1.5}>İl</Text>
              <Select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                color={form.city ? 'white' : 'rgba(255,255,255,0.3)'} borderRadius="xl" h={9} fontSize="sm"
                _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
                sx={{ option:{ background:'#0d0e20', color:'white' } }}>
                <option value="">İl seçiniz...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Box>

            {/* İlçe */}
            <Box>
              <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                letterSpacing="widest" textTransform="uppercase" mb={1.5}>İlçe / Şube</Text>
              <Input h={9} fontSize="sm"
                placeholder="Örn: Merkez, Kadıköy, Selçuklu..."
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }} borderRadius="xl"
                _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }} />
            </Box>

            <Button type="submit" isLoading={saving} loadingText="Ekleniyor..."
              w="full" h={9} borderRadius="xl"
              bg="linear-gradient(135deg,#dc2626,#ea580c)"
              color="white" fontWeight="700" fontSize="sm"
              _hover={{ opacity:0.9 }} _active={{ opacity:0.8 }}>
              Kurum Şubesini Ekle
            </Button>
          </Stack>
        </Box>

        {/* Liste */}
        <Box borderRadius="2xl" overflow="hidden"
          bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.07)">
          <Flex px={5} py={4} align="center" justify="space-between"
            borderBottom="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.03)">
            <Box>
              <Text fontSize="sm" fontWeight="700" color="white">Kayıtlı Kurumlar</Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.35)" mt={0.5}>
                {orgs.length} kurum şubesi
              </Text>
            </Box>
            <Flex gap={2}>
              {(['all','STK','OFFICIAL'] as const).map(t => (
                <Box key={t} px={3} py={1} borderRadius="lg" cursor="pointer"
                  onClick={() => setFilter(t)}
                  bg={filter === t ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)'}
                  border={`1px solid ${filter === t ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.07)'}`}>
                  <Text fontSize="10px" fontWeight="700"
                    color={filter === t ? '#f97316' : 'rgba(255,255,255,0.4)'}>
                    {t === 'all' ? 'TÜMÜ' : t}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Flex>

          {loading ? (
            <Flex align="center" justify="center" py={12} gap={3}>
              <Spinner size="sm" color="#f97316" />
              <Text fontSize="sm" color="rgba(255,255,255,0.35)">Yükleniyor...</Text>
            </Flex>
          ) : filtered.length === 0 ? (
            <Flex align="center" justify="center" py={12} direction="column" gap={2}>
              <Text fontSize="sm" color="rgba(255,255,255,0.25)">Henüz kurum eklenmemiş</Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.15)">Soldaki formu kullanarak ekleyin</Text>
            </Flex>
          ) : (
            <Stack spacing={0}>
              {filtered.map((org, i) => (
                <Flex key={org.id} px={5} py={3} align="center" justify="space-between"
                  bg={i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  borderBottom="1px solid rgba(255,255,255,0.04)"
                  _hover={{ bg:'rgba(255,255,255,0.03)' }}>
                  <Flex align="center" gap={3}>
                    <Flex w={8} h={8} borderRadius="lg" align="center" justify="center" flexShrink={0}
                      bg={org.org_type === 'STK' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)'}
                      border={`1px solid ${org.org_type === 'STK' ? 'rgba(52,211,153,0.25)' : 'rgba(96,165,250,0.25)'}`}>
                      <Text fontSize="xs">{org.org_type === 'STK' ? '🤝' : '🏛️'}</Text>
                    </Flex>
                    <Box>
                      <Text fontSize="sm" color="white" fontWeight="600">{org.name}</Text>
                      <Text fontSize="xs" color="rgba(255,255,255,0.35)">{org.city} / {org.district}</Text>
                    </Box>
                  </Flex>
                  <Box px={2.5} py={0.5} borderRadius="full"
                    bg={org.org_type === 'STK' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)'}
                    border={`1px solid ${org.org_type === 'STK' ? 'rgba(52,211,153,0.3)' : 'rgba(96,165,250,0.3)'}`}>
                    <Text fontSize="10px" fontWeight="700"
                      color={org.org_type === 'STK' ? '#34d399' : '#60a5fa'}>{org.org_type}</Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      </Grid>
    </MotionBox>
  )
}

// ── Ana bileşen ──────────────────────────────────────────────────
type Tab = 'users' | 'system' | 'logs' | 'orgs'

export default function SuperAdminPage() {
  const toast = useToast()
  const [activeTab, setActiveTab]     = useState<Tab>('users')
  const [users, setUsers]             = useState<AdminUserResponse[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [query, setQuery]             = useState('')
  const [roleFilter, setRoleFilter]   = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const data = await apiAdminGetUsers()
      setUsers(data)
    } catch {
      toast({ title: 'Kullanıcılar yüklenemedi', status: 'error', duration: 3000 })
    } finally {
      setLoadingUsers(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
  }, [activeTab, loadUsers])

  const handleAction = useCallback(async (
    id: string, action: 'approve' | 'deactivate' | 'activate'
  ) => {
    try {
      if (action === 'approve')    await apiAdminApprove(id)
      if (action === 'deactivate') await apiAdminDeactivate(id)
      if (action === 'activate')   await apiAdminActivate(id)
      toast({ title: action === 'deactivate' ? 'Kullanıcı askıya alındı' : 'Kullanıcı onaylandı / aktifleştirildi', status: 'success', duration: 2500 })
      await loadUsers()
    } catch {
      toast({ title: 'İşlem başarısız', status: 'error', duration: 3000 })
    }
  }, [toast, loadUsers])

  const stats = useMemo(() => ({
    total:     users.length,
    active:    users.filter(u => u.is_active).length,
    pending:   users.filter(u => !u.is_active && u.role === 'NGO_MANAGER').length,
    suspended: users.filter(u => !u.is_active && u.role !== 'NGO_MANAGER').length,
  }), [users])

  const filtered = useMemo(() => users.filter(u => {
    const q = query.toLowerCase()
    const matchQ = !q
      || u.full_name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || getUserOrg(u).toLowerCase().includes(q)
      || getUserCity(u).toLowerCase().includes(q)
    const matchR = roleFilter === 'all' || u.role === roleFilter
    const matchS = statusFilter === 'all'
      || (statusFilter === 'active'    && u.is_active)
      || (statusFilter === 'pending'   && !u.is_active && u.role === 'NGO_MANAGER')
      || (statusFilter === 'suspended' && !u.is_active && u.role !== 'NGO_MANAGER')
    return matchQ && matchR && matchS
  }), [users, query, roleFilter, statusFilter])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users',  label: 'Kullanıcılar', icon: <UsersIcon /> },
    { id: 'orgs',   label: 'Kurumlar',     icon: <BuildingIcon /> },
    { id: 'system', label: 'Sistem',        icon: <CpuIcon />  },
    { id: 'logs',   label: 'Loglar',        icon: <LogIcon />  },
  ]

  return (
    <Box px={6} py={5}>

      {/* Üst başlık */}
      <MotionFlex
        align="center" gap={3} mb={6}
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 } as any}
      >
        <Flex w={10} h={10} borderRadius="xl"
          bg="rgba(239,68,68,0.15)" border="1px solid rgba(239,68,68,0.3)"
          align="center" justify="center" color="#f87171">
          <ShieldIcon />
        </Flex>
        <Box>
          <Text color="white" fontWeight="800" fontSize="lg" lineHeight={1.2}>Süper Admin Paneli</Text>
          <Text color="rgba(255,255,255,0.35)" fontSize="12px">Sistem yönetimi ve kullanıcı kontrolü</Text>
        </Box>
        {/* Aktif banner */}
        <Flex ml="auto" align="center" gap={2} px={3} py={1.5} borderRadius="full"
          bg="rgba(239,68,68,0.1)" border="1px solid rgba(239,68,68,0.25)">
          <MotionBox w={2} h={2} borderRadius="full" bg="#f87171"
            animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.5, repeat:Infinity } as any}/>
          <Text fontSize="11px" fontWeight="700" color="#f87171" letterSpacing="wide">
            ADMIN MOD AKTİF
          </Text>
        </Flex>
      </MotionFlex>

      {/* KPI kartları */}
      <Grid templateColumns="repeat(4,1fr)" gap={4} mb={6}>
        <StatCard label="Toplam Kullanıcı" value={stats.total}     sub={`${stats.active} aktif`}  color="#818cf8" glow="rgba(129,140,248,0.12)" icon="👥"
          onClick={() => { setActiveTab('users'); setStatusFilter('all') }} />
        <StatCard label="Aktif"            value={stats.active}    sub="Sisteme giriş yapabilir"  color="#4ade80" glow="rgba(74,222,128,0.12)"  icon="✅"
          onClick={() => { setActiveTab('users'); setStatusFilter('active') }} />
        <StatCard label="Onay Bekleyen"    value={stats.pending}   sub="Manuel onay gerekiyor"    color="#fbbf24" glow="rgba(251,191,36,0.12)"  icon="⏳"
          onClick={() => { setActiveTab('users'); setStatusFilter('pending') }} />
        <StatCard label="Askıya Alınmış"  value={stats.suspended} sub="Erişim engellenmiş"       color="#f87171" glow="rgba(248,113,113,0.12)" icon="🚫"
          onClick={() => { setActiveTab('users'); setStatusFilter('suspended') }} />
      </Grid>

      {/* Tab navigasyon */}
      <Flex gap={1} mb={5} p={1} borderRadius="xl" bg="rgba(255,255,255,0.03)"
        border="1px solid rgba(255,255,255,0.06)" w="fit-content">
        {tabs.map(tab => (
          <MotionBox
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            cursor="pointer"
            px={4} py={2} borderRadius="lg"
            bg={activeTab === tab.id ? 'rgba(129,140,248,0.15)' : 'transparent'}
            border={activeTab === tab.id ? '1px solid rgba(129,140,248,0.3)' : '1px solid transparent'}
            display="flex" alignItems="center" gap={2}
            whileHover={activeTab !== tab.id ? { bg: 'rgba(255,255,255,0.05)' } as any : {}}
            whileTap={{ scale: 0.97 } as any}
            transition={{ duration: 0.15 } as any}
          >
            <Box color={activeTab === tab.id ? '#a5b4fc' : 'rgba(255,255,255,0.3)'} display="flex">
              {tab.icon}
            </Box>
            <Text fontSize="sm" fontWeight={activeTab === tab.id ? '600' : '400'}
              color={activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)'}>
              {tab.label}
            </Text>
          </MotionBox>
        ))}
      </Flex>

      {/* Tab içeriği */}
      <AnimatePresence mode="wait">

        {/* ── KURUMLAR ── */}
        {activeTab === 'orgs' && <OrgManagementTab />}

        {/* ── KULLANICILAR ── */}
        {activeTab === 'users' && (
          <MotionBox key="users"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.2 } as any}>

            {/* Filtreler */}
            <Flex gap={3} mb={4} align="center">
              <InputGroup flex={1} maxW="340px">
                <InputLeftElement h={8} pl={3} color="rgba(255,255,255,0.3)">
                  <SearchIcon />
                </InputLeftElement>
                <Input h={8} pl={10} fontSize="sm"
                  placeholder="Ad, e-posta, kurum, il..."
                  value={query} onChange={e => setQuery(e.target.value)}
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                  color="white" _placeholder={{ color:'rgba(255,255,255,0.25)' }}
                  _hover={{ borderColor:'rgba(129,140,248,0.4)' }}
                  _focus={{ borderColor:'#818cf8', boxShadow:'0 0 0 3px rgba(129,140,248,0.12)' }}
                  borderRadius="xl" />
              </InputGroup>

              <Select h={8} w="180px" fontSize="sm"
                value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                color="rgba(255,255,255,0.7)" borderRadius="xl"
                _hover={{ borderColor:'rgba(129,140,248,0.4)' }}
                _focus={{ borderColor:'#818cf8', boxShadow:'0 0 0 3px rgba(129,140,248,0.12)' }}
                sx={{ option:{ background:'#0d0e20', color:'white' } }}>
                <option value="all">Tüm Roller</option>
                <option value="NGO_MANAGER">STK Yönetici</option>
                <option value="NGO_STAFF">STK Personel</option>
                <option value="OFFICIAL_MANAGER">Resmi Yönetici</option>
                <option value="OFFICIAL_STAFF">Resmi Personel</option>
                <option value="VOLUNTEER">Gönüllü</option>
                <option value="CITIZEN">Vatandaş</option>
              </Select>

              <Select h={8} w="160px" fontSize="sm"
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                color="rgba(255,255,255,0.7)" borderRadius="xl"
                _hover={{ borderColor:'rgba(129,140,248,0.4)' }}
                _focus={{ borderColor:'#818cf8', boxShadow:'0 0 0 3px rgba(129,140,248,0.12)' }}
                sx={{ option:{ background:'#0d0e20', color:'white' } }}>
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="pending">Onay Bekliyor</option>
                <option value="suspended">Askıda</option>
              </Select>

              <Text fontSize="xs" color="rgba(255,255,255,0.3)" ml="auto">
                {filtered.length} / {users.length} kullanıcı
              </Text>
            </Flex>

            {/* Tablo */}
            <Box borderRadius="2xl" overflow="hidden"
              bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)">

              {/* Başlık */}
              <Box px={4} py={3}
                display="grid" gridTemplateColumns="2fr 2fr 1.4fr 1.1fr 1.1fr 1fr"
                gap={3} bg="rgba(255,255,255,0.03)" borderBottom="1px solid rgba(255,255,255,0.06)">
                {['Ad Soyad / E-posta','Kurum / İl','Rol','Kayıt Tarihi','Durum',''].map((h,i) => (
                  <Text key={i} fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.3)"
                    letterSpacing="widest" textTransform="uppercase">{h}</Text>
                ))}
              </Box>

              {/* Satırlar */}
              {loadingUsers ? (
                <Flex align="center" justify="center" py={12} gap={3}>
                  <Spinner size="sm" color="#818cf8" />
                  <Text fontSize="sm" color="rgba(255,255,255,0.35)">Yükleniyor...</Text>
                </Flex>
              ) : filtered.length === 0 ? (
                <Flex align="center" justify="center" py={12}>
                  <Text fontSize="sm" color="rgba(255,255,255,0.25)">
                    {users.length === 0 ? 'Henüz kullanıcı yok' : 'Kullanıcı bulunamadı'}
                  </Text>
                </Flex>
              ) : (
                filtered.map((u, i) => (
                  <UserRow key={u.id} user={u} idx={i} onAction={handleAction} />
                ))
              )}
            </Box>
          </MotionBox>
        )}

        {/* ── SİSTEM ── */}
        {activeTab === 'system' && (
          <MotionBox key="system"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.2 } as any}>

            <Grid templateColumns="1fr 1fr" gap={6}>

              {/* Servisler */}
              <Box>
                <Text fontSize="11px" fontWeight="700" color="rgba(255,255,255,0.35)"
                  letterSpacing="widest" textTransform="uppercase" mb={3}>Servis Durumu</Text>
                <Stack spacing={2}>
                  <ServiceCard name="FastAPI Backend"      status="up"   uptime="99.98%" detail="Python 3.12 · 0.0.0.0:8000" />
                  <ServiceCard name="PostgreSQL DB"        status="up"   uptime="99.95%" detail="v16.2 · aidep_db" />
                  <ServiceCard name="AFAD Sismik API"      status="up"   uptime="98.71%" detail="v2.3 · polled every 30s" />
                  <ServiceCard name="Harita Servisi"       status="warn" uptime="97.40%" detail="Leaflet tiles · yavaş yanıt" />
                  <ServiceCard name="AI Tahmin Modülü"     status="up"   uptime="99.10%" detail="XGBoost v1.8 · GPU aktif" />
                  <ServiceCard name="Email / SMS Gateway"  status="up"   uptime="99.80%" detail="SMTP + Netgsm" />
                </Stack>
              </Box>

              {/* Env yapılandırması */}
              <Box>
                <Text fontSize="11px" fontWeight="700" color="rgba(255,255,255,0.35)"
                  letterSpacing="widest" textTransform="uppercase" mb={3}>Ortam Değişkenleri (.env)</Text>
                <Stack spacing={1.5}>
                  <EnvRow label="APP_ENV"              value="production" />
                  <EnvRow label="API_BASE_URL"         value="http://localhost:8000/api/v1" />
                  <EnvRow label="ADMIN_EMAIL"          value="admin@aidep.gov.tr" />
                  <EnvRow label="ADMIN_PASSWORD"       value="Aidep@Admin2025!" secret />
                  <EnvRow label="JWT_SECRET"           value="aidep_jwt_super_secret_2025_key" secret />
                  <EnvRow label="DB_URL"               value="postgresql+asyncpg://aidep:***@localhost/aidep_db" secret />
                  <EnvRow label="AFAD_API_KEY"         value="afad_api_key_xxxx_yyyy_zzzz" secret />
                  <EnvRow label="SMTP_PASSWORD"        value="smtp_pass_secure_2025" secret />
                </Stack>

                {/* Platform bilgisi */}
                <Box mt={5}>
                  <Text fontSize="11px" fontWeight="700" color="rgba(255,255,255,0.35)"
                    letterSpacing="widest" textTransform="uppercase" mb={3}>Platform Bilgisi</Text>
                  <Grid templateColumns="1fr 1fr" gap={2}>
                    {[
                      { k:'Versiyon',      v:'v0.1.0' },
                      { k:'Frontend',      v:'React 18 + Vite' },
                      { k:'Backend',       v:'FastAPI + SQLAlchemy' },
                      { k:'Veritabanı',    v:'PostgreSQL 16' },
                      { k:'Dil',           v:'TypeScript + Python' },
                      { k:'Son Derleme',   v:'2025-05-10' },
                    ].map(({ k, v }) => (
                      <Flex key={k} direction="column" px={3} py={2.5} borderRadius="lg"
                        bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.05)">
                        <Text fontSize="9px" color="rgba(255,255,255,0.3)" fontWeight="600"
                          textTransform="uppercase" letterSpacing="wider" mb={0.5}>{k}</Text>
                        <Text fontSize="xs" color="#a5b4fc" fontFamily="mono" fontWeight="600">{v}</Text>
                      </Flex>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </MotionBox>
        )}

        {/* ── LOGLAR ── */}
        {activeTab === 'logs' && (
          <MotionBox key="logs"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.2 } as any}>

            <Box borderRadius="2xl" overflow="hidden"
              bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)">

              {/* Log başlığı */}
              <Flex px={4} py={3} align="center" justify="space-between"
                bg="rgba(255,255,255,0.03)" borderBottom="1px solid rgba(255,255,255,0.06)">
                <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.3)"
                  letterSpacing="widest" textTransform="uppercase">Son Aktivite Logu</Text>
                <Flex align="center" gap={1.5} px={2.5} py={1} borderRadius="full"
                  bg="rgba(74,222,128,0.1)" border="1px solid rgba(74,222,128,0.2)">
                  <MotionBox w={1.5} h={1.5} borderRadius="full" bg="#4ade80"
                    animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.5, repeat:Infinity } as any}/>
                  <Text fontSize="10px" fontWeight="600" color="#4ade80">CANLI</Text>
                </Flex>
              </Flex>

              {/* Log satırları */}
              <Stack spacing={0}>
                {LOGS.map((log, i) => (
                  <MotionBox key={log.id}
                    initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.18, delay: i * 0.05 } as any}
                    px={5} py={3.5}
                    display="flex" alignItems="flex-start" gap={4}
                    bg={i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                    borderBottom="1px solid rgba(255,255,255,0.04)"
                    _hover={{ bg:'rgba(129,140,248,0.05)' }}
                    style={{ transition: 'background 0.15s' }}
                  >
                    {/* Sol çizgi */}
                    <Box w="2px" h="36px" borderRadius="full" bg={log.color} opacity={0.6} flexShrink={0} mt={0.5} />

                    {/* Zaman */}
                    <Text fontSize="11px" color="rgba(255,255,255,0.35)" fontFamily="mono"
                      flexShrink={0} w="55px" mt={0.5}>{log.time}</Text>

                    {/* Tür badge */}
                    <Flex px={2} py={0.5} borderRadius="full"
                      bg={`${log.color}15`} border={`1px solid ${log.color}30`}
                      flexShrink={0} align="center">
                      <Text fontSize="9px" fontWeight="700" color={log.color}
                        textTransform="uppercase" letterSpacing="wider">
                        {log.type === 'user' ? 'KULLANICI' : log.type === 'system' ? 'SİSTEM' :
                          log.type === 'warning' ? 'UYARI' : 'TALEP'}
                      </Text>
                    </Flex>

                    {/* Mesaj */}
                    <Text fontSize="sm" color="rgba(255,255,255,0.65)" lineHeight={1.5}>{log.msg}</Text>
                  </MotionBox>
                ))}
              </Stack>
            </Box>
          </MotionBox>
        )}

      </AnimatePresence>
    </Box>
  )
}
