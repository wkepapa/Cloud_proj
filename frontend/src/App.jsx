import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Results from './pages/Results'
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
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App