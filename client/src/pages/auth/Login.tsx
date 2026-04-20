import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn, MessageSquareWarning, FileSearch } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import RoleSelector from "@/components/RoleSelector";
import { ComplaintTrackingDialog } from "@/components/ComplaintTrackingDialog";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation, user, needsRoleSelection, availableRoles, setActiveRole } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
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
          };
          setLocation(rolePaths[role] || '/dashboard');
        }}
      />
    );
  }

  return (
    <AuthLayout topBar={<LanguageSwitcher variant="compact" />}>
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ALGERAC</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Organisme Algérien d'Accréditation</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#00A63E] via-[#00A63E]/60 to-transparent" />
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('auth.welcome')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.loginTitle')}</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                  {t('auth.email')}
                </label>
                <Input
                  type="text"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="border-slate-300 dark:border-white/20 data-[state=checked]:bg-[#00A63E] data-[state=checked]:border-[#00A63E]"
                    disabled={loginMutation.isPending}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                  >
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <Link href="/auth/forgot-password">
                  <span className="text-sm text-[#00A63E] hover:text-[#00c44d] font-medium transition-colors">
                    {t('auth.forgotPassword')}
                  </span>
                </Link>
              </div>

              <Button
                className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 transition-all"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span>{t('auth.loggingIn')}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> {t('auth.login')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-500">
          {t('auth.noAccount')}{" "}
          <Link href="/auth/register">
            <span className="text-[#00A63E] hover:text-[#00c44d] font-semibold transition-colors cursor-pointer">
              {t('auth.createAccount')}
            </span>
          </Link>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 h-9 text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-xs rounded-lg"
            asChild
          >
            <Link href="/complaints/public">
              <MessageSquareWarning className="w-3.5 h-3.5 mr-1.5" />
              <span>{t('auth.publicComplaint')}</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-9 text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-xs rounded-lg"
            onClick={() => setTrackingDialogOpen(true)}
          >
            <FileSearch className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('auth.trackComplaint')}</span>
          </Button>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-700 text-xs mt-5">{t('common.copyright')}</p>
      </div>

      <ComplaintTrackingDialog
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
      />
    </AuthLayout>
  );
}