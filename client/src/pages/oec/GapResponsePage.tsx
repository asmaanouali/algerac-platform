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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, FileText, CheckCircle, Upload, Shield, Clock, Send } from "lucide-react";

export default function GapResponsePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showContest, setShowContest] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [actionPlanData, setActionPlanData] = useState<any>(null);

  // Forms
  const [planForm, setPlanForm] = useState({
    correctiveActions: "", preventiveActions: "", responsiblePerson: "",
    deadline: "", supportingDocuments: ""
  });
  const [evidenceForm, setEvidenceForm] = useState({ evidence: "" });
  const [contestForm, setContestForm] = useState({ reason: "" });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["EVALUATION_COMPLETED", "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION",
           "ACTION_PLANS_IMPLEMENTATION", "GAPS_RESOLVED"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadGaps = async (request: any) => {
    setSelectedRequest(request);
    try {
      const res = await fetch(`/api/workflow/site-evaluation/${request.id}/gaps`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setGaps(data.data || []);
    } catch (err) { console.error(err); }
  };

  const loadActionPlan = async (gap: any) => {
    try {
      const res = await fetch(`/api/workflow/site-evaluation/gaps/${gap.id}/action-plan`, { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) {
        setActionPlanData(data.data);
      } else {
        setActionPlanData(null);
      }
    } catch (err) {
      setActionPlanData(null);
    }
  };

  const handleSubmitPlan = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/gaps/${selectedGap.id}/action-plan`, planForm);
      toast({ title: "Plan d'action soumis avec succès" });
      setShowActionPlan(false);
      setPlanForm({ correctiveActions: "", preventiveActions: "", responsiblePerson: "", deadline: "", supportingDocuments: "" });
      loadGaps(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmitEvidence = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/gaps/${selectedGap.id}/evidence`, evidenceForm);
      toast({ title: "Preuves soumises avec succès" });
      setShowEvidence(false);
      setEvidenceForm({ evidence: "" });
      loadGaps(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleContest = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/gaps/${selectedGap.id}/contest`, contestForm);
      toast({ title: "Contestation déposée" });
      setShowContest(false);
      setContestForm({ reason: "" });
      loadGaps(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const openPlanDialog = (gap: any) => {
    setSelectedGap(gap);
    setShowActionPlan(true);
  };

  const openEvidenceDialog = (gap: any) => {
    setSelectedGap(gap);
    setShowEvidence(true);
  };

  const openContestDialog = (gap: any) => {
    setSelectedGap(gap);
    setShowContest(true);
  };

  const getGapStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IDENTIFIED: "bg-gray-100 text-gray-800",
      AWAITING_ACTION_PLAN: "bg-orange-100 text-orange-800",
      PLAN_SUBMITTED: "bg-blue-100 text-blue-800",
      PLAN_ACCEPTED: "bg-green-100 text-green-800",
      PLAN_REJECTED: "bg-red-100 text-red-800",
      IMPLEMENTATION: "bg-yellow-100 text-yellow-800",
      EVIDENCE_PROVIDED: "bg-indigo-100 text-indigo-800",
      RESOLVED: "bg-emerald-100 text-emerald-800",
      NEEDS_COMPLEMENTARY_EVAL: "bg-purple-100 text-purple-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canSubmitPlan = (gap: any) =>
    ["IDENTIFIED", "AWAITING_ACTION_PLAN", "PLAN_REJECTED"].includes(gap.status);
  
  const canSubmitEvidence = (gap: any) =>
    ["PLAN_ACCEPTED", "IMPLEMENTATION"].includes(gap.status);
  
  const canContest = (gap: any) =>
    ["IDENTIFIED", "AWAITING_ACTION_PLAN"].includes(gap.status);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Réponse aux Écarts</h1>
            <p className="text-muted-foreground">Soumettre vos plans d'action et preuves de mise en œuvre</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Request list */}
            <div className="lg:col-span-1 space-y-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Mes dossiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier avec des écarts</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => loadGaps(r)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-sm">{r.referenceNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.currentStep}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Gaps detail */}
            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold">{gaps.length}</p>
                      <p className="text-xs text-muted-foreground">Total écarts</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {gaps.filter((g: any) => g.type === "CRITIQUE").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Critiques</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {gaps.filter((g: any) => canSubmitPlan(g)).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Plans à soumettre</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {gaps.filter((g: any) => g.status === "RESOLVED").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Soldés</p>
                    </Card>
                  </div>

                  {/* Deadline warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Délai : 10 jours pour soumettre les plans d'action
                      </p>
                      <p className="text-xs text-yellow-600">
                        À compter de la date de clôture de l'évaluation
                      </p>
                    </div>
                  </div>

                  {/* Gaps table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Écarts identifiés</CardTitle>
                      <CardDescription>{selectedRequest.referenceNumber}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {gaps.map((gap: any) => (
                          <Card key={gap.id} className="p-4 border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-medium text-sm">{gap.gapCode}</span>
                                  <Badge className={gap.type === "CRITIQUE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                    {gap.type === "CRITIQUE" ? "Critique" : "Non Critique"}
                                  </Badge>
                                  <Badge className={getGapStatusColor(gap.status)}>
                                    {gap.status?.replace(/_/g, " ")}
                                  </Badge>
                                  {gap.reclassifiedToCritical && (
                                    <Badge className="bg-red-200 text-red-900">⚠ Requalifié</Badge>
                                  )}
                                </div>
                                <p className="text-sm"><strong>Exigence:</strong> {gap.requirement}</p>
                                <p className="text-sm text-muted-foreground">{gap.description}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              {canSubmitPlan(gap) && (
                                <Button size="sm" onClick={() => openPlanDialog(gap)}>
                                  <FileText className="w-3 h-3 mr-1" />Plan d'action
                                </Button>
                              )}
                              {canSubmitEvidence(gap) && (
                                <Button size="sm" variant="outline" onClick={() => openEvidenceDialog(gap)}>
                                  <Upload className="w-3 h-3 mr-1" />Preuves
                                </Button>
                              )}
                              {canContest(gap) && (
                                <Button size="sm" variant="outline" className="text-orange-600" onClick={() => openContestDialog(gap)}>
                                  <Shield className="w-3 h-3 mr-1" />Contester
                                </Button>
                              )}
                            </div>

                            {gap.reclassificationReason && (
                              <p className="text-xs text-red-600 mt-2 italic">
                                Requalification: {gap.reclassificationReason}
                              </p>
                            )}

                            {/* Show rejection feedback when plan was rejected */}
                            {gap.status === "PLAN_REJECTED" && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs font-semibold text-red-800 mb-1">⚠ Plan d'action rejeté</p>
                                {gap.actionPlan?.rejectionReason && (
                                  <p className="text-xs text-red-700"><strong>Motif :</strong> {gap.actionPlan.rejectionReason}</p>
                                )}
                                {gap.actionPlan?.teamFeedback && (
                                  <p className="text-xs text-red-700 mt-1"><strong>Commentaires :</strong> {gap.actionPlan.teamFeedback}</p>
                                )}
                                <p className="text-xs text-red-600 mt-1 italic">
                                  Veuillez soumettre un nouveau plan d'action corrigé.
                                </p>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Action Plan Dialog */}
          <Dialog open={showActionPlan} onOpenChange={setShowActionPlan}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Plan d'action — {selectedGap?.gapCode}</DialogTitle>
                <DialogDescription>
                  Écart: {selectedGap?.description?.substring(0, 100)}...
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Actions correctives *</Label>
                  <Textarea value={planForm.correctiveActions}
                    onChange={(e) => setPlanForm({ ...planForm, correctiveActions: e.target.value })}
                    placeholder="Décrivez les actions correctives..." />
                </div>
                <div>
                  <Label>Actions préventives</Label>
                  <Textarea value={planForm.preventiveActions}
                    onChange={(e) => setPlanForm({ ...planForm, preventiveActions: e.target.value })}
                    placeholder="Décrivez les actions préventives..." />
                </div>
                <div>
                  <Label>Responsable de mise en œuvre</Label>
                  <Input value={planForm.responsiblePerson}
                    onChange={(e) => setPlanForm({ ...planForm, responsiblePerson: e.target.value })}
                    placeholder="Nom du responsable" />
                </div>
                <div>
                  <Label>Date limite de mise en œuvre</Label>
                  <Input type="datetime-local" value={planForm.deadline}
                    onChange={(e) => setPlanForm({ ...planForm, deadline: e.target.value })} />
                </div>
                <div>
                  <Label>Documents de support</Label>
                  <Textarea value={planForm.supportingDocuments}
                    onChange={(e) => setPlanForm({ ...planForm, supportingDocuments: e.target.value })}
                    placeholder="Références des documents joints..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowActionPlan(false)}>Annuler</Button>
                <Button onClick={handleSubmitPlan}>
                  <Send className="w-4 h-4 mr-2" />Soumettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Evidence Dialog */}
          <Dialog open={showEvidence} onOpenChange={setShowEvidence}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Preuves de mise en œuvre — {selectedGap?.gapCode}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Preuves de mise en œuvre</Label>
                  <Textarea value={evidenceForm.evidence}
                    onChange={(e) => setEvidenceForm({ evidence: e.target.value })}
                    placeholder="Décrivez les preuves de l'implémentation des actions correctives..."
                    className="min-h-[150px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvidence(false)}>Annuler</Button>
                <Button onClick={handleSubmitEvidence}>
                  <Upload className="w-4 h-4 mr-2" />Soumettre les preuves
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Contestation Dialog */}
          <Dialog open={showContest} onOpenChange={setShowContest}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Contester l'écart — {selectedGap?.gapCode}</DialogTitle>
                <DialogDescription>
                  Déposez une contestation formelle. Le CD désignera une personne non impliquée pour l'examiner.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif de la contestation *</Label>
                  <Textarea value={contestForm.reason}
                    onChange={(e) => setContestForm({ reason: e.target.value })}
                    placeholder="Expliquez pourquoi vous contestez cet écart..."
                    className="min-h-[150px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContest(false)}>Annuler</Button>
                <Button onClick={handleContest} className="bg-orange-600 hover:bg-orange-700">
                  <Shield className="w-4 h-4 mr-2" />Déposer la contestation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
