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
import { Loader2, AlertTriangle, CheckCircle, XCircle, FileText, ShieldCheck, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const GAP_STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identifié", AWAITING_ACTION_PLAN: "Att. plan", PLAN_SUBMITTED: "Plan soumis",
  PLAN_ACCEPTED: "Plan accepté", PLAN_REJECTED: "Plan rejeté", IMPLEMENTATION: "Mise en œuvre",
  EVIDENCE_PROVIDED: "Preuves fournies", PENDING_VERIFICATION: "Vérification", RESOLVED: "Résolu",
  NEEDS_COMPLEMENTARY_EVAL: "Éval. complémentaire",
};

const GAP_STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: "bg-gray-100 text-gray-800", AWAITING_ACTION_PLAN: "bg-orange-100 text-orange-800",
  PLAN_SUBMITTED: "bg-blue-100 text-blue-800", PLAN_ACCEPTED: "bg-green-100 text-green-800",
  PLAN_REJECTED: "bg-red-100 text-red-800", IMPLEMENTATION: "bg-yellow-100 text-yellow-800",
  EVIDENCE_PROVIDED: "bg-indigo-100 text-indigo-800", PENDING_VERIFICATION: "bg-cyan-100 text-cyan-800",
  RESOLVED: "bg-emerald-100 text-emerald-800", NEEDS_COMPLEMENTARY_EVAL: "bg-purple-100 text-purple-800",
};

export default function GapEvaluationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [evaluateForm, setEvaluateForm] = useState({ accepted: true, feedback: "", rejectionReason: "" });
  const [verifyForm, setVerifyForm] = useState({ verified: true, comments: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.filter((t: any) => t.commitmentSigned));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    try {
      const res = await fetch(`/api/workflow/site-evaluation/${team.requestId}/gaps`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setGaps(data.data || []);
      else if (Array.isArray(data)) setGaps(data);
    } catch (e) { }
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
        toast({ title: "Succès", description: evaluateForm.accepted ? "Plan d'action accepté" : "Plan d'action rejeté" });
        setShowEvaluate(false);
        setEvaluateForm({ accepted: true, feedback: "", rejectionReason: "" });
        selectTeam(selectedTeam);
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
        toast({ title: "Succès", description: verifyForm.verified ? "Preuves vérifiées — écart soldé" : "Preuves insuffisantes" });
        setShowVerify(false);
        setVerifyForm({ verified: true, comments: "" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  const pendingPlans = gaps.filter((g: any) => g.status === "PLAN_SUBMITTED");
  const pendingVerify = gaps.filter((g: any) => ["EVIDENCE_PROVIDED", "PENDING_VERIFICATION"].includes(g.status));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Évaluation des Plans d'Action</h1>
            <p className="text-muted-foreground mt-1">Évaluez les plans d'action soumis par l'OEC et vérifiez les preuves de mise en œuvre</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Mes Missions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{t.requestReferenceNumber || `Équipe #${t.teamId}`}</p>
                      <Badge variant="outline" className="text-xs mt-1">{t.role}</Badge>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucune mission active</p>}
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-4">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez une mission pour voir les écarts</p>
                  </CardContent></Card>
                ) : (
                  <>
                    {/* Summary badges */}
                    <div className="flex gap-3 flex-wrap">
                      {pendingPlans.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                          <FileText className="w-3 h-3 mr-1" />{pendingPlans.length} plan(s) à évaluer
                        </Badge>
                      )}
                      {pendingVerify.length > 0 && (
                        <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                          <ShieldCheck className="w-3 h-3 mr-1" />{pendingVerify.length} preuve(s) à vérifier
                        </Badge>
                      )}
                      {gaps.length > 0 && pendingPlans.length === 0 && pendingVerify.length === 0 && (
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />Aucune action en attente
                        </Badge>
                      )}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />Écarts — {selectedTeam.requestReferenceNumber}
                        </CardTitle>
                        <CardDescription>{gaps.length} écart(s) identifié(s)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {gaps.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Aucun écart pour cette mission</p>
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
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{gap.requirement}</TableCell>
                                  <TableCell className="text-sm max-w-[180px] truncate">{gap.description}</TableCell>
                                  <TableCell>
                                    <Badge className={GAP_STATUS_COLORS[gap.status] || "bg-gray-100"}>
                                      {GAP_STATUS_LABELS[gap.status] || gap.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {gap.status === "PLAN_SUBMITTED" && (
                                        <Button size="sm" onClick={() => {
                                          setSelectedGap(gap);
                                          setEvaluateForm({ accepted: true, feedback: "", rejectionReason: "" });
                                          setShowEvaluate(true);
                                        }}>
                                          <FileText className="w-3 h-3 mr-1" />Évaluer
                                        </Button>
                                      )}
                                      {["EVIDENCE_PROVIDED", "PENDING_VERIFICATION"].includes(gap.status) && (
                                        <Button size="sm" variant="outline" onClick={() => {
                                          setSelectedGap(gap);
                                          setVerifyForm({ verified: true, comments: "" });
                                          setShowVerify(true);
                                        }}>
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
                <div><label className="text-sm font-medium">Commentaires techniques</label>
                  <Textarea value={evaluateForm.feedback} onChange={(e) => setEvaluateForm({ ...evaluateForm, feedback: e.target.value })}
                    placeholder="Votre analyse technique du plan d'action proposé..." rows={3} /></div>
                {!evaluateForm.accepted && (
                  <div><label className="text-sm font-medium text-red-600">Raison du rejet *</label>
                    <Textarea value={evaluateForm.rejectionReason} onChange={(e) => setEvaluateForm({ ...evaluateForm, rejectionReason: e.target.value })}
                      placeholder="Justification technique du rejet..." rows={2} /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvaluate(false)}>Annuler</Button>
                <Button onClick={evaluatePlan} disabled={submitting || (!evaluateForm.accepted && !evaluateForm.rejectionReason)}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {evaluateForm.accepted ? "Accepter" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Verify Evidence Dialog */}
          <Dialog open={showVerify} onOpenChange={setShowVerify}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vérifier les Preuves</DialogTitle>
                <DialogDescription>Écart: {selectedGap?.gapCode}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={verifyForm.verified ? "default" : "outline"} className="flex-1"
                    onClick={() => setVerifyForm({ ...verifyForm, verified: true })}>
                    <CheckCircle className="w-4 h-4 mr-2" />Suffisantes
                  </Button>
                  <Button variant={!verifyForm.verified ? "destructive" : "outline"} className="flex-1"
                    onClick={() => setVerifyForm({ ...verifyForm, verified: false })}>
                    <XCircle className="w-4 h-4 mr-2" />Insuffisantes
                  </Button>
                </div>
                <div><label className="text-sm font-medium">Commentaires</label>
                  <Textarea value={verifyForm.comments} onChange={(e) => setVerifyForm({ ...verifyForm, comments: e.target.value })}
                    placeholder="Analyse des preuves de mise en œuvre..." rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVerify(false)}>Annuler</Button>
                <Button onClick={verifyEvidence} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {verifyForm.verified ? "Valider" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
