import React, { useState, useEffect } from 'react';

export interface Weights {
  demand: number;
  need: number;
  neglect: number;
  feasibility: number;
  weightDemand?: number;
  weightNeed?: number;
  weightNeglect?: number;
  weightFeasibility?: number;
}

interface WeightSlidersProps {
  weights?: Weights;
  onChange?: (weights: Weights) => void;
}

const PRESETS = [
  {
    name: 'Equal Balance',
    weights: { demand: 0.25, need: 0.25, neglect: 0.25, feasibility: 0.25 }
  },
  {
    name: 'Citizen Demand',
    weights: { demand: 0.60, need: 0.15, neglect: 0.15, feasibility: 0.10 }
  },
  {
    name: 'Need & Neglect',
    weights: { demand: 0.15, need: 0.45, neglect: 0.30, feasibility: 0.10 }
  },
  {
    name: 'Cost Feasibility',
    weights: { demand: 0.10, need: 0.10, neglect: 0.20, feasibility: 0.60 }
  }
];

export default function WeightSliders({ weights, onChange }: WeightSlidersProps) {
  // Manages 4 slider values in state with default values: 0.35, 0.35, 0.20, 0.10
  const [localWeights, setLocalWeights] = useState({
    weightDemand: 0.35,
    weightNeed: 0.35,
    weightNeglect: 0.20,
    weightFeasibility: 0.10
  });

  // Keep local state in sync with parent weights if they change (e.g. presets)
  useEffect(() => {
    if (weights) {
      setLocalWeights({
        weightDemand: weights.demand ?? 0.35,
        weightNeed: weights.need ?? 0.35,
        weightNeglect: weights.neglect ?? 0.20,
        weightFeasibility: weights.feasibility ?? 0.10
      });
    }
  }, [weights?.demand, weights?.need, weights?.neglect, weights?.feasibility]);

  // Debounce the onChange propagation to the parent (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const updated: Weights = {
        demand: localWeights.weightDemand,
        need: localWeights.weightNeed,
        neglect: localWeights.weightNeglect,
        feasibility: localWeights.weightFeasibility,
        weightDemand: localWeights.weightDemand,
        weightNeed: localWeights.weightNeed,
        weightNeglect: localWeights.weightNeglect,
        weightFeasibility: localWeights.weightFeasibility
      };

      if (
        onChange &&
        (!weights ||
          Math.abs(weights.demand - updated.demand) > 0.001 ||
          Math.abs(weights.need - updated.need) > 0.001 ||
          Math.abs(weights.neglect - updated.neglect) > 0.001 ||
          Math.abs(weights.feasibility - updated.feasibility) > 0.001)
      ) {
        onChange(updated);
      }
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [localWeights, onChange]);

  const handleSliderChange = (key: 'weightDemand' | 'weightNeed' | 'weightNeglect' | 'weightFeasibility', valStr: string) => {
    const newVal = parseFloat(valStr);
    setLocalWeights(prev => ({
      ...prev,
      [key]: newVal
    }));
  };

  const applyPreset = (presetWeights: { demand: number; need: number; neglect: number; feasibility: number }) => {
    setLocalWeights({
      weightDemand: presetWeights.demand,
      weightNeed: presetWeights.need,
      weightNeglect: presetWeights.neglect,
      weightFeasibility: presetWeights.feasibility
    });
  };

  const resetToDefaults = () => {
    setLocalWeights({
      weightDemand: 0.35,
      weightNeed: 0.35,
      weightNeglect: 0.20,
      weightFeasibility: 0.10
    });
  };

  const isPresetActive = (p: { demand: number; need: number; neglect: number; feasibility: number }) => {
    const threshold = 0.01;
    return (
      Math.abs(localWeights.weightDemand - p.demand) < threshold &&
      Math.abs(localWeights.weightNeed - p.need) < threshold &&
      Math.abs(localWeights.weightNeglect - p.neglect) < threshold &&
      Math.abs(localWeights.weightFeasibility - p.feasibility) < threshold
    );
  };

  const total = localWeights.weightDemand + localWeights.weightNeed + localWeights.weightNeglect + localWeights.weightFeasibility;

  // Calculate relative percentages for rendering
  const demandPct = total > 0 ? (localWeights.weightDemand / total) * 100 : 0;
  const needPct = total > 0 ? (localWeights.weightNeed / total) * 100 : 0;
  const neglectPct = total > 0 ? (localWeights.weightNeglect / total) * 100 : 0;
  const feasibilityPct = total > 0 ? (localWeights.weightFeasibility / total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-[#ebebeb] dark:border-zinc-800 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
      <div className="sliders-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-zinc-800 pb-3 font-sans">
        <div>
          <h3 className="text-[16px] font-semibold text-[#171717] dark:text-zinc-100">Prioritization Weighting Lenses</h3>
          <p className="text-[12px] text-[#4d4d4d] dark:text-zinc-400 mt-1">Adjust factors below to dynamically recompute priority rankings (Formula: Citizen voice × W_d + Infrastructure gap × W_n + Neglect × W_ng + Cost-effectiveness × W_f)</p>
        </div>
        <div className="presets-container flex flex-wrap gap-2 shrink-0">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-[100px] border transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isPresetActive(p.weights)
                  ? 'bg-[#171717] border-[#171717] text-white'
                  : 'bg-transparent border-[#ebebeb] text-[#171717] dark:text-zinc-300 hover:bg-[#fafafa]'
              }`}
              onClick={() => applyPreset(p.weights)}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            className="px-3 py-1 text-xs font-semibold rounded-[100px] border border-[#ebebeb] bg-transparent text-[#171717] dark:text-zinc-300 hover:bg-[#fafafa] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            onClick={resetToDefaults}
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <div className="sliders-grid grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
        {/* Citizen voice Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-[#fafafa] dark:bg-zinc-950/40 border border-[#ebebeb] dark:border-zinc-800/80 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-[#171717] dark:text-zinc-300 font-mono">Citizen voice</span>
            <span className="text-[12px] font-semibold text-[#171717] font-mono">{localWeights.weightDemand.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localWeights.weightDemand}
            onChange={(e) => handleSliderChange('weightDemand', e.target.value)}
            className="slider-input focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0070f3] rounded"
            style={{
              accentColor: '#0070f3',
              background: `linear-gradient(to right, #0070f3 0%, #0070f3 ${localWeights.weightDemand * 100}%, #E6E6E6 ${localWeights.weightDemand * 100}%, #E6E6E6 100%)`,
              transition: 'background 0.15s ease'
            }}
          />
          <span className="text-[11px] text-[#888888] mt-0.5 leading-snug">Based on count of classified citizen complaints/submissions.</span>
        </div>

        {/* Infrastructure gap Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-[#fafafa] dark:bg-zinc-950/40 border border-[#ebebeb] dark:border-zinc-800/80 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-[#171717] dark:text-zinc-300 font-mono">Infrastructure gap</span>
            <span className="text-[12px] font-semibold text-[#171717] font-mono">{localWeights.weightNeed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localWeights.weightNeed}
            onChange={(e) => handleSliderChange('weightNeed', e.target.value)}
            className="slider-input focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#7928ca] rounded"
            style={{
              accentColor: '#7928ca',
              background: `linear-gradient(to right, #7928ca 0%, #7928ca ${localWeights.weightNeed * 100}%, #E6E6E6 ${localWeights.weightNeed * 100}%, #E6E6E6 100%)`,
              transition: 'background 0.15s ease'
            }}
          />
          <span className="text-[11px] text-[#888888] mt-0.5 leading-snug">Aggregated metrics (e.g. Pupil-Teacher Ratio, lack of secondary school).</span>
        </div>

        {/* Neglect Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-[#fafafa] dark:bg-zinc-950/40 border border-[#ebebeb] dark:border-zinc-800/80 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-[#171717] dark:text-zinc-300 font-mono">Neglect</span>
            <span className="text-[12px] font-semibold text-[#171717] font-mono">{localWeights.weightNeglect.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localWeights.weightNeglect}
            onChange={(e) => handleSliderChange('weightNeglect', e.target.value)}
            className="slider-input focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#f5a623] rounded"
            style={{
              accentColor: '#f5a623',
              background: `linear-gradient(to right, #f5a623 0%, #f5a623 ${localWeights.weightNeglect * 100}%, #E6E6E6 ${localWeights.weightNeglect * 100}%, #E6E6E6 100%)`,
              transition: 'background 0.15s ease'
            }}
          />
          <span className="text-[11px] text-[#888888] mt-0.5 leading-snug">Inversely proportional to existing completed/ongoing projects in theme.</span>
        </div>

        {/* Cost-effectiveness Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-[#fafafa] dark:bg-zinc-950/40 border border-[#ebebeb] dark:border-zinc-800/80 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-[#171717] dark:text-zinc-300 font-mono">Cost-effectiveness</span>
            <span className="text-[12px] font-semibold text-[#171717] font-mono">{localWeights.weightFeasibility.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localWeights.weightFeasibility}
            onChange={(e) => handleSliderChange('weightFeasibility', e.target.value)}
            className="slider-input focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#29bc9b] rounded"
            style={{
              accentColor: '#29bc9b',
              background: `linear-gradient(to right, #29bc9b 0%, #29bc9b ${localWeights.weightFeasibility * 100}%, #E6E6E6 ${localWeights.weightFeasibility * 100}%, #E6E6E6 100%)`,
              transition: 'background 0.15s ease'
            }}
          />
          <span className="text-[11px] text-[#888888] mt-0.5 leading-snug">Higher score for lower average historical cost (easier to implement).</span>
        </div>
      </div>

      {/* Visual Weight Bar */}
      <div>
        <div className="weight-bar-container">
          <div className="weight-bar-segment segment-demand" style={{ width: `${demandPct}%` }} title={`Citizen voice: ${demandPct.toFixed(0)}%`} />
          <div className="weight-bar-segment segment-need" style={{ width: `${needPct}%` }} title={`Infrastructure gap: ${needPct.toFixed(0)}%`} />
          <div className="weight-bar-segment segment-neglect" style={{ width: `${neglectPct}%` }} title={`Neglect: ${neglectPct.toFixed(0)}%`} />
          <div className="weight-bar-segment segment-feasibility" style={{ width: `${feasibilityPct}%` }} title={`Cost-effectiveness: ${feasibilityPct.toFixed(0)}%`} />
        </div>
        <div className="weight-legend flex flex-wrap gap-4 text-xs select-none">
          <div className="legend-item flex items-center gap-1.5">
            <span className="legend-dot segment-demand" />
            <span className="text-mute">Citizen voice ({(demandPct).toFixed(0)}%)</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="legend-dot segment-need" />
            <span className="text-mute">Infrastructure gap ({(needPct).toFixed(0)}%)</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="legend-dot segment-neglect" />
            <span className="text-mute">Neglect ({(neglectPct).toFixed(0)}%)</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="legend-dot segment-feasibility" />
            <span className="text-mute">Cost-effectiveness ({(feasibilityPct).toFixed(0)}%)</span>
          </div>

          <div className="legend-item ml-auto flex items-center gap-1.5 font-semibold">
            <span className={Math.abs(total - 1.0) > 0.01 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500"}>
              Running Sum: {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
