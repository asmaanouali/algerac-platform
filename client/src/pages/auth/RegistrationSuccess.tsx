import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthLayout from "@/components/layout/AuthLayout";
import { Link } from "wouter";
import { CheckCircle2, Clock, CreditCard, Mail, UserCheck, FileSearch, CalendarDays } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegistrationSuccess() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type"); // "oec" or "expert"
  const isExpert = type === "expert";

  return (
    <AuthLayout topBar={<LanguageSwitcher variant="compact" />}>
      <div className="w-full max-w-[500px] mx-auto">
        <div className="text-center mb-8">
          <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ALGERAC</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Organisme Algérien d'Accréditation</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#00A63E] via-[#00A63E]/60 to-transparent" />
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#00A63E]/20 border border-[#00A63E]/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-[#00A63E]" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isExpert ? "Candidature soumise avec succès !" : t('auth.oecRegister.submitted')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isExpert
                  ? "Votre candidature a bien été enregistrée. Nous allons étudier votre dossier."
                  : t('auth.oecRegister.submittedMessage')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {isExpert ? "Prochaines étapes de votre candidature :" : t('auth.oecRegister.ackMessage')}
              </h3>

              {isExpert ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <FileSearch className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 1 - Étude du CV</p>
                      <p className="text-slate-500 text-xs mt-0.5">La Gestion des Compétences va étudier votre CV et évaluer votre profil.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 2 - Documents justificatifs</p>
                      <p className="text-slate-500 text-xs mt-0.5">Si votre profil est présélectionné, vous recevrez un email avec un lien sécurisé pour joindre vos documents confidentiels.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 3 - Entretien</p>
                      <p className="text-slate-500 text-xs mt-0.5">Après réception de vos documents, vous serez convoqué(e) à un entretien.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 4 - Décision & Activation</p>
                      <p className="text-slate-500 text-xs mt-0.5">Après l'entretien, si votre candidature est acceptée, votre compte sera créé et activé.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 1 - Étude du dossier</p>
                      <p className="text-slate-500 text-xs mt-0.5">La Direction Technique va examiner votre demande.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 2 - Frais de dépôt</p>
                      <p className="text-slate-500 text-xs mt-0.5">Si votre demande est retenue, vous recevrez les frais de dépôt de dossier à payer.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Étape 3 - Preuve de paiement</p>
                      <p className="text-slate-500 text-xs mt-0.5">Après validation du paiement, votre compte sera créé et activé.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full h-11 mt-6 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" asChild>
              <Link href="/">{t('auth.oecRegister.backToLogin')}</Link>
            </Button>
          </div>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-700 text-xs mt-6">{t('common.copyright')}</p>
      </div>
    </AuthLayout>
  );
}