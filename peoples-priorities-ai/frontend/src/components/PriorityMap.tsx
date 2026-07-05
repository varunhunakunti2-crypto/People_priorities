import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { RankingItem } from '../lib/api';

export const VILLAGE_COORDINATES: Record<string, [number, number]> = {
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

// Help component to update map view when center changes
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface PriorityMapProps {
  rankings: RankingItem[];
  villageCoordinates: Record<string, [number, number]>;
  selectedPair?: RankingItem | null;
  onSelectVillage?: (villageId: string, themeId: number) => void;
}

export default function PriorityMap({
  rankings,
  villageCoordinates,
  selectedPair,
  onSelectVillage
}: PriorityMapProps) {
  
  // 1. Group rankings by village and calculate total and maximum priority scores
  const villageData = React.useMemo(() => {
    const groups: Record<
      string,
      {
        villageId: string;
        villageName: string;
        totalScore: number;
        maxScore: number;
        themes: RankingItem[];
      }
    > = {};

    rankings.forEach((item) => {
      if (!groups[item.villageId]) {
        groups[item.villageId] = {
          villageId: item.villageId,
          villageName: item.villageName,
          totalScore: 0,
          maxScore: 0,
          themes: []
        };
      }
      groups[item.villageId].totalScore += item.priorityScore;
      groups[item.villageId].themes.push(item);
      if (item.priorityScore > groups[item.villageId].maxScore) {
        groups[item.villageId].maxScore = item.priorityScore;
      }
    });

    // Sort themes by priorityScore descending to identify the top concerns
    Object.values(groups).forEach((g) => {
      g.themes.sort((a, b) => b.priorityScore - a.priorityScore);
    });

    return Object.values(groups).filter((g) => villageCoordinates[g.villageId]);
  }, [rankings, villageCoordinates]);

  // 2. Centered on the average coordinate
  const avgCenter = React.useMemo(() => {
    const coords = Object.values(villageCoordinates);
    if (coords.length === 0) return [23.33, 77.42] as [number, number];
    const sum = coords.reduce((acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]], [0, 0]);
    return [sum[0] / coords.length, sum[1] / coords.length] as [number, number];
  }, [villageCoordinates]);

  return (
    <div className="relative w-full h-[500px] rounded-xl border border-[#ebebeb] dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm z-0 [transform:translate3d(0,0,0)]">
      <MapContainer
        center={avgCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeMapView center={avgCenter} />

        {villageData.map(({ villageId, villageName, totalScore, maxScore, themes }) => {
          const coords = villageCoordinates[villageId];
          if (!coords) return null;

          // 3. Vercel severity colors
          const markerColor =
            maxScore >= 75
              ? '#ee0000'
              : maxScore >= 50
                ? '#f5a623'
                : '#888888';

          // 3. Radius scaled
          const markerRadius = Math.max(6, Math.min(26, 4 + totalScore * 0.05));
          const isSelected = selectedPair?.villageId === villageId;

          return (
            <CircleMarker
              key={villageId}
              center={coords}
              radius={markerRadius}
              fillColor={markerColor}
              color={isSelected ? '#0070f3' : '#ffffff'}
              weight={isSelected ? 3.5 : 2}
              fillOpacity={isSelected ? 0.95 : 0.7}
              eventHandlers={{
                click: () => {
                  if (onSelectVillage && themes.length > 0) {
                    onSelectVillage(villageId, themes[0].themeId);
                  }
                }
              }}
            >
              {/* 4. Click Marker Popup */}
              <Popup>
                <div className="min-w-[190px] text-[#171717] dark:text-zinc-200 p-2 font-sans">
                  <h4 className="font-bold text-sm border-b border-[#ebebeb] pb-1 mb-2 font-mono">
                    {villageName}
                  </h4>
                  
                  {/* Top 2 Themes by priorityScore */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="text-[#888888] font-medium uppercase tracking-wider text-[10px] font-mono">
                      Top Concerns:
                    </div>
                    {themes.slice(0, 2).map((t, idx) => (
                      <div key={t.themeId} className="flex justify-between items-center">
                        <span className="font-medium text-[#171717] dark:text-zinc-150">
                          {idx + 1}. {t.themeLabel}
                        </span>
                        <span className="font-mono font-bold text-[#888888]">
                          {t.priorityScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#ebebeb] flex justify-between text-[11px] text-[#888888] font-mono">
                    <span>Cumulative score:</span>
                    <span className="font-mono font-bold text-[#171717] dark:text-zinc-100">{totalScore.toFixed(1)}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* 5. Legend in bottom-right */}
      <div className="absolute bottom-6 right-6 z-[1000] w-64 max-w-[calc(100vw-3rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-xs flex flex-col gap-3 font-sans box-border whitespace-normal break-words items-center">
        <div className="font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-700 pb-2 w-full text-center">
          Map Legend
        </div>
        
        {/* Color meaning */}
        <div className="flex flex-col gap-2 w-full items-center">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Severity (Max Score)</div>
          <div className="flex items-center gap-2 justify-center w-full">
            <span className="w-3 h-3 rounded-full bg-[#ee0000] shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">High concern (&ge;75)</span>
          </div>
          <div className="flex items-center gap-2 justify-center w-full">
            <span className="w-3 h-3 rounded-full bg-[#f5a623] shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Medium concern (50-74)</span>
          </div>
          <div className="flex items-center gap-2 justify-center w-full">
            <span className="w-3 h-3 rounded-full bg-[#888888] shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Low concern (&lt;50)</span>
          </div>
        </div>

        {/* Size meaning */}
        <div className="flex flex-col gap-1 border-t border-zinc-200 dark:border-zinc-700 pt-3 w-full items-center">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Marker Size</div>
          <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px] text-center">
            Scaled based on cumulative priority score summed across all 7 themes.
          </div>
        </div>
      </div>
    </div>
  );
}
