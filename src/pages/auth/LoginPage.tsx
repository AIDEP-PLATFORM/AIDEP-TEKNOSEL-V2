import {
  Box, Button, Flex, FormControl, FormLabel,
  Heading, Input, Stack, Text, useToast, IconButton, Link,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { setToken, setRole } from '@/utils/auth'

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

function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const navigate = useNavigate()
  const toast    = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (email && password) {
        setToken('mock-token-aidep-2024')
        setRole('admin')
        navigate('/dashboard')
      } else {
        toast({ title:'Hata', description:'Tüm alanları doldurun.', status:'error', duration:3000, isClosable:true, position:'top' })
      }
      setLoading(false)
    }, 800)
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08091a" position="relative" overflow="hidden">

      {/* Animasyonlu arka plan orb'lar — indigo/mor palette */}
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

      {/* İnce grid dokusu */}
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
            <MotionBox
              w={16} h={16} borderRadius="2xl"
              bg="linear-gradient(135deg,#dc2626,#ea580c)"
              display="flex" alignItems="center" justifyContent="center"
              boxShadow="0 0 40px rgba(220,38,38,0.4)"
              animate={{ y:[0,-6,0] }}
              transition={{ duration:4, repeat:Infinity, ease:'easeInOut' } as any}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </MotionBox>
            <Box textAlign="center">
              <Heading fontSize="3xl" fontWeight="800" color="white" letterSpacing="-0.5px">AIDEP</Heading>
              <Text color="rgba(255,255,255,0.35)" fontSize="xs" mt={0.5}>Yapay Zekâ Destekli Deprem Yönetim Platformu</Text>
            </Box>
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

              {/* Email */}
              <FormControl isRequired>
                <FormLabel fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                  letterSpacing="widest" textTransform="uppercase" mb={1.5}>
                  E-posta
                </FormLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@afad.gov.tr"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ borderColor:'rgba(249,115,22,0.5)', bg:'rgba(255,255,255,0.07)' }}
                  _focus={{ borderColor:'#f97316', bg:'rgba(255,255,255,0.07)', boxShadow:'0 0 0 3px rgba(249,115,22,0.15)' }}
                  color="white" _placeholder={{ color:'rgba(255,255,255,0.2)' }}
                  borderRadius="xl" h={12} fontSize="sm"/>
              </FormControl>

              {/* Şifre */}
              <FormControl isRequired>
                <FormLabel fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.4)"
                  letterSpacing="widest" textTransform="uppercase" mb={1.5}>
                  Şifre
                </FormLabel>
                <Box position="relative">
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                    _hover={{ borderColor:'rgba(249,115,22,0.5)', bg:'rgba(255,255,255,0.07)' }}
                    _focus={{ borderColor:'#f97316', bg:'rgba(255,255,255,0.07)', boxShadow:'0 0 0 3px rgba(249,115,22,0.15)' }}
                    color="white" _placeholder={{ color:'rgba(255,255,255,0.2)' }}
                    borderRadius="xl" h={12} fontSize="sm" pr={12}/>
                  <IconButton aria-label="şifre göster" variant="ghost" size="sm"
                    color="rgba(255,255,255,0.3)" _hover={{ color:'white', bg:'transparent' }}
                    icon={<EyeIcon open={showPw}/>}
                    onClick={() => setShowPw(!showPw)}
                    position="absolute" right={2} top="50%" transform="translateY(-50%)"/>
                </Box>
              </FormControl>

              {/* Giriş butonu */}
              <MotionBox whileHover={{ scale:1.02 } as any} whileTap={{ scale:0.97 } as any} mt={1}>
                <Button type="submit" isLoading={loading} loadingText="Giriş yapılıyor..."
                  w="full" h={12}
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
