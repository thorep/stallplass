"use client";

import { Button } from "@/components/ui/button";
import { useGetSponsoredPlacementInfo } from "@/hooks/useBoxMutations";
import { useGetBoostDailyPrice, useGetBoostDiscounts } from "@/hooks/usePricing";
import { formatPrice } from "@/utils/formatting";
import { ChevronLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SingleBoostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from URL
  const boxId = searchParams.get("boxId") || "";
  const boxName = searchParams.get("boxName") || "";
  const stableName = searchParams.get("stableName") || "";

  const [days, setDays] = useState(1);

  const sponsoredInfoQuery = useGetSponsoredPlacementInfo(boxId);
  const dailyPriceQuery = useGetBoostDailyPrice();
  const boostDiscountsQuery = useGetBoostDiscounts();

  // Redirect back if no box selected
  useEffect(() => {
    if (!boxId) {
      router.replace("/dashboard?tab=stables");
    }
  }, [boxId, router]);

  const handlePurchase = () => {
    if (!sponsoredInfoQuery.data) return;

    // Create description for invoice
    const description = `Boost for boks ${boxName} i ${stableName}`;

    // Navigate to invoice page with boost parameters
    const params = new URLSearchParams({
      itemType: "BOX_SPONSORED",
      amount: totalCost.toString(),
      discount: discountAmount.toString(),
      description: description.substring(0, 500),
      days: days.toString(),
      boxId: boxId,
    });

    router.push(`/dashboard/bestill?${params.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Get pricing from API - no fallback, must be from server
  const dailyPrice = dailyPriceQuery.data?.dailyPrice || 0;
  const baseTotal = dailyPrice * days;

  // Calculate discount based on days
  type BoostDiscount = {
    id: string;
    days: number;
    maxDays: number | null;
    percentage: number;
    isActive: boolean;
  };
  const boostDiscounts: BoostDiscount[] = boostDiscountsQuery.data || [];
  // Boost discounts data
  const applicableDiscount = boostDiscounts
    .filter((d) => {
      if (!d.isActive) return false;
      // Simple range check: days must be >= d.days and if maxDays exists, <= maxDays
      if (d.maxDays === null) {
        // No upper limit (e.g., 30+ days)
        return days >= d.days;
      } else {
        // Has upper limit (e.g., 7-13 days)
        return days >= d.days && days <= d.maxDays;
      }
    })
    .sort((a, b) => b.percentage - a.percentage)[0];
  // Applicable discount data
  const discountPercentage = applicableDiscount?.percentage || 0;
  const discountAmount = baseTotal * (discountPercentage / 100);
  const totalCost = baseTotal - discountAmount;

  const maxDaysAvailable = sponsoredInfoQuery.data?.maxDaysAvailable || 365;

  if (sponsoredInfoQuery.isPending || dailyPriceQuery.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster boost-informasjon...</p>
        </div>
      </div>
    );
  }

  if (dailyPriceQuery.error || sponsoredInfoQuery.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Kunne ikke laste boost-informasjon</p>
          <Button onClick={handleBack} variant="secondary">
            Gå tilbake
          </Button>
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
            <h1 className="text-2xl font-semibold text-gray-900">Boost boks til topp</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Form */}
          <div className="space-y-6">
            {/* Selected box */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Valgt boks</h2>
              <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-4">
                <div>
                  <span className="font-medium text-gray-900">{boxName}</span>
                  <p className="text-gray-500 text-xs">i {stableName}</p>
                </div>
                <div className="flex items-center text-purple-600">
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Boost aktiv</span>
                </div>
              </div>
            </div>

            {/* Duration selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Boost-periode</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antall dager
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxDaysAvailable}
                      value={days}
                      onChange={(e) =>
                        setDays(
                          Math.max(1, Math.min(maxDaysAvailable, parseInt(e.target.value) || 1))
                        )
                      }
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={() => setDays(Math.min(maxDaysAvailable, days + 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Maksimalt {maxDaysAvailable} dager tilgjengelig
                  </p>
                </div>

                {/* Quick select buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {boostDiscounts
                    .filter((discount) => discount.isActive)
                    .sort((a, b) => a.days - b.days)
                    .map((discount) => (
                      <button
                        key={discount.id}
                        onClick={() => setDays(Math.min(maxDaysAvailable, discount.days))}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors relative ${
                          days === discount.days
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                        disabled={discount.days > maxDaysAvailable}
                      >
                        <div>{discount.days} dager</div>
                        <div
                          className={`text-xs ${
                            days === discount.days ? "text-purple-200" : "text-green-600"
                          }`}
                        >
                          {discount.percentage}% rabatt
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Pricing */}
          <div className="lg:order-last">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Prisberegning</h2>

              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris per dag</span>
                    <span className="text-gray-900 font-medium">{formatPrice(dailyPrice)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Antall dager</span>
                    <span className="text-gray-900 font-medium">{days}</span>
                  </div>

                  {discountPercentage > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grunnpris</span>
                        <span className="text-gray-900 font-medium">{formatPrice(baseTotal)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Rabatt ({discountPercentage}%)</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Totalpris ({days} {days === 1 ? "dag" : "dager"})
                      </span>
                      <span className="text-gray-900 font-medium">{formatPrice(baseTotal)}</span>
                    </div>
                  )}

                  {discountPercentage > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between font-semibold text-lg">
                        <span className="text-gray-900">Totalpris</span>
                        <span className="text-indigo-600">{formatPrice(totalCost)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {boostDiscounts.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-4 mt-4">
                    <div className="text-emerald-800 text-sm">
                      <strong>Rabatter:</strong>
                      <ul className="mt-2 space-y-1">
                        {boostDiscounts
                          .filter((discount) => discount.isActive)
                          .sort((a, b) => a.days - b.days)
                          .map((discount) => (
                            <li key={discount.id}>
                              • {discount.days}
                              {discount.maxDays ? `-${discount.maxDays}` : "+"} dager:{" "}
                              {discount.percentage}% rabatt
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={
                      !sponsoredInfoQuery.data ||
                      !dailyPriceQuery.data ||
                      dailyPriceQuery.error ||
                      !maxDaysAvailable ||
                      days > maxDaysAvailable ||
                      totalCost <= 0
                    }
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                    data-cy="go-to-payment-button"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    Gå til betaling
                  </Button>

                  <Button variant="secondary" onClick={handleBack} className="w-full">
                    Avbryt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Hva er boost?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Boksen din vises øverst i alle søkeresultater</li>
            <li>• Boost-merke gjør boksen mer synlig for potensielle leietakere</li>
            <li>• Boost kan kun kjøpes for bokser som allerede har aktiv annonsering</li>
            <li>• Boost aktiveres umiddelbart etter kjøp</li>
            <li>• Du kan forlenge boost når som helst før utløp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SingleBoostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster...</p>
          </div>
        </div>
      }
    >
      <SingleBoostPageContent />
    </Suspense>
  );
}
