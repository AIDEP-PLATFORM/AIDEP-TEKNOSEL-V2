import {
  Box, Button, Flex, FormControl, FormLabel, FormErrorMessage,
  Heading, Input, InputGroup, InputRightElement,
  Stack, Text, Link,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { setToken, setRole, setUser } from '@/utils/auth'
import AidepLogo from '@/components/common/AidepLogo'
import { apiLogin, extractErrorMessage } from '@/services/authService'

const MotionBox = motion(Box)
const MotionStack = motion(Stack)

const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}
const containerVariants = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    }
  </svg>
)

// ── Inline hata kutusu ─────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <MotionBox
          key="error"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' } as any}
        >
          <Flex
            align="center" gap={2.5}
            px={4} py={3} borderRadius="xl"
            bg="rgba(239,68,68,0.08)"
            border="1px solid rgba(239,68,68,0.28)"
            boxShadow="0 0 20px rgba(239,68,68,0.08)"
          >
            {/* Uyarı ikonu */}
            <Box color="#f87171" flexShrink={0}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8"  x2="12"   y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </Box>
            <Text fontSize="xs" color="#fca5a5" fontWeight="500" lineHeight="1.4">
              {message}
            </Text>
          </Flex>
        </MotionBox>
      )}
    </AnimatePresence>
  )
}

