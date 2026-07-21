import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquareWarning, Clock, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, Users, ShieldCheck,
} from "lucide-react";

interface Complaint {
  id: number;
  trackingCode: string;
  subject: string;
  status: string;
  category?: string;
  createdAt: string;
  investigationDeadline?: string;
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Reçue",
  UNDER_REVIEW: "En examen",
  ASSIGNED: "Assignée",
  INVESTIGATION: "En investigation",
  PENDING_DECISION: "Décision en attente",
  RESOLVED: "Résolue",
  REJECTED: "Rejetée",
  CLOSED: "Clôturée",
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  INVESTIGATION: "bg-purple-100 text-purple-700",
  PENDING_DECISION: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-slate-100 text-slate-700",
  CLOSED: "bg-slate-100 text-slate-700",
};

export default function RQDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await apiRequest("GET", "/api/complaints/all");
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const open = complaints.filter(c => !["RESOLVED", "REJECTED", "CLOSED"].includes(c.status));
  const newReceived = complaints.filter(c => c.status === "RECEIVED");
  const inInvestigation = complaints.filter(c => ["ASSIGNED", "INVESTIGATION", "PENDING_DECISION"].includes(c.status));
  const resolved = complaints.filter(c => c.status === "RESOLVED" || c.status === "CLOSED");

  const overdue = open.filter(c => {
    if (!c.investigationDeadline) return false;
    return new Date(c.investigationDeadline) < new Date();
  });

  const recent = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <DashboardHeader
            title={<span className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> {t('complaints.rq.title', { defaultValue: 'Gestion des Plaintes' })}</span>}
            subtitle={`${user?.fullName ? `${user.fullName} — ` : ""}${t('complaints.rq.subtitle', { defaultValue: "Tableau de bord du Responsable Qualité — FOR 50 / FOR 02-1" })}`}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Nouvelles plaintes"
                  value={newReceived.length}
                  icon={MessageSquareWarning}
                  description="À examiner"
                  className={newReceived.length > 0 ? "border-l-amber-500" : ""}
                />
                <StatCard
                  title="En investigation"
                  value={inInvestigation.length}
                  icon={Clock}
                  description="En cours de traitement"
                  className="border-l-blue-500"
                />
                <StatCard
                  title="Hors délai"
                  value={overdue.length}
                  icon={AlertCircle}
                  description="Délai d'investigation dépassé"
                  className={overdue.length > 0 ? "border-l-red-500" : ""}
                />
                <StatCard
                  title="Résolues"
                  value={resolved.length}
                  icon={CheckCircle2}
                  description="Plaintes clôturées"
                  className="border-l-emerald-500"
                />
              </div>

              {newReceived.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" /> {newReceived.length} plainte(s) en attente d'examen
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Affectez chaque plainte à un investigateur (FOR 50).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {newReceived.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{c.trackingCode} — {c.subject}</p>
                          <p className="text-xs text-amber-700">{c.category || "Catégorie non précisée"}</p>
                        </div>
                        <Link href="/rq/plaintes">
                          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 ml-2">
                            Traiter <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Plaintes récentes</CardTitle>
                    <CardDescription>Dernières plaintes reçues, tous statuts confondus</CardDescription>
                  </div>
                  <Link href="/rq/plaintes">
                    <Button size="sm" variant="outline">Voir tout <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recent.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune plainte enregistrée</p>
                  ) : (
                    <div className="space-y-3">
                      {recent.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{c.trackingCode}</p>
                              <Badge className={`${STATUS_COLORS[c.status] || "bg-slate-100 text-slate-700"} text-xs`}>
                                {STATUS_LABELS[c.status] || c.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{c.subject}</p>
                          </div>
                          <p className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/rq/plaintes">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Gestion des plaintes</h3>
                      <p className="text-xs text-muted-foreground mt-1">Examiner, assigner et statuer</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/rq/entretiens-candidats">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Entretiens candidats</h3>
                      <p className="text-xs text-muted-foreground mt-1">Évaluation des évaluateurs</p>
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
