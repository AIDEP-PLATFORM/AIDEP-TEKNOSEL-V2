import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'

// Placeholder sayfalar
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Korumalı — Sidebar'lı layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/dashboard"  element={<DashboardPage />} />
                <Route path="/requests"   element={<PlaceholderPage title="Talepler" icon="🆘" />} />
                <Route path="/volunteers" element={<PlaceholderPage title="Gönüllüler" icon="👥" />} />
                <Route path="/map"        element={<PlaceholderPage title="Harita" icon="🗺️" />} />
                <Route path="/resources"  element={<PlaceholderPage title="Kaynaklar" icon="📦" />} />
                <Route path="*"           element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
