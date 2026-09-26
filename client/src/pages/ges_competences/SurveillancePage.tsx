import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, AlertTriangle, RefreshCw, Users, Award,
  Clock, CalendarDays, TrendingUp, Eye, Star, ShieldAlert,
  CheckCircle2, XCircle, Activity
} from "lucide-react";

interface QualificationStats {
  totalQualifications: number;
  qualified: number;
  renewed: number;
  pendingCommission: number;
  pendingTraining: number;
  trainingInProgress: number;
  observerPhase: number;
  practicePhase: number;
  suspended: number;
  withdrawn: number;
  expiringIn90Days: number;
  expired: number;
  totalObservations: number;
  totalSatisfactionSurveys: number;
  plannedCommissions: number;
  completedCommissions: number;
}

interface ExpiringQualification {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  qualifiedRole: string;
  expiryDate: string;
  missionsCompletedCurrentCycle: number;
  lastObservationDate?: string;
  lastRecyclingDate?: string;
  recyclingParticipations: number;
  status: string;
}

interface SatisfactionSurvey {
  id: number;
  evaluator?: { id: number; fullName: string };
  oecUser: { fullName: string };
  evaluationDate: string;
  scoreMoyen?: number;
  satisfactionGlobale?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ET: "Évaluateur Technique",
  EXP: "Expert Technique",
  EQ: "Évaluateur Qualiticien",
  REE: "Responsable d'Équipe",
};

const ROLE_I18N_KEYS: Record<string, string> = { ET: "ET", EXP: "EXP", EQ: "EQ", REE: "REE" };

