import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { axiosInstance } from './core-utils/axiosInstance';
import type { AuthBackendResponse, GoogleProfile, UserSession } from './types/auth';

interface LoginProps {
  onAuthSuccess: (session: UserSession) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const decoded = jwtDecode<GoogleProfile>(credentialResponse.credential);
      const { data } = await axiosInstance.post<AuthBackendResponse>('/api/auth/google', {
        token: credentialResponse.credential,
      });
      if (!data.token) throw new Error('No token in response');
      onAuthSuccess({
        email: decoded.email ?? data.email,
        uid: data.uid,
        name: decoded.name ?? '',
        displayName: data.displayName ?? decoded.name ?? '',
        picture: data.avatarUrl ?? decoded.picture ?? '',
        role: data.role,
        token: data.token,
      });
    } catch (err) {
      console.error('Login Error:', err);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--xpense-bg)]">
      <div className="w-full max-w-md rounded-lg border p-10 text-center shadow-sm [background:var(--xpense-bg-card)] [border-color:var(--xpense-border)]">
        <h2 className="mb-6 text-xl font-semibold [color:var(--xpense-text)]">Sign in to XpenseOps</h2>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Google Login Failed')}
          />
        </div>
      </div>
    </div>
  );
}
