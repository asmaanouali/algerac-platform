
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLeft from "@/components/layout/AuthLeft";
import { Link, useLocation } from "wouter";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem("resetToken");
    
    if (!token) {
      toast({
        title: "Erreur",
        description: "Session expirée. Veuillez recommencer.",
        variant: "destructive",
      });
      setLoading(false);
      setTimeout(() => setLocation("/auth/forgot-password"), 1500);
      return;
    }
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token: token,
          newPassword: password 
        }),
        credentials: "include",
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        // Supprimer le token du localStorage
        localStorage.removeItem("resetToken");
        toast({
  title: "Mot de passe modifié !",
  description: (
    <span className="flex items-center gap-2">
      Votre mot de passe a été changé avec succès.
    </span>
  ),
  className: "bg-green-600 text-white border-green-600"
});
        setTimeout(() => setLocation("/"), 1200);
      } else {
        toast({
          title: "Erreur",
          description: data?.message || "Erreur lors de la réinitialisation.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Erreur",
        description: "Erreur réseau ou serveur.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f5f6f8]">
      <AuthLeft />

      {/* Right Section */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logoalgerac.png" alt="ALGERAC" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#00A63E]">ALGERAC</span>
          </div>
          <div />
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[420px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#00A63E] to-[#00A63E]/60" />
              
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#00A63E]/10 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#00A63E]" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h2>
                  <p className="text-sm text-gray-500">Créez un mot de passe sécurisé pour votre compte</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Minimum 8 caractères</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm transition-all" type="submit" disabled={loading}>
                    {loading ? "Changement..." : "Changer le mot de passe"}
                  </Button>
                </form>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">© {new Date().getFullYear()} ALGERAC. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
