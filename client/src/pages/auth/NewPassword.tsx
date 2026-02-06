
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!password || password.length < 8) {
        toast({
          title: "Erreur",
          description: "Le mot de passe doit contenir au moins 8 caractères.",
          icon: <XCircle className="text-red-600 w-6 h-6" />,
        });
        return;
      }
      if (password !== confirm) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas.",
          icon: <XCircle className="text-red-600 w-6 h-6" />,
        });
        return;
      }
      toast({
        title: "Mot de passe changé",
        description: "Votre mot de passe a été modifié avec succès.",
        icon: <CheckCircle2 className="text-green-600 w-6 h-6" />,
      });
      setTimeout(() => setLocation("/"), 1200);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Logo/Description */}
      <div className="hidden lg:block lg:w-1/2 bg-[#011515] text-white fixed left-0 top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#011515]/80" />
        <div className="relative z-10 h-full flex items-center justify-center p-12 lg:p-16">
          <div className="space-y-12 max-w-lg">
            <div className="flex items-center gap-4">
              <img src="/logoalgerac.png" alt="ALGERAC Logo" className="h-20 w-auto" />
              <div>
                <h1 className="text-4xl text-white font-bold">ALGERAC</h1>
                <p className="text-sm text-gray-300">Organisme Algérien d'Accréditation</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                Créez un mot de passe sécurisé pour protéger votre compte.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Sécurité garantie</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#00A63E] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-200">Support réactif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Nouveau mot de passe</h2>
            <p className="text-gray-600">Créez un mot de passe sécurisé</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-10 bg-white border-gray-300 text-gray-900"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-10 bg-white border-gray-300 text-gray-900"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button className="w-full h-10 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-base" type="submit" disabled={loading}>
              {loading ? "Changement..." : "Changer le mot de passe"}
            </Button>
          </form>
          <div className="text-center pt-8">
            <p className="text-xs text-gray-500">© 2026 ALGERAC. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