export default function SurveillancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<QualificationStats | null>(null);
  const [expiring, setExpiring] = useState<ExpiringQualification[]>([]);
  const [satisfaction, setSatisfaction] = useState<SatisfactionSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t("gesCompetences.surveillance.pageTitle", { defaultValue: "Surveillance & KPI - ALGERAC" });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, expiringRes, satRes] = await Promise.all([
        fetch("/api/qualifications/stats", { credentials: "include" }),
        fetch("/api/qualifications/expiring?days=90", { credentials: "include" }),
        fetch("/api/qualifications/satisfaction", { credentials: "include" }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (expiringRes.ok) setExpiring(await expiringRes.json());
      if (satRes.ok) setSatisfaction(await satRes.json());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // KPI calculations
  const kpis = useMemo(() => {
    if (!stats) return null;
    const totalActive = stats.qualified + stats.renewed;
    const qualificationRate = stats.totalQualifications > 0
      ? ((totalActive / stats.totalQualifications) * 100).toFixed(1)
      : "0";
    const avgSatisfaction = satisfaction.length > 0
      ? (satisfaction.reduce((acc, s) => acc + (s.scoreMoyen || 0), 0) / satisfaction.length).toFixed(2)
      : "-";
    return {
      qualificationRate,
      totalActive,
      avgSatisfaction,
      observationCoverage: totalActive > 0
        ? ((stats.totalObservations / totalActive) * 100).toFixed(1) : "0",
    };
  }, [stats, satisfaction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64">
          <Navbar />
          <main className="p-4 md:p-6 flex items-center justify-center h-96">
            <p className="text-gray-500">{t("gesCompetences.surveillance.loading", { defaultValue: "Chargement..." })}</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("gesCompetences.surveillance.title", { defaultValue: "Surveillance & Indicateurs" })}</h1>
              <p className="text-gray-500 mt-1">{t("gesCompetences.surveillance.subtitle", { defaultValue: "Tableau de bord de surveillance continue et KPI (PRO_06 §6.6)" })}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" /> {t("common.refresh")}
            </Button>
          </div>

          {/* KPI Cards */}
          {stats && kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("gesCompetences.surveillance.kpiQualificationRate", { defaultValue: "Taux de qualification" })}</p>
                      <p className="text-3xl font-bold text-emerald-600">{kpis.qualificationRate}%</p>
                      <p className="text-xs text-gray-400">{t("gesCompetences.surveillance.kpiQualifiedOfTotal", { active: kpis.totalActive, total: stats.totalQualifications, defaultValue: `${kpis.totalActive} qualifiés / ${stats.totalQualifications} total` })}</p>
                    </div>
                    <Award className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("gesCompetences.surveillance.kpiAvgSatisfaction", { defaultValue: "Satisfaction OEC moyenne" })}</p>
                      <p className="text-3xl font-bold text-blue-600">{kpis.avgSatisfaction}</p>
                      <p className="text-xs text-gray-400">{t("gesCompetences.surveillance.kpiSurveysCount", { count: satisfaction.length, defaultValue: `${satisfaction.length} enquêtes FOR 21` })}</p>
                    </div>
                    <Star className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("gesCompetences.surveillance.kpiExpiring90", { defaultValue: "Expirations <90j" })}</p>
                      <p className="text-3xl font-bold text-amber-600">{stats.expiringIn90Days}</p>
                      <p className="text-xs text-gray-400">{t("gesCompetences.surveillance.kpiExpiredCount", { count: stats.expired, defaultValue: `${stats.expired} expirées` })}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("gesCompetences.surveillance.kpiObservationCoverage", { defaultValue: "Couverture observations" })}</p>
                      <p className="text-3xl font-bold text-purple-600">{kpis.observationCoverage}%</p>
                      <p className="text-xs text-gray-400">{t("gesCompetences.surveillance.kpiObservationsCount", { count: stats.totalObservations, defaultValue: `${stats.totalObservations} observations FOR 71` })}</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pipeline & Alerts */}
          <Tabs defaultValue="pipeline">
            <TabsList>
              <TabsTrigger value="pipeline">{t("gesCompetences.surveillance.tabPipeline", { defaultValue: "Pipeline Qualification" })}</TabsTrigger>
              <TabsTrigger value="expiring">{t("gesCompetences.surveillance.tabExpiring", { count: expiring.length, defaultValue: `Expirations (${expiring.length})` })}</TabsTrigger>
              <TabsTrigger value="satisfaction">{t("gesCompetences.surveillance.tabSatisfaction", { defaultValue: "Satisfaction OEC" })}</TabsTrigger>
              <TabsTrigger value="alerts">{t("gesCompetences.surveillance.tabAlerts", { defaultValue: "Alertes" })}</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="mt-4">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: t("gesCompetences.surveillance.pipelinePendingTraining", { defaultValue: "Attente formation" }), count: stats.pendingTraining, color: "text-gray-600", icon: Clock },
                    { label: t("gesCompetences.surveillance.pipelineTrainingInProgress", { defaultValue: "Formation en cours" }), count: stats.trainingInProgress, color: "text-blue-600", icon: Activity },
                    { label: t("gesCompetences.surveillance.pipelineObserverPhase", { defaultValue: "Phase observation" }), count: stats.observerPhase, color: "text-indigo-600", icon: Eye },
                    { label: t("gesCompetences.surveillance.pipelinePracticePhase", { defaultValue: "Phase pratique" }), count: stats.practicePhase, color: "text-purple-600", icon: TrendingUp },
                    { label: t("gesCompetences.surveillance.pipelinePendingCommission", { defaultValue: "Attente commission" }), count: stats.pendingCommission, color: "text-orange-600", icon: Users },
                    { label: t("gesCompetences.surveillance.pipelineQualifiedActive", { defaultValue: "Qualifiés actifs" }), count: stats.qualified + stats.renewed, color: "text-emerald-600", icon: CheckCircle2 },
                  ].map((item, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 text-center">
                        <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                        <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {stats && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t("gesCompetences.surveillance.commissionsTitle", { defaultValue: "Commissions" })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{stats.plannedCommissions}</div>
                          <div className="text-xs text-gray-500">{t("gesCompetences.surveillance.commissionsPlanned", { defaultValue: "Planifiées" })}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats.completedCommissions}</div>
                          <div className="text-xs text-gray-500">{t("gesCompetences.surveillance.commissionsCompleted", { defaultValue: "Terminées" })}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t("gesCompetences.surveillance.sanctionsTitle", { defaultValue: "Sanctions" })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
                          <div className="text-xs text-gray-500">{t("gesCompetences.surveillance.sanctionsSuspended", { defaultValue: "Suspendus" })}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{stats.withdrawn}</div>
                          <div className="text-xs text-gray-500">{t("gesCompetences.surveillance.sanctionsWithdrawn", { defaultValue: "Retirés" })}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="expiring" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("gesCompetences.surveillance.table.evaluator", { defaultValue: "Évaluateur" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.role", { defaultValue: "Rôle" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.expiry", { defaultValue: "Expiration" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.missionsCycle", { defaultValue: "Missions/Cycle" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.lastObservation", { defaultValue: "Dernière observation" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.recycling", { defaultValue: "Recyclages" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.alert", { defaultValue: "Alerte" })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiring.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">{t("gesCompetences.surveillance.table.noneExpiring", { defaultValue: "Aucune qualification expirant bientôt" })}</TableCell></TableRow>
                      ) : expiring.map(q => {
                        const daysLeft = Math.ceil((new Date(q.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const missionsOk = q.missionsCompletedCurrentCycle >= 2;
                        const recyclingOk = q.recyclingParticipations >= 1;
                        return (
                          <TableRow key={q.id}>
                            <TableCell>
                              <div className="font-medium">{q.evaluator.fullName}</div>
                              <div className="text-xs text-gray-500">{q.evaluator.email}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{t(`gesCompetences.surveillance.roleLabels.${ROLE_I18N_KEYS[q.qualifiedRole]}`, { defaultValue: ROLE_LABELS[q.qualifiedRole] || q.qualifiedRole })}</Badge></TableCell>
                            <TableCell>
                              <span className={daysLeft < 30 ? "text-red-600 font-semibold" : daysLeft < 60 ? "text-orange-600" : ""}>
                                {new Date(q.expiryDate).toLocaleDateString("fr-FR")}
                              </span>
                              <div className="text-xs text-gray-400">{t("gesCompetences.surveillance.table.daysLeft", { days: daysLeft, defaultValue: `${daysLeft}j restants` })}</div>
                            </TableCell>
                            <TableCell>
                              <span className={missionsOk ? "text-green-600" : "text-red-600"}>
                                {q.missionsCompletedCurrentCycle} / 2 min
                              </span>
                            </TableCell>
                            <TableCell>
                              {q.lastObservationDate ? new Date(q.lastObservationDate).toLocaleDateString("fr-FR") : t("gesCompetences.surveillance.table.never", { defaultValue: "Jamais" })}
                            </TableCell>
                            <TableCell>
                              <span className={recyclingOk ? "text-green-600" : "text-red-600"}>
                                {q.recyclingParticipations}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(!missionsOk || !recyclingOk) && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              {missionsOk && recyclingOk && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="satisfaction" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("gesCompetences.surveillance.table.oec", { defaultValue: "OEC" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.evaluator", { defaultValue: "Évaluateur" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.date", { defaultValue: "Date" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.avgScore", { defaultValue: "Score moyen" })}</TableHead>
                        <TableHead>{t("gesCompetences.surveillance.table.globalSatisfaction", { defaultValue: "Satisfaction globale" })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {satisfaction.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{t("gesCompetences.surveillance.table.noSurveys", { defaultValue: "Aucune enquête de satisfaction" })}</TableCell></TableRow>
                      ) : satisfaction.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.oecUser.fullName}</TableCell>
                          <TableCell>{s.evaluator?.fullName || "-"}</TableCell>
                          <TableCell>{new Date(s.evaluationDate).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{s.scoreMoyen?.toFixed(1) ?? "-"}</span>
                            <span className="text-xs text-gray-400">/5</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{s.satisfactionGlobale || "-"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <div className="space-y-4">
                {stats && stats.expired > 0 && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <XCircle className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-semibold text-red-800">{t("gesCompetences.surveillance.alerts.expiredCount", { count: stats.expired, defaultValue: `${stats.expired} qualification(s) expirée(s)` })}</p>
                        <p className="text-sm text-gray-500">{t("gesCompetences.surveillance.alerts.expiredAction", { defaultValue: "Action requise : renouvellement ou retrait" })}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats && stats.expiringIn90Days > 0 && (
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                      <div>
                        <p className="font-semibold text-amber-800">{t("gesCompetences.surveillance.alerts.expiring90Count", { count: stats.expiringIn90Days, defaultValue: `${stats.expiringIn90Days} qualification(s) expirent dans les 90 jours` })}</p>
                        <p className="text-sm text-gray-500">{t("gesCompetences.surveillance.alerts.expiring90Action", { defaultValue: "Planifier le renouvellement et vérifier les conditions (missions, recyclage)" })}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats && stats.suspended > 0 && (
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <ShieldAlert className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className="font-semibold text-orange-800">{t("gesCompetences.surveillance.alerts.suspendedCount", { count: stats.suspended, defaultValue: `${stats.suspended} évaluateur(s) suspendu(s)` })}</p>
                        <p className="text-sm text-gray-500">{t("gesCompetences.surveillance.alerts.suspendedAction", { defaultValue: "Suivre les conditions de levée de suspension" })}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats && stats.pendingCommission > 0 && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Users className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-semibold text-blue-800">{t("gesCompetences.surveillance.alerts.pendingCommissionCount", { count: stats.pendingCommission, defaultValue: `${stats.pendingCommission} dossier(s) en attente de commission` })}</p>
                        <p className="text-sm text-gray-500">{t("gesCompetences.surveillance.alerts.pendingCommissionAction", { defaultValue: "Planifier une session de la Commission de Qualification" })}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats && stats.expired === 0 && stats.expiringIn90Days === 0 && stats.suspended === 0 && stats.pendingCommission === 0 && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-green-800">{t("gesCompetences.surveillance.alerts.none", { defaultValue: "Aucune alerte" })}</p>
                        <p className="text-sm text-gray-500">{t("gesCompetences.surveillance.alerts.noneDesc", { defaultValue: "Tous les indicateurs sont normaux" })}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
