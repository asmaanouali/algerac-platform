import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, CalendarCheck, ClipboardList, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function REEDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [teamsRes, missionsRes] = await Promise.all([
        fetch("/api/workflow/teams/my-teams", { credentials: "include" }),
        fetch("/api/workflow/mission-orders/my-orders", { credentials: "include" }),
      ]);
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (missionsRes.ok) setMissions(await missionsRes.json());
    } catch (e) { }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!user) return null;

  const activeMissions = missions.filter((m: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER", "IN_PROGRESS"].includes(m.status));
  const pendingCommitments = teams.filter((t: any) => !t.commitmentSigned);
  const reeTeams = teams.filter((t: any) => t.role === "REE");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <DashboardHeader
            title={t('ree.dashboardTitle')}
            subtitle={`Responsable d'Équipe d'Évaluation — ${user.fullName}`}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Équipes dirigées</p>
                        <p className="text-3xl font-bold">{reeTeams.length}</p>
                      </div>
                      <Users className="w-10 h-10 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Missions actives</p>
                        <p className="text-3xl font-bold">{activeMissions.length}</p>
                      </div>
                      <CalendarCheck className="w-10 h-10 text-blue-500/60" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Engagements en attente</p>
                        <p className="text-3xl font-bold">{pendingCommitments.length}</p>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-amber-500/60" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Terminées</p>
                        <p className="text-3xl font-bold">{missions.filter((m: any) => m.status === "COMPLETED").length}</p>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-green-500/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {pendingCommitments.length > 0 && (
                <Card className="mb-6 border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-800">Actions Requises</CardTitle>
                    <CardDescription>Engagements de confidentialité et d'impartialité à signer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingCommitments.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-lg border mb-2">
                        <div>
                          <p className="font-medium text-sm">Équipe #{t.teamId} — {t.role}</p>
                          <p className="text-xs text-muted-foreground">Engagement non signé</p>
                        </div>
                        <Link href="/ree/engagements">
                          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Signer</Badge>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Mes Équipes</CardTitle></CardHeader>
                  <CardContent>
                    {reeTeams.length > 0 ? reeTeams.map((t: any) => (
                      <div key={t.id} className="p-3 border border-gray-200 rounded-lg mb-2 hover:shadow-sm transition-all hover:border-primary/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Équipe #{t.teamId}</p>
                            <p className="text-xs text-muted-foreground">Rôle: {t.role}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{t.commitmentSigned ? "Engagé" : "En attente"}</Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune équipe assignée</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Accès Rapide</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Mon Planning", href: "/ree/planning", icon: CalendarCheck, desc: "Gérer mes disponibilités" },
                        { label: "Engagements", href: "/ree/engagements", icon: FileText, desc: "Confidentialité et impartialité" },
                        { label: "Revue Documentaire", href: "/ree/revue-documentaire", icon: ClipboardList, desc: "Analyser les documents OEC" },
                        { label: "Évaluation sur Site", href: "/ree/evaluation-site", icon: CheckCircle2, desc: "Checklists, notes et écarts" },
                        { label: "Rédaction Rapports", href: "/ree/rapports", icon: FileText, desc: "Rédiger le rapport FOR 23" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href}>
                          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm">
                            <item.icon className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
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
