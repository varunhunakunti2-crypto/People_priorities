import React, { useState } from 'react';
import { submitExpense } from '../lib/api/expenses';

export const ExpenseUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('travel');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for showing the budget warning screen after successful submission
  const [warningData, setWarningData] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Description must not be empty');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await submitExpense({
        amount: parsedAmount,
        category,
        description
      });

      if (response.success) {
        if (response.budget_warning) {
          // If there's a budget warning, show it before closing
          setWarningData(response.expense);
        } else {
          // Normal success flow
          handleSuccessClose();
        }
      }
    } catch (err) {
      console.error('Submit expense error:', err);
      const msg = err.response?.data?.message || 'Failed to submit expense claim';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    // Reset state
    setAmount('');
    setCategory('travel');
    setDescription('');
    setError('');
    setWarningData(null);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#ebebeb] shadow-lg overflow-hidden font-sans animate-slide-up">
        
        {/* If we have a budget warning, show this screen */}
        {warningData ? (
          <div className="p-8 space-y-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffefcf] text-[#ab570a]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#171717]">Budget Threshold Warning</h3>
              <p className="mt-2 text-sm text-[#4d4d4d]">
                Your claim of <strong className="text-[#171717]">${parseFloat(warningData.amount).toFixed(2)}</strong> has been successfully submitted, but this transaction pushes your department's total monthly spending to **90% or more** of its monthly budget allocation.
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSuccessClose}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        ) : (
          /* Normal Form Screen */
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-[#ebebeb] px-6 py-4">
              <h3 className="text-lg font-bold text-[#171717]">Submit New Expense Claim</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[#888888] hover:text-[#171717] transition-all duration-200 transform hover:scale-110 active:scale-90 cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-[#f7d4d6] p-3 text-sm text-[#c50000] border border-[#ffb3b7] flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] bg-white focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50 transition-all duration-200"
                >
                  <option value="travel">Travel</option>
                  <option value="meals">Meals</option>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Purpose of expense..."
                  rows={4}
                  className="block w-full rounded-lg border border-[#ebebeb] px-3 py-2.5 text-sm text-[#171717] focus:border-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717] disabled:opacity-50 resize-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#ebebeb] px-6 py-4 bg-[#fafafa]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-[#ebebeb] bg-white px-4 py-2 text-sm font-semibold text-[#4d4d4d] hover:bg-[#fafafa] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#171717] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ExpenseUploadModal;
