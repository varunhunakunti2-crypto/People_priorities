import React from 'react';
import { AuthProvider } from './AuthProvider';
import ProtectedView from './ProtectedView';
import EmployeeLedgerView from './EmployeeLedgerView';

export const LedgerPage = () => {
  return (
    <AuthProvider>
      <ProtectedView requiredRole="employee">
        <EmployeeLedgerView />
      </ProtectedView>
    </AuthProvider>
  );
};

export default LedgerPage;
