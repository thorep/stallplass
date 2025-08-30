"use client";

import FavoriteCount from "@/components/molecules/FavoriteCount";
import HorseBuyModal from "@/components/organisms/HorseBuyModal";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import { useHorseBuyMutations } from "@/hooks/useHorseBuys";
import { cn } from "@/lib/utils";
import { PencilIcon, PhotoIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  horseBuys: HorseBuy[];
  horseBuysLoading: boolean;
  user: User;
}

export default function SmartHorseBuyList({ horseBuys, horseBuysLoading, user }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<HorseBuy | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { deleteHorseBuy } = useHorseBuyMutations();

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    try { await deleteHorseBuy.mutateAsync(id); toast.success('Annonse slettet'); } catch { toast.error('Feil ved sletting'); }
    finally { setConfirmDeleteId(null); }
  };

  if (horseBuysLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_,i)=>(<div key={i} className="h-24 bg-slate-100 rounded"/>))}</div>;
  }
  if (!horseBuys.length) {
    return <div className="text-center py-12 text-slate-600">Ingen ønskes kjøpt-annonser registrert ennå</div>;
  }

  const fmt = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);

  return (
    <div className="space-y-3">
      {horseBuys.map((hb) => {
        const isOpen = expanded.has(hb.id);
        const price = [fmt(hb.priceMin), fmt(hb.priceMax)].filter(Boolean).join(' - ');
        const age = [hb.ageMin, hb.ageMax].filter(v => v !== undefined).join(' - ');
        const height = [hb.heightMin, hb.heightMax].filter(v => v !== undefined).join(' - ');
        const gender = hb.gender ? (hb.gender === 'HOPPE' ? 'Hoppe' : hb.gender === 'HINGST' ? 'Hingst' : 'Vallach') : 'Alle kjønn';
        return (
          <div key={hb.id} className={cn("bg-white border border-slate-200 rounded-xl transition-all", isOpen && 'shadow-md')}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {hb.images?.length ? (
                    <Image src={hb.images[0]} alt={hb.name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><PhotoIcon className="w-6 h-6 text-slate-400"/></div>
                  )}
                </div>
                 <div className="min-w-0">
                   <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-slate-900 truncate">{hb.name}</h3>
                     <span className="px-2 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700">{price ? `${price} kr` : 'Pris ikke oppgitt'}</span>
                   </div>
                   <div className="text-sm text-slate-600 truncate">
                     {(hb.breed?.name || 'Alle raser')} • {gender} • {age || 'Alder ikke oppgitt'} {height && `• ${height} cm`}
                   </div>
                 </div>
               </div>
                <div className="flex items-center gap-2">
                  <FavoriteCount
                    entityType="HORSE_BUY"
                    entityId={hb.id}
                    className="text-xs"
                    showZero={true}
                  />
                  <button onClick={() => toggle(hb.id)} className="p-2 hover:bg-slate-100 rounded-lg">{isOpen ? <ChevronDownIcon className="h-5 w-5 text-slate-400"/> : <ChevronRightIcon className="h-5 w-5 text-slate-400"/>}</button>
                </div>
            </div>
            {isOpen && (
              <div className="border-t px-4 py-3 text-sm text-slate-700">
                {hb.description && <p className="mb-3">{hb.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="font-medium">Rase:</span> {hb.breed?.name || 'Alle'}</div>
                  <div><span className="font-medium">Gren:</span> {hb.discipline?.name || 'Alle'}</div>
                  <div><span className="font-medium">Mankehøyde:</span> {height || 'Ikke oppgitt'}{height && ' cm'}</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditing(hb)} className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm hover:bg-slate-50"><PencilIcon className="h-4 w-4 mr-1"/>Rediger</button>
                  <button onClick={() => handleDelete(hb.id)} className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm hover:bg-red-50 text-red-700 border-red-300"><TrashIcon className="h-4 w-4 mr-1"/>{confirmDeleteId === hb.id ? 'Bekreft sletting' : 'Slett'}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Edit modal */}
      {editing && (
        <HorseBuyModal isOpen={!!editing} onClose={() => setEditing(null)} user={user} horseBuy={editing} mode="edit" />
      )}
    </div>
  );
}
