'use client';

import { ReactNode } from 'react';

interface AdminStatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: 'green' | 'slate' | 'red';
}

export function AdminStatsCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  subtitleColor = 'slate' 
}: AdminStatsCardProps) {
  const subtitleColorClasses = {
    green: 'text-green-600',
    slate: 'text-slate-600',
    red: 'text-red-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center">
        {icon}
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className={`text-xs ${subtitleColorClasses[subtitleColor]}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}