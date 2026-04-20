
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AuthLayout from "@/components/layout/AuthLayout";
import { Link } from "wouter";
import { ArrowLeft, Mail, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
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
        // Stocker le token pour la vérification OTP
        const token = data.data; // Le token est dans data.data selon ApiResponse
        if (token) {
          localStorage.setItem("resetToken", token);
        }
        toast({
          title: "Code envoyé",
          description: `Un code a été envoyé à ${email}`,
        });
        setTimeout(() => setLocation("/auth/verify-otp?email=" + encodeURIComponent(email)), 1200);
      } else {
        toast({
          title: "Erreur",
          description: data?.message || "Aucun compte avec cet email",
          variant: "destructive"
        });
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Erreur",
        description: "Erreur réseau ou serveur.",
      });
    }
  };

  return (
    <AuthLayout topBar={
      <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10">
        <Link href="/" className="flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Retour</Link>
      </Button>
    }>
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
                <Mail className="w-7 h-7 text-[#00A63E]" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Réinitialisation</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Entrez votre email pour recevoir le code de vérification</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="nom@exemple.com"
                    className="pl-10 h-11 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" type="submit" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le code"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-700 text-xs mt-6">© {new Date().getFullYear()} ALGERAC. Tous droits réservés.</p>
      </div>
    </AuthLayout>
  );
}
