import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Search, Plus, Loader2, Mail, MessageSquare, Smartphone, Pencil } from "lucide-react";

interface NotificationRule {
  id: number;
  eventType: string;
  channels: string[];
  recipients?: string;
  delayLabel?: string;
  active: boolean;
}

const CHANNEL_ICONS: Record<string, any> = {
  EMAIL: Mail,
  Email: Mail,
  SMS: Smartphone,
  "In-App": MessageSquare,
  IN_APP: MessageSquare,
};

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-800",
  Email: "bg-blue-100 text-blue-800",
  SMS: "bg-purple-100 text-purple-800",
  "In-App": "bg-green-100 text-green-800",
  IN_APP: "bg-green-100 text-green-800",
};

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form, setForm] = useState({ eventType: "", channels: [] as string[], recipients: "", delayLabel: "Immédiat" });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/notification-rules");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel],
    }));
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    setTogglingId(rule.id);
    try {
      await apiRequest("PATCH", `/api/admin/notification-rules/${rule.id}/toggle`);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de mettre à jour la règle" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.eventType) {
      toast({ variant: "destructive", title: "Erreur", description: "L'événement est requis." });
      return;
    }
    setCreating(true);
    try {
      await apiRequest("POST", "/api/admin/notification-rules", { ...form, active: true });
      toast({ title: "Règle créée", description: `La règle "${form.eventType}" a été créée avec succès.` });
      setShowCreate(false);
      setForm({ eventType: "", channels: [], recipients: "", delayLabel: "Immédiat" });
      fetchRules();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de créer la règle" });
    } finally {
      setCreating(false);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      (r.eventType || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.recipients || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Gestion des Notifications
              </h1>
              <p className="text-muted-foreground">Configurez les règles de notification automatique de la plateforme</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles configurées</p>
                  <p className="text-3xl font-bold">{rules.length}</p>
                </div>
                <Bell className="w-10 h-10 text-primary" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles actives</p>
                  <p className="text-3xl font-bold text-green-600">{rules.filter((r) => r.active).length}</p>
                </div>
                <Mail className="w-10 h-10 text-green-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles inactives</p>
                  <p className="text-3xl font-bold text-slate-400">{rules.filter((r) => !r.active).length}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Règles de notification</CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher une règle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredRules.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucune règle de notification configurée</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Événement</TableHead>
                        <TableHead>Canaux</TableHead>
                        <TableHead>Destinataires</TableHead>
                        <TableHead>Délai</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{rule.eventType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(rule.channels || []).map((c) => {
                                const Icon = CHANNEL_ICONS[c] || Mail;
                                return (
                                  <Badge key={c} className={CHANNEL_COLORS[c] || "bg-gray-100 text-gray-800"}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {c}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{rule.recipients || "—"}</TableCell>
                          <TableCell className="text-sm">{rule.delayLabel || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.active}
                                disabled={togglingId === rule.id}
                                onCheckedChange={() => handleToggleActive(rule)}
                              />
                              <span className="text-sm text-muted-foreground">{rule.active ? "Actif" : "Inactif"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
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
            <DialogTitle>Nouvelle règle de notification</DialogTitle>
            <DialogDescription>Définissez l'événement déclencheur et les canaux d'envoi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Événement déclencheur</Label>
              <Input value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} placeholder="Ex: Dossier Validé" />
            </div>
            <div className="space-y-2">
              <Label>Canaux</Label>
              <div className="flex gap-4">
                {["Email", "SMS", "In-App"].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.channels.includes(c)} onChange={() => toggleChannel(c)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <Input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder="Ex: Direction, Responsable Qualité" />
            </div>
            <div className="space-y-2">
              <Label>Délai</Label>
              <Input value={form.delayLabel} onChange={(e) => setForm({ ...form, delayLabel: e.target.value })} placeholder="Ex: Immédiat, J-7..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Créer la règle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
