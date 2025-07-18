import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Kontakt oss</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ta kontakt</h2>
              <p className="text-gray-600 mb-6">
                Vi er her for å hjelpe deg med spørsmål om Stallplass.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">E-post</h3>
                  <p className="text-gray-600">
                    <a href="mailto:kontakt@stallplass.no" className="text-primary hover:underline">
                      kontakt@stallplass.no
                    </a>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">Support</h3>
                  <p className="text-gray-600">
                    <a href="mailto:support@stallplass.no" className="text-primary hover:underline">
                      support@stallplass.no
                    </a>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">Åpningstider</h3>
                  <p className="text-gray-600">
                    Mandag - Fredag: 9:00 - 17:00<br />
                    Lørdag - Søndag: 10:00 - 15:00
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Send oss en melding</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Navn
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ditt navn"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="din@epost.no"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Melding
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Din melding..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Send melding
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}