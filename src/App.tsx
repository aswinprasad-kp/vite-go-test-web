import { useEffect, useState } from 'react'

// No more DB_URL constant needed here. 
// The proxy handles the routing based on the environment.

interface Claim {
  id: number,
  merchant: string,
  amount: number
}

function App() {
  const [claims, setClaims] = useState<Claim[]>([])

  useEffect(() => {
    // We use a relative path. Vite (local) or Vercel (prod) 
    // will intercept this and forward it to the correct backend.
    fetch('/api/claims')
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => setClaims(data))
      .catch(err => console.error("Failed to fetch backend:", err))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>💸 XpenseOps Dashboard</h1>
      <hr />
      {claims.length === 0 ? (
        <p>Wait a moment... waking up the backend on Render...</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <h3>Recent Claims</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {claims.map((claim: Claim) => (
              <li key={claim.id} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span><strong>{claim.merchant}</strong></span>
                <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                  ${claim.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App