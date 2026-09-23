import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LifeBuoy, Search, Plus, Loader2, Clock, CheckCircle2, Smile, Users, Eye } from "lucide-react";

interface SupportStats {
  ouverts?: number;
  enCours?: number;
  resolus?: number;
  satisfactionMoyenne?: number;
  openTickets?: number;
  inProgressTickets?: number;
  resolvedTickets?: number;
  satisfaction?: number;
  avgResolutionHours?: number;
  total?: number;
}

interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  assignedTo?: string;
  description?: string;
  createdAt: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  HAUTE: "bg-red-100 text-red-800",
  MOYENNE: "bg-orange-100 text-orange-800",
  BASSE: "bg-slate-100 text-slate-600",
};

const STATUS_BADGE: Record<string, string> = {
  OUVERT: "bg-orange-100 text-orange-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  RESOLU: "bg-green-100 text-green-800",
};

const STATUS_LABEL: Record<string, string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}

export default function SupportTechniquePage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SupportStats>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "MOYENNE", assignedTo: "", description: "" });

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/support/stats");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setStats(data || {});
    } catch (err) {
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/support/tickets");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title) {
      toast({ variant: "destructive", title: "Erreur", description: "Le titre du ticket est requis." });
      return;
    }
    setCreating(true);
    try {
      await apiRequest("POST", "/api/admin/support/tickets", { ...form, status: "OUVERT" });
      toast({ title: "Ticket créé", description: `Le ticket "${form.title}" a été créé avec succès.` });
      setShowCreate(false);
      setForm({ title: "", priority: "MOYENNE", assignedTo: "", description: "" });
      fetchTickets();
      fetchStats();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de créer le ticket" });
    } finally {
      setCreating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.ticketNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTickets = stats.openTickets ?? stats.ouverts ?? 0;
  const inProgressTickets = stats.inProgressTickets ?? stats.enCours ?? 0;
  const resolvedTickets = stats.resolvedTickets ?? stats.resolus ?? 0;
  const satisfaction = stats.satisfaction ?? stats.satisfactionMoyenne ?? 0;

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-6 h-6 text-primary" />
                Gestion du Support Technique
              </h1>
              <p className="text-muted-foreground">Suivez et traitez les tickets de support des organismes et utilisateurs de la plateforme</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Ticket
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Ouverts</p>
                    <p className="text-2xl font-bold text-orange-600">{openTickets}</p>
                  </div>
                  <LifeBuoy className="w-10 h-10 text-orange-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En Cours</p>
                    <p className="text-2xl font-bold text-blue-600">{inProgressTickets}</p>
                  </div>
                  <Clock className="w-10 h-10 text-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Résolus (Mois)</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedTickets}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">{satisfaction}/5</p>
                  </div>
                  <Smile className="w-10 h-10 text-primary" />
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Tickets de support</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les statuts</SelectItem>
                      <SelectItem value="OUVERT">Ouverts</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="RESOLU">Résolus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredTickets.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucun ticket de support</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Assigné à</TableHead>
                        <TableHead>Créé</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.ticketNumber}</TableCell>
                          <TableCell>{t.title}</TableCell>
                          <TableCell><Badge className={PRIORITY_BADGE[t.priority] || "bg-gray-100 text-gray-800"}>{t.priority}</Badge></TableCell>
                          <TableCell><Badge className={STATUS_BADGE[t.status] || "bg-gray-100 text-gray-800"}>{STATUS_LABEL[t.status] || t.status}</Badge></TableCell>
                          <TableCell className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-muted-foreground" /> {t.assignedTo || "Non assigné"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{timeAgo(t.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" /> Voir</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau ticket de support</DialogTitle>
            <DialogDescription>Créez un nouveau ticket pour une demande d'assistance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASSE">Basse</SelectItem>
                    <SelectItem value="MOYENNE">Moyenne</SelectItem>
                    <SelectItem value="HAUTE">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Ex: Support Niveau 1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Créer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
