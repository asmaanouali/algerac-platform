
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
        toast({
          title: "Lien envoyé",
          description: `Un code a été envoyé à ${email}`,
        });
        setTimeout(() => setLocation("/auth/verify-otp?email=" + encodeURIComponent(email)), 1200);
      } else {
        toast({
          title: "Erreur",
          description: data?.message || "Erreur lors de l'envoi du code.",
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
    <div className="min-h-screen flex">
      <AuthLeft
        bottom={
          <>
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
          </>
        }
      />
      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] bg-white p-12 lg:p-16 flex items-center justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Réinitialisation</h2>
            <p className="text-gray-600">Entrez votre email pour recevoir le lien de réinitialisation</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="nom@exemple.com"
                  className="pl-10 h-10 bg-white border-gray-300 text-gray-900"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button className="w-full h-10 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-base" type="submit" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le code"}
            </Button>
            <Button variant="ghost" className="w-full gap-2" asChild>
              <Link href="/"><ArrowLeft className="w-4 h-4" /> Retour à la connexion</Link>
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
