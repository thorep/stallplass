'use client';

import { useState } from 'react';
import { RoadmapItem, RoadmapStatus, RoadmapPriority } from '@/types';
import { 
  useAdminRoadmapItems,
  useCreateRoadmapItem,
  useUpdateRoadmapItem,
  useDeleteRoadmapItem
} from '@/hooks/useAdminQueries';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface RoadmapAdminProps {
  initialItems: RoadmapItem[];
}

export function RoadmapAdmin({ initialItems }: RoadmapAdminProps) {
  const { data: items = initialItems } = useAdminRoadmapItems();
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const createItem = useCreateRoadmapItem();
  const updateItem = useUpdateRoadmapItem();
  const deleteItem = useDeleteRoadmapItem();

  const handleCreateItem = async (formData: FormData) => {
    try {
      await createItem.mutateAsync({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        status: formData.get('status') as RoadmapStatus,
        priority: formData.get('priority') as RoadmapPriority,
        estimatedDate: formData.get('estimatedDate') ? new Date(formData.get('estimatedDate') as string) : null,
        isPublic: formData.get('isPublic') === 'on',
        sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdateItem = async (formData: FormData) => {
    if (!editingItem) return;
    
    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        status: formData.get('status') as RoadmapStatus,
        priority: formData.get('priority') as RoadmapPriority,
        estimatedDate: formData.get('estimatedDate') ? new Date(formData.get('estimatedDate') as string) : null,
        isPublic: formData.get('isPublic') === 'on',
        sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette dette elementet?')) return;
    
    try {
      await deleteItem.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await updateItem.mutateAsync({
        id,
        status: 'COMPLETED',
        completedDate: new Date(),
      });
    } catch (error) {
      console.error('Error marking item complete:', error);
    }
  };

  const RoadmapForm = ({ item, onSubmit, onCancel }: { 
    item?: RoadmapItem; 
    onSubmit: (formData: FormData) => void; 
    onCancel: () => void; 
  }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tittel
          </label>
          <input
            type="text"
            name="title"
            defaultValue={item?.title || ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Kategori
          </label>
          <input
            type="text"
            name="category"
            defaultValue={item?.category || ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Beskrivelse
        </label>
        <textarea
          name="description"
          defaultValue={item?.description || ''}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={item?.status || 'PLANNED'}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PLANNED">Planlagt</option>
            <option value="IN_PROGRESS">Under utvikling</option>
            <option value="COMPLETED">Ferdig</option>
            <option value="CANCELLED">Avbrutt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Prioritet
          </label>
          <select
            name="priority"
            defaultValue={item?.priority || 'MEDIUM'}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="LOW">Lav</option>
            <option value="MEDIUM">Middels</option>
            <option value="HIGH">Høy</option>
            <option value="CRITICAL">Kritisk</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Estimert dato
          </label>
          <input
            type="date"
            name="estimatedDate"
            defaultValue={item?.estimatedDate ? new Date(item.estimatedDate).toISOString().split('T')[0] : ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sorteringsrekkefølge
          </label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={item?.sortOrder || 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={item?.isPublic ?? true}
            className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-slate-700">Synlig for brukere</span>
        </label>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createItem.isPending || updateItem.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <CheckIcon className="h-4 w-4" />
          {item ? 'Oppdater' : 'Opprett'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 flex items-center gap-2"
        >
          <XMarkIcon className="h-4 w-4" />
          Avbryt
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Roadmap elementer ({items.length})
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Legg til ny
        </button>
      </div>
      
      {showAddForm && (
        <RoadmapForm
          onSubmit={handleCreateItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      
      {editingItem && (
        <RoadmapForm
          item={editingItem}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditingItem(null)}
        />
      )}
      
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Ingen roadmap elementer funnet. Legg til det første!</p>
          </div>
        ) : (
          items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    item.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                    item.status === 'PLANNED' ? 'bg-slate-100 text-slate-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    item.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {item.priority}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs">
                    {item.category}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Order: {item.sortOrder}</span>
                  <span>Public: {item.isPublic ? 'Ja' : 'Nei'}</span>
                  {item.estimatedDate && (
                    <span>Estimert: {new Date(item.estimatedDate).toLocaleDateString('nb-NO')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {item.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleMarkCompleted(item.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Marker som ferdig"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                  title="Rediger"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Slett"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}