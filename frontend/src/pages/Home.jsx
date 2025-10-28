import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'

function Home() {
  const { user, isAuthenticated, loading, login } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Welcome to <span className="text-primary">Stotra</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The secure, cloud-based student election platform powered by AWS. 
                Cast your vote with confidence in our transparent and reliable system.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h3 className="font-semibold text-gray-900">Secure</h3>
                  <p className="text-sm text-gray-600">AWS Cognito authentication</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🚀</div>
                  <h3 className="font-semibold text-gray-900">Fast</h3>
                  <p className="text-sm text-gray-600">Real-time results</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💎</div>
                  <h3 className="font-semibold text-gray-900">Reliable</h3>
                  <p className="text-sm text-gray-600">Cloud infrastructure</p>
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                  <div className="mb-4">
                    <span className="text-4xl">🗳️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Stotra
                  </h2>
                  <p className="text-gray-600">
                    Sign in to participate in secure elections
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={login}
                    className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>🔐</span>
                    Sign in with AWS Cognito
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Secure authentication powered by AWS
                    </p>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-500">
                    Powered by AWS Cognito • Secure & Reliable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back to <span className="text-primary">Stotra</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          You're successfully signed in and ready to participate in elections.
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto mb-8">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">👋</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Hello, {user?.email || user?.name}
          </h2>
          <p className="text-gray-600">
            Ready to make your voice heard?
          </p>
        </div>
        
        <div className="space-y-3">
          <Link to="/dashboard" className="btn w-full block">
            Go to Voting Dashboard
          </Link>
          <Link to="/results" className="btn-secondary w-full block">
            View Election Results
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home