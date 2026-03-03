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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Bell, CheckCircle2, XCircle, AlertTriangle, Clock, ThumbsUp, ThumbsDown,
  RefreshCw, FileText, ArrowRight
} from "lucide-react";

/**
 * Gap Treatment Page — Étape 8
 * Used by REE/Team to:
 * - View overview & deadlines
 * - Send reminders to OEC if late
 * - Evaluate action plans (accept/reject)
 * - Mark gaps as resolved
 * Also by CD for complementary evaluation trigger.
 */
export default function GapTreatmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showEvaluateDialog, setShowEvaluateDialog] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [evaluateAccept, setEvaluateAccept] = useState(true);
  const [evaluateFeedback, setEvaluateFeedback] = useState("");

  const isCD = user?.role === "CD";
  const isREE = !isCD; // REE or other team member

  useEffect(() => {
    if (isCD) {
      loadCDRequests();
    } else {
      loadTeams();
    }
  }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.filter((t: any) => t.commitmentSigned));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadCDRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION", "ACTION_PLANS_IMPLEMENTATION",
           "EVALUATION_OEC_ALL_ACCEPTED", "GAPS_RESOLVED"].includes(r.status)
        );
        setTeams(relevant.map((r: any) => ({ id: r.id, requestId: r.id, requestReferenceNumber: r.referenceNumber, role: "CD" })));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    try {
      const reqId = team.requestId || team.id;
      const [gapsRes, overviewRes] = await Promise.all([
        fetch(`/api/workflow/gaps/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/gap-treatment/overview/${reqId}`, { credentials: "include" }),
      ]);
      if (gapsRes.ok) {
        const gapsData = await gapsRes.json();
        setGaps(Array.isArray(gapsData) ? gapsData : gapsData.data || []);
      }
      if (overviewRes.ok) {
        const ovData = await overviewRes.json();
        if (ovData.success) setOverview(ovData.data);
      }
    } catch (e) { console.error(e); }
  };

  const sendReminder = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId || selectedTeam.id;
      const res = await apiRequest("POST", `/api/workflow/gap-treatment/send-reminder/${reqId}`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Rappel envoyé", description: data.message });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const evaluatePlan = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/gap-treatment/gap/${selectedGap.id}/evaluate-plan`, {
        accepted: evaluateAccept,
        feedback: evaluateFeedback,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: evaluateAccept ? "Plan accepté" : "Plan rejeté", description: data.message });
        setShowEvaluateDialog(false);
        setEvaluateFeedback("");
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const resolveGap = async (gapId: number) => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/gap-treatment/gap/${gapId}/resolve`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Écart soldé", description: data.message });
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const triggerComplementaryEval = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId || selectedTeam.id;
      const res = await apiRequest("POST", `/api/workflow/gap-treatment/complementary-evaluation/${reqId}`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Évaluation complémentaire", description: data.message });
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  if (!user) return null;

  const activeGaps = gaps.filter((g: any) => g.oecAccepted === true || ["AWAITING_ACTION_PLAN", "PLAN_SUBMITTED", "PLAN_ACCEPTED", "PLAN_REJECTED", "IMPLEMENTATION", "EVIDENCE_PROVIDED", "RESOLVED"].includes(g.status));
  const awaitingPlan = activeGaps.filter((g: any) => ["AWAITING_ACTION_PLAN", "OEC_ACCEPTED"].includes(g.status));
  const planSubmitted = activeGaps.filter((g: any) => g.status === "PLAN_SUBMITTED");
  const planAccepted = activeGaps.filter((g: any) => ["PLAN_ACCEPTED", "IMPLEMENTATION"].includes(g.status));
  const resolved = activeGaps.filter((g: any) => g.status === "RESOLVED");

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      AWAITING_ACTION_PLAN: "bg-orange-100 text-orange-800",
      OEC_ACCEPTED: "bg-blue-100 text-blue-800",
      PLAN_SUBMITTED: "bg-blue-100 text-blue-800",
      PLAN_ACCEPTED: "bg-green-100 text-green-800",
      PLAN_REJECTED: "bg-red-100 text-red-800",
      IMPLEMENTATION: "bg-yellow-100 text-yellow-800",
      EVIDENCE_PROVIDED: "bg-indigo-100 text-indigo-800",
      RESOLVED: "bg-emerald-100 text-emerald-800",
    };
    return m[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Traitement des Écarts — Étape 8 {isCD && "(CD)"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCD ? "Suivi et évaluation complémentaire" : "Suivi des plans d'action, évaluation et résolution"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">{isCD ? "Dossiers" : "Missions"}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{t.requestReferenceNumber || `Dossier #${t.requestId || t.id}`}</p>
                      <Badge variant="outline" className="text-xs mt-1">{t.role || "CD"}</Badge>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier</p>}
                </CardContent>
              </Card>

              {/* Main */}
              <div className="lg:col-span-3">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Card className="p-3 text-center">
                        <p className="text-xl font-bold">{activeGaps.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </Card>
                      <Card className="p-3 text-center bg-orange-50">
                        <p className="text-xl font-bold text-orange-600">{awaitingPlan.length}</p>
                        <p className="text-xs text-muted-foreground">En attente plan</p>
                      </Card>
                      <Card className="p-3 text-center bg-blue-50">
                        <p className="text-xl font-bold text-blue-600">{planSubmitted.length}</p>
                        <p className="text-xs text-muted-foreground">Plans soumis</p>
                      </Card>
                      <Card className="p-3 text-center bg-yellow-50">
                        <p className="text-xl font-bold text-yellow-600">{planAccepted.length}</p>
                        <p className="text-xs text-muted-foreground">En mise en œuvre</p>
                      </Card>
                      <Card className="p-3 text-center bg-green-50">
                        <p className="text-xl font-bold text-green-600">{resolved.length}</p>
                        <p className="text-xs text-muted-foreground">Soldés</p>
                      </Card>
                    </div>

                    {/* Deadline info */}
                    {overview?.actionPlanDeadline && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800">
                            Date limite plans d'action : {new Date(overview.actionPlanDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          {overview?.maxDeadline && (
                            <p className="text-xs text-yellow-600">
                              Délai max (6 mois) : {new Date(overview.maxDeadline).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        {isREE && awaitingPlan.length > 0 && (
                          <Button size="sm" variant="outline" className="text-amber-700 border-amber-400" onClick={sendReminder} disabled={submitting}>
                            <Bell className="w-3 h-3 mr-1" />Envoyer rappel OEC
                          </Button>
                        )}
                      </div>
                    )}

                    {/* CD: Complementary evaluation button */}
                    {isCD && (
                      <Card className="border-purple-200 bg-purple-50/50">
                        <CardContent className="pt-4 pb-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-purple-800">Évaluation complémentaire</h4>
                            <p className="text-xs text-purple-600">Déclencher une évaluation complémentaire si nécessaire</p>
                          </div>
                          <Button variant="outline" className="border-purple-300 text-purple-700" onClick={triggerComplementaryEval} disabled={submitting}>
                            <RefreshCw className="w-4 h-4 mr-2" />Déclencher
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tabs: By status */}
                    <Tabs defaultValue="all">
                      <TabsList>
                        <TabsTrigger value="all">Tous ({activeGaps.length})</TabsTrigger>
                        <TabsTrigger value="pending">En attente ({awaitingPlan.length})</TabsTrigger>
                        <TabsTrigger value="submitted">Plans soumis ({planSubmitted.length})</TabsTrigger>
                        <TabsTrigger value="resolved">Soldés ({resolved.length})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        <GapList gaps={activeGaps} getStatusColor={getStatusColor}
                          onEvaluate={(g: any, accept: boolean) => { setSelectedGap(g); setEvaluateAccept(accept); setShowEvaluateDialog(true); }}
                          onResolve={resolveGap} isREE={isREE} submitting={submitting} />
                      </TabsContent>
                      <TabsContent value="pending">
                        <GapList gaps={awaitingPlan} getStatusColor={getStatusColor}
                          onEvaluate={(g: any, accept: boolean) => { setSelectedGap(g); setEvaluateAccept(accept); setShowEvaluateDialog(true); }}
                          onResolve={resolveGap} isREE={isREE} submitting={submitting} />
                      </TabsContent>
                      <TabsContent value="submitted">
                        <GapList gaps={planSubmitted} getStatusColor={getStatusColor}
                          onEvaluate={(g: any, accept: boolean) => { setSelectedGap(g); setEvaluateAccept(accept); setShowEvaluateDialog(true); }}
                          onResolve={resolveGap} isREE={isREE} submitting={submitting} />
                      </TabsContent>
                      <TabsContent value="resolved">
                        <GapList gaps={resolved} getStatusColor={getStatusColor}
                          onEvaluate={(g: any, accept: boolean) => { setSelectedGap(g); setEvaluateAccept(accept); setShowEvaluateDialog(true); }}
                          onResolve={resolveGap} isREE={isREE} submitting={submitting} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluate Plan Dialog */}
          <Dialog open={showEvaluateDialog} onOpenChange={setShowEvaluateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{evaluateAccept ? "Accepter le plan d'action" : "Rejeter le plan d'action"}</DialogTitle>
                <DialogDescription>
                  Écart : {selectedGap?.description?.substring(0, 100)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Commentaires / Feedback</label>
                  <Textarea value={evaluateFeedback} onChange={(e) => setEvaluateFeedback(e.target.value)}
                    placeholder={evaluateAccept ? "Commentaires (optionnel)..." : "Motif du rejet (obligatoire)..."}
                    rows={4} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvaluateDialog(false)}>Annuler</Button>
                <Button onClick={evaluatePlan} disabled={submitting || (!evaluateAccept && !evaluateFeedback.trim())}
                  className={evaluateAccept ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    evaluateAccept ? <ThumbsUp className="w-4 h-4 mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />
                  )}
                  {evaluateAccept ? "Accepter" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

/* Gap List Component */
function GapList({ gaps, getStatusColor, onEvaluate, onResolve, isREE, submitting }: {
  gaps: any[]; getStatusColor: (s: string) => string;
  onEvaluate: (g: any, accept: boolean) => void;
  onResolve: (id: number) => void;
  isREE: boolean; submitting: boolean;
}) {
  if (gaps.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">Aucun écart dans cette catégorie</p>;

  return (
    <div className="space-y-3 mt-4">
      {gaps.map((g: any) => (
        <Card key={g.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "destructive" : "secondary"}>
                  {g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "Critique" : "Non-critique"}
                </Badge>
                <Badge className={getStatusColor(g.status)}>{g.status?.replace(/_/g, " ")}</Badge>
                {g.normReference && <span className="text-xs text-muted-foreground">Réf: {g.normReference}</span>}
              </div>
              <p className="text-sm">{g.reeModifiedDescription || g.description}</p>
              {g.evidence && <p className="text-xs text-muted-foreground mt-1">Preuves: {g.evidence}</p>}

              {/* Show action plan info if submitted */}
              {g.actionPlan && (
                <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                  <p><strong>Actions correctives:</strong> {g.actionPlan.correctiveActions}</p>
                  {g.actionPlan.preventiveActions && <p><strong>Actions préventives:</strong> {g.actionPlan.preventiveActions}</p>}
                  {g.actionPlan.responsiblePerson && <p><strong>Responsable:</strong> {g.actionPlan.responsiblePerson}</p>}
                  {g.actionPlan.deadline && <p><strong>Échéance:</strong> {new Date(g.actionPlan.deadline).toLocaleDateString("fr-FR")}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Team/REE action buttons */}
          {isREE && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {g.status === "PLAN_SUBMITTED" && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onEvaluate(g, true)} disabled={submitting}>
                    <ThumbsUp className="w-3 h-3 mr-1" />Accepter plan
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onEvaluate(g, false)} disabled={submitting}>
                    <ThumbsDown className="w-3 h-3 mr-1" />Rejeter plan
                  </Button>
                </>
              )}
              {["PLAN_ACCEPTED", "IMPLEMENTATION", "EVIDENCE_PROVIDED"].includes(g.status) && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onResolve(g.id)} disabled={submitting}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />Marquer soldé
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
