import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthLeft from "@/components/layout/AuthLeft";
import { Link } from "wouter";
import { CheckCircle2, Clock, CreditCard, Mail, UserCheck, FileSearch, CalendarDays } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegistrationSuccess() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type"); // "oec" or "expert"
  const isExpert = type === "expert";

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
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[480px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#00A63E] to-[#00A63E]/60" />
              
              <div className="p-8">
                {/* Success icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#00A63E]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-[#00A63E]" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isExpert ? "Candidature soumise avec succès !" : t('auth.oecRegister.submitted')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isExpert
                      ? "Votre candidature a bien été enregistrée. Nous allons étudier votre dossier."
                      : t('auth.oecRegister.submittedMessage')}
                  </p>
                </div>

                {/* Workflow steps */}
                <div className="bg-gray-50 border border-gray-200/60 rounded-lg p-5 space-y-4">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {isExpert ? "Prochaines étapes de votre candidature :" : t('auth.oecRegister.ackMessage')}
                  </h3>
                  
                  {isExpert ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <FileSearch className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 1 - Étude du CV (FOR20)</p>
                          <p className="text-gray-500 text-xs mt-0.5">La Gestion des Compétences va étudier votre CV et évaluer votre profil.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 2 - Documents justificatifs (FOR28)</p>
                          <p className="text-gray-500 text-xs mt-0.5">Si votre profil est présélectionné, vous recevrez un email avec un lien sécurisé pour joindre vos documents confidentiels.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <CalendarDays className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 3 - Entretien</p>
                          <p className="text-gray-500 text-xs mt-0.5">Après réception de vos documents, vous serez convoqué(e) à un entretien.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 4 - Décision & Activation</p>
                          <p className="text-gray-500 text-xs mt-0.5">Après l'entretien, si votre candidature est acceptée, votre compte sera créé et activé.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 1 - Étude du dossier</p>
                          <p className="text-gray-500 text-xs mt-0.5">La Direction Technique va examiner votre demande.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 2 - Frais de dépôt</p>
                          <p className="text-gray-500 text-xs mt-0.5">Si votre demande est retenue, vous recevrez les frais de dépôt de dossier à payer.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 rounded-full flex items-center justify-center mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#00A63E]" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">Étape 3 - Preuve de paiement</p>
                          <p className="text-gray-500 text-xs mt-0.5">Après validation du paiement, votre compte sera créé et activé.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button className="w-full h-11 mt-6 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm transition-all" asChild>
                  <Link href="/">{t('auth.oecRegister.backToLogin')}</Link>
                </Button>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">
                {t('common.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}