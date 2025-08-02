'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { Checkbox } from '@/components/ui/checkbox';
import { usePostInvoiceRequest } from '@/hooks/useInvoiceRequests';
import { useCalculatePricing } from '@/hooks/usePricing';
import { useProfile, useUpdateProfile } from '@/hooks/useUser';
import { useAuth } from '@/lib/supabase-auth-context';
import { formatPrice } from '@/utils/formatting';
import { type InvoiceItemType } from '@/generated/prisma';
import PriceBreakdown from '@/components/molecules/PriceBreakdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormData {
  firstname: string;
  lastname: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
}

interface FieldState {
  isPrefilled: boolean;
  isRequired: boolean;
  isComplete: boolean;
}

function BestillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Get parameters from URL
  const itemType = searchParams.get('itemType') as InvoiceItemType;
  const amount = parseFloat(searchParams.get('amount') || '0');
  const discount = parseFloat(searchParams.get('discount') || '0');
  const description = searchParams.get('description') || '';
  const months = searchParams.get('months') ? parseInt(searchParams.get('months')!) : undefined;
  const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined;
  const slots = searchParams.get('slots') ? parseInt(searchParams.get('slots')!) : undefined;
  const stableId = searchParams.get('stableId') || undefined;
  const serviceId = searchParams.get('serviceId') || undefined;
  const boxId = searchParams.get('boxId') || undefined;

  // Profile data
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: ''
  });

  const [fieldStates, setFieldStates] = useState<Record<keyof FormData, FieldState>>({} as Record<keyof FormData, FieldState>);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const createInvoiceRequest = usePostInvoiceRequest();

  // Initialize form with profile data
  useEffect(() => {
    if (user?.email && !isFormInitialized) {
      // Handle case where profile might be null or empty (like test users)
      const safeProfile = profile || {};
      const hasAllRequiredData = safeProfile.firstname && safeProfile.lastname && safeProfile.Adresse1 && safeProfile.Postnummer && safeProfile.Poststed;
      const hasAnyProfileData = safeProfile.firstname || safeProfile.lastname || safeProfile.Adresse1 || safeProfile.Postnummer || safeProfile.Poststed || safeProfile.phone;
      
      const newFormData: FormData = {
        firstname: safeProfile.firstname || '',
        lastname: safeProfile.lastname || '',
        address: safeProfile.Adresse1 || '',
        postalCode: safeProfile.Postnummer || '',
        city: safeProfile.Poststed || '',
        phone: safeProfile.phone || '',
        email: user.email
      };

      const newFieldStates: Record<keyof FormData, FieldState> = {
        firstname: {
          isPrefilled: !!safeProfile.firstname,
          isRequired: true,
          isComplete: !!safeProfile.firstname
        },
        lastname: {
          isPrefilled: !!safeProfile.lastname,
          isRequired: true,
          isComplete: !!safeProfile.lastname
        },
        address: {
          isPrefilled: !!safeProfile.Adresse1,
          isRequired: true,
          isComplete: !!safeProfile.Adresse1
        },
        postalCode: {
          isPrefilled: !!safeProfile.Postnummer,
          isRequired: true,
          isComplete: !!safeProfile.Postnummer
        },
        city: {
          isPrefilled: !!safeProfile.Poststed,
          isRequired: true,
          isComplete: !!safeProfile.Poststed
        },
        phone: {
          isPrefilled: !!safeProfile.phone,
          isRequired: true,
          isComplete: !!safeProfile.phone
        },
        email: {
          isPrefilled: !!user.email,
          isRequired: true,
          isComplete: !!user.email
        }
      };

      setFormData(newFormData);
      setFieldStates(newFieldStates);
      setIsFormInitialized(true);
      
      // If user has any profile data but it's incomplete, suggest saving completed data
      // For users with no profile data at all, default to suggesting save
      if (!hasAllRequiredData && hasAnyProfileData) {
        setSaveToProfile(true);
      } else if (!hasAnyProfileData) {
        // For completely empty profiles (like test users), suggest saving
        setSaveToProfile(true);
      }
    }
  }, [profile, user?.email, isFormInitialized]);

  // Calculate pricing based on URL parameters for BOX_ADVERTISING
  // For bulk purchases, boxId contains comma-separated box IDs
  const boxCount = boxId ? boxId.split(',').length : 1;
  const { data: pricing, isLoading: pricingLoading } = useCalculatePricing(
    boxCount, // Correct number of boxes (1 for single, multiple for bulk)
    months || 1
  );

  // Redirect back if required parameters are missing
  useEffect(() => {
    if (!itemType || !amount || !description) {
      console.log('Missing required parameters:', { itemType, amount, description });
      // Use replace instead of back to avoid navigation issues
      router.replace('/dashboard?tab=stables');
    }
  }, [itemType, amount, description, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use updated pricing for BOX_ADVERTISING if available
    const finalAmount = itemType === 'BOX_ADVERTISING' && pricing ? 
      Math.round(pricing.finalPrice) : amount;
    const finalDiscount = itemType === 'BOX_ADVERTISING' && pricing ? 
      Math.round(pricing.monthDiscount + pricing.boxQuantityDiscount) : discount;

    try {
      // Save to profile if requested and user made changes
      if (saveToProfile && profile) {
        const profileUpdates: {
          firstname?: string;
          lastname?: string;
          Adresse1?: string;
          Postnummer?: string;
          Poststed?: string;
          phone?: string;
        } = {};
        const hasChanges = 
          formData.firstname !== (profile.firstname || '') ||
          formData.lastname !== (profile.lastname || '') ||
          formData.address !== (profile.Adresse1 || '') ||
          formData.postalCode !== (profile.Postnummer || '') ||
          formData.city !== (profile.Poststed || '') ||
          formData.phone !== (profile.phone || '');

        if (hasChanges) {
          if (formData.firstname) profileUpdates.firstname = formData.firstname;
          if (formData.lastname) profileUpdates.lastname = formData.lastname;
          if (formData.address) profileUpdates.Adresse1 = formData.address;
          if (formData.postalCode) profileUpdates.Postnummer = formData.postalCode;
          if (formData.city) profileUpdates.Poststed = formData.city;
          if (formData.phone) profileUpdates.phone = formData.phone;

          await updateProfile.mutateAsync(profileUpdates);
        }
      }

      // Create invoice request with legacy format
      const fullName = `${formData.firstname} ${formData.lastname}`.trim();
      await createInvoiceRequest.mutateAsync({
        fullName,
        address: formData.address,
        postalCode: formData.postalCode,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        amount: finalAmount,
        discount: finalDiscount,
        description,
        itemType,
        months,
        days,
        slots,
        stableId,
        serviceId,
        boxId
      });

      // Show success message
      toast.success('Takk! Din bestilling er aktivert og du vil motta faktura på e-post.');
      router.push('/dashboard?tab=stables');
    } catch {
      // Error is handled by TanStack Query
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update field state
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        isComplete: value.trim().length > 0
      }
    }));
  };

  const getFieldIcon = (fieldState: FieldState) => {
    if (fieldState.isComplete && fieldState.isPrefilled) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    if (fieldState.isRequired && !fieldState.isComplete) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />;
    }
    return null;
  };

  const getFieldClassName = (fieldState: FieldState) => {
    if (fieldState.isComplete && fieldState.isPrefilled) {
      return 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500';
    }
    if (fieldState.isRequired && !fieldState.isComplete) {
      return 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-500';
    }
    return '';
  };

  const missingRequiredFields = Object.entries(fieldStates)
    .filter(([, state]) => state.isRequired && !state.isComplete)
    .map(([field]) => field);
  
  const hasPrefilledData = Object.values(fieldStates).some(state => state.isPrefilled);
  const hasIncompleteData = Object.values(fieldStates).some(state => state.isRequired && !state.isComplete);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Tilbake
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Bestill med faktura</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Bestillingsdetaljer</h2>
              <div className="space-y-3">
                <p className="text-gray-600">{description}</p>
                
                {itemType === 'BOX_ADVERTISING' && pricingLoading ? (
                  <div className="border-t pt-3 text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Beregner pris...</p>
                  </div>
                ) : itemType === 'BOX_ADVERTISING' && pricing ? (
                  <>
                    <PriceBreakdown 
                      basePrice={pricing.baseMonthlyPrice}
                      quantity={months || 1}
                      quantityLabel="måned"
                      discount={pricing.monthDiscountPercentage > 0 ? {
                        percentage: pricing.monthDiscountPercentage,
                        amount: pricing.monthDiscount,
                        label: "Perioderabatt"
                      } : undefined}
                      finalPrice={pricing.finalPrice}
                      className="border-t pt-3"
                    />
                    {pricing.monthDiscountPercentage > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-green-700 font-medium">
                          🎉 Du sparer {formatPrice(pricing.monthDiscount)} med lengre periode!
                        </p>
                      </div>
                    )}
                  </>
                ) : itemType === 'BOX_SPONSORED' && days ? (
                  <PriceBreakdown 
                    basePrice={amount / days}
                    quantity={days}
                    quantityLabel="dag"
                    discount={discount > 0 ? {
                      percentage: Math.round((discount / (amount + discount)) * 100),
                      amount: discount,
                      label: "Rabatt"
                    } : undefined}
                    finalPrice={amount}
                    className="border-t pt-3"
                  />
                ) : itemType === 'SERVICE_ADVERTISING' && months ? (
                  <PriceBreakdown 
                    basePrice={amount / months}
                    quantity={months}
                    quantityLabel="måned"
                    discount={discount > 0 ? {
                      percentage: Math.round((discount / (amount + discount)) * 100),
                      amount: discount,
                      label: "Perioderabatt"
                    } : undefined}
                    finalPrice={amount}
                    className="border-t pt-3"
                  />
                ) : (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beløp:</span>
                      <span className="font-medium">{amount.toFixed(2)} kr</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rabatt:</span>
                        <span>-{discount.toFixed(0)}%</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Totalt:</span>
                      <span>{amount.toFixed(2)} kr</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Viktig informasjon:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Din bestilling aktiveres umiddelbart</li>
                  <li>• Du vil motta faktura på e-post innen 1-2 virkedager</li>
                  <li>• Betalingsfrist er 14 dager fra fakturadato</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Fakturaopplysninger</h2>
              
              {/* Profile status banner */}
              {!profileLoading && isFormInitialized && (
                <div className="mb-6">
                  {hasPrefilledData && !hasIncompleteData ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-green-800">Profil komplett</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Alle nødvendige opplysninger er fylt ut fra din profil.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : hasIncompleteData ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-amber-800">Fyll ut manglende felter</h3>
                          <p className="text-sm text-amber-700 mt-1">
                            {hasPrefilledData 
                              ? `Noen felter er fylt ut fra din profil. Vennligst fyll ut de ${missingRequiredFields.length} manglende feltene.`
                              : 'Vennligst fyll ut alle påkrevde felter for fakturering.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">Ny bestilling</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Fyll ut opplysningene nedenfor. Du kan velge å lagre disse til din profil for raskere bestillinger i fremtiden.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        Fornavn *
                        {fieldStates.firstname && getFieldIcon(fieldStates.firstname)}
                      </div>
                    </label>
                    <Input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      required
                      placeholder="Fornavn"
                      className={cn(
                        "w-full",
                        fieldStates.firstname && getFieldClassName(fieldStates.firstname)
                      )}
                      data-cy="firstname-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        Etternavn *
                        {fieldStates.lastname && getFieldIcon(fieldStates.lastname)}
                      </div>
                    </label>
                    <Input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      required
                      placeholder="Etternavn"
                      className={cn(
                        "w-full",
                        fieldStates.lastname && getFieldClassName(fieldStates.lastname)
                      )}
                      data-cy="lastname-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      Adresse *
                      {fieldStates.address && getFieldIcon(fieldStates.address)}
                    </div>
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Gateadresse"
                    className={cn(
                      "w-full",
                      fieldStates.address && getFieldClassName(fieldStates.address)
                    )}
                    data-cy="address-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        Postnr *
                        {fieldStates.postalCode && getFieldIcon(fieldStates.postalCode)}
                      </div>
                    </label>
                    <Input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      required
                      placeholder="1234"
                      className={cn(
                        "w-full",
                        fieldStates.postalCode && getFieldClassName(fieldStates.postalCode)
                      )}
                      data-cy="postal-code-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        Sted *
                        {fieldStates.city && getFieldIcon(fieldStates.city)}
                      </div>
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      placeholder="Oslo"
                      className={cn(
                        "w-full",
                        fieldStates.city && getFieldClassName(fieldStates.city)
                      )}
                      data-cy="city-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      Telefon *
                      {fieldStates.phone && getFieldIcon(fieldStates.phone)}
                    </div>
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    placeholder="12345678"
                    className={cn(
                      "w-full",
                      fieldStates.phone && getFieldClassName(fieldStates.phone)
                    )}
                    data-cy="phone-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      E-post *
                      {fieldStates.email && getFieldIcon(fieldStates.email)}
                    </div>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="din@epost.no"
                    className={cn(
                      "w-full",
                      fieldStates.email && getFieldClassName(fieldStates.email)
                    )}
                    data-cy="email-input"
                    disabled={!!user?.email}
                  />
                  {user?.email && (
                    <p className="text-xs text-gray-500 mt-1">
                      E-postadressen din hentes automatisk fra kontoen din
                    </p>
                  )}
                </div>

                {/* Save to profile option */}
                {!profileLoading && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="save-to-profile"
                        checked={saveToProfile}
                        onCheckedChange={(checked) => setSaveToProfile(checked === true)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="save-to-profile"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Lagre opplysninger til min profil
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {hasPrefilledData 
                            ? 'Oppdater profilinformasjonen din med eventuelle endringer'
                            : 'Lagre disse opplysningene for raskere bestillinger i fremtiden'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <ErrorMessage error={createInvoiceRequest.error} />

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    loading={createInvoiceRequest.isPending}
                    className="flex-1"
                    data-cy="submit-invoice-request-button"
                  >
                    Bestill med faktura
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BestillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    }>
      <BestillPageContent />
    </Suspense>
  );
}