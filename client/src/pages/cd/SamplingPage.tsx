import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Beaker, Plus, CheckCircle, Clock, Send, XCircle, FileSearch, Target
} from "lucide-react";

interface SamplingPlan {
  id: number;
  planCode: string;
  planType: string;
  methodology: string;
  totalMethodsInScope: number;
  selectedMethodsCount: number;
  selectedMethods: string;
  totalSitesInScope: number;
  selectedSitesCount: number;
  selectedSites: string;
  selectionCriteria: string;
  riskFactors: string;
  justification: string;
  status: string;
  approvalComments: string;
  createdAt: string;
}

export default function SamplingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SamplingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SamplingPlan | null>(null);

  const [form, setForm] = useState({
    requestId: "", planType: "LABORATORY", methodology: "",
    totalMethods: "", selectedMethods: "", selectedMethodsDetail: "",
    totalSites: "", selectedSites: "", selectedSitesDetail: "",
    selectionCriteria: "", riskFactors: "", justification: ""
  });
  const [reviewForm, setReviewForm] = useState({ approved: true, comments: "" });

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch("/api/sampling/request/0", { credentials: "include" });
      const data = await res.json();
      setPlans(data.data || []);
    } catch { setPlans([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/sampling", {
        ...form,
        requestId: parseInt(form.requestId),
        totalMethods: form.totalMethods ? parseInt(form.totalMethods) : null,
        selectedMethods: form.selectedMethods ? parseInt(form.selectedMethods) : null,
        totalSites: form.totalSites ? parseInt(form.totalSites) : null,
        selectedSites: form.selectedSites ? parseInt(form.selectedSites) : null,
      });
      toast({ title: "Plan d'échantillonnage créé" });
      setShowCreate(false);
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmit = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/sampling/${planId}/submit`, {});
      toast({ title: "Plan soumis au CD" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleReview = async () => {
    if (!selectedPlan) return;
    try {
      await apiRequest("PUT", `/api/sampling/${selectedPlan.id}/review`, reviewForm);
      toast({ title: reviewForm.approved ? "Plan approuvé" : "Modifications demandées" });
      setShowReview(false);
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleApply = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/sampling/${planId}/apply`, {});
      toast({ title: "Plan appliqué" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Brouillon" },
      SUBMITTED_TO_CD: { color: "bg-blue-100 text-blue-800", label: "Soumis au CD" },
      CD_APPROVED: { color: "bg-green-100 text-green-800", label: "Approuvé" },
      CD_CHANGES_REQUESTED: { color: "bg-yellow-100 text-yellow-800", label: "Modifications demandées" },
      APPLIED: { color: "bg-emerald-100 text-emerald-800", label: "Appliqué" },
      SUPERSEDED: { color: "bg-purple-100 text-purple-800", label: "Remplacé" },
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
                <Beaker className="w-6 h-6 text-primary" />
                Échantillonnage — PRO 13-1
              </h1>
              <p className="text-muted-foreground">Plans d'échantillonnage pour les évaluations</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />Nouveau plan
            </Button>
          </div>

          {/* Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>Plans d'échantillonnage ({plans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-center py-8">Chargement...</p> :
               plans.length === 0 ? <p className="text-muted-foreground text-center py-8">Aucun plan</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Méthodes</TableHead>
                      <TableHead>Sites</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.planCode}</TableCell>
                        <TableCell>{p.planType?.replace(/_/g, " ")}</TableCell>
                        <TableCell>{p.selectedMethodsCount}/{p.totalMethodsInScope}</TableCell>
                        <TableCell>{p.selectedSitesCount}/{p.totalSitesInScope}</TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {p.status === "DRAFT" && (
                              <Button size="sm" variant="outline" onClick={() => handleSubmit(p.id)}>
                                <Send className="w-3 h-3 mr-1" />Soumettre
                              </Button>
                            )}
                            {p.status === "SUBMITTED_TO_CD" && (
                              <Button size="sm" onClick={() => { setSelectedPlan(p); setShowReview(true); }}>
                                <FileSearch className="w-3 h-3 mr-1" />Examiner
                              </Button>
                            )}
                            {p.status === "CD_APPROVED" && (
                              <Button size="sm" onClick={() => handleApply(p.id)}>
                                <Target className="w-3 h-3 mr-1" />Appliquer
                              </Button>
                            )}
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau plan d'échantillonnage</DialogTitle>
                <DialogDescription>Définir les méthodes et sites à évaluer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>ID de la demande</Label>
                    <Input type="number" value={form.requestId} onChange={(e) => setForm({...form, requestId: e.target.value})} /></div>
                  <div><Label>Type de plan</Label>
                    <Select value={form.planType} onValueChange={(v) => setForm({...form, planType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                        <SelectItem value="MEDICAL_LAB">Laboratoire médical</SelectItem>
                        <SelectItem value="CALIBRATION">Étalonnage</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div><Label>Méthodologie</Label>
                  <Textarea value={form.methodology} onChange={(e) => setForm({...form, methodology: e.target.value})} placeholder="Décrire la méthodologie d'échantillonnage..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Méthodes totales</Label><Input type="number" value={form.totalMethods} onChange={(e) => setForm({...form, totalMethods: e.target.value})} /></div>
                  <div><Label>Méthodes sélectionnées</Label><Input type="number" value={form.selectedMethods} onChange={(e) => setForm({...form, selectedMethods: e.target.value})} /></div>
                </div>
                <div><Label>Détail des méthodes sélectionnées</Label>
                  <Textarea value={form.selectedMethodsDetail} onChange={(e) => setForm({...form, selectedMethodsDetail: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Sites totaux</Label><Input type="number" value={form.totalSites} onChange={(e) => setForm({...form, totalSites: e.target.value})} /></div>
                  <div><Label>Sites sélectionnés</Label><Input type="number" value={form.selectedSites} onChange={(e) => setForm({...form, selectedSites: e.target.value})} /></div>
                </div>
                <div><Label>Critères de sélection</Label>
                  <Textarea value={form.selectionCriteria} onChange={(e) => setForm({...form, selectionCriteria: e.target.value})} /></div>
                <div><Label>Facteurs de risque</Label>
                  <Textarea value={form.riskFactors} onChange={(e) => setForm({...form, riskFactors: e.target.value})} /></div>
                <div><Label>Justification</Label>
                  <Textarea value={form.justification} onChange={(e) => setForm({...form, justification: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Créer le plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Review Dialog */}
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Examiner le plan {selectedPlan?.planCode}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Décision</Label>
                  <Select value={reviewForm.approved ? "true" : "false"} onValueChange={(v) => setReviewForm({...reviewForm, approved: v === "true"})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Approuver</SelectItem>
                      <SelectItem value="false">Demander des modifications</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label>Commentaires</Label>
                  <Textarea value={reviewForm.comments} onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                <Button onClick={handleReview}>{reviewForm.approved ? "Approuver" : "Demander modifications"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
