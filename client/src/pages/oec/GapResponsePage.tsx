import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { StringDateTimePicker } from "@/components/ui/date-time-picker";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Upload, Shield, Clock, Send, AlertTriangle, CheckCircle } from "lucide-react";

/**
 * OEC Gap Response Page — Étape 8 (Traitement des Écarts)
 * OEC submits action plans for accepted gaps within 10-day deadline.
 * Also can submit evidence and contest gaps.
 */
export default function GapResponsePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showActionPlan, setShowActionPlan] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showContest, setShowContest] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);

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
          ["EVALUATION_OEC_ALL_ACCEPTED", "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION",
           "ACTION_PLANS_IMPLEMENTATION", "GAPS_RESOLVED", "EVALUATION_COMPLETED"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadGaps = async (request: any) => {
    setSelectedRequest(request);
    try {
      const [gapsRes, overviewRes] = await Promise.all([
        fetch(`/api/workflow/gaps/by-request/${request.id}`, { credentials: "include" }),
        fetch(`/api/workflow/gap-treatment/overview/${request.id}`, { credentials: "include" }),
      ]);
      if (gapsRes.ok) {
        const gapsData = await gapsRes.json();
        setGaps(Array.isArray(gapsData) ? gapsData : gapsData.data || []);
      }
      if (overviewRes.ok) {
        const ovData = await overviewRes.json();
        if (ovData.success) setOverview(ovData.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmitPlan = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/gap-treatment/gap/${selectedGap.id}/action-plan`, planForm);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Plan d'action soumis", description: data.message });
        setShowActionPlan(false);
        setPlanForm({ correctiveActions: "", preventiveActions: "", responsiblePerson: "", deadline: "", supportingDocuments: "" });
        loadGaps(selectedRequest);
      }
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const handleSubmitEvidence = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/gaps/${selectedGap.id}/submit-action-plan`, {
        ...evidenceForm, implementationEvidence: evidenceForm.evidence,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Preuves soumises" });
        setShowEvidence(false);
        setEvidenceForm({ evidence: "" });
        loadGaps(selectedRequest);
      }
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const handleContest = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      toast({ title: "Contestation enregistrée", description: "Le CD sera notifié pour traitement." });
      setShowContest(false);
      setContestForm({ reason: "" });
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const getGapStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IDENTIFIED: "bg-gray-100 text-gray-800",
      OEC_ACCEPTED: "bg-blue-100 text-blue-800",
      AWAITING_ACTION_PLAN: "bg-orange-100 text-orange-800",
      PLAN_SUBMITTED: "bg-blue-100 text-blue-800",
      PLAN_ACCEPTED: "bg-green-100 text-green-800",
      PLAN_REJECTED: "bg-red-100 text-red-800",
      IMPLEMENTATION: "bg-yellow-100 text-yellow-800",
      EVIDENCE_PROVIDED: "bg-indigo-100 text-indigo-800",
      RESOLVED: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canSubmitPlan = (gap: any) =>
    ["AWAITING_ACTION_PLAN", "PLAN_REJECTED", "OEC_ACCEPTED"].includes(gap.status);
  const canSubmitEvidence = (gap: any) =>
    ["PLAN_ACCEPTED", "IMPLEMENTATION"].includes(gap.status);
  const canContest = (gap: any) =>
    ["AWAITING_ACTION_PLAN", "OEC_ACCEPTED"].includes(gap.status);

  const acceptedGaps = gaps.filter((g: any) => g.oecAccepted === true || ["AWAITING_ACTION_PLAN", "PLAN_SUBMITTED", "PLAN_ACCEPTED", "PLAN_REJECTED", "IMPLEMENTATION", "RESOLVED"].includes(g.status));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Traitement des Écarts — Étape 8</h1>
            <p className="text-muted-foreground mt-1">Soumettez vos plans d'action et preuves de mise en œuvre</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Mes dossiers</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun dossier avec des écarts à traiter</p>
                ) : requests.map((r: any) => (
                  <div key={r.id} onClick={() => loadGaps(r)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50"}`}>
                    <p className="font-medium text-sm">{r.referenceNumber}</p>
                    <Badge variant="outline" className="text-xs mt-1">{r.status?.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Overview stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-3 text-center">
                      <p className="text-xl font-bold">{acceptedGaps.length}</p>
                      <p className="text-xs text-muted-foreground">Écarts à traiter</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-xl font-bold text-red-600">
                        {acceptedGaps.filter((g: any) => g.severity === "CRITICAL" || g.type === "CRITIQUE").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Critiques</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-xl font-bold text-orange-600">
                        {acceptedGaps.filter((g: any) => canSubmitPlan(g)).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Plans à soumettre</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-xl font-bold text-green-600">
                        {acceptedGaps.filter((g: any) => g.status === "RESOLVED").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Soldés</p>
                    </Card>
                  </div>

                  {/* Deadline warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Délai : 10 jours pour soumettre les plans d'action</p>
                      <p className="text-xs text-yellow-600">
                        {overview?.actionPlanDeadline
                          ? `Date limite : ${new Date(overview.actionPlanDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                          : "À compter de la date de clôture de l'évaluation"}
                      </p>
                    </div>
                  </div>

                  {/* Gaps list */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Écarts à Traiter</CardTitle>
                      <CardDescription>{selectedRequest.referenceNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {acceptedGaps.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">Aucun écart à traiter</p>
                      ) : acceptedGaps.map((gap: any) => (
                        <Card key={gap.id} className="p-4 border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant={gap.severity === "CRITICAL" || gap.type === "CRITIQUE" ? "destructive" : "secondary"}>
                                  {gap.severity === "CRITICAL" || gap.type === "CRITIQUE" ? "Critique" : "Non Critique"}
                                </Badge>
                                <Badge className={getGapStatusColor(gap.status)}>
                                  {gap.status?.replace(/_/g, " ")}
                                </Badge>
                                {gap.normReference && <span className="text-xs text-muted-foreground">Réf: {gap.normReference || gap.requirement}</span>}
                              </div>
                              <p className="text-sm">{gap.reeModifiedDescription || gap.description}</p>
                              {gap.evidence && <p className="text-xs text-muted-foreground mt-1">Preuves: {gap.evidence}</p>}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 flex-wrap">
                            {canSubmitPlan(gap) && (
                              <Button size="sm" onClick={() => { setSelectedGap(gap); setShowActionPlan(true); }}>
                                <FileText className="w-3 h-3 mr-1" />Plan d'action
                              </Button>
                            )}
                            {canSubmitEvidence(gap) && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedGap(gap); setShowEvidence(true); }}>
                                <Upload className="w-3 h-3 mr-1" />Preuves
                              </Button>
                            )}
                            {canContest(gap) && (
                              <Button size="sm" variant="outline" className="text-orange-600" onClick={() => {
                                setSelectedGap(gap); setShowContest(true);
                              }}>
                                <Shield className="w-3 h-3 mr-1" />Contester
                              </Button>
                            )}
                          </div>

                          {gap.status === "PLAN_REJECTED" && gap.actionPlan && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-800 mb-1">Plan d'action rejeté</p>
                              {gap.actionPlan.rejectionReason && (
                                <p className="text-xs text-red-700"><strong>Motif :</strong> {gap.actionPlan.rejectionReason}</p>
                              )}
                              <p className="text-xs text-red-600 mt-1 italic">Veuillez soumettre un nouveau plan corrigé.</p>
                            </div>
                          )}
                        </Card>
                      ))}
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
                <DialogTitle>Plan d'action correctif</DialogTitle>
                <DialogDescription>Écart: {selectedGap?.description?.substring(0, 100)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div><Label>Actions correctives *</Label>
                  <Textarea value={planForm.correctiveActions}
                    onChange={(e) => setPlanForm({ ...planForm, correctiveActions: e.target.value })}
                    placeholder="Décrivez les actions correctives..." /></div>
                <div><Label>Actions préventives</Label>
                  <Textarea value={planForm.preventiveActions}
                    onChange={(e) => setPlanForm({ ...planForm, preventiveActions: e.target.value })}
                    placeholder="Actions préventives..." /></div>
                <div><Label>Responsable</Label>
                  <Input value={planForm.responsiblePerson}
                    onChange={(e) => setPlanForm({ ...planForm, responsiblePerson: e.target.value })}
                    placeholder="Nom du responsable" /></div>
                <div><Label>Date limite de mise en œuvre</Label>
                  <StringDateTimePicker value={planForm.deadline}
                    onChange={(v) => setPlanForm({ ...planForm, deadline: v })} /></div>
                <div><Label>Documents de support</Label>
                  <Textarea value={planForm.supportingDocuments}
                    onChange={(e) => setPlanForm({ ...planForm, supportingDocuments: e.target.value })}
                    placeholder="Documents joints..." /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowActionPlan(false)}>Annuler</Button>
                <Button onClick={handleSubmitPlan} disabled={submitting || !planForm.correctiveActions}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Soumettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Evidence Dialog */}
          <Dialog open={showEvidence} onOpenChange={setShowEvidence}>
            <DialogContent>
              <DialogHeader><DialogTitle>Preuves de mise en œuvre</DialogTitle></DialogHeader>
              <div><Label>Preuves</Label>
                <Textarea value={evidenceForm.evidence}
                  onChange={(e) => setEvidenceForm({ evidence: e.target.value })}
                  placeholder="Décrivez les preuves..." className="min-h-[150px]" /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvidence(false)}>Annuler</Button>
                <Button onClick={handleSubmitEvidence} disabled={submitting}>
                  <Upload className="w-4 h-4 mr-2" />Soumettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Contestation Dialog */}
          <Dialog open={showContest} onOpenChange={setShowContest}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contester l'écart</DialogTitle>
                <DialogDescription>Le CD désignera une personne non impliquée pour examiner.</DialogDescription>
              </DialogHeader>
              <div><Label>Motif *</Label>
                <Textarea value={contestForm.reason}
                  onChange={(e) => setContestForm({ reason: e.target.value })}
                  placeholder="Motif de la contestation..." className="min-h-[150px]" /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContest(false)}>Annuler</Button>
                <Button onClick={handleContest} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                  <Shield className="w-4 h-4 mr-2" />Déposer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
