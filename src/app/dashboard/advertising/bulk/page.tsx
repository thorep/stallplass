"use client";

import Button from "@/components/atoms/Button";
import { useGetBoxesByIds } from "@/hooks/useBoxes";
import {
  useCalculatePricing,
  useGetPublicBoxQuantityDiscounts,
  useGetPublicDiscounts,
} from "@/hooks/usePricing";
import { formatPrice } from "@/utils/formatting";
import { ChevronLeftIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BulkAdvertisingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from URL
  const boxIds = searchParams.get("boxIds")?.split(",") || [];
  const stableName = searchParams.get("stableName") || "";

  const [months, setMonths] = useState(1);

  // Fetch selected boxes
  const { data: selectedBoxes = [], isLoading: boxesLoading } = useGetBoxesByIds(boxIds);

  // Fetch discounts using TanStack Query (public endpoint)
  const { data: discountsData } = useGetPublicDiscounts();

  // Fetch box quantity discounts
  const { data: quantityDiscounts } = useGetPublicBoxQuantityDiscounts();

  // Calculate pricing using TanStack Query
  const { data: pricing, isLoading: pricingLoading } = useCalculatePricing(
    selectedBoxes.length,
    months
  );

  // Redirect back if no boxes selected
  useEffect(() => {
    if (!boxesLoading && boxIds.length === 0) {
      router.replace("/dashboard?tab=stables");
    }
  }, [boxIds.length, boxesLoading, router]);

  const handlePurchase = () => {
    if (!pricing || selectedBoxes.length === 0) return;

    // Create description for invoice
    const boxNames = selectedBoxes.map((box) => box.name || "Uten navn").join(", ");
    const description = `Annonsering for ${selectedBoxes.length} boks${
      selectedBoxes.length !== 1 ? "er" : ""
    } i ${stableName}: ${boxNames}`;

    // Navigate to invoice page
    const params = new URLSearchParams({
      itemType: "BOX_ADVERTISING",
      amount: Math.round(pricing.finalPrice).toString(),
      discount: Math.round(pricing.monthDiscount + pricing.boxQuantityDiscount).toString(),
      description: description.substring(0, 500),
      months: months.toString(),
      boxId: selectedBoxes.map((box) => box.id).join(","),
    });

    router.push(`/dashboard/bestill?${params.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Create month options with discount percentages
  const monthOptions = [
    { value: 1, label: "1 måned" },
    { value: 3, label: "3 måneder" },
    { value: 6, label: "6 måneder" },
    { value: 12, label: "12 måneder" },
  ].map((option) => {
    const discount = discountsData?.find(
      (d: { months: number; percentage: number }) => d.months === option.value
    );
    return {
      ...option,
      discount: discount?.percentage || 0,
    };
  });

  if (boxesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster bokser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Tilbake
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Kjøp annonsering for flere bokser
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Form */}
          <div className="space-y-6">
            {/* Selected boxes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Valgte bokser ({selectedBoxes.length} stk)
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedBoxes.map((box) => (
                  <div
                    key={box.id}
                    className="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{box.name}</span>
                      <p className="text-gray-500 text-xs">{box.size ? `${box.size} m²` : ""}</p>
                    </div>
                    <span className="text-gray-600 font-medium">
                      {pricing ? formatPrice(pricing.baseMonthlyPrice) : "..."}/mnd
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Period selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Annonseringsperiode</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {monthOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMonths(option.value)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      months === option.value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{option.label}</span>
                      {option.discount > 0 && (
                        <span
                          className={`text-xs mt-1 ${
                            months === option.value ? "text-green-200" : "text-green-600"
                          }`}
                        >
                          -{option.discount}%
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Pricing */}
          <div className="lg:order-last">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Prisberegning</h2>

              {pricingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Beregner pris...</p>
                </div>
              ) : pricing ? (
                <div className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Grunnpris ({formatPrice(pricing.baseMonthlyPrice)} × {selectedBoxes.length}{" "}
                        bokser × {months} mnd)
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(pricing.totalPrice)}
                      </span>
                    </div>

                    {pricing.monthDiscountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Perioderabatt ({pricing.monthDiscountPercentage}%)</span>
                        <span>-{formatPrice(pricing.monthDiscount)}</span>
                      </div>
                    )}

                    {pricing.boxQuantityDiscountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Mengderabatt ({pricing.boxQuantityDiscountPercentage}%)</span>
                        <span>-{formatPrice(pricing.boxQuantityDiscount)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between font-semibold text-lg">
                        <span className="text-gray-900">Totalpris</span>
                        <span className="text-indigo-600">{formatPrice(pricing.finalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Per boks per måned</span>
                        <span>
                          {formatPrice(pricing.finalPrice / selectedBoxes.length / months)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(pricing.monthDiscountPercentage > 0 ||
                    pricing.boxQuantityDiscountPercentage > 0) && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-700 font-medium">
                        🎉 Du sparer{" "}
                        {formatPrice(pricing.monthDiscount + pricing.boxQuantityDiscount)} med
                        rabatter!
                      </p>
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <Button
                      onClick={handlePurchase}
                      disabled={!pricing || pricingLoading}
                      className="w-full"
                      size="lg"
                    >
                      Kjøp annonsering for {selectedBoxes.length} boks{selectedBoxes.length !== 1 ? "er" : ""}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Rabattkoder kan legges til på neste steg
                    </p>

                    <Button variant="secondary" onClick={handleBack} className="w-full">
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Kunne ikke laste prisberegning</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Viktig informasjon:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Annonsering aktiveres umiddelbart etter bestilling</li>
            <li>• Boksene dine vil vises i offentlige søkeresultater</li>
            <li>• Du vil motta faktura på e-post innen 1-2 virkedager</li>
            <li>• Betalingsfrist er 14 dager fra fakturadato</li>
          </ul>
        </div>

        {/* Quantity discounts section */}
        {quantityDiscounts && quantityDiscounts.length > 0 && (
          <div className="mt-6 bg-green-50 rounded-lg p-6">
            <h3 className="font-medium text-green-900 mb-2">
              💰 Mengderabatter - spar mer med flere bokser:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quantityDiscounts.map(
                (
                  discount: {
                    minBoxes: number;
                    maxBoxes: number | null;
                    discountPercentage: number;
                  },
                  index: number
                ) => {
                  const currentBoxCount = selectedBoxes.length;
                  const isCurrentTier =
                    currentBoxCount >= discount.minBoxes &&
                    (discount.maxBoxes === null || currentBoxCount <= discount.maxBoxes);
                  const isAvailable = currentBoxCount < discount.minBoxes;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        isCurrentTier
                          ? "bg-green-100 border-green-300 text-green-800"
                          : isAvailable
                          ? "bg-white border-green-200 text-green-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="font-medium">
                        {discount.minBoxes === discount.maxBoxes
                          ? `${discount.minBoxes} bokser`
                          : discount.maxBoxes === null
                          ? `${discount.minBoxes}+ bokser`
                          : `${discount.minBoxes}-${discount.maxBoxes} bokser`}
                      </div>
                      <div className="text-lg font-bold">
                        -{discount.discountPercentage}% rabatt
                      </div>
                      {isCurrentTier && (
                        <div className="text-xs font-medium mt-1">✓ Aktiv rabatt</div>
                      )}
                      {isAvailable && (
                        <div className="text-xs mt-1">
                          Legg til {discount.minBoxes - currentBoxCount} bokser til
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            {selectedBoxes.length < (quantityDiscounts[0]?.minBoxes || 5) && (
              <p className="text-xs text-green-700 mt-3">
                💡 Tips: Legg til flere bokser i stallen din for å låse opp mengderabatter!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BulkAdvertisingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster...</p>
          </div>
        </div>
      }
    >
      <BulkAdvertisingPageContent />
    </Suspense>
  );
}
