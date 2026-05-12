import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { removeToken, getRole } from '@/utils/auth'
import AidepLogo from '@/components/common/AidepLogo'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

const Icons = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  requests:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  volunteers:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  map:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  seismic:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  ai:        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  resources: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  logout:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  shield:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

const mainNav = [
  { label: 'Dashboard',        icon: Icons.dashboard,  path: '/dashboard', badge: null },
  { label: 'Talepler',         icon: Icons.requests,   path: '/requests',  badge: 24   },
  { label: 'STK Yetkililer',   icon: Icons.volunteers, path: '/volunteers', badge: null },
  { label: 'Resmi Yetkililer', icon: Icons.resources,  path: '/officials',  badge: null },
  { label: 'Harita',           icon: Icons.map,        path: '/map',       badge: null },
]
const analysisNav = [
  { label: 'Sismik Veriler', icon: Icons.seismic, path: '/seismic', badge: null },
  { label: 'AI Tahminler',   icon: Icons.ai,      path: '/ai',      badge: null },
]

const roleLabel: Record<string, { label: string; color: string }> = {
  ADMIN:            { label: 'Süper Admin',     color: '#f87171' },
  NGO_MANAGER:      { label: 'STK Yöneticisi',  color: '#34d399' },
  NGO_STAFF:        { label: 'STK Görevlisi',   color: '#4ade80' },
  OFFICIAL_MANAGER: { label: 'Resmi Yönetici',  color: '#60a5fa' },
  OFFICIAL_STAFF:   { label: 'Resmi Görevli',   color: '#93c5fd' },
  VOLUNTEER:        { label: 'Gönüllü',         color: '#fbbf24' },
  CITIZEN:          { label: 'Vatandaş',        color: '#94a3b8' },
  NGO:              { label: 'STK/NGO',         color: '#34d399' },
}

