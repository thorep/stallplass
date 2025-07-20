'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useAuth } from '@/lib/supabase-auth-context';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  totalBoxes: number;
  selectedPeriod: number;
  totalCost: number;
  stableId: string;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete,
  totalBoxes, 
  selectedPeriod, 
  totalCost,
  stableId 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleBypassPayment = async () => {
    if (!user) {
      alert('Du må være innlogget for å aktivere annonsering');
      return;
    }

    setIsProcessing(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stableId,
          months: selectedPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Bypass payment error:', errorData);
        throw new Error(errorData.error || 'Failed to activate advertising');
      }

      const result = await response.json();
      console.log('Bypass payment successful:', result);
      
      setIsProcessing(false);
      onPaymentComplete();
      onClose();
    } catch (error) {
      console.error('Error in bypass payment:', error);
      alert('Det oppstod en feil ved aktivering av annonsering. Vennligst prøv igjen.');
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      alert('Du må være innlogget for å betale');
      return;
    }

    setIsProcessing(true);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stableId,
          months: selectedPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment API error:', errorData);
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { redirectUrl } = await response.json();
      
      // Redirect to Vipps for payment
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Det oppstod en feil ved opprettelse av betaling. Vennligst prøv igjen.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Bekreft betaling</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sammendrag</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Antall bokser:</span>
                  <span className="font-medium">{totalBoxes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Periode:</span>
                  <span className="font-medium">{selectedPeriod} måned{selectedPeriod !== 1 ? 'er' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pris per boks per måned:</span>
                  <span className="font-medium">10 kr</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total kostnad:</span>
                  <span className="font-bold text-indigo-600">{totalCost} kr</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Dette får du:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Synlighet for din stall i {selectedPeriod} måned{selectedPeriod !== 1 ? 'er' : ''}</li>
                <li>• Kontroll over hvilke bokser som vises</li>
                <li>• Ubegrenset visninger og henvendelser</li>
                <li>• Dashboard for administrasjon</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3 mb-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Avbryt
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePayment} 
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? 'Behandler...' : `Betal ${totalCost} kr`}
            </Button>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={handleBypassPayment} 
              className="w-full bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
              disabled={isProcessing}
            >
              🧪 Aktiver annonsering gratis (Testing)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}