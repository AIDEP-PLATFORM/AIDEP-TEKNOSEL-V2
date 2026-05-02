import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useToast,
  IconButton,
  Link,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { setToken } from '@/utils/auth'

const MotionBox = motion(Box)
const MotionStack = motion(Stack)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// Arka plandaki hareketli daireler için veri
const orbs = [
  { w: 560, h: 560, bg: '#3730a3', top: '-180px', left: '-140px', dur: 10, delay: 0 },
  { w: 440, h: 440, bg: '#1e40af', bottom: '-150px', right: '-100px', dur: 12, delay: 2 },
  { w: 320, h: 320, bg: '#6d28d9', top: '35%', left: '58%', dur: 9, delay: 1 },
]

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Backend hazır olduğunda buraya gerçek API çağrısı gelecek
    setTimeout(() => {
      if (email && password) {
        setToken('mock-token-aidep-2024')
        navigate('/dashboard')
      } else {
        toast({
          title: 'Hata',
          description: 'E-posta ve şifre alanları zorunludur.',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        })
      }
      setIsLoading(false)
    }, 800)
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      position="relative"
      overflow="hidden"
      bg="#07080f"
    >
      {/* Sabit derin arka plan gradyanı */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        bgGradient="linear(160deg, #0d0f1e 0%, #0a0c1a 50%, #080a14 100%)"
      />

      {/* Hareketli blur orb'lar */}
      {orbs.map((orb, i) => (
        <MotionBox
          key={i}
          position="absolute"
          w={`${orb.w}px`}
          h={`${orb.h}px`}
          borderRadius="full"
          bg={orb.bg}
          opacity={0.28}
          top={orb.top}
          left={orb.left}
          bottom={orb.bottom as any}
          right={orb.right as any}
          filter="blur(70px)"
          zIndex={0}
          animate={{ scale: [1, 1.12, 1], opacity: [0.22, 0.32, 0.22] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay } as any}
        />
      ))}


      {/* İçerik kartı */}
      <MotionBox
        zIndex={1}
        w="full"
        maxW="480px"
        mx={4}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' } as any}
      >
        <MotionStack spacing={7} variants={containerVariants} initial="hidden" animate="visible">

          {/* Logo + Başlık */}
          <MotionStack variants={itemVariants} align="center" spacing={2}>
            <MotionBox
              w={14} h={14}
              borderRadius="xl"
              bgGradient="linear(135deg, red.800, orange.600)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xl"
              boxShadow="0 4px 24px rgba(180,40,40,0.45)"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' } as any}
            >
              🛡️
            </MotionBox>
            <Heading
              fontSize="3xl"
              fontWeight="800"
              letterSpacing="-0.5px"
              bgGradient="linear(to-r, red.300, orange.200)"
              bgClip="text"
            >
              AIDEP
            </Heading>
            <Text color="whiteAlpha.400" fontSize="xs" textAlign="center">
              Yapay Zekâ Destekli Deprem Yönetim Platformu
            </Text>
          </MotionStack>

          {/* Form */}
          <MotionBox
            variants={itemVariants}
            as="form"
            onSubmit={handleLogin}
            bg="rgba(18,18,18,0.9)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="2xl"
            p={7}
            boxShadow="0 8px 48px rgba(0,0,0,0.6)"
            backdropFilter="blur(12px)"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0, left: '8%', right: '8%',
              h: '1px',
              bgGradient: 'linear(to-r, transparent, red.500, orange.400, transparent)',
            }}
          >
            <Stack spacing={5}>

              <Stack spacing={0}>
                <Heading size="sm" color="white" fontWeight="600">Giriş Yap</Heading>
                <Text color="whiteAlpha.400" fontSize="xs" mt={1}>Hesabınıza erişin</Text>
              </Stack>

              {/* Email */}
              <FormControl isRequired>
                <FormLabel
                  color="whiteAlpha.600"
                  fontSize="xs"
                  fontWeight="600"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  mb={1}
                >
                  E-posta
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@afad.gov.tr"
                  bg="rgba(255,255,255,0.05)"
                  border="1.5px solid"
                  borderColor="rgba(255,255,255,0.2)"
                  _hover={{ borderColor: 'rgba(200,60,60,0.8)', bg: 'rgba(255,255,255,0.07)' }}
                  _focus={{
                    borderColor: 'red.400',
                    bg: 'rgba(255,255,255,0.07)',
                    boxShadow: '0 0 0 2px rgba(197,48,48,0.3)',
                  }}
                  color="white"
                  _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
                  borderRadius="lg"
                  h={12}
                  fontSize="sm"
                />
              </FormControl>

              {/* Şifre */}
              <FormControl isRequired>
                <FormLabel
                  color="whiteAlpha.600"
                  fontSize="xs"
                  fontWeight="600"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  mb={1}
                >
                  Şifre
                </FormLabel>
                <Box position="relative" w="full">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    bg="rgba(255,255,255,0.05)"
                    border="1.5px solid"
                    borderColor="rgba(255,255,255,0.2)"
                    _hover={{ borderColor: 'rgba(200,60,60,0.8)', bg: 'rgba(255,255,255,0.07)' }}
                    _focus={{
                      borderColor: 'red.400',
                      bg: 'rgba(255,255,255,0.07)',
                      boxShadow: '0 0 0 2px rgba(197,48,48,0.3)',
                    }}
                    color="white"
                    _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
                    borderRadius="lg"
                    h={12}
                    fontSize="sm"
                    pr={12}
                  />
                  <IconButton
                    aria-label="Şifreyi göster"
                    variant="ghost"
                    size="sm"
                    color="whiteAlpha.400"
                    _hover={{ color: 'white', bg: 'transparent' }}
                    onClick={() => setShowPassword(!showPassword)}
                    icon={<Text fontSize="sm">{showPassword ? '🙈' : '👁️'}</Text>}
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                  />
                </Box>
              </FormControl>

              {/* Buton */}
              <MotionBox
                whileHover={{ scale: 1.02 } as any}
                whileTap={{ scale: 0.97 } as any}
                mt={1}
              >
                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Giriş yapılıyor..."
                  w="full"
                  h={12}
                  bgGradient="linear(to-r, red.700, orange.500)"
                  color="white"
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="wide"
                  borderRadius="lg"
                  border="none"
                  _hover={{
                    bgGradient: 'linear(to-r, red.600, orange.400)',
                    boxShadow: '0 0 24px rgba(200,50,50,0.4)',
                  }}
                  _active={{ bgGradient: 'linear(to-r, red.800, orange.600)' }}
                >
                  Giriş Yap
                </Button>
              </MotionBox>

              {/* Kayıt ol linki */}
              <Text textAlign="center" color="whiteAlpha.400" fontSize="xs">
                Hesabınız yok mu?{' '}
                <Link
                  as={RouterLink}
                  to="/register"
                  color="orange.300"
                  fontWeight="600"
                  _hover={{ color: 'orange.200', textDecoration: 'none' }}
                >
                  Kayıt Ol
                </Link>
              </Text>

            </Stack>
          </MotionBox>

          {/* Alt not */}
          <MotionBox variants={itemVariants} textAlign="center">
            <Text color="whiteAlpha.200" fontSize="xs">
              Yalnızca yetkili STK, AFAD ve UMKE personeli
            </Text>
            <Text color="whiteAlpha.150" fontSize="xs" mt={0.5}>
              v0.1.0 — Selçuk Üniversitesi
            </Text>
          </MotionBox>

        </MotionStack>
      </MotionBox>
    </Flex>
  )
}

export default LoginPage
