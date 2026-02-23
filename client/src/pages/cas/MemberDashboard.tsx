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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gavel, Vote, FileText, CalendarDays, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function CASMemberDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [voteForm, setVoteForm] = useState({ vote: "ACCORDER", justification: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadMeetings(); }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch("/api/workflow/cas/meetings", { credentials: "include" });
      if (res.ok) setMeetings(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectMeeting = async (meeting: any) => {
    setSelectedMeeting(meeting);
    try {
      const vRes = await fetch(`/api/workflow/cas/${meeting.id}/votes`, { credentials: "include" });
      if (vRes.ok) {
        const allVotes = await vRes.json();
        setVotes(allVotes);
        setMyVotes(allVotes.filter((v: any) => v.voterId === user?.id));
      }
    } catch (e) { console.error(e); }
  };

  const submitVote = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/vote`, {
        voterId: user?.id,
        vote: voteForm.vote,
        justification: voteForm.justification,
        notes: voteForm.notes,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Vote enregistré avec succès" });
        setShowVoteForm(false);
        setVoteForm({ vote: "ACCORDER", justification: "", notes: "" });
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  const plannedMeetings = meetings.filter((m: any) => ["PLANNED", "SUMMONS_SENT", "ATTENDEES_CONFIRMED", "DOSSIER_SENT", "IN_PROGRESS", "VOTING"].includes(m.status));
  const decidedMeetings = meetings.filter((m: any) => ["DECIDED", "CLOSED"].includes(m.status));

  const voteLabels: Record<string, { label: string; color: string }> = {
    ACCORDER: { label: "Accorder", color: "bg-green-100 text-green-800" },
    REFUSER: { label: "Refuser", color: "bg-red-100 text-red-800" },
    AJOURNER: { label: "Ajourner", color: "bg-amber-100 text-amber-800" },
    ABSTENTION: { label: "Abstention", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Comité d'Accréditation Spécialisé</h1>
            <p className="text-muted-foreground mt-1">Membre CAS — {user.fullName}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Réunions planifiées</p><p className="text-2xl font-bold">{plannedMeetings.length}</p></div>
                    <CalendarDays className="w-8 h-8 text-primary/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">En attente de vote</p><p className="text-2xl font-bold">{meetings.filter((m: any) => m.status === "VOTING").length}</p></div>
                    <Vote className="w-8 h-8 text-amber-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Décisions prises</p><p className="text-2xl font-bold">{decidedMeetings.length}</p></div>
                    <Gavel className="w-8 h-8 text-green-500/60" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader><CardTitle className="text-lg">Réunions CAS</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {meetings.map((m: any) => (
                      <div key={m.id} onClick={() => selectMeeting(m)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedMeeting?.id === m.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                        <p className="font-medium text-sm">{m.meetingCode || `CAS #${m.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString("fr-FR") : "Date à définir"}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">{m.status}</Badge>
                      </div>
                    ))}
                    {meetings.length === 0 && <p className="text-sm text-muted-foreground">Aucune réunion CAS</p>}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {!selectedMeeting ? (
                      <p className="text-center text-muted-foreground py-8">Sélectionnez une réunion CAS</p>
                    ) : (
                      <Tabs defaultValue="dossier">
                        <TabsList className="mb-4">
                          <TabsTrigger value="dossier"><FileText className="w-4 h-4 mr-1" />Dossier</TabsTrigger>
                          <TabsTrigger value="vote"><Vote className="w-4 h-4 mr-1" />Mon Vote</TabsTrigger>
                          <TabsTrigger value="results"><Gavel className="w-4 h-4 mr-1" />Résultats</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dossier">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold">{selectedMeeting.meetingCode}</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedMeeting.meetingDate ? new Date(selectedMeeting.meetingDate).toLocaleString("fr-FR") : "—"} — {selectedMeeting.location || "Siège ALGERAC"}
                              </p>
                            </div>
                            {selectedMeeting.agenda && (
                              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Ordre du jour</p><p className="text-sm">{selectedMeeting.agenda}</p></div>
                            )}
                            {selectedMeeting.dossierSummary && (
                              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Synthèse du dossier</p><p className="text-sm">{selectedMeeting.dossierSummary}</p></div>
                            )}
                            <div className="p-3 bg-blue-50 rounded-lg text-sm">
                              <p className="font-medium text-blue-800 mb-1">Documents du dossier</p>
                              <ul className="list-disc list-inside text-blue-700 space-y-1">
                                <li>Rapport d'évaluation validé (FOR 23)</li>
                                <li>Fiches d'écart (FOR 02)</li>
                                <li>Plans d'action et preuves de résolution</li>
                                <li>Recommandation du Chef de Département</li>
                              </ul>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="vote">
                          <div className="space-y-4">
                            {myVotes.length > 0 ? (
                              <div className="p-4 border rounded-lg bg-green-50/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  <p className="font-medium">Vote enregistré</p>
                                </div>
                                {myVotes.map((v: any) => (
                                  <div key={v.id}>
                                    <Badge className={voteLabels[v.vote]?.color || ""}>{voteLabels[v.vote]?.label || v.vote}</Badge>
                                    {v.justification && <p className="text-sm mt-2">{v.justification}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                {["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status) ? (
                                  <p className="text-sm text-muted-foreground">Vous n'avez pas encore voté pour cette réunion.</p>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                                    <Vote className="w-4 h-4" />
                                    <span>En attente d'ouverture du vote par le Président du CAS</span>
                                  </div>
                                )}
                                <Button onClick={() => setShowVoteForm(true)} disabled={!["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status)}>
                                  <Vote className="w-4 h-4 mr-2" />Voter
                                </Button>
                              </>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="results">
                          <div className="space-y-4">
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
                                      <TableCell>{v.voterName || `Membre #${v.voterId}`}</TableCell>
                                      <TableCell><Badge className={voteLabels[v.vote]?.color || ""}>{voteLabels[v.vote]?.label || v.vote}</Badge></TableCell>
                                      <TableCell className="text-sm">{v.justification || "—"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">Aucun vote enregistré</p>
                            )}
                            {selectedMeeting.finalDecision && (
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-4">
                                  <p className="font-semibold">Décision finale : {selectedMeeting.finalDecision}</p>
                                  {selectedMeeting.presidentNotes && <p className="text-sm mt-1">{selectedMeeting.presidentNotes}</p>}
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
            </>
          )}

          <Dialog open={showVoteForm} onOpenChange={setShowVoteForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Voter</DialogTitle>
                <DialogDescription>Enregistrez votre vote pour cette réunion CAS</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Vote</label>
                  <select className="w-full border rounded-md p-2" value={voteForm.vote}
                    onChange={(e) => setVoteForm({ ...voteForm, vote: e.target.value })}>
                    <option value="ACCORDER">Accréditation accordée</option>
                    <option value="REFUSER">Accréditation refusée</option>
                    <option value="AJOURNER">Ajourner la décision</option>
                    <option value="ABSTENTION">Abstention</option>
                  </select></div>
                <div><label className="text-sm font-medium">Justification</label>
                  <Textarea value={voteForm.justification} onChange={(e) => setVoteForm({ ...voteForm, justification: e.target.value })}
                    placeholder="Motivez votre vote..." rows={3} /></div>
                <div><label className="text-sm font-medium">Notes complémentaires</label>
                  <Textarea value={voteForm.notes} onChange={(e) => setVoteForm({ ...voteForm, notes: e.target.value })}
                    placeholder="Observations supplémentaires (optionnel)..." rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVoteForm(false)}>Annuler</Button>
                <Button onClick={submitVote} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Vote className="w-4 h-4 mr-2" />}
                  Confirmer le Vote
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
