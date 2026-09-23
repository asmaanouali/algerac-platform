import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, CheckCircle, XCircle, FileText, Send, Eye, ShieldCheck, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { consumeDeepLinkedRequest } from "@/lib/ra-resume";

const GAP_STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identifié", AWAITING_ACTION_PLAN: "Att. plan d'action", PLAN_SUBMITTED: "Plan soumis",
  PLAN_ACCEPTED: "Plan accepté", PLAN_REJECTED: "Plan rejeté", IMPLEMENTATION: "Mise en oeuvre",
  EVIDENCE_PROVIDED: "Preuves fournies", PENDING_VERIFICATION: "Vérification en cours", RESOLVED: "Résolu",
  NEEDS_COMPLEMENTARY_EVAL: "Éval. complémentaire requise",
};

const GAP_STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: "bg-gray-100 text-gray-800", AWAITING_ACTION_PLAN: "bg-orange-100 text-orange-800",
  PLAN_SUBMITTED: "bg-blue-100 text-blue-800", PLAN_ACCEPTED: "bg-green-100 text-green-800",
  PLAN_REJECTED: "bg-red-100 text-red-800", IMPLEMENTATION: "bg-yellow-100 text-yellow-800",
  EVIDENCE_PROVIDED: "bg-indigo-100 text-indigo-800", PENDING_VERIFICATION: "bg-cyan-100 text-cyan-800",
  RESOLVED: "bg-emerald-100 text-emerald-800", NEEDS_COMPLEMENTARY_EVAL: "bg-purple-100 text-purple-800",
};

