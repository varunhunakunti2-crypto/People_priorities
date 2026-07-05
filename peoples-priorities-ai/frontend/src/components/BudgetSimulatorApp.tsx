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
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full max-w-2xl mx-auto">
        <BudgetInput onSimulate={handleSimulate} isLoading={isLoading} />
      </div>
      
      <div ref={resultsRef} className="w-full">
        {(result || isLoading) && (
          <SimulationResults 
            result={result} 
            isLoading={isLoading} 
            onExport={handleExport} 
          />
        )}
      </div>
    </div>
  );
}
