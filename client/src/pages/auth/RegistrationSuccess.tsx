import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layout/AuthLayout";
import { Link } from "wouter";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  UserCheck,
  FileSearch,
  CalendarDays,
  Phone,
  Globe,
  type LucideIcon,
} from "lucide-react";

export default function RegistrationSuccess() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type"); // "oec" or "expert"
  const isExpert = type === "expert";
  const flowKey = isExpert ? "auth.registrationSuccess.expert" : "auth.registrationSuccess.oec";

  const steps: Array<{ icon: LucideIcon; titleKey: string; descriptionKey: string }> = isExpert
    ? [
        { icon: FileSearch, titleKey: "step1Title", descriptionKey: "step1Description" },
        { icon: Mail, titleKey: "step2Title", descriptionKey: "step2Description" },
        { icon: CalendarDays, titleKey: "step3Title", descriptionKey: "step3Description" },
        { icon: UserCheck, titleKey: "step4Title", descriptionKey: "step4Description" },
      ]
    : [
        { icon: Clock, titleKey: "step1Title", descriptionKey: "step1Description" },
        { icon: CreditCard, titleKey: "step2Title", descriptionKey: "step2Description" },
        { icon: Mail, titleKey: "step3Title", descriptionKey: "step3Description" },
      ];

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-10 flex-col text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />

            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto shrink-0 drop-shadow" />
                <div className="text-left rtl:text-right">
                  <h1 className="text-2xl font-bold tracking-tight leading-tight text-white">ALGERAC</h1>
                  <p className="text-green-200 text-xs leading-snug">{t("auth.tagline")}</p>
                </div>
              </div>

              <div className="w-10 h-0.5 bg-white/25 mb-5" />

              <p className="text-green-50/85 text-sm leading-relaxed mb-6 text-left rtl:text-right">
                {t("auth.registrationSuccess.left.description")}
              </p>

              <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-green-100 mb-8">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("auth.registrationSuccess.left.title")}</span>
              </div>

              <div className="space-y-3 mb-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">contact@algerac.dz</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">+213 (0)23 84 83 10</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">www.algerac.dz</span>
                </div>
              </div>

              <p className="text-green-300/50 text-xs mt-8">{t("common.copyright")}</p>
            </div>
          </div>

          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10">
            {/* Mobile-only brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-white/10">
              <img src="/logoalgerac.png" alt="ALGERAC" className="h-10 w-auto shrink-0" />
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-white">ALGERAC</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("auth.tagline")}</p>
              </div>
            </div>
            <div className="mb-7 text-left rtl:text-right">
              <div className="w-14 h-14 rounded-full bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#00A63E]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t(`${flowKey}.title`)}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(`${flowKey}.message`)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm text-left rtl:text-right">
                {t(`${flowKey}.nextStepsTitle`)}
              </h3>

              <div className="space-y-3">
                {steps.map(({ icon: Icon, titleKey, descriptionKey }) => (
                  <div key={titleKey} className="flex items-start gap-3 rtl:flex-row-reverse">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#00A63E]" />
                    </div>
                    <div className="text-sm text-left rtl:text-right">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{t(`${flowKey}.${titleKey}`)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{t(`${flowKey}.${descriptionKey}`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full h-11 mt-6 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" asChild>
              <Link href="/">{t("auth.registrationSuccess.backToLogin")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}