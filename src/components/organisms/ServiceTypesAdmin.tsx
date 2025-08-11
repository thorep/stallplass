'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  useGetServiceTypes,
  useCreateServiceType,
  useUpdateServiceType,
  useDeleteServiceType,
  type ServiceType,
  type CreateServiceTypeData,
  type UpdateServiceTypeData
} from '@/hooks/useServiceTypes';
import { useIsAdmin } from '@/hooks/useAdminQueries';

interface ServiceTypeFormData {
  name: string;
  displayName: string;
  isActive: boolean;
}

export function ServiceTypesAdmin() {
  useIsAdmin(); // Check admin auth before proceeding
  const { data: serviceTypes = [], isLoading, error } = useGetServiceTypes();
  
  // Mutations
  const createServiceType = useCreateServiceType();
  const updateServiceType = useUpdateServiceType();
  const deleteServiceType = useDeleteServiceType();
  
  // Local state
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ServiceTypeFormData>({
    name: '',
    displayName: '',
    isActive: true
  });

  // Handle create new service type
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.displayName.trim()) return;
    
    try {
      const createData: CreateServiceTypeData = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        isActive: formData.isActive
      };
      
      await createServiceType.mutateAsync(createData);
      
      // Reset form
      setFormData({ name: '', displayName: '', isActive: true });
      setShowAddForm(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  // Handle update service type
  const handleUpdate = async (id: string, data: UpdateServiceTypeData) => {
    try {
      await updateServiceType.mutateAsync({ id, data });
      setEditingServiceType(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  // Handle delete service type
  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${displayName}"? Denne handlingen kan ikke angres.`)) {
      return;
    }
    
    try {
      await deleteServiceType.mutateAsync(id);
    } catch {
      // Error handled by mutation hook
    }
  };

  // Toggle active status
  const handleToggleActive = async (serviceType: ServiceType) => {
    await handleUpdate(serviceType.id, { isActive: !serviceType.isActive });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Laster tjenestetyper...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Feil ved lasting av tjenestetyper</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TagIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            Tjenestetyper ({serviceTypes.length})
          </h2>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          disabled={createServiceType.isPending}
        >
          <PlusIcon className="h-4 w-4" />
          Legg til tjenestetype
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Legg til ny tjenestetype</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Internt navn
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="eks: veterinary_care"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Visningsnavn
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="eks: Veterinærtjenester"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Aktiv
            </label>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createServiceType.isPending || !formData.name.trim() || !formData.displayName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {createServiceType.isPending ? 'Oppretter...' : 'Opprett'}
            </button>
            
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', displayName: '', isActive: true });
              }}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
            >
              <XMarkIcon className="h-4 w-4" />
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Service Types Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {serviceTypes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <TagIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p>Ingen tjenestetyper funnet. Legg til den første!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Visningsnavn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Internt navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Opprettet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {serviceTypes.map((serviceType) => (
                  <ServiceTypeRow
                    key={serviceType.id}
                    serviceType={serviceType}
                    isEditing={editingServiceType?.id === serviceType.id}
                    onEdit={() => setEditingServiceType(serviceType)}
                    onSave={(data) => handleUpdate(serviceType.id, data)}
                    onCancel={() => setEditingServiceType(null)}
                    onDelete={() => handleDelete(serviceType.id, serviceType.displayName)}
                    onToggleActive={() => handleToggleActive(serviceType)}
                    isUpdating={updateServiceType.isPending}
                    isDeleting={deleteServiceType.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface ServiceTypeRowProps {
  serviceType: ServiceType;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: UpdateServiceTypeData) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function ServiceTypeRow({
  serviceType,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleActive,
  isUpdating,
  isDeleting
}: ServiceTypeRowProps) {
  const [editData, setEditData] = useState({
    name: serviceType.name,
    displayName: serviceType.displayName,
    isActive: serviceType.isActive
  });

  const handleSave = () => {
    if (!editData.name.trim() || !editData.displayName.trim()) return;
    
    const updates: UpdateServiceTypeData = {};
    if (editData.name !== serviceType.name) updates.name = editData.name.trim();
    if (editData.displayName !== serviceType.displayName) updates.displayName = editData.displayName.trim();
    if (editData.isActive !== serviceType.isActive) updates.isActive = editData.isActive;
    
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    } else {
      onCancel();
    }
  };

  const handleCancel = () => {
    setEditData({
      name: serviceType.name,
      displayName: serviceType.displayName,
      isActive: serviceType.isActive
    });
    onCancel();
  };

  if (isEditing) {
    return (
      <tr className="bg-slate-50">
        <td className="px-6 py-4">
          <input
            type="text"
            value={editData.displayName}
            onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </td>
        <td className="px-6 py-4">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </td>
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={editData.isActive}
            onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          />
        </td>
        <td className="px-6 py-4 text-sm text-slate-500">
          {new Date(serviceType.createdAt).toLocaleDateString('nb-NO')}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isUpdating || !editData.name.trim() || !editData.displayName.trim()}
              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="p-1 text-slate-600 hover:bg-slate-50 rounded disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4 text-sm font-medium text-slate-900">
        {serviceType.displayName}
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 font-mono">
        {serviceType.name}
      </td>
      <td className="px-6 py-4">
        <button
          onClick={onToggleActive}
          disabled={isUpdating}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            serviceType.isActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {serviceType.isActive ? 'Aktiv' : 'Inaktiv'}
        </button>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {new Date(serviceType.createdAt).toLocaleDateString('nb-NO')}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={onEdit}
            disabled={isUpdating || isDeleting}
            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isUpdating || isDeleting}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}