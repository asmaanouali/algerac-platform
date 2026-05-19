import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "wouter";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

interface FileItem {
  name: string;
  base64: string;
  mimeType: string;
}

type PageState = "verify" | "upload" | "success" | "error";

export default function For28SubmissionPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/for28/:token");
  const token = params?.token || "";

  const [pageState, setPageState] = useState<PageState>("verify");
  const [secretCode, setSecretCode] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [userType, setUserType] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const typeLabels: Record<string, string> = {
    EXPERT: "Expert",
    EVALUATEUR: "Évaluateur",
    FORMATEUR: "Formateur",
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/for28/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: secretCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Vérification échouée.");
        setLoading(false);
        return;
      }

      setCandidateName(data.candidateName);
      setRegistrationId(data.registrationId);
      setUserType(data.userType);
      setPageState("upload");
    } catch {
      setErrorMessage("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (fileList: File[]) => {
    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`Le fichier "${file.name}" dépasse la taille maximale de 10 Mo.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFiles((prev) => [
          ...prev,
          { name: file.name, base64, mimeType: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) {
      setErrorMessage("Veuillez ajouter au moins un document.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/for28/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          code: secretCode.trim(),
          documents: JSON.stringify(files),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Erreur lors de la soumission.");
        setLoading(false);
        return;
      }

      setPageState("success");
    } catch {
      setErrorMessage("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout hideFlagBar>
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Lien invalide
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ce lien n'est pas valide. Veuillez utiliser le lien reçu par email.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout hideFlagBar>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

          {/* ── Left panel – Platform info ───────────────────────────── */}
          <div className="lg:w-[44%] bg-gradient-to-br from-[#005a2b] via-[#006e35] to-[#004d28] p-8 lg:p-10 flex flex-col text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />

            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logoalgerac.png" alt="ALGERAC" className="h-14 w-auto shrink-0 drop-shadow" />
                <div className="text-left rtl:text-right">
                  <h1 className="text-2xl font-bold tracking-tight leading-tight text-white">ALGERAC</h1>
                  <p className="text-green-200 text-xs leading-snug">{t("auth.tagline")}</p>
                </div>
              </div>

              <div className="w-10 h-0.5 bg-white/25 mb-5" />

              <p className="text-green-50/85 text-sm leading-relaxed mb-6 text-left rtl:text-right">
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

          {/* ── Right panel – Form ────────────────────────────────────── */}
          <div className="lg:w-[56%] bg-white dark:bg-slate-900 p-8 lg:p-10 flex flex-col justify-center">

            {/* Icon header */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#00A63E]/15 border border-[#00A63E]/30 flex items-center justify-center">
                {pageState === "success" ? (
                  <CheckCircle2 className="w-7 h-7 text-[#00A63E]" />
                ) : pageState === "error" ? (
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                ) : (
                  <Shield className="w-7 h-7 text-[#00A63E]" />
                )}
              </div>
            </div>

            {/* Email Verification Step */}
            {pageState === "verify" && (
              <>
                <div className="text-center mb-7">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Vérification d'identité
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Saisissez le code secret à 6 chiffres reçu dans l'email de présélection.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Accès sécurisé et confidentiel</p>
                      <p className="mt-1 text-xs">
                        Ce formulaire est strictement personnel. Le code secret a été
                        envoyé uniquement à l'adresse email du candidat concerné.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">
                      Code secret d'accès
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      required
                      className="h-12 bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-white/15 focus:border-[#00A63E] focus:ring-[#00A63E]/20 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {errorMessage}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-lg shadow-green-900/30 transition-all"
                    disabled={loading || secretCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      "Vérifier mon identité"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Document Upload Step */}
            {pageState === "upload" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Formulaire FOR28
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Bonjour <span className="font-medium text-slate-700 dark:text-slate-200">{candidateName}</span>,
                    veuillez joindre les documents justificatifs.
                  </p>
                </div>

                {/* Candidate info */}
                <div className="bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl p-4 mb-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Référence :</span>
                      <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">{registrationId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Type :</span>
                      <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                        {typeLabels[userType] || userType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Required documents info */}
                <div className="bg-[#00A63E]/5 dark:bg-[#00A63E]/10 border border-[#00A63E]/20 dark:border-[#00A63E]/30 rounded-xl p-4 mb-5">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Documents à joindre :</h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Copie des diplômes et certificats</li>
                    <li>Attestations de travail et d'expérience professionnelle</li>
                    <li>Certificats de formation pertinents</li>
                    <li>Tout autre document justificatif de vos qualifications</li>
                  </ul>
                </div>

                {/* Drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer mb-4 ${
                    dragActive
                      ? "border-[#00A63E] bg-[#00A63E]/5"
                      : "border-slate-300 dark:border-white/15 hover:border-[#00A63E]/50 bg-slate-50/50 dark:bg-white/[0.03]"
                  }`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    ou cliquez pour parcourir (PDF, images — max 10 Mo par fichier)
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2 mb-5">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Fichiers sélectionnés ({files.length})
                    </h4>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {errorMessage}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full h-11 bg-[#00A63E] hover:bg-[#008a35] text-white font-semibold text-sm shadow-lg shadow-green-900/30 transition-all"
                  disabled={loading || files.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4 mr-2" />
                      Soumettre les documents ({files.length})
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Success State */}
            {pageState === "success" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Documents soumis avec succès
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Vos documents ont bien été reçus. Votre dossier est maintenant complet.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    Prochaines étapes
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-[#00A63E]">1</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Le Service de Gestion des Compétences va examiner vos documents justificatifs.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-[#00A63E]">2</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Si votre dossier est retenu, vous serez convoqué(e) à un entretien par email.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#00A63E]/10 dark:bg-[#00A63E]/15 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-[#00A63E]">3</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Après l'entretien, votre candidature sera finalisée et un compte vous sera créé.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Error State */}
            {pageState === "error" && (
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Accès impossible
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
              </div>
            )}

          </div>

        </div>
      </div>
    </AuthLayout>
  );
}
