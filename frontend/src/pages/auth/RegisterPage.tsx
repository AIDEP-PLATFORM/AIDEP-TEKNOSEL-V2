import {
  Box, Button, Flex, FormControl, FormLabel,
  Heading, Input, Stack, Text, useToast, IconButton, Link, Select, Grid,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import AidepLogo from '@/components/common/AidepLogo'

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
  _hover: { borderColor:'rgba(99,102,241,0.5)', bg:'rgba(255,255,255,0.07)' },
  _focus: { borderColor:'#818cf8', bg:'rgba(255,255,255,0.07)', boxShadow:'0 0 0 3px rgba(99,102,241,0.15)' },
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
  const [fullName, setFullName] = useState('')
  const [tc, setTc]             = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [org, setOrg]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()
  const toast    = useToast()

  /* TC formatla: sadece rakam, max 11 */
  const handleTc = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    setTc(digits)
  }

  /* Telefon formatla: 05XX XXX XX XX */
  const handlePhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 4)  formatted = digits.slice(0,4)  + ' ' + digits.slice(4)
    if (digits.length > 7)  formatted = digits.slice(0,4)  + ' ' + digits.slice(4,7) + ' ' + digits.slice(7)
    if (digits.length > 9)  formatted = digits.slice(0,4)  + ' ' + digits.slice(4,7) + ' ' + digits.slice(7,9) + ' ' + digits.slice(9)
    setPhone(formatted)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    const tcDigits = tc.replace(/\D/g, '')
    if (tcDigits.length !== 11 || tcDigits[0] === '0') {
      toast({ title:'Geçersiz TC Kimlik No', description:'11 haneli olmalı ve 0 ile başlamamalıdır.', status:'error', duration:3000, isClosable:true, position:'top' })
      return
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith('0')) {
      toast({ title:'Geçersiz telefon numarası', description:'05XX XXX XX XX formatında giriniz.', status:'error', duration:3000, isClosable:true, position:'top' })
      return
    }

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

      {/* Arka plan orb'lar */}
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
      <MotionBox zIndex={1} w="full" maxW="500px" mx={4}
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
            as="form" onSubmit={handleRegister}
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="2xl" p={7} backdropFilter="blur(20px)"
            boxShadow="0 8px 48px rgba(0,0,0,0.4)" position="relative"
            _before={{
              content:'""', position:'absolute',
              top:0, left:'10%', right:'10%', h:'1px',
              bgGradient:'linear(to-r, transparent, #6366f1, #7c3aed, transparent)',
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

              {/* TC + Telefon — yan yana */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl isRequired>
                  <FormLabel {...labelStyle}>TC Kimlik No</FormLabel>
                  <Input
                    value={tc}
                    onChange={e => handleTc(e.target.value)}
                    placeholder="12345678901"
                    inputMode="numeric"
                    maxLength={11}
                    {...inputStyle}
                    isInvalid={tc.length > 0 && (tc.length < 11 || tc[0] === '0')}
                  />
                  {tc.length > 0 && tc.length < 11 && (
                    <Text fontSize="10px" color="#f87171" mt={1}>{tc.length}/11 hane</Text>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Telefon</FormLabel>
                  <Input
                    value={phone}
                    onChange={e => handlePhone(e.target.value)}
                    placeholder="0532 123 45 67"
                    inputMode="numeric"
                    {...inputStyle}
                  />
                </FormControl>
              </Grid>

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
                  _hover={{ borderColor:'rgba(99,102,241,0.5)' }}
                  _focus={{ borderColor:'#818cf8', boxShadow:'0 0 0 3px rgba(99,102,241,0.15)' }}
                  color={org ? 'white' : 'rgba(255,255,255,0.2)'} borderRadius="xl" h={12} fontSize="sm"
                  sx={{ option:{ background:'#0f0d1f', color:'white' } }}>
                  <option value="afad">AFAD</option>
                  <option value="umke">UMKE</option>
                  <option value="kizilay">Kızılay</option>
                  <option value="stk">STK</option>
                  <option value="other">Diğer</option>
                </Select>
              </FormControl>

              {/* Şifre + Tekrar — yan yana */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Şifre</FormLabel>
                  <Box position="relative">
                    <Input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" {...inputStyle} pr={10}/>
                    <IconButton aria-label="şifre" variant="ghost" size="sm"
                      color="rgba(255,255,255,0.3)" _hover={{ color:'white', bg:'transparent' }}
                      icon={<EyeIcon open={showPw}/>} onClick={() => setShowPw(!showPw)}
                      position="absolute" right={1} top="50%" transform="translateY(-50%)"/>
                  </Box>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Şifre Tekrar</FormLabel>
                  <Box position="relative">
                    <Input type={showPw ? 'text' : 'password'} value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" {...inputStyle}
                      isInvalid={confirm.length > 0 && confirm !== password}/>
                  </Box>
                  {confirm.length > 0 && confirm !== password && (
                    <Text fontSize="10px" color="#f87171" mt={1}>Şifreler eşleşmiyor</Text>
                  )}
                </FormControl>
              </Grid>

              {/* Buton */}
              <MotionBox whileHover={{ scale:1.02 } as any} whileTap={{ scale:0.97 } as any} mt={1}>
                <Button type="submit" isLoading={loading} loadingText="Kaydediliyor..."
                  w="full" h={12} bg="linear-gradient(135deg,#6366f1,#7c3aed)"
                  color="white" fontWeight="700" fontSize="sm" borderRadius="xl" border="none"
                  _hover={{ opacity:0.9, boxShadow:'0 0 32px rgba(99,102,241,0.5)' }}
                  _active={{ opacity:0.8 }}>
                  Kayıt Ol
                </Button>
              </MotionBox>

              <Text textAlign="center" color="rgba(255,255,255,0.3)" fontSize="xs">
                Zaten hesabınız var mı?{' '}
                <Link as={RouterLink} to="/login" color="#818cf8" fontWeight="600"
                  _hover={{ color:'#a5b4fc', textDecoration:'none' }}>
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
