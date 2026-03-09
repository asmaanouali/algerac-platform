import { Sidebar } from "@/components/layout-sidebar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Users, FileCheck, Clock, UserCheck, AlertCircle, Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_DT: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  APPROVED_BY_DT: { label: "Approuvée", color: "bg-green-100 text-green-700" },
  REJECTED_BY_DT: { label: "Rejetée", color: "bg-red-100 text-red-700" },
  AWAITING_DAG_FEE: { label: "En attente DAG", color: "bg-blue-100 text-blue-700" },
  FEE_SET_AWAITING_PAYMENT: { label: "Paiement en attente", color: "bg-indigo-100 text-indigo-700" },
  PAYMENT_VERIFIED: { label: "Paiement vérifié", color: "bg-emerald-100 text-emerald-700" },
  ACCOUNT_CREATED: { label: "Compte créé", color: "bg-green-100 text-green-800" },
};

export default function DTDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState<OECApplication[]>([]);
  const [allApps, setAllApps] = useState<OECApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        apiRequest("GET", "/api/oec-applications/pending"),
        apiRequest("GET", "/api/oec-applications/all"),
      ]);
      const pendingData = await pendingRes.json();
      const allData = await allRes.json();
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setAllApps(Array.isArray(allData) ? allData : []);
    } catch {
      setPending([]);
      setAllApps([]);
    } finally {
      setLoading(false);
    }
  };

  const approvedCount = allApps.filter(a => a.status !== "PENDING_DT" && a.status !== "REJECTED_BY_DT").length;
  const rejectedCount = allApps.filter(a => a.status === "REJECTED_BY_DT").length;
  const accountCreatedCount = allApps.filter(a => a.status === "ACCOUNT_CREATED").length;

  const getStatus = (status: string) => statusConfig[status] || { label: status.replace(/_/g, " "), color: "bg-slate-100 text-slate-700" };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord Technique</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble des candidatures OEC et de l'activité technique.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Candidatures en Attente" value={pending.length} icon={Clock} description="À examiner" className={pending.length > 0 ? "border-l-amber-500" : ""} />
                <StatCard title="Approuvées" value={approvedCount} icon={CheckCircle2} description="Candidatures validées" className="border-l-emerald-500" />
                <StatCard title="Rejetées" value={rejectedCount} icon={XCircle} description="Candidatures refusées" className="border-l-red-500" />
                <StatCard title="Comptes Actifs" value={accountCreatedCount} icon={UserCheck} description="OEC avec compte créé" className="border-l-blue-500" />
              </div>

              {/* Pending alert */}
              {pending.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" /> {pending.length} candidature(s) en attente de validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pending.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                        <div>
                          <p className="font-medium text-sm">{app.nomOrganisme}</p>
                          <p className="text-xs text-amber-700">{app.typeOrganisme} · {app.nomRepresentant}</p>
                        </div>
                        <Link href="/dt/candidatures">
                          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300">
                            Examiner <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent applications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Dernières Candidatures</CardTitle>
                    <CardDescription>Historique des candidatures OEC traitées</CardDescription>
                  </div>
                  <Link href="/dt/candidatures">
                    <Button size="sm" variant="outline">Voir tout <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {allApps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune candidature pour le moment</p>
                  ) : (
                    <div className="space-y-3">
                      {allApps.slice(0, 8).map(app => {
                        const st = getStatus(app.status);
                        return (
                          <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{app.nomOrganisme}</p>
                                <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {app.typeOrganisme} · {app.nomRepresentant} · {app.typeDemande || "initiale"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/dt/candidatures">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Voir les Candidatures</h3>
                      <p className="text-xs text-muted-foreground mt-1">Gérer les nouvelles demandes</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dt/experts">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <UserCheck className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Experts Certifiés</h3>
                      <p className="text-xs text-muted-foreground mt-1">Liste des experts actifs</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dt/rapports">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <FileCheck className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Rapports</h3>
                      <p className="text-xs text-muted-foreground mt-1">Statistiques et analyses</p>
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
