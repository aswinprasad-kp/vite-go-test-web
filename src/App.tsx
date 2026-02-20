import { useEffect, useState } from 'react'
import Login from './Login' // Assuming Login.tsx is in the same folder

interface Claim {
  id: string
  amount: number
  description: string
  status: string
  created_at: string
}

// Extend UserProfile for internal state to include the token
interface UserSession {
  email: string
  name: string
  picture: string
  role: string
  token: string
}

interface AuthBackendResponse {
  status: string
  email: string
  role: string
  token: string
}

function App() {
  const [claims, setClaims] = useState<Claim[]>([])
  // Initialize state from localStorage
  const [user, setUser] = useState<UserSession | null>(() => {
    const savedUser = localStorage.getItem('xpense_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // 1. Persist user session to localStorage
  const handleAuthSuccess = (googleData: { email: string; name: string; picture: string }, backendData: AuthBackendResponse) => {
    const sessionData: UserSession = {
      email: googleData.email,
      name: googleData.name,
      picture: googleData.picture,
      role: backendData.role,
      token: backendData.token,
    }
    setUser(sessionData)
    localStorage.setItem('xpense_user', JSON.stringify(sessionData))
  }

  const handleLogout = () => {
    localStorage.removeItem('xpense_user')
    setUser(null)
  }

  // 1. Fetch claims ONLY when we have a user token
  useEffect(() => {
    if (!user) return;

    fetch(`${import.meta.env.VITE_BE_URL}/api/claims`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout(); // Token expired or invalid
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => {
        // Safe check: Backend might return a JSON error object instead of an array
        if (Array.isArray(data)) {
          setClaims(data)
        } else {
          console.error("Backend returned non-array data:", data)
          setClaims([])
        }
      })
      .catch(err => console.error("Failed to fetch backend:", err))
  }, [user])

  // 2. Conditional Rendering
  if (!user) {
    return <Login onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={user.picture} alt={user.name} style={{ width: '40px', borderRadius: '50%' }} />
          <div>
            <h1 style={{ margin: 0 }}>XpenseOps</h1>
            <span style={{ 
              fontSize: '12px', 
              background: user.role === 'admin' ? '#ef4444' : (user.role === 'manager' ? '#3b82f6' : '#10b981'), 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {user.role}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>{user.name}</p>
          <button onClick={handleLogout} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Logout</button>
        </div>
      </header>

      <section>
        <h2 style={{ marginBottom: '20px' }}>{user.role === 'employee' ? 'My Claims' : 'Team Claims Queue'}</h2>
        {!claims || claims.length === 0 ? (
          <p style={{ color: '#666' }}>No claims found. Ready to submit your first expense?</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {claims.map(claim => (
              <div key={claim.id} style={{ 
                border: '1px solid #eee', 
                padding: '15px', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{claim.description || "No description"}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    {new Date(claim.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
                    ${Number(claim.amount).toFixed(2)}
                  </p>
                  <span style={{ 
                    fontSize: '12px', 
                    color: claim.status === 'pending' ? '#f59e0b' : (claim.status === 'approved' ? '#10b981' : '#ef4444'),
                    fontWeight: '600'
                  }}>
                    ● {claim.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default App