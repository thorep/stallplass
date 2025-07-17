'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createStable } from '@/lib/stable-service';
import { Stable } from '@/types/stable';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import Button from '@/components/atoms/Button';

export default function NewStablePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    availableSpaces: '',
    totalSpaces: '',
    images: [''],
    amenities: [''],
    owner: {
      name: user?.displayName || '',
      phone: '',
      email: user?.email || ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!user) {
    router.push('/logg-inn');
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

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAmenityChange = (index: number, value: string) => {
    const newAmenities = [...formData.amenities];
    newAmenities[index] = value;
    setFormData(prev => ({
      ...prev,
      amenities: newAmenities
    }));
  };

  const addAmenityField = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, '']
    }));
  };

  const removeAmenityField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const stableData: Omit<Stable, 'id'> = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        price: parseInt(formData.price),
        availableSpaces: parseInt(formData.availableSpaces),
        totalSpaces: parseInt(formData.totalSpaces),
        rating: 0,
        reviewCount: 0,
        images: formData.images.filter(img => img.trim() !== ''),
        amenities: formData.amenities.filter(amenity => amenity.trim() !== ''),
        owner: formData.owner,
        ownerId: user.uid,
        createdAt: new Date(),
        featured: false
      };

      await createStable(stableData);
      router.push('/dashboard');
    } catch (err) {
      setError('Feil ved opprettelse av stall. Prøv igjen.');
      console.error('Error creating stable:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-gray-0 shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Legg til ny stall</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
              <p className="text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Sted *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
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

            {/* Pricing and Spaces */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Pris per måned (NOK) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="availableSpaces" className="block text-sm font-medium text-gray-700 mb-2">
                  Ledige plasser *
                </label>
                <input
                  type="number"
                  id="availableSpaces"
                  name="availableSpaces"
                  value={formData.availableSpaces}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="totalSpaces" className="block text-sm font-medium text-gray-700 mb-2">
                  Totalt antall plasser *
                </label>
                <input
                  type="number"
                  id="totalSpaces"
                  name="totalSpaces"
                  value={formData.totalSpaces}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bilder (URL-er)
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="ml-2 px-3 py-2 text-error hover:bg-error/10 rounded-md"
                    >
                      Fjern
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="text-primary hover:text-primary-hover"
              >
                + Legg til bilde
              </button>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fasiliteter
              </label>
              {formData.amenities.map((amenity, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={amenity}
                    onChange={(e) => handleAmenityChange(index, e.target.value)}
                    placeholder="F.eks. Ridehall, Daglig utgang"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {formData.amenities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAmenityField(index)}
                      className="ml-2 px-3 py-2 text-error hover:bg-error/10 rounded-md"
                    >
                      Fjern
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAmenityField}
                className="text-primary hover:text-primary-hover"
              >
                + Legg til fasilitet
              </button>
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformasjon</h3>
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

            <div className="flex justify-end space-x-4">
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
                disabled={loading}
              >
                {loading ? 'Oppretter...' : 'Opprett stall'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}