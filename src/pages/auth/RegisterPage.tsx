import {
  Box, Button, Flex, FormControl, FormLabel,
  Heading, Input, Stack, Text, useToast, IconButton, Link, Select,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

const MotionBox = motion(Box)
const MotionStack = motion(Stack)

const itemVariants = {
  hidden:  { opacity:0, y:20 },
  visible: { opacity:1, y:0, transition:{ duration:0.4, ease:'easeOut' } },
}
const containerVariants = {
  hidden:  { opacity:0 },
  visible: { opacity:1, transition:{ staggerChildren:0.08, delayChildren:0.15 } },
}

const EyeIcon = ({ open }: { open:boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    }
  </svg>
)

const inputStyle = {
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  _hover: { borderColor:'rgba(249,115,22,0.5)', bg:'rgba(255,255,255,0.07)' },
  _focus: { borderColor:'#f97316', bg:'rgba(255,255,255,0.07)', boxShadow:'0 0 0 3px rgba(249,115,22,0.15)' },
  color: 'white',
  _placeholder: { color:'rgba(255,255,255,0.2)' },
  borderRadius: 'xl',
  h: 12,
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

function RegisterPage() {
  const [fullName, setFullName]           = useState('')
  const [email, setEmail]                 = useState('')
  const [org, setOrg]                     = useState('')
  const [password, setPassword]           = useState('')
  const [confirm, setConfirm]             = useState('')
  const [showPw, setShowPw]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const navigate = useNavigate()
  const toast    = useToast()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title:'Şifreler eşleşmiyor', status:'error', duration:3000, isClosable:true, position:'top' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      toast({ title:'Kayıt başarılı', description:'Giriş yapabilirsiniz.', status:'success', duration:3000, isClosable:true, position:'top' })
      navigate('/login')
      setLoading(false)
    }, 800)
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08091a" position="relative" overflow="hidden" py={8}>

      {/* Arka plan orb'lar — indigo/mor palette */}
      <MotionBox position="absolute" w="700px" h="700px" borderRadius="full" bg="#2d1b69"
        opacity={0.25} top="-200px" right="-150px" filter="blur(120px)" zIndex={0}
        animate={{ scale:[1,1.1,1], opacity:[0.25,0.35,0.25] }}
        transition={{ duration:14, repeat:Infinity, ease:'easeInOut' } as any}/>
      <MotionBox position="absolute" w="500px" h="500px" borderRadius="full" bg="#4c1d95"
        opacity={0.2} bottom="-150px" left="-80px" filter="blur(100px)" zIndex={0}
        animate={{ scale:[1,1.12,1] }}
        transition={{ duration:17, repeat:Infinity, ease:'easeInOut', delay:2 } as any}/>
      <MotionBox position="absolute" w="350px" h="350px" borderRadius="full" bg="#1e3a8a"
        opacity={0.15} top="30%" left="3%" filter="blur(80px)" zIndex={0}
        animate={{ scale:[1,1.15,1] }}
        transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:4 } as any}/>
      <Box position="absolute" inset={0} zIndex={0} opacity={0.03}
        backgroundImage="linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)"
        backgroundSize="60px 60px"/>

      {/* Kart */}
      <MotionBox zIndex={1} w="full" maxW="460px" mx={4}
        initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:'easeOut' } as any}>
        <MotionStack spacing={7} variants={containerVariants} initial="hidden" animate="visible">

          {/* Logo */}
          <MotionStack variants={itemVariants} align="center" spacing={3}>
            <MotionBox w={16} h={16} borderRadius="2xl"
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
            as="form" onSubmit={handleRegister}
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="2xl" p={7} backdropFilter="blur(20px)"
            boxShadow="0 8px 48px rgba(0,0,0,0.4)" position="relative"
            _before={{
              content:'""', position:'absolute',
              top:0, left:'10%', right:'10%', h:'1px',
              bgGradient:'linear(to-r, transparent, #ea580c, #dc2626, transparent)',
            }}>
            <Stack spacing={4}>
              <Box>
                <Heading size="sm" color="white" fontWeight="700">Kayıt Ol</Heading>
                <Text color="rgba(255,255,255,0.35)" fontSize="xs" mt={1}>Yeni hesap oluşturun</Text>
              </Box>

              {/* Ad Soyad */}
              <FormControl isRequired>
                <FormLabel {...labelStyle}>Ad Soyad</FormLabel>
                <Input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz" {...inputStyle}/>
              </FormControl>

              {/* Email */}
              <FormControl isRequired>
                <FormLabel {...labelStyle}>E-posta</FormLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@afad.gov.tr" {...inputStyle}/>
              </FormControl>

              {/* Kurum */}
              <FormControl isRequired>
                <FormLabel {...labelStyle}>Kurum</FormLabel>
                <Select value={org} onChange={e => setOrg(e.target.value)}
                  placeholder="Kurum seçin"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ borderColor:'rgba(249,115,22,0.5)' }}
                  _focus={{ borderColor:'#f97316', boxShadow:'0 0 0 3px rgba(249,115,22,0.15)' }}
                  color={org ? 'white' : 'rgba(255,255,255,0.2)'} borderRadius="xl" h={12} fontSize="sm"
                  sx={{ option:{ background:'#0f1729', color:'white' } }}>
                  <option value="afad">AFAD</option>
                  <option value="umke">UMKE</option>
                  <option value="kizilay">Kızılay</option>
                  <option value="stk">STK</option>
                  <option value="other">Diğer</option>
                </Select>
              </FormControl>

              {/* Şifre */}
              <FormControl isRequired>
                <FormLabel {...labelStyle}>Şifre</FormLabel>
                <Box position="relative">
                  <Input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" {...inputStyle} pr={12}/>
                  <IconButton aria-label="şifre" variant="ghost" size="sm"
                    color="rgba(255,255,255,0.3)" _hover={{ color:'white', bg:'transparent' }}
                    icon={<EyeIcon open={showPw}/>} onClick={() => setShowPw(!showPw)}
                    position="absolute" right={2} top="50%" transform="translateY(-50%)"/>
                </Box>
              </FormControl>

              {/* Şifre tekrar */}
              <FormControl isRequired>
                <FormLabel {...labelStyle}>Şifre Tekrar</FormLabel>
                <Input type={showPw ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" {...inputStyle}/>
              </FormControl>

              {/* Buton */}
              <MotionBox whileHover={{ scale:1.02 } as any} whileTap={{ scale:0.97 } as any} mt={1}>
                <Button type="submit" isLoading={loading} loadingText="Kaydediliyor..."
                  w="full" h={12} bg="linear-gradient(135deg,#dc2626,#ea580c)"
                  color="white" fontWeight="700" fontSize="sm" borderRadius="xl" border="none"
                  _hover={{ opacity:0.9, boxShadow:'0 0 32px rgba(220,38,38,0.5)' }}
                  _active={{ opacity:0.8 }}>
                  Kayıt Ol
                </Button>
              </MotionBox>

              <Text textAlign="center" color="rgba(255,255,255,0.3)" fontSize="xs">
                Zaten hesabınız var mı?{' '}
                <Link as={RouterLink} to="/login" color="#f97316" fontWeight="600"
                  _hover={{ color:'#fb923c', textDecoration:'none' }}>
                  Giriş Yap
                </Link>
              </Text>
            </Stack>
          </MotionBox>

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

export default RegisterPage
