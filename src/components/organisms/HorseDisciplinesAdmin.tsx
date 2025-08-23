'use client';

import { useState } from 'react';
import {
  useAdminHorseDisciplines,
  useCreateHorseDiscipline,
  useUpdateHorseDiscipline,
  useDeleteHorseDiscipline,
  type AdminHorseDiscipline,
} from '@/hooks/useAdminHorseDisciplines';
import { useIsAdmin } from '@/hooks/useAdminQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WrenchScrewdriverIcon as DisciplineIcon, PencilIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function HorseDisciplinesAdmin() {
  useIsAdmin();

  const { data: disciplines = [], isLoading, error } = useAdminHorseDisciplines();
  const createDiscipline = useCreateHorseDiscipline();
  const updateDiscipline = useUpdateHorseDiscipline();
  const deleteDiscipline = useDeleteHorseDiscipline();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const startEdit = (d: AdminHorseDiscipline) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditIsActive(d.isActive);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIsActive(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createDiscipline.mutateAsync({ name: newName.trim(), isActive: newIsActive });
      setNewName('');
      setNewIsActive(true);
      setShowAddForm(false);
    } catch {}
  };

  const handleSave = async (id: string) => {
    const payload: { name?: string; isActive?: boolean } = {};
    const original = disciplines.find(x => x.id === id);
    if (!original) return;
    if (editName.trim() !== original.name) payload.name = editName.trim();
    if (editIsActive !== original.isActive) payload.isActive = editIsActive;
    if (Object.keys(payload).length === 0) return cancelEdit();
    try {
      await updateDiscipline.mutateAsync({ id, data: payload });
      cancelEdit();
    } catch {}
  };

  const handleDelete = async (d: AdminHorseDiscipline) => {
    if (!confirm(`Er du sikker på at du vil slette "${d.name}"? Denne handlingen kan ikke angres.`)) return;
    try {
      await deleteDiscipline.mutateAsync(d.id);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Laster hestedisipliner...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Feil ved lasting av hestedisipliner</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DisciplineIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-800">Hestedisipliner ({disciplines.length})</h2>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={createDiscipline.isPending} className="bg-[#D2691E] hover:bg-[#A0521D] text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Legg til disiplin
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Legg til ny hestedisiplin</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Navn</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Eks: Dressur" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              <Switch id="newIsActive" checked={newIsActive} onCheckedChange={setNewIsActive} />
              <label htmlFor="newIsActive" className="text-sm text-slate-700">Aktiv</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createDiscipline.isPending || !newName.trim()} className="bg-[#D2691E] hover:bg-[#A0521D] text-white">
              <CheckIcon className="h-4 w-4 mr-2" />
              {createDiscipline.isPending ? 'Oppretter...' : 'Opprett'}
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); setNewName(''); setNewIsActive(true); }}>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {disciplines.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <DisciplineIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p>Ingen hestedisipliner funnet. Legg til den første!</p>
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
                {disciplines.map((d) => (
                  <tr key={d.id} className={editingId === d.id ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                    <td className="px-6 py-4">
                      {editingId === d.id ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{d.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === d.id ? (
                        <div className="flex items-center gap-2">
                          <Switch id={`active-${d.id}`} checked={editIsActive} onCheckedChange={setEditIsActive} />
                          <label htmlFor={`active-${d.id}`} className="text-sm text-slate-700">Aktiv</label>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {d.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(d.createdAt).toLocaleDateString('nb-NO')}</td>
                    <td className="px-6 py-4 text-right">
                      {editingId === d.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleSave(d.id)} disabled={updateDiscipline.isPending || !editName.trim()} className="text-white bg-green-600 hover:bg-green-700">
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={updateDiscipline.isPending}>
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(d)} disabled={updateDiscipline.isPending || deleteDiscipline.isPending} className="text-[#5B4B8A] hover:bg-[#EDE7F6]">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(d)} disabled={updateDiscipline.isPending || deleteDiscipline.isPending} className="text-red-600 hover:bg-red-50">
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

