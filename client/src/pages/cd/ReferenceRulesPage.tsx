import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Send, CheckCircle, AlertTriangle, Archive } from "lucide-react";

interface ReferenceRule {
  id: number; ruleCode: string; standardCode: string; standardVersion: string;
  standardTitle: string; description: string; applicableDomains: string;
  publicationDate: string; effectiveDate: string; transitionEndDate: string;
  status: string; affectedOecCount: number; transitionCompletedCount: number;
  createdAt: string;
}

export default function ReferenceRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<ReferenceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    standardCode: "", version: "", title: "", description: "",
    applicableDomains: "", applicableOecTypes: "",
    publicationDate: "", effectiveDate: "", transitionStart: "",
    transitionEnd: "", previousCode: "", previousVersion: "",
    transitionRequirements: "", guidanceDocs: ""
  });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const res = await fetch("/api/reference-rules", { credentials: "include" });
      const data = await res.json();
      setRules(data.data || []);
    } catch { setRules([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/reference-rules", form);
      toast({ title: "Règle de référence créée" });
      setShowCreate(false); loadRules();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handlePublish = async (id: number) => {
    try { await apiRequest("PUT", `/api/reference-rules/${id}/publish`, {}); toast({ title: "Règle publiée, OEC notifiés" }); loadRules();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStartTransition = async (id: number) => {
    try { await apiRequest("PUT", `/api/reference-rules/${id}/start-transition`, {}); toast({ title: "Transition démarrée" }); loadRules();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleWithdraw = async (id: number) => {
    try { await apiRequest("PUT", `/api/reference-rules/${id}/withdraw`, {}); toast({ title: "Règle retirée" }); loadRules();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Brouillon" },
      PUBLISHED: { color: "bg-blue-100 text-blue-800", label: "Publiée" },
      IN_TRANSITION: { color: "bg-yellow-100 text-yellow-800", label: "En transition" },
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
      WITHDRAWN: { color: "bg-red-100 text-red-800", label: "Retirée" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />Règles de référence — PRO 19</h1>
              <p className="text-muted-foreground">Gestion des normes et transitions normatives</p></div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle règle</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4"><div className="flex items-center gap-3"><BookOpen className="w-8 h-8 text-blue-500" /><div><p className="text-2xl font-bold">{rules.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Send className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{rules.filter(r => r.status === "PUBLISHED" || r.status === "ACTIVE").length}</p><p className="text-xs text-muted-foreground">Actives</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-yellow-500" /><div><p className="text-2xl font-bold">{rules.filter(r => r.status === "IN_TRANSITION").length}</p><p className="text-xs text-muted-foreground">En transition</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Archive className="w-8 h-8 text-red-500" /><div><p className="text-2xl font-bold">{rules.filter(r => r.status === "WITHDRAWN").length}</p><p className="text-xs text-muted-foreground">Retirées</p></div></div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Normes de référence</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>Norme</TableHead><TableHead>Titre</TableHead>
                    <TableHead>Domaines</TableHead><TableHead>Fin transition</TableHead><TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rules.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.ruleCode}</TableCell>
                        <TableCell className="font-medium">{r.standardCode} {r.standardVersion}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.standardTitle}</TableCell>
                        <TableCell>{r.applicableDomains}</TableCell>
                        <TableCell>{r.transitionEndDate ? new Date(r.transitionEndDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                        <TableCell>{r.affectedOecCount ? `${r.transitionCompletedCount || 0}/${r.affectedOecCount}` : "—"}</TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {r.status === "DRAFT" && <Button size="sm" onClick={() => handlePublish(r.id)}><Send className="w-3 h-3 mr-1" />Publier</Button>}
                            {r.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={() => handleStartTransition(r.id)}>Démarrer transition</Button>}
                            {["PUBLISHED", "IN_TRANSITION", "ACTIVE"].includes(r.status) && <Button size="sm" variant="destructive" onClick={() => handleWithdraw(r.id)}><Archive className="w-3 h-3 mr-1" />Retirer</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle règle de référence</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Code de la norme</Label><Input value={form.standardCode} onChange={(e) => setForm({...form, standardCode: e.target.value})} placeholder="ISO/IEC 17025" /></div>
                  <div><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({...form, version: e.target.value})} placeholder="2017" /></div>
                </div>
                <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Domaines applicables</Label><Input value={form.applicableDomains} onChange={(e) => setForm({...form, applicableDomains: e.target.value})} /></div>
                  <div><Label>Types OEC applicables</Label><Input value={form.applicableOecTypes} onChange={(e) => setForm({...form, applicableOecTypes: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Date d'entrée en vigueur</Label><Input type="date" value={form.effectiveDate} onChange={(e) => setForm({...form, effectiveDate: e.target.value})} /></div>
                  <div><Label>Fin de la transition</Label><Input type="date" value={form.transitionEnd} onChange={(e) => setForm({...form, transitionEnd: e.target.value})} /></div>
                </div>
                <div><Label>Exigences de transition</Label><Textarea value={form.transitionRequirements} onChange={(e) => setForm({...form, transitionRequirements: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
