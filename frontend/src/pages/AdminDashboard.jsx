import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import apiService from '../services/api'

function AdminDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [pendingCandidates, setPendingCandidates] = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingCandidates()
      fetchAllCandidates()
    }
  }, [isAuthenticated])

  const fetchPendingCandidates = async () => {
    try {
      const response = await apiService.getPendingCandidates()
      setPendingCandidates(response.pendingCandidates || [])
    } catch (error) {
      console.error('Error fetching pending candidates:', error)
    }
  }

  const fetchAllCandidates = async () => {
    try {
      const response = await apiService.getAllCandidates()
      setAllCandidates(response.candidates || [])
    } catch (error) {
      console.error('Error fetching all candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (candidateId, candidateName) => {
    if (!confirm(`Approve candidate: ${candidateName}?`)) return

    setProcessing(prev => ({ ...prev, [candidateId]: 'approving' }))
    
    try {
      await apiService.approveCandidate(candidateId, user?.sub || user?.email, 'Approved by admin')
      alert(`${candidateName} has been approved!`)
      
      // Refresh the lists
      await fetchPendingCandidates()
      await fetchAllCandidates()
    } catch (error) {
      console.error('Error approving candidate:', error)
      alert(`Error approving candidate: ${error.message}`)
    } finally {
      setProcessing(prev => ({ ...prev, [candidateId]: null }))
    }
  }

  const handleReject = async (candidateId, candidateName) => {
    const reason = prompt(`Reason for rejecting ${candidateName}:`)
    if (!reason) return

    setProcessing(prev => ({ ...prev, [candidateId]: 'rejecting' }))
    
    try {
      await apiService.rejectCandidate(candidateId, user?.sub || user?.email, reason)
      alert(`${candidateName} has been rejected.`)
      
      // Refresh the lists
      await fetchPendingCandidates()
      await fetchAllCandidates()
    } catch (error) {
      console.error('Error rejecting candidate:', error)
      alert(`Error rejecting candidate: ${error.message}`)
    } finally {
      setProcessing(prev => ({ ...prev, [candidateId]: null }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-semibold mb-4">Admin Access Required</h2>
        <p className="text-gray-600 mb-6">Please sign in with admin credentials</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    )
  }

  const approvedCount = allCandidates.filter(c => c.status === 'approved').length
  const rejectedCount = allCandidates.filter(c => c.status === 'rejected').length

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard 👨‍💼</h2>
        <p className="text-gray-600">Manage candidate registrations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-800">{pendingCandidates.length}</div>
          <div className="text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-800">{approvedCount}</div>
          <div className="text-green-600">Approved</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-800">{rejectedCount}</div>
          <div className="text-red-600">Rejected</div>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-800">{allCandidates.length}</div>
          <div className="text-blue-600">Total</div>
        </div>
      </div>

      {/* Pending Candidates */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Pending Approvals ({pendingCandidates.length})</h3>
        
        {pendingCandidates.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600">No pending candidates to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCandidates.map((candidate) => (
              <div key={candidate.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold mb-2">{candidate.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Email:</strong> {candidate.email}
                      </div>
                      <div>
                        <strong>Student ID:</strong> {candidate.studentId}
                      </div>
                      <div>
                        <strong>Phone:</strong> {candidate.phone || 'Not provided'}
                      </div>
                      <div>
                        <strong>Experience:</strong> {candidate.experience || 'Not provided'}
                      </div>
                    </div>
                    <div className="mt-3">
                      <strong className="text-sm text-gray-600">Platform:</strong>
                      <p className="mt-1">{candidate.platform}</p>
                    </div>
                    <div className="mt-3">
                      <strong className="text-sm text-gray-600">Description:</strong>
                      <p className="mt-1">{candidate.description}</p>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Registered: {new Date(candidate.registrationDate).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(candidate.id, candidate.name)}
                      disabled={processing[candidate.id]}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing[candidate.id] === 'approving' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(candidate.id, candidate.name)}
                      disabled={processing[candidate.id]}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing[candidate.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Candidates Summary */}
      <div>
        <h3 className="text-2xl font-semibold mb-4">All Candidates ({allCandidates.length})</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {allCandidates.map((candidate, index) => (
                <tr key={candidate.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">{candidate.name}</td>
                  <td className="px-4 py-3">{candidate.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'approved' ? 'bg-green-100 text-green-800' :
                      candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {candidate.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(candidate.registrationDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard