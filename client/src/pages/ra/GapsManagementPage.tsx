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
import { Loader2, AlertTriangle, CheckCircle, XCircle, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GapsManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [evaluateForm, setEvaluateForm] = useState({ accepted: true, feedback: "", rejectionReason: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) =>
          ["EVALUATION_COMPLETED", "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION", "ACTION_PLANS_IMPLEMENTATION", "GAPS_RESOLVED"].includes(r.status)
        ));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/gaps/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) setGaps(await res.json());
    } catch (e) { console.error(e); }
  };

  const evaluatePlan = async () => {
    try {
      const res = await apiRequest("POST", `/api/workflow/gaps/${selectedGap.id}/evaluate-plan`, {
        accepted: evaluateForm.accepted,
        feedback: evaluateForm.feedback,
        rejectionReason: evaluateForm.rejectionReason,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: evaluateForm.accepted ? "Plan d'action accepté" : "Plan d'action rejeté" });
        setShowEvaluate(false);
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const gapTypeLabels: Record<string, { label: string; variant: "destructive" | "secondary" }> = {
    CRITIQUE: { label: "Critique (C)", variant: "destructive" },
    NON_CRITIQUE: { label: "Non-Critique (NC)", variant: "secondary" },
  };

  const gapStatusLabels: Record<string, string> = {
    IDENTIFIED: "Identifié", AWAITING_ACTION_PLAN: "Attente plan", PLAN_SUBMITTED: "Plan soumis",
    PLAN_ACCEPTED: "Plan accepté", PLAN_REJECTED: "Plan rejeté", IMPLEMENTATION: "Mise en œuvre",
    EVIDENCE_PROVIDED: "Preuves fournies", PENDING_VERIFICATION: "Vérification", RESOLVED: "Résolu",
    NEEDS_COMPLEMENTARY_EVAL: "Éval. complémentaire",
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Gestion des Écarts</h1>
            <p className="text-muted-foreground mt-1">Suivi des non-conformités et plans d'action (Étape 8)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.domain}</p>
                    </div>
                  ))}
                  {requests.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier avec écarts</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg"><AlertTriangle className="inline w-5 h-5 mr-2" />Écarts & Plans d'Action</CardTitle>
                  <CardDescription>{selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Sélectionnez un dossier"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : gaps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun écart identifié pour ce dossier</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card><CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold text-red-600">{gaps.filter((g: any) => g.type === "CRITIQUE").length}</p>
                          <p className="text-xs text-muted-foreground">Critiques</p>
                        </CardContent></Card>
                        <Card><CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold text-amber-600">{gaps.filter((g: any) => g.type === "NON_CRITIQUE").length}</p>
                          <p className="text-xs text-muted-foreground">Non-Critiques</p>
                        </CardContent></Card>
                        <Card><CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{gaps.filter((g: any) => g.status === "RESOLVED").length}</p>
                          <p className="text-xs text-muted-foreground">Résolus</p>
                        </CardContent></Card>
                      </div>

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
                                <Badge variant={gapTypeLabels[gap.type]?.variant || "secondary"}>
                                  {gapTypeLabels[gap.type]?.label || gap.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{gap.requirement}</TableCell>
                              <TableCell className="text-sm max-w-[200px] truncate">{gap.description}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{gapStatusLabels[gap.status] || gap.status}</Badge>
                              </TableCell>
                              <TableCell>
                                {gap.status === "PLAN_SUBMITTED" && (
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedGap(gap); setShowEvaluate(true); }}>
                                    <FileText className="w-3 h-3 mr-1" />Évaluer
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={showEvaluate} onOpenChange={setShowEvaluate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Évaluer le Plan d'Action</DialogTitle>
                <DialogDescription>Écart: {selectedGap?.gapCode} — {selectedGap?.requirement}</DialogDescription>
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
                  <div><label className="text-sm font-medium">Raison du rejet</label>
                    <Textarea value={evaluateForm.rejectionReason} onChange={(e) => setEvaluateForm({ ...evaluateForm, rejectionReason: e.target.value })}
                      placeholder="Raison du rejet du plan d'action..." rows={2} /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvaluate(false)}>Annuler</Button>
                <Button onClick={evaluatePlan}>{evaluateForm.accepted ? "Accepter" : "Rejeter"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
