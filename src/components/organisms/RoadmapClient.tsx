'use client';

import { RoadmapItem, RoadmapStatus } from '@/types';
import { CheckCircleIcon, ClockIcon, PlayCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface RoadmapClientProps {
  initialItems: RoadmapItem[];
}

const statusConfig = {
  PLANNED: {
    icon: ClockIcon,
    label: 'Planlagt',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
  },
  IN_PROGRESS: {
    icon: PlayCircleIcon,
    label: 'Under utvikling',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  COMPLETED: {
    icon: CheckCircleIcon,
    label: 'Ferdig',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  CANCELLED: {
    icon: XCircleIcon,
    label: 'Avbrutt',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const priorityConfig = {
  LOW: {
    label: 'Lav',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
  },
  MEDIUM: {
    label: 'Middels',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  HIGH: {
    label: 'Høy',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  CRITICAL: {
    label: 'Kritisk',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export function RoadmapClient({ initialItems }: RoadmapClientProps) {
  const groupedItems = initialItems.reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = [];
    }
    acc[item.status].push(item);
    return acc;
  }, {} as Record<RoadmapStatus, RoadmapItem[]>);

  const statusOrder: RoadmapStatus[] = ['IN_PROGRESS', 'PLANNED', 'COMPLETED'];

  return (
    <div className="space-y-8">
      {statusOrder.map((status) => {
        const items = groupedItems[status] || [];
        if (items.length === 0) return null;

        const config = statusConfig[status];
        const Icon = config.icon;

        return (
          <div key={status} className="space-y-4">
            <div className="flex items-center gap-3">
              <Icon className={`h-6 w-6 ${config.color}`} />
              <h2 className="text-xl font-semibold text-slate-800">
                {config.label}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                {items.length}
              </span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const priorityConf = priorityConfig[item.priority];
                
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                        {item.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConf.bgColor} ${priorityConf.color} ml-2 flex-shrink-0`}>
                        {priorityConf.label}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {item.category}
                      </span>
                      
                      {item.estimatedDate && status !== 'COMPLETED' && (
                        <span>
                          Estimert: {format(new Date(item.estimatedDate), 'MMM yyyy', { locale: nb })}
                        </span>
                      )}
                      
                      {item.completedDate && status === 'COMPLETED' && (
                        <span>
                          Ferdig: {format(new Date(item.completedDate), 'MMM yyyy', { locale: nb })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {initialItems.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Ingen funksjoner planlagt
          </h3>
          <p className="text-slate-500">
            Roadmap oppdateringer kommer snart!
          </p>
        </div>
      )}
    </div>
  );
}