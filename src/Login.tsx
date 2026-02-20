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
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/40">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-10 text-center shadow-xl shadow-slate-300/30 backdrop-blur-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--xpense-primary)] to-indigo-600 text-2xl font-bold text-white shadow-lg">
            X
          </div>
        </div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-800">XpenseOps</h1>
        <p className="mb-8 text-sm text-slate-500">Sign in to manage expenses and claims</p>
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
