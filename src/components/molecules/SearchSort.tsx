"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type SearchMode = "stables" | "boxes" | "services" | "forhest";
type SortOption =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating_high"
  | "rating_low"
  | "available_high"
  | "available_low"
  | "sponsored_first"
  | "name_asc"
  | "name_desc";

interface SearchSortProps {
  searchMode: SearchMode;
  onSortChange: (sort: SortOption) => void;
  currentSort: SortOption;
  totalResults: number;
  isLoading: boolean;
}

const getSortOptions = (searchMode: SearchMode) => {
  const baseOptions = [
    { value: "newest", label: "Nyeste først" },
    { value: "oldest", label: "Eldste først" },
    { value: "name_asc", label: "Navn A-Å" },
    { value: "name_desc", label: "Navn Å-A" },
  ] as const;

  if (searchMode === "boxes") {
    return [
      ...baseOptions,
      { value: "price_low", label: "Laveste pris først" },
      { value: "price_high", label: "Høyeste pris først" },
      { value: "available_high", label: "Ledige først" },
      { value: "sponsored_first", label: "Sponsede først" },
    ] as const;
  }

  if (searchMode === "services") {
    return [
      ...baseOptions,
      { value: "price_low", label: "Laveste pris først" },
      { value: "price_high", label: "Høyeste pris først" },
    ] as const;
  }

  if (searchMode === "forhest") {
    return [
      ...baseOptions,
    ] as const;
  }

  return [
    ...baseOptions,
    { value: "rating_high", label: "Høyest vurdering" },
    { value: "rating_low", label: "Lavest vurdering" },
  ] as const;
};

export default function SearchSort({
  searchMode,
  onSortChange,
  currentSort,
  totalResults,
  isLoading,
}: SearchSortProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortOptions = getSortOptions(searchMode);
  const currentSortLabel =
    sortOptions.find((option) => option.value === currentSort)?.label || "Sortering";

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 mb-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Results count */}
        <div className="flex items-center text-sm text-gray-600">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Laster{" "}
              {searchMode === "stables"
                ? "staller"
                : searchMode === "boxes"
                ? "bokser"
                : searchMode === "services"
                ? "tjenester"
                : "fôrhester"}
              ...
            </div>
          ) : (
            <span>
              {totalResults}{" "}
              {searchMode === "stables"
                ? "stall"
                : searchMode === "boxes"
                ? "stallplass"
                : searchMode === "services"
                ? "tjenest"
                : "fôrhest"}
              {totalResults !== 1
                ? searchMode === "stables"
                  ? "er"
                  : searchMode === "boxes"
                  ? "er"
                  : searchMode === "services"
                  ? "er"
                  : "er"
                : ""}{" "}
              funnet
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <span>Sorter: {currentSortLabel}</span>
              <ChevronDownIcon
                className={`ml-2 h-4 w-4 transform transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />

                {/* Dropdown menu */}
                <div className="absolute right-0 z-20 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          currentSort === option.value
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
