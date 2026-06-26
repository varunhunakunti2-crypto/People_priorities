import React from 'react';
import { AuthProvider } from './AuthProvider';
import IndexRedirector from './IndexRedirector';

export const IndexPage = () => {
  return (
    <AuthProvider>
      <IndexRedirector />
    </AuthProvider>
  );
};

export default IndexPage;
