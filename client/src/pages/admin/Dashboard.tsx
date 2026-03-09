import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Users, FileText, ShieldCheck, Building2, AlertCircle, UserPlus, ClipboardList, Loader2, ArrowRight, Activity } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  oecCount: number;
  expertCount: number;
  raCount: number;
  pendingOecAccounts: number;
  totalRequests: number;
  activeRequests: number;
}

interface RecentRequest {
  id: number;
  referenceNumber: string | null;
  type: string;
  domain: string;
  status: string;
  progress: number;
  oec: { organizationName: string } | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, oecCount: 0, expertCount: 0, raCount: 0, pendingOecAccounts: 0, totalRequests: 0, activeRequests: 0 });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, oecAppsRes, requestsRes] = await Promise.all([
        apiRequest("GET", "/api/users"),
        apiRequest("GET", "/api/oec-applications/approved-for-admin"),
        apiRequest("GET", "/api/requests"),
      ]);
      const users = await usersRes.json();
      const pendingOec = await oecAppsRes.json();
      const requests = await requestsRes.json();

      const allUsers = Array.isArray(users) ? users : [];
      const allRequests = Array.isArray(requests) ? requests : [];

      setStats({
        totalUsers: allUsers.length,
        oecCount: allUsers.filter((u: any) => u.role === "OEC").length,
        expertCount: allUsers.filter((u: any) => ["EXPERT", "EVALUATEUR", "FORMATEUR", "ET", "EQ", "REE"].includes(u.role)).length,
        raCount: allUsers.filter((u: any) => u.role === "RA").length,
        pendingOecAccounts: Array.isArray(pendingOec) ? pendingOec.length : 0,
        totalRequests: allRequests.length,
        activeRequests: allRequests.filter((r: any) => r.status !== "DRAFT" && r.status !== "CLOSED" && r.status !== "WITHDRAWN").length,
      });
      setRecentRequests(allRequests.slice(0, 5));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données" });
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "Brouillon", SUBMITTED: "Soumise", PAYMENT_COMPLETED: "Paiement effectué",
      ASSIGNED_TO_RA: "Assignée au RA", RECEIVABILITY_STUDY: "Étude recevabilité",
      RECEIVABLE: "Recevable", ACTIVE: "Active", CLOSED: "Classée",
    };
    return map[status] || status.replace(/_/g, " ");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord Administrateur</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble du système et des activités récentes.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Utilisateurs" value={stats.totalUsers} icon={Users} description={`${stats.oecCount} OEC · ${stats.expertCount} experts · ${stats.raCount} RA`} />
                <StatCard title="Demandes Actives" value={stats.activeRequests} icon={FileText} description={`${stats.totalRequests} total`} />
                <StatCard title="Comptes OEC en attente" value={stats.pendingOecAccounts} icon={UserPlus} description="Paiement vérifié, à créer" className={stats.pendingOecAccounts > 0 ? "border-l-amber-500" : ""} />
                <StatCard title="OEC Accrédités" value={stats.oecCount} icon={ShieldCheck} description="Comptes OEC actifs" />
              </div>

              {/* Alerts */}
              {stats.pendingOecAccounts > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-800">{stats.pendingOecAccounts} compte(s) OEC en attente de création</p>
                        <p className="text-sm text-amber-600">Le paiement a été vérifié par le DAG</p>
                      </div>
                    </div>
                    <Link href="/users">
                      <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                        Gérer <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Demandes Récentes</CardTitle>
                    <CardDescription>Les 5 dernières demandes d'accréditation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentRequests.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">Aucune demande pour le moment</p>
                    ) : (
                      <div className="space-y-3">
                        {recentRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{req.referenceNumber || `#${req.id}`}</p>
                              <p className="text-xs text-muted-foreground">{req.oec?.organizationName || "—"} · {req.domain}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{statusLabel(req.status)}</Badge>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${req.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Link href="/users">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium">Gestion des Utilisateurs</p>
                          <p className="text-xs text-muted-foreground">Créer, modifier ou désactiver des comptes</p>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/users">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        <div className="text-left">
                          <p className="font-medium">Comptes OEC</p>
                          <p className="text-xs text-muted-foreground">Créer les comptes OEC vérifiés par le DAG</p>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/complaints/internal">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                        <ClipboardList className="h-5 w-5 text-red-600" />
                        <div className="text-left">
                          <p className="font-medium">Plaintes</p>
                          <p className="text-xs text-muted-foreground">Consulter les plaintes internes</p>
                        </div>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
