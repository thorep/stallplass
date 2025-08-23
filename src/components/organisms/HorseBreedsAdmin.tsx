'use client';

import { useState } from 'react';
import {
  useAdminHorseBreeds,
  useCreateHorseBreed,
  useUpdateHorseBreed,
  useDeleteHorseBreed,
  type AdminHorseBreed,
} from '@/hooks/useAdminHorseBreeds';
import { useIsAdmin } from '@/hooks/useAdminQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HeartIcon, PencilIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function HorseBreedsAdmin() {
  useIsAdmin();

  const { data: breeds = [], isLoading, error } = useAdminHorseBreeds();
  const createBreed = useCreateHorseBreed();
  const updateBreed = useUpdateHorseBreed();
  const deleteBreed = useDeleteHorseBreed();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const startEdit = (breed: AdminHorseBreed) => {
    setEditingId(breed.id);
    setEditName(breed.name);
    setEditIsActive(breed.isActive);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIsActive(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createBreed.mutateAsync({ name: newName.trim(), isActive: newIsActive });
      setNewName('');
      setNewIsActive(true);
      setShowAddForm(false);
    } catch {}
  };

  const handleSave = async (id: string) => {
    const payload: { name?: string; isActive?: boolean } = {};
    const original = breeds.find(b => b.id === id);
    if (!original) return;
    if (editName.trim() !== original.name) payload.name = editName.trim();
    if (editIsActive !== original.isActive) payload.isActive = editIsActive;

    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }

    try {
      await updateBreed.mutateAsync({ id, data: payload });
      cancelEdit();
    } catch {}
  };

  const handleDelete = async (breed: AdminHorseBreed) => {
    if (!confirm(`Er du sikker på at du vil slette "${breed.name}"? Denne handlingen kan ikke angres.`)) return;
    try {
      await deleteBreed.mutateAsync(breed.id);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Laster hesteraser...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Feil ved lasting av hesteraser</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartIcon className="h-6 w-6 text-rose-600" />
          <h2 className="text-xl font-semibold text-slate-800">Hesteraser ({breeds.length})</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={createBreed.isPending}
          className="bg-[#D2691E] hover:bg-[#A0521D] text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Legg til rase
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Legg til ny hesterase</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Navn</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Eks: Norsk varmblod"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              <Switch id="newIsActive" checked={newIsActive} onCheckedChange={setNewIsActive} />
              <label htmlFor="newIsActive" className="text-sm text-slate-700">Aktiv</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createBreed.isPending || !newName.trim()} className="bg-[#D2691E] hover:bg-[#A0521D] text-white">
              <CheckIcon className="h-4 w-4 mr-2" />
              {createBreed.isPending ? 'Oppretter...' : 'Opprett'}
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); setNewName(''); setNewIsActive(true); }}>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {breeds.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <HeartIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p>Ingen hesteraser funnet. Legg til den første!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Navn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Opprettet</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Handlinger</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {breeds.map((breed) => (
                  <tr key={breed.id} className={editingId === breed.id ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                    <td className="px-6 py-4">
                      {editingId === breed.id ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{breed.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === breed.id ? (
                        <div className="flex items-center gap-2">
                          <Switch id={`active-${breed.id}`} checked={editIsActive} onCheckedChange={setEditIsActive} />
                          <label htmlFor={`active-${breed.id}`} className="text-sm text-slate-700">Aktiv</label>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${breed.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {breed.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(breed.createdAt).toLocaleDateString('nb-NO')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === breed.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleSave(breed.id)} disabled={updateBreed.isPending || !editName.trim()} className="text-white bg-green-600 hover:bg-green-700">
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={updateBreed.isPending}>
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(breed)} disabled={updateBreed.isPending || deleteBreed.isPending} className="text-[#5B4B8A] hover:bg-[#EDE7F6]">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(breed)} disabled={updateBreed.isPending || deleteBreed.isPending} className="text-red-600 hover:bg-red-50">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

