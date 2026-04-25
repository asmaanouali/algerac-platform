import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import {
  Users, FileCheck, Clock, UserCheck, AlertCircle, Loader2, ArrowRight,
  CheckCircle2, XCircle, Stamp, Building2, FileText, Award
} from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface OECApplication {
  id: number;
  nomOrganisme: string;
  typeOrganisme: string;
  email: string;
  nomRepresentant: string;
  typeDemande: string;
  status: string;
  createdAt: string;
}

interface AccreditationReq {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  submissionDate: string;
  createdAt: string;
  oec?: { organizationName?: string; fullName?: string };
}

interface MissionOrder {
  id: number;
  status: string;
  createdAt: string;
  teamMemberName?: string;
}

const oecAppStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING_DT: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  APPROVED_BY_DT: { label: "Approuvée", color: "bg-green-100 text-green-700" },
  REJECTED_BY_DT: { label: "Rejetée", color: "bg-red-100 text-red-700" },
  AWAITING_DAG_FEE: { label: "En attente DAG", color: "bg-blue-100 text-blue-700" },
  FEE_SET_AWAITING_PAYMENT: { label: "Paiement en attente", color: "bg-indigo-100 text-indigo-700" },
  PAYMENT_VERIFIED: { label: "Paiement vérifié", color: "bg-emerald-100 text-emerald-700" },
  ACCOUNT_CREATED: { label: "Compte créé", color: "bg-green-100 text-green-800" },
};

const requestStatusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Soumise", color: "bg-blue-100 text-blue-700" },
  PENDING_DT_REVIEW: { label: "Vérification DT", color: "bg-amber-100 text-amber-700" },
  DT_APPROVED: { label: "Validée DT", color: "bg-emerald-100 text-emerald-700" },
  DT_REJECTED: { label: "Rejetée DT", color: "bg-red-100 text-red-700" },
  PENDING_CD_ASSIGNMENT: { label: "Transmise au CD", color: "bg-blue-100 text-blue-700" },
  ASSIGNED_TO_RA: { label: "Prise en charge", color: "bg-indigo-100 text-indigo-700" },
};

