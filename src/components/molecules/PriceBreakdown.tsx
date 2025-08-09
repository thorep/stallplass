import { formatPrice } from "@/utils/formatting";
import { useKampanjeFlag } from "@/hooks/useKampanjeFlag";

interface PriceBreakdownProps {
  basePrice: number;
  quantity: number;
  quantityLabel: string;
  discount?: {
    percentage: number;
    amount: number;
    label?: string;
  };
  discountCode?: {
    code: string;
    amount: number;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
  };
  finalPrice: number;
  className?: string;
}

export default function PriceBreakdown({
  basePrice,
  quantity,
  quantityLabel,
  discount,
  discountCode,
  finalPrice,
  className = "",
}: PriceBreakdownProps) {
  const totalBeforeDiscount = basePrice * quantity;
  const isKampanjeActive = useKampanjeFlag();

  // Show GRATIS message when kampanje is active and final price is 0
  if (isKampanjeActive && finalPrice === 0) {
    return (
      <div className={`space-y-3 text-sm ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700 mb-2">HELT GRATIS</div>
            <div className="text-sm text-green-600 mb-1">
              🎉 Kampanje: Automatisk aktivert med 6 måneders annonsering!
            </div>
            <div className="text-xs text-green-500">
              Når tiden utløper kan du velge å fortsette med betalt annonsering
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 text-sm ${className}`}>
      <div className="flex justify-between">
        <span className="text-gray-600">Pris per {quantityLabel}</span>
        <span className="text-gray-900 font-medium">{formatPrice(basePrice)}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-600">Antall {quantityLabel}</span>
        <span className="text-gray-900 font-medium">{quantity}</span>
      </div>

      {discount && discount.percentage > 0 ? (
        <>
          <div className="flex justify-between">
            <span className="text-gray-600">Grunnpris</span>
            <span className="text-gray-900 font-medium">{formatPrice(totalBeforeDiscount)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>{discount.label || `Rabatt`} ({discount.percentage}%)</span>
            <span>-{formatPrice(discount.amount)}</span>
          </div>
        </>
      ) : null}

      {discountCode && discountCode.amount > 0 ? (
        <div className="flex justify-between text-green-600">
          <span>
            Rabattkode &quot;{discountCode.code}&quot; (
            {discountCode.type === "PERCENTAGE" 
              ? `${discountCode.value}%` 
              : formatPrice(discountCode.value)
            })
          </span>
          <span>-{formatPrice(discountCode.amount)}</span>
        </div>
      ) : null}

      <div className="pt-3 border-t border-gray-200">
        <div className="flex justify-between font-semibold text-lg">
          <span className="text-gray-900">Totalpris</span>
          <span className="text-indigo-600">{formatPrice(finalPrice)}</span>
        </div>
      </div>
    </div>
  );
}