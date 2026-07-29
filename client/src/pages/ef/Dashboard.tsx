import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, CalendarCheck, ClipboardList, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Qualification {
  id: number;
  qualifiedRole: string;
  status: string;
  observerMissionsCompleted: number;
  supervisedMissionsCompleted: number;
}

export default function EFDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Espace Évaluateur en Formation | ALGERAC";
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [teamsRes, missionsRes, qualRes] = await Promise.all([
        fetch("/api/workflow/teams/my-teams", { credentials: "include" }),
        fetch("/api/workflow/mission-orders/my-orders", { credentials: "include" }),
        user?.id
          ? fetch(`/api/qualifications/evaluator/${user.id}`, { credentials: "include" })
          : Promise.resolve(null),
      ]);
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (missionsRes.ok) setMissions(await missionsRes.json());
      if (qualRes && qualRes.ok) setQualifications(await qualRes.json());
    } catch {
      // keep previous state on failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!user) return null;

  const activeMissions = missions.filter((m: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER", "IN_PROGRESS"].includes(m.status));
  const pendingCommitments = teams.filter((t: any) => !t.commitmentSigned);
  const activeQualification = qualifications.find((q) => !["QUALIFIED", "RENEWED"].includes(q.status)) || qualifications[0];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <DashboardHeader
            title={<span className="flex items-center gap-2"><GraduationCap className="h-6 w-6 text-indigo-600" /> Espace Évaluateur en Formation</span>}
            subtitle={`Bonjour ${user.fullName}, voici votre parcours de qualification et vos missions d'observation (PRO 06 §5.3).`}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {activeQualification && (
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Ma qualification en cours</CardTitle>
                    <CardDescription>
                      Rôle visé : {activeQualification.qualifiedRole} — Statut : <Badge variant="outline" className="ml-1">{activeQualification.status}</Badge>
                    </CardDescription>
                  </div>
                  <Link href="/exp/qualification">
                    <Button variant="outline" size="sm">Voir mon parcours <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Missions d'observation réalisées</p>
                    <p className="text-xl font-bold">{activeQualification.observerMissionsCompleted ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Missions supervisées réalisées</p>
                    <p className="text-xl font-bold">{activeQualification.supervisedMissionsCompleted ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-8 w-8 text-primary/60" />
                  <div>
                    <p className="text-sm text-slate-500">Équipes assignées</p>
                    <p className="text-2xl font-bold">{teams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-500">Missions actives</p>
                    <p className="text-2xl font-bold">{activeMissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-500">Missions terminées</p>
                    <p className="text-2xl font-bold">{missions.filter((m: any) => m.status === "COMPLETED").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {pendingCommitments.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Actions requises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingCommitments.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">Équipe #{t.teamId}</p>
                        <p className="text-xs text-slate-500">Engagement de confidentialité à signer</p>
                      </div>
                      <Badge variant="outline">À signer</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Missions d'observation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMissions.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Aucune mission active pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {activeMissions.slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{m.orderNumber || `Mission #${m.id}`}</p>
                        <p className="text-xs text-slate-500">
                          {m.startDate ? `${new Date(m.startDate).toLocaleDateString("fr-FR")} → ${new Date(m.endDate).toLocaleDateString("fr-FR")}` : "Dates à confirmer"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
