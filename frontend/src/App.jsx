import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Results from './pages/Results'
import CandidateRegistration from './pages/CandidateRegistration'
import AdminDashboard from './pages/AdminDashboard'
import CallbackHandler from './components/CallbackHandler'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<CallbackHandler />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/results" element={<Results />} />
          <Route path="/register-candidate" element={<CandidateRegistration />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App