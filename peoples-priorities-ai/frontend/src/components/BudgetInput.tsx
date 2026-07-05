import React, { useState } from 'react';

interface BudgetInputProps {
  onSimulate: (budget: number, theme: string) => void;
  isLoading: boolean;
}

export default function BudgetInput({ onSimulate, isLoading }: BudgetInputProps) {
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [budgetLakh, setBudgetLakh] = useState<number | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBudgetInput(val);

    if (val.trim() === '') {
      setBudgetLakh(null);
      setIsValid(false);
      setError(null);
      return;
    }

    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setBudgetLakh(null);
      setIsValid(false);
      setError('Please enter a valid number');
      return;
    }

    if (parsed <= 0) {
      setBudgetLakh(parsed);
      setIsValid(false);
      setError('Budget must be greater than 0');
      return;
    }

    if (parsed >= 10000) {
      setBudgetLakh(parsed);
      setIsValid(false);
      setError('Budget must be less than 10000 lakhs');
      return;
    }

    setBudgetLakh(parsed);
    setIsValid(true);
    setError(null);
  };

  const formatIndianCurrencyText = (lakhs: number | null) => {
    if (lakhs === null || lakhs <= 0) return '';
    
    const crores = Math.floor(lakhs / 100);
    const remainingLakhs = lakhs % 100;

    let parts = [];
    if (crores > 0) {
      parts.push(`${crores} crore`);
    }
    if (remainingLakhs > 0) {
      const formattedLakhs = Number.isInteger(remainingLakhs) ? remainingLakhs : remainingLakhs.toFixed(2);
      parts.push(`${formattedLakhs} lakh`);
    }
    
    if (parts.length === 0) return '';
    return `= ₹ ${parts.join(' ')}`;
  };

  const handleSimulate = () => {
    if (isValid && budgetLakh !== null) {
      const theme = themeFilter === 'all' ? '' : themeFilter;
      onSimulate(budgetLakh, theme);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6">
      {/* SECTION HEADER */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Budget Simulator</h2>
        <p className="text-[13px] text-[#666666]">
          Enter available MPLADS budget to generate an optimized sanction list
        </p>
      </div>

      {/* INPUT ROW */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Available budget (in Lakhs)
        </label>
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-semibold text-[#111]">₹</span>
          <div className="flex flex-col w-[180px]">
            <input
              type="number"
              value={budgetInput}
              onChange={handleBudgetChange}
              placeholder="e.g. 200"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/50 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
        
        {error ? (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        ) : isValid && budgetLakh !== null ? (
          <p className="text-[12px] text-[#7B61FF] font-medium mt-1">
            {formatIndianCurrencyText(budgetLakh)}
          </p>
        ) : null}
      </div>

      {/* THEME FILTER ROW */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Filter by theme (optional)
        </label>
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/50 bg-white"
        >
          <option value="all">All themes</option>
          <option value="School Infrastructure">School infrastructure</option>
          <option value="Water Supply">Water supply</option>
          <option value="Road Connectivity">Road connectivity</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Employment/Skills">Employment / Skills</option>
          <option value="Electricity">Electricity</option>
          <option value="Irrigation">Irrigation / Agriculture</option>
        </select>
      </div>

      {/* SIMULATE BUTTON */}
      <button
        onClick={handleSimulate}
        disabled={!isValid || budgetLakh === null || isLoading}
        className="w-full h-[44px] bg-[#7B61FF] text-white font-medium rounded-[8px] flex items-center justify-center transition-all hover:bg-[#6A52E5] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          "Generate sanction list"
        )}
      </button>
    </div>
  );
}
