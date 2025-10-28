import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'

function Dashboard() {
  const { user, isAuthenticated, getAccessToken } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCandidates()
      checkVoteStatus()
    }
  }, [isAuthenticated])

  const fetchCandidates = async () => {
    try {
      // For now, use static data since we don't have the API set up yet
      // In production, this would call your Lambda API
      setCandidates([
        { id: '1', name: 'Alice', description: 'Experienced leader with a vision for change' },
        { id: '2', name: 'Bob', description: 'Fresh perspective and innovative ideas' },
        { id: '3', name: 'Charlie', description: 'Innovation focused with proven track record' }
      ])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkVoteStatus = async () => {
    try {
      // Check localStorage for vote status (temporary solution)
      const voted = localStorage.getItem('hasVoted')
      setHasVoted(voted === 'true')
    } catch (error) {
      console.error('Error checking vote status:', error)
    }
  }

  const handleVote = async (candidateId) => {
    if (hasVoted || voting) return

    setVoting(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Store vote in localStorage (temporary solution)
      localStorage.setItem('hasVoted', 'true')
      localStorage.setItem('votedFor', candidateId)
      
      setHasVoted(true)
      alert('Vote cast successfully!')
    } catch (error) {
      console.error('Error casting vote:', error)
      alert('Error casting vote. Please try again.')
    } finally {
      setVoting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-6">Please sign in to access the voting dashboard</p>
        <a href="/" className="btn">
          Go to Sign In
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading candidates...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Hello, {user?.email || user?.name} 👋
        </h2>
        <h3 className="text-xl text-gray-600">Cast Your Vote</h3>
      </div>

      {hasVoted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <span>✅</span>
          <span>You have already voted in this election. Thank you for participating!</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="candidate-card">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="text-xl font-semibold text-center">{candidate.name}</h4>
            </div>
            
            {candidate.description && (
              <p className="text-gray-600 mb-6 text-center">{candidate.description}</p>
            )}
            
            <button
              onClick={() => handleVote(candidate.id)}
              disabled={hasVoted || voting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                hasVoted || voting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-secondary hover:transform hover:scale-105'
              }`}
            >
              {voting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Voting...
                </span>
              ) : hasVoted ? (
                <span className="flex items-center justify-center gap-2">
                  <span>✅</span>
                  Voted
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🗳️</span>
                  Vote for {candidate.name}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {!hasVoted && (
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-blue-800">
              <span>ℹ️</span>
              <span className="font-medium">Voting Instructions</span>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              You can vote for one candidate only. Your vote is secure and anonymous.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard