
import { Sidebar } from "@/components/layout-sidebar";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/navbar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Files, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, Users, ClipboardList, RefreshCw, UserPlus, FileSearch, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface Request {
  id: number;
  referenceNumber: string | null;
  type: string;
  domain: string;
  status: string;
  progress: number;
  currentStep: string | null;
  pendingWith: string | null;
  assignedRaName: string | null;
  oecName: string | null;
  submissionDate: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAYMENT_COMPLETED: "bg-amber-100 text-amber-700",
  ASSIGNED_TO_RA: "bg-blue-100 text-blue-700",
  RECEIVABILITY_STUDY: "bg-indigo-100 text-indigo-700",
  RECEIVABLE: "bg-emerald-100 text-emerald-700",
  NOT_RECEIVABLE: "bg-red-100 text-red-700",
  TEAM_COMPOSITION: "bg-purple-100 text-purple-700",
  QUOTATION_PREPARATION: "bg-cyan-100 text-cyan-700",
  QUOTATION_SENT_TO_OEC: "bg-teal-100 text-teal-700",
  EVALUATION_IN_PROGRESS: "bg-violet-100 text-violet-700",
  CAS_DECISION_GRANT: "bg-emerald-100 text-emerald-700",
  CERTIFICATE_ISSUED: "bg-green-100 text-green-800",
};

