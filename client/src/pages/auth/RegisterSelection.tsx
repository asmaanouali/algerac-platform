import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, UserRound, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";

export default function RegisterSelection() {
  return (
    <AuthLayout topBar={
      <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">
        <Link href="/" className="flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la connexion</span>
        </Link>
      </Button>
    }>
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ALGERAC</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Organisme Algérien d'Accréditation</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Créer un compte</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sélectionnez votre type de profil pour commencer</p>
          </div>

          <div className="grid gap-4">
            <Link href="/auth/register/oec">
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 hover:border-[#00A63E]/40 hover:bg-[#00A63E]/[0.02] dark:hover:bg-white/10 cursor-pointer transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A63E]/20 dark:group-hover:bg-[#00A63E]/25 transition-colors">
                    <Building2 className="w-6 h-6 text-[#00A63E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Déposer ma demande d'accréditation</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Organismes souhaitant déposer une demande d'accréditation.</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 rotate-180 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>

            <Link href="/auth/register/expert">
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 hover:border-[#00A63E]/40 hover:bg-[#00A63E]/[0.02] dark:hover:bg-white/10 cursor-pointer transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A63E]/20 dark:group-hover:bg-[#00A63E]/25 transition-colors">
                    <UserRound className="w-6 h-6 text-[#00A63E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Déposer ma candidature</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Professionnels souhaitant collaborer avec ALGERAC (Formateur, Évaluateur, Expert).</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 rotate-180 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-700 text-xs mt-6">© {new Date().getFullYear()} ALGERAC. Tous droits réservés.</p>
      </div>
    </AuthLayout>
  );
}
