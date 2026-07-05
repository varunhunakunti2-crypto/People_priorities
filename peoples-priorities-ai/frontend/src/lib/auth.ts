/**
 * HACKATHON DEMO ONLY: Client-side authentication helpers using localStorage.
 * Do not use in production.
 */

export interface User {
  name: string;
  email: string;
  role: string;
}

/**
 * Checks if the user has a non-empty auth_token in localStorage.
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('auth_token');
  return !!token && token.length > 0;
}


/**
 * Parses the stored user object from localStorage.
 * Checks both "auth_user" and "user_profile" keys for compatibility.
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user_profile') || localStorage.getItem('auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Clears all auth-related localStorage keys and redirects to /auth/login.
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user_profile');
  window.location.href = '/auth/login';
}
