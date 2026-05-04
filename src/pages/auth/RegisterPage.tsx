import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  IconButton,
  Link,
  Select,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

const MotionBox = motion(Box)
const MotionStack = motion(Stack)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirm) {
      toast({
        title: 'Şifreler eşleşmiyor',
        description: 'Lütfen şifrenizi kontrol edin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    setIsLoading(true)
    // TODO: Backend hazır olduğunda buraya gerçek API çağrısı gelecek
    setTimeout(() => {
      toast({
        title: 'Kayıt başarılı',
        description: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      navigate('/login')
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
      py={8}
    >
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        bgGradient="linear(160deg, #0d0f1e 0%, #0a0c1a 50%, #080a14 100%)"
      />
      <MotionBox
        position="absolute"
        w="560px" h="560px"
        borderRadius="full"
        bg="#3730a3"
        opacity={0.22}
        top="-180px" right="-120px"
        filter="blur(90px)"
        zIndex={0}
        animate={{ scale: [1, 1.12, 1], opacity: [0.22, 0.32, 0.22] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' } as any}
      />
      <MotionBox
        position="absolute"
        w="440px" h="440px"
        borderRadius="full"
        bg="#1e40af"
        opacity={0.2}
        bottom="-150px" left="-100px"
        filter="blur(90px)"
        zIndex={0}
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 } as any}
      />
      <MotionBox
        position="absolute"
        w="320px" h="320px"
        borderRadius="full"
        bg="#6d28d9"
        opacity={0.18}
        top="40%" left="55%"
        filter="blur(80px)"
        zIndex={0}
        animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.26, 0.18] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 } as any}
      />

      {/* Kart */}
      <MotionBox
        zIndex={1}
        w="full"
        maxW="480px"
        mx={4}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' } as any}
      >
        <MotionStack
          spacing={7}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Logo + Başlık */}
          <MotionStack variants={itemVariants} align="center" spacing={2}>
            <Box
              w={14} h={14}
              borderRadius="xl"
              bgGradient="linear(135deg, red.800, orange.600)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xl"
              boxShadow="0 4px 20px rgba(200,50,50,0.3)"
            >
              🛡️
            </Box>
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
            onSubmit={handleRegister}
            bg="#111111"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="2xl"
            p={7}
            boxShadow="0 8px 40px rgba(0,0,0,0.5)"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0, left: '10%', right: '10%',
              h: '1px',
              bgGradient: 'linear(to-r, transparent, red.600, orange.400, transparent)',
            }}
          >
            <Stack spacing={4}>

              <Stack spacing={0}>
                <Heading size="sm" color="white" fontWeight="600">Kayıt Ol</Heading>
                <Text color="whiteAlpha.400" fontSize="xs" mt={1}>Yeni hesap oluşturun</Text>
              </Stack>

              {/* Ad Soyad */}
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
                  Ad Soyad
                </FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  bg="rgba(255,255,255,0.05)"
                  border="1.5px solid"
                  borderColor="rgba(255,255,255,0.2)"
                  _hover={{ borderColor: 'rgba(200,60,60,0.8)', bg: 'rgba(255,255,255,0.07)' }}
                  _focus={{ borderColor: 'red.400', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 2px rgba(197,48,48,0.3)' }}
                  color="white"
                  _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
                  borderRadius="lg"
                  h={12}
                  fontSize="sm"
                />
              </FormControl>

              {/* Email */}
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
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
                  _focus={{ borderColor: 'red.400', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 2px rgba(197,48,48,0.3)' }}
                  color="white"
                  _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
                  borderRadius="lg"
                  h={12}
                  fontSize="sm"
                />
              </FormControl>

              {/* Kurum */}
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
                  Kurum
                </FormLabel>
                <Select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  bg="rgba(255,255,255,0.05)"
                  border="1.5px solid"
                  borderColor="rgba(255,255,255,0.2)"
                  _hover={{ borderColor: 'rgba(200,60,60,0.8)', bg: 'rgba(255,255,255,0.07)' }}
                  _focus={{ borderColor: 'red.400', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 2px rgba(197,48,48,0.3)' }}
                  color={organization ? 'white' : 'whiteAlpha.200'}
                  borderRadius="lg"
                  h={12}
                  fontSize="sm"
                  placeholder="Kurum seçin"
                  sx={{ option: { background: '#1a1a1a', color: 'white' } }}
                >
                  <option value="afad">AFAD</option>
                  <option value="umke">UMKE</option>
                  <option value="kizilay">Kızılay</option>
                  <option value="stk">STK</option>
                  <option value="other">Diğer</option>
                </Select>
              </FormControl>

              {/* Şifre */}
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
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
                    _focus={{ borderColor: 'red.400', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 2px rgba(197,48,48,0.3)' }}
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

              {/* Şifre tekrar */}
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.500" fontSize="xs" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
                  Şifre Tekrar
                </FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  bg="rgba(255,255,255,0.05)"
                  border="1.5px solid"
                  borderColor="rgba(255,255,255,0.2)"
                  _hover={{ borderColor: 'rgba(200,60,60,0.8)', bg: 'rgba(255,255,255,0.07)' }}
                  _focus={{ borderColor: 'red.400', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 2px rgba(197,48,48,0.3)' }}
                  color="white"
                  _placeholder={{ color: 'rgba(255,255,255,0.25)' }}
                  borderRadius="lg"
                  h={12}
                  fontSize="sm"
                />
              </FormControl>

              {/* Kayıt butonu */}
              <MotionBox
                whileHover={{ scale: 1.015 } as any}
                whileTap={{ scale: 0.985 } as any}
                mt={1}
              >
                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Kaydediliyor..."
                  w="full"
                  h={12}
                  bgGradient="linear(to-r, red.700, orange.600)"
                  color="white"
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="lg"
                  border="none"
                  _hover={{ bgGradient: 'linear(to-r, red.600, orange.500)', boxShadow: '0 0 20px rgba(200,50,50,0.3)' }}
                  _active={{ bgGradient: 'linear(to-r, red.800, orange.700)' }}
                >
                  Kayıt Ol
                </Button>
              </MotionBox>

              {/* Giriş yap linki */}
              <Text textAlign="center" color="whiteAlpha.400" fontSize="xs">
                Zaten hesabınız var mı?{' '}
                <Link
                  as={RouterLink}
                  to="/login"
                  color="orange.300"
                  fontWeight="600"
                  _hover={{ color: 'orange.200', textDecoration: 'none' }}
                >
                  Giriş Yap
                </Link>
              </Text>

            </Stack>
          </MotionBox>

          {/* Alt not */}
          <MotionBox variants={itemVariants} textAlign="center">
            <Text color="whiteAlpha.200" fontSize="xs">
              Yalnızca yetkili STK, AFAD ve UMKE personeli
            </Text>
          </MotionBox>

        </MotionStack>
      </MotionBox>
    </Flex>
  )
}

export default RegisterPage
