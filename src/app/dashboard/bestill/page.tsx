"use client";

import Button from "@/components/atoms/Button";
import ErrorMessage from "@/components/atoms/ErrorMessage";
import { Input } from "@/components/atoms/Input";
import PriceBreakdown from "@/components/molecules/PriceBreakdown";
import { Checkbox } from "@/components/ui/checkbox";
import { type InvoiceItemType } from "@/generated/prisma";
import { usePostInvoiceRequest } from "@/hooks/useInvoiceRequests";
import { useCalculatePricing } from "@/hooks/usePricing";
import { useProfile, useUpdateProfile } from "@/hooks/useUser";
import { useValidateDiscountCode, type DiscountCodeValidation } from "@/hooks/useDiscountCodes";
import { useRabattkodeFlag } from "@/hooks/useFlags";
import { useKampanjeFlag } from "@/hooks/useKampanjeFlag";
import { useAuth } from "@/lib/supabase-auth-context";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import { formatPrice } from "@/utils/formatting";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

// Validation schema for form fields
const formSchema = z.object({
  firstname: z.string().min(1, "Fornavn er påkrevd").max(50, "Fornavn kan ikke være lengre enn 50 tegn"),
  lastname: z.string().min(1, "Etternavn er påkrevd").max(50, "Etternavn kan ikke være lengre enn 50 tegn"),
  address: z.string().min(1, "Adresse er påkrevd").max(100, "Adresse kan ikke være lengre enn 100 tegn"),
  postalCode: z.string()
    .min(4, "Postnummer må være 4 siffer")
    .max(4, "Postnummer må være 4 siffer")
    .regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().min(1, "Sted er påkrevd").max(50, "Sted kan ikke være lengre enn 50 tegn"),
  phone: z.string()
    .min(8, "Telefonnummer må være minst 8 siffer")
    .max(12, "Telefonnummer kan ikke være lengre enn 12 siffer")
    .regex(/^[\d\s+()-]+$/, "Telefonnummer kan bare inneholde tall, mellomrom og +()-")
    .refine((phone) => {
      // Remove all non-digit characters for validation
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length >= 8 && digitsOnly.length <= 12;
    }, "Telefonnummer må være mellom 8-12 siffer"),
  email: z.string().email("Ugyldig e-postadresse").max(100, "E-postadresse kan ikke være lengre enn 100 tegn"),
});

