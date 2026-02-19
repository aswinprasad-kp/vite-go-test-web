import { useEffect, useState } from 'react'
import Login from './login' // Assuming Login.tsx is in the same folder

interface Claim {
  id: number,
  merchant: string,
  amount: number
}

interface UserProfile {
  email: string;
  token: string;
}

function App() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)

  // 1. Fetch claims ONLY when we have a user token
  useEffect(() => {
    if (!user) return;

    fetch('/api/claims', {
      headers: {
        // Send the token we got from our Go backend
        'Authorization': `Bearer ${user.token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          setUser(null); // Token expired or invalid
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => setClaims(data))
      .catch(err => console.error("Failed to fetch backend:", err))
  }, [user]) // Re-run when user logs in

  // 2. Conditional Rendering
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Login onAuthSuccess={(userData: UserProfile) => setUser(userData)} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💸 XpenseOps Dashboard</h1>
        <button onClick={() => setUser(null)} style={{ height: '30px' }}>Logout</button>
      </div>
      <p>Welcome, <strong>{user.email}</strong></p>
      <hr />
      
      {claims.length === 0 ? (
        <p>No claims found or loading...</p>
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