function NavItem({ item, isActive, onClick }: { item: typeof mainNav[0]; isActive: boolean; onClick: () => void }) {
  return (
    <MotionBox
      onClick={onClick}
      cursor="pointer"
      borderRadius="xl"
      px={3} py={2.5}
      display="flex" alignItems="center" gap={3}
      position="relative"
      bg={isActive ? 'rgba(129,140,248,0.12)' : 'transparent'}
      whileHover={{ backgroundColor: 'rgba(129,140,248,0.08)' } as any}
      whileTap={{ scale: 0.97 } as any}
      transition={{ duration: 0.15 } as any}
    >
      {isActive && (
        <Box position="absolute" left={0} top="18%" h="64%" w="3px" borderRadius="full"
          bg="linear-gradient(to bottom, #818cf8, #6366f1)" />
      )}
      <Box color={isActive ? '#a5b4fc' : 'rgba(255,255,255,0.35)'} display="flex" flexShrink={0} transition="color 0.2s">
        {item.icon}
      </Box>
      <Text flex={1} fontSize="sm" fontWeight={isActive ? '600' : '400'}
        color={isActive ? 'white' : 'rgba(255,255,255,0.45)'} transition="color 0.2s">
        {item.label}
      </Text>
      {item.badge && (
        <Box px={1.5} py={0.5} borderRadius="full" bg="rgba(239,68,68,0.9)" minW="20px" textAlign="center">
          <Text fontSize="10px" fontWeight="700" color="white">{item.badge}</Text>
        </Box>
      )}
    </MotionBox>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const role = getRole()
  const roleInfo = (role && roleLabel[role]) ? roleLabel[role] : { label: 'Yetkili', color: '#818cf8' }

  return (
    <MotionFlex
      direction="column" h="100vh" w="220px"
      bg="rgba(7,8,22,0.98)"
      borderRight="1px solid rgba(129,140,248,0.08)"
      position="fixed" left={0} top={0}
      overflow="hidden" py={5} px={3} zIndex={100}
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' } as any}
    >
      {/* Dekoratif orb'lar — indigo/mor */}
      <MotionBox position="absolute" w="280px" h="280px" borderRadius="full" bg="#4f46e5"
        opacity={0.07} top="-100px" left="-80px" filter="blur(70px)" zIndex={0}
        animate={{ scale: [1,1.2,1], opacity:[0.07,0.12,0.07] }}
        transition={{ duration:9, repeat:Infinity, ease:'easeInOut' } as any}/>
      <MotionBox position="absolute" w="220px" h="220px" borderRadius="full" bg="#7c3aed"
        opacity={0.06} bottom="100px" left="-50px" filter="blur(60px)" zIndex={0}
        animate={{ scale: [1,1.15,1], opacity:[0.06,0.1,0.06] }}
        transition={{ duration:12, repeat:Infinity, ease:'easeInOut', delay:2 } as any}/>

      {/* Logo */}
      <Box px={2} mb={6} cursor="pointer" onClick={() => navigate('/dashboard')} position="relative" zIndex={1}>
        <AidepLogo size={36} variant="sidebar" showText={true} />
      </Box>

      {/* Nav */}
      <Stack spacing={0} flex={1} position="relative" zIndex={1} overflowY="auto" overflowX="hidden"
        css={{ '&::-webkit-scrollbar': { display: 'none' }, '&': { scrollbarWidth: 'none' } }}>

        <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.22)"
          letterSpacing="widest" textTransform="uppercase" px={3} mb={1}>
          Ana Menü
        </Text>
        <Stack spacing={0.5} mb={4}>
          {mainNav.map(item => (
            <NavItem key={item.path} item={item} isActive={pathname === item.path} onClick={() => navigate(item.path)} />
          ))}
        </Stack>

        <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.22)"
          letterSpacing="widest" textTransform="uppercase" px={3} mb={1}>
          Analiz
        </Text>
        <Stack spacing={0.5} mb={role === 'ADMIN' ? 4 : 0}>
          {analysisNav.map(item => (
            <NavItem key={item.path} item={item} isActive={pathname === item.path} onClick={() => navigate(item.path)} />
          ))}
        </Stack>

        {role === 'ADMIN' && (
          <>
            <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.22)"
              letterSpacing="widest" textTransform="uppercase" px={3} mb={1} mt={2}>
              Yönetim
            </Text>
            <Stack spacing={0.5}>
              <NavItem
                item={{ label: 'Süper Admin', icon: Icons.shield, path: '/admin', badge: null }}
                isActive={pathname === '/admin'}
                onClick={() => navigate('/admin')}
              />
            </Stack>
          </>
        )}
      </Stack>

      {/* Kullanıcı kartı */}
      <Box position="relative" zIndex={1} mt={3}>
        <Box h="1px" bg="rgba(129,140,248,0.1)" mb={3} />
        <Flex align="center" gap={3} px={2} py={2} borderRadius="xl"
          bg="rgba(99,102,241,0.06)" border="1px solid rgba(129,140,248,0.12)"
          cursor="pointer" onClick={() => navigate('/profile')}
          _hover={{ bg: 'rgba(99,102,241,0.1)' }} transition="background 0.2s">
          <Flex w={9} h={9} borderRadius="lg" bg={`${roleInfo.color}20`}
            border={`1px solid ${roleInfo.color}40`}
            align="center" justify="center" flexShrink={0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={roleInfo.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </Flex>
          <Box flex={1} overflow="hidden">
            <Text fontSize="xs" color="white" fontWeight="600" isTruncated>Yetkili Kullanıcı</Text>
            <Flex align="center" gap={1.5}>
              <MotionBox w={1.5} h={1.5} borderRadius="full" bg="#4ade80"
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity } as any}/>
              <Text fontSize="10px" color={roleInfo.color} fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                {roleInfo.label}
              </Text>
            </Flex>
          </Box>
          <Box color="rgba(255,255,255,0.25)" cursor="pointer"
            onClick={e => { e.stopPropagation(); removeToken(); navigate('/login') }}
            _hover={{ color: '#f87171' }} transition="color 0.2s" p={1}>
            {Icons.logout}
          </Box>
        </Flex>
      </Box>
    </MotionFlex>
  )
}

export default Sidebar