export default function GapsManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [evaluateForm, setEvaluateForm] = useState({ accepted: true, feedback: "", rejectionReason: "" });
  const [verifyForm, setVerifyForm] = useState({ verified: true, comments: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        const filtered = all.filter((r: any) =>
          ["EVALUATION_COMPLETED", "EVALUATION_OEC_ALL_ACCEPTED", "EVALUATION_DOCS_TRANSMITTED",
           "EVALUATION_GAPS_SENT_TO_OEC", "EVALUATION_OEC_REVIEW",
           "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION",
           "ACTION_PLANS_IMPLEMENTATION", "COMPLEMENTARY_EVALUATION_NEEDED",
           "COMPLEMENTARY_EVALUATION_PLANNED", "COMPLEMENTARY_EVALUATION_PROGRESS",
           "GAPS_RESOLVED"].includes(r.status)
        );
        setRequests(filtered);
        consumeDeepLinkedRequest(filtered, (req) => { void selectRequest(req); });
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/site-evaluation/${req.id}/gaps`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setGaps(data.data || []);
      else if (Array.isArray(data)) setGaps(data);
    } catch (e) { }
  };

  const requestActionPlans = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/request-action-plans`, {
        deadline: 10, message: "Veuillez soumettre vos plans d'action pour chaque écart identifié."
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Demande de plans d'action envoyée → l'OEC" });
        selectRequest(selectedRequest);
        loadData();
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const evaluatePlan = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("PUT", `/api/workflow/site-evaluation/gaps/${selectedGap.id}/evaluate-plan`, {
        accepted: evaluateForm.accepted,
        feedback: evaluateForm.feedback,
        rejectionReason: evaluateForm.rejectionReason,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: evaluateForm.accepted ? "Plan d'action accepté" : "Plan d'action rejeté  renvoyé → l'OEC" });
        setShowEvaluate(false);
        setEvaluateForm({ accepted: true, feedback: "", rejectionReason: "" });
        selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const verifyEvidence = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("PUT", `/api/workflow/site-evaluation/gaps/${selectedGap.id}/verify-evidence`, {
        verified: verifyForm.verified, comments: verifyForm.comments,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: verifyForm.verified ? "Preuves vérifiées  écart soldé" : "Preuves insuffisantes" });
        setShowVerify(false);
        setVerifyForm({ verified: true, comments: "" });
        selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  const critiques = gaps.filter((g: any) => g.type === "CRITIQUE");
  const nonCritiques = gaps.filter((g: any) => g.type === "NON_CRITIQUE");
  const resolved = gaps.filter((g: any) => g.status === "RESOLVED");
  const pendingPlans = gaps.filter((g: any) => g.status === "PLAN_SUBMITTED");
  const pendingVerification = gaps.filter((g: any) => ["EVIDENCE_PROVIDED", "PENDING_VERIFICATION"].includes(g.status));
  const canRequestPlans = selectedRequest?.status === "EVALUATION_COMPLETED" && gaps.length > 0;
  const allResolved = gaps.length > 0 && gaps.every((g: any) => g.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Gestion des écarts</h1>
            <p className="text-muted-foreground mt-1">Suivi des non-conformités, plans d'action et vérification des preuves (Étape 8)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: dossier list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.domain}</p>
                      <Badge variant="outline" className="text-xs mt-1">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                  {requests.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier avec écarts</p>}
                </CardContent>
              </Card>

              {/* Main content */}
              <div className="lg:col-span-3 space-y-4">
                {!selectedRequest ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier pour gérer les écarts</p>
                  </CardContent></Card>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Card><CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">{gaps.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </CardContent></Card>
                      <Card><CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{critiques.length}</p>
                        <p className="text-xs text-muted-foreground">Critiques</p>
                      </CardContent></Card>
                      <Card><CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{nonCritiques.length}</p>
                        <p className="text-xs text-muted-foreground">Non-Critiques</p>
                      </CardContent></Card>
                      <Card><CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{pendingPlans.length}</p>
                        <p className="text-xs text-muted-foreground">Plans → Évaluer</p>
                      </CardContent></Card>
                      <Card><CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{resolved.length}</p>
                        <p className="text-xs text-muted-foreground">Résolus</p>
                      </CardContent></Card>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 flex-wrap">
                      {canRequestPlans && (
                        <Button onClick={requestActionPlans} disabled={submitting}>
                          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                          Demander les plans d'action → l'OEC
                        </Button>
                      )}
                      {allResolved && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Tous les écarts sont soldés  prêt pour le rapport</span>
                        </div>
                      )}
                    </div>

                    {/* Gaps table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />écarts & Plans d'Action
                        </CardTitle>
                        <CardDescription>Dossier: {selectedRequest.referenceNumber || selectedRequest.id}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {gaps.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Aucun écart identifié</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Exigence</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gaps.map((gap: any) => (
                                <TableRow key={gap.id}>
                                  <TableCell className="font-mono text-xs">{gap.gapCode}</TableCell>
                                  <TableCell>
                                    <Badge variant={gap.type === "CRITIQUE" ? "destructive" : "secondary"}>
                                      {gap.type === "CRITIQUE" ? "C" : "NC"}
                                      {gap.reclassifiedToCritical && " "}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{gap.requirement}</TableCell>
                                  <TableCell className="text-sm max-w-[200px] truncate">{gap.description}</TableCell>
                                  <TableCell>
                                    <Badge className={GAP_STATUS_COLORS[gap.status] || "bg-gray-100"}>
                                      {GAP_STATUS_LABELS[gap.status] || gap.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" onClick={() => { setSelectedGap(gap); setShowDetail(true); }}>
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      {gap.status === "PLAN_SUBMITTED" && (
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedGap(gap); setEvaluateForm({ accepted: true, feedback: "", rejectionReason: "" }); setShowEvaluate(true); }}>
                                          <FileText className="w-3 h-3 mr-1" />Évaluer
                                        </Button>
                                      )}
                                      {["EVIDENCE_PROVIDED", "PENDING_VERIFICATION"].includes(gap.status) && (
                                        <Button size="sm" variant="outline" className="text-cyan-700" onClick={() => { setSelectedGap(gap); setVerifyForm({ verified: true, comments: "" }); setShowVerify(true); }}>
                                          <ShieldCheck className="w-3 h-3 mr-1" />Vérifier
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
                  </>
                )}
              </div>
            </div>
          )}

          {/* Evaluate Plan Dialog */}
          <Dialog open={showEvaluate} onOpenChange={setShowEvaluate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Évaluer le Plan d'Action</DialogTitle>
                <DialogDescription>écart: {selectedGap?.gapCode}  {selectedGap?.requirement}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={evaluateForm.accepted ? "default" : "outline"} className="flex-1"
                    onClick={() => setEvaluateForm({ ...evaluateForm, accepted: true })}>
                    <CheckCircle className="w-4 h-4 mr-2" />Accepter
                  </Button>
                  <Button variant={!evaluateForm.accepted ? "destructive" : "outline"} className="flex-1"
                    onClick={() => setEvaluateForm({ ...evaluateForm, accepted: false })}>
                    <XCircle className="w-4 h-4 mr-2" />Rejeter
                  </Button>
                </div>
                <div><label className="text-sm font-medium">Commentaires</label>
                  <Textarea value={evaluateForm.feedback} onChange={(e) => setEvaluateForm({ ...evaluateForm, feedback: e.target.value })}
                    placeholder="Vos observations sur le plan d'action..." rows={3} /></div>
                {!evaluateForm.accepted && (
                  <div><label className="text-sm font-medium text-red-600">Raison du rejet *</label>
                    <Textarea value={evaluateForm.rejectionReason} onChange={(e) => setEvaluateForm({ ...evaluateForm, rejectionReason: e.target.value })}
                      placeholder="Motif du rejet du plan d'action..." rows={2} /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvaluate(false)}>Annuler</Button>
                <Button onClick={evaluatePlan} disabled={submitting || (!evaluateForm.accepted && !evaluateForm.rejectionReason)}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {evaluateForm.accepted ? "Accepter le plan" : "Rejeter le plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Verify Evidence Dialog */}
          <Dialog open={showVerify} onOpenChange={setShowVerify}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vérifier les Preuves de Mise en Oeuvre</DialogTitle>
                <DialogDescription>écart: {selectedGap?.gapCode}  {selectedGap?.requirement}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={verifyForm.verified ? "default" : "outline"} className="flex-1"
                    onClick={() => setVerifyForm({ ...verifyForm, verified: true })}>
                    <CheckCircle className="w-4 h-4 mr-2" />Preuves suffisantes
                  </Button>
                  <Button variant={!verifyForm.verified ? "destructive" : "outline"} className="flex-1"
                    onClick={() => setVerifyForm({ ...verifyForm, verified: false })}>
                    <XCircle className="w-4 h-4 mr-2" />Insuffisantes
                  </Button>
                </div>
                <div><label className="text-sm font-medium">Commentaires</label>
                  <Textarea value={verifyForm.comments} onChange={(e) => setVerifyForm({ ...verifyForm, comments: e.target.value })}
                    placeholder="Observations sur les preuves de mise en oeuvre..." rows={3} /></div>
                {selectedGap?.type === "CRITIQUE" && verifyForm.verified && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <strong>Note :</strong> Pour un écart critique, la vérification validée déclenchera une évaluation complémentaire sur site.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVerify(false)}>Annuler</Button>
                <Button onClick={verifyEvidence} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {verifyForm.verified ? "Valider les preuves" : "Demander corrections"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Gap Detail Dialog */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Détail de l'écart {selectedGap?.gapCode}</DialogTitle>
              </DialogHeader>
              {selectedGap && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Type :</strong> <Badge variant={selectedGap.type === "CRITIQUE" ? "destructive" : "secondary"}>
                      {selectedGap.type === "CRITIQUE" ? "Critique" : "Non-Critique"}</Badge></div>
                    <div><strong>Statut :</strong> <Badge className={GAP_STATUS_COLORS[selectedGap.status] || ""}>
                      {GAP_STATUS_LABELS[selectedGap.status] || selectedGap.status}</Badge></div>
                  </div>
                  <div><strong>Exigence :</strong> {selectedGap.requirement}</div>
                  <div><strong>Description :</strong> {selectedGap.description}</div>
                  {selectedGap.evidence && <div><strong>Preuves :</strong> {selectedGap.evidence}</div>}
                  {selectedGap.fOR02Content && <div><strong>Contenu FOR 02 :</strong> {selectedGap.fOR02Content}</div>}
                  {selectedGap.reclassifiedToCritical && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <strong className="text-red-800"> Requalifié en Critique</strong>
                      <p className="text-red-700">{selectedGap.reclassificationReason}</p>
                    </div>
                  )}
                  {selectedGap.identifiedDate && (
                    <div><strong>Date d'identification :</strong> {new Date(selectedGap.identifiedDate).toLocaleDateString("fr-FR")}</div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
