import React, { useState, useEffect, Suspense } from 'react';
import WeightSliders, { type Weights } from './WeightSliders';
import RankingTable from './RankingTable';
import { getRankings, type RankingItem } from '../lib/api';
const VILLAGE_COORDINATES: Record<string, [number, number]> = {
  VIL001: [23.35, 77.30], // Bishnupur
  VIL002: [23.40, 77.35], // Rampur
  VIL003: [23.28, 77.48], // Kalyanpur
  VIL004: [23.45, 77.42], // Piparia
  VIL005: [23.32, 77.55], // Gopalpur
  VIL006: [23.22, 77.38], // Haripur
  VIL007: [23.38, 77.46], // Sultanpur
  VIL008: [23.42, 77.50], // Chandpur
  VIL009: [23.25, 77.32], // Madhupur
  VIL010: [23.48, 77.34], // Jagdishpur
  VIL011: [23.18, 77.44], // Belgaon
  VIL012: [23.30, 77.40], // Sonpur
  VIL013: [23.27, 77.52], // Karamtoli
  VIL014: [23.43, 77.28], // Bhaktiarpur
  VIL015: [23.36, 77.58], // Rajpur
  VIL016: [23.47, 77.48], // Fatehpur
  VIL017: [23.20, 77.50], // Daulatpur
  VIL018: [23.33, 77.34], // Govindpur
  VIL019: [23.24, 77.46], // Pratapgarh
  VIL020: [23.41, 77.54]  // Ramgarh
};

const LazyPriorityMap = React.lazy(() => import('./PriorityMap'));

interface RankingsDashboardProps {
  initialRankings: RankingItem[];
  initialError: string | null;
}

export default function RankingsDashboard({ initialRankings, initialError }: RankingsDashboardProps) {
  const [rankings, setRankings] = useState<RankingItem[]>(initialRankings);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [weights, setWeights] = useState<Weights>({
    demand: 0.35,
    need: 0.35,
    neglect: 0.20,
    feasibility: 0.10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const handleWeightsChange = async (newWeights: Weights) => {
    setWeights(newWeights);
    setLoading(true);
    setError(null);
    try {
      const data = await getRankings({
        weightDemand: newWeights.demand,
        weightNeed: newWeights.need,
        weightNeglect: newWeights.neglect,
        weightFeasibility: newWeights.feasibility
      });
      setRankings(data);
    } catch (err: any) {
      console.error('Failed to update rankings client-side:', err);
      setError(err.message || 'Failed to update rankings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {error && (
        <div 
          className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-md text-sm select-none" 
          role="alert"
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Interactive Weight Sliders */}
      <WeightSliders 
        weights={weights}
        onChange={handleWeightsChange} 
      />

      {/* Geographic Priority Map */}
      <div className="w-full">
        {isMounted ? (
          <Suspense fallback={<div className="h-[500px] w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">Loading map visualizations…</div>}>
            <LazyPriorityMap 
              rankings={rankings} 
              villageCoordinates={VILLAGE_COORDINATES} 
            />
          </Suspense>
        ) : (
          <div className="h-[500px] w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">Loading map visualizations…</div>
        )}
      </div>

      {/* Rankings List / Table */}
      <div className="relative w-full">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md select-none">
              <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recalculating rank models…</span>
            </div>
          </div>
        )}
        
        <RankingTable rankings={rankings} />
      </div>
    </div>
  );
}
