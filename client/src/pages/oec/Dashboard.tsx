import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { StatCard } from "@/components/stat-card";
import { FilePlus, Files, FileText, ShieldCheck, ArrowRight, Loader2, Clock, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface MyRequest {
  id: number;
  referenceNumber: string | null;
  type: string;
  domain: string;
  status: string;
  progress: number;
  currentPhase: string | null;
  currentStep: string | null;
  nextAction: string | null;
  pendingWith: string | null;
  submissionDate: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
  SUBMITTED: { label: "Soumise", color: "bg-blue-100 text-blue-700" },
  AWAITING_REGISTRATION_FEE: { label: "En attente frais", color: "bg-amber-100 text-amber-700" },
  PENDING_PAYMENT: { label: "Paiement requis", color: "bg-amber-100 text-amber-700" },
  PAYMENT_COMPLETED: { label: "Paiement validé", color: "bg-green-100 text-green-700" },
  ASSIGNED_TO_RA: { label: "Assignée", color: "bg-blue-100 text-blue-700" },
  RECEIVABILITY_STUDY: { label: "Étude recevabilité", color: "bg-indigo-100 text-indigo-700" },
  RECEIVABLE: { label: "Recevable", color: "bg-emerald-100 text-emerald-700" },
  NOT_RECEIVABLE: { label: "Non recevable", color: "bg-red-100 text-red-700" },
  QUOTATION_SENT_TO_OEC: { label: "Devis à valider", color: "bg-amber-100 text-amber-700" },
  TEAM_SENT_TO_OEC: { label: "Équipe à valider", color: "bg-amber-100 text-amber-700" },
  EVALUATION_IN_PROGRESS: { label: "Évaluation en cours", color: "bg-purple-100 text-purple-700" },
  CAS_DECISION_GRANT: { label: "Accréditation accordée", color: "bg-emerald-100 text-emerald-700" },
  CERTIFICATE_ISSUED: { label: "Certificat délivré", color: "bg-emerald-100 text-emerald-700" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-800 font-semibold" },
};

export default function OECDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await apiRequest("GET", "/api/requests/my-requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (status: string) => statusConfig[status] || { label: status.replace(/_/g, " "), color: "bg-slate-100 text-slate-700" };

  const activeRequests = requests.filter(r => r.status !== "DRAFT" && r.status !== "CLOSED" && r.status !== "WITHDRAWN");
  const pendingAction = requests.filter(r => r.pendingWith === "OEC");
  const certifiedCount = requests.filter(r => r.status === "ACTIVE" || r.status === "CERTIFICATE_ISSUED").length;

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Bienvenue, {user?.organizationName || user?.fullName}</h1>
            <p className="text-muted-foreground mt-1">Tableau de bord de votre organisme d'évaluation de la conformité.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Mes Demandes" value={requests.length} icon={Files} description={`${activeRequests.length} en cours`} />
                <StatCard title="Actions Requises" value={pendingAction.length} icon={AlertCircle} description="En attente de votre part" className={pendingAction.length > 0 ? "border-l-amber-500" : ""} />
                <StatCard title="Accréditations" value={certifiedCount} icon={ShieldCheck} description="Certificats actifs" className={certifiedCount > 0 ? "border-l-emerald-500" : ""} />
                <StatCard title="Progression Moyenne" value={activeRequests.length > 0 ? `${Math.round(activeRequests.reduce((s, r) => s + r.progress, 0) / activeRequests.length)}%` : "—"} icon={Clock} description="Sur les demandes actives" />
              </div>

              {/* Alerts */}
              {pendingAction.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" /> Actions Requises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingAction.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                        <div>
                          <p className="font-medium text-sm">{req.referenceNumber || `Demande #${req.id}`}</p>
                          <p className="text-xs text-amber-700">{req.nextAction || getStatus(req.status).label}</p>
                        </div>
                        <Link href={`/oec/demandes/${req.id}`}>
                          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300">
                            Voir <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Requests List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mes Demandes</CardTitle>
                    <CardDescription>Suivi de vos dossiers d'accréditation</CardDescription>
                  </div>
                  <Link href="/requests/new">
                    <Button size="sm"><FilePlus className="h-4 w-4 mr-1" /> Nouvelle Demande</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <div>
                        <p className="font-medium">Aucune demande</p>
                        <p className="text-sm text-muted-foreground">Commencez par créer votre première demande d'accréditation</p>
                      </div>
                      <Link href="/requests/new">
                        <Button className="mt-2"><FilePlus className="h-4 w-4 mr-1" /> Créer une demande</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => {
                        const st = getStatus(req.status);
                        return (
                          <Link key={req.id} href={`/oec/demandes/${req.id}`}>
                            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{req.referenceNumber || `Demande #${req.id}`}</p>
                                  <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{req.domain} · {req.type === "INITIAL" ? "Initiale" : req.type === "EXTENSION" ? "Extension" : req.type === "RENOUVELLEMENT" ? "Renouvellement" : req.type}</p>
                                {req.currentStep && <p className="text-xs text-blue-600">{req.currentStep}</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="w-20 bg-slate-100 rounded-full h-2">
                                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${req.progress}%` }} />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{req.progress}%</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/requests/new">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <FilePlus className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Nouvelle Demande</h3>
                      <p className="text-xs text-muted-foreground mt-1">Initier une demande d'accréditation</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/oec/paiements">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <CreditCard className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                      <h3 className="font-semibold">Paiements</h3>
                      <p className="text-xs text-muted-foreground mt-1">Gérer vos paiements en cours</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/oec/mes-demandes">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold">Suivi des Demandes</h3>
                      <p className="text-xs text-muted-foreground mt-1">Voir toutes vos demandes en détail</p>
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
