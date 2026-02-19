import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

// Define the interface for the data we expect back from OUR Go backend
interface AuthResponse {
  email: string;
  token: string;
  status: string;
}

interface LoginProps {
  onAuthSuccess: (data: AuthResponse) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    // credentialResponse.credential is the ID Token from Google
    if (!credentialResponse.credential) {
      console.error("No credential returned from Google");
      return;
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      if (!res.ok) throw new Error("Backend authentication failed");

      const data: AuthResponse = await res.json();
      onAuthSuccess(data);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px', borderRadius: '8px' }}>
      <h2>Sign in to XpenseOps</h2>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.error('Google Login Failed')}
        />
      </div>
    </div>
  );
}