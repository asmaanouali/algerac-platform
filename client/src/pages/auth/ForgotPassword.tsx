
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        toast({
          title: t("auth.passwordRecovery.forgot.codeSentTitle"),
          description: t("auth.passwordRecovery.forgot.codeSentDescription", { email }),
        });
        setTimeout(() => setLocation("/auth/verify-otp?email=" + encodeURIComponent(email)), 1200);
      } else {
        toast({
          title: t("auth.passwordRecovery.errorTitle"),
          description: data?.message || t("auth.passwordRecovery.forgot.noAccountError"),
          variant: "destructive"
        });
      }
    } catch (_err) {
      setLoading(false);
      toast({
        title: t("auth.passwordRecovery.errorTitle"),
        description: t("auth.passwordRecovery.networkError"),
      });
    }
  };

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

          {/* ── Left panel ───────────────────────────────────────────── */}
          <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-10 flex-col text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            <div className="relative flex flex-col h-full">
              {/* Logo */}
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

          {/* ── Right panel – Forgot password form ───────────────────── */}
          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            {/* Mobile-only brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-white/10">
              <img src="/logoalgerac.png" alt="ALGERAC" className="h-10 w-auto shrink-0" />
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-white">ALGERAC</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("auth.tagline")}</p>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center">
                <Mail className="w-7 h-7 text-[#00A63E]" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t("auth.passwordRecovery.forgot.title")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.passwordRecovery.forgot.subtitle")}</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" type="submit" disabled={loading}>
                {loading ? t("auth.passwordRecovery.forgot.sendingCode") : t("auth.passwordRecovery.forgot.sendCode")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#00A63E] transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> {t("auth.passwordRecovery.forgot.backToLogin")}
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}
