'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import BoxManagementModal from './BoxManagementModal';
import { StableWithBoxStats, Box } from '@/types/stable';

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stableId: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({ stable, onDelete, deleteLoading }: StableManagementCardProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxesLoading, setBoxesLoading] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch boxes for this stable
  const fetchBoxes = useCallback(async () => {
    setBoxesLoading(true);
    try {
      const response = await fetch(`/api/stables/${stable.id}/boxes`);
      if (response.ok) {
        const data = await response.json();
        setBoxes(data);
      }
    } catch (error) {
      console.error('Error fetching boxes:', error);
    } finally {
      setBoxesLoading(false);
    }
  }, [stable.id]);

  useEffect(() => {
    if (expanded) {
      fetchBoxes();
    }
  }, [expanded, stable.id, fetchBoxes]);

  const availableBoxes = boxes.filter(box => box.isAvailable).length;
  const totalBoxes = boxes.length;
  const priceRange = boxes.length > 0 ? {
    min: Math.min(...boxes.map(b => b.price)),
    max: Math.max(...boxes.map(b => b.price))
  } : null;

  const handleAddBox = () => {
    setSelectedBox(null);
    setShowBoxModal(true);
  };

  const handleEditBox = (box: Box) => {
    setSelectedBox(box);
    setShowBoxModal(true);
  };

  const handleBoxSaved = () => {
    setShowBoxModal(false);
    setSelectedBox(null);
    fetchBoxes(); // Refresh boxes
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{stable.name}</h3>
              <div className="flex items-center text-slate-600 mb-2">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{stable.location}</span>
                {stable.city && <span className="text-sm ml-1">• {stable.city}</span>}
              </div>
              <p className="text-slate-600 text-sm line-clamp-2">{stable.description}</p>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title={expanded ? "Skjul bokser" : "Vis bokser"}
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => onDelete(stable.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                disabled={deleteLoading}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{totalBoxes}</div>
              <div className="text-sm text-slate-500">Totalt bokser</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{availableBoxes}</div>
              <div className="text-sm text-slate-500">Ledige</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {priceRange ? `${priceRange.min.toLocaleString()}-${priceRange.max.toLocaleString()}` : '0'}
              </div>
              <div className="text-sm text-slate-500">Prisklasse (kr)</div>
            </div>
          </div>
        </div>

        {/* Box Management */}
        {expanded && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleAddBox}
                className="flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Legg til boks
              </Button>
            </div>

            {boxesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-slate-500 mt-2">Laster bokser...</p>
              </div>
            ) : boxes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">Ingen bokser registrert ennå</p>
                <Button variant="primary" onClick={handleAddBox}>
                  Legg til din første boks
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boxes.map((box) => (
                  <div 
                    key={box.id} 
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold text-slate-900">{box.name}</h5>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        box.isAvailable 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {box.isAvailable ? 'Ledig' : 'Opptatt'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div>Pris: <span className="font-medium text-slate-900">{box.price.toLocaleString()} kr/mnd</span></div>
                      {box.size && <div>Størrelse: {box.size} m²</div>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {box.isIndoor && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Innendørs</span>}
                        {box.hasWindow && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Vindu</span>}
                        {box.hasElectricity && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Strøm</span>}
                        {box.hasWater && <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">Vann</span>}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleEditBox(box)}
                      className="mt-3 w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Rediger boks
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Box Modal */}
      {showBoxModal && (
        <BoxManagementModal
          stableId={stable.id}
          box={selectedBox}
          onClose={() => setShowBoxModal(false)}
          onSave={handleBoxSaved}
        />
      )}
    </>
  );
}