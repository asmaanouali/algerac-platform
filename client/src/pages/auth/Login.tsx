import { useState, useEffect } from "react";
import AuthLeft from "@/components/layout/AuthLeft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  // Redirection après succès du login
  useEffect(() => {
    if (loginMutation.isSuccess) {
      setLocation("/dashboard");
    }
  }, [loginMutation.isSuccess, setLocation]);

  return (
    <div className="min-h-screen flex">
      <AuthLeft />

      {/* Right Section - White Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Bienvenue</h2>
            <p className="text-gray-600">Connectez-vous à votre espace accréditation</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">
                Email
              </label>
              <Input
                type="text"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                disabled={loginMutation.isPending}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-white border-gray-300 text-gray-900 pr-10"
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
                  Se souvenir de moi
                </label>
              </div>
              <Link href="/auth/forgot-password">
                <span className="text-sm text-[#00A63E] hover:text-[#008a35] font-medium">
                  Mot de passe oublié ?
                </span>
              </Link>
            </div>

            {/* Error message */}
            {loginMutation.isError && (
              <div className="text-red-600 text-sm text-center font-medium">
                {loginMutation.error?.message || "Erreur de connexion"}
              </div>
            )}

            {/* Login Button */}
            <Button
              className="w-full h-10 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-base flex items-center justify-center gap-2"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span>Connexion...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Se connecter
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="text-center py-0">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                NOUVEAU SUR ALGERAC ?
              </span>
            </div>

            {/* Registration Buttons */}
            <div className="space-y-1">
              <Button
                variant="outline"
                className="w-full h-10 border-2 border-[#00A63E] text-[#00A63E] hover:bg-[#00A63E]/10 font-semibold text-base"
                asChild
                disabled={loginMutation.isPending}
              >
                <Link href="/auth/register">
                  <span>Créer un compte</span>
                </Link>
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-8">
            <p className="text-xs text-gray-500">
              © 2026 ALGERAC. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}