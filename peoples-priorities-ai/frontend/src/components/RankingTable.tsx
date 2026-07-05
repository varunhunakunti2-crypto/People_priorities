import React, { useState, useMemo } from 'react';
import type { RankingItem } from '../lib/api';

interface RankingTableProps {
  rankings: RankingItem[];
  selectedPair?: RankingItem | null;
  onSelect?: (item: RankingItem) => void;
}

type SortField =
  | 'rank'
  | 'villageName'
  | 'themeLabel'
  | 'priorityScore'
  | 'demandScore'
  | 'needScore'
  | 'neglectScore'
  | 'feasibilityScore'
  | 'submissionCount';
type SortDirection = 'asc' | 'desc';

export default function RankingTable({ rankings, selectedPair, onSelect }: RankingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('priorityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Track which rows are expanded to show sample complaints
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Extract unique themes from rankings
  const uniqueThemes = useMemo(() => {
    const themes = new Set(rankings.map(r => r.themeLabel));
    return ['All', ...Array.from(themes)];
  }, [rankings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpand = (e: React.MouseEvent, rowKey: string) => {
    e.stopPropagation(); // Avoid triggering row selection
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const filteredAndSortedRankings = useMemo(() => {
    let result = [...rankings];

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => r.villageName.toLowerCase().includes(lower));
    }

    // Filter by theme
    if (themeFilter !== 'All') {
      result = result.filter(r => r.themeLabel === themeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        const aIndex = rankings.indexOf(a);
        const bIndex = rankings.indexOf(b);
        comparison = aIndex - bIndex;
      } else if (sortField === 'villageName' || sortField === 'themeLabel') {
        comparison = a[sortField].localeCompare(b[sortField]);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [rankings, searchTerm, themeFilter, sortField, sortDirection]);

  // Clean class name helper for themes
  const getThemeClass = (label: string) => {
    const clean = label.split('/')[0].toLowerCase().trim().replace(' ', '-');
    if (clean.includes('school')) return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50';
    if (clean.includes('water')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
    if (clean.includes('road')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
    if (clean.includes('health')) return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50';
    if (clean.includes('employment')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
    if (clean.includes('skills')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
    if (clean.includes('electricity')) return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
    if (clean.includes('irrigation')) return 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50';
    return 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50';
  };

  // Color code priorityScore: green if >=75, amber if 50-74, gray if <50
  const getPriorityScoreBadgeClass = (score: number) => {
    const base = "inline-block font-mono font-bold text-center px-2 py-0.5 rounded-[4px] text-[11px] tabular-nums transition-colors border-none";
    if (score >= 75) {
      return `${base} bg-[#d3e5ff] text-[#0070f3] border-l-[3px] border-l-[#0070f3]!`;
    }
    if (score >= 50) {
      return `${base} bg-[#ffefcf] text-[#ab570a] border-l-[3px] border-l-[#f5a623]!`;
    }
    return `${base} bg-[#f5f5f5] text-[#888888] border-l-[3px] border-l-[#a1a1a1]!`;
  };

  // Helper for rank badge style
  const getRankBadgeStyle = (item: RankingItem) => {
    const originalRank = rankings.indexOf(item) + 1;
    const base = "inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold";
    if (originalRank === 1) return `${base} bg-yellow-400 text-yellow-950 border border-yellow-500`;
    if (originalRank === 2) return `${base} bg-slate-300 text-slate-900 border border-slate-400`;
    if (originalRank === 3) return `${base} bg-orange-300 text-orange-950 border border-orange-400`;
    return `${base} bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-[#ebebeb] dark:border-zinc-800 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Thematic Rankings</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Click rows to select villages or click the arrow to view raw citizen complaints.</p>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search village name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="w-full pr-4 py-2 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 rounded-md font-sans text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-950 focus-visible:ring-3 focus-visible:ring-zinc-500/10 transition-all"
          />
        </div>

        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 rounded-md font-sans text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
        >
          {uniqueThemes.map(t => (
            <option key={t} value={t}>
              Theme: {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table grid */}
      <div className="w-full overflow-x-auto rounded-2xl border-none">
        <table className="w-full border-collapse text-left text-sm text-zinc-800 dark:text-zinc-200">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#ebebeb] text-[12px] uppercase tracking-[0.8px] font-mono font-medium text-[#888888] select-none h-12">
              <th className="p-3 w-16 cursor-pointer hover:text-[#0070f3] transition-colors" onClick={() => handleSort('rank')}>
                Rank {sortField === 'rank' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors" onClick={() => handleSort('villageName')}>
                Village {sortField === 'villageName' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors" onClick={() => handleSort('themeLabel')}>
                Theme {sortField === 'themeLabel' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('priorityScore')}>
                Priority Score {sortField === 'priorityScore' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('demandScore')}>
                Demand {sortField === 'demandScore' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('needScore')}>
                Need {sortField === 'needScore' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('neglectScore')}>
                Neglect {sortField === 'neglectScore' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('feasibilityScore')}>
                Feasibility {sortField === 'feasibilityScore' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 cursor-pointer hover:text-[#0070f3] transition-colors text-center" onClick={() => handleSort('submissionCount')}>
                Submissions {sortField === 'submissionCount' && <span className="text-[#0070f3] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 w-12 text-center">Expand</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRankings.map((item, idx) => {
              const originalRank = rankings.indexOf(item) + 1;
              const rowKey = `${item.villageId}-${item.themeId}`;
              const isSelected = selectedPair?.villageId === item.villageId && selectedPair?.themeId === item.themeId;
              const isExpanded = !!expandedRows[rowKey];
              
              return (
                <React.Fragment key={rowKey}>
                  <tr
                    style={{ height: '52px' }}
                    className={`border-b border-[#ebebeb] dark:border-zinc-800/40 cursor-pointer transition-colors hover:bg-[#f5f5f5] dark:hover:bg-zinc-800/40 ${
                      idx % 2 === 0 ? 'bg-[#fafafa] dark:bg-zinc-900/40' : 'bg-white dark:bg-zinc-900'
                    } ${
                      isSelected ? 'bg-[#0070f3]/5 dark:bg-[#0070f3]/5 border-l-2 border-l-[#0070f3]!' : ''
                    }`}
                    onClick={(e) => {
                      if (onSelect) onSelect(item);
                      toggleRowExpand(e, rowKey);
                    }}
                  >
                    <td className="p-3">
                      <span className={getRankBadgeStyle(item)}>
                        {originalRank}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      <a
                        href={`/village/${item.villageId}`}
                        onClick={(e) => {
                          if (onSelect) {
                            e.preventDefault();
                            e.stopPropagation(); // Avoid triggering row selection twice
                            onSelect(item);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-0.5"
                      >
                        {item.villageName}
                      </a>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${getThemeClass(item.themeLabel)}`}>
                        {item.themeLabel}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={getPriorityScoreBadgeClass(item.priorityScore)}>
                        {item.priorityScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-center tabular-nums text-xs font-mono">{item.demandScore.toFixed(0)}</td>
                    <td className="p-3 text-center tabular-nums text-xs font-mono">{item.needScore.toFixed(0)}</td>
                    <td className="p-3 text-center tabular-nums text-xs font-mono">{item.neglectScore.toFixed(0)}</td>
                    <td className="p-3 text-center tabular-nums text-xs font-mono">{item.feasibilityScore.toFixed(0)}</td>
                    <td className="p-3 text-center font-bold tabular-nums text-sm">{item.submissionCount}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering row selection/expansion twice
                          toggleRowExpand(e, rowKey);
                        }}
                        aria-label={isExpanded ? 'Collapse complaints' : 'Expand complaints'}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Complaints Row */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-200 dark:border-zinc-900">
                      <td colSpan={10} className="p-4 pl-12">
                        <div className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 flex flex-col gap-2.5">
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Citizen Submissions</span>
                          {item.sampleComplaints.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No complaint snippets recorded for this concern.</p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {item.sampleComplaints.map((complaint, idx) => (
                                <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-300 italic leading-relaxed">
                                  “{complaint}”
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredAndSortedRankings.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-zinc-400 italic">
                  No matching rankings found for your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-400 mt-1 select-none">
        <span><strong>Priority Score Color</strong>: <span className="text-green-500 font-bold">Green ≥ 75</span> • <span className="text-amber-500 font-bold">Amber 50-74</span> • <span className="text-gray-500 font-bold">Gray &lt; 50</span></span>
      </div>
    </div>
  );
}
