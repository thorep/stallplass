'use client';

interface StatItem {
  label: string;
  value: string | number;
}

interface AdminStatGroupProps {
  title: string;
  stats: StatItem[];
}

export function AdminStatGroup({ title, stats }: AdminStatGroupProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-medium text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-slate-600">{stat.label}</span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}