import { useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import apiService from '../services/api'

function CandidateRegistration() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    description: '',
    platform: '',
    experience: '',
    studentId: '',
    phone: '',
    documents: []
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiService.registerCandidate(formData)
      setSubmitted(true)
      console.log('Registration successful:', response)
    } catch (error) {
      setError(error.message || 'Failed to submit registration')
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-6">Please sign in to register as a candidate</p>
        <a href="/" className="btn">
          Go to Sign In
        </a>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Registration Submitted!
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800 mb-4">
            Your candidate registration has been submitted successfully and is now under review.
          </p>
          <div className="text-sm text-green-700">
            <p><strong>What happens next:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Our election committee will review your application</li>
              <li>You'll be notified via email about the approval status</li>
              <li>Once approved, you'll appear on the candidate list</li>
              <li>The review process typically takes 2-3 business days</li>
            </ul>
          </div>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                name: '',
                email: user?.email || '',
                description: '',
                platform: '',
                experience: '',
                studentId: '',
                phone: '',
                documents: []
              })
            }}
            className="btn-secondary"
          >
            Submit Another Application
          </button>
          <a href="/dashboard" className="btn">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Candidate Registration
        </h1>
        <p className="text-xl text-gray-600">
          Register to run for student elections
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="text-blue-800">
            <h3 className="font-semibold mb-2">Registration Requirements</h3>
            <ul className="text-sm space-y-1">
              <li>• Must be a current student with valid student ID</li>
              <li>• All information will be verified by the election committee</li>
              <li>• Applications are reviewed within 2-3 business days</li>
              <li>• Only approved candidates will appear on the ballot</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className="font-semibold">Registration Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <span>👤</span>
            Personal Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="your.email@university.edu"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Email from your account</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="STU123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="+1-555-0123"
              />
            </div>
          </div>
        </div>

        {/* Campaign Information */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <span>🗳️</span>
            Campaign Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Brief description about yourself and your qualifications (max 200 words)"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be displayed to voters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Platform *
              </label>
              <textarea
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Describe your campaign platform, goals, and what you plan to achieve if elected (max 500 words)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Detail your vision and specific plans
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Experience
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Previous leadership roles, student organization involvement, relevant experience"
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <span>📋</span>
            Terms and Conditions
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">By submitting this registration, you agree to:</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• Provide accurate and truthful information</li>
              <li>• Follow all election rules and guidelines</li>
              <li>• Maintain professional conduct throughout the campaign</li>
              <li>• Accept the election committee's decision on your application</li>
              <li>• Respect the democratic process and election results</li>
            </ul>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the terms and conditions, and I confirm that all information provided is accurate and complete.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className={`btn text-lg px-8 py-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting Registration...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>📝</span>
                Submit Candidate Registration
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CandidateRegistration