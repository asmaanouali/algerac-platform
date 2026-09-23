import { useWorkflowProgress } from "@/hooks/use-requests";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import {
  getOecNextAction,
  getOecPhaseLabel,
  getOecPendingLabel,
  getOecStatusDisplay,
  isOecActionPending,
} from "@/lib/oec-request-display";

const PENDING_WITH_LABELS: Record<string, string> = {
  DT:  "Direction Technique",
  CD:  "Chef de Département",
  RA:  "Responsable d'Accréditation",
  DAG: "Direction Administrative et Générale",
  DG:  "Direction Générale",
  CAS: "Commission d'Accréditation et de Supervision",
  OEC: "Votre organisme",
  REE: "Responsable Équipe d'Évaluation",
  GES_COMPETENCES: "Gestion des Compétences",
  RQ:  "Responsable Qualité",
};

function formatPendingWith(raw: string, audience: "oec" | "staff"): string {
  if (audience === "oec") {
    return getOecPendingLabel(raw) || "ALGERAC";
  }
  return PENDING_WITH_LABELS[raw.trim()] ?? raw;
}

interface WorkflowTimelineProps {
  requestId: number;
  compact?: boolean;
  /** OEC: libellés clients sans jargon interne. Staff: libellés techniques. */
  audience?: "oec" | "staff";
}

export function WorkflowTimeline({ requestId, compact = false, audience = "oec" }: WorkflowTimelineProps) {
  const { t } = useTranslation();
  const { data: progress, isLoading } = useWorkflowProgress(requestId);

  if (isLoading || !progress) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded" />
      </div>
    );
  }

  const status = (progress as { status?: string }).status;
  const oecDisplay = getOecStatusDisplay(status);
  const phaseLabel = audience === "oec"
    ? getOecPhaseLabel(progress.phase, status)
    : progress.phaseLabel;
  const stepLabel = audience === "oec"
    ? oecDisplay.label
    : progress.stepLabel;
  const nextAction = audience === "oec"
    ? getOecNextAction({
        status,
        nextAction: progress.nextAction,
        currentStep: progress.currentStep,
        pendingWith: progress.pendingWith,
      })
    : progress.nextAction;
  const showPendingWith = audience === "staff"
    ? Boolean(progress.pendingWith)
    : isOecActionPending(progress.pendingWith);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{phaseLabel}</span>
          <Badge variant={progress.progress >= 100 ? "default" : "secondary"}>
            {progress.progress}%
          </Badge>
        </div>
        <Progress value={progress.progress} className="h-2" />
        <p className="text-xs text-muted-foreground">{stepLabel}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{t("workflow.progress", "Progression du dossier")}</span>
          <Badge
            variant={progress.progress >= 100 ? "default" : progress.progress >= 50 ? "secondary" : "outline"}
            className="text-sm"
          >
            {progress.progress}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress.progress} className="h-3" />

        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{phaseLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">{stepLabel}</p>

          {nextAction && (
            <div className="flex items-start gap-2 pt-1 border-t">
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
              <span className="text-xs">{nextAction}</span>
            </div>
          )}

          {showPendingWith && progress.pendingWith && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {t("workflow.pendingWith", "En attente de")} :{" "}
                <strong>{formatPendingWith(progress.pendingWith, audience)}</strong>
              </span>
            </div>
          )}

          {audience === "oec" && !isOecActionPending(progress.pendingWith) && progress.pendingWith && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                En cours de traitement par <strong>ALGERAC</strong>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
