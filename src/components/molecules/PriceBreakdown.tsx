import { formatPrice } from "@/utils/formatting";

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