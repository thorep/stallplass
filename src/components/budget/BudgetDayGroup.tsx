"use client";

import BudgetListItem from "./BudgetListItem";
import { Separator } from "@/components/ui/separator";

export type BudgetItem = {
  id: string;
  title: string;
  dateLabel: string; // 31.08
  category: string;
  amountLabel: string; // e.g. "79 kr"
  icon?: React.ReactNode;
};

type Props = {
  dateLabel: string;
  items: BudgetItem[];
  subtotal: string;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
  showSubtotal?: boolean;
};

export default function BudgetDayGroup({ dateLabel, items, subtotal, onPress, onDelete, showSubtotal = true }: Props) {
  return (
    <div className="py-2">
      <div className="px-1 py-1">
        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {dateLabel}
        </div>
      </div>
      <div className="space-y-1">
        {items.map((it) => (
          <BudgetListItem
            key={it.id}
            title={it.title}
            date={it.dateLabel}
            category={it.category}
            amount={it.amountLabel}
            icon={it.icon}
            onPress={() => onPress(it.id)}
            onDelete={onDelete ? () => onDelete(it.id) : undefined}
          />
        ))}
      </div>
      {showSubtotal && (
        <div className="mt-2">
          <Separator />
          <div className="px-1 pt-1 text-xs text-muted-foreground">Subtotal: {subtotal}</div>
        </div>
      )}
    </div>
  );
}
