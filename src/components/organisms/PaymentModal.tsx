'use client';

import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  totalBoxes: number;
  selectedPeriod: number;
  totalCost: number;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  totalBoxes, 
  selectedPeriod, 
  totalCost 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    onPaymentComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Testing Banner */}
        <div className="bg-red-500 text-white text-center py-2 rounded-t-2xl">
          <div className="flex items-center justify-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">TESTING MODE - NO REAL PAYMENT</span>
          </div>
        </div>

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
        <div className="p-6 border-t border-gray-200 flex gap-3">
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
      </div>
    </div>
  );
}