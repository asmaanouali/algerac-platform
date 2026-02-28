import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AuthLeft from "@/components/layout/AuthLeft";
import { Link } from "wouter";
import { CheckCircle2, Clock, CreditCard, Mail } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegistrationSuccess() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex">
      <AuthLeft
        bottom={
          <>
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
          </>
        }
      />

      {/* Right Section - White Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen relative">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">{t('auth.oecRegister.submitted')}</h2>
            <p className="text-slate-600">
              {t('auth.oecRegister.submittedMessage')}
            </p>
          </div>

          {/* Detailed acknowledgment - New accreditation workflow */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-blue-900 text-sm">{t('auth.oecRegister.ackMessage')}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Étape 1 - Étude du dossier</p>
                  <p className="text-blue-600">La Direction Technique va examiner votre demande.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Étape 2 - Frais de dépôt</p>
                  <p className="text-blue-600">Si votre demande est retenue, vous recevrez les frais de dépôt de dossier à payer.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Étape 3 - Preuve de paiement</p>
                  <p className="text-blue-600">Après validation du paiement, votre compte sera créé et activé.</p>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full h-10 mt-8 bg-[#00A63E] hover:bg-[#008a35]" asChild>
            <Link href="/">{t('auth.oecRegister.backToLogin')}</Link>
          </Button>
        
          <div className="text-center pt-8">
            <p className="text-xs text-gray-500">
              {t('common.copyright')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}