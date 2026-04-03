import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import AuthLeft from "@/components/layout/AuthLeft";
import { 
  Shield, FileUp, CheckCircle2, AlertTriangle, Loader2, 
  X, Upload, FileText, Trash2 
} from "lucide-react";

interface FileItem {
  name: string;
  base64: string;
  mimeType: string;
}

type PageState = "verify" | "upload" | "success" | "error";

export default function For28SubmissionPage() {
  const [, params] = useRoute("/for28/:token");
  const token = params?.token || "";

  const [pageState, setPageState] = useState<PageState>("verify");
  const [email, setEmail] = useState("");
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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/for28/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim() }),
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
          email: email.trim(),
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-gray-500">Ce lien n'est pas valide. Veuillez utiliser le lien reçu par email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f6f8]">
      <AuthLeft />

      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logoalgerac.png" alt="ALGERAC" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#00A63E]">ALGERAC</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[560px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#00A63E] to-[#00A63E]/60" />

              <div className="p-8">
                {/* Header */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#00A63E]/10 flex items-center justify-center">
                    {pageState === "success" ? (
                      <CheckCircle2 className="w-9 h-9 text-[#00A63E]" />
                    ) : (
                      <Shield className="w-9 h-9 text-[#00A63E]" />
                    )}
                  </div>
                </div>

                {/* Email Verification Step */}
                {pageState === "verify" && (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Vérification d'identité
                      </h2>
                      <p className="text-sm text-gray-500">
                        Pour accéder au formulaire FOR28, veuillez confirmer votre identité
                        en saisissant l'adresse email utilisée lors de votre candidature.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">Accès sécurisé et confidentiel</p>
                          <p className="mt-1 text-xs">
                            Ce formulaire est strictement personnel. Seul le candidat
                            dont l'email correspond peut y accéder et soumettre des documents.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Adresse email de candidature</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          required
                          className="mt-1.5"
                        />
                      </div>

                      {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {errorMessage}
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-[#00A63E] hover:bg-[#008c34]"
                        disabled={loading || !email.trim()}
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Formulaire FOR28 — Documents justificatifs
                      </h2>
                      <p className="text-sm text-gray-500">
                        Bonjour <span className="font-medium">{candidateName}</span>,
                        veuillez joindre les documents requis pour compléter votre dossier.
                      </p>
                    </div>

                    {/* Candidate info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Référence :</span>
                          <span className="ml-2 font-medium text-gray-800">{registrationId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type :</span>
                          <span className="ml-2 font-medium text-gray-800">
                            {typeLabels[userType] || userType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Required documents info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Documents à joindre :</h4>
                      <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
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
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4 ${
                        dragActive
                          ? "border-[#00A63E] bg-[#00A63E]/5"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onClick={() => document.getElementById("file-input")?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-medium">
                        Glissez-déposez vos fichiers ici
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-medium text-gray-700">
                          Fichiers sélectionnés ({files.length})
                        </h4>
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          {errorMessage}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSubmit}
                      className="w-full bg-[#00A63E] hover:bg-[#008c34]"
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Documents soumis avec succès !
                      </h2>
                      <p className="text-sm text-gray-500">
                        Vos documents ont bien été reçus. Votre dossier est maintenant complet.
                      </p>
                    </div>

                    <div className="bg-[#00A63E]/5 border border-[#00A63E]/20 rounded-lg p-5 space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        Prochaines étapes :
                      </h3>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#00A63E]/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00A63E]">1</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Le Service de Gestion des Compétences va examiner vos documents justificatifs.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#00A63E]/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00A63E]">2</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Si votre dossier est retenu, vous serez convoqué(e) à un entretien par email.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#00A63E]/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00A63E]">3</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Après l'entretien, votre candidature sera finalisée et un compte vous sera créé.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Error State */}
                {pageState === "error" && (
                  <>
                    <div className="text-center mb-6">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Accès impossible
                      </h2>
                      <p className="text-sm text-gray-500">{errorMessage}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
