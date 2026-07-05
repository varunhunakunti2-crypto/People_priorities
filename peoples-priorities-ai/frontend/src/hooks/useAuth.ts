import { useState, useEffect } from 'react';
import { isAuthenticated, getUser, logout, type User } from '../lib/auth';
import { getCurrentUser } from '../lib/api';

interface UseAuthResult {
  /** The locally-cached user object, null while loading or if unauthenticated */
  user: User | null;
  /** True while the initial auth check is still running */
  loading: boolean;
  /** True once both local and server-side checks have passed */
  verified: boolean;
}

/**
 * React hook that protects a page with client-side auth.
 *
 * On mount it:
 *  1. Checks localStorage via isAuthenticated() — if false, redirects immediately.
 *  2. Reads the cached user via getUser() for instant UI rendering.
 *  3. Calls GET /auth/me to verify the token is still valid server-side.
 *     If /auth/me returns 401, the apiFetch interceptor handles logout+redirect.
 *     Any other network error is silently ignored (user stays logged in with cached data).
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Step 1: Quick local check
    if (!isAuthenticated()) {
      window.location.href = '/auth/login';
      return;
    }

    // Step 2: Read cached user for immediate render
    const cachedUser = getUser();
    if (!cachedUser) {
      logout();
      return;
    }
    setUser(cachedUser);
    setLoading(false);

    // Step 3: Verify token server-side (non-blocking, best-effort)
    // 401 responses are already intercepted by apiFetch which calls handle401().
    // Any other error (network, 500, etc.) is silently ignored — user stays logged in.
    getCurrentUser()
      .then((serverUser) => {
        // Refresh cached data with server truth
        setUser({
          name: serverUser.name,
          email: serverUser.email,
          role: serverUser.role,
        });
        setVerified(true);
      })
      .catch(() => {
        // Non-401 errors: don't logout, just skip verification.
        // 401 is already handled by apiFetch before this catch runs.
      });
  }, []);

  return { user, loading, verified };
}
