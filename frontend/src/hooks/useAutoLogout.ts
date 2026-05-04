import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTokenExpired, removeToken, getToken } from '@/utils/auth'

const CHECK_INTERVAL = 30 * 1000 // her 30 saniyede kontrol et

export function useAutoLogout() {
  const navigate = useNavigate()

  useEffect(() => {
    // Sayfa açılışında hemen kontrol et
    if (getToken() && isTokenExpired()) {
      removeToken()
      navigate('/login')
      return
    }

    // Sonrasında periyodik kontrol
    const interval = setInterval(() => {
      if (getToken() && isTokenExpired()) {
        removeToken()
        navigate('/login')
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [navigate])
}
