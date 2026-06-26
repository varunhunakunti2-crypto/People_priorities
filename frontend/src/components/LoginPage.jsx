import React from 'react';
import { AuthProvider } from './AuthProvider';
import EnterpriseLoginUI from './EnterpriseLoginUI';

export const LoginPage = () => {
  return (
    <AuthProvider>
      <EnterpriseLoginUI />
    </AuthProvider>
  );
};

export default LoginPage;
