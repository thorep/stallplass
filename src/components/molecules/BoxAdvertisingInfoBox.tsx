import Link from 'next/link';
import { MegaphoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface BoxAdvertisingInfoBoxProps {
  show: boolean;
}

export default function BoxAdvertisingInfoBox({ show }: BoxAdvertisingInfoBoxProps) {
  if (!show) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-6">
      <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-body font-medium text-amber-800">
            Din boks er ikke synlig for andre
          </p>
          <p className="text-body-sm text-amber-700">
            For at andre skal kunne finne boksen din i søk, må du aktivere annonsering. 
            Kun du kan se denne siden akkurat nå.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button 
            asChild 
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/analyse">
              <MegaphoneIcon className="h-4 w-4 mr-2" />
              Aktiver annonsering
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}