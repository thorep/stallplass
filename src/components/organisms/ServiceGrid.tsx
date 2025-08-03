import { ServiceWithDetails } from '@/types/service';
import ServiceCard from '@/components/molecules/ServiceCard';

interface ServiceGridProps {
  services: ServiceWithDetails[];
  showContactInfo?: boolean;
  className?: string;
}

export default function ServiceGrid({ 
  services, 
  showContactInfo = false,
  className = '' 
}: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Ingen tjenester funnet.</p>
        <p className="text-gray-400 text-sm mt-2">
          Prøv å endre søkekriteriene eller området du søker i.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          showContactInfo={showContactInfo}
        />
      ))}
    </div>
  );
}