"use client";

import Button from "@/components/atoms/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface AvailabilityDateModalProps {
  boxName: string;
  currentDate?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string | null) => void;
  loading?: boolean;
}

export default function AvailabilityDateModal({
  boxName,
  currentDate,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: AvailabilityDateModalProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate || "");

  if (!isOpen) return null;

  const handleSave = () => {
    const dateValue = selectedDate.trim() === "" ? null : selectedDate;
    onSave(dateValue);
  };

  const handleRemoveDate = () => {
    setSelectedDate("");
    onSave(null);
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Angi ledig dato
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            data-cy="close-availability-modal"
            disabled={loading}
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Angi når <strong>{boxName}</strong> blir ledig for utleie.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="availability-date" className="block text-sm font-medium text-gray-700 mb-2">
                Ledig fra dato
              </label>
              <input
                id="availability-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                data-cy="availability-date-input"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Datoen må være i fremtiden
              </p>
            </div>

            {currentDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Nåværende ledig dato:</strong> {new Date(currentDate).toLocaleDateString("nb-NO")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
            {currentDate && (
              <Button
                variant="secondary"
                onClick={handleRemoveDate}
                disabled={loading}
                data-cy="remove-availability-date-button"
                className="order-3 sm:order-1"
              >
                Fjern dato (marker som ledig nå)
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              data-cy="cancel-availability-button"
              className="order-2"
            >
              Avbryt
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading || (selectedDate.trim() !== "" && selectedDate < minDate)}
              data-cy="save-availability-date-button"
              className="order-1 sm:order-3"
            >
              {loading ? "Lagrer..." : "Lagre"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}