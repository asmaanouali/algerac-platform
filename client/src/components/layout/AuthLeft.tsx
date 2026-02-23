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
              Bienvenue sur le portail d'ALGERAC dédié au dépot des demandes d'accréditation ou à la soumission des candidatures en tant que formateurs, évaluateurs ou experts.
            </p>
          </div>
         
          {children}
        </div>
        {/* Email & Téléphone tout en bas, hors du container principal */}
        <div className="absolute bottom-4 left-0 w-full text-sm text-gray-300 text-center">
          <div>Email : <a href="mailto:support@algerac.dz" className="hover:text-white no-underline">support@algerac.dz</a></div>
          <div>Téléphone : <a href="tel:+21321790039" className="hover:text-white no-underline">+213 770133654</a></div>
        </div>
      </div>
    </div>
  );
}
