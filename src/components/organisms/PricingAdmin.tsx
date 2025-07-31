'use client';

import { useState } from 'react';
import { PricingDiscount } from '@/types';
import { useGetBasePricing, useGetDiscounts, usePutBasePricing, usePutDiscount, useDeleteDiscount } from '@/hooks/usePricing';
import { 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export function PricingAdmin() {
  // Use TanStack Query hooks for data fetching - these load from the database
  const { data: pricing, isLoading: pricingLoading } = useGetBasePricing();
  const { data: discounts, isLoading: discountsLoading } = useGetDiscounts();
  
  // Mutations
  const updatePricing = usePutBasePricing();
  const updateDiscount = usePutDiscount();
  const deleteDiscount = useDeleteDiscount();

  const isLoading = pricingLoading || discountsLoading;
  const [editingPricing, setEditingPricing] = useState(false);
  // Simplified discount editing type
  type EditingDiscountType = {
    id: string;
    days?: number;
    months?: number;
    percentage: number;
    isActive: boolean;
    type?: 'box' | 'service' | 'boost';
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  const [editingDiscount, setEditingDiscount] = useState<EditingDiscountType | null>(null);

  const handleUpdatePricing = async (boxAdvertising: number, boxBoost: number, serviceBase: number) => {
    try {
      await updatePricing.mutateAsync({
        boxAdvertising,
        boxBoost,
        serviceBase
      });
      setEditingPricing(false);
    } catch {
    }
  };


  const handleDeleteDiscount = async (id: string, type: 'box' | 'service' | 'boost') => {
    if (!confirm('Er du sikker på at du vil slette denne rabatten?')) return;
    
    try {
      await deleteDiscount.mutateAsync({ id, type });
    } catch {
    }
  };

  const handleUpdateDiscount = async (type: 'box' | 'service' | 'boost', months: number, days: number, percentage: number, isActive: boolean) => {
    if (!editingDiscount) return;
    
    try {
      await updateDiscount.mutateAsync({
        id: editingDiscount.id,
        type,
        months: (type === 'box' || type === 'service') ? months : undefined,
        days: type === 'boost' ? days : undefined,
        percentage,
        isActive
      });
      setEditingDiscount(null);
    } catch {
      // Error handling is done by the hook
    }
  };

  const DiscountForm = ({ 
    discount, 
    type = 'box',
    onSubmit, 
    onCancel 
  }: { 
    discount?: PricingDiscount | { id: string; days?: number; months?: number; percentage: number; isActive: boolean; type?: string; createdAt?: Date; updatedAt?: Date }; 
    type?: 'box' | 'service' | 'boost';
    onSubmit: (type: 'box' | 'service' | 'boost', months: number, days: number, percentage: number, isActive: boolean) => void; 
    onCancel: () => void; 
  }) => {
    const [months, setMonths] = useState(discount && 'months' in discount ? discount.months : 1);
    const [days, setDays] = useState(discount && 'days' in discount ? discount.days : 30);
    const [percentage, setPercentage] = useState(discount?.percentage || 0);
    const [isActive, setIsActive] = useState(discount?.isActive ?? true);
    const [discountType, setDiscountType] = useState<'box' | 'service' | 'boost'>(type);
    const [errors, setErrors] = useState<{months?: string; days?: string; percentage?: string}>({});

    // Validation
    const validateForm = () => {
      const newErrors: {months?: string; days?: string; percentage?: string} = {};
      
      if ((discountType === 'box' || discountType === 'service') && (!months || months < 1)) {
        newErrors.months = 'Måneder må være minst 1';
      }
      
      if (discountType === 'boost' && (!days || days < 1)) {
        newErrors.days = 'Dager må være minst 1';
      }
      
      if (!percentage || percentage <= 0 || percentage > 100) {
        newErrors.percentage = 'Rabatt må være mellom 0.1% og 100%';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle submit with validation
    const handleSubmit = () => {
      if (validateForm()) {
        onSubmit(discountType, months || 1, days || 1, percentage, isActive);
      }
    };

    return (
      <div className="p-4 bg-slate-50 rounded-md space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'box' | 'service' | 'boost')}
              disabled={!!discount} // Disable when editing existing discount
              className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!!discount ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              data-cy="discount-type-select"
            >
              <option value="box">Boksannonsering</option>
              <option value="boost">Boks boost</option>
              <option value="service">Tjenester</option>
            </select>
          </div>
          
          {(discountType === 'box' || discountType === 'service') ? (
            <div>
              <label htmlFor="discount-months" className="block text-sm font-medium text-slate-700 mb-1">
                Antall måneder
              </label>
              <input
                id="discount-months"
                type="number"
                value={months || ''}
                onChange={(e) => {
                  setMonths(parseInt(e.target.value) || 0);
                  if (errors.months) setErrors(prev => ({...prev, months: undefined}));
                }}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.months ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                data-cy="discount-months-input"
              />
              {errors.months && <p className="mt-1 text-sm text-red-600">{errors.months}</p>}
            </div>
          ) : discountType === 'boost' ? (
            <div>
              <label htmlFor="discount-days" className="block text-sm font-medium text-slate-700 mb-1">
                Antall dager
              </label>
              <input
                id="discount-days"
                type="number"
                value={days || ''}
                onChange={(e) => {
                  setDays(parseInt(e.target.value) || 0);
                  if (errors.days) setErrors(prev => ({...prev, days: undefined}));
                }}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.days ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                data-cy="discount-days-input"
              />
              {errors.days && <p className="mt-1 text-sm text-red-600">{errors.days}</p>}
            </div>
          ) : null}
          
          <div>
            <label htmlFor="discount-percentage" className="block text-sm font-medium text-slate-700 mb-1">
              Rabatt (%)
            </label>
            <input
              id="discount-percentage"
              type="number"
              value={isNaN(percentage) ? '' : percentage}
              onChange={(e) => {
                setPercentage(parseFloat(e.target.value) || 0);
                if (errors.percentage) setErrors(prev => ({...prev, percentage: undefined}));
              }}
              min="0.1"
              max="100"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.percentage ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              data-cy="discount-percentage-input"
            />
            {errors.percentage && <p className="mt-1 text-sm text-red-600">{errors.percentage}</p>}
          </div>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              data-cy="discount-active-checkbox"
            />
            <span className="ml-2 text-sm text-slate-700">Aktiv</span>
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            data-cy={discount ? "update-discount-button" : "save-discount-button"}
          >
            <CheckIcon className="h-4 w-4" />
            {discount ? 'Oppdater' : 'Legg til'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
            data-cy="cancel-discount-button"
          >
            <XMarkIcon className="h-4 w-4" />
            Avbryt
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8" data-cy="pricing-section">
      {/* All Pricing */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-slate-800">Priser</h2>
          </div>
          <button
            onClick={() => setEditingPricing(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2"
            data-cy="edit-pricing-button"
          >
            <PencilIcon className="h-4 w-4" />
            Rediger
          </button>
        </div>
        
        {editingPricing ? (
          <div className="p-4 bg-slate-50 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Boksannonsering (kr per måned)
                </label>
                <input
                  type="number"
                  defaultValue={pricing?.boxAdvertising?.price || 10}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="boxAdvertisingPrice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Boks boost (kr per dag)
                </label>
                <input
                  type="number"
                  defaultValue={pricing?.boxBoost?.price || 2}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="boxBoostPrice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tjenester (kr per dag)
                </label>
                <input
                  type="number"
                  defaultValue={pricing?.serviceBase?.price || 2}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="serviceBasePrice"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const boxAdvertisingInput = document.getElementById('boxAdvertisingPrice') as HTMLInputElement;
                  const boxBoostInput = document.getElementById('boxBoostPrice') as HTMLInputElement;
                  const serviceBaseInput = document.getElementById('serviceBasePrice') as HTMLInputElement;
                  
                  handleUpdatePricing(
                    parseInt(boxAdvertisingInput.value),
                    parseInt(boxBoostInput.value),
                    parseInt(serviceBaseInput.value)
                  );
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                data-cy="save-pricing-button"
              >
                <CheckIcon className="h-4 w-4" />
                Lagre
              </button>
              <button
                onClick={() => setEditingPricing(false)}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box Advertising */}
            <div className="p-4 bg-white border border-slate-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-cy="box-advertising-price">{pricing?.boxAdvertising?.price || 10} kr</p>
                  <p className="text-sm text-slate-600">per boks per måned</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pricing?.boxAdvertising?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Aktiv
                </span>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-medium">Boksannonsering</p>
                <p>Månedlig pris for å vise bokser i offentlige søk</p>
              </div>
            </div>

            {/* Box Boost */}
            <div className="p-4 bg-white border border-slate-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-cy="box-boost-price">{pricing?.boxBoost?.price || 2} kr</p>
                  <p className="text-sm text-slate-600">per boks per dag</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pricing?.boxBoost?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Aktiv
                </span>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-medium">Boks boost</p>
                <p>Daglig pris for prioritert plassering i søkeresultater</p>
              </div>
            </div>

            {/* Service Base */}
            <div className="p-4 bg-white border border-slate-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900" data-cy="service-base-price">{pricing?.serviceBase?.price || 2} kr</p>
                  <p className="text-sm text-slate-600">per dag</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pricing?.serviceBase?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Aktiv
                </span>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-medium">Tjenester</p>
                <p>Daglig grunnpris for tjenesteannonser</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TagIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-slate-800">
              Rabatter ({(discounts?.boxDiscounts?.length || 0) + (discounts?.boostDiscounts?.length || 0) + (discounts?.serviceDiscounts?.length || 0)})
            </h2>
          </div>
        </div>
        
        {editingDiscount && (
          <div className="mb-4">
            <DiscountForm
              discount={editingDiscount}
              type={editingDiscount?.type || 'box'}
              onSubmit={handleUpdateDiscount}
              onCancel={() => setEditingDiscount(null)}
            />
          </div>
        )}
        
        <div className="space-y-6">
          {/* Box Advertising Discounts */}
          <div data-cy="box-discounts-section">
            <h3 className="text-lg font-medium text-slate-800 mb-3">Boksannonsering rabatter</h3>
            <div className="grid gap-3">
              {discounts?.boxDiscounts?.sort((a: PricingDiscount, b: PricingDiscount) => a.months - b.months).map((discount: PricingDiscount) => (
                <div key={discount.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-md">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {discount.months} {discount.months === 1 ? 'måned' : 'måneder'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {discount.percentage.toFixed(1)}% rabatt
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingDiscount({...discount, type: 'box'})}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      data-cy="edit-discount-button"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id, 'box')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      data-cy="delete-discount-button"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) || <p className="text-slate-500 text-sm">Ingen rabatter opprettet</p>}
            </div>
          </div>

          {/* Box Boost Discounts */}
          <div data-cy="boost-discounts-section">
            <h3 className="text-lg font-medium text-slate-800 mb-3">Boks boost rabatter</h3>
            <div className="grid gap-3">
              {discounts?.boostDiscounts?.sort((a: {days: number}, b: {days: number}) => a.days - b.days).map((discount: {id: string; days: number; percentage: number; isActive: boolean}) => (
                <div key={discount.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-md">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {discount.days} {discount.days === 1 ? 'dag' : 'dager'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {discount.percentage.toFixed(1)}% rabatt
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingDiscount({...discount, type: 'boost'})}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id, 'boost')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) || <p className="text-slate-500 text-sm">Ingen rabatter opprettet</p>}
            </div>
          </div>

          {/* Service Discounts */}
          <div data-cy="service-discounts-section">
            <h3 className="text-lg font-medium text-slate-800 mb-3">Tjeneste rabatter</h3>
            <div className="grid gap-3">
              {discounts?.serviceDiscounts?.sort((a: {months: number}, b: {months: number}) => a.months - b.months).map((discount: {id: string; months: number; percentage: number; isActive: boolean}) => (
                <div key={discount.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-md">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {discount.months} {discount.months === 1 ? 'måned' : 'måneder'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {discount.percentage.toFixed(1)}% rabatt
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingDiscount({...discount, type: 'service'})}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id, 'service')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) || <p className="text-slate-500 text-sm">Ingen rabatter opprettet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}