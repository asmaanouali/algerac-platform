
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp.join("") === "123456") { // Simulate correct code
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
              Code incorrect. Veuillez réessayer.
            </span>
          )
        });
      }
    }, 1200);
  };

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      toast({
        title: "Code renvoyé",
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600 w-6 h-6" />
            {`Un nouveau code a été envoyé à ${email}`}
          </span>
        )
      });
    }, 1200);
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
            <h2 className="text-3xl font-bold text-gray-900">Vérification</h2>
            <p className="text-gray-600">Code envoyé à {email}</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2">
              {otp.map((val, i) => (
                <Input
                  key={i}
                  className="w-12 h-12 text-center text-xl font-bold p-0 border-gray-300"
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
            <Button className="w-full h-10 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-base" type="submit" disabled={loading}>
              {loading ? "Vérification..." : "Vérifier le code"}
            </Button>
            <div className="text-center">
              <Button variant="link" className="text-xs text-primary font-bold" type="button" onClick={handleResend} disabled={resending}>
                {resending ? "Renvoi en cours..." : "Renvoyer le code"}
              </Button>
            </div>
            <Button variant="ghost" className="w-full gap-2" asChild>
              <Link href="/auth/forgot-password"><ArrowLeft className="w-4 h-4" /> Retour</Link>
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
