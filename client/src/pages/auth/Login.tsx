import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Green Background with Logo - FIXED */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-[#0a2f2f] text-white fixed left-0 top-0 h-screen overflow-hidden"
        style={{
          backgroundImage: "url('public/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-[#0a2f2f]/80" />

        {/* Centered Content Container */}
        <div className="relative z-10 h-full flex items-center justify-center p-12 lg:p-16">
          <div className="space-y-12 max-w-lg">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <img 
                src="public/logoalgerac.png" 
                alt="ALGERAC Logo" 
                className="h-20 w-auto"
              />
              <div>
                <h1 className="text-4xl text-white font-bold">ALGERAC</h1>
                <p className="text-sm text-gray-300">Organisme Algérien d'Accréditation</p>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                Garant de la compétence technique et de la confiance.
                Accédez à notre portail sécurisé pour gérer vos demandes d'accréditation.
              </p>
            </div>

            {/* Bottom Section with checkmarks */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Normes Internationales</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Transparence Totale</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - White Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Bienvenue</h2>
            <p className="text-gray-600">Connectez-vous à votre espace accréditation</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">
                Email ou Identifiant
              </label>
              <Input
                type="text"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
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
                  className="h-12 bg-white border-gray-300 text-gray-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  Se souvenir de moi
                </label>
              </div>
              <Link href="/auth/forgot-password">
                <a className="text-sm text-[#00A63E] hover:text-[#008a35] font-medium">
                  Mot de passe oublié ?
                </a>
              </Link>
            </div>

            {/* Login Button */}
            <Button
              className="w-full h-12 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-base"
              asChild
            >
              <Link href="/oec">
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </span>
              </Link>
            </Button>

            {/* Divider */}
            <div className="text-center py-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                NOUVEAU SUR ALGERAC ?
              </span>
            </div>

            {/* Registration Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-[#00A63E] text-[#00A63E] hover:bg-[#00A63E]/10 font-semibold text-base"
                asChild
              >
                <Link href="/auth/register">
                  Créer un compte
                </Link>
              </Button>
              
            </div>
          </div>

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