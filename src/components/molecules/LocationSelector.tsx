'use client';

import { useState, useEffect } from 'react';
import { useFylker, useKommuner, useTettsteder } from '@/hooks/useLocationQueries';
import type { Fylke, KommuneWithFylke, TettstedWithKommune } from '@/hooks/useLocationQueries';

interface LocationSelectorProps {
  selectedFylkeId?: string;
  selectedKommuneId?: string;
  selectedTettstedId?: string;
  onFylkeChange?: (fylke: Fylke | null) => void;
  onKommuneChange?: (kommune: KommuneWithFylke | null) => void;
  onTettstedChange?: (tettsted: TettstedWithKommune | null) => void;
  showTettsteder?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function LocationSelector({
  selectedFylkeId,
  selectedKommuneId,
  selectedTettstedId,
  onFylkeChange,
  onKommuneChange,
  onTettstedChange,
  showTettsteder = false,
  disabled = false,
  className = ''
}: LocationSelectorProps) {
  const [internalFylkeId, setInternalFylkeId] = useState(selectedFylkeId);
  const [internalKommuneId, setInternalKommuneId] = useState(selectedKommuneId);

  const { data: fylker, isLoading: loadingFylker } = useFylker();
  const { data: kommuner, isLoading: loadingKommuner } = useKommuner(internalFylkeId);
  const { data: tettsteder, isLoading: loadingTettsteder } = useTettsteder(internalKommuneId);

  // Update internal state when props change
  useEffect(() => {
    setInternalFylkeId(selectedFylkeId);
  }, [selectedFylkeId]);

  useEffect(() => {
    setInternalKommuneId(selectedKommuneId);
  }, [selectedKommuneId]);

  const handleFylkeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const fylkeId = value || undefined;
    setInternalFylkeId(fylkeId);
    setInternalKommuneId(undefined);
    
    const selectedFylke = fylkeId ? fylker?.find(f => f.id === fylkeId) || null : null;
    onFylkeChange?.(selectedFylke);
    onKommuneChange?.(null);
    onTettstedChange?.(null);
  };

  const handleKommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const kommuneId = value || undefined;
    setInternalKommuneId(kommuneId);
    
    const selectedKommune = kommuneId ? kommuner?.find(k => k.id === kommuneId) || null : null;
    onKommuneChange?.(selectedKommune);
    onTettstedChange?.(null);
  };

  const handleTettstedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedTettsted = value ? tettsteder?.find(t => t.id === value) || null : null;
    onTettstedChange?.(selectedTettsted);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Fylke selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fylke
        </label>
        <select
          value={internalFylkeId || ''}
          onChange={handleFylkeChange}
          disabled={disabled || loadingFylker}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Velg fylke...</option>
          {fylker?.map((fylke) => (
            <option key={fylke.id} value={fylke.id}>
              {fylke.navn}
            </option>
          ))}
        </select>
      </div>

      {/* Kommune selector - only show if fylke is selected */}
      {internalFylkeId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kommune
          </label>
          <select
            value={internalKommuneId || ''}
            onChange={handleKommuneChange}
            disabled={disabled || loadingKommuner}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Hele fylket</option>
            {kommuner?.map((kommune) => (
              <option key={kommune.id} value={kommune.id}>
                {kommune.navn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tettsted selector - only show if kommune is selected and showTettsteder is true */}
      {showTettsteder && internalKommuneId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tettsted / By
          </label>
          <select
            value={selectedTettstedId || ''}
            onChange={handleTettstedChange}
            disabled={disabled || loadingTettsteder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Hele kommunen</option>
            {tettsteder?.map((tettsted) => (
              <option key={tettsted.id} value={tettsted.id}>
                {tettsted.navn}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}