
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
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
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ALGERAC</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Organisme Algérien d'Accréditation</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#00A63E] via-[#00A63E]/60 to-transparent" />
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#00A63E]/20 border border-[#00A63E]/30 flex items-center justify-center">
                <Lock className="w-7 h-7 text-[#00A63E]" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Nouveau mot de passe</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Créez un mot de passe sécurisé pour votre compte</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-600">Minimum 8 caractères</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" type="submit" disabled={loading}>
                {loading ? "Changement..." : "Changer le mot de passe"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-700 text-xs mt-6">© {new Date().getFullYear()} ALGERAC. Tous droits réservés.</p>
      </div>
    </AuthLayout>
  );
}
