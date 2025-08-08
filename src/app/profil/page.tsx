"use client";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetProfileInvoiceRequests } from "@/hooks/useInvoiceRequests";
import { useProfile, useUpdateProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { profileFormSchema, type ProfileFormData } from "@/lib/profile-validation";
import { InvoiceRequestWithBoxes } from "@/services/invoice-service";
import { createClient } from "@/utils/supabase/client";
import { useForm } from "@tanstack/react-form";
import { CogIcon, CreditCardIcon, PencilIcon, UserIcon } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "settings">("overview");
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  // Official Supabase client-side auth pattern
  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        router.push("/logg-inn?returnUrl=/profil");
      } else if (!user.email_confirmed_at) {
        router.push("/verifiser-epost");
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session?.user) {
        router.push("/logg-inn?returnUrl=/profil");
      } else if (!session.user.email_confirmed_at) {
        router.push("/verifiser-epost");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Update user email function using official pattern
  const updateUserEmail = async (newEmail: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    if (error) {
      throw error;
    }
  };

  // Fetch profile data from database
  const {
    data: dbProfile,
    isLoading: dbProfileLoading,
    error: dbProfileError,
  } = useProfile(user?.id);

  // Fetch profile invoice requests using TanStack Query hook
  const { data: payments = [], isLoading: paymentsLoading } = useGetProfileInvoiceRequests();

  const [isEditing, setIsEditing] = useState(false);
  const [emailChangeStatus, setEmailChangeStatus] = useState<"idle" | "pending" | "success">(
    "idle"
  );

  // Check if there's a pending email change
  const hasEmailChangePending =
    user?.email_change_sent_at &&
    new Date(user.email_change_sent_at).getTime() >
      (user?.email_confirmed_at ? new Date(user.email_confirmed_at).getTime() : 0);

  // Update profile mutation
  const updateProfile = useUpdateProfile();

  // Helper function for field validation
  const validateField = (fieldName: keyof ProfileFormData, value: string) => {
    const fieldSchema = profileFormSchema.shape[fieldName];
    const result = fieldSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

  // TanStack Form setup
  const form = useForm({
    defaultValues: {
      firstname: "",
      middlename: "",
      lastname: "",
      nickname: "",
      phone: "",
      email: "",
      Adresse1: "",
      Adresse2: "",
      Postnummer: "",
      Poststed: "",
    } as ProfileFormData,
    onSubmit: async ({ value }) => {
      try {
        // Validate form data with Zod schema
        const validationResult = profileFormSchema.safeParse(value);
        if (!validationResult.success) {
          const errors = validationResult.error.issues.map(err => err.message);
          toast.error(errors.join(", "));
          return;
        }

        // Handle profile updates (firstname, middlename, lastname, nickname, phone, address)
        const profileData = {
          firstname: validationResult.data.firstname,
          middlename: validationResult.data.middlename,
          lastname: validationResult.data.lastname,
          nickname: validationResult.data.nickname,
          phone: validationResult.data.phone,
          Adresse1: validationResult.data.Adresse1,
          Adresse2: validationResult.data.Adresse2,
          Postnummer: validationResult.data.Postnummer,
          Poststed: validationResult.data.Poststed,
        };

        await updateProfile.mutateAsync(profileData);

        // Handle email update separately if email has changed
        if (validationResult.data.email !== user?.email) {
          setEmailChangeStatus("pending");
          await updateUserEmail(validationResult.data.email);
          toast.success("Profil oppdatert! En bekreftelse er sendt til din nye e-postadresse.");
          setEmailChangeStatus("success");
        } else {
          toast.success("Profil oppdatert!");
        }

        setIsEditing(false);
      } catch {
        setEmailChangeStatus("idle");
        toast.error("Kunne ikke oppdatere profil. Prøv igjen.");
      }
    },
  });

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (dbProfile || user?.email) {
      form.setFieldValue("firstname", dbProfile?.firstname || "");
      form.setFieldValue("middlename", dbProfile?.middlename || "");
      form.setFieldValue("lastname", dbProfile?.lastname || "");
      form.setFieldValue("nickname", dbProfile?.nickname || "");
      form.setFieldValue("phone", dbProfile?.phone || "");
      form.setFieldValue("email", user?.email || "");
      form.setFieldValue("Adresse1", dbProfile?.Adresse1 || "");
      form.setFieldValue("Adresse2", dbProfile?.Adresse2 || "");
      form.setFieldValue("Postnummer", dbProfile?.Postnummer || "");
      form.setFieldValue("Poststed", dbProfile?.Poststed || "");
    }
  }, [dbProfile, user?.email, form]);

  // Cancel editing
  const handleCancel = () => {
    // Reset form to original values
    form.setFieldValue("firstname", dbProfile?.firstname || "");
    form.setFieldValue("middlename", dbProfile?.middlename || "");
    form.setFieldValue("lastname", dbProfile?.lastname || "");
    form.setFieldValue("nickname", dbProfile?.nickname || "");
    form.setFieldValue("phone", dbProfile?.phone || "");
    form.setFieldValue("email", user?.email || "");
    form.setFieldValue("Adresse1", dbProfile?.Adresse1 || "");
    form.setFieldValue("Adresse2", dbProfile?.Adresse2 || "");
    form.setFieldValue("Postnummer", dbProfile?.Postnummer || "");
    form.setFieldValue("Poststed", dbProfile?.Poststed || "");
    
    setEmailChangeStatus("idle");
    setIsEditing(false);
  };

  // Resend email confirmation
  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    
    setResendingConfirmation(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      toast.success("Bekreftelseslenke sendt! Sjekk e-posten din.");
    } catch (error) {
      console.error("Resend confirmation error:", error);
      toast.error("Kunne ikke sende bekreftelseslenke. Prøv igjen.");
    } finally {
      setResendingConfirmation(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/logg-inn");
    }
  }, [user, loading, router]);

  // Payments are now fetched automatically via useGetUserInvoiceRequests hook

  if (loading || dbProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Handle database profile fetch error
  if (dbProfileError) {
    // Continue with Supabase user data as fallback, but log the error
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Betalt";
      case "CANCELLED":
        return "Kansellert";
      case "PENDING":
        return "Venter";
      case "INVOICE_SENT":
        return "Faktura sendt";
      default:
        return "Venter";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-50";
      case "CANCELLED":
        return "text-red-600 bg-red-50";
      case "INVOICE_SENT":
        return "text-blue-600 bg-blue-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-h1 text-slate-900">Min profil</h1>
          <p className="text-body text-slate-600 mt-2">
            Administrer kontoinformasjon og innstillinger
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <UserIcon className="h-5 w-5 mr-2 inline" />
              Oversikt
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === "payments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <CreditCardIcon className="h-5 w-5 mr-2 inline" />
              Betalingshistorikk
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === "settings"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <CogIcon className="h-5 w-5 mr-2 inline" />
              Innstillinger
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* User Info Card with Editable Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2 text-slate-900 font-bold">Kontoinformasjon</h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Rediger
                  </Button>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-8"
              >
                {/* Info Alert for purchasing services */}
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <InfoIcon className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-body-sm text-blue-900">
                    Hvis du planlegger å kjøpe annonsering må du fylle ut fornavn, etternavn,
                    adresse, postnummer, poststed og ha en gyldig e-postadresse.
                  </AlertDescription>
                </Alert>

                <div className="border-b border-slate-200 pb-8">
                  <h3 className="text-h3 text-slate-900 mb-6 font-semibold">
                    Personlig informasjon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form.Field name="firstname">
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Fornavn
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn fornavn"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="middlename">
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Mellomnavn (valgfritt)
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn mellomnavn"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="lastname">
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Etternavn
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn etternavn"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="nickname">
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Kallenavn
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn kallenavn"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="phone"
                      validators={{
                        onChange: ({ value }) => validateField('phone', value || ''),
                      }}
                    >
                      {(field) => (
                        <div className="md:col-span-2">
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Telefonnummer (valgfritt)
                          </Label>
                          <Input
                            id={field.name}
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn telefonnummer"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="email"
                      validators={{
                        onChange: ({ value }) => validateField('email', value || ''),
                      }}
                    >
                      {(field) => (
                        <div className="md:col-span-2">
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            E-postadresse
                          </Label>
                          <Input
                            id={field.name}
                            type="email"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Skriv inn e-postadresse"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                          {(emailChangeStatus === "pending" || hasEmailChangePending) && !isEditing && (
                            <div className="mt-2">
                              <p className="text-caption text-blue-600">
                                ⏳ Venter på bekreftelse av ny e-postadresse. Sjekk e-posten din.
                              </p>
                              {user?.email_change_sent_at && (
                                <p className="text-caption text-slate-500 mt-1">
                                  Bekreftelse sendt:{" "}
                                  {new Date(user.email_change_sent_at).toLocaleString("nb-NO")}
                                </p>
                              )}
                            </div>
                          )}
                          {emailChangeStatus === "success" && (
                            <p className="text-caption text-green-600 mt-2">
                              ✅ E-postadresse vil bli oppdatert etter bekreftelse.
                            </p>
                          )}
                          {!isEditing &&
                            !hasEmailChangePending &&
                            emailChangeStatus !== "success" &&
                            field.state.value && (
                              <p className="text-caption text-slate-500 mt-2">
                                E-posten din kan endres, men krever bekreftelse.
                              </p>
                            )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Email Confirmation Reminder */}
                <form.Subscribe selector={(state) => state.values.email}>
                  {(email) => (
                    !isEditing && !user?.email_confirmed_at && email && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <InfoIcon className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-body-sm text-amber-900">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong>E-postadressen din er ikke bekreftet.</strong><br />
                          Sjekk innboksen din for en e-post fra hei@stallplass.no og klikk på lenken for å bekrefte kontoen din.
                          Husk å sjekke spam-mappen også.
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResendConfirmation}
                          disabled={resendingConfirmation}
                          className="ml-4 whitespace-nowrap text-amber-700 border-amber-300 hover:bg-amber-100"
                        >
                          {resendingConfirmation ? "Sender..." : "Send på nytt"}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                    )
                  )}
                </form.Subscribe>

                <div className="border-b border-slate-200 pb-8 last:border-b-0">
                  <h3 className="text-h3 text-slate-900 mb-6 font-semibold">Adresseinformasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form.Field
                      name="Adresse1">
                      {(field) => (
                        <div className="md:col-span-2">
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Adresse 1
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Gate og husnummer"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="Adresse2">
                      {(field) => (
                        <div className="md:col-span-2">
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Adresse 2 (valgfritt)
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Leilighet, etasje, eller annet"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="Postnummer"
                      validators={{
                        onChange: ({ value }) => validateField('Postnummer', value || ''),
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Postnummer
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="0000"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                            maxLength={4}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="Poststed">
                      {(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-body-sm font-medium text-slate-700 mb-2 block"
                          >
                            Poststed
                          </Label>
                          <Input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Oslo"
                            disabled={!isEditing}
                            className={cn(
                              "mt-1",
                              !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                              !isEditing && !field.state.value && "placeholder:opacity-100",
                              isEditing && field.state.meta.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {isEditing && field.state.meta.errors.length > 0 && (
                            <p className="text-red-600 text-caption mt-1">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                    <form.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                      {([canSubmit, isSubmitting]) => (
                        <Button
                          type="submit"
                          disabled={!canSubmit || isSubmitting || updateProfile.isPending}
                          className="flex items-center gap-2"
                        >
                          {(isSubmitting || updateProfile.isPending) ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Lagrer...
                            </>
                          ) : (
                            "Lagre endringer"
                          )}
                        </Button>
                      )}
                    </form.Subscribe>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateProfile.isPending}
                    >
                      Avbryt
                    </Button>
                  </div>
                )}
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-h2 text-slate-900 mb-6">Hurtighandlinger</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/dashboard"
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <h3 className="text-h4 text-slate-900 mb-1">Stall</h3>
                  <p className="text-body-sm text-slate-500">Administrer dine stables</p>
                </Link>

                <button
                  onClick={() => setActiveTab("payments")}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  <h3 className="text-h4 text-slate-900 mb-1">Betalinger</h3>
                  <p className="text-body-sm text-slate-500">Se betalingshistorikk</p>
                </button>

                <Link
                  href="/meldinger"
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <h3 className="text-h4 text-slate-900 mb-1">Meldinger</h3>
                  <p className="text-body-sm text-slate-500">Se konversasjoner</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-h2 text-slate-900 mb-6">Betalingshistorikk</h2>

              {paymentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Laster betalinger...</p>
                </div>
              ) : (() => {
                if (payments.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <CreditCardIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500">Du har ingen tidligere betalinger.</p>
                    </div>
                  );
                }
                return (
                <div className="space-y-4">
                  {(() => {
                    const paymentList = payments;
                    return paymentList.map((payment: InvoiceRequestWithBoxes) => (
                      <div key={payment.id} className="border border-slate-200 rounded-lg p-4 sm:p-6">
                        {/* Mobile-first header with title and status */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-h4 font-semibold text-slate-900 leading-tight mb-2 sm:mb-0">
                              {(() => {
                                if (payment.description) return payment.description;
                                
                                const itemTypeMap = {
                                  'BOX_ADVERTISING': 'Boksannonsering',
                                  'STABLE_ADVERTISING': 'Stallannonsering', 
                                  'SERVICE_ADVERTISING': 'Tjenesteanno nsering',
                                  'BOOST': 'Boost',
                                  'STABLE_BOOST': 'Stallboost',
                                  'BOX_BOOST': 'Boksboost'
                                };
                                
                                const type = itemTypeMap[payment.itemType as keyof typeof itemTypeMap] || 'Annonsering';
                                const entityName = payment.stables?.name || payment.services?.title || "Ukjent";
                                
                                return `${type} - ${entityName}`;
                              })()}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span
                              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(payment.status || "UNKNOWN")}`}
                            >
                              {getStatusText(payment.status || "UNKNOWN")}
                            </span>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-0.5">Referanse</p>
                              <p className="text-xs font-mono text-slate-600 break-all">{payment.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Customer Information - Mobile optimized */}
                        <div className="mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-900 mb-1">{payment.fullName}</p>
                          <div className="text-sm text-slate-600 space-y-0.5">
                            <p>{payment.address}</p>
                            <p>{payment.postalCode} {payment.city}</p>
                            {payment.email && <p className="break-all">{payment.email}</p>}
                            {payment.phone && <p>{payment.phone}</p>}
                          </div>
                        </div>

                        {/* Payment Details - Mobile-first responsive grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Opprinnelig beløp</p>
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {formatAmount(payment.originalAmount)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Rabatt</p>
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {payment.discount > 0 ? `-${formatAmount(payment.discount)}` : 'Ingen rabatt'}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Slutt beløp</p>
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {formatAmount(payment.amount)}
                            </p>
                          </div>
                          {(payment.itemType.includes('ADVERTISING') || payment.itemType.includes('BOOST')) && (payment.months || payment.days) && (
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500 mb-1">Periode</p>
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {(() => {
                                  const count = payment.months || payment.days;
                                  if (payment.months) {
                                    return `${count} måned${payment.months > 1 ? "er" : ""}`;
                                  }
                                  return `${count} dag${(payment.days || 0) > 1 ? "er" : ""}`;
                                })()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Dates section - Mobile optimized */}
                        <div className="pt-3 border-t border-slate-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                            <div>
                              <span className="font-medium">Opprettet:</span> {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("nb-NO") : "Ukjent dato"}
                            </div>
                            {payment.invoiceSentAt && (
                              <div>
                                <span className="font-medium">Faktura sendt:</span> {new Date(payment.invoiceSentAt).toLocaleDateString("nb-NO")}
                              </div>
                            )}
                            {payment.paidAt && (
                              <div>
                                <span className="font-medium">Betalt:</span> {new Date(payment.paidAt).toLocaleDateString("nb-NO")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-h2 text-slate-900 mb-6">Innstillinger</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-h3 text-slate-900 mb-3">Konto</h3>
                  <div className="space-y-4">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700 font-medium text-body-sm"
                    >
                      Slett konto
                    </button>
                    <p className="text-caption text-slate-500">
                      Dette vil permanent slette kontoen din og alle tilknyttede data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
