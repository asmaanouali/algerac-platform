import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, UserRound, ArrowLeft } from "lucide-react";
import AuthLeft from "@/components/layout/AuthLeft";

export default function RegisterSelection() {
  return (
    <div className="min-h-screen flex bg-[#f5f6f8]">
      <AuthLeft />

      {/* Right Section */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logoalgerac.png" alt="ALGERAC" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#00A63E]">ALGERAC</span>
          </div>
          <div className="ml-auto">
            <Button 
              variant="ghost" 
              asChild 
              className="text-gray-500 hover:text-gray-700 hover:bg-white text-sm"
            >
              <Link href="/" className="flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h2>
              <p className="text-sm text-gray-500">Sélectionnez votre type de profil pour commencer</p>
            </div>

            {/* Selection cards */}
            <div className="grid gap-4">
              <Link href="/auth/register/oec">
                <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 hover:border-[#00A63E]/40 hover:shadow-md cursor-pointer transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00A63E]/8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A63E]/15 transition-colors">
                      <Building2 className="w-6 h-6 text-[#00A63E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Déposer ma demande d'accréditation</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">Organismes souhaitant déposer une demande d'accréditation.</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/auth/register/expert">
                <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 hover:border-[#00A63E]/40 hover:shadow-md cursor-pointer transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00A63E]/8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A63E]/15 transition-colors">
                      <UserRound className="w-6 h-6 text-[#00A63E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Déposer ma candidature</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">Professionnels souhaitant collaborer avec ALGERAC (Formateur, Évaluateur, Expert).</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} ALGERAC. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
