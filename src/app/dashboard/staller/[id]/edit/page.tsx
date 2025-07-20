'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Stable, StableAmenity, StableFAQ } from '@/types/stable';
import Button from '@/components/atoms/Button';
import ImageGalleryManager from '@/components/molecules/ImageGalleryManager';
import FAQManager from '@/components/molecules/FAQManager';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function EditStablePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const stableId = params.id as string;
  
  const [stable, setStable] = useState<Stable | null>(null);
  const [amenities, setAmenities] = useState<StableAmenity[]>([]);
  const [faqs, setFaqs] = useState<StableFAQ[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    postalCode: '',
    city: '',
    county: '',
    images: [] as string[],
    imageDescriptions: [] as string[],
    selectedAmenityIds: [] as string[],
    owner: {
      name: '',
      phone: '',
      email: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    const fetchStableAndAmenities = async () => {
      try {
        const [stableResponse, amenitiesResponse, faqResponse] = await Promise.all([
          fetch(`/api/stables/${stableId}`),
          fetch('/api/stable-amenities'),
          fetch(`/api/stables/${stableId}/faqs`)
        ]);

        if (!stableResponse.ok) {
          throw new Error('Failed to fetch stable');
        }

        const stableData = await stableResponse.json();
        const amenitiesData = amenitiesResponse.ok ? await amenitiesResponse.json() : [];
        const faqData = faqResponse.ok ? await faqResponse.json() : [];

        // Check if user owns this stable
        if (stableData.ownerId !== user.uid) {
          router.push('/dashboard');
          return;
        }

        setStable(stableData);
        setAmenities(Array.isArray(amenitiesData) ? amenitiesData : []);
        setFaqs(Array.isArray(faqData) ? faqData : []);
        
        // Populate form with stable data
        setFormData({
          name: stableData.name,
          description: stableData.description,
          address: stableData.address || '',
          postalCode: stableData.postalCode || '',
          city: stableData.city || '',
          county: stableData.county || '',
          images: stableData.images || [],
          imageDescriptions: stableData.imageDescriptions || [],
          selectedAmenityIds: stableData.amenities?.map((a: { amenity: { id: string } }) => a.amenity.id) || [],
          owner: {
            name: stableData.ownerName,
            phone: stableData.ownerPhone,
            email: stableData.ownerEmail
          }
        });
      } catch (err) {
        setError('Feil ved lasting av stalldata');
        console.error('Error fetching stable:', err);
      } finally {
        setLoading(false);
      }
    };

    if (stableId && user) {
      fetchStableAndAmenities();
    }
  }, [stableId, user, router]);

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        [name]: value
      }
    }));
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleImageDescriptionsChange = (descriptions: Record<string, string>) => {
    // Convert URL-based descriptions to array matching image order
    const descriptionArray = formData.images.map(imageUrl => descriptions[imageUrl] || '');
    setFormData(prev => ({
      ...prev,
      imageDescriptions: descriptionArray
    }));
  };

  // Convert array-based descriptions to URL-based for ImageGalleryManager
  const getInitialDescriptions = (): Record<string, string> => {
    const descriptions: Record<string, string> = {};
    formData.images.forEach((imageUrl, index) => {
      if (formData.imageDescriptions[index]) {
        descriptions[imageUrl] = formData.imageDescriptions[index];
      }
    });
    return descriptions;
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAmenityIds: prev.selectedAmenityIds.includes(amenityId)
        ? prev.selectedAmenityIds.filter(id => id !== amenityId)
        : [...prev.selectedAmenityIds, amenityId]
    }));
  };

  const handleFAQsChange = (updatedFAQs: StableFAQ[]) => {
    setFaqs(updatedFAQs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatedData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        postalCode: formData.postalCode,
        city: formData.city,
        county: formData.county || undefined,
        images: formData.images,
        imageDescriptions: formData.imageDescriptions,
        amenityIds: formData.selectedAmenityIds,
        ownerName: formData.owner.name,
        ownerPhone: formData.owner.phone,
        ownerEmail: formData.owner.email
      };

      const [stableResponse, faqResponse] = await Promise.all([
        fetch(`/api/stables/${stableId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        }),
        fetch(`/api/stables/${stableId}/faqs`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user?.getIdToken()}`
          },
          body: JSON.stringify({ faqs })
        })
      ]);

      if (!stableResponse.ok) {
        throw new Error('Failed to update stable');
      }

      if (!faqResponse.ok) {
        console.warn('Failed to update FAQs, but stable was saved');
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Feil ved oppdatering av stall. Prøv igjen.');
      console.error('Error updating stable:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!stable) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Stall ikke funnet</h1>
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              Tilbake til dashboard
            </Button>
          </div>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rediger stall</h1>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Avbryt
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Navn på stall *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="F.eks. Hestesenteret Nord"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adresseinformasjon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Gateadresse *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="F.eks. Stallveien 15"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    By *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="F.eks. Oslo, Bærum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postnummer *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="F.eks. 0150"
                  />
                </div>

                <div>
                  <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                    Fylke
                  </label>
                  <input
                    type="text"
                    id="county"
                    name="county"
                    value={formData.county}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="F.eks. Oslo, Viken, Innlandet"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div id="images">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bilder og beskrivelser
              </label>
              <ImageGalleryManager 
                images={formData.images} 
                onChange={handleImagesChange}
                onDescriptionsChange={handleImageDescriptionsChange}
                initialDescriptions={getInitialDescriptions()}
                maxImages={10}
                folder="stables"
                title="Administrer stallbilder"
                autoEditMode={true}
              />
            </div>

            {/* Amenities Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fasiliteter
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {amenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAmenityIds.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div data-section="faq">
              <FAQManager
                stable_id={stableId}
                faqs={faqs}
                onChange={handleFAQsChange}
                title="Ofte stilte spørsmål"
              />
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformasjon</h3>
              
              {/* Privacy Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      🔒 Privat kontaktinformasjon
                    </h4>
                    <p className="text-sm text-blue-800">
                      Denne informasjonen vises <strong>ikke</strong> offentlig på stallsiden din. 
                      Interesserte hesteiere kontakter deg gjennom vårt sikre meldingssystem i appen. 
                      Dette beskytter ditt privatliv og gjør kommunikasjon enklere.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="owner-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Navn *
                  </label>
                  <input
                    type="text"
                    id="owner-name"
                    name="name"
                    value={formData.owner.name}
                    onChange={handleOwnerChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="owner-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    id="owner-phone"
                    name="phone"
                    value={formData.owner.phone}
                    onChange={handleOwnerChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Lagrer...' : 'Lagre endringer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}