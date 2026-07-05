import React from 'react';
import { logout } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { user } = useAuth();

  if (!user) {
    return <div className="h-[56px] bg-white border-b border-[#E6E6E6] w-full" />;
  }

  // Get initials of user's name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className="site-pad sticky top-0 left-0 right-0 h-[56px] bg-white border-b border-[#E6E6E6] z-[100] flex items-center justify-between select-none font-sans box-border w-full">
      {/* LEFT SIDE: Government building icon + app name + navigation links */}
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2 no-underline">
          <svg className="w-5 h-5 text-[#7B61FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-[16px] font-bold text-[#111111] tracking-tight leading-none">
            People's Priorities
          </span>
        </a>

        {/* Vertical divider */}
        <div className="hidden sm:block w-px h-4 bg-[#E6E6E6]"></div>

        <a 
          href="/budget" 
          className="hidden sm:flex items-center gap-1.5 text-[14px] font-medium text-[#666666] hover:text-[#111111] transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          Budget Simulator
        </a>
      </div>

      {/* RIGHT SIDE: User profile info & sign out */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* User Avatar Circle */}
          <div className="w-[36px] h-[36px] rounded-full bg-[#7B61FF] text-white flex items-center justify-center text-[13px] font-semibold tracking-wide shrink-0">
            {getInitials(user.name)}
          </div>
          
          {/* User Name */}
          <span className="text-[14px] font-medium text-[#111111] hidden sm:inline">
            {user.name}
          </span>

          {/* Role Badge & Submit Button */}
          <div className="flex items-center gap-2">
            {user.role === 'mp_office' ? (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#F0EEFF] text-[#7B61FF] whitespace-nowrap">
                MP Office
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#E6F9F1] text-[#0F7B4A] whitespace-nowrap">
                Citizen
              </span>
            )}
            <a 
              href="/submit" 
              className="px-3 py-1 text-[11px] font-bold rounded-full bg-[#7B61FF] hover:bg-[#684ee3] text-white whitespace-nowrap no-underline cursor-pointer transition-colors"
            >
              Submit Request
            </a>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-4 bg-[#E6E6E6] hidden sm:block" />

        {/* Sign Out Button */}
        <button
          onClick={logout}
          type="button"
          className="text-[13px] text-[#666666] hover:text-[#C3280F] font-medium transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
