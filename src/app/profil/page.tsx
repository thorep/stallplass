'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { 
  UserIcon, 
  CreditCardIcon, 
  CogIcon,
  EnvelopeIcon,
  PencilIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { RentalReviewManager } from '@/components/molecules/RentalReviewManager';
import { ReviewList } from '@/components/molecules/ReviewList';
import { useReviewableRentals, useReviews, useCreateReview, useUpdateReview } from '@/hooks/useQueries';
import { useStableOwnerPayments } from '@/hooks/useStableOwnerRealTime';
import { PaymentWithRelations } from '@/services/realtime-service';

export default function ProfilePage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'reviews' | 'settings'>('overview');
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  // Real-time data hooks
  const { payments: realTimePayments, loading: realTimePaymentsLoading } = useStableOwnerPayments();
  
  // Review hooks
  const { data: reviewableRentals = [], isLoading: rentalsLoading } = useReviewableRentals(user?.id || '');
  const { data: userReviews = [], isLoading: reviewsLoading } = useReviews({ revieweeId: user?.id });
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/logg-inn');
      return;
    }
  }, [user, loading, router]);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    
    try {
      setPaymentsLoading(true);
      const token = await getIdToken();
      const response = await fetch('/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (activeTab === 'payments' && user) {
      fetchPayments();
    }
  }, [activeTab, user, fetchPayments]);

  const handleCreateReview = async (reviewData: {
    rentalId: string;
    revieweeId: string;
    revieweeType: string;
    stable_id: string;
    rating: number;
    title?: string;
    comment?: string;
    communicationRating?: number;
    cleanlinessRating?: number;
    facilitiesRating?: number;
    reliabilityRating?: number;
  }) => {
    try {
      await createReviewMutation.mutateAsync(reviewData);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  };

  const handleUpdateReview = async (reviewId: string, reviewData: {
    rating?: number;
    title?: string;
    comment?: string;
    communicationRating?: number;
    cleanlinessRating?: number;
    facilitiesRating?: number;
    reliabilityRating?: number;
  }) => {
    try {
      await updateReviewMutation.mutateAsync({ id: reviewId, ...reviewData });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  if (loading) {
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Betalt';
      case 'FAILED':
        return 'Mislykket';
      case 'CANCELLED':
        return 'Avbrutt';
      case 'PROCESSING':
        return 'Behandles';
      case 'REFUNDED':
        return 'Refundert';
      default:
        return 'Venter';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'REFUNDED':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Min profil</h1>
          <p className="text-slate-600 mt-2">Administrer kontoinformasjon og innstillinger</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CreditCardIcon className="h-5 w-5 mr-2 inline" />
              Betalingshistorikk
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <StarIcon className="h-5 w-5 mr-2 inline" />
              Anmeldelser
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Kontoinformasjon</h2>
                <button className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" />
                  Rediger
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Navn
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {(user.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-slate-900 font-medium">
                      {user.user_metadata?.name || user.user_metadata?.full_name || 'Ikke angitt'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    E-post
                  </label>
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-900">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Hurtighandlinger</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link 
                  href="/dashboard"
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <h3 className="font-medium text-slate-900 mb-1">Stall</h3>
                  <p className="text-sm text-slate-500">Administrer dine stables</p>
                </Link>
                
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-slate-900 mb-1">Betalinger</h3>
                  <p className="text-sm text-slate-500">Se betalingshistorikk</p>
                </button>
                
                <Link 
                  href="/meldinger"
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <h3 className="font-medium text-slate-900 mb-1">Meldinger</h3>
                  <p className="text-sm text-slate-500">Se konversasjoner</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Betalingshistorikk</h2>
              
              {(paymentsLoading || realTimePaymentsLoading) ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Laster betalinger...</p>
                </div>
              ) : (realTimePayments.length > 0 ? realTimePayments : payments).length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Du har ingen tidligere betalinger.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const paymentList = realTimePayments.length > 0 ? realTimePayments : payments;
                    return paymentList.map((payment) => (
                    <div key={payment.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              Annonsering - {payment.stable.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status || 'UNKNOWN')}`}>
                              {getStatusText(payment.status || 'UNKNOWN')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Beløp</p>
                              <p className="font-medium text-slate-900">{formatAmount(payment.total_amount)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Periode</p>
                              <p className="font-medium text-slate-900">
                                {payment.months} måned{payment.months > 1 ? 'er' : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Dato</p>
                              <p className="font-medium text-slate-900">
                                {payment.created_at ? new Date(payment.created_at).toLocaleDateString('nb-NO') : 'Ukjent dato'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1">Referanse</p>
                          <p className="text-xs font-mono text-slate-600">{payment.vipps_order_id}</p>
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


        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review Management Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Administrer anmeldelser</h2>
              
              {rentalsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Laster leieforhold...</p>
                </div>
              ) : (
                <RentalReviewManager
                  rentals={reviewableRentals}
                  onCreateReview={handleCreateReview}
                  onUpdateReview={handleUpdateReview}
                  isSubmitting={createReviewMutation.isPending || updateReviewMutation.isPending}
                />
              )}
            </div>

            {/* Reviews Received Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Anmeldelser om meg</h2>
              
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Laster anmeldelser...</p>
                </div>
              ) : (
                <ReviewList
                  reviews={userReviews}
                  showStableName={true}
                  emptyMessage="Du har ikke mottatt noen anmeldelser ennå."
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Kontoinnstillinger</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Personlig informasjon</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fullt navn
                      </label>
                      <input
                        type="text"
                        value={user.user_metadata?.name || user.user_metadata?.full_name || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Skriv inn ditt fulle navn"
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">Kan ikke endres for øyeblikket</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-postadresse
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">E-post kan ikke endres</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Konto</h3>
                  <div className="space-y-4">
                    <button className="text-red-600 hover:text-red-700 font-medium">
                      Slett konto
                    </button>
                    <p className="text-xs text-slate-500">
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