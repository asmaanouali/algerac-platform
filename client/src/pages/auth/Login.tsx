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
    <div className="min-h-screen flex bg-[#f5f6f8]">
      <AuthLeft />

      {/* Right Section */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col min-h-screen">
        {/* Top bar - Language switcher */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logoalgerac.png" alt="ALGERAC" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#00A63E]">ALGERAC</span>
          </div>
          <div className="lg:hidden" />
          <div className="ml-auto">
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center items-start justify-center px-6 py-8 pt-0">
          <div className="w-full max-w-[420px]">
            {/* Form card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              {/* Green accent top bar */}
              <div className="h-1 bg-gradient-to-r from-[#00A63E] to-[#00A63E]/60" />
              
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.welcome')}</h2>
                  <p className="text-sm text-gray-500">{t('auth.loginTitle')}</p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleLogin}>
                  {/* Email Input */}
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      {t('auth.email')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors"
                      disabled={loginMutation.isPending}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-gray-50 border-gray-200 text-gray-900 pr-10 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors"
                        disabled={loginMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ltr:right-3 rtl:left-3"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        className="border-gray-300 data-[state=checked]:bg-[#00A63E] data-[state=checked]:border-[#00A63E]"
                        disabled={loginMutation.isPending}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-600 cursor-pointer select-none"
                      >
                        {t('auth.rememberMe')}
                      </label>
                    </div>
                    <Link href="/auth/forgot-password">
                      <span className="text-sm text-[#00A63E] hover:text-[#008a35] font-medium transition-colors">
                        {t('auth.forgotPassword')}
                      </span>
                    </Link>
                  </div>

                  {/* Login Button */}
                  <Button
                    className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
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

            {/* Register link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              {t('auth.noAccount')}{" "}
              <Link href="/auth/register">
                <span className="text-[#00A63E] hover:text-[#008a35] font-semibold transition-colors cursor-pointer">
                  {t('auth.createAccount')}
                </span>
              </Link>
            </div>

            {/* Complaint links - outside the card, subtle */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-9 text-gray-500 hover:text-gray-700 hover:bg-white text-xs rounded-lg"
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
                className="flex-1 h-9 text-gray-500 hover:text-gray-700 hover:bg-white text-xs rounded-lg"
                onClick={() => setTrackingDialogOpen(true)}
              >
                <FileSearch className="w-3.5 h-3.5 mr-1.5" />
                <span>{t('auth.trackComplaint')}</span>
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">
                {t('common.copyright')}
              </p>
            </div>
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