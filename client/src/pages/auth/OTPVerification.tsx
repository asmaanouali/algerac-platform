
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layout/AuthLayout";
import { Link, useLocation } from "wouter";
import { ArrowLeft, KeyRound, Mail, Phone, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function OTPVerification() {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpLength = otp.length;
  const [, setLocation] = useLocation();
  // Récupérer l'email depuis les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email") || t("auth.emailPlaceholder");

  const fillOtpFromIndex = (startIndex: number, digits: string) => {
    const sanitized = digits.replace(/\D/g, "");
    if (!sanitized) return;

    const newOtp = [...otp];
    let currentIndex = startIndex;

    for (const digit of sanitized) {
      if (currentIndex >= otpLength) break;
      newOtp[currentIndex] = digit;
      currentIndex += 1;
    }

    setOtp(newOtp);

    const focusIndex = currentIndex >= otpLength ? otpLength - 1 : currentIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleChange = (idx: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (value && !digitsOnly) return;

    if (digitsOnly.length > 1) {
      fillOtpFromIndex(idx, digitsOnly);
      return;
    }

    const newOtp = [...otp];
    newOtp[idx] = digitsOnly;
    setOtp(newOtp);

    if (digitsOnly && idx < otpLength - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    fillOtpFromIndex(idx, pasted);
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
        title: t("auth.passwordRecovery.errorTitle"),
        description: t("auth.passwordRecovery.sessionExpired"),
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
          title: t("auth.passwordRecovery.otp.verifySuccessTitle"),
          description: t("auth.passwordRecovery.otp.verifySuccessDescription"),
        });
        setTimeout(() => setLocation("/auth/new-password"), 1000);
      } else {
        toast({
          title: t("auth.passwordRecovery.errorTitle"),
          description: data?.message || t("auth.passwordRecovery.otp.invalidCodeError"),
        });
      }
    } catch (_err) {
      setLoading(false);
      toast({
        title: t("auth.passwordRecovery.errorTitle"),
        description: t("auth.passwordRecovery.networkError"),
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
          title: t("auth.passwordRecovery.otp.resendSuccessTitle"),
          description: t("auth.passwordRecovery.otp.resendSuccessDescription", { email }),
        });
      } else {
        toast({
          title: t("auth.passwordRecovery.errorTitle"),
          description: data?.message || t("auth.passwordRecovery.otp.resendError"),
        });
      }
    } catch (_err) {
      setResending(false);
      toast({
        title: t("auth.passwordRecovery.errorTitle"),
        description: t("auth.passwordRecovery.networkError"),
      });
    }
  };

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

          {/* ── Left panel ───────────────────────────────────────────── */}
          <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-10 flex-col text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto shrink-0 drop-shadow" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight leading-tight text-white">ALGERAC</h1>
                  <p className="text-green-200 text-xs leading-snug">{t("auth.tagline")}</p>
                </div>
              </div>
              <div className="w-10 h-0.5 bg-white/25 mb-5" />
              <p className="text-green-50/85 text-sm leading-relaxed mb-8">
                {t("auth.platformIntro")}
              </p>
              <div className="space-y-3 mb-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">contact@algerac.dz</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">+213 (0)23 84 83 10</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 text-green-200" />
                  </div>
                  <span className="text-sm text-green-100">www.algerac.dz</span>
                </div>
              </div>
              <p className="text-green-300/50 text-xs mt-8">{t("common.copyright")}</p>
            </div>
          </div>

          {/* ── Right panel – OTP form ────────────────────────────────── */}
          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            {/* Mobile-only brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-white/10">
              <img src="/logoalgerac.png" alt="ALGERAC" className="h-10 w-auto shrink-0" />
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-white">ALGERAC</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("auth.tagline")}</p>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-[#00A63E]" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t("auth.passwordRecovery.otp.title")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.passwordRecovery.otp.subtitle", { email })}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex justify-center gap-1.5 sm:gap-3">
                {otp.map((val, i) => (
                  <input
                    key={i}
                    type="text"
                    className={[
                      "w-9 h-11 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-150",
                      "bg-slate-50 dark:bg-white/5",
                      val
                        ? "border-[#00A63E] bg-green-50 dark:bg-green-900/20 text-[#00A63E] dark:text-green-400 shadow-[0_0_0_3px_rgba(0,166,62,0.15)]"
                        : "border-slate-200 dark:border-white/15 text-slate-900 dark:text-white",
                      "focus:border-[#00A63E] focus:bg-white dark:focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(0,166,62,0.18)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    ].join(" ")}
                    maxLength={1}
                    value={val}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={e => handlePaste(i, e)}
                    ref={el => (inputRefs.current[i] = el)}
                    disabled={loading}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <Button className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-sm shadow-green-900/30 transition-all" type="submit" disabled={loading}>
                {loading ? t("auth.passwordRecovery.otp.verifying") : t("auth.passwordRecovery.otp.verifyCode")}
              </Button>
              <div className="text-center">
                <Button variant="link" className="text-xs text-[#00A63E] hover:text-[#00c44d]" type="button" onClick={handleResend} disabled={resending}>
                  {resending ? t("auth.passwordRecovery.otp.resending") : t("auth.passwordRecovery.otp.resendCode")}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <Link href="/auth/forgot-password">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#00A63E] transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> {t("auth.passwordRecovery.otp.back")}
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}
