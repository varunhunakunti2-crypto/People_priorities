import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export const EnterpriseRegisterUI = ({ onSuccess, onBackToHome, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('sales');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName || !department || !role) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await register(email, password, fullName, department, role);
      const user = response.user;
      
      if (onSuccess) {
        onSuccess(user);
      } else {
        // Redirect based on role
        if (user.role === 'manager') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/ledger';
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Failed to create account';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl border border-[#ebebeb] shadow-sm relative">
        
        {/* Back Button */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#171717] transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#171717] text-white font-mono text-xl font-bold">
            EP
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#171717]">
            Create Account
          </h2>
          <p className="mt-1.5 text-sm text-[#888888]">
            Register as a new user inside ExpensePro
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-[#f7d4d6] p-3 text-sm text-[#c50000] border border-[#ffb3b7] flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="full-name" className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] placeholder-[#888888] focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] placeholder-[#888888] focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50"
                placeholder="jane.doe@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] placeholder-[#888888] focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] bg-white focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50"
                >
                  <option value="sales">Sales</option>
                  <option value="engineering">Engineering</option>
                  <option value="hr">HR</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] bg-white focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-lg bg-[#171717] px-4 py-3 text-sm font-semibold text-white hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 disabled:opacity-70 transition cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-[#ebebeb]">
          <p className="text-sm text-[#888888]">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin || (() => window.location.href = '/login')}
              className="font-semibold text-[#171717] hover:underline bg-transparent border-0 p-0 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseRegisterUI;
