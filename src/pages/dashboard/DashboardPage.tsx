import { Box, Heading, Text, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { removeToken } from '@/utils/auth'

function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <Box p={8}>
      <Heading color="white">Dashboard</Heading>
      <Text color="gray.400" mt={2}>Hoş geldiniz — bu sayfa geliştirme aşamasındadır.</Text>
      <Button mt={6} colorScheme="red" variant="outline" onClick={handleLogout}>
        Çıkış Yap
      </Button>
    </Box>
  )
}

export default DashboardPage