export default function DTDashboard() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<OECApplication[]>([]);
  const [allApps, setAllApps] = useState<OECApplication[]>([]);
  const [requests, setRequests] = useState<AccreditationReq[]>([]);
  const [missionOrders, setMissionOrders] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pendingRes, allRes, reqsRes, moRes] = await Promise.all([
        apiRequest("GET", "/api/oec-applications/pending").catch(() => null),
        apiRequest("GET", "/api/oec-applications/all").catch(() => null),
        apiRequest("GET", "/api/requests").catch(() => null),
        apiRequest("GET", "/api/workflow/mission-orders/pending-approval").catch(() => null),
      ]);
      const pendingData = pendingRes ? await pendingRes.json() : [];
      const allData = allRes ? await allRes.json() : [];
      const reqsData = reqsRes ? await reqsRes.json() : [];
      const moData = moRes ? await moRes.json() : [];
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setAllApps(Array.isArray(allData) ? allData : []);
      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setMissionOrders(Array.isArray(moData) ? moData : []);
    } catch {
      /* swallow — dashboard is best-effort */
    } finally {
      setLoading(false);
    }
  };

  const approvedApps = allApps.filter(a => a.status !== "PENDING_DT" && a.status !== "REJECTED_BY_DT").length;
  const rejectedApps = allApps.filter(a => a.status === "REJECTED_BY_DT").length;

  const requestsPendingDT = requests.filter(r => r.status === "SUBMITTED" || r.status === "PENDING_DT_REVIEW");
  const requestsValidatedDT = requests.filter(r => r.status === "DT_APPROVED" || r.status === "PENDING_CD_ASSIGNMENT");
  const requestsActive = requests.filter(r => ["ASSIGNED_TO_RA", "EVALUATION_IN_PROGRESS", "EVALUATION_PLANNED"].includes(r.status));

  const getAppStatus = (s: string) => oecAppStatusConfig[s] || { label: s?.replace(/_/g, " ") || "—", color: "bg-slate-100 text-slate-700" };
  const getReqStatus = (s: string) => requestStatusConfig[s] || { label: s?.replace(/_/g, " ") || "—", color: "bg-slate-100 text-slate-700" };

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.submissionDate || b.createdAt).getTime() - new Date(a.submissionDate || a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t('dt_page.dashboardTitle', { defaultValue: "Tableau de bord DT" })}</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de l'activité technique : candidatures, demandes d'accréditation, ordres de mission.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {/* Top-level stats (role-relevant) */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Demandes à vérifier"
                  value={requestsPendingDT.length}
                  icon={FileCheck}
                  description="Demandes d'accréditation OEC"
                  className={requestsPendingDT.length > 0 ? "border-l-amber-500" : ""}
                />
                <StatCard
                  title="Candidatures en attente"
                  value={pending.length}
                  icon={Clock}
                  description="Nouveaux OEC à examiner"
                  className={pending.length > 0 ? "border-l-amber-500" : ""}
                />
                <StatCard
                  title="Ordres de mission"
                  value={missionOrders.length}
                  icon={Stamp}
                  description="En attente d'approbation"
                  className={missionOrders.length > 0 ? "border-l-indigo-500" : ""}
                />
                <StatCard
                  title="Dossiers actifs"
                  value={requestsActive.length}
                  icon={Award}
                  description="En cours d'évaluation"
                  className="border-l-emerald-500"
                />
              </div>

              {/* Secondary stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Demandes validées" value={requestsValidatedDT.length} icon={CheckCircle2} description="Transmises au CD" />
                <StatCard title="Candidatures approuvées" value={approvedApps} icon={UserCheck} description="OEC intégrés" />
                <StatCard title="Candidatures rejetées" value={rejectedApps} icon={XCircle} description="Historique" />
              </div>

              {/* Pending accreditation requests */}
              {requestsPendingDT.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {requestsPendingDT.length} demande(s) d'accréditation à vérifier
                    </CardTitle>
                    <CardDescription>Vérifiez les documents puis transmettez au CD du département concerné.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {requestsPendingDT.slice(0, 5).map(r => {
                      const st = getReqStatus(r.status);
                      return (
                        <div key={r.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {r.referenceNumber || `Demande #${r.id}`} — {r.oec?.organizationName || r.oec?.fullName || "OEC"}
                            </p>
                            <p className="text-xs text-amber-700">{r.domain || "Domaine non renseigné"} · {r.type}</p>
                          </div>
                          <Badge className={`${st.color} text-xs mr-2`}>{st.label}</Badge>
                          <Link href={`/dt/demandes-accreditation`}>
                            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300">
                              Examiner <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Pending OEC candidatures */}
              {pending.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5" /> {pending.length} candidature(s) OEC en attente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pending.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100">
                        <div>
                          <p className="font-medium text-sm">{app.nomOrganisme}</p>
                          <p className="text-xs text-blue-700">{app.typeOrganisme} · {app.nomRepresentant}</p>
                        </div>
                        <Link href="/dt/candidatures">
                          <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                            Examiner <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Mission orders awaiting DT approval */}
              {missionOrders.length > 0 && (
                <Card className="border-indigo-200 bg-indigo-50/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-indigo-800 flex items-center gap-2">
                      <Stamp className="h-5 w-5" /> {missionOrders.length} ordre(s) de mission à approuver
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dt/ordres-mission">
                      <Button size="sm" variant="outline" className="text-indigo-700 border-indigo-300">
                        Voir les ordres <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Recent accreditation requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Demandes d'accréditation récentes</CardTitle>
                    <CardDescription>Toutes les demandes en cours et récemment traitées</CardDescription>
                  </div>
                  <Link href="/dt/demandes-accreditation">
                    <Button size="sm" variant="outline">Voir tout <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune demande d'accréditation</p>
                  ) : (
                    <div className="space-y-3">
                      {recentRequests.map(r => {
                        const st = getReqStatus(r.status);
                        return (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">{r.referenceNumber || `Demande #${r.id}`}</p>
                                <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {r.oec?.organizationName || r.oec?.fullName || "—"} · {r.domain || "Domaine ?"} · {r.type || "—"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground ml-2">
                              {r.submissionDate ? new Date(r.submissionDate).toLocaleDateString("fr-FR") :
                               r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dt/demandes-accreditation">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <FileCheck className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Demandes d'accréditation</h3>
                      <p className="text-xs text-muted-foreground mt-1">Vérifier et assigner au CD</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dt/candidatures">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Candidatures OEC</h3>
                      <p className="text-xs text-muted-foreground mt-1">Nouvelles inscriptions</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dt/ordres-mission">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Stamp className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Ordres de mission</h3>
                      <p className="text-xs text-muted-foreground mt-1">Approbation technique</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dt/entretiens-candidats">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <UserCheck className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Entretiens candidats</h3>
                      <p className="text-xs text-muted-foreground mt-1">Évaluateurs</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
