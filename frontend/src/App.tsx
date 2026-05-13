import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage      from '@/pages/auth/LoginPage'
import RegisterPage   from '@/pages/auth/RegisterPage'
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import RequestsPage       from '@/pages/requests/RequestsPage'
import RequestDetailPage  from '@/pages/requests/RequestDetailPage'
import VolunteersPage from '@/pages/volunteers/VolunteersPage'
import MapPage        from '@/pages/map/MapPage'
import SeismicPage    from '@/pages/seismic/SeismicPage'
import SuperAdminPage    from '@/pages/admin/SuperAdminPage'
import StkDetailPage     from '@/pages/volunteers/StkDetailPage'
import OfficialsPage     from '@/pages/officials/OfficialsPage'
import OfficialDetailPage from '@/pages/officials/OfficialDetailPage'
import ProtectedRoute    from '@/components/common/ProtectedRoute'
import MainLayout        from '@/components/layout/MainLayout'
import PlaceholderPage   from '@/pages/PlaceholderPage'
import ProfilePage       from '@/pages/profile/ProfilePage'
import TeamsPage         from '@/pages/teams/TeamsPage'
import SimulationPage   from '@/pages/simulation/SimulationPage'

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
              <Route path="/requests"      element={<RequestsPage />} />
              <Route path="/requests/:id" element={<RequestDetailPage />} />
              <Route path="/volunteers" element={<VolunteersPage />} />
              <Route path="/map"        element={<MapPage />} />
              <Route path="/seismic"    element={<SeismicPage />} />
              <Route path="/resources"  element={<PlaceholderPage title="Kaynaklar" icon="📦" />} />
              <Route path="/officials"         element={<OfficialsPage />} />
              <Route path="/officials/:id"    element={<OfficialDetailPage />} />
              <Route path="/volunteers/:id"   element={<StkDetailPage />} />
              <Route path="/profile"          element={<ProfilePage />} />
              <Route path="/admin"            element={<SuperAdminPage />} />
              <Route path="/teams"           element={<TeamsPage />} />
              <Route path="/simulation"     element={<SimulationPage />} />
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
