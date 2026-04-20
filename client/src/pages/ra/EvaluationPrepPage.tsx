import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Plus, ClipboardList, FileCheck, CheckCircle, Mail, XCircle, AlertTriangle, Pencil, Rocket } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const EVAL_PREP_STATUSES = [
  "DOCUMENTARY_REVIEW_COMPLETED",
  "MANDATES_PREPARATION", "MANDATES_PENDING_CD", "MANDATES_CD_MODIFICATION", "MANDATES_SENT_TO_TEAM",
  "MISSION_ORDERS_PENDING", "MISSION_ORDERS_PENDING_DT", "MISSION_ORDERS_PENDING_DG", "MISSION_ORDERS_SENT",
  "EVALUATION_PLAN_PREPARATION", "EVALUATION_PLAN_PENDING_RA", "EVALUATION_PLAN_RA_APPROVED",
  "EVALUATION_PLAN_PENDING_CD", "EVALUATION_PLAN_VALIDATION", "EVALUATION_PLANNED",
  "EVALUATION_IN_PROGRESS",
];

export default function EvaluationPrepPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [mandates, setMandates] = useState<any[]>([]);
  const [showMandateDialog, setShowMandateDialog] = useState(false);
  const [mandateEntries, setMandateEntries] = useState<Record<number, { tasks: string; missions: string; objectives: string }>>({});

  const [missionOrders, setMissionOrders] = useState<any[]>([]);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [missionForm, setMissionForm] = useState({ teamMemberId: "", missionDetails: "", checklistTasks: "" });

  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanReviewDialog, setShowPlanReviewDialog] = useState(false);
  const [planReviewApproved, setPlanReviewApproved] = useState(true);
  const [planReviewComments, setPlanReviewComments] = useState("");
  const [reviewingPlanId, setReviewingPlanId] = useState<number | null>(null);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) => EVAL_PREP_STATUSES.includes(r.status)));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const [mandatesRes, missionsRes, teamsRes, plansRes] = await Promise.all([
        fetch(`/api/workflow/mandates/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/mission-orders/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/teams/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/evaluation-plan/by-request/${req.id}`, { credentials: "include" }),
      ]);
      if (mandatesRes.ok) setMandates(await mandatesRes.json());
      if (missionsRes.ok) setMissionOrders(await missionsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        if (teams.length > 0) {
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) {
            const mems = await memRes.json();
            setTeamMembers(mems);
            const entries: Record<number, { tasks: string; missions: string; objectives: string }> = {};
            mems.forEach((m: any) => { entries[m.id] = { tasks: "", missions: "", objectives: "" }; });
            setMandateEntries(entries);
          }
        }
      }
    } catch (e) { }
  };

  const createMandates = async () => {
    const mandatesData = Object.entries(mandateEntries)
      .filter(([_, v]) => v.tasks.trim() || v.missions.trim())
      .map(([memberId, v]) => ({ memberId: parseInt(memberId), ...v }));
    if (mandatesData.length === 0) {
      toast({ title: "Erreur", description: "Renseignez au moins un mandatement", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/mandates/create-all", {
        requestId: selectedRequest.id, mandates: mandatesData,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: `${mandatesData.length} mandatement(s) créé(s)` });
        setShowMandateDialog(false);
        await selectRequest(selectedRequest); await loadData();
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const sendMandatesToCD = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/mandates/send-to-cd", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Mandatements envoyés au CD" });
        await selectRequest(selectedRequest); await loadData();
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const createMissionOrder = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/mission-orders/create", {
        requestId: selectedRequest.id,
        teamMemberId: parseInt(missionForm.teamMemberId),
        missionDetails: missionForm.missionDetails,
        checklistTasks: missionForm.checklistTasks,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission créé — en attente DT" });
        setShowCreateMission(false);
        setMissionForm({ teamMemberId: "", missionDetails: "", checklistTasks: "" });
        await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const sendMissionToMember = async (orderId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/send-to-member`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission envoyé au membre" });
        await selectRequest(selectedRequest);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const reviewPlan = async () => {
    if (reviewingPlanId === null) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${reviewingPlanId}/ra-validate`, {
        approved: planReviewApproved, comments: planReviewComments,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: planReviewApproved ? "Plan validé — transmis au CD" : "Ajustements demandés au REE" });
        setShowPlanReviewDialog(false); setPlanReviewComments("");
        await selectRequest(selectedRequest); await loadData();
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const launchEvaluation = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/start/${selectedRequest.id}`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Étape 7 lancée", description: "L'évaluation sur site est en cours — l'équipe a été notifiée" });
        setShowLaunchDialog(false);
        await selectRequest({ ...selectedRequest, status: "EVALUATION_IN_PROGRESS" });
        await loadData();
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  if (!user) return null;

  const missionStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon", PENDING_DT_APPROVAL: "Attente DT", DT_APPROVED: "Approuvé DT",
    PENDING_DG_APPROVAL: "Attente DG", FULLY_APPROVED: "Approuvé", SENT_TO_MEMBER: "Envoyé",
  };
  const mandateStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon", SENT_TO_CD: "Envoyé au CD", CD_APPROVED: "Approuvé CD",
    CD_MODIFICATION_REQUESTED: "Modifications demandées", SENT_TO_MEMBERS: "Envoyé aux membres",
  };
  const planStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon (REE)", SUBMITTED_TO_RA: "En attente RA", SUBMITTED_TO_CD: "En attente RA",
    RA_ADJUSTMENTS_NEEDED: "Ajustements REE", PENDING_CD: "Attente CD",
    ADJUSTMENTS_NEEDED: "Ajustements CD", CD_VALIDATED: "Validé CD", VALIDATED: "Validé",
    SENT_TO_OEC: "Envoyé OEC", ACTIVE: "Actif",
  };

  const mandatesDone = mandates.length > 0 && mandates.every((m: any) => m.status === "SENT_TO_MEMBERS");
  const mandatesPendingCD = mandates.some((m: any) => m.status === "SENT_TO_CD");
  const mandatesNeedModif = mandates.some((m: any) => m.status === "CD_MODIFICATION_REQUESTED");
  const allMissionsApproved = missionOrders.length > 0 && missionOrders.every((o: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER"].includes(o.status));
  const hasPlan = plans.length > 0;
  const planPendingRA = plans.some((p: any) => ["SUBMITTED_TO_RA", "SUBMITTED_TO_CD"].includes(p.status));
  const planPendingCD = plans.some((p: any) => p.status === "PENDING_CD");
  const planValidated = plans.some((p: any) => ["CD_VALIDATED", "VALIDATED", "SENT_TO_OEC", "ACTIVE"].includes(p.status));
  const planSentToOEC = plans.some((p: any) => ["SENT_TO_OEC", "ACTIVE"].includes(p.status));

  const steps = [
    { num: 1, label: "Mandatements" }, { num: 2, label: "CD valide" },
    { num: 3, label: "Ordres mission" }, { num: 4, label: "DT/DG" },
    { num: 5, label: "Plan FOR 32" }, { num: 6, label: "RA vérifie" },
    { num: 7, label: "CD valide plan" }, { num: 8, label: "Envoi OEC" },
  ];

  const getCurrentStep = () => {
    if (planSentToOEC) return 9;
    if (planValidated) return 8;
    if (planPendingCD) return 7;
    if (planPendingRA) return 6;
    if (hasPlan) return 5;
    if (allMissionsApproved) return 5;
    if (missionOrders.length > 0) return 4;
    if (mandatesDone) return 3;
    if (mandatesPendingCD || mandates.length > 0) return 2;
    return 1;
  };
  const currentStep = selectedRequest ? getCurrentStep() : 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Préparation de l'Évaluation (Étape 6)</h1>
            <p className="text-muted-foreground mt-1">Mandatements, ordres de mission FOR 18, plan d'évaluation FOR 32</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-[75vh] overflow-y-auto">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en préparation</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.domain}</p>
                      <Badge variant="outline" className="text-xs mt-1">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-6">
                {!selectedRequest ? (
                  <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p></CardContent></Card>
                ) : (
                  <>
                    {/* Step progress */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between overflow-x-auto pb-2">
                          {steps.map((step, i) => (
                            <div key={step.num} className="flex items-center flex-1 min-w-0">
                              <div className={`flex flex-col items-center ${currentStep > step.num ? "text-green-600" : currentStep === step.num ? "text-primary" : "text-gray-300"}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${currentStep > step.num ? "bg-green-100 border-green-500" : currentStep === step.num ? "bg-primary/10 border-primary" : "border-gray-200"}`}>
                                  {currentStep > step.num ? <CheckCircle className="w-3.5 h-3.5" /> : step.num}
                                </div>
                                <span className="text-[9px] mt-1 text-center leading-tight max-w-[70px]">{step.label}</span>
                              </div>
                              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 ${currentStep > step.num ? "bg-green-400" : "bg-gray-200"}`} />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 6.1 Mandatements */}
                    <Card className={currentStep <= 2 ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2"><Mail className="w-5 h-5" /> 6.1 Mandatements</CardTitle>
                            <CardDescription>Tâches et missions de chaque membre ? CD valide ? envoi aux membres</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {mandates.length === 0 && <Button onClick={() => setShowMandateDialog(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Préparer</Button>}
                            {mandates.length > 0 && mandates.every((m: any) => m.status === "DRAFT") && (
                              <Button onClick={sendMandatesToCD} disabled={actionLoading} size="sm"><Send className="w-4 h-4 mr-1" />Envoyer au CD</Button>
                            )}
                            {mandatesNeedModif && <Button onClick={() => setShowMandateDialog(true)} size="sm" variant="outline"><Pencil className="w-4 h-4 mr-1" />Modifier</Button>}
                            {mandatesDone && <Badge className="bg-green-100 text-green-800">Envoyés ?</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {mandatesNeedModif && mandates[0]?.cdComments && (
                          <Alert className="mb-4 border-amber-300 bg-amber-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription><strong>CD demande modifications:</strong><p className="mt-1">{mandates[0].cdComments}</p></AlertDescription>
                          </Alert>
                        )}
                        {mandates.length > 0 ? (
                          <Table>
                            <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead>Rôle</TableHead><TableHead>Tâches</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {mandates.map((m: any) => (
                                <TableRow key={m.id}>
                                  <TableCell className="font-medium">{m.memberName}</TableCell>
                                  <TableCell><Badge variant="outline">{m.memberRole}</Badge></TableCell>
                                  <TableCell className="text-sm max-w-[200px] truncate">{m.tasks || "-"}</TableCell>
                                  <TableCell><Badge variant={m.status === "SENT_TO_MEMBERS" ? "default" : "outline"}>{mandateStatusLabels[m.status] || m.status}</Badge></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="space-y-2">
                            {teamMembers.map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                                <div><p className="font-medium text-sm">{m.expert?.fullName}</p><p className="text-xs text-muted-foreground">{m.role}</p></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {mandatesPendingCD && <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"><p className="text-sm text-blue-800">En attente de validation par le CD.</p></div>}
                      </CardContent>
                    </Card>

                    {/* 6.3 Mission Orders */}
                    <Card className={currentStep >= 3 && currentStep <= 4 ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5" /> 6.3 Ordres de Mission (FOR 18)</CardTitle>
                            <CardDescription>RA établit ? DT valide ? DG valide ? RA transmet à l'équipe</CardDescription>
                          </div>
                          {mandatesDone && !allMissionsApproved && <Button onClick={() => setShowCreateMission(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Nouvel Ordre</Button>}
                          {!mandatesDone && currentStep < 3 && <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Mandatements d'abord</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Membre</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {missionOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>{order.teamMemberName || "—"}</TableCell>
                                <TableCell><Badge variant={["FULLY_APPROVED", "SENT_TO_MEMBER"].includes(order.status) ? "default" : "outline"}>{missionStatusLabels[order.status] || order.status}</Badge></TableCell>
                                <TableCell>
                                  {order.status === "FULLY_APPROVED" && <Button size="sm" variant="outline" onClick={() => sendMissionToMember(order.id)}><Send className="w-3 h-3 mr-1" />Transmettre</Button>}
                                  {order.status === "SENT_TO_MEMBER" && <Badge className="bg-green-100 text-green-800 text-xs">Envoyé ?</Badge>}
                                </TableCell>
                              </TableRow>
                            ))}
                            {missionOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Aucun ordre</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                        {missionOrders.some((o: any) => ["PENDING_DT_APPROVAL", "PENDING_DG_APPROVAL"].includes(o.status)) && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200"><p className="text-sm text-amber-800">En attente d'approbation DT / DG.</p></div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 6.4-6.6 Plan FOR 32 */}
                    <Card className={currentStep >= 5 && currentStep <= 7 ? "border-primary" : ""}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5" /> 6.4-6.6 Plan FOR 32</CardTitle>
                        <CardDescription>REE élabore ? RA vérifie alignement norme ? CD valide ? REE envoie OEC (5j avant)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!hasPlan ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>En attente que le REE élabore le plan FOR 32...</p>
                          </div>
                        ) : plans.map((plan: any) => (
                          <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{plan.planCode || "Plan FOR 32"}</p>
                                <Badge variant="outline" className="mt-1">{planStatusLabels[plan.status] || plan.status}</Badge>
                              </div>
                              <div className="flex gap-2">
                                {["SUBMITTED_TO_RA", "SUBMITTED_TO_CD"].includes(plan.status) && (
                                  <Button size="sm" onClick={() => { setReviewingPlanId(plan.id); setPlanReviewApproved(true); setShowPlanReviewDialog(true); }}>
                                    <CheckCircle className="w-4 h-4 mr-1" />Vérifier
                                  </Button>
                                )}
                                {["SENT_TO_OEC", "ACTIVE"].includes(plan.status) && <Badge className="bg-green-100 text-green-800">Envoyé OEC ?</Badge>}
                              </div>
                            </div>
                            {plan.dailyProgram && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Programme</p><p className="text-sm whitespace-pre-line">{plan.dailyProgram}</p></div>}
                            {plan.activityDistribution && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Répartition</p><p className="text-sm whitespace-pre-line">{plan.activityDistribution}</p></div>}
                            {plan.cdAdjustmentRequests && !["CD_VALIDATED", "VALIDATED", "SENT_TO_OEC"].includes(plan.status) && (
                              <Alert className="border-amber-300 bg-amber-50"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Ajustements:</strong> {plan.cdAdjustmentRequests}</AlertDescription></Alert>
                            )}
                          </div>
                        ))}
                        {planSentToOEC && <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200"><p className="text-sm font-medium text-green-800">Plan FOR 32 envoyé à l'OEC — L'évaluation peut se dérouler.</p></div>}
                      </CardContent>
                    </Card>

                    {/* Launch Étape 7 */}
                    {planSentToOEC && selectedRequest?.status === "EVALUATION_PLANNED" && (
                      <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="pt-6 pb-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Rocket className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-blue-900">Lancer l'Étape 7 — Évaluation sur Site</h3>
                                <p className="text-sm text-blue-700">L'étape 6 est terminée. L'équipe d'évaluation sera notifiée et pourra commencer l'évaluation.</p>
                              </div>
                            </div>
                            <Button onClick={() => setShowLaunchDialog(true)} className="bg-blue-600 hover:bg-blue-700" size="lg">
                              <Rocket className="w-4 h-4 mr-2" />Lancer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedRequest?.status === "EVALUATION_IN_PROGRESS" && (
                      <Card className="border-green-300 bg-green-50">
                        <CardContent className="pt-6 pb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-green-900">Étape 7 en cours — Évaluation sur Site</h3>
                              <p className="text-sm text-green-700">L'évaluation est en cours. L'équipe réalise les checklists, fiches d'écart et réunions d'ouverture/clôture.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Dialog: Mandatements */}
          <Dialog open={showMandateDialog} onOpenChange={setShowMandateDialog}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Préparer les Mandatements</DialogTitle>
                <DialogDescription>Définissez les tâches et missions de chaque membre</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {teamMembers.map((m: any) => (
                  <div key={m.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.expert?.fullName}</p>
                      <Badge variant="outline" className="text-xs">{m.role}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Tâches</Label>
                        <Textarea value={mandateEntries[m.id]?.tasks || ""} onChange={(e) => setMandateEntries({ ...mandateEntries, [m.id]: { ...mandateEntries[m.id], tasks: e.target.value } })} placeholder="Tâches..." rows={3} />
                      </div>
                      <div>
                        <Label className="text-xs">Missions</Label>
                        <Textarea value={mandateEntries[m.id]?.missions || ""} onChange={(e) => setMandateEntries({ ...mandateEntries, [m.id]: { ...mandateEntries[m.id], missions: e.target.value } })} placeholder="Missions..." rows={3} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Objectifs (optionnel)</Label>
                      <Input value={mandateEntries[m.id]?.objectives || ""} onChange={(e) => setMandateEntries({ ...mandateEntries, [m.id]: { ...mandateEntries[m.id], objectives: e.target.value } })} placeholder="Objectifs..." />
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMandateDialog(false)}>Annuler</Button>
                <Button onClick={createMandates} disabled={actionLoading}>{actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Mission Order */}
          <Dialog open={showCreateMission} onOpenChange={setShowCreateMission}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel Ordre de Mission (FOR 18)</DialogTitle>
                <DialogDescription>Soumis au DT puis au DG pour approbation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Membre</Label>
                  <select className="w-full border rounded-md p-2 text-sm" value={missionForm.teamMemberId} onChange={(e) => setMissionForm({ ...missionForm, teamMemberId: e.target.value })}>
                    <option value="">Sélectionner...</option>
                    {teamMembers.map((m: any) => <option key={m.id} value={m.expert?.id}>{m.expert?.fullName} ({m.role})</option>)}
                  </select>
                </div>
                <div><Label>Détails de la mission</Label><Textarea value={missionForm.missionDetails} onChange={(e) => setMissionForm({ ...missionForm, missionDetails: e.target.value })} placeholder="Objectifs, lieu, durée..." rows={3} /></div>
                <div><Label>Checklist</Label><Textarea value={missionForm.checklistTasks} onChange={(e) => setMissionForm({ ...missionForm, checklistTasks: e.target.value })} placeholder="1. Vérifier...\n2. Examiner..." rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateMission(false)}>Annuler</Button>
                <Button onClick={createMissionOrder} disabled={actionLoading || !missionForm.teamMemberId}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Plan Review */}
          <Dialog open={showPlanReviewDialog} onOpenChange={setShowPlanReviewDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vérification du Plan FOR 32</DialogTitle>
                <DialogDescription>Vérifiez l'alignement avec la norme d'accréditation. Votre validation sera transmise au CD.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant={planReviewApproved ? "default" : "outline"} onClick={() => setPlanReviewApproved(true)} className={planReviewApproved ? "bg-green-600 hover:bg-green-700" : ""}>
                    <CheckCircle className="w-4 h-4 mr-2" />Conforme
                  </Button>
                  <Button variant={!planReviewApproved ? "destructive" : "outline"} onClick={() => setPlanReviewApproved(false)}>
                    <XCircle className="w-4 h-4 mr-2" />Ajustements
                  </Button>
                </div>
                <div>
                  <Label>{planReviewApproved ? "Commentaires (optionnel)" : "Détails des ajustements"}</Label>
                  <Textarea value={planReviewComments} onChange={(e) => setPlanReviewComments(e.target.value)} placeholder={planReviewApproved ? "Commentaires..." : "Incohérences à corriger..."} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPlanReviewDialog(false)}>Annuler</Button>
                <Button onClick={reviewPlan} disabled={actionLoading || (!planReviewApproved && !planReviewComments.trim())} className={planReviewApproved ? "bg-green-600 hover:bg-green-700" : ""} variant={planReviewApproved ? "default" : "destructive"}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {planReviewApproved ? "Transmettre au CD" : "Demander ajustements"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Launch Étape 7 */}
          <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lancer l'Évaluation sur Site (Étape 7)</DialogTitle>
                <DialogDescription>
                  Confirmez le lancement de l'étape 7. L'équipe d'évaluation et l'OEC seront notifiés.
                  Les membres pourront alors créer des fiches d'écart et notes d'évaluation.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <p className="text-sm font-medium text-blue-900">Dossier : {selectedRequest?.referenceNumber}</p>
                <p className="text-sm text-blue-800">Domaine : {selectedRequest?.domain}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLaunchDialog(false)}>Annuler</Button>
                <Button onClick={launchEvaluation} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                  Confirmer le lancement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
