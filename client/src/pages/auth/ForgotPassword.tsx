
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AuthLeft from "@/components/layout/AuthLeft";
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
          <div className="ml-auto">
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-700">
              <Link href="/" className="flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Retour</Link>
            </Button>
          </div>
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
                    <Mail className="w-7 h-7 text-[#00A63E]" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Réinitialisation</h2>
                  <p className="text-sm text-gray-500">Entrez votre email pour recevoir le code de vérification</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="nom@exemple.com"
                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm transition-all" type="submit" disabled={loading}>
                    {loading ? "Envoi en cours..." : "Envoyer le code"}
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
