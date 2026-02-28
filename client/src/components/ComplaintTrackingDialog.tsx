import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileSearch,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackingResult {
  trackingCode: string;
  subject: string;
  status: string;
  createdAt: string;
  category: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string; description: string }> = {
  RECEIVED: {
    icon: <Clock className="w-6 h-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    label: "Reçue",
    description: "Votre plainte a été reçue et est en attente de traitement par le Responsable Qualité.",
  },
  UNDER_REVIEW: {
    icon: <FileSearch className="w-6 h-6" />,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "En cours d'examen",
    description: "Votre plainte est actuellement examinée par le Responsable Qualité d'ALGERAC.",
  },
  INVESTIGATION: {
    icon: <Search className="w-6 h-6" />,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    label: "Investigation en cours",
    description: "Une investigation est en cours pour analyser les éléments de votre plainte.",
  },
  FOUNDED: {
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Fondée",
    description: "Votre plainte a été jugée fondée. Des mesures correctives sont en cours d'application.",
  },
  UNFOUNDED: {
    icon: <XCircle className="w-6 h-6" />,
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
    label: "Non fondée",
    description: "Après analyse, votre plainte a été jugée non fondée. Vous avez été notifié par email.",
  },
  RESOLVED: {
    icon: <CheckCircle className="w-6 h-6" />,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    label: "Résolue",
    description: "Les actions correctives ont été mises en œuvre. Votre plainte est considérée comme résolue.",
  },
  CLOSED: {
    icon: <ShieldCheck className="w-6 h-6" />,
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
    label: "Clôturée",
    description: "Le dossier de votre plainte est maintenant clôturé.",
  },
};

const categoryLabels: Record<string, string> = {
  quality: "Qualité du service",
  delay: "Délais de traitement",
  competence: "Compétence technique",
  impartiality: "Impartialité",
  confidentiality: "Confidentialité",
  other: "Autre",
};

// Steps for the progress tracker
const statusSteps = ["RECEIVED", "UNDER_REVIEW", "INVESTIGATION", "FOUNDED", "RESOLVED", "CLOSED"];

function getStepIndex(status: string): number {
  if (status === "UNFOUNDED") return 3; // Same level as FOUNDED
  const idx = statusSteps.indexOf(status);
  return idx >= 0 ? idx : 0;
}

interface ComplaintTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintTrackingDialog({ open, onOpenChange }: ComplaintTrackingDialogProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!code.trim()) {
      setError(t('complaints.tracking.codeRequired'));
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/complaints/track/${encodeURIComponent(code.trim())}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setResult(data.data);
      } else {
        setError(data.message || t('complaints.tracking.notFound'));
      }
    } catch {
      setError(t('complaints.tracking.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    setCode("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      handleReset();
    }, 300);
  };

  const currentStatus = result ? statusConfig[result.status] : null;
  const currentStepIndex = result ? getStepIndex(result.status) : -1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSearch className="w-5 h-5 text-primary" />
            {t('complaints.tracking.title')}
          </DialogTitle>
          <DialogDescription>
            {t('complaints.tracking.description')}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-2"
            >
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="tracking-code">{t('complaints.tracking.codeLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (error) setError("");
                    }}
                    placeholder="PLT-2026-XXXX"
                    className="font-mono text-base tracking-wider"
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    disabled={loading}
                    autoFocus
                  />
                  <Button onClick={handleTrack} disabled={loading || !code.trim()} size="default">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1" />
                        {t('complaints.tracking.search')}
                      </>
                    )}
                  </Button>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Help text */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('complaints.tracking.helpTitle')}</strong>
                  <br />
                  {t('complaints.tracking.helpText')}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 py-2"
            >
              {/* Complaint Header */}
              <div className="bg-slate-50 rounded-lg p-4 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('complaints.tracking.codeLabel')}</span>
                  <span className="font-mono font-bold text-primary">{result.trackingCode}</span>
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
              </div>

              {/* Status Card */}
              {currentStatus && (
                <div className={`rounded-lg p-5 border-2 ${currentStatus.bg}`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${currentStatus.color}`}>
                      {currentStatus.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-lg ${currentStatus.color}`}>
                          {currentStatus.label}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentStatus.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tracker */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t('complaints.tracking.progress')}</h4>
                <div className="flex items-center gap-1">
                  {statusSteps.map((step, idx) => {
                    const isActive = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const stepLabel = statusConfig[step]?.label || step;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-full h-2 rounded-full transition-colors ${
                              isActive ? "bg-primary" : "bg-slate-200"
                            } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                          />
                          <span className={`text-[10px] mt-1 text-center leading-tight ${
                            isActive ? "text-primary font-medium" : "text-muted-foreground"
                          }`}>
                            {stepLabel}
                          </span>
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <ArrowRight className={`w-3 h-3 mx-0.5 shrink-0 mt-[-14px] ${
                            idx < currentStepIndex ? "text-primary" : "text-slate-300"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Back button */}
              <Button variant="outline" onClick={handleReset} className="w-full">
                {t('complaints.tracking.searchAnother')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