export default function CDDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const reqRes = await apiRequest("GET", "/api/requests");
      const reqData = await reqRes.json();
      setRequests(Array.isArray(reqData) ? reqData : Array.isArray(reqData?.data) ? reqData.data : []);
      setLastFetched(new Date());
    } catch {
      if (!isBackground) setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Keep the dashboard in sync with backend state: poll every 30s and on window focus.
    const interval = setInterval(() => loadData(true), 30000);
    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const getStatus = (status: string) => ({
    label: t(`workflowStatus.${status}`, { defaultValue: status.replace(/_/g, " ") }),
    color: STATUS_COLORS[status] || "bg-slate-100 text-slate-700",
  });

  const pendingAssignment = requests.filter(r => r.status === "PAYMENT_COMPLETED" || r.status === "PENDING_CD_ASSIGNMENT");
  const teamComposition = requests.filter(r => r.status === "TEAM_COMPOSITION");
  const quotationPrep = requests.filter(r => r.status === "QUOTATION_PREPARATION");
  const receivabilityStudy = requests.filter(r => r.status === "RECEIVABILITY_STUDY");

  const requiredActions = [
    ...(pendingAssignment.length > 0 ? [{
      label: "Demandes sans RA affecté",
      description: "Affecter un responsable d'accréditation",
      href: "/cd/manage-requests",
      icon: UserPlus,
      badgeColor: "bg-amber-100 text-amber-800",
      borderColor: "border-l-amber-500",
      requests: pendingAssignment,
    }] : []),
    ...(receivabilityStudy.length > 0 ? [{
      label: "Études de recevabilité",
      description: "Décision de recevabilité à rendre",
      href: "/cd/revue-documentaire",
      icon: FileSearch,
      badgeColor: "bg-indigo-100 text-indigo-800",
      borderColor: "border-l-indigo-500",
      requests: receivabilityStudy,
    }] : []),
    ...(teamComposition.length > 0 ? [{
      label: "Compositions d'équipe",
      description: "Valider la composition de l'équipe d'audit",
      href: "/cd/pilotage-evaluation",
      icon: Users,
      badgeColor: "bg-purple-100 text-purple-800",
      borderColor: "border-l-purple-500",
      requests: teamComposition,
    }] : []),
    ...(quotationPrep.length > 0 ? [{
      label: "Devis à préparer",
      description: "Préparer et envoyer le devis à l'OEC",
      href: "/cd/pilotage-evaluation",
      icon: BarChart3,
      badgeColor: "bg-cyan-100 text-cyan-800",
      borderColor: "border-l-cyan-500",
      requests: quotationPrep,
    }] : []),
  ];

  const totalActionCount = requiredActions.reduce((sum, a) => sum + a.requests.length, 0);

  const inProgress = requests.filter(r => !["PAYMENT_COMPLETED", "PENDING_CD_ASSIGNMENT", "CERTIFICATE_ISSUED", "CLOSED", "WITHDRAWN", "CAS_DECISION_GRANT"].includes(r.status));
  const completed = requests.filter(r => r.status === "CERTIFICATE_ISSUED" || r.status === "CAS_DECISION_GRANT");

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <DashboardHeader
            title={t('cd.dashboardTitle')}
            subtitle={
              `${(user as any)?.departmentName ? `Département : ${(user as any).departmentName}` : t('cd.dashboardSubtitle')}`
              + (lastFetched ? ` • Mis à jour : ${lastFetched.toLocaleTimeString("fr-FR")}` : "")
            }
            onRefresh={() => loadData()}
            refreshing={refreshing}
          />

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={t('cd.totalRequests')} value={requests.length} icon={Files} description={t('cd.allRequests')} />
                <StatCard title={t('cd.toAssign')} value={pendingAssignment.length} icon={AlertCircle} description={t('cd.awaitingRA')} className={pendingAssignment.length > 0 ? "border-l-amber-500" : ""} />
                <StatCard title={t('cd.inProgress')} value={inProgress.length} icon={Clock} description={t('cd.currentlyOpen')} className="border-l-blue-500" />
                <StatCard title={t('cd.completed')} value={completed.length} icon={CheckCircle2} description={t('cd.certifiedOrGranted')} className="border-l-emerald-500" />
              </div>

              {/* Actions requises */}
              <Card className={requiredActions.length > 0 ? "border-rose-200 bg-rose-50/40" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className={`h-5 w-5 ${requiredActions.length > 0 ? "text-rose-600" : "text-muted-foreground"}`} />
                    Actions requises
                    {totalActionCount > 0 && (
                      <Badge className="bg-rose-100 text-rose-700 ml-1">{totalActionCount}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Éléments nécessitant votre intervention directe</CardDescription>
                </CardHeader>
                <CardContent>
                  {requiredActions.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Aucune action requise — tout est à jour.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {requiredActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <div key={action.label}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4 text-slate-400" />
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{action.label}</span>
                              <Badge className={`${action.badgeColor} text-xs`}>{action.requests.length}</Badge>
                            </div>
                            <div className="flex flex-col gap-2">
                              {action.requests.map((req) => (
                                <Link key={req.id} href={`${action.href}?id=${req.id}`}>
                                  <div className={`flex items-center justify-between px-4 py-3 rounded-lg border-l-4 bg-white border border-slate-100 hover:shadow-md transition-shadow cursor-pointer ${action.borderColor}`}>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-sm">{req.referenceNumber ?? `#${req.id}`}</span>
                                      <span className="text-xs text-muted-foreground truncate">{req.oecName ?? "OEC non renseigné"} — {action.description}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Requests */}

              {/* Recent Requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('requests.title')}</CardTitle>
                    <CardDescription>{t('cd.allRequests')}</CardDescription>
                  </div>
                  <Link href="/cd/manage-requests">
                    <Button size="sm" variant="outline">{t('oec.viewAll')} <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('cd.noRequests')}</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 8).map(req => {
                        const st = getStatus(req.status);
                        return (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{req.referenceNumber || `Demande #${req.id}`}</p>
                                <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {req.oecName && `${req.oecName} · `}{req.domain} · {req.type === "INITIAL" ? t('oec.initial') : req.type === "EXTENSION" ? t('oec.extension') : req.type}
                              </p>
                              {req.assignedRaName && <p className="text-xs text-blue-600">RA: {req.assignedRaName}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="w-16 bg-slate-100 rounded-full h-2">
                                  <div className="bg-primary h-full rounded-full" style={{ width: `${req.progress}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{req.progress}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/cd/manage-requests">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">{t('cd.tabs.all')}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{t('cd.manageRequestsDesc')}</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/cd/accreditations">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                      <h3 className="font-semibold">{t('nav.accreditations')}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{t('cd.certificatesDesc')}</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/cd/ra-workload">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold">{t('cd.raTeamTitle')}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{t('cd.workloadDesc')}</p>
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
