import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, UserRound, ArrowLeft, Mail, Phone, Globe } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";

export default function RegisterSelection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

          <div className="lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-8 lg:p-10 flex flex-col text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />

            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto shrink-0 drop-shadow" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight leading-tight text-white">ALGERAC</h1>
                  <p className="text-green-200 text-xs leading-snug">{t("auth.tagline")}</p>
                </div>
              </div>

              <div className="w-10 h-0.5 bg-white/25 mb-5" />

              <p className="text-green-50/85 text-sm leading-relaxed mb-8">
                {t("auth.platformIntro")}
              </p>

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

          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-8 lg:p-10 flex flex-col justify-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t("auth.register.title")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.register.subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <Link href="/auth/register/oec">
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 hover:border-[#00A63E]/40 hover:bg-[#00A63E]/[0.02] dark:hover:bg-white/10 cursor-pointer transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A63E]/20 dark:group-hover:bg-[#00A63E]/25 transition-colors">
                      <Building2 className="w-6 h-6 text-[#00A63E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">{t("auth.register.oecTitle")}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t("auth.register.oecDescription")}</p>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0 ${isRtl ? "" : "rotate-180"}`} />
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
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">{t("auth.register.expertTitle")}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t("auth.register.expertDescription")}</p>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 group-hover:text-[#00A63E] transition-colors flex-shrink-0 ${isRtl ? "" : "rotate-180"}`} />
                  </div>
                </div>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Button variant="ghost" size="sm" asChild className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">
                <Link href="/" className="inline-flex items-center gap-1.5">
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                  <span>{t("auth.register.backToLogin")}</span>
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}
