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
import { Loader2, Send, Plus, ClipboardList, FileCheck, CheckCircle, ArrowRight, Mail, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EvaluationPrepPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [missionOrders, setMissionOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [showMandatement, setShowMandatement] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [mandatementMessages, setMandatementMessages] = useState<Record<number, string>>({});
  const [missionForm, setMissionForm] = useState({ teamMemberId: "", missionDetails: "", checklistTasks: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) =>
          ["DOCUMENTARY_REVIEW_COMPLETED", "EVALUATION_PLAN_PREPARATION", "EVALUATION_PLAN_VALIDATION", "EVALUATION_PLANNED"].includes(r.status)
        ));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const [plansRes, missionsRes, teamsRes] = await Promise.all([
        fetch(`/api/workflow/evaluation-plan/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/mission-orders/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/teams/by-request/${req.id}`, { credentials: "include" }),
      ]);
      if (plansRes.ok) setPlans(await plansRes.json());
      if (missionsRes.ok) setMissionOrders(await missionsRes.json());
      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        if (teams.length > 0) {
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) {
            const mems = await memRes.json();
            setTeamMembers(mems);
            const msgs: Record<number, string> = {};
            mems.forEach((m: any) => { msgs[m.id] = ""; });
            setMandatementMessages(msgs);
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  // Step 6.1: RA sends mandatement (custom message per team member)
  const sendMandatement = async () => {
    const entries = Object.entries(mandatementMessages).filter(([_, msg]) => msg.trim());
    if (entries.length === 0) {
      toast({ title: "Erreur", description: "Redigez au moins un message de mandatement", variant: "destructive" });
      return;
    }
    try {
      for (const [memberId, message] of entries) {
        await apiRequest("POST", `/api/workflow/teams/members/${memberId}/mandatement`, {
          message,
          requestId: selectedRequest.id,
        });
      }
      toast({ title: "Succes", description: `Mandatement envoye a ${entries.length} membre(s)` });
      setShowMandatement(false);
      selectRequest(selectedRequest);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // Step 6.2: RA creates mission orders
  const createMissionOrder = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/mission-orders/create", {
        requestId: selectedRequest.id,
        teamMemberId: parseInt(missionForm.teamMemberId),
        missionDetails: missionForm.missionDetails,
        checklistTasks: missionForm.checklistTasks,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Ordre de mission cree - en attente approbation DT/DG" });
        setShowCreateMission(false);
        setMissionForm({ teamMemberId: "", missionDetails: "", checklistTasks: "" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // Step 6.4: RA validates FOR 32 plan from REE
  const validatePlan = async (planId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${planId}/validate`, { approved: true });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Plan FOR 32 valide" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // Step 6.5: REE sends plan to OEC
  const sendPlanToOEC = async (planId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${planId}/send-to-oec`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Plan FOR 32 envoye a l'OEC (min 5 jours avant evaluation)" });
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const sendMissionToMember = async (orderId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/send-to-member`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Ordre de mission envoye au membre" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const missionStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon", PENDING_DT_APPROVAL: "Attente DT", DT_APPROVED: "Approuve DT",
    PENDING_DG_APPROVAL: "Attente DG", DG_APPROVED: "Approuve DG", FULLY_APPROVED: "Approuve",
    SENT_TO_MEMBER: "Envoye", IN_PROGRESS: "En cours", COMPLETED: "Termine",
  };

  const planStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon (REE)", SUBMITTED_TO_CD: "Soumis au RA", ADJUSTMENTS_NEEDED: "Ajustements",
    VALIDATED: "Valide par RA", SENT_TO_OEC: "Envoye a l'OEC", ACTIVE: "Actif",
  };

  // Determine current sub-step
  const allMissionsApproved = missionOrders.length > 0 && missionOrders.every((o: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER", "IN_PROGRESS", "COMPLETED"].includes(o.status));
  const hasPlan = plans.length > 0;
  const planValidated = plans.some((p: any) => p.status === "VALIDATED" || p.status === "SENT_TO_OEC" || p.status === "ACTIVE");
  const planSentToOEC = plans.some((p: any) => p.status === "SENT_TO_OEC" || p.status === "ACTIVE");

  const steps = [
    { num: 1, label: "Mandatement", desc: "RA envoie mandatement aux membres", icon: Mail },
    { num: 2, label: "Ordres de mission", desc: "RA etablit les ordres de mission", icon: ClipboardList },
    { num: 3, label: "Approbation DT/DG", desc: "DT et DG valident les ordres", icon: CheckCircle },
    { num: 4, label: "Plan FOR 32", desc: "REE elabore le plan d'evaluation", icon: FileCheck },
    { num: 5, label: "Validation RA", desc: "RA valide le plan FOR 32", icon: CheckCircle },
    { num: 6, label: "Envoi OEC", desc: "REE envoie a l'OEC (5j avant)", icon: Send },
  ];

  const mandatementDone = teamMembers.some((m: any) => m.mandatementSentAt);

  const getCurrentStep = () => {
    if (planSentToOEC) return 7;
    if (planValidated) return 6;
    if (hasPlan) return 5;
    if (allMissionsApproved) return 4;
    if (missionOrders.length > 0) return 3;
    if (mandatementDone) return 2;
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
            <h1 className="text-2xl font-bold text-slate-800">Preparation de l'Evaluation (Etape 6)</h1>
            <p className="text-muted-foreground mt-1">Mandatement, ordres de mission, plan FOR 32</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Dossiers list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en preparation</p>
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
                  <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground py-8">Selectionnez un dossier</p></CardContent></Card>
                ) : (
                  <>
                    {/* Step progress indicator */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          {steps.map((step, i) => (
                            <div key={step.num} className="flex items-center flex-1">
                              <div className={`flex flex-col items-center ${currentStep > step.num ? "text-green-600" : currentStep === step.num ? "text-primary" : "text-gray-300"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${currentStep > step.num ? "bg-green-100 border-green-500" : currentStep === step.num ? "bg-primary/10 border-primary" : "border-gray-200"}`}>
                                  {currentStep > step.num ? <CheckCircle className="w-4 h-4" /> : step.num}
                                </div>
                                <span className="text-[10px] mt-1 text-center leading-tight max-w-[80px]">{step.label}</span>
                              </div>
                              {i < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 ${currentStep > step.num ? "bg-green-400" : "bg-gray-200"}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Step 6.1: Mandatement */}
                    <Card className={currentStep === 1 ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Mail className="w-5 h-5" /> 6.1 Mandatement
                            </CardTitle>
                            <CardDescription>Envoyez un message personnalise a chaque membre de l'equipe</CardDescription>
                          </div>
                          {currentStep <= 1 && (
                            <Button onClick={() => setShowMandatement(true)}>
                              <Send className="w-4 h-4 mr-2" />Envoyer mandatement
                            </Button>
                          )}
                          {currentStep > 1 && <Badge className="bg-green-100 text-green-800">Fait</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {teamMembers.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium text-sm">{m.expert?.fullName}</p>
                                <p className="text-xs text-muted-foreground">{m.role}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">{m.expert?.email}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Step 6.2 & 6.3: Mission Orders + DT/DG Approval */}
                    <Card className={currentStep >= 2 && currentStep <= 3 ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ClipboardList className="w-5 h-5" /> 6.2 / 6.3 Ordres de Mission + Approbation DT/DG
                            </CardTitle>
                            <CardDescription>Creez les ordres de mission - DT et DG doivent les valider</CardDescription>
                          </div>
                          {currentStep >= 2 && !allMissionsApproved && (
                            <Button onClick={() => setShowCreateMission(true)}>
                              <Plus className="w-4 h-4 mr-2" />Nouvel Ordre
                            </Button>
                          )}
                          {currentStep < 2 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                              Envoyez d'abord le mandatement
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N Ordre</TableHead>
                              <TableHead>Membre</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {missionOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>{order.teamMemberName || "---"}</TableCell>
                                <TableCell>
                                  <Badge variant={order.status === "FULLY_APPROVED" ? "default" : "outline"}>
                                    {missionStatusLabels[order.status] || order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {order.status === "FULLY_APPROVED" && (
                                    <Button size="sm" variant="outline" onClick={() => sendMissionToMember(order.id)}>
                                      <Send className="w-3 h-3 mr-1" />Envoyer au membre
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {missionOrders.length === 0 && (
                              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Aucun ordre de mission cree</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                        {missionOrders.some((o: any) => ["PENDING_DT_APPROVAL", "DT_APPROVED", "PENDING_DG_APPROVAL"].includes(o.status)) && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800">En attente d'approbation DT/DG. Les ordres seront valides apres approbation du DT puis du DG.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Step 6.4 & 6.5: Plan FOR 32 (REE creates, RA validates) */}
                    <Card className={currentStep >= 4 && currentStep <= 5 ? "border-primary" : ""}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileCheck className="w-5 h-5" /> 6.4 / 6.5 Plan d'Evaluation FOR 32
                        </CardTitle>
                        <CardDescription>Le REE elabore le plan FOR 32 - Le RA le valide</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!hasPlan ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>En attente que le REE elabore le plan d'evaluation FOR 32...</p>
                            <p className="text-xs mt-1">Le REE peut creer le plan depuis son espace</p>
                          </div>
                        ) : (
                          plans.map((plan: any) => (
                            <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{plan.planCode || "Plan FOR 32"}</p>
                                  <Badge variant="outline" className="mt-1">{planStatusLabels[plan.status] || plan.status}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  {(plan.status === "DRAFT" || plan.status === "SUBMITTED_TO_CD") && (
                                    <Button size="sm" onClick={() => validatePlan(plan.id)}>
                                      <CheckCircle className="w-4 h-4 mr-1" />Valider FOR 32
                                    </Button>
                                  )}
                                  {plan.status === "VALIDATED" && (
                                    <Button size="sm" onClick={() => sendPlanToOEC(plan.id)}>
                                      <Send className="w-4 h-4 mr-1" />Envoyer a l'OEC (5j avant)
                                    </Button>
                                  )}
                                  {plan.status === "SENT_TO_OEC" && (
                                    <Badge className="bg-green-100 text-green-800">Envoye a l'OEC</Badge>
                                  )}
                                </div>
                              </div>
                              {plan.dailyProgram && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Programme journalier</p>
                                  <p className="text-sm whitespace-pre-line">{plan.dailyProgram}</p>
                                </div>
                              )}
                              {plan.activityDistribution && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Repartition des activites</p>
                                  <p className="text-sm whitespace-pre-line">{plan.activityDistribution}</p>
                                </div>
                              )}
                              {plan.evaluationDate && (
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                  <p className="text-sm font-medium text-blue-800">
                                    Date d'evaluation: {new Date(plan.evaluationDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                        {planSentToOEC && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-800">
                              Le plan FOR 32 a ete envoye a l'OEC. L'evaluation peut se derouler selon le planning prevu.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Dialog Mandatement */}
          <Dialog open={showMandatement} onOpenChange={setShowMandatement}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mandatement de l'Equipe</DialogTitle>
                <DialogDescription>Redigez un message personnalise pour chaque membre de l'equipe d'evaluation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {teamMembers.map((m: any) => (
                  <div key={m.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{m.expert?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{m.role} - {m.expert?.email}</p>
                      </div>
                      <Badge variant="outline">{m.role}</Badge>
                    </div>
                    <Textarea
                      value={mandatementMessages[m.id] || ""}
                      onChange={(e) => setMandatementMessages({ ...mandatementMessages, [m.id]: e.target.value })}
                      placeholder={`Message de mandatement pour ${m.expert?.fullName}...`}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMandatement(false)}>Annuler</Button>
                <Button onClick={sendMandatement}>
                  <Send className="w-4 h-4 mr-2" />Envoyer les mandatements
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Create Mission Order */}
          <Dialog open={showCreateMission} onOpenChange={setShowCreateMission}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel Ordre de Mission</DialogTitle>
                <DialogDescription>L'ordre sera soumis au DT puis au DG pour approbation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Membre de l'equipe</Label>
                  <select className="w-full border rounded-md p-2 text-sm" value={missionForm.teamMemberId}
                    onChange={(e) => setMissionForm({ ...missionForm, teamMemberId: e.target.value })}>
                    <option value="">Selectionner...</option>
                    {teamMembers.map((m: any) => (
                      <option key={m.id} value={m.expert?.id}>{m.expert?.fullName} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Details de la mission</Label>
                  <Textarea value={missionForm.missionDetails} onChange={(e) => setMissionForm({ ...missionForm, missionDetails: e.target.value })}
                    placeholder="Objectifs, lieu, duree..." rows={3} />
                </div>
                <div>
                  <Label>Checklist des taches</Label>
                  <Textarea value={missionForm.checklistTasks} onChange={(e) => setMissionForm({ ...missionForm, checklistTasks: e.target.value })}
                    placeholder="1. Verifier les equipements\n2. Examiner les enregistrements..." rows={3} />
                </div>
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
Workflow: Ordre cree {"-->"} DT approuve {"-->"} DG approuve {"-->"} Envoye au membre                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateMission(false)}>Annuler</Button>
                <Button onClick={createMissionOrder} disabled={!missionForm.teamMemberId}>Creer l'ordre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
