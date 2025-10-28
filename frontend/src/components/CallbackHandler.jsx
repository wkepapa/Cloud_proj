import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function CallbackHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    // The AuthProvider will handle the callback automatically
    // This component just shows a loading state during the process
    const timer = setTimeout(() => {
      // If we're still here after 5 seconds, something went wrong
      navigate('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Signing you in...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication
        </p>
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallbackHandler