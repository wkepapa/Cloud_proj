import { useState, useEffect } from 'react'
import { get } from 'aws-amplify/api'

function Results() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await get({
        apiName: 'ElectionsAPI',
        path: '/results'
      }).response
      const data = await response.body.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Error fetching results:', error)
      // Fallback data for development
      setResults([
        { candidate: 'Alice', votes: 120 },
        { candidate: 'Bob', votes: 98 },
        { candidate: 'Charlie', votes: 77 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = results.reduce((sum, result) => sum + result.votes, 0)

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading results...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-center">Election Results</h2>
      
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="mb-6">
            <p className="text-lg text-gray-600">Total Votes Cast: <span className="font-semibold">{totalVotes}</span></p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidate</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Votes</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Percentage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => b.votes - a.votes)
                  .map((result, index) => {
                    const percentage = totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : 0
                    return (
                      <tr key={result.candidate} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                                Leading
                              </span>
                            )}
                            <span className="font-medium">{result.candidate}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 font-semibold">{result.votes}</td>
                        <td className="text-center py-4 px-4">{percentage}%</td>
                        <td className="py-4 px-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results