import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gavel, CalendarDays, Users, Vote, Send, FileCheck, Play, ShieldCheck, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { consumeDeepLinkedRequest } from "@/lib/ra-resume";

export default function CASPreparationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ meetingDate: "", agenda: "", dossierSummary: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, expRes] = await Promise.all([
        fetch("/api/requests/assigned-to-me", { credentials: "include" }),
        fetch("/api/workflow/available-experts", { credentials: "include" }),
      ]);
      if (reqRes.ok) {
        const all = await reqRes.json();
        const filtered = all.filter((r: any) =>
          ["REPORT_VALIDATED", "CAS_PREPARATION", "CAS_SCHEDULED", "CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT"].includes(r.status)
        );
        setRequests(filtered);
        consumeDeepLinkedRequest(filtered, (req) => { void selectRequest(req); });
      }
      if (expRes.ok) setExperts(await expRes.json());
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch("/api/workflow/cas/meetings", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        const forReq = all.filter((m: any) => m.requestId === req.id);
        setMeetings(forReq);
        if (forReq.length > 0) {
          const [vRes, aRes] = await Promise.all([
            fetch(`/api/workflow/cas/${forReq[0].id}/votes`, { credentials: "include" }),
            fetch(`/api/workflow/cas/${forReq[0].id}/attendees`, { credentials: "include" }),
          ]);
          if (vRes.ok) setVotes(await vRes.json());
          if (aRes.ok) setAttendees(await aRes.json());
        }
      }
    } catch (e) { }
  };

  const scheduleMeeting = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/cas/schedule-meeting", {
        requestId: selectedRequest.id,
        meetingDate: scheduleForm.meetingDate + "T10:00:00",
        agenda: scheduleForm.agenda,
        dossierSummary: scheduleForm.dossierSummary,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Réunion CAS planifiée. Les membres seront convoqués." });
        setShowSchedule(false);
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const sendDecisionToOEC = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/by-request/${selectedRequest.id}/send-decision-to-oec`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Décision CAS transmise à l'OEC" });
        setShowDecision(false);
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  const decisionLabels: Record<string, { label: string; color: string }> = {
    CAS_DECISION_GRANT: { label: "Accréditation accordée", color: "bg-green-100 text-green-800" },
    CAS_DECISION_REFUSAL: { label: "Accréditation refusée", color: "bg-red-100 text-red-800" },
    CAS_DECISION_POSTPONEMENT: { label: "Décision ajournée", color: "bg-amber-100 text-amber-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Comité d'Accréditation Spécialisé (CAS)</h1>
            <p className="text-muted-foreground mt-1">Préparez et gérez les réunions du CAS (Étape 11)</p>
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
                      {decisionLabels[r.status] && (
                        <Badge className={`mt-1 text-xs ${decisionLabels[r.status].color}`}>{decisionLabels[r.status].label}</Badge>
                      )}
                    </div>
                  ))}
                  {requests.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier en phase CAS</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardContent className="pt-6">
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : (
                    <Tabs defaultValue="preparation">
                      <TabsList className="mb-4">
                        <TabsTrigger value="preparation"><FileCheck className="w-4 h-4 mr-1" />Préparation</TabsTrigger>
                        <TabsTrigger value="meeting"><Gavel className="w-4 h-4 mr-1" />Réunion</TabsTrigger>
                        <TabsTrigger value="votes"><Vote className="w-4 h-4 mr-1" />Votes & Décision</TabsTrigger>
                      </TabsList>

                      <TabsContent value="preparation">
                        <div className="space-y-4">
                          <h3 className="font-medium flex items-center gap-2"><FileCheck className="w-5 h-5" />Dossier CAS Complet</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              "Rapport d'évaluation validé",
                              "FOR 23 (Appréciation rapport)",
                              "Fiches d'écart (FOR 02) avec statut",
                              "Preuves de résolution écarts critiques",
                              "Plans d'action écarts non-critiques",
                              "Historique complet du dossier",
                              "Recommandation du CD",
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                                <FileCheck className="w-4 h-4 text-green-600 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>

                          {meetings.length === 0 && (
                            <Button className="mt-4" onClick={() => setShowSchedule(true)}>
                              <CalendarDays className="w-4 h-4 mr-2" />Planifier la Réunion CAS
                            </Button>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="meeting">
                        <div className="space-y-4">
                          {meetings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Aucune réunion planifiée</p>
                          ) : meetings.map((meeting: any) => {
                            const statusLabels: Record<string, { label: string; color: string }> = {
                              PLANNED: { label: "Planifiée", color: "bg-blue-100 text-blue-800" },
                              SUMMONS_SENT: { label: "Convocations envoyées", color: "bg-indigo-100 text-indigo-800" },
                              ATTENDEES_CONFIRMED: { label: "Présences confirmées", color: "bg-cyan-100 text-cyan-800" },
                              DOSSIER_SENT: { label: "Dossiers transmis", color: "bg-violet-100 text-violet-800" },
                              IN_PROGRESS: { label: "En cours", color: "bg-orange-100 text-orange-800" },
                              VOTING: { label: "Vote ouvert", color: "bg-emerald-100 text-emerald-800" },
                              DECIDED: { label: "Décidé", color: "bg-green-100 text-green-800" },
                              CLOSED: { label: "Clôturée", color: "bg-gray-100 text-gray-800" },
                            };
                            const si = statusLabels[meeting.status] || { label: meeting.status, color: "bg-gray-100 text-gray-800" };
                            return (
                              <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-semibold">{meeting.meetingCode}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleString("fr-FR") : "Date à définir"} — {meeting.location}
                                    </p>
                                  </div>
                                  <Badge className={si.color}>{si.label}</Badge>
                                </div>
                                {meeting.agenda && <div><p className="text-xs font-medium text-muted-foreground">Ordre du jour</p><p className="text-sm">{meeting.agenda}</p></div>}
                                {meeting.dossierSummary && <div><p className="text-xs font-medium text-muted-foreground">Synthèse du dossier</p><p className="text-sm">{meeting.dossierSummary}</p></div>}

                                {/* PRO 07 Workflow steps */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4" /> Flux PRO 07 — Étapes de la réunion
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { key: "PLANNED", label: "Planifiée" },
                                      { key: "SUMMONS_SENT", label: "Convoquée" },
                                      { key: "ATTENDEES_CONFIRMED", label: "Présences" },
                                      { key: "DOSSIER_SENT", label: "Dossier" },
                                      { key: "IN_PROGRESS", label: "En cours" },
                                      { key: "VOTING", label: "Vote" },
                                      { key: "DECIDED", label: "Décidé" },
                                    ].map((step) => {
                                      const order = ["PLANNED", "SUMMONS_SENT", "ATTENDEES_CONFIRMED", "DOSSIER_SENT", "IN_PROGRESS", "VOTING", "DECIDED"];
                                      const isCompleted = order.indexOf(step.key) < order.indexOf(meeting.status);
                                      const isCurrent = step.key === meeting.status;
                                      return (
                                        <Badge key={step.key} className={
                                          isCompleted ? "bg-green-100 text-green-700" :
                                          isCurrent ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                                        }>
                                          {isCompleted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                          {step.label}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Attendees */}
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Membres CAS ({attendees.length} confirmés)
                                  </h4>
                                  {attendees.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {attendees.map((a: any, i: number) => (
                                        <div key={i} className={`flex items-center gap-2 p-2 rounded text-sm ${a.hasConflictOfInterest ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
                                          {a.hasConflictOfInterest ? (
                                            <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                                          ) : (
                                            <Users className="w-4 h-4 text-primary shrink-0" />
                                          )}
                                          <span>{a.voterName}</span>
                                          {a.hasVoted && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                      {experts.slice(0, 4).map((exp: any) => (
                                        <div key={exp.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                          <Users className="w-4 h-4 text-primary" />
                                          <span>{exp.fullName}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* PRO 07 Actions */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {meeting.status === "PLANNED" && (
                                    <Button size="sm" onClick={async () => {
                                      setSubmitting(true);
                                      try {
                                        await apiRequest("POST", `/api/workflow/cas/${meeting.id}/send-summons`, {});
                                        toast({ title: "Convocations envoyées", description: "PRO 07 — Les membres CAS ont été convoqués" });
                                        selectRequest(selectedRequest); loadData();
                                      } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                                      setSubmitting(false);
                                    }} disabled={submitting}>
                                      <Send className="w-3 h-3 mr-1" />Envoyer convocations
                                    </Button>
                                  )}
                                  {["PLANNED", "SUMMONS_SENT"].includes(meeting.status) && (
                                    <Button size="sm" variant="outline" onClick={async () => {
                                      setSubmitting(true);
                                      try {
                                        await apiRequest("POST", `/api/workflow/cas/${meeting.id}/send-dossier`, {});
                                        toast({ title: "Dossier transmis", description: "PRO 07 §5.3 — Dossier disponible pour les membres" });
                                        selectRequest(selectedRequest); loadData();
                                      } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                                      setSubmitting(false);
                                    }} disabled={submitting}>
                                      <FileCheck className="w-3 h-3 mr-1" />Transmettre dossier
                                    </Button>
                                  )}
                                  {["ATTENDEES_CONFIRMED", "DOSSIER_SENT"].includes(meeting.status) && (
                                    <Button size="sm" onClick={async () => {
                                      setSubmitting(true);
                                      try {
                                        await apiRequest("POST", `/api/workflow/cas/${meeting.id}/start-meeting`, {});
                                        toast({ title: "Réunion démarrée" });
                                        selectRequest(selectedRequest); loadData();
                                      } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                                      setSubmitting(false);
                                    }} disabled={submitting}>
                                      <Play className="w-3 h-3 mr-1" />Démarrer réunion
                                    </Button>
                                  )}
                                  {meeting.status === "IN_PROGRESS" && (
                                    <Button size="sm" onClick={async () => {
                                      setSubmitting(true);
                                      try {
                                        await apiRequest("POST", `/api/workflow/cas/${meeting.id}/open-vote`, {});
                                        toast({ title: "Vote ouvert" });
                                        selectRequest(selectedRequest); loadData();
                                      } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                                      setSubmitting(false);
                                    }} disabled={submitting}>
                                      <Vote className="w-3 h-3 mr-1" />Ouvrir le vote
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="votes">
                        <div className="space-y-4">
                          <h3 className="font-medium flex items-center gap-2"><Vote className="w-5 h-5" />Avis FOR 14 des Membres CAS</h3>
                          {votes.filter((v: any) => v.vote && v.vote !== "PENDING").length > 0 ? (
                            <>
                              {/* Vote summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {["ACCORDER", "REFUSER", "AJOURNER", "ABSTENTION"].map(key => {
                                  const count = votes.filter((v: any) => v.vote === key || v.vote?.startsWith(key)).length;
                                  const colors: Record<string, string> = {
                                    ACCORDER: "bg-green-100 text-green-800",
                                    REFUSER: "bg-red-100 text-red-800",
                                    AJOURNER: "bg-amber-100 text-amber-800",
                                    ABSTENTION: "bg-gray-100 text-gray-800",
                                  };
                                  const labels: Record<string, string> = {
                                    ACCORDER: "Accorder", REFUSER: "Refuser", AJOURNER: "Ajourner", ABSTENTION: "Abstention",
                                  };
                                  return (
                                    <div key={key} className={`text-center p-3 rounded-lg ${colors[key]}`}>
                                      <p className="text-xl font-bold">{count}</p>
                                      <p className="text-xs">{labels[key]}</p>
                                    </div>
                                  );
                                })}
                              </div>

                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Membre</TableHead>
                                    <TableHead>Avis</TableHead>
                                    <TableHead>Justification</TableHead>
                                    <TableHead>Conformité</TableHead>
                                    <TableHead>Compétence</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {votes.filter((v: any) => v.vote && v.vote !== "PENDING").map((v: any) => (
                                    <TableRow key={v.id}>
                                      <TableCell className="font-medium">{v.voterName}</TableCell>
                                      <TableCell>
                                        <Badge variant={v.vote?.startsWith("ACCORDER") ? "default" : v.vote === "REFUSER" ? "destructive" : "secondary"}>
                                          {v.vote}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm max-w-[200px] truncate">{v.justification}</TableCell>
                                      <TableCell className="text-xs">{v.for14ConformityAssessment || "—"}</TableCell>
                                      <TableCell className="text-xs">{v.for14CompetenceAssessment || "—"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg">
                              <Clock className="w-5 h-5 shrink-0" />
                              <p>Aucun avis FOR 14 enregistré — en attente d'ouverture du vote</p>
                            </div>
                          )}

                          {meetings.length > 0 && meetings[0].finalDecision && !["CERTIFICATE_PREPARATION", "COMPLETED"].includes(selectedRequest?.status) && (
                            <Button onClick={() => sendDecisionToOEC()} disabled={submitting}>
                              <Send className="w-4 h-4 mr-2" />Transmettre la Décision à l'OEC
                            </Button>
                          )}

                          {meetings.length > 0 && meetings[0].finalDecision && (
                            <Card className="bg-primary/5 border-primary/20">
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Gavel className="w-5 h-5 text-primary" />
                                  <p className="font-semibold text-lg">Décision finale (FOR 15)</p>
                                </div>
                                <Badge className={
                                  meetings[0].finalDecision?.startsWith("ACCORDER") ? "bg-green-100 text-green-800" :
                                  meetings[0].finalDecision === "REFUSER" ? "bg-red-100 text-red-800" :
                                  "bg-amber-100 text-amber-800"
                                }>
                                  {meetings[0].finalDecision}
                                </Badge>
                                {meetings[0].for15DecisionJustification && (
                                  <div className="p-3 bg-white/50 rounded border">
                                    <p className="text-xs font-medium text-muted-foreground">Justification (PRO 16)</p>
                                    <p className="text-sm mt-1">{meetings[0].for15DecisionJustification}</p>
                                  </div>
                                )}
                                {meetings[0].presidentNotes && (
                                  <div className="p-3 bg-white/50 rounded border">
                                    <p className="text-xs font-medium text-muted-foreground">Notes du Président</p>
                                    <p className="text-sm mt-1">{meetings[0].presidentNotes}</p>
                                  </div>
                                )}
                                {meetings[0].for15AppealRightsNotice && (
                                  <div className="p-3 bg-indigo-50/50 rounded border border-indigo-200">
                                    <p className="text-xs font-medium text-indigo-800">Droit de recours (GEN 04)</p>
                                    <p className="text-sm mt-1 text-indigo-700">{meetings[0].for15AppealRightsNotice}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Planifier la Réunion CAS</DialogTitle>
                <DialogDescription>Convocation du Comité d'Accréditation Spécialisé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Date de la réunion</label>
                  <StringDatePicker value={scheduleForm.meetingDate} onChange={(v) => setScheduleForm({ ...scheduleForm, meetingDate: v })} /></div>
                <div><label className="text-sm font-medium">Ordre du jour</label>
                  <Textarea value={scheduleForm.agenda} onChange={(e) => setScheduleForm({ ...scheduleForm, agenda: e.target.value })}
                    placeholder="Points à traiter lors de la réunion..." rows={3} /></div>
                <div><label className="text-sm font-medium">Synthèse du dossier</label>
                  <Textarea value={scheduleForm.dossierSummary} onChange={(e) => setScheduleForm({ ...scheduleForm, dossierSummary: e.target.value })}
                    placeholder="Résumé du dossier pour les membres du CAS..." rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSchedule(false)}>Annuler</Button>
                <Button onClick={scheduleMeeting}>Planifier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDecision} onOpenChange={setShowDecision}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transmettre la Décision à l'OEC</DialogTitle>
                <DialogDescription>Confirmez la transmission de la décision du CAS à l'Organisme d'Évaluation de la Conformité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {meetings.length > 0 && meetings[0].finalDecision && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Décision du CAS</p>
                    <Badge className={
                      meetings[0].finalDecision?.startsWith("ACCORDER") ? "bg-green-100 text-green-800" :
                      meetings[0].finalDecision === "REFUSER" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    }>
                      {meetings[0].finalDecision}
                    </Badge>
                    {meetings[0].for15DecisionJustification && (
                      <p className="text-sm mt-2">{meetings[0].for15DecisionJustification}</p>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  L'OEC sera notifié de la décision avec mention du droit de recours (GEN 04).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button>
                <Button onClick={sendDecisionToOEC} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Confirmer la transmission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
