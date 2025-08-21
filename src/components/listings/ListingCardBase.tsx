"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

export type ListingCardBadgeTone = "success" | "danger" | "primary" | "neutral";

export interface ListingCardBaseProps {
  href: string;
  image?: { src: string; alt?: string; count?: number };
  title: string;
  actions?: { favorite?: boolean; share?: boolean };
  meta?: Array<{ icon: React.ReactNode | string; label: string }>;
  price?: {
    value?: string;
    range?: { min: string; max: string };
    cadence?: "perMonth" | "once";
    mode?: "request";
  };
  badgesTopRight?: Array<{ label: string; tone: ListingCardBadgeTone }>;
  badgesBottom?: string[];
  amenities?: string[];
  description?: string;
  showPrice?: boolean;
  isNew?: boolean;
  onFavoriteToggle?: () => void;
  onShare?: () => void;
  className?: string;
}

function badgeToneClasses(tone: ListingCardBadgeTone) {
  switch (tone) {
    case "success":
      return "bg-green-600 text-white";
    case "danger":
      return "bg-red-600 text-white";
    case "primary":
      return "bg-primary text-primary-foreground";
    case "neutral":
    default:
      return "bg-gray-700 text-white";
  }
}

function formatKr(value: string) {
  // If value already contains "kr", return as-is
  if (/kr\b/i.test(value)) return value;
  return `${value} kr`;
}

function buildPriceText(
  price?: ListingCardBaseProps["price"],
  showPrice: boolean = true
): { text: string | null; sub?: string | null } {
  if (!showPrice || !price) return { text: null, sub: null };
  if (price.mode === "request") return { text: "Pris på forespørsel", sub: null };
  if (price.value) {
    return { text: formatKr(price.value), sub: price.cadence === "perMonth" ? "pr måned" : null };
  }
  if (price.range) {
    const min = price.range.min;
    const max = price.range.max;
    return {
      text: formatKr(`${min}–${max}`),
      sub: price.cadence === "perMonth" ? "pr måned" : null,
    };
  }
  return { text: null, sub: null };
}

export default function ListingCardBase(props: ListingCardBaseProps) {
  const {
    href,
    image,
    title,
    actions,
    meta = [],
    price,
    badgesTopRight = [],
    badgesBottom,
    amenities,
    description,
    showPrice = true,
    isNew,
    onFavoriteToggle,
    onShare,
    className,
  } = props;

  const { text: priceText, sub: priceSub } = buildPriceText(price, showPrice);
  const imageCount = image?.count ?? 0;
  const showImageCount = imageCount > 0;
  const bilderLabel = imageCount === 1 ? "bilde" : "bilder";

  // Decide which chips to display
  const baseChips =
    badgesBottom && badgesBottom.length > 0
      ? badgesBottom.slice(0, 3)
      : amenities
      ? amenities.slice(0, 3)
      : [];
  const amenitiesExtra = amenities && amenities.length > 3 ? amenities.length - 3 : 0;

  // Compose top-right badges, include optional "Ny"
  const topBadges = [
    ...(isNew ? [{ label: "Ny", tone: "primary" as const }] : []),
    ...badgesTopRight,
  ];

  const handleIconClick = (e: React.MouseEvent, cb?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    cb?.();
  };

  return (
    <Link
      href={href}
      className={cn(
        "block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:rounded-xl",
        className
      )}
    >
      <Card className="p-0 rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-300 cursor-pointer">
        {/* Image */}
        <div className="relative w-full aspect-video bg-muted">
          {image?.src ? (
            <Image
              src={image.src}
              alt={image.alt || title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
              <span className="text-sm">Ingen bilder</span>
            </div>
          )}

          {showImageCount && (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 text-white text-xs px-2 py-1">
              {imageCount} {bilderLabel}
            </span>
          )}

          {topBadges.length > 0 && (
            <div className="absolute right-3 top-3 flex gap-2">
              {topBadges.map((b, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full text-xs px-3 py-1 font-medium",
                    badgeToneClasses(b.tone)
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base md:text-lg text-foreground line-clamp-2">
              {title}
            </h3>
            {(actions?.favorite || actions?.share) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                {actions?.favorite && (
                  <button
                    type="button"
                    aria-label="Favoritt"
                    className="p-1 rounded-md hover:bg-muted"
                    onClick={(e) => handleIconClick(e, onFavoriteToggle)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart size={18} />
                  </button>
                )}
                {actions?.share && (
                  <button
                    type="button"
                    aria-label="Del"
                    className="p-1 rounded-md hover:bg-muted"
                    onClick={(e) => handleIconClick(e, onShare)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Share2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              {meta.slice(0, 4).map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-1 text-gray-500">
                  {typeof item.icon === "string" ? (
                    <span className="text-base leading-none">{item.icon}</span>
                  ) : (
                    item.icon
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {priceText && (
            <div className="text-foreground font-semibold">
              <span className="text-base md:text-lg">{priceText}</span>
              {priceSub ? (
                <span className="text-xs text-muted-foreground ml-2">{priceSub}</span>
              ) : null}
            </div>
          )}

          {description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          ) : null}

          {(baseChips.length > 0 || amenitiesExtra > 0) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {baseChips.map((chip, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {chip}
                </Badge>
              ))}
              {amenitiesExtra > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{amenitiesExtra}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export type { ListingCardBaseProps as ListingCardBaseComponentProps };
