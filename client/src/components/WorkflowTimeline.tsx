import { useWorkflowProgress } from "@/hooks/use-requests";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";

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

function formatPendingWith(raw: string): string {
  return PENDING_WITH_LABELS[raw.trim()] ?? raw;
}

const PHASE_ORDER = [
  "INITIAL",
  "RECEVABILITE",
  "VISITE_PREALABLE",
  "CONTRACTUALISATION",
  "CONSTITUTION_EQUIPE",
  "REVUE_DOCUMENTAIRE",
  "PREPARATION_EVALUATION",
  "EVALUATION",
  "TRAITEMENT_ECARTS",
  "RAPPORT",
  "DECISION_CAS",
  "POST_DECISION",
  "ACTIVE",
  "SURVEILLANCE",
];

const PHASE_RANGES: Record<string, [number, number]> = {
  INITIAL: [0, 10],
  RECEVABILITE: [10, 20],
  VISITE_PREALABLE: [15, 20],
  CONTRACTUALISATION: [20, 35],
  CONSTITUTION_EQUIPE: [35, 45],
  REVUE_DOCUMENTAIRE: [45, 55],
  PREPARATION_EVALUATION: [55, 65],
  EVALUATION: [65, 75],
  TRAITEMENT_ECARTS: [75, 82],
  RAPPORT: [82, 87],
  DECISION_CAS: [87, 95],
  POST_DECISION: [95, 100],
  ACTIVE: [100, 100],
  SURVEILLANCE: [100, 100],
};

interface WorkflowTimelineProps {
  requestId: number;
  compact?: boolean;
}

export function WorkflowTimeline({ requestId, compact = false }: WorkflowTimelineProps) {
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

  const currentPhaseIndex = PHASE_ORDER.indexOf(progress.phase);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{progress.phaseLabel}</span>
          <Badge variant={progress.progress >= 100 ? "default" : "secondary"}>
            {progress.progress}%
          </Badge>
        </div>
        <Progress value={progress.progress} className="h-2" />
        <p className="text-xs text-muted-foreground">{progress.stepLabel}</p>
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

        {/* Current status */}
        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{progress.phaseLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">{progress.stepLabel}</p>

          {progress.nextAction && (
            <div className="flex items-start gap-2 pt-1 border-t">
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
              <span className="text-xs">{progress.nextAction}</span>
            </div>
          )}

          {progress.pendingWith && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {t("workflow.pendingWith", "En attente de")} : <strong>{formatPendingWith(progress.pendingWith)}</strong>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
