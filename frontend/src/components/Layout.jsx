import { Link } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                <span>🗳️</span>
                Stotra
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/results" className="text-gray-600 hover:text-gray-900 transition-colors">
                Results
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Dashboard
                  </Link>
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    {user?.email || user?.name}
                  </span>
                  <button
                    onClick={logout}
                    className="btn-secondary"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/" className="btn">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout