import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, CalendarCheck, FileText, AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "wouter";

export default function EQDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [teamsRes, missionsRes] = await Promise.all([
        fetch("/api/workflow/teams/my-teams", { credentials: "include" }),
        fetch("/api/workflow/mission-orders/my-orders", { credentials: "include" }),
      ]);
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (missionsRes.ok) setMissions(await missionsRes.json());
    } catch (e) { }
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
            <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord Évaluateur Qualité</h1>
            <p className="text-muted-foreground mt-1">
              {user.fullName} — Spécialité: {user.specialite || "Système de management qualité"}
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
                      <ShieldCheck className="w-10 h-10 text-primary/60" />
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
                  </CardHeader>
                  <CardContent>
                    {pendingCommitments.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-lg border mb-2">
                        <div>
                          <p className="font-medium text-sm">Équipe #{t.teamId}</p>
                          <p className="text-xs text-muted-foreground">Engagement de confidentialité à signer</p>
                        </div>
                        <Link href="/eq/engagements">
                          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Signer</Badge>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg">Accès Rapide</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: "Mon Planning", href: "/eq/planning", icon: CalendarCheck, desc: "Gérer mes disponibilités" },
                      { label: "Engagements", href: "/eq/engagements", icon: FileText, desc: "Confidentialité et impartialité" },
                      { label: "Revue Documentaire", href: "/eq/revue-documentaire", icon: ClipboardList, desc: "Analyser le système qualité" },
                      { label: "Évaluation sur Site", href: "/eq/evaluation", icon: CheckCircle2, desc: "Évaluation du SMQ sur site" },
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
