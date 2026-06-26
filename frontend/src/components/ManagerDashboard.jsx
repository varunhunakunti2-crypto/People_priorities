import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getDepartmentBudget, getPendingApprovals, getCategoryBreakdown } from '../lib/api/manager';
import DeptApprovalQueue from './DeptApprovalQueue';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Category color mappings
const CATEGORY_COLORS = {
  travel: '#0070f3',    // Vercel Blue
  meals: '#f5a623',     // Vercel Orange
  software: '#7928ca',  // Vercel Purple
  hardware: '#ff0080'   // Vercel Pink
};

export const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const [budget, setBudget] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [budgetData, approvalsData, breakdownData] = await Promise.all([
        getDepartmentBudget(),
        getPendingApprovals(),
        getCategoryBreakdown()
      ]);

      if (budgetData.success) setBudget(budgetData.budget);
      if (approvalsData.success) setApprovals(approvalsData.approvals);
      
      if (breakdownData.success) {
        // Format chart data for Recharts, filter out zero sums
        const formatted = breakdownData.breakdown
          .filter(item => item.total > 0)
          .map(item => ({
            name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
            value: item.total,
            color: CATEGORY_COLORS[item.category] || '#888888'
          }));
        setChartData(formatted);
      }
    } catch (err) {
      console.error('Error fetching manager dashboard data:', err);
      setError('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getProgressBarColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-[#ee0000]';
      case 'warning': return 'bg-[#f5a623]';
      case 'safe':
      default:
        return 'bg-[#0070f3]';
    }
  };

  const getProgressBarBg = (level) => {
    switch (level) {
      case 'critical': return 'bg-[#f7d4d6]';
      case 'warning': return 'bg-[#ffefcf]';
      case 'safe':
      default:
        return 'bg-[#d3e5ff]';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-12">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-[#ebebeb] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#171717] text-white font-mono font-bold text-sm">
              EP
            </div>
            <span className="font-bold text-lg text-[#171717] tracking-tight">ExpensePro Manager</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#171717]">{user?.full_name}</p>
              <p className="text-xs text-[#888888] uppercase tracking-wider">{user?.department} Department Manager</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-[#ebebeb] px-3.5 py-1.5 text-sm font-semibold text-[#4d4d4d] hover:bg-[#fafafa] transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header Block */}
        <div className="border-b border-[#ebebeb] pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Department Dashboard</h1>
          <p className="text-sm text-[#888888] mt-1">Review department budget allocations and claim queues.</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-[#f7d4d6] p-4 text-sm text-[#c50000] border border-[#ffb3b7]">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex py-32 justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#171717] border-t-transparent"></div>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            
            {/* Top Section: Budget Utilization */}
            {budget && (
              <div className="bg-white rounded-xl border border-[#ebebeb] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#171717]">Monthly Budget Tracker</h2>
                    <p className="text-sm text-[#888888]">Allocated spending limits for the {budget.department} division.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-[#888888]">Budget Used</span>
                    <p className="text-2xl font-bold text-[#171717] font-mono">
                      ${budget.spent_amount.toFixed(2)} / ${budget.monthly_limit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Progress Alert */}
                {budget.status_level !== 'safe' && (
                  <div className={`rounded-lg p-3.5 text-sm border flex items-center gap-3 ${
                    budget.status_level === 'critical'
                      ? 'bg-[#f7d4d6] text-[#c50000] border-[#ffb3b7]'
                      : 'bg-[#ffefcf] text-[#ab570a] border-[#ffdca3]'
                  }`}>
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      {budget.status_level === 'critical'
                        ? 'CRITICAL ALERT: Department spending has exceeded 90% threshold. Immediate cost auditing recommended.'
                        : 'WARNING: Department budget spending has crossed 75% threshold.'}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className={`h-3 w-full rounded-full overflow-hidden ${getProgressBarBg(budget.status_level)}`}>
                    <div
                      className={`h-full transition-all duration-500 ${getProgressBarColor(budget.status_level)}`}
                      style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-[#888888] font-mono">
                    <span>0%</span>
                    <span>{budget.percent_used}% Used</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid for Pie Chart and Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Category Pie Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-[#ebebeb] p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-[#171717] mb-2">Category Spending Breakdown</h3>
                <p className="text-xs text-[#888888] mb-6">Distribution of approved expense requests by category.</p>
                
                <div className="flex-1 min-h-[300px] flex items-center justify-center">
                  {chartData.length === 0 ? (
                    <div className="text-center text-[#888888] py-12">
                      <p className="text-sm font-semibold">No approved data available</p>
                      <p className="text-xs mt-1">Breakdown will populate once claims are approved.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                          contentStyle={{ background: '#171717', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Quick stats box */}
              <div className="bg-white rounded-xl border border-[#ebebeb] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#171717] mb-4">Department Status</h3>
                  <div className="space-y-4">
                    <div className="border-b border-[#ebebeb] pb-3">
                      <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Pending Claims</span>
                      <p className="text-3xl font-bold text-[#171717] mt-0.5">{approvals.length}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Health Status</span>
                      <p className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          budget?.status_level === 'critical'
                            ? 'bg-red-50 text-[#c50000] border border-red-200'
                            : budget?.status_level === 'warning'
                            ? 'bg-yellow-50 text-[#ab570a] border border-yellow-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            budget?.status_level === 'critical'
                              ? 'bg-[#ee0000]'
                              : budget?.status_level === 'warning'
                              ? 'bg-[#f5a623]'
                              : 'bg-green-500'
                          }`} />
                          <span className="capitalize">{budget?.status_level}</span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#ebebeb] text-[11px] font-mono text-[#888888]">
                  BUDGET AUDITING PORTAL v1.0
                </div>
              </div>

            </div>

            {/* Approval Queue Section */}
            <div>
              <h3 className="text-xl font-bold text-[#171717] mb-4">Pending Approvals Queue</h3>
              <DeptApprovalQueue
                approvals={approvals}
                budget={budget}
                onActionCompleted={fetchDashboardData}
              />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
