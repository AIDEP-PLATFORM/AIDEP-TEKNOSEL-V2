import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage     from '@/pages/auth/LoginPage'
import RegisterPage  from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import RequestsPage  from '@/pages/requests/RequestsPage'
import VolunteersPage from '@/pages/volunteers/VolunteersPage'
import MapPage       from '@/pages/map/MapPage'
import SeismicPage   from '@/pages/seismic/SeismicPage'
import AiPage        from '@/pages/ai/AiPage'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MainLayout    from '@/components/layout/MainLayout'
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Korumalı — Sidebar'lı layout */}
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout>
            <Routes>
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/requests"   element={<RequestsPage />} />
              <Route path="/volunteers" element={<VolunteersPage />} />
              <Route path="/map"        element={<MapPage />} />
              <Route path="/seismic"    element={<SeismicPage />} />
              <Route path="/ai"         element={<AiPage />} />
              <Route path="/resources"  element={<PlaceholderPage title="Kaynaklar" icon="📦" />} />
              <Route path="*"           element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
