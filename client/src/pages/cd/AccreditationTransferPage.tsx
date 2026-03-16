import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRightLeft, Plus, CheckCircle, FileText, Send } from "lucide-react";

interface Transfer {
  id: number; transferCode: string; reason: string;
  sourceOecName: string; targetOecName: string; accreditationScope: string;
  status: string; createdAt: string;
}

export default function AccreditationTransferPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const [form, setForm] = useState({
    requestId: "", reason: "MERGER", sourceOecName: "", sourceOecAddress: "",
    targetOecName: "", targetOecAddress: "", targetOecLegalStatus: "",
    accreditationScope: "", justification: ""
  });
  const [decForm, setDecForm] = useState({ approved: true, conditions: "" });

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try { const res = await fetch("/api/transfers", { credentials: "include" }); const data = await res.json(); setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/transfers", { ...form, requestId: parseInt(form.requestId) });
      toast({ title: "Demande de transfert initiée" }); setShowCreate(false); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmitDocs = async (id: number) => {
    try { await apiRequest("PUT", `/api/transfers/${id}/submit-documents`, { docs: "Documents soumis" }); toast({ title: "Documents soumis" }); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDecision = async () => {
    if (!selected) return;
    try { await apiRequest("PUT", `/api/transfers/${selected.id}/decide`, decForm); toast({ title: decForm.approved ? "Transfert approuvé" : "Transfert refusé" }); setShowDecision(false); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleComplete = async (id: number) => {
    try { await apiRequest("PUT", `/api/transfers/${id}/complete`, {}); toast({ title: "Transfert complété" }); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (s: string) => {
    const m: Record<string, { c: string; l: string }> = {
      INITIATED: { c: "bg-blue-100 text-blue-800", l: "Initié" },
      DOCUMENTS_SUBMITTED: { c: "bg-indigo-100 text-indigo-800", l: "Documents soumis" },
      UNDER_REVIEW: { c: "bg-yellow-100 text-yellow-800", l: "En examen" },
      EVALUATION_REQUIRED: { c: "bg-purple-100 text-purple-800", l: "Évaluation requise" },
      APPROVED: { c: "bg-green-100 text-green-800", l: "Approuvé" },
      CERTIFICATE_ISSUED: { c: "bg-teal-100 text-teal-800", l: "Certificat émis" },
      COMPLETED: { c: "bg-emerald-100 text-emerald-800", l: "Complété" },
      REJECTED: { c: "bg-red-100 text-red-800", l: "Rejeté" },
    };
    const v = m[s] || { c: "bg-gray-100 text-gray-800", l: s };
    return <Badge className={v.c}>{v.l}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-primary" />Transfert d'accréditation — PRO 31</h1>
              <p className="text-muted-foreground">Transfert de droits d'accréditation entre OEC</p></div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nouveau transfert</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Demandes de transfert</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>OEC source</TableHead><TableHead>OEC cible</TableHead>
                    <TableHead>Motif</TableHead><TableHead>Périmètre</TableHead><TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
                      <TableCell>{t.sourceOecName}</TableCell>
                      <TableCell>{t.targetOecName}</TableCell>
                      <TableCell>{t.reason?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{t.accreditationScope}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {t.status === "INITIATED" && <Button size="sm" variant="outline" onClick={() => handleSubmitDocs(t.id)}><FileText className="w-3 h-3 mr-1" />Soumettre docs</Button>}
                          {["DOCUMENTS_SUBMITTED", "UNDER_REVIEW"].includes(t.status) && <Button size="sm" onClick={() => { setSelected(t); setShowDecision(true); }}>Décider</Button>}
                          {t.status === "CERTIFICATE_ISSUED" && <Button size="sm" onClick={() => handleComplete(t.id)}><CheckCircle className="w-3 h-3 mr-1" />Compléter</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouveau transfert d'accréditation</DialogTitle>
                <DialogDescription>PRO 31 — Transfert entre organismes</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>ID de la demande</Label><Input type="number" value={form.requestId} onChange={(e) => setForm({...form, requestId: e.target.value})} /></div>
                <div><Label>Motif</Label><Select value={form.reason} onValueChange={(v) => setForm({...form, reason: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="MERGER">Fusion</SelectItem><SelectItem value="ACQUISITION">Acquisition</SelectItem>
                  <SelectItem value="LEGAL_RESTRUCTURING">Restructuration juridique</SelectItem><SelectItem value="NAME_CHANGE">Changement de nom</SelectItem>
                  <SelectItem value="SPIN_OFF">Scission</SelectItem></SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>OEC source</Label><Input value={form.sourceOecName} onChange={(e) => setForm({...form, sourceOecName: e.target.value})} /></div>
                  <div><Label>OEC cible</Label><Input value={form.targetOecName} onChange={(e) => setForm({...form, targetOecName: e.target.value})} /></div>
                </div>
                <div><Label>Périmètre d'accréditation</Label><Textarea value={form.accreditationScope} onChange={(e) => setForm({...form, accreditationScope: e.target.value})} /></div>
                <div><Label>Justification</Label><Textarea value={form.justification} onChange={(e) => setForm({...form, justification: e.target.value})} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button><Button onClick={handleCreate}>Initier</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDecision} onOpenChange={setShowDecision}>
            <DialogContent>
              <DialogHeader><DialogTitle>Décision sur le transfert {selected?.transferCode}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant={decForm.approved ? "default" : "outline"} onClick={() => setDecForm({...decForm, approved: true})} className="flex-1"><CheckCircle className="w-4 h-4 mr-2" />Approuver</Button>
                  <Button variant={!decForm.approved ? "destructive" : "outline"} onClick={() => setDecForm({...decForm, approved: false})} className="flex-1">Rejeter</Button>
                </div>
                <div><Label>Conditions</Label><Textarea value={decForm.conditions} onChange={(e) => setDecForm({...decForm, conditions: e.target.value})} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button><Button onClick={handleDecision}>Confirmer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
