import React, { useState } from 'react';
import { updateApprovalStatus } from '../lib/api/manager';

export const DeptApprovalQueue = ({ approvals, budget, onActionCompleted }) => {
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const handleAction = async (id, status) => {
    setProcessingId(id);
    setError('');
    try {
      const response = await updateApprovalStatus(id, status);
      if (response.success) {
        onActionCompleted();
      }
    } catch (err) {
      console.error(`Error updating approval for expense ${id}:`, err);
      const msg = err.response?.data?.message || `Failed to ${status} expense`;
      setError(msg);
      // Refresh list to sync state even on failure
      onActionCompleted();
    } finally {
      setProcessingId(null);
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-xl border border-[#ebebeb] shadow-sm">
        <div className="flex justify-center mb-4 text-[#888888]">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#171717]">Inbox Cleared</h3>
        <p className="text-sm text-[#888888] mt-1 max-w-sm mx-auto">
          No pending expense claims require your review. Nice work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[#f7d4d6] p-3 text-sm text-[#c50000] border border-[#ffb3b7] flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#ebebeb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#ebebeb]">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Claimant</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#ebebeb]">
              {approvals.map((expense) => {
                const amountVal = parseFloat(expense.amount);
                const willExceed = budget && 
                  ((parseFloat(budget.spent_amount) + amountVal) / parseFloat(budget.monthly_limit)) >= 0.9;

                return (
                  <tr key={expense.id} className="hover:bg-[#fafafa]/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#171717]">
                      {expense.employee_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4d4d4d] max-w-xs truncate">
                      {expense.description || <span className="text-[#888888] italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#888888]">
                      <span className="capitalize">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#888888]">
                      {new Date(expense.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="font-bold text-[#171717] font-mono">${amountVal.toFixed(2)}</span>
                      {willExceed && (
                        <span className="block text-[10px] font-semibold text-[#ab570a] bg-[#ffefcf] border border-[#ffdca3] rounded px-1.5 py-0.5 mt-1 text-center">
                          ⚠️ Budget Warning (90%+)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleAction(expense.id, 'approved')}
                          disabled={processingId !== null}
                          className="rounded bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
                        >
                          {processingId === expense.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(expense.id, 'rejected')}
                          disabled={processingId !== null}
                          className="rounded bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                        >
                          {processingId === expense.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeptApprovalQueue;