type FormData = z.infer<typeof formSchema>;

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
  const itemType = searchParams.get("itemType") as InvoiceItemType;
  const amount = parseFloat(searchParams.get("amount") || "0");
  const discount = parseFloat(searchParams.get("discount") || "0");
  const description = searchParams.get("description") || "";
  const months = searchParams.get("months") ? parseInt(searchParams.get("months")!) : undefined;
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : undefined;
  const slots = searchParams.get("slots") ? parseInt(searchParams.get("slots")!) : undefined;
  const stableId = searchParams.get("stableId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  const boxId = searchParams.get("boxId") || undefined;

  // Profile data
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();

  const [fieldStates, setFieldStates] = useState<Record<keyof FormData, FieldState>>(
    {} as Record<keyof FormData, FieldState>
  );
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Initialize TanStack Form
  const form = useForm({
    defaultValues: {
      firstname: "",
      lastname: "",
      address: "",
      postalCode: "",
      city: "",
      phone: "",
      email: "",
    } as FormData,
  });

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountValidation, setDiscountValidation] = useState<DiscountCodeValidation | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  const createInvoiceRequest = usePostInvoiceRequest();
  const validateDiscountCode = useValidateDiscountCode();
  const { showRabattkode, loading: flagLoading } = useRabattkodeFlag();
  const isKampanjeActive = useKampanjeFlag();

  // Initialize form with profile data
  useEffect(() => {
    if (user?.email && !isFormInitialized) {
      // Handle case where profile might be null or empty (like test users)
      const safeProfile = profile || ({} as Partial<Profile>);
      const hasAllRequiredData =
        safeProfile.firstname &&
        safeProfile.lastname &&
        safeProfile.Adresse1 &&
        safeProfile.Postnummer &&
        safeProfile.Poststed;
      const hasAnyProfileData =
        safeProfile.firstname ||
        safeProfile.lastname ||
        safeProfile.Adresse1 ||
        safeProfile.Postnummer ||
        safeProfile.Poststed ||
        safeProfile.phone;

      const newFormData: FormData = {
        firstname: safeProfile.firstname || "",
        lastname: safeProfile.lastname || "",
        address: safeProfile.Adresse1 || "",
        postalCode: safeProfile.Postnummer || "",
        city: safeProfile.Poststed || "",
        phone: safeProfile.phone || "",
        email: user.email,
      };

      // Update form values
      form.setFieldValue("firstname", newFormData.firstname);
      form.setFieldValue("lastname", newFormData.lastname);
      form.setFieldValue("address", newFormData.address);
      form.setFieldValue("postalCode", newFormData.postalCode);
      form.setFieldValue("city", newFormData.city);
      form.setFieldValue("phone", newFormData.phone);
      form.setFieldValue("email", newFormData.email);

      const newFieldStates: Record<keyof FormData, FieldState> = {
        firstname: {
          isPrefilled: !!safeProfile.firstname,
          isRequired: true,
          isComplete: !!safeProfile.firstname,
        },
        lastname: {
          isPrefilled: !!safeProfile.lastname,
          isRequired: true,
          isComplete: !!safeProfile.lastname,
        },
        address: {
          isPrefilled: !!safeProfile.Adresse1,
          isRequired: true,
          isComplete: !!safeProfile.Adresse1,
        },
        postalCode: {
          isPrefilled: !!safeProfile.Postnummer,
          isRequired: true,
          isComplete: !!safeProfile.Postnummer,
        },
        city: {
          isPrefilled: !!safeProfile.Poststed,
          isRequired: true,
          isComplete: !!safeProfile.Poststed,
        },
        phone: {
          isPrefilled: !!safeProfile.phone,
          isRequired: true,
          isComplete: !!safeProfile.phone,
        },
        email: {
          isPrefilled: !!user.email,
          isRequired: true,
          isComplete: !!user.email,
        },
      };

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
  }, [profile, user?.email, isFormInitialized, form]);

  // Calculate pricing based on URL parameters for BOX_ADVERTISING
  // For bulk purchases, boxId contains comma-separated box IDs
  const boxCount = boxId ? boxId.split(",").length : 1;
  const { data: pricing, isLoading: pricingLoading } = useCalculatePricing(
    boxCount, // Correct number of boxes (1 for single, multiple for bulk)
    months || 1
  );

  // Redirect back if required parameters are missing
  useEffect(() => {
    if (!itemType || !amount || !description) {
      // Missing required parameters - validation will handle this
      // Use replace instead of back to avoid navigation issues
      router.replace("/dashboard?tab=stables");
    }
  }, [itemType, amount, description, router]);

  const handleSubmit = async (formData: FormData) => {
    // Use updated pricing for BOX_ADVERTISING if available
    const finalAmount =
      itemType === "BOX_ADVERTISING" && pricing ? Math.round(pricing.finalPrice) : amount;
    const finalDiscount =
      itemType === "BOX_ADVERTISING" && pricing
        ? Math.round(pricing.monthDiscount + pricing.boxQuantityDiscount)
        : discount;

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
          formData.firstname !== (profile.firstname || "") ||
          formData.lastname !== (profile.lastname || "") ||
          formData.address !== (profile.Adresse1 || "") ||
          formData.postalCode !== (profile.Postnummer || "") ||
          formData.city !== (profile.Poststed || "") ||
          formData.phone !== (profile.phone || "");

        if (hasChanges) {
          // Only include non-empty values to avoid validation errors
          if (formData.firstname.trim()) profileUpdates.firstname = formData.firstname.trim();
          if (formData.lastname.trim()) profileUpdates.lastname = formData.lastname.trim();
          if (formData.address.trim()) profileUpdates.Adresse1 = formData.address.trim();
          if (formData.postalCode.trim()) profileUpdates.Postnummer = formData.postalCode.trim();
          if (formData.city.trim()) profileUpdates.Poststed = formData.city.trim();
          if (formData.phone.trim()) profileUpdates.phone = formData.phone.trim();

          try {
            await updateProfile.mutateAsync(profileUpdates);
          } catch (profileError) {
            // Handle profile update errors specifically
            const error = profileError as {
              response?: {
                data?: { error?: string; details?: Array<{ path?: string[]; message: string }> };
              };
            };
            const errorMessage = error?.response?.data?.error || "Kunne ikke lagre til profil";
            const details = error?.response?.data?.details;

            if (details && Array.isArray(details)) {
              const fieldErrors = details
                .map((detail) => {
                  const field = detail.path?.[0];
                  const fieldNames: Record<string, string> = {
                    firstname: "Fornavn",
                    lastname: "Etternavn",
                    Adresse1: "Adresse",
                    Postnummer: "Postnummer",
                    Poststed: "Poststed",
                    phone: "Telefon",
                  };
                  const fieldName = field ? fieldNames[field] || field : "Felt";
                  return `${fieldName}: ${detail.message}`;
                })
                .join(", ");

              toast.error(`1 Profiloppdatering feilet: ${fieldErrors}`);
            } else {
              toast.error(`2 Profiloppdatering feilet: ${errorMessage}`);
            }

            // Don't continue with invoice creation if profile save was explicitly requested but failed
            return;
          }
        }
      }

      // Create invoice request with legacy format
      const fullName = `${formData.firstname} ${formData.lastname}`.trim();
      
      // Calculate final amount with discount code if applied
      const discountCodeAmount = discountValidation?.isValid ? discountValidation.discountAmount : 0;
      const finalAmountWithDiscountCode = discountValidation?.isValid && discountValidation.finalAmount !== undefined 
        ? discountValidation.finalAmount 
        : finalAmount;
      
      await createInvoiceRequest.mutateAsync({
        fullName,
        address: formData.address,
        postalCode: formData.postalCode,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        amount: finalAmountWithDiscountCode,
        discount: finalDiscount + discountCodeAmount,
        description,
        itemType,
        months,
        days,
        slots,
        stableId,
        serviceId,
        boxId,
        discountCode: discountValidation?.isValid ? discountCode.trim().toUpperCase() : undefined,
        discountCodeId: discountValidation?.isValid ? discountValidation.discountCodeId : undefined,
      });

      // Show success message
      toast.success("Takk! Din bestilling er aktivert og du vil motta faktura på e-post.");
      router.push("/dashboard?tab=stables");
    } catch (error) {
      // Handle invoice creation errors
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err?.response?.data?.error || "Noe gikk galt med bestillingen";
      toast.error(`Bestilling feilet: ${errorMessage}`);
    }
  };

  // Update field state helper for visual indicators
  const updateFieldState = (field: keyof FormData, value: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        isComplete: value.trim().length > 0,
      },
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
      return "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500";
    }
    if (fieldState.isRequired && !fieldState.isComplete) {
      return "border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-500";
    }
    return "";
  };

  const missingRequiredFields = Object.entries(fieldStates)
    .filter(([, state]) => state.isRequired && !state.isComplete)
    .map(([field]) => field);

  const hasPrefilledData = Object.values(fieldStates).some((state) => state.isPrefilled);
  const hasIncompleteData = Object.values(fieldStates).some(
    (state) => state.isRequired && !state.isComplete
  );

  const handleDiscountCodeChange = async (code: string) => {
    setDiscountCode(code);
    setDiscountValidation(null);

    if (!code.trim()) {
      return;
    }

    setIsValidatingDiscount(true);
    try {
      // Use updated pricing for BOX_ADVERTISING if available
      const finalAmount =
        itemType === "BOX_ADVERTISING" && pricing ? Math.round(pricing.finalPrice) : amount;

      const result = await validateDiscountCode.mutateAsync({
        code: code.trim(),
        amount: finalAmount,
        itemType,
      });
      setDiscountValidation(result);
    } catch (error) {
      console.error("Error validating discount code:", error);
      setDiscountValidation({
        isValid: false,
        discountType: "PERCENTAGE",
        discountValue: 0,
        discountAmount: 0,
        finalAmount: amount,
        errorMessage: "Kunne ikke validere rabattkoden",
      });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

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
        {/* Kampanje Banner */}
        {isKampanjeActive && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">🎉 GRATIS KAMPANJE PÅGÅR!</h2>
                <p className="text-green-100 mb-2">
                  Alle stallplasser og tjenester er helt gratis og blir automatisk aktivert med 6 måneders annonsering! 
                  Når tiden utløper kan du velge å fortsette med betalt annonsering, eller så fjernes annonsen fra søkeresultatene.
                </p>
                <p className="text-sm text-green-200">
                  * Gjelder kun stallplasser og tjenester. Boost er ikke inkludert.
                </p>
              </div>
              <div className="ml-4 text-4xl">
                🏇
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Bestillingsdetaljer</h2>
              <div className="space-y-3">
                <p className="text-gray-600">{description}</p>

                {itemType === "BOX_ADVERTISING" && pricingLoading ? (
                  <div className="border-t pt-3 text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Beregner pris...</p>
                  </div>
                ) : itemType === "BOX_ADVERTISING" && pricing ? (
                  <>
                    <PriceBreakdown
                      basePrice={pricing.baseMonthlyPrice}
                      quantity={months || 1}
                      quantityLabel="måned"
                      discount={
                        pricing.monthDiscountPercentage > 0
                          ? {
                              percentage: pricing.monthDiscountPercentage,
                              amount: pricing.monthDiscount,
                              label: "Perioderabatt",
                            }
                          : undefined
                      }
                      discountCode={
                        discountValidation?.isValid && discountValidation.discountAmount > 0
                          ? {
                              code: discountCode,
                              amount: discountValidation.discountAmount,
                              type: discountValidation.discountType,
                              value: discountValidation.discountValue,
                            }
                          : undefined
                      }
                      finalPrice={discountValidation?.isValid ? discountValidation.finalAmount : pricing.finalPrice}
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
                ) : itemType === "BOX_SPONSORED" && days ? (
                  <PriceBreakdown
                    basePrice={amount / days}
                    quantity={days}
                    quantityLabel="dag"
                    discount={
                      discount > 0
                        ? {
                            percentage: Math.round((discount / (amount + discount)) * 100),
                            amount: discount,
                            label: "Rabatt",
                          }
                        : undefined
                    }
                    discountCode={
                      discountValidation?.isValid && discountValidation.discountAmount > 0
                        ? {
                            code: discountCode,
                            amount: discountValidation.discountAmount,
                            type: discountValidation.discountType,
                            value: discountValidation.discountValue,
                          }
                        : undefined
                    }
                    finalPrice={discountValidation?.isValid ? discountValidation.finalAmount : amount}
                    className="border-t pt-3"
                  />
                ) : itemType === "SERVICE_ADVERTISING" && months ? (
                  <PriceBreakdown
                    basePrice={amount / months}
                    quantity={months}
                    quantityLabel="måned"
                    discount={
                      discount > 0
                        ? {
                            percentage: Math.round((discount / (amount + discount)) * 100),
                            amount: discount,
                            label: "Perioderabatt",
                          }
                        : undefined
                    }
                    discountCode={
                      discountValidation?.isValid && discountValidation.discountAmount > 0
                        ? {
                            code: discountCode,
                            amount: discountValidation.discountAmount,
                            type: discountValidation.discountType,
                            value: discountValidation.discountValue,
                          }
                        : undefined
                    }
                    finalPrice={discountValidation?.isValid ? discountValidation.finalAmount : amount}
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

                    {discountValidation?.isValid && discountValidation.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rabattkode:</span>
                        <span>-{formatPrice(discountValidation.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Totalt:</span>
                      <span>
                        {discountValidation?.isValid && discountValidation.finalAmount !== undefined
                          ? formatPrice(discountValidation.finalAmount)
                          : `${amount.toFixed(2)} kr`}
                      </span>
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
                          <h3 className="text-sm font-medium text-amber-800">
                            Fyll ut manglende felter
                          </h3>
                          <p className="text-sm text-amber-700 mt-1">
                            {hasPrefilledData
                              ? `Noen felter er fylt ut fra din profil. Vennligst fyll ut de ${missingRequiredFields.length} manglende feltene.`
                              : "Vennligst fyll ut alle påkrevde felter for fakturering."}
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
                            Fyll ut opplysningene nedenfor. Du kan velge å lagre disse til din
                            profil for raskere bestillinger i fremtiden.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Get current form values
                  const currentValues = form.state.values;
                  handleSubmit(currentValues);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <form.Field
                    name="firstname"
                    validators={{
                      onChange: ({ value }) => {
                        const result = formSchema.shape.firstname.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                      onBlur: ({ value }) => {
                        const result = formSchema.shape.firstname.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            Fornavn *{fieldStates.firstname && getFieldIcon(fieldStates.firstname)}
                          </div>
                        </label>
                        <Input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            updateFieldState("firstname", e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          required
                          placeholder="Fornavn"
                          className={cn(
                            "w-full",
                            fieldStates.firstname && getFieldClassName(fieldStates.firstname),
                            field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                          )}
                          data-cy="firstname-input"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field
                    name="lastname"
                    validators={{
                      onChange: ({ value }) => {
                        const result = formSchema.shape.lastname.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                      onBlur: ({ value }) => {
                        const result = formSchema.shape.lastname.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            Etternavn *{fieldStates.lastname && getFieldIcon(fieldStates.lastname)}
                          </div>
                        </label>
                        <Input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            updateFieldState("lastname", e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          required
                          placeholder="Etternavn"
                          className={cn(
                            "w-full",
                            fieldStates.lastname && getFieldClassName(fieldStates.lastname),
                            field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                          )}
                          data-cy="lastname-input"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field
                  name="address"
                  validators={{
                    onChange: ({ value }) => {
                      const result = formSchema.shape.address.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                    onBlur: ({ value }) => {
                      const result = formSchema.shape.address.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          Adresse *{fieldStates.address && getFieldIcon(fieldStates.address)}
                        </div>
                      </label>
                      <Input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          updateFieldState("address", e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        required
                        placeholder="Gateadresse"
                        className={cn(
                          "w-full",
                          fieldStates.address && getFieldClassName(fieldStates.address),
                          field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                        data-cy="address-input"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <form.Field
                    name="postalCode"
                    validators={{
                      onChange: ({ value }) => {
                        const result = formSchema.shape.postalCode.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                      onBlur: ({ value }) => {
                        const result = formSchema.shape.postalCode.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            Postnr *{fieldStates.postalCode && getFieldIcon(fieldStates.postalCode)}
                          </div>
                        </label>
                        <Input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            updateFieldState("postalCode", e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          required
                          placeholder="1234"
                          className={cn(
                            "w-full",
                            fieldStates.postalCode && getFieldClassName(fieldStates.postalCode),
                            field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                          )}
                          data-cy="postal-code-input"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field
                    name="city"
                    validators={{
                      onChange: ({ value }) => {
                        const result = formSchema.shape.city.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                      onBlur: ({ value }) => {
                        const result = formSchema.shape.city.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            Sted *{fieldStates.city && getFieldIcon(fieldStates.city)}
                          </div>
                        </label>
                        <Input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            updateFieldState("city", e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          required
                          placeholder="Oslo"
                          className={cn(
                            "w-full",
                            fieldStates.city && getFieldClassName(fieldStates.city),
                            field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                          )}
                          data-cy="city-input"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field
                  name="phone"
                  validators={{
                    onChange: ({ value }) => {
                      const result = formSchema.shape.phone.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                    onBlur: ({ value }) => {
                      const result = formSchema.shape.phone.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          Telefon *{fieldStates.phone && getFieldIcon(fieldStates.phone)}
                        </div>
                      </label>
                      <Input
                        type="tel"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          updateFieldState("phone", e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        required
                        placeholder="12345678"
                        className={cn(
                          "w-full",
                          fieldStates.phone && getFieldClassName(fieldStates.phone),
                          field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                        data-cy="phone-input"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      const result = formSchema.shape.email.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                    onBlur: ({ value }) => {
                      const result = formSchema.shape.email.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          E-post *{fieldStates.email && getFieldIcon(fieldStates.email)}
                        </div>
                      </label>
                      <Input
                        type="email"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          updateFieldState("email", e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        required
                        placeholder="din@epost.no"
                        className={cn(
                          "w-full",
                          fieldStates.email && getFieldClassName(fieldStates.email),
                          field.state.meta.errors.length > 0 && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                        data-cy="email-input"
                        disabled={!!user?.email}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                      {user?.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          E-postadressen din hentes automatisk fra kontoen din
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Discount code field */}
                {showRabattkode && !flagLoading && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rabattkode (valgfritt)
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={discountCode}
                        onChange={(e) => handleDiscountCodeChange(e.target.value.toUpperCase())}
                        placeholder="Skriv inn rabattkode"
                        className={cn(
                          "w-full",
                          discountValidation?.isValid && "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500",
                          discountValidation && !discountValidation.isValid && discountCode.trim() && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                        data-cy="discount-code-input"
                      />
                      {isValidatingDiscount && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        </div>
                      )}
                    </div>
                    {discountValidation && (
                      <div className="mt-2">
                        {discountValidation.isValid ? (
                          <div className="text-sm text-green-600 bg-green-50 rounded p-2">
                            ✓ Rabatt på {discountValidation.discountType === "PERCENTAGE" 
                              ? `${discountValidation.discountValue}%` 
                              : `${discountValidation.discountValue} kr`} 
                            {discountValidation.discountAmount > 0 && ` (-${formatPrice(discountValidation.discountAmount)})`}
                          </div>
                        ) : (
                          discountCode.trim() && (
                            <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                              {discountValidation.errorMessage}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                            ? "Oppdater profilinformasjonen din med eventuelle endringer"
                            : "Lagre disse opplysningene for raskere bestillinger i fremtiden"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <ErrorMessage error={createInvoiceRequest.error} />

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster...</p>
          </div>
        </div>
      }
    >
      <BestillPageContent />
    </Suspense>
  );
}
