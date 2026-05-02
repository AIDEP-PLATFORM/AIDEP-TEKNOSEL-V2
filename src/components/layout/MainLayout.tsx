import { Flex, Box } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const MotionBox = motion(Box)

interface Props {
  children: React.ReactNode
}

function MainLayout({ children }: Props) {
  const { pathname } = useLocation()

  return (
    <Flex minH="100vh" bg="#07080f" position="relative" overflow="hidden">

      {/* Arka plan orb'ları */}
      <MotionBox
        position="absolute"
        w="600px" h="600px"
        borderRadius="full"
        bg="#3730a3"
        opacity={0.12}
        top="-200px" right="10%"
        filter="blur(100px)"
        zIndex={0}
        animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' } as any}
      />
      <MotionBox
        position="absolute"
        w="500px" h="500px"
        borderRadius="full"
        bg="#1e40af"
        opacity={0.1}
        bottom="-150px" right="30%"
        filter="blur(100px)"
        zIndex={0}
        animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.16, 0.1] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 } as any}
      />
      <MotionBox
        position="absolute"
        w="350px" h="350px"
        borderRadius="full"
        bg="#6d28d9"
        opacity={0.09}
        top="40%" right="5%"
        filter="blur(80px)"
        zIndex={0}
        animate={{ scale: [1, 1.08, 1], opacity: [0.09, 0.14, 0.09] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 } as any}
      />

      <Sidebar />

      <AnimatePresence mode="wait">
        <MotionBox
          key={pathname}
          flex={1}
          overflowY="auto"
          position="relative"
          zIndex={1}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' } as any}
        >
          {children}
        </MotionBox>
      </AnimatePresence>
    </Flex>
  )
}

export default MainLayout
