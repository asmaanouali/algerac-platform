import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, CalendarDays, ClipboardList, AlertTriangle, ArrowRight } from "lucide-react";

interface Plan {
  id: number;
  evaluator: { fullName: string };
  supervisedRole?: string;
  plannedDate?: string;
  status: string;
}

export default function SupDashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    document.title = "Dashboard Superviseur | ALGERAC";
    fetch("/api/competency/supervision-plans/my", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPlans);
  }, []);

  const upcoming = plans.filter((p) => p.status === "PLANNED" || p.status === "ASSIGNED");
  const completed = plans.filter((p) => p.status === "COMPLETED");
  const missed = plans.filter((p) => p.status === "MISSED");

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> Espace Superviseur
            </h1>
            <p className="text-sm text-slate-500 mt-1">Bonjour {user?.fullName}, voici votre activité de supervision (PRO 06 §5.5).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-500">Supervisions à venir</p>
                    <p className="text-2xl font-bold">{upcoming.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-500">Réalisées</p>
                    <p className="text-2xl font-bold">{completed.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm text-slate-500">Manquées</p>
                    <p className="text-2xl font-bold">{missed.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prochaines supervisions</span>
                <Link href="/sup/my-plan">
                  <Button variant="ghost" size="sm">Voir tout <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Aucune supervision planifiée.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{p.evaluator.fullName}</p>
                        <p className="text-xs text-slate-500">Rôle: {p.supervisedRole} · Date prévue: {p.plannedDate || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{p.status}</Badge>
                        <Link href={`/sup/supervision/${p.id}`}>
                          <Button size="sm" variant="outline">Remplir fiche</Button>
                        </Link>
                      </div>
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
