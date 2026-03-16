import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Globe, Plus, CheckCircle, Clock, Search, BookOpen, Lightbulb, ArrowRight
} from "lucide-react";

interface DomainDevRequest {
  id: number;
  requestCode: string;
  domainName: string;
  description: string;
  regulatoryBasis: string;
  marketDemand: string;
  applicableStandards: string;
  feasibilityStudy: string;
  status: string;
  createdAt: string;
}

export default function DomainDevelopmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DomainDevRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showFeasibility, setShowFeasibility] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [selected, setSelected] = useState<DomainDevRequest | null>(null);

  const [form, setForm] = useState({
    domainName: "", description: "", regulatoryBasis: "",
    marketDemand: "", applicableStandards: ""
  });
  const [feasForm, setFeasForm] = useState({
    feasibilityStudy: "", evaluatorsAvailable: true,
    evaluatorCount: "", trainingPlan: "", resourceRequirements: ""
  });
  const [decForm, setDecForm] = useState({ approved: true, comments: "" });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/domain-development", { credentials: "include" });
      const data = await res.json();
      setRequests(data.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/domain-development", form);
      toast({ title: "Demande de développement soumise" });
      setShowCreate(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStartFeasibility = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/domain-development/${id}/feasibility/start`, {});
      toast({ title: "Étude de faisabilité démarrée" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCompleteFeasibility = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/domain-development/${selected.id}/feasibility/complete`, {
        ...feasForm,
        evaluatorCount: feasForm.evaluatorCount ? parseInt(feasForm.evaluatorCount) : null,
      });
      toast({ title: "Étude de faisabilité terminée" });
      setShowFeasibility(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDTReview = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/domain-development/${id}/dt-review`, { comments: "Revue effectuée" });
      toast({ title: "Revue DT effectuée" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDGDecision = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/domain-development/${selected.id}/dg-decision`, decForm);
      toast({ title: decForm.approved ? "Domaine approuvé" : "Domaine rejeté" });
      setShowDecision(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/domain-development/${id}/activate`, {});
      toast({ title: "Domaine activé" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      SUBMITTED: { color: "bg-blue-100 text-blue-800", label: "Soumis" },
      FEASIBILITY_STUDY: { color: "bg-purple-100 text-purple-800", label: "Étude faisabilité" },
      FEASIBILITY_COMPLETED: { color: "bg-indigo-100 text-indigo-800", label: "Faisabilité terminée" },
      PENDING_DG_APPROVAL: { color: "bg-yellow-100 text-yellow-800", label: "Attente DG" },
      APPROVED: { color: "bg-green-100 text-green-800", label: "Approuvé" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Rejeté" },
      IMPLEMENTATION: { color: "bg-orange-100 text-orange-800", label: "Mise en œuvre" },
      ACTIVE: { color: "bg-emerald-100 text-emerald-800", label: "Actif" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Développement de domaines — PRO 17
              </h1>
              <p className="text-muted-foreground">Gestion des nouveaux domaines d'activité d'accréditation</p>
            </div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nouveau domaine</Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4"><div className="flex items-center gap-3"><Lightbulb className="w-8 h-8 text-blue-500" /><div><p className="text-2xl font-bold">{requests.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Search className="w-8 h-8 text-purple-500" /><div><p className="text-2xl font-bold">{requests.filter(r => r.status === "FEASIBILITY_STUDY").length}</p><p className="text-xs text-muted-foreground">En étude</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-yellow-500" /><div><p className="text-2xl font-bold">{requests.filter(r => r.status === "PENDING_DG_APPROVAL").length}</p><p className="text-xs text-muted-foreground">Attente DG</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{requests.filter(r => r.status === "ACTIVE").length}</p><p className="text-xs text-muted-foreground">Actifs</p></div></div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Demandes de développement</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> :
               requests.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune demande</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.requestCode}</TableCell>
                        <TableCell className="font-medium">{r.domainName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {r.status === "SUBMITTED" && <Button size="sm" variant="outline" onClick={() => handleStartFeasibility(r.id)}>Lancer étude</Button>}
                            {r.status === "FEASIBILITY_STUDY" && <Button size="sm" onClick={() => { setSelected(r); setShowFeasibility(true); }}>Terminer étude</Button>}
                            {r.status === "FEASIBILITY_COMPLETED" && <Button size="sm" variant="outline" onClick={() => handleDTReview(r.id)}>Revue DT</Button>}
                            {r.status === "PENDING_DG_APPROVAL" && <Button size="sm" onClick={() => { setSelected(r); setShowDecision(true); }}>Décision DG</Button>}
                            {r.status === "IMPLEMENTATION" && <Button size="sm" onClick={() => handleActivate(r.id)}>Activer</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create Dialog */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nouveau domaine d'activité</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nom du domaine</Label><Input value={form.domainName} onChange={(e) => setForm({...form, domainName: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div><Label>Base réglementaire</Label><Textarea value={form.regulatoryBasis} onChange={(e) => setForm({...form, regulatoryBasis: e.target.value})} /></div>
                <div><Label>Demande du marché</Label><Textarea value={form.marketDemand} onChange={(e) => setForm({...form, marketDemand: e.target.value})} /></div>
                <div><Label>Normes applicables</Label><Textarea value={form.applicableStandards} onChange={(e) => setForm({...form, applicableStandards: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Soumettre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Feasibility Dialog */}
          <Dialog open={showFeasibility} onOpenChange={setShowFeasibility}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Résultats de l'étude de faisabilité</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Étude de faisabilité</Label><Textarea value={feasForm.feasibilityStudy} onChange={(e) => setFeasForm({...feasForm, feasibilityStudy: e.target.value})} /></div>
                <div><Label>Nombre d'évaluateurs disponibles</Label><Input type="number" value={feasForm.evaluatorCount} onChange={(e) => setFeasForm({...feasForm, evaluatorCount: e.target.value})} /></div>
                <div><Label>Plan de formation</Label><Textarea value={feasForm.trainingPlan} onChange={(e) => setFeasForm({...feasForm, trainingPlan: e.target.value})} /></div>
                <div><Label>Ressources nécessaires</Label><Textarea value={feasForm.resourceRequirements} onChange={(e) => setFeasForm({...feasForm, resourceRequirements: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFeasibility(false)}>Annuler</Button>
                <Button onClick={handleCompleteFeasibility}>Terminer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DG Decision Dialog */}
          <Dialog open={showDecision} onOpenChange={setShowDecision}>
            <DialogContent>
              <DialogHeader><DialogTitle>Décision de la Direction Générale</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant={decForm.approved ? "default" : "outline"} onClick={() => setDecForm({...decForm, approved: true})} className="flex-1"><CheckCircle className="w-4 h-4 mr-2" />Approuver</Button>
                  <Button variant={!decForm.approved ? "destructive" : "outline"} onClick={() => setDecForm({...decForm, approved: false})} className="flex-1">Rejeter</Button>
                </div>
                <div><Label>Commentaires</Label><Textarea value={decForm.comments} onChange={(e) => setDecForm({...decForm, comments: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button>
                <Button onClick={handleDGDecision}>{decForm.approved ? "Confirmer l'approbation" : "Confirmer le rejet"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
