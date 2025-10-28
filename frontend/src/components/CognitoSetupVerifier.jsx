import { useState } from 'react'
import COGNITO_CONFIG from '../config/cognito.js'

function CognitoSetupVerifier() {
  const [showDetails, setShowDetails] = useState(false)

  const currentOrigin = window.location.origin
  const redirectUri = COGNITO_CONFIG.getRedirectUri()
  const logoutUri = COGNITO_CONFIG.getLogoutUri()

  // Check if current origin matches allowed callback URLs
  const isCallbackAllowed = currentOrigin.includes('localhost:3000') || 
                           currentOrigin.includes('localhost:8080') ||
                           currentOrigin.includes('cloudfront.net')

  const isLogoutAllowed = currentOrigin.includes('localhost:8080') ||
                         currentOrigin.includes('cloudfront.net')

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">🔧</span>
          <span className="font-medium text-blue-800">Cognito Configuration</span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Current Configuration</h4>
              <div className="space-y-1 text-blue-700">
                <div><strong>Client ID:</strong> {COGNITO_CONFIG.CLIENT_ID}</div>
                <div><strong>User Pool:</strong> {COGNITO_CONFIG.USER_POOL_ID}</div>
                <div><strong>Current Origin:</strong> {currentOrigin}</div>
                <div><strong>Redirect URI:</strong> {redirectUri}</div>
                <div><strong>Logout URI:</strong> {logoutUri}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">Status Checks</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={isCallbackAllowed ? 'text-green-600' : 'text-red-600'}>
                    {isCallbackAllowed ? '✅' : '❌'}
                  </span>
                  <span className="text-blue-700">Callback URL allowed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={isLogoutAllowed ? 'text-green-600' : 'text-red-600'}>
                    {isLogoutAllowed ? '✅' : '❌'}
                  </span>
                  <span className="text-blue-700">Logout URL allowed</span>
                </div>
              </div>
            </div>
          </div>

          {(!isCallbackAllowed || !isLogoutAllowed) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-yellow-800">
                  <strong>Action Required:</strong>
                  <p className="mt-1">
                    Add <code className="bg-yellow-100 px-1 rounded">{currentOrigin}/callback</code> to your Cognito app client's allowed callback URLs.
                  </p>
                  <p className="mt-1">
                    Add <code className="bg-yellow-100 px-1 rounded">{currentOrigin}</code> to your allowed sign-out URLs.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-4">
            <h5 className="font-medium text-gray-800 mb-2">Expected URLs in AWS Console:</h5>
            <div className="text-gray-700 text-xs space-y-1">
              <div><strong>Callback URLs:</strong></div>
              <div>• http://localhost:8080/callback</div>
              <div>• http://localhost:3000/callback</div>
              <div>• https://d84lty8p4kdlc.cloudfront.net/callback</div>
              <div className="mt-2"><strong>Sign-out URLs:</strong></div>
              <div>• http://localhost:8080</div>
              <div>• https://d84lty8p4kdlc.cloudfront.net</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CognitoSetupVerifier