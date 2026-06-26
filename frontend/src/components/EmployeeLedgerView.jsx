import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getExpenseHistory } from '../lib/api/expenses';
import ExpenseUploadModal from './ExpenseUploadModal';

export const EmployeeLedgerView = () => {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async (statusFilter) => {
    setIsLoading(true);
    setError('');
    try {
      // Map frontend tabs to backend enums if necessary
      const apiFilter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getExpenseHistory(apiFilter);
      if (data && data.success) {
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('Failed to load expense history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Paid';
      case 'rejected':
        return 'Disallowed';
      case 'pending':
      default:
        return 'Pending';
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
            <span className="font-bold text-lg text-[#171717] tracking-tight">ExpensePro Ledger</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#171717]">{user?.full_name}</p>
              <p className="text-xs text-[#888888] uppercase tracking-wider">{user?.department} • {user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-[#ebebeb] px-3.5 py-1.5 text-sm font-semibold text-[#4d4d4d] hover:bg-[#fafafa] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ebebeb] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#171717]">My Claims</h1>
            <p className="text-sm text-[#888888] mt-1">Submit, view, and track your reimbursement claims.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-center"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Claim</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="mt-6 flex flex-wrap border-b border-[#ebebeb] gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-all duration-200 transform active:scale-95 cursor-pointer -mb-px ${
                activeTab === tab
                  ? 'border-[#171717] text-[#171717] font-semibold scale-105'
                  : 'border-transparent text-[#888888] hover:text-[#171717] hover:scale-105'
              }`}
            >
              {tab === 'approved' ? 'Paid' : tab === 'rejected' ? 'Disallowed' : tab}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="mt-6 bg-white rounded-xl border border-[#ebebeb] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex py-20 justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#171717] border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-[#c50000]">{error}</div>
          ) : expenses.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 px-4">
              <div className="flex justify-center mb-4 text-[#888888]">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#171717]">No expenses found</h3>
              <p className="text-sm text-[#888888] mt-1 max-w-sm mx-auto">
                {activeTab === 'all'
                  ? "You haven't filed any reimbursement claims yet. Click 'New Claim' to get started."
                  : `You don't have any claims marked as '${getStatusLabel(activeTab)}'.`}
              </p>
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#ebebeb]">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#ebebeb]">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-[#fafafa]/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#888888]">
                        {new Date(expense.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#171717] max-w-xs truncate font-medium">
                        {expense.description || <span className="text-[#888888] italic">No description</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4d4d4d]">
                        <span className="capitalize">{expense.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(expense.status)}`}>
                          {getStatusLabel(expense.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#171717] font-bold text-right font-mono">
                        ${parseFloat(expense.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Claim Submission Modal */}
      <ExpenseUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchExpenses(activeTab)}
      />
    </div>
  );
};

export default EmployeeLedgerView;
