import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { FileText, Send, CheckCircle, ClipboardList, Users, Calendar, Shield, Award, RefreshCw } from "lucide-react";

export default function EvaluationOversightPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [contestations, setContestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showMandate, setShowMandate] = useState(false);
  const [showMissionOrder, setShowMissionOrder] = useState(false);
  const [showEvalPlan, setShowEvalPlan] = useState(false);
  const [showDesignateExaminer, setShowDesignateExaminer] = useState(false);
  const [showComplementary, setShowComplementary] = useState(false);
  const [selectedContest, setSelectedContest] = useState<any>(null);

  // Forms
  const [mandateForm, setMandateForm] = useState({ mandateContent: "", specialConditions: "" });
  const [evalPlanForm, setEvalPlanForm] = useState({
    dailyProgram: "", activityDistribution: "", schedules: "",
    evaluationStandards: "", planFOR32: ""
  });
  const [examinerForm, setExaminerForm] = useState({ examinerId: "" });
  const [complementaryForm, setComplementaryForm] = useState({ reason: "", scope: "" });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["DOCUMENTARY_REVIEW_VALIDATED", "TEAM_MANDATE_SENT", "MISSION_ORDER_CREATED",
           "MISSION_ORDER_VALIDATED", "EVALUATION_PLAN_CREATED", "EVALUATION_PLAN_VALIDATED",
           "EVALUATION_IN_PROGRESS", "EVALUATION_COMPLETED", "AWAITING_ACTION_PLANS",
           "ACTION_PLANS_EVALUATION", "ACTION_PLANS_IMPLEMENTATION", "GAPS_RESOLVED"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { }
    setLoading(false);
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    try {
      const [gapsRes, contestRes] = await Promise.all([
        fetch(`/api/workflow/site-evaluation/${r.id}/gaps`, { credentials: "include" }),
        fetch(`/api/workflow/site-evaluation/${r.id}/contestations`, { credentials: "include" })
      ]);
      const gapsData = await gapsRes.json();
      const contestData = await contestRes.json();
      if (gapsData.success) setGaps(gapsData.data || []);
      if (contestData.success) setContestations(contestData.data || []);
    } catch (err) { }
  };

  const handleSendMandate = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/mandate`, mandateForm);
      toast({ title: "Mandat envoyé à l'équipe" });
      setShowMandate(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCreateMissionOrders = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/mission-orders`, {});
      toast({ title: "Ordres de mission créés" });
      setShowMissionOrder(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCreateEvalPlan = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/evaluation-plan`, evalPlanForm);
      toast({ title: "Plan d'évaluation créé (FOR 32)" });
      setShowEvalPlan(false);
      setEvalPlanForm({ dailyProgram: "", activityDistribution: "", schedules: "", evaluationStandards: "", planFOR32: "" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleValidateEvalPlan = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/workflow/site-evaluation/evaluation-plan/${planId}/validate`, {});
      toast({ title: "Plan d'évaluation validé" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSendPlanToOEC = async (planId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/evaluation-plan/${planId}/send-oec`, {});
      toast({ title: "Plan envoyé à l'OEC" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTransmitClosing = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/transmit-closing-docs`, {});
      toast({ title: "Documents de clôture transmis" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleRequestActionPlans = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/request-action-plans`, {});
      toast({ title: "Plans d'action demandés à l'OEC" });
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleEvaluatePlan = async (gapId: number, decision: string, reason?: string) => {
    try {
      await apiRequest("PUT", `/api/workflow/site-evaluation/gaps/${gapId}/evaluate-plan`, {
        decision, reason: reason || ""
      });
      toast({ title: `Plan ${decision === "ACCEPTED" ? "accepté" : "rejeté"}` });
      selectRequest(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleVerifyEvidence = async (gapId: number, verified: boolean) => {
    try {
      await apiRequest("PUT", `/api/workflow/site-evaluation/gaps/${gapId}/verify-evidence`, {
        verified, comments: ""
      });
      toast({ title: verified ? "Preuves vérifiées" : "Preuves insuffisantes" });
      selectRequest(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDesignateExaminer = async () => {
    try {
      await apiRequest("PUT", `/api/workflow/site-evaluation/contestations/${selectedContest.id}/designate-examiner`, {
        examinerId: parseInt(examinerForm.examinerId)
      });
      toast({ title: "Examinateur désigné" });
      setShowDesignateExaminer(false);
      selectRequest(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDecideComplementary = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/complementary-evaluation`, complementaryForm);
      toast({ title: "Évaluation complémentaire décidée" });
      setShowComplementary(false);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DOCUMENTARY_REVIEW_VALIDATED: "bg-blue-100 text-blue-800",
      TEAM_MANDATE_SENT: "bg-indigo-100 text-indigo-800",
      MISSION_ORDER_VALIDATED: "bg-purple-100 text-purple-800",
      EVALUATION_PLAN_CREATED: "bg-yellow-100 text-yellow-800",
      EVALUATION_IN_PROGRESS: "bg-orange-100 text-orange-800",
      EVALUATION_COMPLETED: "bg-teal-100 text-teal-800",
      AWAITING_ACTION_PLANS: "bg-red-100 text-red-800",
      GAPS_RESOLVED: "bg-emerald-100 text-emerald-800"
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status?.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Pilotage de l'évaluation sur site</h1>
              <p className="text-muted-foreground">
                Gestion des mandats, plans d'évaluation, écarts et contestations
              </p>
            </div>
            <Button variant="outline" onClick={loadRequests} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: List */}
            <div className="lg:col-span-1 space-y-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dossiers en évaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => selectRequest(r)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-sm">{r.referenceNumber}</p>
                        {getStatusBadge(r.status)}
                        <p className="text-xs text-muted-foreground mt-1">{r.organizationName}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Detail */}
            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedRequest.referenceNumber}</CardTitle>
                        <CardDescription>{selectedRequest.organizationName}</CardDescription>
                      </div>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="workflow">
                      <TabsList className="mb-4">
                        <TabsTrigger value="workflow">Workflow</TabsTrigger>
                        <TabsTrigger value="gaps">Écarts ({gaps.length})</TabsTrigger>
                        <TabsTrigger value="contestations">Contestations ({contestations.length})</TabsTrigger>
                      </TabsList>

                      {/* WORKFLOW Tab */}
                      <TabsContent value="workflow">
                        <div className="space-y-4">
                          {/* Phase progression actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedRequest.status === "DOCUMENTARY_REVIEW_VALIDATED" && (
                              <Card className="p-4 border-l-4 border-l-blue-500">
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4" /> Étape 6: Envoi du mandat
                                </h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Envoyer le mandat à l'équipe d'évaluation
                                </p>
                                <Button size="sm" onClick={() => setShowMandate(true)}>
                                  <Send className="w-3 h-3 mr-1" /> Envoyer mandat
                                </Button>
                              </Card>
                            )}

                            {selectedRequest.status === "TEAM_MANDATE_SENT" && (
                              <>
                                <Card className="p-4 border-l-4 border-l-indigo-500">
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" /> Ordres de mission FOR 31
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Créer les ordres de mission individuels
                                  </p>
                                  <Button size="sm" onClick={handleCreateMissionOrders}>Créer</Button>
                                </Card>
                                <Card className="p-4 border-l-4 border-l-purple-500">
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Plan d'évaluation FOR 32
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Établir le plan d'évaluation détaillé
                                  </p>
                                  <Button size="sm" onClick={() => setShowEvalPlan(true)}>Créer le plan</Button>
                                </Card>
                              </>
                            )}

                            {selectedRequest.status === "EVALUATION_COMPLETED" && (
                              <>
                                <Card className="p-4 border-l-4 border-l-teal-500">
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Transmettre les documents de clôture
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Envoyer PV et documents au responsable d'accréditation
                                  </p>
                                  <Button size="sm" onClick={handleTransmitClosing}>Transmettre</Button>
                                </Card>
                                <Card className="p-4 border-l-4 border-l-orange-500">
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Demander plans d'action
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Demander à l'OEC de soumettre des plans d'action pour les écarts
                                  </p>
                                  <Button size="sm" onClick={handleRequestActionPlans}>Demander</Button>
                                </Card>
                              </>
                            )}

                            {selectedRequest.status === "GAPS_RESOLVED" && (
                              <Card className="p-4 border-l-4 border-l-emerald-500">
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                  <Award className="w-4 h-4" /> Évaluation complémentaire
                                </h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Décider d'une évaluation complémentaire si nécessaire
                                </p>
                                <Button size="sm" onClick={() => setShowComplementary(true)}>Décider</Button>
                              </Card>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* GAPS Tab */}
                      <TabsContent value="gaps">
                        <div className="space-y-3">
                          {gaps.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun écart enregistré</p>
                          ) : gaps.map((gap: any) => (
                            <Card key={gap.id} className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">{gap.gapCode}</span>
                                    <Badge className={gap.type === "CRITIQUE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                      {gap.type}
                                    </Badge>
                                    <Badge variant="outline">{gap.status?.replace(/_/g, " ")}</Badge>
                                  </div>
                                  <p className="text-sm mt-1">{gap.requirement}</p>
                                </div>
                              </div>

                              {/* Action plan review */}
                              {gap.status === "PLAN_SUBMITTED" && (
                                <div className="mt-3 pt-3 border-t flex gap-2">
                                  <Button size="sm" onClick={() => handleEvaluatePlan(gap.id, "ACCEPTED")}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Accepter
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleEvaluatePlan(gap.id, "REJECTED", "Plan insuffisant")}>
                                    Rejeter
                                  </Button>
                                </div>
                              )}

                              {/* Evidence verification */}
                              {gap.status === "EVIDENCE_PROVIDED" && (
                                <div className="mt-3 pt-3 border-t flex gap-2">
                                  <Button size="sm" onClick={() => handleVerifyEvidence(gap.id, true)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Vérifier OK
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleVerifyEvidence(gap.id, false)}>
                                    Insuffisant
                                  </Button>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      {/* CONTESTATIONS Tab */}
                      <TabsContent value="contestations">
                        <div className="space-y-3">
                          {contestations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune contestation</p>
                          ) : contestations.map((c: any) => (
                            <Card key={c.id} className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-sm">Contestation #{c.id}</span>
                                <Badge variant="outline">{c.status?.replace(/_/g, " ")}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{c.reason}</p>

                              {c.status === "FILED" && (
                                <Button size="sm" className="mt-3" onClick={() => {
                                  setSelectedContest(c);
                                  setShowDesignateExaminer(true);
                                }}>
                                  Désigner un examinateur
                                </Button>
                              )}
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mandate Dialog */}
          <Dialog open={showMandate} onOpenChange={setShowMandate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer le mandat à l'équipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Contenu du mandat</Label>
                  <Textarea value={mandateForm.mandateContent}
                    onChange={(e) => setMandateForm({ ...mandateForm, mandateContent: e.target.value })}
                    placeholder="Périmètre, objectifs, rôles..." className="min-h-[120px]" />
                </div>
                <div>
                  <Label>Conditions spéciales</Label>
                  <Textarea value={mandateForm.specialConditions}
                    onChange={(e) => setMandateForm({ ...mandateForm, specialConditions: e.target.value })}
                    placeholder="Conditions spéciales éventuelles..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMandate(false)}>Annuler</Button>
                <Button onClick={handleSendMandate}><Send className="w-4 h-4 mr-2" />Envoyer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Eval Plan Dialog */}
          <Dialog open={showEvalPlan} onOpenChange={setShowEvalPlan}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer le plan d'évaluation (FOR 32)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Programme journalier</Label>
                  <Textarea value={evalPlanForm.dailyProgram}
                    onChange={(e) => setEvalPlanForm({ ...evalPlanForm, dailyProgram: e.target.value })}
                    placeholder="Programme de chaque journée..." />
                </div>
                <div>
                  <Label>Répartition des activités</Label>
                  <Textarea value={evalPlanForm.activityDistribution}
                    onChange={(e) => setEvalPlanForm({ ...evalPlanForm, activityDistribution: e.target.value })}
                    placeholder="Distribution des activités entre évaluateurs..." />
                </div>
                <div>
                  <Label>Horaires</Label>
                  <Input value={evalPlanForm.schedules}
                    onChange={(e) => setEvalPlanForm({ ...evalPlanForm, schedules: e.target.value })}
                    placeholder="08:00-17:00" />
                </div>
                <div>
                  <Label>Normes d'évaluation</Label>
                  <Input value={evalPlanForm.evaluationStandards}
                    onChange={(e) => setEvalPlanForm({ ...evalPlanForm, evaluationStandards: e.target.value })}
                    placeholder="ISO/CEI 17025, etc." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEvalPlan(false)}>Annuler</Button>
                <Button onClick={handleCreateEvalPlan}>Créer le plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Designate Examiner Dialog */}
          <Dialog open={showDesignateExaminer} onOpenChange={setShowDesignateExaminer}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Désigner un examinateur</DialogTitle>
                <DialogDescription>
                  Personne non impliquée dans l'évaluation pour examiner la contestation
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>ID de l'examinateur</Label>
                <Input type="number" value={examinerForm.examinerId}
                  onChange={(e) => setExaminerForm({ examinerId: e.target.value })}
                  placeholder="Identifiant de l'examinateur" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDesignateExaminer(false)}>Annuler</Button>
                <Button onClick={handleDesignateExaminer}>Désigner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Complementary Evaluation Dialog */}
          <Dialog open={showComplementary} onOpenChange={setShowComplementary}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Évaluation complémentaire</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Raison</Label>
                  <Textarea value={complementaryForm.reason}
                    onChange={(e) => setComplementaryForm({ ...complementaryForm, reason: e.target.value })}
                    placeholder="Justification de l'évaluation complémentaire..." />
                </div>
                <div>
                  <Label>Périmètre</Label>
                  <Textarea value={complementaryForm.scope}
                    onChange={(e) => setComplementaryForm({ ...complementaryForm, scope: e.target.value })}
                    placeholder="Périmètre de l'évaluation..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComplementary(false)}>Annuler</Button>
                <Button onClick={handleDecideComplementary}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
