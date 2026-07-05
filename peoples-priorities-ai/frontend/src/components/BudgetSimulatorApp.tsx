import React, { useState, useRef } from 'react';
import BudgetInput from './BudgetInput';
import SimulationResults from './SimulationResults';
import { simulateBudget, exportSimulation, type SimulationResult } from '../lib/api';

export default function BudgetSimulatorApp() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // Can be used for a loading spinner on export if desired
  
  // Track last used inputs to pass to export
  const [lastBudget, setLastBudget] = useState<number>(0);
  const [lastTheme, setLastTheme] = useState<string>('');
  
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSimulate = async (budget: number, theme: string) => {
    try {
      setIsLoading(true);
      setLastBudget(budget);
      setLastTheme(theme);
      
      const res = await simulateBudget(budget, theme, undefined);
      setResult(res);
      
      // Smooth scroll to results after a short delay to allow render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error(error);
      alert('Failed to simulate budget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      setExportLoading(true);
      await exportSimulation(lastBudget, format, lastTheme);
    } catch (error) {
      console.error(error);
      alert(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
      {/* Left Column: Input Form */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 w-full min-w-0">
        <BudgetInput onSimulate={handleSimulate} isLoading={isLoading} />
      </div>
      
      {/* Right Column: Results Dashboard */}
      <div ref={resultsRef} className="lg:col-span-8 w-full min-w-0">
        {(result || isLoading) ? (
          <SimulationResults 
            result={result} 
            isLoading={isLoading} 
            onExport={handleExport} 
          />
        ) : (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-12 h-12 rounded-full bg-[#7B61FF]/10 flex items-center justify-center mb-4 text-[#7B61FF]">
              <i className="ti ti-calculator text-[24px]"></i>
            </div>
            <h4 className="text-base font-bold text-gray-800 mb-1">Awaiting Simulation</h4>
            <p className="text-sm text-gray-500 max-w-xs">
              Enter a budget on the left and click "Generate sanction list" to see the dynamic priorities list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
