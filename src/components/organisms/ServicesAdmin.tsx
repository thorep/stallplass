'use client';

import { useState } from 'react';
import { useAdminServices } from '@/hooks/useAdminQueries';
import { useRestoreService } from '@/hooks/useServiceMutations';
import { 
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminService {
  id: string;
  title: string;
  description: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  advertisingActive: boolean;
  advertisingEndDate?: string | null;
  archived: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  profiles: {
    id: string;
    nickname?: string;
    phone?: string;
    firstname?: string;
    lastname?: string;
  };
  service_types: {
    id: string;
    name: string;
    displayName: string;
  };
  service_areas: Array<{
    id: string;
    county: string;
    municipality?: string;
  }>;
  _count: {
    service_areas: number;
  };
}

export function ServicesAdmin() {
  const { data: services, isLoading, error } = useAdminServices();
  const restoreService = useRestoreService();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (serviceId: string) => {
    setRestoringId(serviceId);
    try {
      await restoreService.mutateAsync(serviceId);
    } catch (error) {
      console.error('Failed to restore service:', error);
    } finally {
      setRestoringId(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600">Laster tjenester...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Kunne ikke laste tjenester</h3>
        <p className="text-slate-600">Prøv å oppdatere siden eller kontakt support hvis problemet vedvarer.</p>
      </div>
    );
  }

  const activeServices = services?.filter((service: AdminService) => !service.archived) || [];
  const archivedServices = services?.filter((service: AdminService) => service.archived) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-bold text-slate-800">Tjenester</h2>
          <p className="text-body-sm text-slate-600 mt-1">
            Administrer alle tjenester i systemet
          </p>
        </div>
        <div className="flex items-center space-x-4 text-body-sm text-slate-600">
          <span>Aktive: {activeServices.length}</span>
          <span>Arkiverte: {archivedServices.length}</span>
          <span>Totalt: {services?.length || 0}</span>
        </div>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Aktive tjenester</h3>
          <div className="grid gap-4">
            {activeServices.map((service: AdminService) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Archived Services */}
      {archivedServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Arkiverte tjenester</h3>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
              {archivedServices.length} arkiverte
            </span>
          </div>
          <div className="grid gap-4">
            {archivedServices.map((service: AdminService) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onRestore={handleRestore}
                isRestoring={restoringId === service.id}
              />
            ))}
          </div>
        </div>
      )}

      {(!services || services.length === 0) && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Ingen tjenester funnet</h3>
          <p className="text-slate-600">Det er ingen registrerte tjenester i systemet ennå.</p>
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: AdminService;
  onRestore?: (id: string) => void;
  isRestoring?: boolean;
}

function ServiceCard({ service, onRestore, isRestoring }: ServiceCardProps) {
  const isArchived = service.archived;
  const ownerName = service.profiles.nickname || 
                   [service.profiles.firstname, service.profiles.lastname].filter(Boolean).join(' ') || 
                   'Ukjent bruker';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'veterinarian': return 'bg-red-100 text-red-800';
      case 'farrier': return 'bg-blue-100 text-blue-800';
      case 'trainer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`p-6 ${isArchived ? 'opacity-75 border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-slate-800 truncate">
              {service.title}
            </h4>
            <span 
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getServiceTypeBadgeColor(service.service_types.name)}`}
            >
              {service.service_types.displayName}
            </span>
            {isArchived && (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Arkivert</span>
            )}
            {!service.isActive && !isArchived && (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Inaktiv</span>
            )}
            {service.advertisingActive && (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Annonsering aktiv</span>
            )}
          </div>

          <p className="text-slate-600 mb-4 line-clamp-2">
            {service.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4" />
              <span>Eier: {ownerName}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <PhoneIcon className="h-4 w-4" />
              <span>Kontakt: {service.contactName}</span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-4 w-4" />
              <span>Områder: {service._count.service_areas}</span>
            </div>

            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Opprettet: {formatDate(service.createdAt)}</span>
            </div>
          </div>

          {isArchived && service.deletedAt && (
            <div className="mt-2 text-sm text-orange-600 flex items-center space-x-2">
              <TrashIcon className="h-4 w-4" />
              <span>Arkivert: {formatDate(service.deletedAt)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {isArchived && onRestore && (
            <Button
              onClick={() => onRestore(service.id)}
              disabled={isRestoring}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRestoring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Gjenopprett
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" size="sm">
            <EyeIcon className="h-4 w-4 mr-1" />
            Vis detaljer
          </Button>
        </div>
      </div>
    </Card>
  );
}

