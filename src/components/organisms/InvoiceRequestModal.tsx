'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { usePostInvoiceRequest } from '@/hooks/useInvoiceRequests';
import { type InvoiceItemType } from '@/generated/prisma';

interface InvoiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemType: InvoiceItemType;
  amount: number;
  totalAmount: number;
  discount: number;
  description: string;
  months?: number;
  days?: number;
  stableId?: string;
  serviceId?: string;
  boxId?: string;
}

export function InvoiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  itemType,
  amount,
  totalAmount,
  discount,
  description,
  months,
  days,
  stableId,
  serviceId,
  boxId
}: InvoiceRequestModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: ''
  });
  const createInvoiceRequest = usePostInvoiceRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInvoiceRequest.mutateAsync({
        ...formData,
        amount,
        totalAmount,
        discount,
        description,
        itemType,
        months,
        days,
        stableId,
        serviceId,
        boxId
      });

      onSuccess();
      onClose();
      
      // Show success message
      alert('Takk! Din bestilling er aktivert og du vil motta faktura på e-post.');
    } catch (error) {
      // Error is handled by TanStack Query
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Bestill med faktura</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Bestillingsdetaljer</h3>
            <p className="text-sm text-gray-600 mb-1">{description}</p>
            <div className="flex justify-between text-sm">
              <span>Beløp:</span>
              <span>{(amount / 100).toFixed(2)} kr</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Rabatt:</span>
                <span>-{(discount * 100).toFixed(0)}%</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-2 mt-2">
              <span>Totalt:</span>
              <span>{(totalAmount / 100).toFixed(2)} kr</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fullt navn *
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                placeholder="Skriv inn fullt navn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                placeholder="Gateadresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postnr *
                </label>
                <Input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  required
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sted *
                </label>
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                  placeholder="Oslo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-post *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="din@epost.no"
              />
            </div>

            <ErrorMessage error={createInvoiceRequest.error} />

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Viktig informasjon:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Din bestilling aktiveres umiddelbart</li>
                <li>Du vil motta faktura på e-post innen 1-2 virkedager</li>
                <li>Betalingsfrist er 14 dager fra fakturadato</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                loading={createInvoiceRequest.isPending}
                className="flex-1"
              >
                Bestill med faktura
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}