import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { apiRequest } from "@/lib/queryClient";
import { getRaResume, isRaActionRequired } from "@/lib/ra-resume";
import {
  Loader2, FileSearch, ArrowRight, ClipboardList, Users,
  AlertCircle, CheckCircle2, Clock, Briefcase, Gavel,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED_TO_RA: "À confirmer/refuser",
  RECEIVABILITY_STUDY: "Étude en cours",
  RESOURCE_CHECK: "Vérification ressources",
  RECEIVABILITY_RESUBMITTED: "Corrections à réexaminer",
  RECEIVABILITY_PENDING_CD_REVIEW: "Attente validation CD",
  PRELIMINARY_VISIT_PROPOSED: "Visite proposée",
  PRELIMINARY_VISIT_ACCEPTED: "Visite acceptée",
  PRELIMINARY_VISIT_COMPLETED: "Visite terminée",
  PENDING_DG_VALIDATION: "Attente validation DG",
  DG_VALIDATED: "Validé par DG",
  RECEIVABLE: "Recevable",
  NOT_RECEIVABLE: "Non recevable",
  QUOTATION_PREPARATION: "Préparation devis",
  QUOTATION_SENT_TO_DAG: "Devis envoyé DAG",
  QUOTATION_APPROVED_BY_DAG: "Devis approuvé DAG",
  CONVENTION_PREPARATION: "Préparation convention",
  QUOTATION_CONVENTION_PENDING_CD: "Attente CD",
  QUOTATION_CONVENTION_CD_MODIF: "Modifications CD",
  QUOTATION_SENT_TO_OEC: "Envoyé OEC",
  QUOTATION_OEC_REMINDER: "Rappel OEC",
  QUOTATION_VALIDATED: "Devis validé",
  TEAM_DESIGNATION: "Constitution équipe",
  TEAM_SENT_TO_CD: "Équipe chez CD",
  TEAM_CD_APPROVED: "Équipe validée CD",
  TEAM_CD_CHANGES_REQUESTED: "Modif. équipe CD",
  TEAM_SENT_TO_OEC: "Équipe envoyée",
  TEAM_DATE_REFUSED: "Date refusée",
  TEAM_VALIDATED: "Équipe validée",
  TEAM_RECUSED: "Équipe récusée",
  TEAM_MEMBER_RECUSED: "Membre récusé",
  DOCUMENTARY_REVIEW: "Revue documentaire",
  DOC_REVIEW_PAYMENT_VALIDATED: "Paiement revue validé",
  DOC_REVIEW_IN_PROGRESS: "Revue en cours",
  DOC_REVIEW_RESULTS_SUBMITTED: "Résultats revue reçus",
  DOCUMENTARY_REVIEW_DEFICIENCIES: "Insuffisances doc.",
  AWAITING_OEC_DOC_RESPONSE: "Attente réponse OEC",
  DOCUMENTARY_REVIEW_COMPLETED: "Revue terminée",
  MANDATES_PREPARATION: "Mandatements",
  MANDATES_CD_MODIFICATION: "Modif. mandatements",
  MISSION_ORDERS_PENDING: "Ordres de mission",
  EVALUATION_PLAN_PREPARATION: "Préparation plan",
  EVALUATION_PLAN_PENDING_RA: "Plan à valider",
  EVALUATION_PLANNED: "Évaluation planifiée",
  EVALUATION_IN_PROGRESS: "Évaluation en cours",
  EVALUATION_COMPLETED: "Évaluation terminée",
  AWAITING_ACTION_PLANS: "Plans d'action attendus",
  ACTION_PLANS_EVALUATION: "Plans d'action à évaluer",
  GAPS_RESOLVED: "Écarts résolus",
  REPORT_DRAFTING: "Rédaction rapport",
  REPORT_VALIDATION: "Validation rapport",
  REPORT_VALIDATED: "Rapport validé",
  CAS_PREPARATION: "Préparation CAS",
  CAS_SCHEDULED: "CAS programmé",
  CAS_DECISION_GRANT: "Décision favorable",
  CERTIFICATE_PREPARATION: "Préparation certificat",
  CERTIFICATE_ISSUED: "Certificat délivré",
  ACTIVE: "Accréditation active",
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED_TO_RA: "bg-amber-100 text-amber-700",
  RECEIVABILITY_STUDY: "bg-blue-100 text-blue-700",
  PENDING_DG_VALIDATION: "bg-purple-100 text-purple-700",
  DG_VALIDATED: "bg-emerald-100 text-emerald-700",
  RECEIVABLE: "bg-emerald-100 text-emerald-700",
  NOT_RECEIVABLE: "bg-red-100 text-red-700",
  QUOTATION_CONVENTION_CD_MODIF: "bg-amber-100 text-amber-700",
  TEAM_CD_CHANGES_REQUESTED: "bg-amber-100 text-amber-700",
  EVALUATION_IN_PROGRESS: "bg-violet-100 text-violet-700",
  CAS_DECISION_GRANT: "bg-emerald-100 text-emerald-700",
  CERTIFICATE_ISSUED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
};

