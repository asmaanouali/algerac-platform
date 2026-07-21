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
import {
  Loader2, FileSearch, FileText, ArrowRight, ClipboardList, Users,
  AlertCircle, CheckCircle2, Clock, Briefcase, Gavel,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED_TO_RA: "Assigné",
  RECEIVABILITY_STUDY: "Étude en cours",
  RESOURCE_CHECK: "Vérification ressources",
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
  TEAM_SENT_TO_OEC: "Équipe envoyée",
  TEAM_VALIDATED: "Équipe validée",
  TEAM_RECUSED: "Équipe récusée",
  DOCUMENTARY_REVIEW: "Revue documentaire",
  DOCUMENTARY_REVIEW_DEFICIENCIES: "Insuffisances doc.",
  AWAITING_OEC_DOC_RESPONSE: "Attente réponse OEC",
  DOCUMENTARY_REVIEW_COMPLETED: "Revue terminée",
  EVALUATION_PLAN_PREPARATION: "Préparation plan",
  EVALUATION_PLANNED: "Évaluation planifiée",
  EVALUATION_IN_PROGRESS: "Évaluation en cours",
  EVALUATION_COMPLETED: "Évaluation terminée",
  AWAITING_ACTION_PLANS: "Plans d'action attendus",
  REPORT_DRAFTING: "Rédaction rapport",
  REPORT_VALIDATED: "Rapport validé",
  CAS_PREPARATION: "Préparation CAS",
  CAS_SCHEDULED: "CAS programmé",
  CAS_DECISION_GRANT: "Décision favorable",
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

const RA_PENDING_STATUSES = new Set([
  "ASSIGNED_TO_RA",
  "RECEIVABILITY_STUDY",
  "RESOURCE_CHECK",
  "PRELIMINARY_VISIT_COMPLETED",
  "DG_VALIDATED",
  "RECEIVABLE",
  "QUOTATION_APPROVED_BY_DAG",
  "QUOTATION_CONVENTION_CD_MODIF",
  "QUOTATION_VALIDATED",
  "TEAM_VALIDATED",
  "DOCUMENTARY_REVIEW_COMPLETED",
  "EVALUATION_COMPLETED",
  "REPORT_VALIDATED",
]);

const NEXT_STEP_LINK: Record<string, { href: (id: number | string) => string; label: string }> = {
  ASSIGNED_TO_RA: { href: () => "/ra/faisabilite", label: "Étude de recevabilité" },
  RECEIVABILITY_STUDY: { href: () => "/ra/faisabilite", label: "Continuer l'étude" },
  RESOURCE_CHECK: { href: () => "/ra/faisabilite", label: "Décider visite préliminaire" },
  PRELIMINARY_VISIT_COMPLETED: { href: () => "/ra/faisabilite", label: "Préparer dossier DG" },
  DG_VALIDATED: { href: () => "/ra/faisabilite", label: "Notifier l'OEC" },
  RECEIVABLE: { href: (id) => `/ra/demandes/${id}/devis`, label: "Préparer le devis" },
  QUOTATION_APPROVED_BY_DAG: { href: (id) => `/ra/demandes/${id}/devis`, label: "Préparer convention" },
  QUOTATION_CONVENTION_CD_MODIF: { href: (id) => `/ra/demandes/${id}/devis`, label: "Corriger (modif CD)" },
  QUOTATION_VALIDATED: { href: () => "/ra/equipes", label: "Constituer l'équipe" },
  TEAM_VALIDATED: { href: () => "/ra/revue-documentaire", label: "Revue documentaire" },
  DOCUMENTARY_REVIEW_COMPLETED: { href: () => "/ra/preparation-evaluation", label: "Préparer évaluation" },
  EVALUATION_COMPLETED: { href: () => "/ra/gestion-ecarts", label: "Gérer les écarts" },
  REPORT_VALIDATED: { href: () => "/ra/preparation-cas", label: "Préparer CAS" },
};

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
  const actionRequired = requests.filter(r => RA_PENDING_STATUSES.has(r.status));
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
                  description="En attente de votre action"
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
                      <AlertCircle className="h-5 w-5" /> Actions requises ({actionRequired.length})
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Dossiers en attente de votre intervention pour avancer.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {actionRequired.slice(0, 6).map(req => {
                      const next = NEXT_STEP_LINK[req.status];
                      const st = getStatus(req.status);
                      return (
                        <div key={req.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {req.referenceNumber || `Demande #${req.id}`}
                              </p>
                              <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                            </div>
                            <p className="text-xs text-amber-700 truncate">
                              {req.oec?.organizationName || req.oec?.fullName || "—"} · {req.domain || "—"}
                            </p>
                          </div>
                          {next && (
                            <Link href={next.href(req.id)}>
                              <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 ml-2">
                                {next.label} <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
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
                    <CardDescription>Tous les dossiers qui vous sont assignés</CardDescription>
                  </div>
                  <Link href="/ra/dossiers">
                    <Button size="sm" variant="outline">Voir tout <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun dossier assigné</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 8).map(req => {
                        const st = getStatus(req.status);
                        return (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">
                                  {req.referenceNumber || `Demande #${req.id}`}
                                </p>
                                <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {req.oec?.organizationName || req.oec?.fullName || "—"} · {req.domain || "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-2">
                              <div className="text-right hidden sm:block">
                                <Progress value={getProgress(req.status)} className="w-24" />
                                <p className="text-xs text-muted-foreground mt-1">{getProgress(req.status)}%</p>
                              </div>
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
