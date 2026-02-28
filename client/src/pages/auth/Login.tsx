import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthLeft from "@/components/layout/AuthLeft";
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
    <div className="min-h-screen flex">
      <AuthLeft />

      {/* Right Section - White Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-8 lg:p-12 flex items-center justify-center overflow-y-auto min-h-screen relative">
        {/* Language Switcher - top right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="w-full max-w-md space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.welcome')}</h2>
            <p className="text-sm text-gray-600">{t('auth.loginTitle')}</p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900 block">
                {t('auth.email')}
              </label>
              <Input
                type="text"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                disabled={loginMutation.isPending}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900 block">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 bg-white border-gray-300 text-gray-900 pr-10"
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ltr:right-3 rtl:left-3"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                  className="border-gray-400 data-[state=checked]:bg-[#00A63E] data-[state=checked]:border-[#00A63E]"
                  disabled={loginMutation.isPending}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  {t('auth.rememberMe')}
                </label>
              </div>
              <Link href="/auth/forgot-password">
                <span className="text-sm text-[#00A63E] hover:text-[#008a35] font-medium">
                  {t('auth.forgotPassword')}
                </span>
              </Link>
            </div>

            {/* Login Button */}
            <Button
              className="w-full h-9 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm flex items-center justify-center gap-2"
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

            {/* Divider */}
            <div className="text-center py-0">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {t('auth.noAccount')}
              </span>
            </div>

            {/* Registration Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-9 border-2 border-[#00A63E] text-[#00A63E] hover:bg-[#00A63E]/10 font-semibold text-sm"
                asChild
                disabled={loginMutation.isPending}
              >
                <Link href="/auth/register">
                  <span>{t('auth.createAccount')}</span>
                </Link>
              </Button>

              {/* Elegant separator */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">Plaintes</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              {/* Public Complaint & Tracking Links */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-9 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs"
                  asChild
                >
                  <Link href="/complaints/public">
                    <MessageSquareWarning className="w-4 h-4 mr-1.5" />
                    <span>{t('auth.publicComplaint')}</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 h-9 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs"
                  onClick={() => setTrackingDialogOpen(true)}
                >
                  <FileSearch className="w-4 h-4 mr-1.5" />
                  <span>{t('auth.trackComplaint')}</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">
              {t('common.copyright')}
            </p>
          </div>
        </div>
      </div>

      {/* Complaint Tracking Dialog */}
      <ComplaintTrackingDialog
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
      />
    </div>
  );
}