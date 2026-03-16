import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Plus, AlertTriangle, TrendingUp, Clock, Lightbulb } from "lucide-react";

interface RiskEntry {
  id: number; registerCode: string; type: string; title: string;
  description: string; category: string; source: string;
  likelihood: string; impact: string; level: string;
  mitigationActions: string; status: string; ownerDepartment: string;
  nextReviewDate: string; createdAt: string;
}

export default function RiskOpportunityPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  const [selected, setSelected] = useState<RiskEntry | null>(null);
  const [form, setForm] = useState({
    type: "RISK", title: "", description: "", category: "OPERATIONAL",
    source: "", likelihood: "POSSIBLE", impact: "MODERATE", department: ""
  });
  const [treatForm, setTreatForm] = useState({ mitigationActions: "", actionPlan: "", deadline: "", keyIndicators: "" });

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try { const res = await fetch("/api/risks", { credentials: "include" }); const data = await res.json(); setEntries(data.data || []); } catch { setEntries([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try { await apiRequest("POST", "/api/risks", form); toast({ title: "Risque/Opportunité identifié(e)" }); setShowCreate(false); loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTreatment = async () => {
    if (!selected) return;
    try { await apiRequest("PUT", `/api/risks/${selected.id}/treatment-plan`, treatForm); toast({ title: "Plan de traitement défini" }); setShowTreatment(false); loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStartTreatment = async (id: number) => {
    try { await apiRequest("PUT", `/api/risks/${id}/start-treatment`, {}); toast({ title: "Traitement démarré" }); loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleClose = async (id: number) => {
    try { await apiRequest("PUT", `/api/risks/${id}/close`, { residualNotes: "" }); toast({ title: "Clôturé" }); loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getLevelBadge = (level: string) => {
    const m: Record<string, string> = { LOW: "bg-green-100 text-green-800", MEDIUM: "bg-yellow-100 text-yellow-800", HIGH: "bg-orange-100 text-orange-800", CRITICAL: "bg-red-100 text-red-800" };
    return <Badge className={m[level] || "bg-gray-100 text-gray-800"}>{level}</Badge>;
  };

  const getStatusBadge = (s: string) => {
    const m: Record<string, { c: string; l: string }> = {
      IDENTIFIED: { c: "bg-blue-100 text-blue-800", l: "Identifié" }, ANALYZING: { c: "bg-purple-100 text-purple-800", l: "Analyse" },
      TREATMENT_PLAN: { c: "bg-indigo-100 text-indigo-800", l: "Plan traitement" }, IN_TREATMENT: { c: "bg-orange-100 text-orange-800", l: "En traitement" },
      MITIGATED: { c: "bg-teal-100 text-teal-800", l: "Atténué" }, CLOSED: { c: "bg-gray-100 text-gray-800", l: "Clôturé" }, ACCEPTED: { c: "bg-green-100 text-green-800", l: "Accepté" },
    };
    const v = m[s] || { c: "bg-gray-100 text-gray-800", l: s };
    return <Badge className={v.c}>{v.l}</Badge>;
  };

  const risks = entries.filter(e => e.type === "RISK");
  const opps = entries.filter(e => e.type === "OPPORTUNITY");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-primary" />Risques & Opportunités — PRO 30</h1>
              <p className="text-muted-foreground">Registre des risques et opportunités</p></div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Identifier</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><div><p className="text-2xl font-bold">{risks.length}</p><p className="text-xs text-muted-foreground">Risques</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Lightbulb className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{opps.length}</p><p className="text-xs text-muted-foreground">Opportunités</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-orange-500" /><div><p className="text-2xl font-bold">{entries.filter(e => e.level === "HIGH" || e.level === "CRITICAL").length}</p><p className="text-xs text-muted-foreground">Haut/Critique</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-blue-500" /><div><p className="text-2xl font-bold">{entries.filter(e => e.status === "IN_TREATMENT").length}</p><p className="text-xs text-muted-foreground">En traitement</p></div></div></Card>
          </div>

          <Tabs defaultValue="risks">
            <TabsList><TabsTrigger value="risks"><AlertTriangle className="w-4 h-4 mr-1" />Risques ({risks.length})</TabsTrigger>
              <TabsTrigger value="opps"><Lightbulb className="w-4 h-4 mr-1" />Opportunités ({opps.length})</TabsTrigger></TabsList>
            {[{ key: "risks", data: risks }, { key: "opps", data: opps }].map(({ key, data }) => (
              <TabsContent key={key} value={key}>
                <Card><CardContent className="p-0">
                  <Table><TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead>
                    <TableHead>Niveau</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{data.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.registerCode}</TableCell>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell>{e.category?.replace(/_/g, " ")}</TableCell>
                      <TableCell>{getLevelBadge(e.level)}</TableCell>
                      <TableCell>{getStatusBadge(e.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {e.status === "IDENTIFIED" && <Button size="sm" onClick={() => { setSelected(e); setShowTreatment(true); }}>Plan</Button>}
                          {e.status === "TREATMENT_PLAN" && <Button size="sm" variant="outline" onClick={() => handleStartTreatment(e.id)}>Démarrer</Button>}
                          {["IN_TREATMENT", "MITIGATED"].includes(e.status) && <Button size="sm" variant="outline" onClick={() => handleClose(e.id)}>Clôturer</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </CardContent></Card>
              </TabsContent>
            ))}
          </Tabs>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Identifier un risque/opportunité</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RISK">Risque</SelectItem><SelectItem value="OPPORTUNITY">Opportunité</SelectItem></SelectContent></Select></div>
                <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Catégorie</Label><Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="STRATEGIC">Stratégique</SelectItem><SelectItem value="OPERATIONAL">Opérationnel</SelectItem><SelectItem value="FINANCIAL">Financier</SelectItem><SelectItem value="REGULATORY">Réglementaire</SelectItem></SelectContent></Select></div>
                  <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Vraisemblance</Label><Select value={form.likelihood} onValueChange={(v) => setForm({...form, likelihood: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="RARE">Rare</SelectItem><SelectItem value="UNLIKELY">Peu probable</SelectItem><SelectItem value="POSSIBLE">Possible</SelectItem><SelectItem value="LIKELY">Probable</SelectItem></SelectContent></Select></div>
                  <div><Label>Impact</Label><Select value={form.impact} onValueChange={(v) => setForm({...form, impact: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="NEGLIGIBLE">Négligeable</SelectItem><SelectItem value="MINOR">Mineur</SelectItem><SelectItem value="MODERATE">Modéré</SelectItem><SelectItem value="MAJOR">Majeur</SelectItem></SelectContent></Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button><Button onClick={handleCreate}>Identifier</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showTreatment} onOpenChange={setShowTreatment}>
            <DialogContent><DialogHeader><DialogTitle>Plan de traitement — {selected?.registerCode}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Actions d'atténuation</Label><Textarea value={treatForm.mitigationActions} onChange={(e) => setTreatForm({...treatForm, mitigationActions: e.target.value})} /></div>
                <div><Label>Plan d'action</Label><Textarea value={treatForm.actionPlan} onChange={(e) => setTreatForm({...treatForm, actionPlan: e.target.value})} /></div>
                <div><Label>Échéance</Label><Input type="date" value={treatForm.deadline} onChange={(e) => setTreatForm({...treatForm, deadline: e.target.value})} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowTreatment(false)}>Annuler</Button><Button onClick={handleTreatment}>Définir</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
