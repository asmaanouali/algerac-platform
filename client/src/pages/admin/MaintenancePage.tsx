import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, Loader2, Calendar, History, CheckCircle2, Clock, AlertTriangle, Plus, Pencil } from "lucide-react";

interface MaintenanceTask {
  id: number;
  scheduledStart: string;
  scheduledEnd?: string;
  taskType?: string;
  impactDescription?: string;
  affectedScope?: string;
  status: string;
  downtimeMinutes?: number;
}

interface Availability {
  availabilityPercent?: number;
  uptimePercent?: number;
  totalDowntimeMinutes?: number;
  totalDowntimeLabel?: string;
  incidentsCount?: number;
  incidents?: number;
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Planifiée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
};

function impactBadge(minutes?: number) {
  if (!minutes || minutes === 0) return { label: "Aucun impact", cls: "bg-green-100 text-green-800" };
  if (minutes <= 30) return { label: "Impact faible", cls: "bg-blue-100 text-blue-800" };
  if (minutes <= 90) return { label: "Impact modéré", cls: "bg-orange-100 text-orange-800" };
  return { label: "Impact majeur", cls: "bg-red-100 text-red-800" };
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MaintenancePage() {
  const { toast } = useToast();
  const [upcoming, setUpcoming] = useState<MaintenanceTask | null>(null);
  const [scheduled, setScheduled] = useState<MaintenanceTask[]>([]);
  const [history, setHistory] = useState<MaintenanceTask[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    scheduledStart: toLocalInput(new Date(Date.now() + 86400000)),
    scheduledEnd: toLocalInput(new Date(Date.now() + 86400000 + 2 * 3600000)),
    taskType: "",
    impactDescription: "",
    affectedScope: "Plateforme complète",
    downtimeMinutes: 60,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [upcomingRes, scheduledRes, historyRes, availRes] = await Promise.allSettled([
        apiRequest("GET", "/api/admin/maintenance/upcoming"),
        apiRequest("GET", "/api/admin/maintenance/scheduled"),
        apiRequest("GET", "/api/admin/maintenance/history"),
        apiRequest("GET", "/api/admin/maintenance/availability"),
      ]);
      if (upcomingRes.status === "fulfilled") {
        const json = await upcomingRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setUpcoming(data && Object.keys(data).length ? data : null);
      }
      if (scheduledRes.status === "fulfilled") {
        const json = await scheduledRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setScheduled(Array.isArray(data) ? data : []);
      }
      if (historyRes.status === "fulfilled") {
        const json = await historyRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setHistory(Array.isArray(data) ? data : []);
      }
      if (availRes.status === "fulfilled") {
        const json = await availRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setAvailability(data || {});
      }
    } catch (err) {
      // keep empty defaults
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.taskType) {
      toast({ variant: "destructive", title: "Erreur", description: "Le type de tâche est requis." });
      return;
    }
    setCreating(true);
    try {
      await apiRequest("POST", "/api/admin/maintenance", form);
      toast({ title: "Maintenance planifiée", description: "La maintenance a été planifiée avec succès." });
      setShowCreate(false);
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de planifier la maintenance" });
    } finally {
      setCreating(false);
    }
  };

  const uptime = availability.uptimePercent ?? availability.availabilityPercent ?? 99.9;
  const incidents = availability.incidents ?? availability.incidentsCount ?? 0;

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary" />
                Planification de Maintenance
              </h1>
              <p className="text-muted-foreground">Planifiez les fenêtres de maintenance et suivez la disponibilité de la plateforme</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Planifier Maintenance
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className={upcoming ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {upcoming ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      Prochaine maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcoming ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-900">{upcoming.taskType}</p>
                        <p className="text-sm text-amber-700">
                          Prévue le {new Date(upcoming.scheduledStart).toLocaleString("fr-FR")}
                          {upcoming.scheduledEnd ? ` — jusqu'au ${new Date(upcoming.scheduledEnd).toLocaleString("fr-FR")}` : ""}
                        </p>
                        {upcoming.impactDescription && <p className="text-sm text-amber-700">{upcoming.impactDescription}</p>}
                        <p className="text-xs text-muted-foreground">Modules affectés : {upcoming.affectedScope || "Toute la plateforme"}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-green-800">Aucune maintenance planifiée prochainement</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Disponibilité (30 jours)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">{uptime}%</span>
                      <span className="text-sm text-muted-foreground">{incidents} incident(s)</span>
                    </div>
                    <Progress value={Math.min(100, Number(uptime))} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Temps d'arrêt total : {availability.totalDowntimeLabel ?? `${availability.totalDowntimeMinutes ?? 0} min`}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="planned" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-2">
                  <TabsTrigger value="planned" className="gap-2"><Calendar className="w-4 h-4" /> Planifiée</TabsTrigger>
                  <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> Historique</TabsTrigger>
                </TabsList>

                <TabsContent value="planned" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Maintenances planifiées</CardTitle>
                      <CardDescription>Fenêtres de maintenance à venir sur la plateforme</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {scheduled.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">Aucune maintenance planifiée</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date & Heure</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Impact</TableHead>
                                <TableHead>Modules Affectés</TableHead>
                                <TableHead className="text-right">Éditer</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scheduled.map((s) => {
                                const impact = impactBadge(s.downtimeMinutes);
                                return (
                                  <TableRow key={s.id}>
                                    <TableCell>{new Date(s.scheduledStart).toLocaleString("fr-FR")}</TableCell>
                                    <TableCell className="font-medium">{s.taskType}</TableCell>
                                    <TableCell><Badge className={impact.cls}>{impact.label}</Badge></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{s.affectedScope || "Toute la plateforme"}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historique des maintenances</CardTitle>
                      <CardDescription>Interventions de maintenance passées</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {history.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">Aucun historique disponible</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date & Heure</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Impact</TableHead>
                                <TableHead>Modules Affectés</TableHead>
                                <TableHead>Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {history.map((h) => {
                                const impact = impactBadge(h.downtimeMinutes);
                                return (
                                  <TableRow key={h.id}>
                                    <TableCell>{new Date(h.scheduledStart).toLocaleString("fr-FR")}</TableCell>
                                    <TableCell className="font-medium">{h.taskType}</TableCell>
                                    <TableCell><Badge className={impact.cls}>{impact.label}</Badge></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{h.affectedScope || "Toute la plateforme"}</TableCell>
                                    <TableCell><Badge className={STATUS_BADGE[h.status] || "bg-gray-100 text-gray-800"}>{STATUS_LABEL[h.status] || h.status}</Badge></TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier une maintenance</DialogTitle>
            <DialogDescription>Définissez la fenêtre de maintenance et son impact sur la plateforme</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="datetime-local" value={form.scheduledEnd} onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type de tâche</Label>
              <Input value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} placeholder="Ex: Mise à jour base de données" />
            </div>
            <div className="space-y-2">
              <Label>Modules affectés</Label>
              <Input value={form.affectedScope} onChange={(e) => setForm({ ...form, affectedScope: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Durée d'interruption estimée (min)</Label>
              <Input type="number" value={form.downtimeMinutes} onChange={(e) => setForm({ ...form, downtimeMinutes: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Description de l'impact</Label>
              <Textarea value={form.impactDescription} onChange={(e) => setForm({ ...form, impactDescription: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Planifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
