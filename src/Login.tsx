import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleData {
  email: string;
  name: string;
  picture: string;
}

interface AuthBackendResponse {
  status: string;
  email: string;
  role: string;
  token: string;
}

interface LoginProps {
  onAuthSuccess: (googleData: GoogleData, backendData: AuthBackendResponse) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      // 1. Decode Google ID Token for profile info (name, picture)
      const decoded = jwtDecode<GoogleData>(credentialResponse.credential);

      // 2. Authenticate with OUR backend
      const res = await fetch(`${import.meta.env.VITE_BE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      if (!res.ok) throw new Error("Backend authentication failed");

      const backendData = await res.json() as AuthBackendResponse;
      
      // 3. Pass both to parent
      onAuthSuccess(decoded, backendData);
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