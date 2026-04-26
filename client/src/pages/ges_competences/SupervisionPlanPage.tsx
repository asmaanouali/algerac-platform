import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Plan {
  id: number;
  planYear: number;
  evaluator: { id: number; fullName: string };
  supervisor?: { id: number; fullName: string };
  qualification?: { id: number; qualifiedRole: string };
  supervisedRole?: string;
  plannedDate?: string;
  completedDate?: string;
  status: string;
  notes?: string;
}
interface User { id: number; fullName: string; email: string; }
interface Qualification {
  id: number;
  evaluator: { id: number; fullName: string };
  qualifiedRole: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  MISSED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-slate-100 text-slate-800",
};

export default function SupervisionPlanPage() {
  const { toast } = useToast();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [plans, setPlans] = useState<Plan[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Plan triennal de supervision (FOR 65-7) | ALGERAC";
    fetchAll();
  }, [year]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, sgRes] = await Promise.all([
        fetch(`/api/competency/supervision-plans?year=${year}`, { credentials: "include" }),
        fetch("/api/competency/supervisors", { credentials: "include" }),
        fetch("/api/competency/supervision-plans/suggestions", { credentials: "include" }),
      ]);
      if (pRes.ok) setPlans(await pRes.json());
      if (sRes.ok) setSupervisors(await sRes.json());
      if (sgRes.ok) setSuggestions(await sgRes.json());
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    const payload = {
      evaluatorId: form.evaluatorId,
      supervisorId: form.supervisorId || undefined,
      qualificationId: form.qualificationId || undefined,
      supervisedRole: form.supervisedRole,
      plannedDate: form.plannedDate,
      planYear: year,
      notes: form.notes,
    };
    const res = await fetch("/api/competency/supervision-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast({ title: "Plan créé" });
      setCreateOpen(false);
      setForm({});
      fetchAll();
    } else {
      const err = await res.json();
      toast({ title: "Erreur", description: err.error, variant: "destructive" });
    }
  };

  const stats = useMemo(() => ({
    total: plans.length,
    planned: plans.filter((p) => p.status === "PLANNED").length,
    completed: plans.filter((p) => p.status === "COMPLETED").length,
    missed: plans.filter((p) => p.status === "MISSED").length,
  }), [plans]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-blue-600" /> Plan triennal de supervision (FOR 65-7)
              </h1>
              <p className="text-sm text-slate-500 mt-1">PRO 06 §5.5 — chaque évaluateur supervisé ≥1×/3 ans</p>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const y = new Date().getFullYear() - 2 + i;
                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
              <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouveau plan</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: stats.total, color: "text-slate-700" },
              { label: "Planifiées", value: stats.planned, color: "text-blue-700" },
              { label: "Terminées", value: stats.completed, color: "text-emerald-700" },
              { label: "Manquées", value: stats.missed, color: "text-red-700" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="plans">
            <TabsList>
              <TabsTrigger value="plans">Plans {year}</TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({suggestions.length})
                {suggestions.length > 0 && <AlertTriangle className="h-3 w-3 ml-1 text-amber-600" />}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plans">
              <Card>
                <CardContent className="pt-6">
                  {loading ? <p>Chargement…</p> : plans.length === 0 ? (
                    <p className="text-center py-8 text-slate-500">Aucune supervision planifiée pour {year}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Évaluateur</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Superviseur</TableHead>
                          <TableHead>Date prévue</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date réalisation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.evaluator.fullName}</TableCell>
                            <TableCell><Badge variant="outline">{p.supervisedRole || "—"}</Badge></TableCell>
                            <TableCell>{p.supervisor?.fullName || <span className="text-slate-400">non assigné</span>}</TableCell>
                            <TableCell>{p.plannedDate || "—"}</TableCell>
                            <TableCell><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></TableCell>
                            <TableCell>{p.completedDate ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{p.completedDate}</span> : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <CardTitle>Évaluateurs non supervisés depuis &gt; 2 ans</CardTitle>
                  <CardDescription>Le système suggère ces évaluateurs pour planification immédiate.</CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-emerald-600">Tous les évaluateurs sont à jour.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Évaluateur</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.evaluator.fullName}</TableCell>
                            <TableCell><Badge>{q.qualifiedRole}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => {
                                setForm({ evaluatorId: q.evaluator.id.toString(), qualificationId: q.id.toString(), supervisedRole: q.qualifiedRole });
                                setCreateOpen(true);
                              }}>Planifier</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle supervision (FOR 65-7)</DialogTitle>
            <DialogDescription>Année {year}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ID Évaluateur</Label>
              <Input value={form.evaluatorId || ""} onChange={(e) => setForm({ ...form, evaluatorId: e.target.value })} />
            </div>
            <div>
              <Label>Superviseur</Label>
              <Select value={form.supervisorId || ""} onValueChange={(v) => setForm({ ...form, supervisorId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {supervisors.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rôle évalué</Label>
              <Select value={form.supervisedRole || ""} onValueChange={(v) => setForm({ ...form, supervisedRole: v })}>
                <SelectTrigger><SelectValue placeholder="REE/ET/EQ/EXP" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REE">REE</SelectItem>
                  <SelectItem value="ET">ET</SelectItem>
                  <SelectItem value="EQ">EQ</SelectItem>
                  <SelectItem value="EXP">EXP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date prévue</Label>
              <Input type="date" value={form.plannedDate || ""} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={createPlan}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
