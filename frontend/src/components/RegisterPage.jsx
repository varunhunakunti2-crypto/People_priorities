import React from 'react';
import { AuthProvider } from './AuthProvider';
import EnterpriseRegisterUI from './EnterpriseRegisterUI';

export const RegisterPage = () => {
  return (
    <AuthProvider>
      <EnterpriseRegisterUI />
    </AuthProvider>
  );
};

export default RegisterPage;
