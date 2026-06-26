import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';

export const IndexRedirector = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (role === 'manager') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/ledger';
      }
    }
  }, [isLoading, isAuthenticated, role]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#fafafa]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#171717] border-t-transparent"></div>
    </div>
  );
};

export default IndexRedirector;
