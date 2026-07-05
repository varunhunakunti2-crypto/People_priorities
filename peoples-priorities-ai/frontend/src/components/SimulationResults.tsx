import React, { useState } from 'react';
import type { SimulationResult, SimulatedWork } from '../lib/api';

interface SimulationResultsProps {
  result: SimulationResult | null;
  isLoading: boolean;
  onExport: (format: 'pdf' | 'xlsx') => void;
}

export default function SimulationResults({ result, isLoading, onExport }: SimulationResultsProps) {
  const [showExcluded, setShowExcluded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-100 rounded w-full"></div>
        <div className="h-12 bg-gray-100 rounded w-full"></div>
        <div className="h-12 bg-gray-100 rounded w-full"></div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const getProgressColor = (pct: number) => {
    if (pct < 80) return 'bg-green-500';
    if (pct <= 95) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getPriorityScoreColor = (score: number) => {
    if (score >= 7) return 'bg-green-100 text-green-800';
    if (score >= 4) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const renderTable = (works: SimulatedWork[], isExcluded = false) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rank</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Village</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Development Work</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cost</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Priority Score</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Submissions</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cumulative spend</th>
          </tr>
        </thead>
        <tbody>
          {works.map((work) => (
            <tr key={`${work.villageId}-${work.themeLabel}-${work.rank}`} className={`border-b border-gray-100 last:border-b-0 ${isExcluded ? 'opacity-60' : ''}`}>
              <td className="py-3 px-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7B61FF] text-white text-xs font-bold">
                  {work.rank}
                </span>
              </td>
              <td className="py-3 px-4 text-[14px] font-medium text-gray-900">
                {work.villageName}
              </td>
              <td className="py-3 px-4">
                <span className="inline-block border-l-4 border-[#7B61FF] bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-r whitespace-nowrap">
                  {work.themeLabel}
                </span>
              </td>
              <td className={`py-3 px-4 font-semibold whitespace-nowrap ${isExcluded ? 'text-red-500' : 'text-green-600'}`}>
                ₹{work.estimatedCostLakh}L
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityScoreColor(work.priorityScore)}`}>
                  {work.priorityScore.toFixed(2)}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {work.submissionCount}
              </td>
              <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                ₹{work.cumulativeCostLakh}L
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6">
      
      {/* BUDGET SUMMARY BAR */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[13px] font-medium text-gray-800">
          <span>₹{result.totalAllocatedLakh}L allocated of ₹{result.totalBudgetLakh}L</span>
          <span>₹{result.remainingLakh}L remaining</span>
        </div>
        <div className="w-full h-2 bg-[#E6E6E6] rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor(result.utilizationPct)} transition-all duration-500`}
            style={{ width: `${Math.min(result.utilizationPct, 100)}%` }}
          />
        </div>
        <div className="text-[12px] text-[#666666]">
          {result.selectedWorks.length} works selected, {result.excludedWorks.length} couldn't fit
        </div>
      </div>

      {/* EXPORT BUTTONS ROW */}
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => onExport('pdf')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export PDF
        </button>
        <button 
          onClick={() => onExport('xlsx')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export Excel
        </button>
      </div>

      {/* SELECTED WORKS SECTION */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
          ✅ Selected works ({result.selectedWorks.length})
        </h3>
        
        {result.selectedWorks.length === 0 ? (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-sm text-amber-800">
            <strong>Budget too small</strong> — no works fit within ₹{result.totalBudgetLakh}L. 
            Try increasing the budget or filtering to a specific theme.
          </div>
        ) : (
          renderTable(result.selectedWorks, false)
        )}
      </div>

      {/* EXCLUDED WORKS SECTION */}
      {result.excludedWorks.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors focus:outline-none"
          >
            <h3 className="text-md font-bold text-gray-700">
              ❌ Works that didn't fit ({result.excludedWorks.length})
            </h3>
            <span className="text-gray-500 flex items-center gap-2">
              <span className="text-xs font-normal">Increase budget to include these</span>
              <svg className={`w-5 h-5 transform transition-transform ${showExcluded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
          </button>
          
          {showExcluded && (
            <div className="p-0 sm:p-4 bg-white border-t border-gray-200">
              {renderTable(result.excludedWorks, true)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
