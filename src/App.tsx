import { useEffect, useState } from 'react'

interface Claim {
  id: number,
  merchant: string,
  amount: number
}

function App() {
  const [claims, setClaims] = useState<Claim[]>([])

  useEffect(() => {
    // 1. Fetch data from YOUR Go Backend
    fetch('http://localhost:8080/api/claims')
      .then(res => res.json())
      .then(data => setClaims(data))
      .catch(err => console.error("Failed to fetch backend:", err))
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>💸 XpenseOps Dashboard</h1>
      {claims.length === 0 ? (
        <p>Loading claims from Go...</p>
      ) : (
        <ul>
          {claims.map((claim: Claim) => (
            <li key={claim.id}>
              {claim.merchant}: ${claim.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App