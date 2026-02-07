import React from "react";

interface AuthLeftProps {
  children?: React.ReactNode;
  bottom?: React.ReactNode;
}

export default function AuthLeft({ children, bottom }: AuthLeftProps) {
  return (
    <div 
      className="hidden lg:block lg:w-1/2 bg-[#011515] text-white fixed left-0 top-0 h-screen overflow-hidden"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-[#011515]/80" />
      {/* Centered Content Container */}
      <div className="relative z-10 h-full flex items-center justify-center p-12 lg:p-16">
        <div className="space-y-12 max-w-lg w-full">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC Logo" 
              className="h-20 w-auto"
            />
            <div>
              <h1 className="text-4xl text-white font-bold">ALGERAC</h1>
              <p className="text-sm text-gray-300">Organisme Algérien d'Accréditation</p>
            </div>
          </div>
          {/* Description Text - always the same */}
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">
              Garant de la compétence technique et de la confiance. Accédez à notre portail sécurisé pour gérer vos demandes d'accréditation.
            </p>
          </div>
          {/* Bottom Section with checkmarks */}
          {bottom ? (
            <div className="space-y-4">{bottom}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Normes Internationales</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Transparence Totale</span>
              </div>
            </div>
          )}
          {children}
        </div>
        {/* Email & Téléphone tout en bas, hors du container principal */}
        <div className="absolute bottom-4 left-0 w-full text-sm text-gray-300 text-center">
          <div>Email : <a href="mailto:support@algerac.dz" className="hover:text-white no-underline">support@algerac.dz</a></div>
          <div>Téléphone : <a href="tel:+21321790039" className="hover:text-white no-underline">+213 (0) 21 79 00 39</a></div>
        </div>
      </div>
    </div>
  );
}
