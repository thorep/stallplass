'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  BuildingOfficeIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import BoxManagementModal from '@/components/organisms/BoxManagementModal';
import SponsoredPlacementModal from '@/components/molecules/SponsoredPlacementModal';
import { formatPrice } from '@/utils/formatting';
import { StableWithBoxStats, Box, BoxWithAmenities } from '@/types/stable';
import { useUpdateBox } from '@/hooks/useQueries';
import { updateBoxAvailabilityDate } from '@/services/box-service';

interface StableBoxManagerProps {
  stable: StableWithBoxStats;
  boxes: Box[];
  boxesLoading: boolean;
  onRefetchBoxes: () => void;
}

export default function StableBoxManager({ 
  stable, 
  boxes, 
  boxesLoading, 
  onRefetchBoxes 
}: StableBoxManagerProps) {
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showSponsoredModal, setShowSponsoredModal] = useState(false);
  const [selectedBoxForSponsored, setSelectedBoxForSponsored] = useState<{ id: string; name: string } | null>(null);
  
  const updateBox = useUpdateBox();

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
    onRefetchBoxes();
  };

  const handleToggleBoxAvailable = async (boxId: string, is_available: boolean) => {
    // Check for conflicts if trying to make unavailable
    if (!is_available) {
      // We'll use a simple approach here - you could also use the conflict prevention hook
      // for each box individually if needed
      const hasRental = false; // This would come from rental data
      
      if (hasRental) {
        alert('Kan ikke markere boksen som utilgjengelig da den har et aktivt leieforhold.');
        return;
      }
    }
    
    try {
      await updateBox.mutateAsync({ id: boxId, is_available: is_available });
    } catch (error) {
      console.error('Error updating box availability:', error);
      alert('Feil ved oppdatering av tilgjengelighet. Prøv igjen.');
    }
  };

  const handleSponsoredPlacement = (boxId: string, boxName: string) => {
    setSelectedBoxForSponsored({ id: boxId, name: boxName });
    setShowSponsoredModal(true);
  };

  const handleSetAvailabilityDate = async (boxId: string) => {
    const dateStr = prompt(
      'Når vil denne boksen bli ledig? Skriv datoen i formatet YYYY-MM-DD (f.eks. 2025-02-15):'
    );
    
    if (dateStr === null) return; // User cancelled
    
    if (dateStr === '') {
      // Remove availability date
      try {
        await updateBoxAvailabilityDate(boxId, null);
        onRefetchBoxes();
      } catch (error) {
        console.error('Error removing availability date:', error);
        alert('Feil ved fjerning av tilgjengelighetsdato. Prøv igjen.');
      }
      return;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      alert('Ugyldig datoformat. Bruk YYYY-MM-DD (f.eks. 2025-02-15)');
      return;
    }
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
      alert('Ugyldig dato. Prøv igjen med gyldig dato.');
      return;
    }
    
    if (date <= today) {
      alert('Datoen må være i fremtiden.');
      return;
    }
    
    try {
      await updateBoxAvailabilityDate(boxId, dateStr);
      onRefetchBoxes();
    } catch (error) {
      console.error('Error setting availability date:', error);
      alert('Feil ved setting av tilgjengelighetsdato. Prøv igjen.');
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
            <p className="text-sm text-slate-600 mt-1">
              Administrer og rediger dine stallbokser nedenfor
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleAddBox}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
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
                  <div className="flex items-center gap-3">
                    {box.images && box.images.length > 0 ? (
                      <Image 
                        src={box.images[0]} 
                        alt={`${box.name} thumbnail`}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <h5 className="font-semibold text-slate-900">{box.name}</h5>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                      box.is_available 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {box.is_available ? 'Ledig' : 'Opptatt'}
                    </div>
                    {box.is_sponsored && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium text-center bg-purple-100 text-purple-700">
                        Boost aktiv
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                  <div>Pris: <span className="font-medium text-slate-900">{formatPrice(box.price)}/mnd</span></div>
                  {box.size && <div>Størrelse: {box.size} m²</div>}
                  {!box.is_available && box.available_from_date && (
                    <div className="text-orange-600">
                      Ledig fra: <span className="font-medium">{new Date(box.available_from_date).toLocaleDateString('nb-NO')}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(box as BoxWithAmenities).amenities?.map((amenityLink: { amenity: { name: string } }, index: number) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded text-center">
                        {amenityLink.amenity.name}
                      </span>
                    ))}
                    {(!(box as BoxWithAmenities).amenities || (box as BoxWithAmenities).amenities?.length === 0) && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded text-center">Ingen fasiliteter</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleBoxAvailable(box.id, !box.is_available)}
                      className={`flex-1 text-sm py-3 px-4 rounded-md font-medium transition-colors ${
                        box.is_available 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {box.is_available ? 'Marker som utleid' : 'Marker som ledig'}
                    </button>
                  </div>
                  <button 
                    onClick={() => handleEditBox(box)}
                    className="w-full text-sm py-3 px-4 bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 font-medium rounded-md transition-colors"
                  >
                    Rediger boks
                  </button>
                  {!box.is_available && (
                    <button 
                      onClick={() => handleSetAvailabilityDate(box.id)}
                      className="w-full text-sm py-3 px-4 bg-orange-50 text-orange-600 hover:text-orange-700 hover:bg-orange-100 font-medium rounded-md transition-colors"
                    >
                      {box.available_from_date ? 'Oppdater ledighetsdato' : 'Angi når den blir ledig'}
                    </button>
                  )}
                  {box.is_active && stable.advertising_active && (
                    box.is_sponsored ? (
                      <button 
                        onClick={() => handleSponsoredPlacement(box.id, box.name)}
                        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Forleng boost
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSponsoredPlacement(box.id, box.name)}
                        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Boost til topp i søk
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
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

      {/* Sponsored Placement Modal */}
      {showSponsoredModal && selectedBoxForSponsored && (
        <SponsoredPlacementModal
          boxId={selectedBoxForSponsored.id}
          boxName={selectedBoxForSponsored.name}
          isOpen={showSponsoredModal}
          onClose={() => {
            setShowSponsoredModal(false);
            setSelectedBoxForSponsored(null);
          }}
        />
      )}
    </>
  );
}