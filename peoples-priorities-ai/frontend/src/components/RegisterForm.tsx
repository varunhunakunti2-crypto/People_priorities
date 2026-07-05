import React, { useState } from 'react';
import { register } from '../lib/api';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'mp_office' | 'citizen'>('mp_office');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<React.ReactNode | null>(null);

  // Password strength logic
  const getPasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 1;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(password);

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 1:
        return '#E53E3E'; // Red
      case 2:
        return '#DD6B20'; // Amber
      case 3:
      case 4:
        return '#38A169'; // Green
      default:
        return '#E2E8F0'; // Gray
    }
  };

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email) {
      errors.email = 'Email address is required';
    } else if (!email.includes('@')) {
      errors.email = 'Email must be a valid email containing @';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      // POST to /auth/register and automatically log in
      const data = await register(name, email, password, role);

      // Save auth details (writing all formats to remain compatible with all pages)
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify({
        user_id: data.user.userId,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }));
      localStorage.setItem('user_profile', JSON.stringify({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      }));

      // Redirect to home dashboard
      window.location.href = '/';
    } catch (err: any) {
      if (err.message === 'Email already exists') {
        setApiError(
          <span>
            An account with this email already exists.{' '}
            <a href="/auth/login" className="underline font-bold text-[#C3280F] hover:text-[#A0200A] transition-colors ml-1">
              Sign in instead?
            </a>
          </span>
        );
      } else {
        setApiError(err.message || 'An error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[440px] bg-white dark:bg-zinc-900 border border-[#E6E6E6] dark:border-zinc-800 rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] flex flex-col font-sans select-none"
      style={{ padding: '40px', boxSizing: 'border-box' }}
    >
      {/* 1. Logo / App Icon Area */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* Government Building SVG Icon */}
          <svg className="w-6 h-6 text-[#7B61FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-[20px] font-bold text-[#111111] dark:text-zinc-50 leading-tight">
            People's Priorities
          </span>
        </div>
        <span className="text-[13px] text-[#999999] tracking-normal">
          Constituency development intelligence
        </span>
      </div>

      {/* 2. Divider 24px space */}
      <div className="h-6" />

      {/* 3. Heading & Subtext */}
      <div className="flex flex-col text-left">
        <h2 className="text-[24px] font-bold text-[#111111] dark:text-zinc-50 leading-tight" style={{ fontWeight: 700 }}>
          Create your account
        </h2>
        <p className="text-[14px] text-[#666666] dark:text-zinc-400 mt-2">
          Join to access constituency development data
        </p>
      </div>

      {/* Spacing before form */}
      <div className="h-6" />

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full" style={{ boxSizing: 'border-box' }}>
        
        {/* 4. Full Name Input Field */}
        <div className="flex flex-col w-full" style={{ boxSizing: 'border-box' }}>
          <label htmlFor="name" className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-md border ${
              fieldErrors.name ? 'border-[#C3280F]' : 'border-[#E6E6E6] dark:border-zinc-800'
            } bg-white dark:bg-zinc-950 text-sm text-[#111111] dark:text-zinc-200 outline-none focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 transition-all`}
            style={{ padding: '12px 14px', boxSizing: 'border-box' }}
            placeholder="Dr. Rajesh Kumar"
          />
          {fieldErrors.name && (
            <span className="text-xs text-[#C3280F] mt-1.5 font-medium">
              {fieldErrors.name}
            </span>
          )}
        </div>

        {/* 5. Email Input Field */}
        <div className="flex flex-col w-full" style={{ boxSizing: 'border-box' }}>
          <label htmlFor="email" className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Email address
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-md border ${
              fieldErrors.email ? 'border-[#C3280F]' : 'border-[#E6E6E6] dark:border-zinc-800'
            } bg-white dark:bg-zinc-950 text-sm text-[#111111] dark:text-zinc-200 outline-none focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 transition-all`}
            style={{ padding: '12px 14px', boxSizing: 'border-box' }}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <span className="text-xs text-[#C3280F] mt-1.5 font-medium">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* 6. Role Selector Toggle Buttons */}
        <div className="flex flex-col w-full" style={{ boxSizing: 'border-box' }}>
          <label className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            I am a
          </label>
          <div className="flex gap-2 w-full" style={{ boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => setRole('mp_office')}
              className="flex-1 py-3 text-sm font-semibold rounded-md transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: role === 'mp_office' ? '#7B61FF' : '#F5F5F5',
                color: role === 'mp_office' ? '#FFFFFF' : '#666666',
              }}
            >
              MP / Office Staff
            </button>
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className="flex-1 py-3 text-sm font-semibold rounded-md transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: role === 'citizen' ? '#7B61FF' : '#F5F5F5',
                color: role === 'citizen' ? '#FFFFFF' : '#666666',
              }}
            >
              Citizen
            </button>
          </div>
        </div>

        {/* 7. Password Input Field */}
        <div className="flex flex-col w-full relative" style={{ boxSizing: 'border-box' }}>
          <label htmlFor="password" className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Password
          </label>
          <div className="w-full relative" style={{ boxSizing: 'border-box' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-md border ${
                fieldErrors.password ? 'border-[#C3280F]' : 'border-[#E6E6E6] dark:border-zinc-800'
              } bg-white dark:bg-zinc-950 text-sm text-[#111111] dark:text-zinc-200 outline-none focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 transition-all`}
              style={{ padding: '12px 42px 12px 14px', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
            {/* Show/Hide password toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#666666] transition-colors focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.893 7.893L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-[#C3280F] mt-1.5 font-medium">
              {fieldErrors.password}
            </span>
          )}

          {/* Password Strength Indicator Bar */}
          <div className="flex gap-1.5 mt-2.5 w-full">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    strengthScore >= index
                      ? getStrengthColor(strengthScore)
                      : '#E2E8F0',
                }}
              />
            ))}
          </div>
        </div>

        {/* 8. Confirm Password Input Field */}
        <div className="flex flex-col w-full relative" style={{ boxSizing: 'border-box' }}>
          <label htmlFor="confirmPassword" className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Confirm password
          </label>
          <div className="w-full relative" style={{ boxSizing: 'border-box' }}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-md border ${
                fieldErrors.confirmPassword ? 'border-[#C3280F]' : 'border-[#E6E6E6] dark:border-zinc-800'
              } bg-white dark:bg-zinc-950 text-sm text-[#111111] dark:text-zinc-200 outline-none focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 transition-all`}
              style={{ padding: '12px 42px 12px 14px', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
            {/* Show/Hide password toggle */}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#666666] transition-colors focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.893 7.893L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="text-xs text-[#C3280F] mt-1.5 font-medium">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* 9. Create Account Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[8px] bg-[#7B61FF] text-white text-[15px] font-semibold hover:bg-[#6B4EFF] active:bg-[#5C3FFF] active:translate-y-[1px] transition-all duration-150 cursor-pointer select-none flex items-center justify-center gap-2"
          style={{ height: '44px', boxSizing: 'border-box' }}
        >
          {loading ? (
            <>
              {/* Spinner */}
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        {/* Inline API Error Alert */}
        {apiError && (
          <div
            className="w-full text-[#C3280F] bg-[#FFEBE9] border border-[#FFEBE9] rounded-[8px] text-[13px] font-medium leading-normal"
            style={{ padding: '10px 14px', boxSizing: 'border-box' }}
          >
            {apiError}
          </div>
        )}
      </form>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E6E6E6] dark:border-zinc-800" />
        </div>
        <span className="relative bg-white dark:bg-zinc-900 px-3 text-[12px] text-[#999999] uppercase tracking-wider select-none font-mono">
          or
        </span>
      </div>

      {/* 10. Already have an account? Sign in */}
      <div className="text-center w-full">
        <p className="text-[14px] text-[#666666] dark:text-zinc-400">
          Already have an account?{' '}
          <a href="/auth/login" className="text-[#7B61FF] hover:underline font-semibold no-underline ml-1">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
