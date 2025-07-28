'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  BuildingOfficeIcon,
  PlusIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import BoxManagementModal from '@/components/organisms/BoxManagementModal';
import SponsoredPlacementModal from '@/components/molecules/SponsoredPlacementModal';
import { formatPrice } from '@/utils/formatting';
import { StableWithBoxStats, Box, BoxWithAmenities } from '@/types/stable';
import { useUpdateBoxAvailabilityStatus, useDeleteBox } from '@/hooks/useBoxMutations';
// import { updateBoxAvailabilityDate } from '@/services/box-service'; // TODO: Create API endpoint for availability date updates

interface StableBoxManagerProps {
  stable: StableWithBoxStats;
  boxes: Box[];
  boxesLoading: boolean;
  onRefetchBoxes: () => void;
  advertisingManager?: React.ReactNode;
}

export default function StableBoxManager({ 
  stable, 
  boxes, 
  boxesLoading, 
  onRefetchBoxes,
  advertisingManager 
}: StableBoxManagerProps) {
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showSponsoredModal, setShowSponsoredModal] = useState(false);
  const [selectedBoxForSponsored, setSelectedBoxForSponsored] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const updateBoxAvailability = useUpdateBoxAvailabilityStatus();
  const deleteBox = useDeleteBox();

  const handleAddBox = () => {
    setSelectedBox(null);
    setShowBoxModal(true);
  };

  const handleEditBox = (box: Box) => {
    setSelectedBox(box);
    setShowBoxModal(true);
  };

  const handleBoxSaved = async () => {
    // Trigger refetch immediately
    await onRefetchBoxes();
    
    // Close modal after refetch completes
    setShowBoxModal(false);
    setSelectedBox(null);
  };

  const handleToggleBoxAvailable = async (boxId: string, isAvailable: boolean) => {
    // Check for conflicts if trying to make unavailable
    if (!isAvailable) {
      // We'll use a simple approach here - you could also use the conflict prevention hook
      // for each box individually if needed
      const hasRental = false; // This would come from rental data
      
      if (hasRental) {
        alert('Kan ikke markere boksen som utilgjengelig da den har et aktivt leieforhold.');
        return;
      }
    }
    
    try {
      await updateBoxAvailability.mutateAsync({ boxId, isAvailable });
    } catch (_) {
      alert('Feil ved oppdatering av tilgjengelighet. Prøv igjen.');
    }
  };

  const handleSponsoredPlacement = (boxId: string, boxName: string) => {
    setSelectedBoxForSponsored({ id: boxId, name: boxName });
    setShowSponsoredModal(true);
  };

  const handleDeleteBox = async (boxId: string) => {
    if (deleteConfirmId !== boxId) {
      setDeleteConfirmId(boxId);
      return;
    }

    try {
      await deleteBox.mutateAsync(boxId);
      await onRefetchBoxes(); // Refresh the boxes list
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting box:', error);
      alert('Feil ved sletting av boks. Prøv igjen.');
      setDeleteConfirmId(null);
    }
  };

  const handleSetAvailabilityDate = async (boxId: string) => {
    const dateStr = prompt(
      'Når vil denne boksen bli ledig? Skriv datoen i formatet YYYY-MM-DD (f.eks. 2025-02-15):'
    );
    
    if (dateStr === null) return; // User cancelled
    
    if (dateStr === '') {
      // Remove availability date - TODO: Implement API endpoint
      alert('Funksjonalitet for tilgjengelighetsdato er midlertidig deaktivert.');
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
    
    // TODO: Implement API endpoint for availability date updates
    alert('Funksjonalitet for tilgjengelighetsdato er midlertidig deaktivert.');
    console.log('Would set availability date:', { boxId, dateStr });
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
            data-cy="add-box-button"
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Legg til boks
          </Button>
        </div>

        {/* Advertising Manager - integrated within box section */}
        {advertisingManager && (
          <div className="mb-6 -mx-6">
            {advertisingManager}
          </div>
        )}

        {boxesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-500 mt-2">Laster bokser...</p>
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Ingen bokser registrert ennå</p>
            <Button variant="primary" onClick={handleAddBox} data-cy="add-first-box-button">
              Legg til din første boks
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {boxes.map((box) => (
              <div 
                key={box.id} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-slate-100">
                  {box.images && box.images.length > 0 ? (
                    <Image 
                      src={box.images[0]} 
                      alt={`${box.name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-slate-500">Ingen bilder</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      box.isAvailable 
                        ? 'bg-emerald-500/90 text-white' 
                        : 'bg-red-500/90 text-white'
                    }`}>
                      {box.isAvailable ? 'Ledig' : 'Opptatt'}
                    </div>
                    {box.isSponsored && (
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/90 text-white backdrop-blur-sm">
                        ⭐ Boost aktiv
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{box.name}</h3>
                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                      {formatPrice(box.price)}<span className="text-sm font-normal text-slate-500">/mnd</span>
                    </div>
                    {box.size && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Størrelse:</span> {box.size} m²
                      </p>
                    )}
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(box as BoxWithAmenities).amenities?.slice(0, 3).map((amenityLink: { amenity: { name: string } }, index: number) => (
                        <span key={index} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                          {amenityLink.amenity.name}
                        </span>
                      ))}
                      {(box as BoxWithAmenities).amenities && (box as BoxWithAmenities).amenities!.length > 3 && (
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                          +{(box as BoxWithAmenities).amenities!.length - 3} flere
                        </span>
                      )}
                      {(!(box as BoxWithAmenities).amenities || (box as BoxWithAmenities).amenities?.length === 0) && (
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                          Ingen fasiliteter
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Header with delete icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1" />
                    <button 
                      onClick={() => handleDeleteBox(box.id)}
                      disabled={deleteBox.isPending}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirmId === box.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      } disabled:opacity-50`}
                      data-cy={`delete-box-${box.id}`}
                      title={deleteConfirmId === box.id ? 'Klikk for å bekrefte sletting' : 'Slett boks'}
                    >
                      {deleteConfirmId === box.id ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5">
                    {/* Primary Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleToggleBoxAvailable(box.id, !box.isAvailable)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          box.isAvailable 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                        }`}
                        data-cy={box.isAvailable ? `mark-rented-${box.id}` : `mark-available-${box.id}`}
                      >
                        {box.isAvailable ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Marker utleid
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Marker ledig
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleEditBox(box)}
                        className="px-3 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                        data-cy={`edit-box-${box.id}`}
                      >
                        <PencilIcon className="w-4 h-4" />
                        Rediger
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    {!box.isAvailable && (
                      <button 
                        onClick={() => handleSetAvailabilityDate(box.id)}
                        className="w-full px-3 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Angi ledig dato
                      </button>
                    )}

                    {/* Sponsored placement */}
                    {box.isAdvertised && (
                      <button 
                        onClick={() => handleSponsoredPlacement(box.id, box.name)}
                        className={`w-full px-3 py-2.5 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
                          box.isSponsored
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        }`}
                      >
                        <SparklesIcon className="w-4 h-4" />
                        {box.isSponsored ? 'Forleng boost' : 'Boost til topp'}
                      </button>
                    )}
                  </div>
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