import { StableWithBoxStats } from '@/types/stable';
import StableCard from '@/components/molecules/StableCard';

interface StableGridProps {
  stables: StableWithBoxStats[];
  onViewDetails: (stableId: string) => void;
}

export default function StableGrid({ stables, onViewDetails }: StableGridProps) {
  if (stables.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Ingen staller funnet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stables.map((stable) => (
        <StableCard
          key={stable.id}
          stable={stable}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}