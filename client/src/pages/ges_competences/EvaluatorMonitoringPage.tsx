import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

interface Sheet {
  id: number;
  evaluator: { id: number; fullName: string };
  isPermanent?: boolean;
  cycleStartDate?: string;
  cycleEndDate?: string;
  totalMissionsInCycle?: number;
  proposedDecision?: string;
  validatedByDirection?: boolean;
  validatedDate?: string;
  createdAt?: string;
}

const DECISIONS = [
  { v: "RENOUVELLEMENT", l: "Renouvellement" },
  { v: "EXTENSION", l: "Extension" },
  { v: "REDUCTION", l: "Réduction" },
  { v: "RADIATION", l: "Radiation" },
  { v: "FORMATION_COMPLEMENTAIRE", l: "Formation complémentaire" },
];

export default function EvaluatorMonitoringPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ isPermanent: false });

  useEffect(() => {
    document.title = "Suivi compétences évaluateurs (FOR 65-1/65-6) | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/competency/monitoring-sheets", { credentials: "include" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const create = async () => {
    const res = await fetch("/api/competency/monitoring-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast({ title: "Fiche créée" });
      setCreateOpen(false);
      setForm({ isPermanent: false });
      fetchAll();
    }
  };

  const validate = async (id: number) => {
    const res = await fetch(`/api/competency/monitoring-sheets/${id}/validate`, {
      method: "POST", credentials: "include",
    });
    if (res.ok) { toast({ title: "Fiche validée" }); fetchAll(); }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-600" /> Suivi compétences (FOR 65-1 / FOR 65-6)
              </h1>
              <p className="text-sm text-slate-500 mt-1">PRO 06 §5.5 — décision triennale (3 ans externe / 6 ans permanent)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
              <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle fiche</Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Fiches ({items.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Chargement…</p> : items.length === 0 ? (
                <p className="text-center py-8 text-slate-500">Aucune fiche</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Évaluateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Missions</TableHead>
                      <TableHead>Décision proposée</TableHead>
                      <TableHead>Validation</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.evaluator.fullName}</TableCell>
                        <TableCell><Badge variant="outline">{s.isPermanent ? "FOR 65-6 (Permanent)" : "FOR 65-1 (Externe)"}</Badge></TableCell>
                        <TableCell className="text-xs">{s.cycleStartDate} → {s.cycleEndDate}</TableCell>
                        <TableCell>{s.totalMissionsInCycle || 0}</TableCell>
                        <TableCell><Badge>{s.proposedDecision || "—"}</Badge></TableCell>
                        <TableCell>{s.validatedByDirection ? <span className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{s.validatedDate}</span> : <span className="text-slate-400 text-xs">en attente</span>}</TableCell>
                        <TableCell>
                          {!s.validatedByDirection && <Button size="sm" variant="outline" onClick={() => validate(s.id)}>Valider</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouvelle fiche FOR 65-1 / 65-6</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ID Évaluateur</Label><Input value={form.evaluatorId || ""} onChange={(e) => setForm({ ...form, evaluatorId: e.target.value })} /></div>
              <div><Label>ID Qualification (optionnel)</Label><Input value={form.qualificationId || ""} onChange={(e) => setForm({ ...form, qualificationId: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.isPermanent ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isPermanent: v === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">FOR 65-1 (Externe — 3 ans)</SelectItem>
                    <SelectItem value="true">FOR 65-6 (Permanent — 6 ans)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date début cycle</Label><Input type="date" value={form.cycleStartDate || ""} onChange={(e) => setForm({ ...form, cycleStartDate: e.target.value })} /></div>
              <div><Label>Date fin cycle</Label><Input type="date" value={form.cycleEndDate || ""} onChange={(e) => setForm({ ...form, cycleEndDate: e.target.value })} /></div>
              <div><Label>Total missions cycle</Label><Input type="number" value={form.totalMissionsInCycle || ""} onChange={(e) => setForm({ ...form, totalMissionsInCycle: e.target.value })} /></div>
              <div><Label>Score moyen observation</Label><Input type="number" step="0.1" value={form.avgObservationScore || ""} onChange={(e) => setForm({ ...form, avgObservationScore: e.target.value })} /></div>
              <div><Label>Score moyen satisfaction</Label><Input type="number" step="0.1" value={form.avgSatisfactionScore || ""} onChange={(e) => setForm({ ...form, avgSatisfactionScore: e.target.value })} /></div>
            </div>
            <div>
              <Label>Décision proposée</Label>
              <Select value={form.proposedDecision || ""} onValueChange={(v) => setForm({ ...form, proposedDecision: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {DECISIONS.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Points forts</Label><Textarea value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
            <div><Label>Axes d'amélioration</Label><Textarea value={form.areasForImprovement || ""} onChange={(e) => setForm({ ...form, areasForImprovement: e.target.value })} /></div>
            <div><Label>Justification</Label><Textarea value={form.justification || ""} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={create}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
