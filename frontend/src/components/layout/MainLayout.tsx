import { Box, Flex, Text } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import { useAutoLogout } from '@/hooks/useAutoLogout'

const MotionBox = motion(Box)

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Dashboard',    sub: 'Genel durum özeti' },
  '/requests':  { title: 'Talepler',     sub: 'Aktif yardım talepleri' },
  '/volunteers':{ title: 'Gönüllüler',   sub: 'Gönüllü yönetimi' },
  '/map':       { title: 'Harita',       sub: 'Aktif bölge görünümü' },
  '/seismic':   { title: 'Sismik Veriler', sub: 'Son 24 saat aktivite' },
  '/ai':        { title: 'AI Tahminler', sub: 'Yapay zeka öngörüleri' },
  '/resources': { title: 'Kaynaklar',    sub: 'Kaynak yönetimi' },
  '/profile':   { title: 'Profilim',     sub: 'Hesap bilgilerim' },
}

function TopBar({ pathname }: { pathname: string }) {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
    }
    fmt()
    const t = setInterval(fmt, 1000)
    return () => clearInterval(t)
  }, [])

  const page = pageTitles[pathname] ?? { title: 'Panel', sub: '' }

  return (
    <Flex
      h="56px" px={6}
      align="center" justify="space-between"
      borderBottom="1px solid rgba(255,255,255,0.05)"
      bg="rgba(8,9,26,0.85)"
      backdropFilter="blur(16px)"
      position="sticky" top={0} zIndex={50}
      flexShrink={0}
    >
      <Flex align="center" gap={3}>
        <Text color="white" fontWeight="700" fontSize="lg">{page.title}</Text>
        {page.sub && (
          <>
            <Text color="rgba(255,255,255,0.2)" fontSize="lg">—</Text>
            <Text color="rgba(255,255,255,0.4)" fontSize="sm">{page.sub}</Text>
          </>
        )}
      </Flex>
      <Flex align="center" gap={4}>
        <Flex align="center" gap={2} px={3} py={1.5} borderRadius="full"
          bg="rgba(220,38,38,0.15)" border="1px solid rgba(220,38,38,0.3)"
          cursor="pointer">
          <MotionBox w={2} h={2} borderRadius="full" bg="#f87171"
            animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.2, repeat:Infinity } as any}/>
          <Text fontSize="xs" fontWeight="600" color="#f87171">5 Kritik Uyarı</Text>
        </Flex>
        <Text fontSize="sm" fontWeight="600" color="rgba(255,255,255,0.5)" fontFamily="mono">{time}</Text>
      </Flex>
    </Flex>
  )
}

interface Props { children: React.ReactNode }

function MainLayout({ children }: Props) {
  const { pathname } = useLocation()
  useAutoLogout()

  return (
    <Box minH="100vh" position="relative" bg="#08091a" overflow="hidden">

      {/* Animasyonlu arka plan orb'lar — mor/indigo palette */}
      <MotionBox position="fixed" w="1000px" h="1000px" borderRadius="full" bg="#2d1b69"
        opacity={0.22} top="-350px" right="-200px" filter="blur(130px)" zIndex={0}
        animate={{ scale:[1,1.08,1], opacity:[0.22,0.32,0.22] }}
        transition={{ duration:14, repeat:Infinity, ease:'easeInOut' } as any}/>
      <MotionBox position="fixed" w="700px" h="700px" borderRadius="full" bg="#4c1d95"
        opacity={0.18} bottom="-200px" left="150px" filter="blur(110px)" zIndex={0}
        animate={{ scale:[1,1.12,1], opacity:[0.18,0.26,0.18] }}
        transition={{ duration:17, repeat:Infinity, ease:'easeInOut', delay:2 } as any}/>
      <MotionBox position="fixed" w="600px" h="600px" borderRadius="full" bg="#1e3a8a"
        opacity={0.14} top="35%" right="8%" filter="blur(100px)" zIndex={0}
        animate={{ scale:[1,1.15,1], opacity:[0.14,0.2,0.14] }}
        transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:4 } as any}/>
      <MotionBox position="fixed" w="500px" h="500px" borderRadius="full" bg="#5b21b6"
        opacity={0.12} bottom="5%" right="25%" filter="blur(90px)" zIndex={0}
        animate={{ scale:[1,1.1,1], opacity:[0.12,0.18,0.12] }}
        transition={{ duration:13, repeat:Infinity, ease:'easeInOut', delay:1 } as any}/>
      <MotionBox position="fixed" w="400px" h="400px" borderRadius="full" bg="#312e81"
        opacity={0.15} top="55%" left="25%" filter="blur(80px)" zIndex={0}
        animate={{ scale:[1,1.18,1], opacity:[0.15,0.22,0.15] }}
        transition={{ duration:9, repeat:Infinity, ease:'easeInOut', delay:3 } as any}/>

      <Sidebar />

      {/* İçerik alanı */}
      <Box ml="220px" minH="100vh" display="flex" flexDirection="column" position="relative" zIndex={1}>
        <TopBar pathname={pathname} />

        <AnimatePresence mode="wait">
          <MotionBox
            key={pathname} flex={1}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' } as any}
          >
            {children}
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  )
}

export default MainLayout
