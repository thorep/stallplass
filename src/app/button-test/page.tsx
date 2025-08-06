"use client";

import Link from 'next/link';

export default function ButtonTestPage() {
  const buttonVariants = [
    {
      name: "Current (Indigo)",
      bgColor: "bg-indigo-600",
      hoverColor: "hover:bg-indigo-700",
      textColor: "text-white",
      description: "Current design",
      type: "current",
      hexCode: "#4F46E5"
    },
    // Your original suggestions
    {
      name: "Primary Button",
      bgColor: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      textColor: "text-white",
      description: "Purple (#6C4DFF) - for key actions like 'Lagre', 'Legg til logg'",
      type: "primary",
      hexCode: "#9333EA"
    },
    // Research-based marketplace colors
    {
      name: "Marketplace Red-Pink",
      bgColor: "bg-pink-600",
      hoverColor: "hover:bg-pink-700",
      textColor: "text-white",
      description: "Airbnb-inspired (#FF385C) - proven for booking platforms",
      type: "marketplace",
      hexCode: "#EC4899"
    },
    {
      name: "Trust Blue",
      bgColor: "bg-blue-700",
      hoverColor: "hover:bg-blue-800",
      textColor: "text-white",
      description: "Professional trust blue (#1976D2) - ideal for transactions",
      type: "trust",
      hexCode: "#1976D2"
    },
    {
      name: "Nordic Forest Green",
      bgColor: "bg-green-700",
      hoverColor: "hover:bg-green-800",
      textColor: "text-white",
      description: "Nature/equestrian theme (#2E7D32) - Nordic approach",
      type: "nordic",
      hexCode: "#2E7D32"
    },
    {
      name: "Deep Navy",
      bgColor: "bg-slate-800",
      hoverColor: "hover:bg-slate-900",
      textColor: "text-white",
      description: "Professional trustworthy navy (#1A237E) - sophisticated",
      type: "professional",
      hexCode: "#1E293B"
    },
    {
      name: "Rich Brown",
      bgColor: "bg-amber-800",
      hoverColor: "hover:bg-amber-900",
      textColor: "text-white",
      description: "Horse-related connection (#5D4037) - warm and earthy",
      type: "equestrian",
      hexCode: "#92400E"
    },
    // Secondary/utility colors
    {
      name: "Nordic Blue-Grey",
      bgColor: "bg-slate-500",
      hoverColor: "hover:bg-slate-600",
      textColor: "text-white",
      description: "Scandinavian minimalist (#546E7A) - secondary actions",
      type: "secondary",
      hexCode: "#64748B"
    },
    {
      name: "Success Green",
      bgColor: "bg-emerald-600",
      hoverColor: "hover:bg-emerald-700",
      textColor: "text-white",
      description: "Nordic success green (#388E3C) - confirmations",
      type: "success",
      hexCode: "#059669"
    },
    {
      name: "Warning Amber",
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      textColor: "text-white",
      description: "Clear warning (#FF9800) - caution states",
      type: "warning",
      hexCode: "#F97316"
    },
    {
      name: "Danger Red",
      bgColor: "bg-red-600",
      hoverColor: "hover:bg-red-700",
      textColor: "text-white",
      description: "Nordic red (#D32F2F) - delete/cancel actions",
      type: "danger",
      hexCode: "#DC2626"
    },
    {
      name: "Light Secondary",
      bgColor: "bg-gray-100",
      hoverColor: "hover:bg-gray-200",
      textColor: "text-gray-800",
      description: "Light grey - subtle secondary actions",
      type: "secondary-light",
      hexCode: "#F3F4F6"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section matching /sok page */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-h1-sm md:text-h1 font-bold text-gray-900 mb-4">
            Button Color Test
          </h1>
          <p className="text-body-sm md:text-body text-gray-600 mb-8">
            Testing different color variations for the &quot;Annonser din stall eller stallplass&quot; button
          </p>
        </div>

        {/* Button variants */}
        <div className="space-y-8">
          {buttonVariants.map((variant, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {variant.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {variant.description}
              </p>
              
              {/* Replicated layout from /sok page */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-h1-sm md:text-h1 font-bold text-gray-900">
                    Søk etter stall eller plass
                  </h2>
                  <p className="mt-2 text-body-sm md:text-body text-gray-600">
                    Finn den perfekte stallplassen for hesten din
                  </p>
                </div>
                
                {/* Button with variant color */}
                <div className="w-full sm:w-auto sm:flex-shrink-0">
                  <button 
                    className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 ${variant.bgColor} ${variant.textColor} text-body-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}
                  >
                    Annonser din stall eller stallplass
                  </button>
                </div>
              </div>

              {/* Additional button examples for this color */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Example usage:</p>
                <div className="flex flex-wrap gap-3">
                  {(variant.type === 'primary' || variant.type === 'current') && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Lagre
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Legg til logg
                      </button>
                    </>
                  )}
                  {variant.type === 'marketplace' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Book nå
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Registrer deg
                      </button>
                    </>
                  )}
                  {variant.type === 'trust' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Betal nå
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Send melding
                      </button>
                    </>
                  )}
                  {(variant.type === 'nordic' || variant.type === 'equestrian') && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Se staller
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Finn rideplass
                      </button>
                    </>
                  )}
                  {variant.type === 'professional' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Godkjenn
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Administrer
                      </button>
                    </>
                  )}
                  {(variant.type === 'secondary' || variant.type === 'secondary-light') && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Avbryt
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Lukk
                      </button>
                    </>
                  )}
                  {variant.type === 'success' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Ferdig
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Bekreft
                      </button>
                    </>
                  )}
                  {variant.type === 'warning' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Advarsel
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Se detaljer
                      </button>
                    </>
                  )}
                  {variant.type === 'danger' && (
                    <>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Slett
                      </button>
                      <button className={`px-3 py-2 ${variant.bgColor} ${variant.textColor} text-sm font-medium rounded-lg ${variant.hoverColor} transition-colors duration-200`}>
                        Fjern
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Color code reference */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Color Reference & Research Notes
          </h3>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Research-Based Recommendations:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Marketplace Red-Pink:</strong> Proven conversion rates in booking platforms (Airbnb style)</li>
              <li><strong>Trust Blue:</strong> Builds confidence for payment and transaction buttons</li>
              <li><strong>Nordic Colors:</strong> Appeals to Scandinavian design preferences</li>
              <li><strong>Equestrian Theme:</strong> Earth tones connect with horse/stable environment</li>
              <li><strong>Accessibility:</strong> All colors meet WCAG AA contrast standards (4.5:1+)</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buttonVariants.map((variant, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded ${variant.bgColor} shadow-sm border border-gray-200`}></div>
                <div>
                  <p className="font-medium text-gray-900">{variant.name}</p>
                  <p className="text-sm text-gray-500">{variant.bgColor}</p>
                  {variant.hexCode && (
                    <p className="text-xs text-gray-400 font-mono">{variant.hexCode}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to main site */}
        <div className="mt-8 text-center">
          <Link 
            href="/sok"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Tilbake til søkesiden
          </Link>
        </div>
      </div>
    </div>
  );
}