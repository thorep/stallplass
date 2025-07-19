import { BoxWithStable } from '@/types/stable';
import BoxCard from '@/components/molecules/BoxCard';

interface BoxGridProps {
  boxes: BoxWithStable[];
  className?: string;
}

export default function BoxGrid({ boxes, className = '' }: BoxGridProps) {
  if (boxes.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">Ingen bokser tilgjengelig for øyeblikket.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {boxes.map((box) => (
        <BoxCard key={box.id} box={box} />
      ))}
    </div>
  );
}