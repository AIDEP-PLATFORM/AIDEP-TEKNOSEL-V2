import { Box, Flex, Stack, Text, Divider } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { removeToken } from '@/utils/auth'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

// SVG ikon bileşenleri
const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  requests: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
    </svg>
  ),
  volunteers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  resources: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
}

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',  icon: Icons.dashboard,  path: '/dashboard' },
  { label: 'Talepler',   icon: Icons.requests,   path: '/requests' },
  { label: 'Gönüllüler', icon: Icons.volunteers, path: '/volunteers' },
  { label: 'Harita',     icon: Icons.map,        path: '/map' },
  { label: 'Kaynaklar',  icon: Icons.resources,  path: '/resources' },
]

function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <MotionFlex
      direction="column"
      justify="space-between"
      h="100vh"
      w="220px"
      bgGradient="linear(160deg, #13103a 0%, #0d0f1e 55%, #0c1128 100%)"
      borderRight="1px solid rgba(255,255,255,0.07)"
      position="relative"
      overflow="hidden"
      py={5}
      px={3}
      position="sticky"
      top={0}
      flexShrink={0}
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' } as any}
    >
      {/* Dekoratif arka plan */}
      <MotionBox
        position="absolute"
        w="320px" h="320px"
        borderRadius="full"
        bg="#4f46e5"
        opacity={0.3}
        top="-100px" left="-100px"
        filter="blur(70px)"
        zIndex={0}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.42, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' } as any}
      />
      <MotionBox
        position="absolute"
        w="260px" h="260px"
        borderRadius="full"
        bg="#7c3aed"
        opacity={0.25}
        bottom="40px" left="-80px"
        filter="blur(65px)"
        zIndex={0}
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.36, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 } as any}
      />
      <MotionBox
        position="absolute"
        w="200px" h="200px"
        borderRadius="full"
        bg="#1e40af"
        opacity={0.22}
        top="42%" left="-20px"
        filter="blur(55px)"
        zIndex={0}
        animate={{ scale: [1, 1.1, 1], opacity: [0.22, 0.32, 0.22] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } as any}
      />

      {/* Logo */}
      <Stack spacing={6} position="relative" zIndex={1}>
        <Flex align="center" gap={3} px={2} cursor="pointer" onClick={() => navigate('/dashboard')}>
          <Flex
            w={9} h={9}
            borderRadius="lg"
            bgGradient="linear(135deg, #4f46e5, #7c3aed)"
            align="center"
            justify="center"
            color="white"
            flexShrink={0}
            boxShadow="0 0 16px rgba(124,58,237,0.4)"
          >
            {Icons.shield}
          </Flex>
          <Box>
            <Text color="white" fontWeight="700" fontSize="sm" letterSpacing="wide">
              AIDEP
            </Text>
            <Text color="whiteAlpha.400" fontSize="9px" letterSpacing="widest" textTransform="uppercase">
              Yönetim Paneli
            </Text>
          </Box>
        </Flex>

        <Divider borderColor="rgba(255,255,255,0.06)" />

        {/* Nav */}
        <Stack spacing={0.5}>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <MotionBox
                key={item.path}
                onClick={() => navigate(item.path)}
                cursor="pointer"
                borderRadius="lg"
                px={3}
                py={2.5}
                display="flex"
                alignItems="center"
                gap={3}
                position="relative"
                bg={isActive ? 'rgba(99,102,241,0.15)' : 'transparent'}
                whileHover={{ bg: 'rgba(99,102,241,0.1)', x: 2 } as any}
                whileTap={{ scale: 0.98 } as any}
                transition={{ duration: 0.15 } as any}
              >
                {isActive && (
                  <Box
                    position="absolute"
                    left="0px"
                    top="20%"
                    h="60%"
                    w="2.5px"
                    borderRadius="full"
                    bgGradient="linear(to-b, #818cf8, #6366f1)"
                  />
                )}
                <Box
                  color={isActive ? '#818cf8' : 'rgba(255,255,255,0.35)'}
                  display="flex"
                  transition="color 0.2s"
                >
                  {item.icon}
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight={isActive ? '500' : '400'}
                  color={isActive ? 'white' : 'rgba(255,255,255,0.45)'}
                  transition="color 0.2s"
                >
                  {item.label}
                </Text>
              </MotionBox>
            )
          })}
        </Stack>
      </Stack>

      {/* Çıkış */}
      <Stack spacing={2} position="relative" zIndex={1}>
        <Divider borderColor="rgba(255,255,255,0.06)" />
        <MotionBox
          onClick={() => { removeToken(); navigate('/login') }}
          cursor="pointer"
          borderRadius="lg"
          px={3}
          py={2.5}
          display="flex"
          alignItems="center"
          gap={3}
          whileHover={{ bg: 'rgba(239,68,68,0.1)', x: 2 } as any}
          whileTap={{ scale: 0.98 } as any}
          transition={{ duration: 0.15 } as any}
        >
          <Box color="rgba(255,255,255,0.3)" display="flex">
            {Icons.logout}
          </Box>
          <Text fontSize="sm" fontWeight="400" color="rgba(255,255,255,0.35)">
            Çıkış Yap
          </Text>
        </MotionBox>
      </Stack>
    </MotionFlex>
  )
}

export default Sidebar
