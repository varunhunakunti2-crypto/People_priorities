import React from 'react';
import { AuthProvider } from './AuthProvider';
import ProtectedView from './ProtectedView';
import ManagerDashboard from './ManagerDashboard';

export const DashboardPage = () => {
  return (
    <AuthProvider>
      <ProtectedView requiredRole="manager">
        <ManagerDashboard />
      </ProtectedView>
    </AuthProvider>
  );
};

export default DashboardPage;
