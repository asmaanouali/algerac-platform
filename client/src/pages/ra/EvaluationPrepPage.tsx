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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CalendarDays, FileCheck, Send, Plus, ClipboardList, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EvaluationPrepPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [missionOrders, setMissionOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [planForm, setPlanForm] = useState({ dailyProgram: "", activityDistribution: "", schedules: "", documentsToExamine: "" });
  const [missionForm, setMissionForm] = useState({ teamMemberId: "", missionDetails: "", checklistTasks: "" });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

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
          if (memRes.ok) setTeamMembers(await memRes.json());
        }
      }
    } catch (e) { console.error(e); }
  };

  const createPlan = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/evaluation-plan/create", {
        requestId: selectedRequest.id, ...planForm,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Plan d'évaluation créé" });
        setShowCreatePlan(false);
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const validatePlan = async (planId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${planId}/validate`, { approved: true });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Plan d'évaluation validé" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const sendPlanToOEC = async (planId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${planId}/send-to-oec`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Plan d'évaluation envoyé à l'OEC (minimum 5 jours avant évaluation)" });
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

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
        toast({ title: "Succès", description: "Ordre de mission créé et envoyé pour approbation DT/DG" });
        setShowCreateMission(false);
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
        toast({ title: "Succès", description: "Ordre de mission envoyé au membre" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;
  const missionStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon", PENDING_DT_APPROVAL: "Attente DT", DT_APPROVED: "Approuvé DT",
    PENDING_DG_APPROVAL: "Attente DG", FULLY_APPROVED: "Approuvé", SENT_TO_MEMBER: "Envoyé",
    IN_PROGRESS: "En cours", COMPLETED: "Terminé",
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Préparation de l'Évaluation</h1>
            <p className="text-muted-foreground mt-1">Mandats, ordres de mission et plan d'évaluation (Étape 6)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en phase de préparation</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.domain}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardContent className="pt-6">
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : (
                    <Tabs defaultValue="plan">
                      <TabsList className="mb-4">
                        <TabsTrigger value="plan"><CalendarDays className="w-4 h-4 mr-1" />Plan d'Évaluation</TabsTrigger>
                        <TabsTrigger value="missions"><ClipboardList className="w-4 h-4 mr-1" />Ordres de Mission</TabsTrigger>
                        <TabsTrigger value="reunion"><Video className="w-4 h-4 mr-1" />Réunion Préparation</TabsTrigger>
                      </TabsList>

                      <TabsContent value="plan">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Plan d'Évaluation</h3>
                            {plans.length === 0 && (
                              <Button onClick={() => setShowCreatePlan(true)}><Plus className="w-4 h-4 mr-2" />Créer le Plan</Button>
                            )}
                          </div>
                          {plans.map((plan: any) => (
                            <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-medium">{plan.planCode}</p>
                                  <Badge variant="outline">{plan.status}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  {plan.status === "DRAFT" && (
                                    <Button size="sm" onClick={() => validatePlan(plan.id)}>
                                      <FileCheck className="w-4 h-4 mr-1" />Valider
                                    </Button>
                                  )}
                                  {plan.status === "VALIDATED" && (
                                    <Button size="sm" onClick={() => sendPlanToOEC(plan.id)}>
                                      <Send className="w-4 h-4 mr-1" />Envoyer à l'OEC
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {plan.dailyProgram && <div><p className="text-xs font-medium text-muted-foreground">Programme journalier</p><p className="text-sm">{plan.dailyProgram}</p></div>}
                              {plan.activityDistribution && <div><p className="text-xs font-medium text-muted-foreground">Répartition des activités</p><p className="text-sm">{plan.activityDistribution}</p></div>}
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="missions">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Ordres de Mission</h3>
                            <Button onClick={() => setShowCreateMission(true)}><Plus className="w-4 h-4 mr-2" />Nouvel Ordre</Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>N° Ordre</TableHead>
                                <TableHead>Membre</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {missionOrders.map((order: any) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                  <TableCell>{order.teamMemberName || "—"}</TableCell>
                                  <TableCell><Badge variant="outline">{missionStatusLabels[order.status] || order.status}</Badge></TableCell>
                                  <TableCell>
                                    {order.status === "FULLY_APPROVED" && (
                                      <Button size="sm" variant="outline" onClick={() => sendMissionToMember(order.id)}>
                                        <Send className="w-3 h-3 mr-1" />Envoyer
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {missionOrders.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun ordre de mission</TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                            Les ordres de mission doivent être approuvés par le DT et le DG avant envoi aux membres.
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="reunion">
                        <div className="space-y-4">
                          <h3 className="font-medium">Réunion de Préparation</h3>
                          <p className="text-sm text-muted-foreground">
                            Si le dossier est complexe, organisez une réunion de préparation avec les membres de l'équipe.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-dashed">
                              <CardContent className="pt-6 text-center">
                                <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                                <p className="font-medium">Réunion en ligne</p>
                                <p className="text-sm text-muted-foreground mb-3">Google Meet / Teams</p>
                                <Button variant="outline" size="sm">Créer le lien</Button>
                              </CardContent>
                            </Card>
                            <Card className="border-dashed">
                              <CardContent className="pt-6 text-center">
                                <CalendarDays className="w-8 h-8 text-primary mx-auto mb-2" />
                                <p className="font-medium">Réunion sur site</p>
                                <p className="text-sm text-muted-foreground mb-3">ALGERAC - Salle de réunion</p>
                                <Button variant="outline" size="sm">Planifier</Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialog Create Plan */}
          <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer le Plan d'Évaluation</DialogTitle>
                <DialogDescription>Définissez le programme et la répartition des activités</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Programme journalier</label>
                  <Textarea value={planForm.dailyProgram} onChange={(e) => setPlanForm({ ...planForm, dailyProgram: e.target.value })}
                    placeholder="Jour 1: Réunion d'ouverture, visite installations\nJour 2: Évaluation technique..." rows={3} /></div>
                <div><label className="text-sm font-medium">Répartition des activités</label>
                  <Textarea value={planForm.activityDistribution} onChange={(e) => setPlanForm({ ...planForm, activityDistribution: e.target.value })}
                    placeholder="REE: Coordination générale\nET: Essais mécaniques, électriques..." rows={3} /></div>
                <div><label className="text-sm font-medium">Horaires</label>
                  <Input value={planForm.schedules} onChange={(e) => setPlanForm({ ...planForm, schedules: e.target.value })}
                    placeholder="09:00 - 17:00" /></div>
                <div><label className="text-sm font-medium">Documents à examiner</label>
                  <Textarea value={planForm.documentsToExamine} onChange={(e) => setPlanForm({ ...planForm, documentsToExamine: e.target.value })}
                    placeholder="Manuel qualité, procédures, enregistrements..." rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreatePlan(false)}>Annuler</Button>
                <Button onClick={createPlan}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Create Mission Order */}
          <Dialog open={showCreateMission} onOpenChange={setShowCreateMission}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel Ordre de Mission</DialogTitle>
                <DialogDescription>Créez un ordre de mission pour un membre de l'équipe</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Membre de l'équipe</label>
                  <select className="w-full border rounded-md p-2 text-sm" value={missionForm.teamMemberId}
                    onChange={(e) => setMissionForm({ ...missionForm, teamMemberId: e.target.value })}>
                    <option value="">Sélectionner...</option>
                    {teamMembers.map((m: any) => (
                      <option key={m.id} value={m.expert?.id}>{m.expert?.fullName} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div><label className="text-sm font-medium">Détails de la mission</label>
                  <Textarea value={missionForm.missionDetails} onChange={(e) => setMissionForm({ ...missionForm, missionDetails: e.target.value })}
                    placeholder="Objectifs de la mission, lieu, durée..." rows={3} /></div>
                <div><label className="text-sm font-medium">Checklist des tâches</label>
                  <Textarea value={missionForm.checklistTasks} onChange={(e) => setMissionForm({ ...missionForm, checklistTasks: e.target.value })}
                    placeholder="1. Vérifier les équipements\n2. Examiner les enregistrements..." rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateMission(false)}>Annuler</Button>
                <Button onClick={createMissionOrder}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
