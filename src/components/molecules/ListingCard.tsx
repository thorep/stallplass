"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";

type StatusColor = "green" | "red" | "primary" | "gray";

export interface ListingCardProps {
  href: string;
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
  imageCount?: number;
  statusBadge?: { color: StatusColor; text: string } | null;
  actionsTopRight?: React.ReactNode;
  meta?: Array<React.ReactNode>;
  priceText?: string | null;
  priceSubText?: string | null; // e.g. "pr måned"
  description?: string | null;
  chips?: string[];
  className?: string;
  titleClamp?: 1 | 2;
  descriptionClamp?: 2 | 3;
}

function statusColorClasses(color: StatusColor | undefined) {
  switch (color) {
    case "green":
      return "bg-green-600 text-white";
    case "red":
      return "bg-red-600 text-white";
    case "primary":
      return "bg-primary text-primary-foreground";
    case "gray":
    default:
      return "bg-gray-700 text-white";
  }
}

export function ListingCard({
  href,
  title,
  imageUrl,
  imageAlt,
  imageCount,
  statusBadge,
  actionsTopRight,
  meta = [],
  priceText,
  priceSubText,
  description,
  chips = [],
  className,
  titleClamp = 2,
  descriptionClamp = 3,
}: ListingCardProps) {
  const showImageCount = typeof imageCount === "number" && imageCount > 0;
  const pluralBilder = imageCount === 1 ? "bilde" : "bilder";

  // Compute chips: max 3 visible, then +N
  const visibleChips = chips.slice(0, 3);
  const extraCount = Math.max(0, chips.length - visibleChips.length);

  return (
    <Link href={href} className={cn("block", className)}>
      <Card className="p-0 rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-300 cursor-pointer">
        {/* Image top with 16:9 ratio */}
        <div className="relative w-full aspect-video bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
              <span className="text-sm">Ingen bilder</span>
            </div>
          )}

          {/* Top-left image count badge */}
          {showImageCount && (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 text-white text-xs px-2 py-1">
              {imageCount} {pluralBilder}
            </span>
          )}

          {/* Top-right status/category badge */}
          {statusBadge && (
            <span
              className={cn(
                "absolute right-3 top-3 rounded-full text-xs px-3 py-1 font-medium",
                statusColorClasses(statusBadge.color)
              )}
            >
              {statusBadge.text}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn("font-semibold text-base md:text-lg text-foreground", `line-clamp-${titleClamp}`)}>
              {title}
            </h3>
            {actionsTopRight ? (
              <div className="flex-shrink-0">{actionsTopRight}</div>
            ) : null}
          </div>

          {/* Meta row */}
          {meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              {meta.map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-1 text-gray-500">
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Price */}
          {priceText ? (
            <div className="text-foreground font-semibold">
              <span className="text-base md:text-lg">{priceText}</span>
              {priceSubText ? (
                <span className="text-xs text-muted-foreground ml-2">{priceSubText}</span>
              ) : null}
            </div>
          ) : null}

          {/* Description */}
          {description ? (
            <p className={cn("text-sm text-muted-foreground", `line-clamp-${descriptionClamp}`)}>{description}</p>
          ) : null}

          {/* Chips */}
          {visibleChips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {visibleChips.map((chip, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {chip}
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="secondary" className="text-xs">+{extraCount}</Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default ListingCard;
