import React from "react";
import { Shield, Award, FileCheck } from "lucide-react";

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
      <div className="absolute inset-0 bg-[#011515]/85" />

      {/* Subtle geometric accent lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A63E] via-[#00A63E]/60 to-transparent z-20" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20" />

      {/* Centered Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-between p-10 lg:p-14">
        {/* Top section: Logo + Description */}
        <div className="flex-1 flex flex-col justify-center max-w-lg">
          {/* Logo Section - kept exactly as user likes it */}
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

          {/* Thin separator */}
          <div className="w-16 h-0.5 bg-[#00A63E] mt-8 mb-6" />

          {/* Description Text */}
          <p className="text-base leading-relaxed text-gray-200">
            Bienvenue sur le portail d'ALGERAC dédié au dépôt des demandes d'accréditation ou à la soumission des candidatures en tant que formateurs, évaluateurs ou experts.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#00A63E]" />
              </div>
              <span className="text-sm text-gray-300">Accréditation conforme aux normes internationales</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-4 h-4 text-[#00A63E]" />
              </div>
              <span className="text-sm text-gray-300">Processus transparent et sécurisé</span>
            </div>
          </div>

          {children}
        </div>

        {/* Contact info at bottom */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400">
            <a href="https://algerac.dz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline">algerac.dz</a>
            <span className="hidden sm:inline text-white/20">|</span>
            <a href="mailto:support@algerac.dz" className="hover:text-white transition-colors no-underline">support@algerac.dz</a>
            <span className="hidden sm:inline text-white/20">|</span>
            <a href="tel:+213770133654" className="hover:text-white transition-colors no-underline">+213 770 133 654</a>
          </div>
        </div>
      </div>
    </div>
  );
}
