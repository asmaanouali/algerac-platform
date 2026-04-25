import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Users, Plus, Pencil, Trash2, Loader2, ShieldCheck } from "lucide-react";

interface Domain { value: string; label: string; }
interface User { id: number; fullName: string; email: string; role: string; }
interface Committee {
  id: number; domain: string; domainLabel: string; name: string;
  presidentId: number | null; presidentName: string | null;
  vicePresidentId: number | null; vicePresidentName: string | null;
  members: User[]; memberCount: number; active: boolean;
}

/**
 * PRO 07 §5.1 — Committee composition management.
 * Allows admin/CD to create one committee per accreditation domain,
 * assign president, vice-president, and up to 5 members total.
 */
export default function CommitteeManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [casUsers, setCasUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    domain: "", name: "", presidentId: "", vicePresidentId: "", memberIds: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [commRes, domRes, userRes] = await Promise.all([
        fetch("/api/cas-committees", { credentials: "include" }),
        fetch("/api/cas-committees/domains", { credentials: "include" }),
        fetch("/api/users?roles=CAS_MEMBER,CAS_PRESIDENT", { credentials: "include" }),
      ]);
      if (commRes.ok) setCommittees(await commRes.json());
      if (domRes.ok) setDomains(await domRes.json());
      if (userRes.ok) {
        const data = await userRes.json();
        setCasUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch { }
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(c: Committee) {
    setEditingId(c.id);
    setForm({
      domain: c.domain,
      name: c.name,
      presidentId: c.presidentId ? String(c.presidentId) : "",
      vicePresidentId: c.vicePresidentId ? String(c.vicePresidentId) : "",
      memberIds: c.members.map(m => String(m.id)),
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.domain) { toast({ title: "Domaine requis", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const payload = {
        domain: form.domain,
        name: form.name || domains.find(d => d.value === form.domain)?.label,
        presidentId: form.presidentId ? Number(form.presidentId) : null,
        vicePresidentId: form.vicePresidentId ? Number(form.vicePresidentId) : null,
        memberIds: form.memberIds.map(Number),
      };

      const url = editingId ? `/api/cas-committees/${editingId}` : "/api/cas-committees";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: editingId ? "Comité mis à jour" : "Comité créé", description: data.message });
        setShowDialog(false);
        loadAll();
      } else {
        toast({ title: "Erreur", description: data.message || "Une erreur est survenue", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  async function handleDeactivate(id: number) {
    if (!confirm("Désactiver ce comité ?")) return;
    try {
      const res = await fetch(`/api/cas-committees/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast({ title: "Comité désactivé" }); loadAll(); }
    } catch { }
  }

  function toggleMember(uid: string) {
    setForm(f => {
      const already = f.memberIds.includes(uid);
      if (already) return { ...f, memberIds: f.memberIds.filter(id => id !== uid) };
      if (f.memberIds.length >= 5) {
        toast({ title: "Maximum 5 membres (PRO 07 §5.1)", variant: "destructive" }); return f;
      }
      return { ...f, memberIds: [...f.memberIds, uid] };
    });
  }

  const assignedDomains = new Set(committees.filter(c => c.active).map(c => c.domain));
  const availableDomains = editingId
    ? domains
    : domains.filter(d => !assignedDomains.has(d.value));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Gestion des Comités CAS — PRO 07 §5.1
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Un comité par domaine — 5 membres max (président + vice-président + experts)
              </p>
            </div>
            <Button onClick={openCreate} disabled={availableDomains.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Nouveau comité
            </Button>
          </div>

          {/* Coverage summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{committees.filter(c => c.active).length}</div>
                <div className="text-sm text-gray-500">Comités actifs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-400">{domains.length - committees.filter(c => c.active).length}</div>
                <div className="text-sm text-gray-500">Domaines sans comité</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {committees.filter(c => c.active && c.memberCount >= 3).length}
                </div>
                <div className="text-sm text-gray-500">Comités avec quorum possible (≥3)</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Comités d'Accréditation Spécialisés</CardTitle>
                <CardDescription>12 domaines définis par PRO 07 §5.1</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Président</TableHead>
                      <TableHead>Vice-Président</TableHead>
                      <TableHead>Membres</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map(domain => {
                      const committee = committees.find(c => c.domain === domain.value && c.active);
                      if (committee) {
                        const memberOk = committee.memberCount >= 3;
                        return (
                          <TableRow key={domain.value}>
                            <TableCell className="font-medium">{domain.label}</TableCell>
                            <TableCell>{committee.presidentName || <span className="text-gray-400">—</span>}</TableCell>
                            <TableCell>{committee.vicePresidentName || <span className="text-gray-400">—</span>}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className={`font-semibold ${memberOk ? "text-green-600" : "text-orange-500"}`}>
                                  {committee.memberCount}/5
                                </span>
                                {memberOk
                                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  : <AlertTriangle className="h-4 w-4 text-orange-400" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={committee.memberCount >= 5 ? "default" : "secondary"}>
                                {committee.memberCount >= 5 ? "Complet" : "Incomplet"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEdit(committee)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeactivate(committee.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return (
                        <TableRow key={domain.value} className="bg-gray-50/50">
                          <TableCell className="text-gray-500">{domain.label}</TableCell>
                          <TableCell colSpan={4} className="text-gray-400 text-sm">Aucun comité créé</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => {
                              setForm({ ...emptyForm, domain: domain.value });
                              setEditingId(null);
                              setShowDialog(true);
                            }}>
                              <Plus className="h-3 w-3 mr-1" /> Créer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {editingId ? "Modifier le comité" : "Créer un comité CAS"}
            </DialogTitle>
            <DialogDescription>
              PRO 07 §5.1 — Maximum 5 membres (président compris).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Domaine *</Label>
              <Select value={form.domain} onValueChange={v => setForm(f => ({ ...f, domain: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un domaine" /></SelectTrigger>
                <SelectContent>
                  {(editingId ? domains : availableDomains).map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Nom du comité</Label>
              <Input value={form.name}
                placeholder={domains.find(d => d.value === form.domain)?.label || "Nom du comité"}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Président</Label>
                <Select value={form.presidentId} onValueChange={v => setForm(f => ({ ...f, presidentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Aucun —</SelectItem>
                    {casUsers.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Vice-Président</Label>
                <Select value={form.vicePresidentId} onValueChange={v => setForm(f => ({ ...f, vicePresidentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Aucun —</SelectItem>
                    {casUsers.filter(u => String(u.id) !== form.presidentId).map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>
                Membres du comité ({form.memberIds.length}/5)
                <span className="text-xs text-gray-400 ml-2">Cocher jusqu'à 5 membres</span>
              </Label>
              <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                {casUsers.map(u => {
                  const checked = form.memberIds.includes(String(u.id));
                  return (
                    <label key={u.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleMember(String(u.id))}
                        className="h-4 w-4 rounded border-gray-300" />
                      <span className="text-sm flex-1">{u.fullName}</span>
                      <span className="text-xs text-gray-400">{u.email}</span>
                    </label>
                  );
                })}
                {casUsers.length === 0 && (
                  <p className="text-sm text-gray-400 p-3">Aucun utilisateur CAS_MEMBER ou CAS_PRESIDENT trouvé.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Enregistrer" : "Créer le comité"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
