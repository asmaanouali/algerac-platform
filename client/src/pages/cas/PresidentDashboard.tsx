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
import { Loader2, Gavel, Vote, FileText, CalendarDays, CheckCircle2, Users, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CASPresidentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ decision: "ACCORDER", presidentNotes: "" });
  const [processing, setProcessing] = useState(false);

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
      if (vRes.ok) setVotes(await vRes.json());
    } catch (e) { console.error(e); }
  };

  const makeDecision = async () => {
    if (!selectedMeeting) return;
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/decide`, {
        decision: decisionForm.decision,
        presidentNotes: decisionForm.presidentNotes,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Décision du CAS enregistrée et transmise" });
        setShowDecision(false);
        setDecisionForm({ decision: "ACCORDER", presidentNotes: "" });
        loadMeetings();
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  if (!user) return null;

  const pendingDecision = meetings.filter((m: any) => ["VOTING", "IN_PROGRESS"].includes(m.status));
  const decided = meetings.filter((m: any) => ["DECIDED", "CLOSED"].includes(m.status));

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
            <div className="flex items-center gap-3">
              <Crown className="w-7 h-7 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Président du CAS</h1>
                <p className="text-muted-foreground mt-1">{user.fullName} — Présidence du Comité d'Accréditation Spécialisé</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Total réunions</p><p className="text-2xl font-bold">{meetings.length}</p></div>
                    <CalendarDays className="w-8 h-8 text-primary/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">En attente de décision</p><p className="text-2xl font-bold text-amber-600">{pendingDecision.length}</p></div>
                    <Vote className="w-8 h-8 text-amber-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Décisions prises</p><p className="text-2xl font-bold text-green-600">{decided.length}</p></div>
                    <Gavel className="w-8 h-8 text-green-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Votes reçus</p><p className="text-2xl font-bold">{votes.length}</p></div>
                    <Users className="w-8 h-8 text-blue-500/60" />
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
                        <Badge variant={["VOTING", "IN_PROGRESS"].includes(m.status) ? "default" : "outline"} className="text-xs mt-1">
                          {m.status === "DECIDED" ? "Décidé" : m.status === "VOTING" ? "En vote" : m.status}
                        </Badge>
                      </div>
                    ))}
                    {meetings.length === 0 && <p className="text-sm text-muted-foreground">Aucune réunion CAS</p>}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {!selectedMeeting ? (
                      <p className="text-center text-muted-foreground py-8">Sélectionnez une réunion</p>
                    ) : (
                      <Tabs defaultValue="dossier">
                        <TabsList className="mb-4">
                          <TabsTrigger value="dossier"><FileText className="w-4 h-4 mr-1" />Dossier</TabsTrigger>
                          <TabsTrigger value="votes"><Vote className="w-4 h-4 mr-1" />Votes ({votes.length})</TabsTrigger>
                          <TabsTrigger value="decision"><Gavel className="w-4 h-4 mr-1" />Décision</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dossier">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold">{selectedMeeting.meetingCode}</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedMeeting.meetingDate ? new Date(selectedMeeting.meetingDate).toLocaleString("fr-FR") : "—"}
                              </p>
                            </div>
                            {selectedMeeting.agenda && (
                              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Ordre du jour</p><p className="text-sm">{selectedMeeting.agenda}</p></div>
                            )}
                            {selectedMeeting.dossierSummary && (
                              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Synthèse du dossier</p><p className="text-sm">{selectedMeeting.dossierSummary}</p></div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="votes">
                          <div className="space-y-4">
                            <h3 className="font-medium">Récapitulatif des Votes</h3>
                            {votes.length > 0 ? (
                              <>
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                  {["ACCORDER", "REFUSER", "AJOURNER", "ABSTENTION"].map((v) => {
                                    const count = votes.filter((vote: any) => vote.vote === v).length;
                                    return (
                                      <div key={v} className="text-center p-2 rounded-lg bg-gray-50">
                                        <p className="text-xl font-bold">{count}</p>
                                        <p className="text-xs text-muted-foreground">{voteLabels[v]?.label}</p>
                                      </div>
                                    );
                                  })}
                                </div>
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
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">Aucun vote enregistré</p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="decision">
                          <div className="space-y-4">
                            {selectedMeeting.finalDecision ? (
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Gavel className="w-5 h-5 text-primary" />
                                    <p className="font-semibold text-lg">Décision finale : {selectedMeeting.finalDecision}</p>
                                  </div>
                                  {selectedMeeting.presidentNotes && <p className="text-sm mt-1">{selectedMeeting.presidentNotes}</p>}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Décision prise par le Président du CAS
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  En tant que Président du CAS, vous pouvez prendre la décision finale après examen de l'ensemble des votes et du dossier.
                                </p>
                                <div className="p-3 bg-amber-50 rounded-lg text-sm">
                                  <p className="font-medium text-amber-800">Rappel des options de décision :</p>
                                  <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
                                    <li><strong>Accorder</strong> — Accréditation délivrée à l'OEC</li>
                                    <li><strong>Refuser</strong> — Accréditation refusée, notification à l'OEC</li>
                                    <li><strong>Ajourner</strong> — Décision reportée, informations complémentaires requises</li>
                                  </ul>
                                </div>
                                <Button onClick={() => setShowDecision(true)} disabled={!["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status)}>
                                  <Gavel className="w-4 h-4 mr-2" />Prendre la Décision Finale
                                </Button>
                              </div>
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

          <Dialog open={showDecision} onOpenChange={setShowDecision}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Décision du Président du CAS</DialogTitle>
                <DialogDescription>Cette décision est définitive et sera communiquée à toutes les parties</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Décision</label>
                  <select className="w-full border rounded-md p-2" value={decisionForm.decision}
                    onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}>
                    <option value="ACCORDER">Accréditation accordée</option>
                    <option value="REFUSER">Accréditation refusée</option>
                    <option value="AJOURNER">Décision ajournée</option>
                  </select></div>
                <div><label className="text-sm font-medium">Notes et observations du Président</label>
                  <Textarea value={decisionForm.presidentNotes} onChange={(e) => setDecisionForm({ ...decisionForm, presidentNotes: e.target.value })}
                    placeholder="Justification de la décision, conditions, observations..." rows={4} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button>
                <Button onClick={makeDecision} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gavel className="w-4 h-4 mr-2" />}
                  Confirmer la Décision
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
