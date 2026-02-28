
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AuthLeft from "@/components/layout/AuthLeft";
import { Link, useLocation } from "wouter";
import { ArrowLeft, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [, setLocation] = useLocation();
  // Récupérer l'email depuis les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email") || "nom@exemple.dz";// Replace with actual email from context if available

  const handleChange = (idx: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const otpCode = otp.join("");
    const token = localStorage.getItem("resetToken");
    
    if (!token) {
      toast({
        title: "Erreur",
        description: (
          <span className="flex items-center gap-2">
            <XCircle className="text-red-600 w-6 h-6" />
            Session expirée. Veuillez recommencer.
          </span>
        )
      });
      setLoading(false);
      setTimeout(() => setLocation("/auth/forgot-password"), 1500);
      return;
    }
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token: token,
          otp: otpCode 
        }),
        credentials: "include",
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600 w-6 h-6" />
              Code vérifié avec succès.
            </span>
          )
        });
        setTimeout(() => setLocation("/auth/new-password"), 1000);
      } else {
        toast({
          title: "Erreur",
          description: (
            <span className="flex items-center gap-2">
              <XCircle className="text-red-600 w-6 h-6" />
              {data?.message || "Code incorrect. Veuillez réessayer."}
            </span>
          )
        });
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Erreur",
        description: (
          <span className="flex items-center gap-2">
            <XCircle className="text-red-600 w-6 h-6" />
            Erreur réseau ou serveur.
          </span>
        )
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
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
      setResending(false);
      
      if (response.ok) {
        // Mettre à jour le token
        const token = data.data;
        if (token) {
          localStorage.setItem("resetToken", token);
        }
        toast({
          title: "Code renvoyé",
          description: (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600 w-6 h-6" />
              {`Un nouveau code a été envoyé à ${email}`}
            </span>
          )
        });
      } else {
        toast({
          title: "Erreur",
          description: data?.message || "Erreur lors du renvoi du code.",
        });
      }
    } catch (err) {
      setResending(false);
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
              <Link href="/auth/forgot-password" className="flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Retour</Link>
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
                    <KeyRound className="w-7 h-7 text-[#00A63E]" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Vérification</h2>
                  <p className="text-sm text-gray-500">Code envoyé à <span className="font-medium text-gray-700">{email}</span></p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="flex justify-between gap-2">
                    {otp.map((val, i) => (
                      <Input
                        key={i}
                        className="w-12 h-13 text-center text-xl font-bold p-0 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-colors rounded-lg"
                        maxLength={1}
                        value={val}
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        ref={el => (inputRefs.current[i] = el)}
                        disabled={loading}
                        inputMode="numeric"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm transition-all" type="submit" disabled={loading}>
                    {loading ? "Vérification..." : "Vérifier le code"}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" className="text-xs text-[#00A63E] hover:text-[#008a35]" type="button" onClick={handleResend} disabled={resending}>
                      {resending ? "Renvoi en cours..." : "Renvoyer le code"}
                    </Button>
                  </div>
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
