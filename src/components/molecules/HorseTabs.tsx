"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface HorseTabsProps {
  horseId: string;
  isOwner?: boolean;
}

export default function HorseTabs({ horseId, isOwner = true }: HorseTabsProps) {
  const pathname = usePathname();
  const base = `/mine-hester/${horseId}`;
  const tabs = [
    { href: base, label: "Oversikt" },
    { href: `${base}/logg`, label: "Logg" },
    // Only show budget tab if user is owner
    ...(isOwner ? [{ href: `${base}/budsjett`, label: "Budsjett" }] : []),
    { href: `${base}/stall`, label: "Stall" },
    // Only show share tab if user is NOT owner
    ...(!isOwner ? [{ href: `${base}/del`, label: "Del" }] : []),
  ];

  return (
    <div className="z-20 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-2 space-y-2">
          <div>
            <Link
              href="/mine-hester"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#5B4B8A]"
              aria-label="Til alle hester"
            >
              <ChevronLeft className="h-4 w-4" /> Alle hester
            </Link>
          </div>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  data-cy={`nav-${t.label.toLowerCase().replace('ø', 'o')}`}
                  className={[
                    "px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                    active
                      ? "bg-[#5B4B8A] text-white shadow"
                      : "bg-transparent text-gray-700 hover:bg-white hover:text-[#5B4B8A]",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
