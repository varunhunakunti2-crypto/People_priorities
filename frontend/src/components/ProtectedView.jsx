import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';

export const ProtectedView = ({ children, requiredRole }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (requiredRole) {
        const isAuthorized = role === requiredRole;

        if (!isAuthorized) {
          window.location.href = '/login';
        }
      }
    }
  }, [isLoading, isAuthenticated, role, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#171717] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole) {
    const isAuthorized = role === requiredRole;

    if (!isAuthorized) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedView;
