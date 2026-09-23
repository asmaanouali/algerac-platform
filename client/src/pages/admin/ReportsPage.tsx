import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { BarChart3, Loader2, Printer, Users, FileCheck, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ReportStats {
  dossiersTraites?: number;
  dossiersTrend?: string;
  tempsMoyenJours?: number;
  tempsTrend?: string;
  utilisateursActifs?: number;
  actuellementConnectes?: number;
  moduleUsage?: { name: string; value: number }[];
  apiPerformance?: { day: string; responseTime: number; errors: number }[];
  weeklyActivity?: { day: string; type1: number; type2: number; type3: number }[];
}

const PIE_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const PERIODS = [
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<ReportStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", `/api/admin/reports/stats?period=${period}`);
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setStats(data || {});
    } catch (err) {
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const moduleUsage = stats.moduleUsage || [];
  const apiPerformance = stats.apiPerformance || [];
  const weeklyActivity = stats.weeklyActivity || [];

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Rapports
              </h1>
              <p className="text-muted-foreground">Statistiques et indicateurs clés de performance de la plateforme</p>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dossiers traités</p>
                      <p className="text-2xl font-bold">{stats.dossiersTraites ?? 0}</p>
                      {stats.dossiersTrend && <p className="text-xs text-green-600">{stats.dossiersTrend}</p>}
                    </div>
                    <FileCheck className="w-10 h-10 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Temps moyen (jours)</p>
                      <p className="text-2xl font-bold">{stats.tempsMoyenJours ?? 0}</p>
                      {stats.tempsTrend && <p className="text-xs text-green-600">{stats.tempsTrend}</p>}
                    </div>
                    <Clock className="w-10 h-10 text-amber-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                      <p className="text-2xl font-bold">{stats.utilisateursActifs ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{stats.actuellementConnectes ?? 0} connectés</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Utilisation par module</CardTitle></CardHeader>
                  <CardContent>
                    {moduleUsage.length === 0 ? (
                      <p className="text-center py-16 text-muted-foreground">Aucune donnée disponible</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={moduleUsage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {moduleUsage.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Performance API</CardTitle></CardHeader>
                  <CardContent>
                    {apiPerformance.length === 0 ? (
                      <p className="text-center py-16 text-muted-foreground">Aucune donnée disponible</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={apiPerformance}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="responseTime" name="Temps de réponse (ms)" stroke="#16a34a" strokeWidth={2} />
                          <Line type="monotone" dataKey="errors" name="Erreurs" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Activité hebdomadaire</CardTitle></CardHeader>
                <CardContent>
                  {weeklyActivity.length === 0 ? (
                    <p className="text-center py-16 text-muted-foreground">Aucune donnée disponible</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="type1" name="Demandes" stackId="a" fill="#16a34a" />
                        <Bar dataKey="type2" name="Évaluations" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="type3" name="Décisions" stackId="a" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
