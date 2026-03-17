import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, CalendarCheck, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function ExpertDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, missionsRes] = await Promise.all([
        fetch("/api/workflow/teams/my-teams", { credentials: "include" }),
        fetch("/api/workflow/mission-orders/my-orders", { credentials: "include" }),
      ]);
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (missionsRes.ok) setMissions(await missionsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!user) return null;

  const activeMissions = missions.filter((m: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER", "IN_PROGRESS"].includes(m.status));
  const pendingCommitments = teams.filter((t: any) => !t.commitmentSigned);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord Évaluateur</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, {user.fullName} — {user.specialite}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Équipes assignées</p>
                        <p className="text-3xl font-bold">{teams.length}</p>
                      </div>
                      <ClipboardList className="w-10 h-10 text-primary/60" />
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
                        <p className="text-sm text-muted-foreground">Missions terminées</p>
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
                    <div className="space-y-2">
                      {pendingCommitments.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">Équipe #{t.teamId} — Rôle: {t.role}</p>
                            <p className="text-xs text-muted-foreground">Engagement non signé</p>
                          </div>
                          <Link href="/expert/engagements">
                            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
                              Signer
                            </Badge>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Missions en Cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeMissions.length > 0 ? activeMissions.map((m: any) => (
                        <div key={m.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{m.orderNumber || `Mission #${m.id}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.startDate ? `${new Date(m.startDate).toLocaleDateString("fr-FR")} → ${new Date(m.endDate).toLocaleDateString("fr-FR")}` : "Dates à confirmer"}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">{m.status}</Badge>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune mission active</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Accès Rapide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Mon Planning", href: "/expert/planning", icon: CalendarCheck, desc: "Gérer mes disponibilités" },
                        { label: "Mes Engagements", href: "/expert/engagements", icon: FileText, desc: "Confidentialité et impartialité" },
                        { label: "Revue Documentaire", href: "/expert/revue-documentaire", icon: ClipboardList, desc: "Analyser les documents OEC" },
                        { label: "Évaluation sur Site", href: "/expert/evaluation", icon: CheckCircle2, desc: "Checklists et fiches d'écart" },
                        { label: "Rapports", href: "/expert/rapports", icon: FileText, desc: "Rédiger les rapports d'évaluation" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href}>
                          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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