const PROGRESS_STEPS = [
  "ASSIGNED_TO_RA", "RECEIVABILITY_STUDY", "RESOURCE_CHECK", "PENDING_DG_VALIDATION",
  "DG_VALIDATED", "RECEIVABLE",
  "QUOTATION_PREPARATION", "QUOTATION_APPROVED_BY_DAG", "QUOTATION_CONVENTION_PENDING_CD", "QUOTATION_VALIDATED",
  "TEAM_DESIGNATION", "TEAM_VALIDATED",
  "DOCUMENTARY_REVIEW", "DOCUMENTARY_REVIEW_COMPLETED",
  "EVALUATION_PLAN_PREPARATION", "EVALUATION_PLANNED", "EVALUATION_IN_PROGRESS", "EVALUATION_COMPLETED",
  "AWAITING_ACTION_PLANS", "GAPS_RESOLVED",
  "REPORT_DRAFTING", "REPORT_VALIDATED",
  "CAS_PREPARATION", "CAS_SCHEDULED", "CAS_DECISION_GRANT",
  "CERTIFICATE_ISSUED", "ACTIVE",
];

function ResumeButton({ status, requestId, size = "sm" as const, className = "" }: {
  status: string;
  requestId: number | string;
  size?: "sm" | "default";
  className?: string;
}) {
  const next = getRaResume(status, requestId);
  return (
    <Link href={next.href}>
      <Button size={size} variant={next.actionRequired ? "default" : "outline"} className={className}>
        {next.label} <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </Link>
  );
}

export default function RADashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const newAssignments = requests.filter(r => r.status === "ASSIGNED_TO_RA");
  const actionRequired = requests.filter(r => isRaActionRequired(r.status, r.pendingWith));
  const inProgress = requests.filter(r =>
    !["CERTIFICATE_ISSUED", "ACTIVE", "CAS_DECISION_REFUSAL", "WITHDRAWN", "CLOSED", "NOT_RECEIVABLE"].includes(r.status)
  );
  const completed = requests.filter(r => ["CERTIFICATE_ISSUED", "ACTIVE", "CAS_DECISION_GRANT"].includes(r.status));

  const getProgress = (status: string) => {
    const idx = PROGRESS_STEPS.indexOf(status);
    return idx >= 0 ? Math.round(((idx + 1) / PROGRESS_STEPS.length) * 100) : 5;
  };

  const getStatus = (status: string) => ({
    label: STATUS_LABELS[status] || status.replace(/_/g, " "),
    color: STATUS_COLORS[status] || "bg-slate-100 text-slate-700",
  });

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <DashboardHeader
            title={t('ra.dashboardTitle', { defaultValue: "Tableau de bord RA" })}
            subtitle={`${user?.fullName ? `${user.fullName} — ` : ""}${t('ra.dashboardSubtitle', { defaultValue: "Suivi de mes dossiers d'accréditation" })}`}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Nouvelles assignations"
                  value={newAssignments.length}
                  icon={AlertCircle}
                  description="À démarrer"
                  className={newAssignments.length > 0 ? "border-l-amber-500" : ""}
                />
                <StatCard
                  title="Actions requises"
                  value={actionRequired.length}
                  icon={Clock}
                  description="Reprendre le traitement"
                  className={actionRequired.length > 0 ? "border-l-blue-500" : ""}
                />
                <StatCard
                  title="Dossiers actifs"
                  value={inProgress.length}
                  icon={Briefcase}
                  description="En cours de traitement"
                />
                <StatCard
                  title="Accréditations"
                  value={completed.length}
                  icon={CheckCircle2}
                  description="Décision favorable / actives"
                  className={completed.length > 0 ? "border-l-emerald-500" : ""}
                />
              </div>

              {actionRequired.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" /> Reprendre ici ({actionRequired.length})
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Chaque bouton ouvre exactement l'étape où le dossier s'est arrêté.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {actionRequired.map(req => {
                      const next = getRaResume(req.status, req.id);
                      const st = getStatus(req.status);
                      return (
                        <div key={req.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-amber-100">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">
                                {req.referenceNumber || `Demande #${req.id}`}
                              </p>
                              <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                            </div>
                            <p className="text-xs text-amber-700 truncate">
                              {req.oec?.organizationName || req.oec?.fullName || "—"} · {next.phase} · {req.domain || "—"}
                            </p>
                          </div>
                          <ResumeButton status={req.status} requestId={req.id} className="ml-2 shrink-0" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mes dossiers</CardTitle>
                    <CardDescription>Tous les dossiers qui vous sont assignés — cliquez pour reprendre à l'étape en cours</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun dossier assigné</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map(req => {
                        const st = getStatus(req.status);
                        const next = getRaResume(req.status, req.id);
                        return (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">
                                  {req.referenceNumber || `Demande #${req.id}`}
                                </p>
                                <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {req.oec?.organizationName || req.oec?.fullName || "—"} · {next.phase} · {req.domain || "—"}
                                {next.waitingOn ? ` · En attente de ${next.waitingOn}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right hidden sm:block">
                                <Progress value={getProgress(req.status)} className="w-24" />
                                <p className="text-xs text-muted-foreground mt-1">{getProgress(req.status)}%</p>
                              </div>
                              <ResumeButton
                                status={req.status}
                                requestId={req.id}
                                className={next.actionRequired ? "" : "text-slate-700"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/ra/faisabilite">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <FileSearch className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Étude de recevabilité</h3>
                      <p className="text-xs text-muted-foreground mt-1">Étape 2</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/ra/equipes">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold">Constitution d'équipe</h3>
                      <p className="text-xs text-muted-foreground mt-1">Étape 4</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/ra/revue-documentaire">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 text-indigo-600" />
                      <h3 className="font-semibold">Revue documentaire</h3>
                      <p className="text-xs text-muted-foreground mt-1">Étape 5</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/ra/preparation-cas">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Gavel className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                      <h3 className="font-semibold">Préparation CAS</h3>
                      <p className="text-xs text-muted-foreground mt-1">Étape 9</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
