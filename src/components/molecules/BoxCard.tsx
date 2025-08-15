import Button from "@/components/atoms/Button";
import { BoxWithStable } from "@/types/stable";
import { formatPrice, formatStableLocation } from "@/utils/formatting";
import { PhotoIcon } from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  HomeIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

interface BoxCardProps {
  box: BoxWithStable;
}

export default function BoxCard({ box }: BoxCardProps) {
  // Get real-time availability updates for this specific box

  // Use real-time data if available, otherwise fall back to initial data
  const availableQuantity = ('availableQuantity' in box ? (box.availableQuantity as number) : 0) ?? 0;
  const isAvailable = availableQuantity > 0;
  const isSponsored = box.isSponsored;

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
        !isAvailable ? "border-gray-300 opacity-75" : "border-gray-200"
      }`}
    >
      <div className="relative">
        {/* Box image or stable image as fallback */}
        {box.images && box.images.length > 0 ? (
          <Image
            src={box.images[0]}
            alt={box.imageDescriptions?.[0] || box.name}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : box.stable?.images && box.stable.images.length > 0 ? (
          <Image
            src={box.stable.images[0]}
            alt={`${box.stable?.name || "Stall"} - ${box.name}`}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="h-48 w-full bg-gray-100 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Ingen bilder</p>
            </div>
          </div>
        )}

        {/* Availability indicator */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              {availableQuantity} ledig{availableQuantity === 1 ? "" : "e"}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              <ExclamationCircleIcon className="h-3 w-3 mr-1" />
              Opptatt
            </span>
          )}
        </div>

        {/* Sponsored badge */}
        {isSponsored && (
          <div className="absolute top-12 left-3 rounded-full bg-purple-500 px-2 py-1 text-xs font-medium text-white">
            <ClockIcon className="h-3 w-3 mr-1 inline" />
            Sponset
          </div>
        )}

        {/* Indoor/Outdoor badge */}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700">
          {false /* TODO: Check amenities for indoor status */ ? "Innendørs" : "Utendørs"}
        </div>
      </div>

      <div className="p-4">
        {/* Box name and stable info */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{box.name}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <HomeIcon className="h-4 w-4 mr-1" />
            <span>{box.stable?.name || "Ukjent stall"}</span>
          </div>
        </div>

        {/* Location and rating */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {formatStableLocation(box.stable)}
          </div>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-600">
              {box.stable?.rating || 0} ({box.stable?.reviewCount || 0})
            </span>
          </div>
        </div>

        {/* Description */}
        {box.description && (
          <p className="mb-3 text-sm text-gray-700 line-clamp-2">{box.description}</p>
        )}

        {/* Box details */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 text-xs">
            {box.size && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                {box.size} m²
              </span>
            )}
            {box.maxHorseSize && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {box.maxHorseSize}
              </span>
            )}
          </div>
        </div>

        {/* Price and action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-900">{formatPrice(box.price)}</span>
            <span className="text-sm text-gray-600">/måned</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Link href={`/staller/${box.stable?.id || ""}`}>
            <Button variant="primary" size="sm" className="w-full" disabled={!isAvailable}>
              {isAvailable ? "Se stall og kontakt" : "Ikke tilgjengelig"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
