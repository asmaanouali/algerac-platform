import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker, TimePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Send, CheckCircle, XCircle, CalendarDays, MapPin, Clock,
  FileCheck, Users, Mail, AlertTriangle, Pencil,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const CD_EVAL_STATUSES = [
  "MANDATES_PENDING_CD", "MANDATES_SENT_TO_TEAM",
  "MISSION_ORDERS_PENDING", "MISSION_ORDERS_PENDING_DT", "MISSION_ORDERS_PENDING_DG", "MISSION_ORDERS_SENT",
  "EVALUATION_PLAN_PENDING_CD", "EVALUATION_PLAN_VALIDATION", "EVALUATION_PLANNED",
];

export default function CDEvaluationPrepPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Mandates
  const [mandates, setMandates] = useState<any[]>([]);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyComments, setModifyComments] = useState("");

  // Meetings
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [teamAvailability, setTeamAvailability] = useState<any[]>([]);
  const [meetingForm, setMeetingForm] = useState({ meetingDate: "", meetingTime: "09:00", location: "Locaux ALGERAC", description: "", agenda: "" });

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planApproved, setPlanApproved] = useState(true);
  const [planComments, setPlanComments] = useState("");
  const [reviewingPlanId, setReviewingPlanId] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) => CD_EVAL_STATUSES.includes(r.status)));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const [mandatesRes, meetingsRes, plansRes, availRes] = await Promise.all([
        fetch(`/api/workflow/mandates/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/preparation-meeting/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/evaluation-plan/by-request/${req.id}`, { credentials: "include" }),
        fetch(`/api/workflow/preparation-meeting/team-availability/${req.id}`, { credentials: "include" }),
      ]);
      if (mandatesRes.ok) setMandates(await mandatesRes.json());
      if (meetingsRes.ok) setMeetings(await meetingsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      if (availRes.ok) setTeamAvailability(await availRes.json());
    } catch (e) { console.error(e); }
  };

  const approveMandates = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/mandates/cd-approve", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Mandatements approuvés et envoyés aux membres de l'équipe" });
        await loadData(); await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const requestModifications = async () => {
    if (!selectedRequest || !modifyComments.trim()) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/mandates/cd-request-modifications", {
        requestId: selectedRequest.id, comments: modifyComments,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Demande de modifications envoyée au RA" });
        setShowModifyDialog(false); setModifyComments("");
        await loadData(); await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const createMeeting = async () => {
    if (!selectedRequest || !meetingForm.meetingDate) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/preparation-meeting/create", {
        requestId: selectedRequest.id, ...meetingForm,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Réunion planifiée" });
        setShowMeetingDialog(false);
        setMeetingForm({ meetingDate: "", meetingTime: "09:00", location: "Locaux ALGERAC", description: "", agenda: "" });
        await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const sendInvitations = async (meetingId: number) => {
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/preparation-meeting/${meetingId}/send-invitations`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Invitations envoyées à l'équipe" });
        await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const validatePlan = async () => {
    if (reviewingPlanId === null) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${reviewingPlanId}/cd-validate`, {
        approved: planApproved, comments: planComments,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: planApproved ? "Plan FOR 32 validé" : "Ajustements demandés au REE" });
        setShowPlanDialog(false); setPlanComments("");
        await loadData(); await selectRequest(selectedRequest);
      } else toast({ title: "Erreur", description: data.message, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  if (!user) return null;

  const mandatesPending = mandates.some((m: any) => m.status === "SENT_TO_CD");
  const mandatesDone = mandates.length > 0 && mandates.every((m: any) => m.status === "SENT_TO_MEMBERS");
  const planPendingCD = plans.some((p: any) => p.status === "PENDING_CD");

  const mandateStatusLabels: Record<string, string> = {
    DRAFT: "Brouillon", SENT_TO_CD: "En attente validation", CD_APPROVED: "Approuvé",
    CD_MODIFICATION_REQUESTED: "Modifications demandées", SENT_TO_MEMBERS: "Envoyé aux membres",
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Préparation Évaluation — CD</h1>
            <p className="text-muted-foreground mt-1">Validation mandatements, réunion de préparation, validation plan FOR 32</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left panel */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle><CardDescription>{requests.length} dossier(s)</CardDescription></CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.oec?.organizationName || r.domain}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Right panel */}
              <div className="lg:col-span-2 space-y-6">
                {!selectedRequest ? (
                  <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p></CardContent></Card>
                ) : (
                  <>
                    {/* Mandatement Validation */}
                    {mandates.length > 0 && (
                      <Card className={mandatesPending ? "border-primary" : ""}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2"><Mail className="w-5 h-5" /> Mandatements</CardTitle>
                              <CardDescription>Tâches et missions des membres de l'équipe</CardDescription>
                            </div>
                            {mandatesPending && (
                              <div className="flex gap-2">
                                <Button onClick={approveMandates} disabled={actionLoading} size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="w-4 h-4 mr-1" />Approuver et envoyer
                                </Button>
                                <Button onClick={() => setShowModifyDialog(true)} size="sm" variant="outline">
                                  <Pencil className="w-4 h-4 mr-1" />Modifications
                                </Button>
                              </div>
                            )}
                            {mandatesDone && <Badge className="bg-green-100 text-green-800">Envoyés ✓</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Membre</TableHead><TableHead>Rôle</TableHead>
                                <TableHead>Tâches</TableHead><TableHead>Missions</TableHead>
                                <TableHead>Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mandates.map((m: any) => (
                                <TableRow key={m.id}>
                                  <TableCell className="font-medium">{m.memberName}</TableCell>
                                  <TableCell><Badge variant="outline">{m.memberRole}</Badge></TableCell>
                                  <TableCell className="text-sm max-w-[150px]"><span className="line-clamp-2">{m.tasks || "—"}</span></TableCell>
                                  <TableCell className="text-sm max-w-[150px]"><span className="line-clamp-2">{m.missions || "—"}</span></TableCell>
                                  <TableCell><Badge variant={m.status === "SENT_TO_MEMBERS" ? "default" : "outline"}>{mandateStatusLabels[m.status] || m.status}</Badge></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {/* Meeting Preparation */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Réunion de Préparation (FOR 47)</CardTitle>
                            <CardDescription>Organisez une réunion de préparation avec l'équipe (optionnel)</CardDescription>
                          </div>
                          <Button onClick={() => setShowMeetingDialog(true)} size="sm" variant="outline">
                            <CalendarDays className="w-4 h-4 mr-1" />Planifier
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {meetings.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Aucune réunion planifiée</p>
                        ) : meetings.map((mtg: any) => (
                          <div key={mtg.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{new Date(mtg.meetingDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                                  {mtg.meetingTime && <span className="text-muted-foreground">à {mtg.meetingTime}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{mtg.location}</span>
                                </div>
                                {mtg.agenda && <div className="text-sm text-muted-foreground mt-2"><strong>Ordre du jour:</strong> {mtg.agenda}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={mtg.status === "INVITATIONS_SENT" ? "default" : "outline"}>
                                  {mtg.status === "PLANNED" ? "Planifiée" : mtg.status === "INVITATIONS_SENT" ? "Invitations envoyées" : "Terminée"}
                                </Badge>
                                {mtg.status === "PLANNED" && (
                                  <Button size="sm" onClick={() => sendInvitations(mtg.id)} disabled={actionLoading}>
                                    <Send className="w-3 h-3 mr-1" />Inviter
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Team availability overview */}
                        {teamAvailability.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Disponibilités de l'équipe (jours indisponibles)</p>
                            <div className="space-y-1">
                              {teamAvailability.map((m: any) => (
                                <div key={m.memberId} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium w-32 truncate">{m.name}</span>
                                  <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                                  {m.unavailableDates?.length > 0 ? (
                                    <span className="text-red-600">{m.unavailableDates.length} jour(s) indisponible(s)</span>
                                  ) : (
                                    <span className="text-green-600">Disponible</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Plan FOR 32 Validation */}
                    {plans.length > 0 && (
                      <Card className={planPendingCD ? "border-primary" : ""}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5" /> Plan FOR 32 — Validation CD</CardTitle>
                          <CardDescription>Validez le plan d'évaluation après vérification par le RA</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {plans.map((plan: any) => (
                            <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{plan.planCode || "Plan FOR 32"}</p>
                                  <Badge variant="outline" className="mt-1">
                                    {plan.status === "PENDING_CD" ? "En attente de votre validation" : 
                                     plan.status === "CD_VALIDATED" ? "Validé par le CD" :
                                     plan.status === "SENT_TO_OEC" ? "Envoyé à l'OEC" : plan.status?.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                {plan.status === "PENDING_CD" && (
                                  <Button size="sm" onClick={() => { setReviewingPlanId(plan.id); setPlanApproved(true); setShowPlanDialog(true); }}>
                                    <FileCheck className="w-4 h-4 mr-1" />Valider
                                  </Button>
                                )}
                                {["CD_VALIDATED", "VALIDATED", "SENT_TO_OEC"].includes(plan.status) && (
                                  <Badge className="bg-green-100 text-green-800">Validé ✓</Badge>
                                )}
                              </div>
                              {plan.dailyProgram && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Programme journalier</p><p className="text-sm whitespace-pre-line">{plan.dailyProgram}</p></div>}
                              {plan.activityDistribution && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Répartition activités</p><p className="text-sm whitespace-pre-line">{plan.activityDistribution}</p></div>}
                              {plan.schedules && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Horaires</p><p className="text-sm whitespace-pre-line">{plan.schedules}</p></div>}
                              {plan.documentsToExamine && <div className="bg-gray-50 p-3 rounded"><p className="text-xs font-medium text-muted-foreground mb-1">Documents à examiner</p><p className="text-sm whitespace-pre-line">{plan.documentsToExamine}</p></div>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modify Mandates Dialog */}
          <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Demander des modifications</DialogTitle>
                <DialogDescription>Précisez les modifications à apporter aux mandatements</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Commentaires / modifications demandées</Label>
                <Textarea value={modifyComments} onChange={(e) => setModifyComments(e.target.value)} placeholder="Détaillez les ajustements à apporter..." rows={5} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModifyDialog(false)}>Annuler</Button>
                <Button onClick={requestModifications} disabled={actionLoading || !modifyComments.trim()} variant="destructive">
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Demander modifications
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Meeting Dialog */}
          <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Planifier une Réunion de Préparation</DialogTitle>
                <DialogDescription>Organisez une réunion avec l'équipe dans les locaux d'ALGERAC ou tout autre lieu (FOR 47)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><StringDatePicker value={meetingForm.meetingDate} onChange={(v) => setMeetingForm({ ...meetingForm, meetingDate: v })} /></div>
                  <div><Label>Heure</Label><TimePicker value={meetingForm.meetingTime} onChange={(v) => setMeetingForm({ ...meetingForm, meetingTime: v })} /></div>
                </div>
                <div><Label>Lieu</Label><Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Locaux ALGERAC, Salle de réunion..." /></div>
                <div><Label>Ordre du jour</Label><Textarea value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} placeholder="Points à aborder..." rows={3} /></div>
                <div><Label>Description (optionnel)</Label><Textarea value={meetingForm.description} onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })} rows={2} /></div>

                {teamAvailability.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium mb-2">Indisponibilités connues:</p>
                    {teamAvailability.filter((m: any) => m.unavailableDates?.length > 0).map((m: any) => (
                      <p key={m.memberId} className="text-xs text-blue-800">{m.name} ({m.role}): {m.unavailableDates.map((d: any) => d.date).join(", ")}</p>
                    ))}
                    {teamAvailability.every((m: any) => !m.unavailableDates?.length) && <p className="text-xs text-green-700">Tous les membres sont disponibles</p>}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>Annuler</Button>
                <Button onClick={createMeeting} disabled={actionLoading || !meetingForm.meetingDate}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarDays className="w-4 h-4 mr-2" />}
                  Planifier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Plan Validation Dialog */}
          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validation du Plan FOR 32</DialogTitle>
                <DialogDescription>Le RA a vérifié l'alignement avec la norme d'accréditation. Donnez votre validation finale.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant={planApproved ? "default" : "outline"} onClick={() => setPlanApproved(true)} className={planApproved ? "bg-green-600 hover:bg-green-700" : ""}>
                    <CheckCircle className="w-4 h-4 mr-2" />Valider
                  </Button>
                  <Button variant={!planApproved ? "destructive" : "outline"} onClick={() => setPlanApproved(false)}>
                    <XCircle className="w-4 h-4 mr-2" />Ajustements
                  </Button>
                </div>
                <div>
                  <Label>{planApproved ? "Commentaires (optionnel)" : "Ajustements demandés"}</Label>
                  <Textarea value={planComments} onChange={(e) => setPlanComments(e.target.value)} placeholder={planApproved ? "Commentaires..." : "Détaillez les ajustements..."} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Annuler</Button>
                <Button onClick={validatePlan} disabled={actionLoading || (!planApproved && !planComments.trim())} className={planApproved ? "bg-green-600 hover:bg-green-700" : ""} variant={planApproved ? "default" : "destructive"}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {planApproved ? "Valider le plan" : "Demander ajustements"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
