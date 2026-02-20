/** Session stored in localStorage and used in app (lowerCamelCase). */
export interface UserSession {
  email: string;
  name: string;
  /** Preferred display name (from profile); falls back to name. */
  displayName?: string;
  picture: string;
  role: string;
  token: string;
  /** Phase 2 RBAC: BE = xpense:{route}:list|approve|... ; FE = xpensepanel:{route}:view|admin|... */
  permissions?: string[];
}

/** Backend auth response after Google login (lowerCamelCase). */
export interface AuthBackendResponse {
  status: string;
  email: string;
  role: string;
  token: string;
  displayName?: string;
  avatarUrl?: string;
  permissions?: string[];
}

/** Google profile from decoded ID token. */
export interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
}
