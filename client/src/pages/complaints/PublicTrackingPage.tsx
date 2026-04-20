import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Loader2, Search, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle,
  FileSearch, ShieldCheck, UserCheck, Ban, ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface TrackingResult {
  trackingCode: string;
  subject: string;
  status: string;
  createdAt: string;
  category: string;
  decision?: string;
  decisionDate?: string;
  investigationDeadline?: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; description: string; color: string; bg: string }> = {
  RECEIVED: {
    icon: <Clock className="w-6 h-6" />,
    label: "Plainte reçue",
    description: "Votre plainte a été enregistrée et un accusé de réception vous a été envoyé. Elle sera prochainement examinée par le département qualité.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  UNDER_REVIEW: {
    icon: <FileSearch className="w-6 h-6" />,
    label: "En cours d'examen",
    description: "Le Responsable Qualité examine votre plainte. Des informations complémentaires peuvent être collectées.",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
  },
  ASSIGNED: {
    icon: <UserCheck className="w-6 h-6" />,
    label: "Investigateur assigné",
    description: "Un agent a été désigné pour mener l'investigation. Cette personne n'est pas impliquée dans l'activité objet de la plainte.",
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
  },
  INVESTIGATION: {
    icon: <Search className="w-6 h-6" />,
    label: "Investigation en cours",
    description: "L'investigation est en cours. Le département qualité collecte les informations nécessaires pour statuer sur votre plainte.",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  FOUNDED: {
    icon: <AlertTriangle className="w-6 h-6" />,
    label: "Plainte fondée",
    description: "Votre plainte a été jugée fondée. Des mesures correctives sont en cours de mise en œuvre conformément à la procédure PRO 09.",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  UNFOUNDED: {
    icon: <XCircle className="w-6 h-6" />,
    label: "Plainte non fondée",
    description: "Après analyse, votre plainte a été jugée non fondée. Vous avez reçu une notification détaillée avec les motifs de cette décision.",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
  CORRECTIVE_ACTIONS: {
    icon: <ShieldCheck className="w-6 h-6" />,
    label: "Actions correctives en cours",
    description: "Des actions correctives sont en cours suite à la décision. Le suivi est assuré par le département qualité.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  RESOLVED: {
    icon: <CheckCircle className="w-6 h-6" />,
    label: "Plainte résolue",
    description: "Les actions correctives ont été mises en œuvre et validées. Votre plainte est résolue.",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  CLOSED: {
    icon: <Ban className="w-6 h-6" />,
    label: "Dossier clôturé",
    description: "Le traitement de votre plainte est terminé. Le dossier complet est archivé conformément à la procédure PRO 21.",
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  },
};

const statusSteps = ["RECEIVED", "UNDER_REVIEW", "INVESTIGATION", "FOUNDED", "RESOLVED", "CLOSED"];

const categoryLabels: Record<string, string> = {
  quality: "Qualité",
  delay: "Délais",
  competence: "Compétence",
  impartiality: "Impartialité",
  confidentiality: "Confidentialité",
  other: "Autre",
};

export default function PublicTrackingPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!code.trim()) {
      setError(t('complaints.tracking.codeRequired'));
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiRequest("GET", `/api/complaints/track/${encodeURIComponent(code.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data as TrackingResult);
      } else {
        setError(t('complaints.tracking.notFound'));
      }
    } catch {
      setError(t('complaints.tracking.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = result ? statusConfig[result.status] : null;
  const currentStepIndex = result ? statusSteps.indexOf(result.status) : -1;
  // Handle statuses not in the main flow
  const effectiveStepIndex = currentStepIndex >= 0 ? currentStepIndex
    : result?.status === "ASSIGNED" ? 1
    : result?.status === "CORRECTIVE_ACTIONS" ? 4
    : result?.status === "UNFOUNDED" ? 3
    : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-green-800">ALGERAC</h1>
              <p className="text-xs text-muted-foreground">Organisme Algérien d'Accréditation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" />Accueil
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('complaints.tracking.title')}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('complaints.tracking.description')}</p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{t('complaints.tracking.codeLabel')}</CardTitle>
                  <CardDescription>{t('complaints.tracking.helpText')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                      placeholder="PLT-XX-XXXXXXXX"
                      className="font-mono text-lg tracking-wider"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading} size="lg">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" />{t('complaints.tracking.search')}</>}
                    </Button>
                  </div>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Complaint Info */}
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('complaints.tracking.codeLabel')}</span>
                    <span className="font-mono font-bold text-lg text-primary">{result.trackingCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('complaints.tracking.subject')}</span>
                    <span className="text-sm font-medium text-right max-w-[60%] truncate">{result.subject}</span>
                  </div>
                  {result.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('complaints.tracking.category')}</span>
                      <Badge variant="outline">{categoryLabels[result.category] || result.category}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('complaints.tracking.submittedAt')}</span>
                    <span className="text-sm">{new Date(result.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              {currentStatus && (
                <Card className={`shadow-lg border-2 ${currentStatus.bg}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 ${currentStatus.color}`}>
                        {currentStatus.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${currentStatus.color}`}>{currentStatus.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{currentStatus.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision info */}
              {result.decision && (
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Décision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{result.decision}</p>
                    {result.decisionDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Date de décision : {new Date(result.decisionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Progress Tracker */}
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('complaints.tracking.progress')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    {statusSteps.map((step, idx) => {
                      const isActive = idx <= effectiveStepIndex;
                      const isCurrent = idx === effectiveStepIndex;
                      const stepLabel = statusConfig[step]?.label || step;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={`w-full h-2.5 rounded-full transition-colors ${
                                isActive ? "bg-primary" : "bg-slate-200"
                              } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                            />
                            <span className={`text-[10px] mt-1.5 text-center leading-tight ${
                              isActive ? "text-primary font-medium" : "text-muted-foreground"
                            }`}>
                              {stepLabel}
                            </span>
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <ArrowRight className={`w-3 h-3 mx-0.5 shrink-0 mt-[-14px] ${
                              idx < effectiveStepIndex ? "text-primary" : "text-slate-300"
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Back button */}
              <Button variant="outline" onClick={() => { setResult(null); setCode(""); }} className="w-full">
                {t('complaints.tracking.searchAnother')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
