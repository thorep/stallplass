'use client';

import { useState } from 'react';
import { BasePrice, PricingDiscount } from '@prisma/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PricingAdminProps {
  initialBasePrice: BasePrice;
  initialSponsoredPrice?: BasePrice;
  initialDiscounts: PricingDiscount[];
}

export function PricingAdmin({ initialBasePrice, initialSponsoredPrice, initialDiscounts }: PricingAdminProps) {
  const { user } = useAuth();
  const [basePrice, setBasePrice] = useState(initialBasePrice);
  const [sponsoredPrice, setSponsoredPrice] = useState(initialSponsoredPrice);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBasePrice, setEditingBasePrice] = useState(false);
  const [editingSponsoredPrice, setEditingSponsoredPrice] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<PricingDiscount | null>(null);
  const [showAddDiscount, setShowAddDiscount] = useState(false);

  const handleUpdateBasePrice = async (price: number) => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ price }),
      });

      if (response.ok) {
        const updatedPrice = await response.json();
        setBasePrice(updatedPrice);
        setEditingBasePrice(false);
        toast.success('Grunnpris oppdatert!');
      } else {
        const errorData = await response.json();
        toast.error(`Feil ved oppdatering: ${errorData.error || 'Ukjent feil'}`);
      }
    } catch (error) {
      console.error('Error updating base price:', error);
      toast.error('Feil ved oppdatering av grunnpris');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSponsoredPrice = async (price: number) => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/pricing/sponsored', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ price }),
      });

      if (response.ok) {
        const updatedPrice = await response.json();
        setSponsoredPrice(updatedPrice);
        setEditingSponsoredPrice(false);
        toast.success('Pris for betalt plassering oppdatert!');
      } else {
        const errorData = await response.json();
        toast.error(`Feil ved oppdatering: ${errorData.error || 'Ukjent feil'}`);
      }
    } catch (error) {
      console.error('Error updating sponsored price:', error);
      toast.error('Feil ved oppdatering av pris for betalt plassering');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscount = async (months: number, percentage: number, isActive: boolean) => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ months, percentage, isActive }),
      });

      if (response.ok) {
        const newDiscount = await response.json();
        setDiscounts([...discounts, newDiscount]);
        setShowAddDiscount(false);
        toast.success('Rabatt opprettet!');
      } else {
        const errorData = await response.json();
        toast.error(`Feil ved opprettelse: ${errorData.error || 'Ukjent feil'}`);
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      toast.error('Feil ved opprettelse av rabatt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDiscount = async (id: string, months: number, percentage: number, isActive: boolean) => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, months, percentage, isActive }),
      });

      if (response.ok) {
        const updatedDiscount = await response.json();
        setDiscounts(discounts.map(discount => 
          discount.id === id ? updatedDiscount : discount
        ));
        setEditingDiscount(null);
        toast.success('Rabatt oppdatert!');
      } else {
        const errorData = await response.json();
        toast.error(`Feil ved oppdatering: ${errorData.error || 'Ukjent feil'}`);
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error('Feil ved oppdatering av rabatt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne rabatten?')) return;
    
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/admin/pricing/discounts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDiscounts(discounts.filter(discount => discount.id !== id));
        toast.success('Rabatt slettet!');
      } else {
        const errorData = await response.json();
        toast.error(`Feil ved sletting: ${errorData.error || 'Ukjent feil'}`);
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Feil ved sletting av rabatt');
    } finally {
      setIsLoading(false);
    }
  };

  const DiscountForm = ({ 
    discount, 
    onSubmit, 
    onCancel 
  }: { 
    discount?: PricingDiscount; 
    onSubmit: (months: number, percentage: number, isActive: boolean) => void; 
    onCancel: () => void; 
  }) => {
    const [months, setMonths] = useState(discount?.months || 1);
    const [percentage, setPercentage] = useState(discount?.percentage || 0);
    const [isActive, setIsActive] = useState(discount?.isActive ?? true);

    return (
      <div className="p-4 bg-slate-50 rounded-md space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Antall måneder
            </label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rabatt (%)
            </label>
            <input
              type="number"
              value={percentage * 100}
              onChange={(e) => setPercentage(parseFloat(e.target.value) / 100)}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-slate-700">Aktiv</span>
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(months, percentage, isActive)}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            {discount ? 'Oppdater' : 'Legg til'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Avbryt
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Base Price */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-slate-800">Grunnpris</h2>
          </div>
          <button
            onClick={() => setEditingBasePrice(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Rediger
          </button>
        </div>
        
        {editingBasePrice ? (
          <div className="p-4 bg-slate-50 rounded-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pris (kr)
              </label>
              <input
                type="number"
                defaultValue={basePrice.price}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="basePrice"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const priceInput = document.getElementById('basePrice') as HTMLInputElement;
                  handleUpdateBasePrice(parseInt(priceInput.value));
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                Lagre
              </button>
              <button
                onClick={() => setEditingBasePrice(false)}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border border-slate-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{basePrice.price} kr</p>
                <p className="text-sm text-slate-600">per boks per måned</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                basePrice.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {basePrice.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sponsored Placement Price */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-800">Betalt plassering</h2>
          </div>
          <button
            onClick={() => setEditingSponsoredPrice(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Rediger
          </button>
        </div>
        
        {editingSponsoredPrice ? (
          <div className="p-4 bg-slate-50 rounded-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pris (kr per dag)
              </label>
              <input
                type="number"
                defaultValue={sponsoredPrice?.price || 2}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="sponsoredPrice"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const priceInput = document.getElementById('sponsoredPrice') as HTMLInputElement;
                  handleUpdateSponsoredPrice(parseInt(priceInput.value));
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                Lagre
              </button>
              <button
                onClick={() => setEditingSponsoredPrice(false)}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border border-slate-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sponsoredPrice?.price || 2} kr
                </p>
                <p className="text-sm text-slate-600">per boks per dag</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                sponsoredPrice?.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {sponsoredPrice?.isActive !== false ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              <p>Staller kan betale denne prisen per dag for å få boksene sine øverst i søkeresultatene.</p>
              <p>Betalt plassering kan kun kjøpes for aktive bokser med annonsering.</p>
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
              Rabatter ({discounts.length})
            </h2>
          </div>
          <button
            onClick={() => setShowAddDiscount(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Legg til rabatt
          </button>
        </div>
        
        {showAddDiscount && (
          <div className="mb-4">
            <DiscountForm
              onSubmit={handleCreateDiscount}
              onCancel={() => setShowAddDiscount(false)}
            />
          </div>
        )}
        
        {editingDiscount && (
          <div className="mb-4">
            <DiscountForm
              discount={editingDiscount}
              onSubmit={(months, percentage, isActive) => 
                handleUpdateDiscount(editingDiscount.id, months, percentage, isActive)
              }
              onCancel={() => setEditingDiscount(null)}
            />
          </div>
        )}
        
        <div className="grid gap-3">
          {discounts.sort((a, b) => a.months - b.months).map((discount) => (
            <div key={discount.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-md">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {discount.months} {discount.months === 1 ? 'måned' : 'måneder'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {(discount.percentage * 100).toFixed(1)}% rabatt
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
                  onClick={() => setEditingDiscount(discount)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteDiscount(discount.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}