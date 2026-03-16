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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Video, Plus, CheckCircle, Wifi, Monitor } from "lucide-react";

interface RemoteEval {
  id: number; evaluationCode: string; justification: string;
  technologyPlatform: string; remoteScope: string; partialRemote: boolean;
  status: string; oecConsentObtained: boolean; createdAt: string;
}

export default function RemoteEvaluationPage() {
  const { toast } = useToast();
  const [evals, setEvals] = useState<RemoteEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [selected, setSelected] = useState<RemoteEval | null>(null);

  const [form, setForm] = useState({
    requestId: "", justification: "GEOGRAPHIC_DISTANCE", justificationDetails: "",
    technologyPlatform: "", remoteScope: "", onsiteScope: "",
    partialRemote: true, durationHours: ""
  });
  const [techForm, setTechForm] = useState({
    videoOk: true, audioOk: true, docSharingOk: true,
    connectionOk: true, techPrereqs: ""
  });

  useEffect(() => { loadEvals(); }, []);

  const loadEvals = async () => {
    try {
      const res = await fetch("/api/remote-evaluation", { credentials: "include" });
      const data = await res.json();
      setEvals(data.data || []);
    } catch { setEvals([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/remote-evaluation", {
        ...form, requestId: parseInt(form.requestId),
        durationHours: form.durationHours ? parseInt(form.durationHours) : null,
      });
      toast({ title: "Évaluation à distance proposée" });
      setShowCreate(false); loadEvals();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCdApproval = async (id: number, approved: boolean) => {
    try { await apiRequest("PUT", `/api/remote-evaluation/${id}/cd-approval`, { approved, comments: "" }); toast({ title: approved ? "Approuvée par le CD" : "Rejetée" }); loadEvals();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleOecConsent = async (id: number, consented: boolean) => {
    try { await apiRequest("PUT", `/api/remote-evaluation/${id}/oec-consent`, { consented }); toast({ title: consented ? "Consentement obtenu" : "OEC a refusé" }); loadEvals();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTechVerify = async () => {
    if (!selected) return;
    try { await apiRequest("PUT", `/api/remote-evaluation/${selected.id}/verify-schedule`, techForm); toast({ title: "Vérification technique effectuée" }); setShowTech(false); loadEvals();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStart = async (id: number) => {
    try { await apiRequest("PUT", `/api/remote-evaluation/${id}/start`, {}); toast({ title: "Évaluation démarrée" }); loadEvals();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      PROPOSED: { color: "bg-blue-100 text-blue-800", label: "Proposée" },
      CD_APPROVED: { color: "bg-indigo-100 text-indigo-800", label: "CD approuvé" },
      PENDING_OEC_CONSENT: { color: "bg-yellow-100 text-yellow-800", label: "Attente OEC" },
      OEC_CONSENTED: { color: "bg-teal-100 text-teal-800", label: "OEC accepté" },
      SCHEDULED: { color: "bg-purple-100 text-purple-800", label: "Programmée" },
      IN_PROGRESS: { color: "bg-cyan-100 text-cyan-800", label: "En cours" },
      COMPLETED: { color: "bg-green-100 text-green-800", label: "Terminée" },
      CD_REJECTED: { color: "bg-red-100 text-red-800", label: "Rejetée" },
      OEC_REFUSED: { color: "bg-red-100 text-red-800", label: "OEC refusé" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6 text-primary" />Évaluation à distance — PRO 29</h1>
              <p className="text-muted-foreground">Gestion des évaluations à distance avec vérification technique</p></div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Proposer</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Évaluations à distance</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>Justification</TableHead>
                    <TableHead>Plateforme</TableHead><TableHead>Périmètre distant</TableHead>
                    <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {evals.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-sm">{e.evaluationCode}</TableCell>
                        <TableCell>{e.justification?.replace(/_/g, " ")}</TableCell>
                        <TableCell><div className="flex items-center gap-1"><Monitor className="w-4 h-4" />{e.technologyPlatform}</div></TableCell>
                        <TableCell className="max-w-[200px] truncate">{e.remoteScope}</TableCell>
                        <TableCell>{getStatusBadge(e.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {e.status === "PROPOSED" && <>
                              <Button size="sm" onClick={() => handleCdApproval(e.id, true)}>Approuver</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCdApproval(e.id, false)}>Rejeter</Button>
                            </>}
                            {e.status === "PENDING_OEC_CONSENT" && <>
                              <Button size="sm" onClick={() => handleOecConsent(e.id, true)}><CheckCircle className="w-3 h-3 mr-1" />Accepter</Button>
                              <Button size="sm" variant="outline" onClick={() => handleOecConsent(e.id, false)}>Refuser</Button>
                            </>}
                            {e.status === "OEC_CONSENTED" && <Button size="sm" onClick={() => { setSelected(e); setShowTech(true); }}><Wifi className="w-3 h-3 mr-1" />Vérif. technique</Button>}
                            {e.status === "SCHEDULED" && <Button size="sm" onClick={() => handleStart(e.id)}>Démarrer</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Proposer une évaluation à distance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>ID de la demande</Label><Input type="number" value={form.requestId} onChange={(e) => setForm({...form, requestId: e.target.value})} /></div>
                <div><Label>Justification</Label>
                  <Select value={form.justification} onValueChange={(v) => setForm({...form, justification: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PANDEMIC">Pandémie</SelectItem>
                      <SelectItem value="GEOGRAPHIC_DISTANCE">Distance géographique</SelectItem>
                      <SelectItem value="FORCE_MAJEURE">Force majeure</SelectItem>
                      <SelectItem value="OEC_REQUEST">Demande OEC</SelectItem>
                      <SelectItem value="EFFICIENCY">Efficacité</SelectItem>
                    </SelectContent></Select></div>
                <div><Label>Plateforme technologique</Label><Input value={form.technologyPlatform} onChange={(e) => setForm({...form, technologyPlatform: e.target.value})} placeholder="Teams, Zoom..." /></div>
                <div><Label>Périmètre évalué à distance</Label><Textarea value={form.remoteScope} onChange={(e) => setForm({...form, remoteScope: e.target.value})} /></div>
                <div><Label>Périmètre sur site (si partiel)</Label><Textarea value={form.onsiteScope} onChange={(e) => setForm({...form, onsiteScope: e.target.value})} /></div>
                <div><Label>Durée estimée (heures)</Label><Input type="number" value={form.durationHours} onChange={(e) => setForm({...form, durationHours: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Proposer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tech Verification */}
          <Dialog open={showTech} onOpenChange={setShowTech}>
            <DialogContent>
              <DialogHeader><DialogTitle>Vérification technique</DialogTitle>
                <DialogDescription>Tester les capacités techniques pour l'évaluation à distance</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center space-x-2"><Checkbox checked={techForm.videoOk} onCheckedChange={(c) => setTechForm({...techForm, videoOk: !!c})} /><Label>Vidéo ✓</Label></div>
                <div className="flex items-center space-x-2"><Checkbox checked={techForm.audioOk} onCheckedChange={(c) => setTechForm({...techForm, audioOk: !!c})} /><Label>Audio ✓</Label></div>
                <div className="flex items-center space-x-2"><Checkbox checked={techForm.docSharingOk} onCheckedChange={(c) => setTechForm({...techForm, docSharingOk: !!c})} /><Label>Partage de documents ✓</Label></div>
                <div className="flex items-center space-x-2"><Checkbox checked={techForm.connectionOk} onCheckedChange={(c) => setTechForm({...techForm, connectionOk: !!c})} /><Label>Stabilité connexion ✓</Label></div>
                <div><Label>Prérequis techniques</Label><Textarea value={techForm.techPrereqs} onChange={(e) => setTechForm({...techForm, techPrereqs: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTech(false)}>Annuler</Button>
                <Button onClick={handleTechVerify}>Valider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
