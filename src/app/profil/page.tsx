'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { 
  UserIcon, 
  CreditCardIcon, 
  CogIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { InvoiceRequestWithBoxes } from '@/services/invoice-service';
import { useProfile, useUpdateProfile } from '@/hooks/useUser';
import { useGetProfileInvoiceRequests } from '@/hooks/useInvoiceRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'settings'>('overview');

  // Official Supabase client-side auth pattern
  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (!user) {
        router.push('/logg-inn?returnUrl=/profil');
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session?.user) {
          router.push('/logg-inn?returnUrl=/profil');
        }
      }
    );
    
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
  const { data: dbProfile, isLoading: dbProfileLoading, error: dbProfileError } = useProfile(user?.id);
  
  // Fetch profile invoice requests using TanStack Query hook
  const { data: payments = [], isLoading: paymentsLoading } = useGetProfileInvoiceRequests();
  
  // Profile form state
  const [formData, setFormData] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    nickname: '',
    phone: '',
    email: '',
    Adresse1: '',
    Adresse2: '',
    Postnummer: '',
    Poststed: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [emailChangeStatus, setEmailChangeStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  
  // Check if there's a pending email change
  const hasEmailChangePending = user?.email_change_sent_at && 
    new Date(user.email_change_sent_at).getTime() > (user?.email_confirmed_at ? new Date(user.email_confirmed_at).getTime() : 0);
  
  // Update profile mutation
  const updateProfile = useUpdateProfile();

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (dbProfile || user?.email) {
      setFormData({
        firstname: dbProfile?.firstname || '',
        middlename: dbProfile?.middlename || '',
        lastname: dbProfile?.lastname || '',
        nickname: dbProfile?.nickname || '',
        phone: dbProfile?.phone || '',
        email: user?.email || '',
        Adresse1: dbProfile?.Adresse1 || '',
        Adresse2: dbProfile?.Adresse2 || '',
        Postnummer: dbProfile?.Postnummer || '',
        Poststed: dbProfile?.Poststed || ''
      });
    }
  }, [dbProfile, user?.email]);

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (formData.firstname.trim() && formData.firstname.length < 2) {
      errors.push('Fornavn må være minst 2 tegn');
    }
    
    if (formData.lastname.trim() && formData.lastname.length < 2) {
      errors.push('Etternavn må være minst 2 tegn');
    }
    
    if (formData.nickname.trim() && formData.nickname.length < 2) {
      errors.push('Kallenavn må være minst 2 tegn');
    }
    
    if (formData.phone && !/^[\d\s+\-()]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.push('Ugyldig telefonnummer');
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Ugyldig e-postadresse');
    }
    
    if (formData.Postnummer && !/^\d{4}$/.test(formData.Postnummer)) {
      errors.push('Postnummer må være 4 siffer');
    }
    
    if (formData.Adresse1 && formData.Adresse1.length < 3) {
      errors.push('Adresse må være minst 3 tegn');
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    try {
      // Handle profile updates (firstname, middlename, lastname, nickname, phone, address)
      const profileData = {
        firstname: formData.firstname,
        middlename: formData.middlename,
        lastname: formData.lastname,
        nickname: formData.nickname,
        phone: formData.phone,
        Adresse1: formData.Adresse1,
        Adresse2: formData.Adresse2,
        Postnummer: formData.Postnummer,
        Poststed: formData.Poststed
      };

      await updateProfile.mutateAsync(profileData);

      // Handle email update separately if email has changed
      if (formData.email !== user?.email) {
        setEmailChangeStatus('pending');
        await updateUserEmail(formData.email);
        toast.success('Profil oppdatert! En bekreftelse er sendt til din nye e-postadresse.');
        setEmailChangeStatus('success');
      } else {
        toast.success('Profil oppdatert!');
      }

      setIsEditing(false);
    } catch {
      setEmailChangeStatus('idle');
      toast.error('Kunne ikke oppdatere profil. Prøv igjen.');
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cancel editing
  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      firstname: dbProfile?.firstname || '',
      middlename: dbProfile?.middlename || '',
      lastname: dbProfile?.lastname || '',
      nickname: dbProfile?.nickname || '',
      phone: dbProfile?.phone || '',
      email: user?.email || '',
      Adresse1: dbProfile?.Adresse1 || '',
      Adresse2: dbProfile?.Adresse2 || '',
      Postnummer: dbProfile?.Postnummer || '',
      Poststed: dbProfile?.Poststed || ''
    });
    setEmailChangeStatus('idle');
    setIsEditing(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/logg-inn');
      return;
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
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Betalt';
      case 'CANCELLED':
        return 'Kansellert';
      case 'PENDING':
        return 'Venter';
      case 'INVOICE_SENT':
        return 'Faktura sendt';
      default:
        return 'Venter';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'INVOICE_SENT':
        return 'text-blue-600 bg-blue-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-h1 text-slate-900">Min profil</h1>
          <p className="text-body text-slate-600 mt-2">Administrer kontoinformasjon og innstillinger</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UserIcon className="h-5 w-5 mr-2 inline" />
              Oversikt
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === 'payments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CreditCardIcon className="h-5 w-5 mr-2 inline" />
              Betalingshistorikk
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-body-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CogIcon className="h-5 w-5 mr-2 inline" />
              Innstillinger
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
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
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Info Alert for purchasing services */}
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <InfoIcon className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-body-sm text-blue-900">
                    Hvis du planlegger å kjøpe tjenester må du fylle ut fornavn, etternavn, adresse, postnummer, poststed og ha en gyldig e-postadresse.
                  </AlertDescription>
                </Alert>

                <div className="border-b border-slate-200 pb-8">
                  <h3 className="text-h3 text-slate-900 mb-6 font-semibold">Personlig informasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstname" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Fornavn
                      </Label>
                      <Input
                        id="firstname"
                        type="text"
                        value={formData.firstname}
                        onChange={(e) => handleInputChange('firstname', e.target.value)}
                        placeholder="Skriv inn fornavn"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.firstname && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="middlename" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Mellomnavn (valgfritt)
                      </Label>
                      <Input
                        id="middlename"
                        type="text"
                        value={formData.middlename}
                        onChange={(e) => handleInputChange('middlename', e.target.value)}
                        placeholder="Skriv inn mellomnavn"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.middlename && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastname" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Etternavn
                      </Label>
                      <Input
                        id="lastname"
                        type="text"
                        value={formData.lastname}
                        onChange={(e) => handleInputChange('lastname', e.target.value)}
                        placeholder="Skriv inn etternavn"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.lastname && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nickname" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Kallenavn
                      </Label>
                      <Input
                        id="nickname"
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="Skriv inn kallenavn"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.nickname && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="phone" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Telefonnummer (valgfritt)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Skriv inn telefonnummer"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.phone && "placeholder:opacity-100"
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        E-postadresse
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Skriv inn e-postadresse"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.email && "placeholder:opacity-100"
                        )}
                      />
                      {(emailChangeStatus === 'pending' || hasEmailChangePending) && !isEditing && (
                        <div className="mt-2">
                          <p className="text-caption text-blue-600">
                            ⏳ Venter på bekreftelse av ny e-postadresse. Sjekk e-posten din.
                          </p>
                          {user?.email_change_sent_at && (
                            <p className="text-caption text-slate-500 mt-1">
                              Bekreftelse sendt: {new Date(user.email_change_sent_at).toLocaleString('nb-NO')}
                            </p>
                          )}
                        </div>
                      )}
                      {emailChangeStatus === 'success' && (
                        <p className="text-caption text-green-600 mt-2">
                          ✅ E-postadresse vil bli oppdatert etter bekreftelse.
                        </p>
                      )}
                      {!isEditing && !hasEmailChangePending && emailChangeStatus !== 'success' && formData.email && (
                        <p className="text-caption text-slate-500 mt-2">
                          E-posten din kan endres, men krever bekreftelse.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Confirmation Reminder */}
                {!isEditing && !user?.email_confirmed_at && formData.email && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <InfoIcon className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-body-sm text-amber-900">
                      <strong>E-postadressen din er ikke bekreftet.</strong> Sjekk innboksen din for en e-post fra hei@stallplass.no og klikk på lenken for å bekrefte kontoen din.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-b border-slate-200 pb-8 last:border-b-0">
                  <h3 className="text-h3 text-slate-900 mb-6 font-semibold">Adresseinformasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="Adresse1" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Adresse 1
                      </Label>
                      <Input
                        id="Adresse1"
                        type="text"
                        value={formData.Adresse1}
                        onChange={(e) => handleInputChange('Adresse1', e.target.value)}
                        placeholder="Gate og husnummer"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.Adresse1 && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="Adresse2" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Adresse 2 (valgfritt)
                      </Label>
                      <Input
                        id="Adresse2"
                        type="text"
                        value={formData.Adresse2}
                        onChange={(e) => handleInputChange('Adresse2', e.target.value)}
                        placeholder="Leilighet, etasje, eller annet"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.Adresse2 && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="Postnummer" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Postnummer
                      </Label>
                      <Input
                        id="Postnummer"
                        type="text"
                        value={formData.Postnummer}
                        onChange={(e) => handleInputChange('Postnummer', e.target.value)}
                        placeholder="0000"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.Postnummer && "placeholder:opacity-100"
                        )}
                        maxLength={4}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="Poststed" className="text-body-sm font-medium text-slate-700 mb-2 block">
                        Poststed
                      </Label>
                      <Input
                        id="Poststed"
                        type="text"
                        value={formData.Poststed}
                        onChange={(e) => handleInputChange('Poststed', e.target.value)}
                        placeholder="Oslo"
                        disabled={!isEditing}
                        className={cn(
                          "mt-1",
                          !isEditing && "bg-slate-50 border-slate-200 cursor-not-allowed",
                          !isEditing && !formData.Poststed && "placeholder:opacity-100"
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                    <Button 
                      type="submit" 
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Lagrer...
                        </>
                      ) : (
                        'Lagre endringer'
                      )}
                    </Button>
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
                  onClick={() => setActiveTab('payments')}
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

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-h2 text-slate-900 mb-6">Betalingshistorikk</h2>
              
              {paymentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Laster betalinger...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Du har ingen tidligere betalinger.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const paymentList = payments;
                    return paymentList.map((payment: InvoiceRequestWithBoxes) => (
                    <div key={payment.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-h4 text-slate-900">
                              Annonsering - {payment.stables?.name || 'Ukjent stall'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status || 'UNKNOWN')}`}>
                              {getStatusText(payment.status || 'UNKNOWN')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-caption text-slate-500">Beløp</p>
                              <p className="text-body-sm font-medium text-slate-900">{formatAmount(payment.amount - payment.discount)}</p>
                            </div>
                            <div>
                              <p className="text-caption text-slate-500">Periode</p>
                              <p className="text-body-sm font-medium text-slate-900">
                                {payment.months || payment.days} {payment.months ? `måned${payment.months > 1 ? 'er' : ''}` : `dag${(payment.days || 0) > 1 ? 'er' : ''}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-caption text-slate-500">Dato</p>
                              <p className="text-body-sm font-medium text-slate-900">
                                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('nb-NO') : 'Ukjent dato'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-caption text-slate-500 mb-1">Referanse</p>
                          <p className="text-caption font-mono text-slate-600">{payment.id}</p>
                        </div>
                      </div>
                    </div>
                  ));
                  })()}
                </div>
              )}
            </div>
          </div>
        )}



        {activeTab === 'settings' && (
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