import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import EnterpriseLoginUI from './EnterpriseLoginUI';
import EnterpriseRegisterUI from './EnterpriseRegisterUI';
import { EmployeeLedgerView } from './EmployeeLedgerView';
import { ManagerDashboard } from './ManagerDashboard';

const MainAppContent = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register'

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#171717] border-t-transparent"></div>
      </div>
    );
  }

  // 2. Authenticated Console (Ledger / Dashboard)
  if (isAuthenticated) {
    if (role === 'manager') {
      return <ManagerDashboard />;
    }
    return <EmployeeLedgerView />;
  }

  // 3. Guest - Login View
  if (view === 'login') {
    return (
      <EnterpriseLoginUI
        onSuccess={() => setView('landing')}
        onBackToHome={() => setView('landing')}
        onSwitchToRegister={() => setView('register')}
      />
    );
  }

  // 4. Guest - Register View
  if (view === 'register') {
    return (
      <EnterpriseRegisterUI
        onSuccess={() => setView('landing')}
        onBackToHome={() => setView('landing')}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  // 5. Guest - Landing/Home View
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#171717] selection:bg-[#171717] selection:text-white flex flex-col justify-between">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#ebebeb] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#171717] text-white font-mono font-bold text-sm">
              EP
            </div>
            <span className="font-bold text-lg text-[#171717] tracking-tight">ExpensePro</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('login')}
              className="text-sm font-semibold text-[#4d4d4d] hover:text-[#171717] transition cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => setView('register')}
              className="rounded-lg bg-[#171717] px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 transition shadow-sm cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-wider">
              <span>Introducing ExpensePro 2.0</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#171717] max-w-4xl mx-auto leading-[1.1] font-sans">
              Enterprise Expense Management,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-[#888888] max-w-2xl mx-auto font-normal">
              Automated claims submission, real-time department budgets, and instant manager approvals in a single, high-fidelity developer experience.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setView('register')}
                className="w-full sm:w-auto rounded-full bg-[#171717] px-8 py-3.5 text-base font-semibold text-white hover:bg-black/90 transition shadow-md flex items-center justify-center gap-2 hover:scale-105 transform duration-200 cursor-pointer"
              >
                Get Started Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setView('login')}
                className="w-full sm:w-auto rounded-full bg-white border border-[#ebebeb] px-8 py-3.5 text-base font-semibold text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] transition hover:scale-105 transform duration-200 cursor-pointer"
              >
                Request Demo
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 border-t border-[#ebebeb] bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-[#171717]">
                Built for Fast-Moving Teams
              </h2>
              <p className="text-base text-[#888888]">
                Everything you need to keep corporate spending audits streamlined and cost-efficient.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-[#fafafa] rounded-2xl border border-[#ebebeb] p-8 space-y-4 hover:shadow-md transition duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#171717]">Instant Claims Submit</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Employees can submit travel, software, hardware, and meals claims directly from their personal ledger.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-[#fafafa] rounded-2xl border border-[#ebebeb] p-8 space-y-4 hover:shadow-md transition duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#171717]">Real-time Budget Audit</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Managers track monthly budget utilization ratios (safe, warning, critical) and get automated 90%+ warning alerts.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-[#fafafa] rounded-2xl border border-[#ebebeb] p-8 space-y-4 hover:shadow-md transition duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#171717]">One-Click Approvals</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Approve or reject employee claims instantly from the dashboard. Budget calculations automatically adjust.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#ebebeb] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[#888888] text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#171717] text-white font-mono font-bold text-xs">
              EP
            </div>
            <span className="font-bold text-[#171717]">ExpensePro</span>
          </div>
          <p>© {new Date().getFullYear()} ExpensePro, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export const IndexPage = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default IndexPage;
