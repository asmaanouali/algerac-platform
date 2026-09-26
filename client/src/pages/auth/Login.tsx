import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn, Mail, Phone, Globe, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth, useVerifyLoginOtp, useResendLoginOtp } from "@/hooks/use-auth";
import RoleSelector from "@/components/RoleSelector";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [, setLocation] = useLocation();
  const { loginMutation, user, needsRoleSelection, availableRoles, setActiveRole } = useAuth();
  const verifyOtpMutation = useVerifyLoginOtp();
  const resendOtpMutation = useResendLoginOtp();

  const twoFactorPending =
    loginMutation.isSuccess &&
    !!loginMutation.data &&
    "twoFactorRequired" in loginMutation.data &&
    !user;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpMutation.mutate(otpCode);
  };

  // Redirection après succès du login
  useEffect(() => {
    if (loginMutation.isSuccess && user && !needsRoleSelection) {
      setLocation("/dashboard");
    }
  }, [loginMutation.isSuccess, user, needsRoleSelection, setLocation]);

  // If user is logged in but needs role selection, show role selector
  if (user && needsRoleSelection) {
    const fullName = user.fullName || `${user.prenom || ''} ${user.nom || ''}`.trim() || '';
    return (
      <RoleSelector
        roles={availableRoles}
        userName={fullName}
        onSelectRole={(role) => {
          setActiveRole(role);
          const rolePaths: Record<string, string> = {
            ADMIN: '/admin',
            OEC: '/oec/dashboard',
            RA: '/ra/dashboard',
            DT: '/dashboard',
            CD: '/cd/dashboard',
            DAG: '/dag/dashboard',
            EXPERT: '/expert/dashboard',
            REE: '/ree/dashboard',
            ET: '/et/dashboard',
            EQ: '/eq/dashboard',
            CAS_MEMBER: '/cas/dashboard',
            CAS_PRESIDENT: '/cas-president/dashboard',
            DG: '/dg/dashboard',
            GES_COMPETENCES: '/ges-competences/dashboard',
            RQ: '/rq/dashboard',
            SUP: '/dashboard',
            CONSOLIDATION: '/consolidation/dashboard',
          };
          setLocation(rolePaths[role] || '/dashboard');
        }}
      />
    );
  }

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

          {/* ── Left panel – Platform info ───────────────────────────── */}
          <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-8 lg:p-10 flex-col text-white relative overflow-hidden">
            {/* Subtle dot overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />

            <div className="relative flex flex-col h-full">
              {/* Logo + name */}
              <div className="flex items-center gap-3 mb-6">
                <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto shrink-0 drop-shadow" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight leading-tight text-white">ALGERAC</h1>
                  <p className="text-green-200 text-xs leading-snug">{t("auth.tagline")}</p>
                </div>
              </div>

              {/* Separator */}
              <div className="w-10 h-0.5 bg-white/25 mb-5" />

              {/* Intro text */}
              <p className="text-green-50/85 text-sm leading-relaxed mb-8">
                {t("auth.platformIntro")}
              </p>

              {/* Contacts */}
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

              {/* Copyright */}
              <p className="text-green-300/50 text-xs mt-8">{t("common.copyright")}</p>
            </div>
          </div>

          {/* ── Right panel – Login form ──────────────────────────────── */}
          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10">
            {/* Mobile-only brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-white/10">
              <img src="/logoalgerac.png" alt="ALGERAC" className="h-10 w-auto shrink-0" />
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-white">ALGERAC</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("auth.tagline")}</p>
              </div>
            </div>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t("auth.welcome")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.loginTitle")}</p>
            </div>

            {twoFactorPending ? (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <ShieldCheck className="w-5 h-5 text-[#00A63E]" />
                  <h3 className="font-semibold">{t("auth.twoFactor.title")}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("auth.twoFactor.subtitle", { email })}
                </p>
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                    {t("auth.twoFactor.code")}
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white tracking-widest text-center font-mono focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    disabled={verifyOtpMutation.isPending}
                  />
                </div>

                {verifyOtpMutation.isError && (
                  <p className="text-sm text-red-600">{(verifyOtpMutation.error as Error).message}</p>
                )}

                <Button
                  className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 transition-all"
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
                >
                  {verifyOtpMutation.isPending ? t("auth.twoFactor.verifying") : t("auth.twoFactor.verify")}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => loginMutation.reset()}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("auth.twoFactor.back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => resendOtpMutation.mutate()}
                    disabled={resendOtpMutation.isPending}
                    className="text-[#00A63E] hover:text-[#00c44d] font-medium"
                  >
                    {resendOtpMutation.isPending ? t("auth.twoFactor.resending") : t("auth.twoFactor.resendCode")}
                  </button>
                </div>
              </form>
            ) : (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                  {t("auth.email")}
                </label>
                <Input
                  type="text"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pr-10 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ltr:right-3 rtl:left-3"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot-password">
                  <span className="text-sm text-[#00A63E] hover:text-[#00c44d] font-medium transition-colors">
                    {t("auth.forgotPassword")}
                  </span>
                </Link>
              </div>

              <Button
                className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 transition-all"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span>{t("auth.loggingIn")}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> {t("auth.login")}
                  </>
                )}
              </Button>
            </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-500">
              {t("auth.noAccount")}{" "}
              <Link href="/auth/register">
                <span className="text-[#00A63E] hover:text-[#00c44d] font-semibold transition-colors cursor-pointer">
                  {t("auth.createAccount")}
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}