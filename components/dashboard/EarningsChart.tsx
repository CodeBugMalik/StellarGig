'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Job } from '@/lib/types';

interface Props {
  jobs: Job[];
  mode: 'earned' | 'spent';
}

interface ChartDatum {
  name: string;
  amount: number;
  status: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: ChartDatum }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{payload[0].payload.name}</p>
      <p className="mt-0.5 text-zinc-400">{payload[0].value.toFixed(2)} XLM</p>
      <p className="text-zinc-600 capitalize">{payload[0].payload.status.replace('_', ' ')}</p>
    </div>
  );
};

export default function EarningsChart({ jobs, mode }: Props) {
  // Take last 8 jobs, show amount per job
  const data: ChartDatum[] = jobs.slice(-8).map((j, i) => ({
    name:   `Job #${j.id}`,
    amount: parseFloat(j.totalAmount) || 0,
    status: j.status,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-600">
        No {mode === 'earned' ? 'earnings' : 'spending'} data yet.
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    completed:   '#ffffff',
    in_progress: '#a1a1aa',
    funded:      '#71717a',
    open:        '#52525b',
  };

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((d, idx) => (
              <Cell key={idx} fill={colorMap[d.status] ?? '#3f3f46'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
