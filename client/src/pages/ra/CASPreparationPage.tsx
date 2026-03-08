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
import { Loader2, Gavel, CalendarDays, Users, Vote, Send, FileCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CASPreparationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ meetingDate: "", agenda: "", dossierSummary: "" });
  const [decisionForm, setDecisionForm] = useState({ decision: "ACCORDER", presidentNotes: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, expRes] = await Promise.all([
        fetch("/api/requests/assigned-to-me", { credentials: "include" }),
        fetch("/api/workflow/available-experts", { credentials: "include" }),
      ]);
      if (reqRes.ok) {
        const all = await reqRes.json();
        setRequests(all.filter((r: any) =>
          ["REPORT_VALIDATED", "CAS_PREPARATION", "CAS_SCHEDULED", "CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT"].includes(r.status)
        ));
      }
      if (expRes.ok) setExperts(await expRes.json());
    } catch (e) { console.error(e); }
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
          const vRes = await fetch(`/api/workflow/cas/${forReq[0].id}/votes`, { credentials: "include" });
          if (vRes.ok) setVotes(await vRes.json());
        }
      }
    } catch (e) { console.error(e); }
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

  const makeDecision = async () => {
    const meeting = meetings[0];
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${meeting.id}/decide`, {
        decision: decisionForm.decision,
        presidentNotes: decisionForm.presidentNotes,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Décision CAS enregistrée et transmise" });
        setShowDecision(false);
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
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
            <h1 className="text-2xl font-bold text-slate-800">Comité d'Accréditation Spécialisé (CAS)</h1>
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
                          ) : meetings.map((meeting: any) => (
                            <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-semibold">{meeting.meetingCode}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleString("fr-FR") : "Date à définir"} — {meeting.location}
                                  </p>
                                </div>
                                <Badge variant="outline">{meeting.status}</Badge>
                              </div>
                              {meeting.agenda && <div><p className="text-xs font-medium text-muted-foreground">Ordre du jour</p><p className="text-sm">{meeting.agenda}</p></div>}
                              {meeting.dossierSummary && <div><p className="text-xs font-medium text-muted-foreground">Synthèse du dossier</p><p className="text-sm">{meeting.dossierSummary}</p></div>}

                              <h4 className="font-medium text-sm mt-2">Membres CAS disponibles</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {experts.slice(0, 4).map((exp: any) => (
                                  <div key={exp.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span>{exp.fullName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="votes">
                        <div className="space-y-4">
                          <h3 className="font-medium">Résultats des Votes</h3>
                          {votes.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Membre</TableHead>
                                  <TableHead>Vote</TableHead>
                                  <TableHead>Justification</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {votes.map((v: any) => (
                                  <TableRow key={v.id}>
                                    <TableCell>{v.voterName}</TableCell>
                                    <TableCell>
                                      <Badge variant={v.vote === "ACCORDER" ? "default" : v.vote === "REFUSER" ? "destructive" : "secondary"}>
                                        {v.vote}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{v.justification}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucun vote enregistré</p>
                          )}

                          {meetings.length > 0 && meetings[0].status !== "DECIDED" && (
                            <Button onClick={() => setShowDecision(true)}>
                              <Gavel className="w-4 h-4 mr-2" />Prendre la Décision Finale
                            </Button>
                          )}

                          {meetings.length > 0 && meetings[0].finalDecision && (
                            <Card className="bg-primary/5 border-primary/20">
                              <CardContent className="pt-4">
                                <p className="font-semibold">Décision finale : {meetings[0].finalDecision}</p>
                                {meetings[0].presidentNotes && <p className="text-sm mt-1">{meetings[0].presidentNotes}</p>}
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
                <DialogTitle>Décision du Président du CAS</DialogTitle>
                <DialogDescription>Enregistrez la décision finale du comité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Décision</label>
                  <select className="w-full border rounded-md p-2" value={decisionForm.decision}
                    onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}>
                    <option value="ACCORDER">Accréditation accordée</option>
                    <option value="REFUSER">Accréditation refusée</option>
                    <option value="AJOURNER">Décision ajournée</option>
                  </select>
                </div>
                <div><label className="text-sm font-medium">Notes du président</label>
                  <Textarea value={decisionForm.presidentNotes} onChange={(e) => setDecisionForm({ ...decisionForm, presidentNotes: e.target.value })}
                    placeholder="Observations et justification de la décision..." rows={4} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button>
                <Button onClick={makeDecision}>Enregistrer la Décision</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
