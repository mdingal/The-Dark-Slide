import React, { useMemo } from 'react';
import { PracticeSession } from '../../domain/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { BASE_TRICKS } from '../../domain/catalog';

interface DashboardChartsProps {
  sessions: PracticeSession[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return null;
  }

  // 1. Stance frequency (Generated vs Practiced Attempts)
  const stanceData = useMemo(() => {
    const counts: Record<string, { generated: number; attempts: number }> = {
      regular: { generated: 0, attempts: 0 },
      fakie: { generated: 0, attempts: 0 },
      switch: { generated: 0, attempts: 0 },
      nollie: { generated: 0, attempts: 0 },
    };

    sessions.forEach((s) => {
      const stance =
        s.trickResult.singleTrick?.stance ||
        s.trickResult.comboSteps?.[0]?.parameters.stance ||
        'regular';
      if (counts[stance]) {
        counts[stance].generated += 1;
        counts[stance].attempts += s.attemptCount;
      }
    });

    return Object.entries(counts).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      generated: data.generated,
      attempts: data.attempts,
    }));
  }, [sessions]);

  // 2. Base Trick frequency: Separate generated vs practiced attempts.
  // Note: For combos, constituent tricks are each counted individually.
  const trickData = useMemo(() => {
    const trickMap: Record<string, { name: string; generated: number; attempts: number }> = {};

    BASE_TRICKS.forEach((b) => {
      trickMap[b.id] = { name: b.name, generated: 0, attempts: 0 };
    });

    sessions.forEach((s) => {
      if (s.trickResult.mode === 'single' && s.trickResult.singleTrick) {
        const id = s.trickResult.singleTrick.baseTrickId;
        if (trickMap[id]) {
          trickMap[id].generated += 1;
          trickMap[id].attempts += s.attemptCount;
        }
      } else if (s.trickResult.mode === 'combo' && s.trickResult.comboSteps) {
        // Count each constituent trick in the combo!
        s.trickResult.comboSteps.forEach((step) => {
          const id = step.parameters.baseTrickId;
          if (trickMap[id]) {
            trickMap[id].generated += 1;
            // Attribute session attempts proportionally to constituent tricks
            trickMap[id].attempts += s.attemptCount;
          }
        });
      } else if (s.trickResult.mode === 'obstacle' && s.trickResult.obstacleData) {
        const entryId = s.trickResult.obstacleData.entryTrickId;
        if (trickMap[entryId]) {
          trickMap[entryId].generated += 1;
          trickMap[entryId].attempts += s.attemptCount;
        }
      }
    });

    // Sort by most practiced / generated, take top 8
    return Object.values(trickMap)
      .filter((t) => t.generated > 0 || t.attempts > 0)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 8);
  }, [sessions]);

  // 3. Status distribution
  const statusData = useMemo(() => {
    const counts = { success: 0, pending: 0, failed: 0 };
    sessions.forEach((s) => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });

    return [
      { name: 'Success', value: counts.success, color: '#10B981' },
      { name: 'Pending', value: counts.pending, color: '#F59E0B' },
      { name: 'Failed', value: counts.failed, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [sessions]);

  // 4. Deck Width & Wheel Frequencies
  const deckWidthData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = `${s.setupSnapshot.deckWidthMm}mm`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [sessions]);

  const wheelData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = s.setupSnapshot.wheelMaterial;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));
  }, [sessions]);

  const obstacleData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const key =
        (s.trickResult.mode === 'obstacle'
          ? s.trickResult.obstacleData?.obstacleType || s.setupSnapshot.obstacleType
          : s.setupSnapshot.obstacleType) || 'flatground';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
      count,
    }));
  }, [sessions]);

  // 5. Histograms: Attempts distribution
  const attemptHistogramData = useMemo(() => {
    const buckets = [
      { range: '0 (Unattempted)', count: 0 },
      { range: '1–5', count: 0 },
      { range: '6–15', count: 0 },
      { range: '16–30', count: 0 },
      { range: '31+', count: 0 },
    ];

    sessions.forEach((s) => {
      const att = s.attemptCount;
      if (att === 0) buckets[0].count++;
      else if (att <= 5) buckets[1].count++;
      else if (att <= 15) buckets[2].count++;
      else if (att <= 30) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [sessions]);

  // 6. Practice Duration Histogram
  const durationHistogramData = useMemo(() => {
    const buckets = [
      { range: '< 2 min', count: 0 },
      { range: '2–5 min', count: 0 },
      { range: '5–10 min', count: 0 },
      { range: '10–20 min', count: 0 },
      { range: '20+ min', count: 0 },
    ];

    sessions.forEach((s) => {
      const mins = s.activeDurationMs / 60000;
      if (mins < 2) buckets[0].count++;
      else if (mins < 5) buckets[1].count++;
      else if (mins < 10) buckets[2].count++;
      else if (mins < 20) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [sessions]);

  // 7. Practice activity over time (attempts and landings by date)
  const timelineData = useMemo(() => {
    const map: Record<string, { date: string; attempts: number; landings: number }> = {};

    // Sort sessions chronologically
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
    );

    sorted.forEach((s) => {
      const dateKey = new Date(s.generatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, attempts: 0, landings: 0 };
      }
      map[dateKey].attempts += s.attemptCount;
      map[dateKey].landings += s.landingCount;
    });

    return Object.values(map);
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Row 1: Stance & Base Trick Frequencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stance Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Stance Distribution
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Generated challenges vs. actual practice attempts by stance.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="generated" name="Generated Challenges" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attempts" name="Actual Practice Attempts" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Base Trick Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Trick Frequency (Top Catalog Entries)
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Constituent tricks in combos are counted individually.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trickData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="attempts" name="Attempts Practiced" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="generated" name="Times Generated" fill="#6B7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Status Distribution & Practice Activity Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Session Status Distribution
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Outcome breakdown across all filtered sessions.
            </p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">No status data</p>
            )}
          </div>
        </div>

        {/* Practice Activity Over Time */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Practice Activity Over Time
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Daily attempts and completed landings.
            </p>
          </div>
          <div className="h-64 w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attempts"
                    name="Attempts"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="landings"
                    name="Landings"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-neutral-600 dark:text-neutral-400">
                No activity history available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Histograms (Attempts & Duration) & Setup Frequencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attempts Histogram */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Attempt Count Histogram
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Distribution of attempts per challenge.
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attemptHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" name="Sessions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Practice Duration Histogram */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Duration Histogram
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Active minutes spent on trick sessions.
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" name="Sessions" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Setup Parameters (Deck Widths & Obstacles) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Deck Width Frequency
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
              Hardware widths logged across practice.
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deckWidthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" name="Sessions" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