function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [emailError, setEmailError] = useState('')
  const navigate = useNavigate()

  // E-posta formatını kontrol et
  const validateEmail = (val: string) => {
    if (!val) return 'E-posta zorunludur'
    if (!val.includes('@')) return `"${val.split('@')[0]}" adresinde "@" eksik`
    if (!/\S+@\S+\.\S+/.test(val)) return 'Geçerli bir e-posta adresi girin'
    return ''
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')          // her denemede temizle
    setLoading(true)
    try {
      const res = await apiLogin({ email, password, platform: 'web' })
      setToken(res.access_token)
      setRole(res.user.role)
      setUser(res.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(extractErrorMessage(err))   // ← hata string'i state'e yaz
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08091a" position="relative" overflow="hidden">

      {/* Arka plan orb'lar */}
      <MotionBox position="absolute" w="800px" h="800px" borderRadius="full" bg="#2d1b69"
        opacity={0.25} top="-300px" right="-200px" filter="blur(130px)" zIndex={0}
        animate={{ scale:[1,1.1,1], opacity:[0.25,0.35,0.25] }}
        transition={{ duration:14, repeat:Infinity, ease:'easeInOut' } as any}/>
      <MotionBox position="absolute" w="600px" h="600px" borderRadius="full" bg="#4c1d95"
        opacity={0.2} bottom="-200px" left="-100px" filter="blur(110px)" zIndex={0}
        animate={{ scale:[1,1.12,1], opacity:[0.2,0.28,0.2] }}
        transition={{ duration:17, repeat:Infinity, ease:'easeInOut', delay:2 } as any}/>
      <MotionBox position="absolute" w="400px" h="400px" borderRadius="full" bg="#1e3a8a"
        opacity={0.15} top="50%" left="5%" filter="blur(90px)" zIndex={0}
        animate={{ scale:[1,1.15,1] }}
        transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:4 } as any}/>
      <MotionBox position="absolute" w="350px" h="350px" borderRadius="full" bg="#5b21b6"
        opacity={0.12} bottom="10%" right="8%" filter="blur(80px)" zIndex={0}
        animate={{ scale:[1,1.1,1] }}
        transition={{ duration:13, repeat:Infinity, ease:'easeInOut', delay:1 } as any}/>

      <Box position="absolute" inset={0} zIndex={0} opacity={0.03}
        backgroundImage="linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)"
        backgroundSize="60px 60px"/>

      {/* Kart */}
      <MotionBox zIndex={1} w="full" maxW="440px" mx={4}
        initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:'easeOut' } as any}>
        <MotionStack spacing={7} variants={containerVariants} initial="hidden" animate="visible">

          {/* Logo */}
          <MotionStack variants={itemVariants} align="center" spacing={3}>
            <MotionBox animate={{ y:[0,-6,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' } as any}>
              <AidepLogo size={80} variant="auth" showText={true} />
            </MotionBox>
            <Text color="rgba(255,255,255,0.35)" fontSize="xs" mt={1}>
              Yapay Zekâ Destekli Deprem Yönetim Platformu
            </Text>
          </MotionStack>

          {/* Form */}
          <MotionBox variants={itemVariants}
            as="form" onSubmit={handleLogin}
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="2xl" p={7}
            backdropFilter="blur(20px)"
            boxShadow="0 8px 48px rgba(0,0,0,0.4)"
            position="relative"
            _before={{
              content:'""', position:'absolute',
              top:0, left:'10%', right:'10%', h:'1px',
              bgGradient:'linear(to-r, transparent, #ea580c, #dc2626, transparent)',
            }}>
            <Stack spacing={5}>

              <Box>
                <Heading size="sm" color="white" fontWeight="700">Giriş Yap</Heading>
                <Text color="rgba(255,255,255,0.35)" fontSize="xs" mt={1}>Hesabınıza erişin</Text>
              </Box>

              {/* ── Hata kutusu — e-posta/şifre yanlışsa burada gösterilir ── */}
              <ErrorBox message={error} />

              {/* E-posta */}
              <FormControl isRequired isInvalid={!!emailError}>
                <FormLabel fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                  letterSpacing="widest" textTransform="uppercase" mb={1.5}>
                  E-posta
                </FormLabel>
                <Input
                  type="email" value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setError('')
                    if (emailError) setEmailError('') // yazınca hatayı temizle
                  }}
                  onBlur={e => setEmailError(validateEmail(e.target.value))} // odak ayrılınca kontrol
                  placeholder="ornek@afad.gov.tr"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                  _focus={{ borderColor:'#f97316', bg:'rgba(255,255,255,0.06)', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
                  _invalid={{ borderColor:'#f87171', boxShadow:'0 0 0 3px rgba(248,113,113,0.12)' }}
                  color="white" _placeholder={{ color:'rgba(255,255,255,0.2)' }}
                  borderRadius="xl" h={10} fontSize="sm"/>
                <FormErrorMessage fontSize="xs" color="#f87171" mt={1.5} gap={1.5}>
                  {/* küçük uyarı ikonu */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {emailError}
                </FormErrorMessage>
              </FormControl>

              {/* Şifre */}
              <FormControl isRequired>
                <FormLabel fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                  letterSpacing="widest" textTransform="uppercase" mb={1.5}>
                  Şifre
                </FormLabel>
                <InputGroup>
                  <Input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ borderColor:'rgba(249,115,22,0.45)' }}
                    _focus={{ borderColor:'#f97316', bg:'rgba(255,255,255,0.06)', boxShadow:'0 0 0 3px rgba(249,115,22,0.12)' }}
                    color="white" _placeholder={{ color:'rgba(255,255,255,0.2)' }}
                    borderRadius="xl" h={10} fontSize="sm"/>
                  <InputRightElement h="100%" pr={1}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setShowPw(v => !v)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:6,
                        color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center' }}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Giriş butonu */}
              <MotionBox whileHover={{ scale:1.02 } as any} whileTap={{ scale:0.97 } as any} mt={1}>
                <Button type="submit" isLoading={loading} loadingText="Giriş yapılıyor..."
                  w="full" h={10}
                  bg="linear-gradient(135deg,#dc2626,#ea580c)"
                  color="white" fontWeight="700" fontSize="sm" borderRadius="xl" border="none"
                  _hover={{ opacity:0.9, boxShadow:'0 0 32px rgba(220,38,38,0.5)' }}
                  _active={{ opacity:0.8 }}>
                  Giriş Yap
                </Button>
              </MotionBox>

              <Text textAlign="center" color="rgba(255,255,255,0.3)" fontSize="xs">
                Hesabınız yok mu?{' '}
                <Link as={RouterLink} to="/register" color="#f97316" fontWeight="600"
                  _hover={{ color:'#fb923c', textDecoration:'none' }}>
                  Kayıt Ol
                </Link>
              </Text>
            </Stack>
          </MotionBox>

          {/* Alt not */}
          <MotionBox variants={itemVariants} textAlign="center">
            <Text color="rgba(255,255,255,0.15)" fontSize="xs">
              Yalnızca yetkili STK, AFAD ve UMKE personeli · v0.1.0
            </Text>
          </MotionBox>

        </MotionStack>
      </MotionBox>
    </Flex>
  )
}

export default LoginPage
