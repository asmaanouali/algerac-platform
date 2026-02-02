import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen flex">
      {/* Left Section - Green Background with Logo - FIXED */}
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
          <div className="space-y-12 max-w-lg">
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

            {/* Description Text */}
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                Garant de la compétence technique et de la confiance.
                Accédez à notre portail sécurisé pour gérer vos demandes d'accréditation.
              </p>
            </div>

            {/* Bottom Section with checkmarks */}
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
          </div>
        </div>
      </div>

      {/* Right Section - White Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-6">

        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Demande envoyée !</h2>
          <p className="text-slate-600">
            Votre demande a été envoyée avec succès à ALGERAC.<br />
            Vous recevrez vos identifiants de connexion par email après validation de votre dossier par nos services.
          </p>
        </div>

        <Button className="w-full h-10 mt-8" asChild>
          <Link href="/">Retour à la connexion</Link>
        </Button>
        
<div className="text-center pt-8">
            <p className="text-xs text-gray-500">
              © 2026 ALGERAC. Tous droits réservés.
            </p>
          </div>      </div>
      </div>
    </div>
  );
}