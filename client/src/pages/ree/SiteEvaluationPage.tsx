import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ClipboardCheck, Users, AlertTriangle, FileText, CheckCircle, XCircle, Play, Square, MessageSquare, Shield, Clock, Send } from "lucide-react";

export default function SiteEvaluationPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [contestations, setContestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showOpeningMeeting, setShowOpeningMeeting] = useState(false);
  const [showClosingMeeting, setShowClosingMeeting] = useState(false);
  const [showGapForm, setShowGapForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showConsensus, setShowConsensus] = useState(false);

  // Form states
  const [openingForm, setOpeningForm] = useState({ attendees: "", openingDetails: "" });
  const [closingForm, setClosingForm] = useState({
    closingDetails: "", generalResults: "", strengths: "",
    improvements: "", gapConsequences: "", appealRights: ""
  });
  const [gapForm, setGapForm] = useState({
    type: "NON_CRITIQUE", description: "", requirement: "", evidence: "", for02Content: ""
  });
  const [noteForm, setNoteForm] = useState({
    noteType: "EVALUATION", observations: "", synthesis: "", checklistStatus: "", role: "ET"
  });
  const [consensusForm, setConsensusForm] = useState({
    consensusDetails: "", consensusReached: true, cdArbitration: ""
  });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const evaluationRequests = data.data.filter((r: any) =>
          ["EVALUATION_PLANNED", "EVALUATION_IN_PROGRESS", "EVALUATION_COMPLETED",
           "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION", "GAPS_RESOLVED"].includes(r.status)
        );
        setRequests(evaluationRequests);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadRequestDetails = async (request: any) => {
    setSelectedRequest(request);
    try {
      const [gapsRes, contestRes] = await Promise.all([
        fetch(`/api/workflow/site-evaluation/${request.id}/gaps`, { credentials: "include" }),
        fetch(`/api/workflow/site-evaluation/${request.id}/contestations`, { credentials: "include" })
      ]);
      const gapsData = await gapsRes.json();
      const contestData = await contestRes.json();
      if (gapsData.success) setGaps(gapsData.data || []);
      if (contestData.success) setContestations(contestData.data || []);

      const notesRes = await fetch(`/api/workflow/notes/${request.id}`, { credentials: "include" });
      const notesData = await notesRes.json();
      if (notesData.success) setNotes(notesData.data || []);
    } catch (err) { console.error(err); }
  };

  const handleOpeningMeeting = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/opening-meeting`, openingForm);
      toast({ title: "Réunion d'ouverture démarrée" });
      setShowOpeningMeeting(false);
      setOpeningForm({ attendees: "", openingDetails: "" });
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleClosingMeeting = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/closing-meeting`, closingForm);
      toast({ title: "Réunion de clôture terminée" });
      setShowClosingMeeting(false);
      setClosingForm({ closingDetails: "", generalResults: "", strengths: "", improvements: "", gapConsequences: "", appealRights: "" });
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCreateGap = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/gap`, gapForm);
      toast({ title: "Écart FOR 02 créé" });
      setShowGapForm(false);
      setGapForm({ type: "NON_CRITIQUE", description: "", requirement: "", evidence: "", for02Content: "" });
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCreateNote = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/evaluator-note`, noteForm);
      toast({ title: "Note d'évaluation enregistrée" });
      setShowNoteForm(false);
      setNoteForm({ noteType: "EVALUATION", observations: "", synthesis: "", checklistStatus: "", role: "ET" });
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleConsensus = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/consensus`, consensusForm);
      toast({ title: "Consensus enregistré" });
      setShowConsensus(false);
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTransmitDocs = async () => {
    try {
      await apiRequest("POST", `/api/workflow/site-evaluation/${selectedRequest.id}/transmit-closing-docs`, {
        attendanceSheets: "Feuilles de présence jointes",
        missionOrderRefs: "Ordres de mission référencés"
      });
      toast({ title: "Documents de clôture transmis au CD/RA" });
      loadRequestDetails(selectedRequest);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      EVALUATION_PLANNED: "bg-blue-100 text-blue-800",
      EVALUATION_IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      EVALUATION_COMPLETED: "bg-green-100 text-green-800",
      AWAITING_ACTION_PLANS: "bg-orange-100 text-orange-800",
      ACTION_PLANS_EVALUATION: "bg-purple-100 text-purple-800",
      GAPS_RESOLVED: "bg-emerald-100 text-emerald-800"
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status.replace(/_/g, " ")}</Badge>;
  };

  const getGapBadge = (type: string) => (
    <Badge className={type === "CRITIQUE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
      {type === "CRITIQUE" ? "Critique" : "Non Critique"}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Évaluation sur Site</h1>
            <p className="text-muted-foreground">Gestion de l'évaluation terrain - Phase II</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Request List */}
            <div className="lg:col-span-1 space-y-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dossiers en évaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => loadRequestDetails(r)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedRequest?.id === r.id
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-sm">{r.referenceNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.currentStep}</p>
                        <div className="mt-1">{getStatusBadge(r.status)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Detail Area */}
            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier pour commencer</p>
                </Card>
              ) : (
                <Tabs defaultValue="evaluation">
                  <TabsList className="mb-4">
                    <TabsTrigger value="evaluation"><Play className="w-4 h-4 mr-1" />Évaluation</TabsTrigger>
                    <TabsTrigger value="gaps"><AlertTriangle className="w-4 h-4 mr-1" />Écarts ({gaps.length})</TabsTrigger>
                    <TabsTrigger value="notes"><FileText className="w-4 h-4 mr-1" />Notes ({notes.length})</TabsTrigger>
                    <TabsTrigger value="contestations"><Shield className="w-4 h-4 mr-1" />Contestations ({contestations.length})</TabsTrigger>
                  </TabsList>

                  {/* ÉVALUATION TAB */}
                  <TabsContent value="evaluation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Conduite de l'évaluation</CardTitle>
                        <CardDescription>
                          {selectedRequest.referenceNumber} — {selectedRequest.currentStep}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Card className="p-4 text-center">
                            <p className="text-2xl font-bold">{gaps.length}</p>
                            <p className="text-xs text-muted-foreground">Écarts identifiés</p>
                          </Card>
                          <Card className="p-4 text-center">
                            <p className="text-2xl font-bold">{gaps.filter((g: any) => g.type === "CRITIQUE").length}</p>
                            <p className="text-xs text-muted-foreground">Écarts critiques</p>
                          </Card>
                          <Card className="p-4 text-center">
                            <p className="text-2xl font-bold">{notes.length}</p>
                            <p className="text-xs text-muted-foreground">Notes d'évaluation</p>
                          </Card>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.status === "EVALUATION_PLANNED" && (
                            <Button onClick={() => setShowOpeningMeeting(true)}>
                              <Play className="w-4 h-4 mr-2" />Réunion d'ouverture
                            </Button>
                          )}
                          {selectedRequest.status === "EVALUATION_IN_PROGRESS" && (
                            <>
                              <Button onClick={() => setShowNoteForm(true)} variant="outline">
                                <FileText className="w-4 h-4 mr-2" />Ajouter une note
                              </Button>
                              <Button onClick={() => setShowGapForm(true)} variant="outline" className="text-orange-600">
                                <AlertTriangle className="w-4 h-4 mr-2" />Signaler un écart (FOR 02)
                              </Button>
                              <Button onClick={() => setShowConsensus(true)} variant="outline">
                                <Users className="w-4 h-4 mr-2" />Consensus équipe
                              </Button>
                              <Button onClick={() => setShowClosingMeeting(true)} variant="destructive">
                                <Square className="w-4 h-4 mr-2" />Réunion de clôture
                              </Button>
                            </>
                          )}
                          {selectedRequest.status === "EVALUATION_COMPLETED" && (
                            <Button onClick={handleTransmitDocs}>
                              <Send className="w-4 h-4 mr-2" />Transmettre les documents de clôture
                            </Button>
                          )}
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2">Progression</h4>
                          <p className="text-sm"><strong>Phase:</strong> {selectedRequest.currentPhase || "Phase II - Évaluation sur site"}</p>
                          <p className="text-sm"><strong>Étape:</strong> {selectedRequest.currentStep}</p>
                          <p className="text-sm"><strong>Prochaine action:</strong> {selectedRequest.nextAction}</p>
                          <p className="text-sm"><strong>En attente de:</strong> {selectedRequest.pendingWith}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ÉCARTS TAB */}
                  <TabsContent value="gaps">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fiches d'écarts (FOR 02)</CardTitle>
                        <CardDescription>Écarts identifiés lors de l'évaluation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {gaps.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">Aucun écart identifié</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Exigence</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Requalifié</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gaps.map((gap: any) => (
                                <TableRow key={gap.id}>
                                  <TableCell className="font-mono text-sm">{gap.gapCode}</TableCell>
                                  <TableCell>{getGapBadge(gap.type)}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{gap.requirement}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{gap.description}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{gap.status?.replace(/_/g, " ")}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {gap.reclassifiedToCritical && (
                                      <Badge className="bg-red-100 text-red-800">Requalifié</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* NOTES TAB */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes d'évaluation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {notes.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">Aucune note</p>
                        ) : (
                          notes.map((note: any) => (
                            <Card key={note.id} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{note.noteType}</Badge>
                                  <span className="text-sm text-muted-foreground">{note.authorName}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleString("fr-FR")}
                                </span>
                              </div>
                              {note.observations && (
                                <p className="text-sm whitespace-pre-wrap">{note.observations}</p>
                              )}
                              {note.synthesis && (
                                <p className="text-sm mt-2 text-muted-foreground italic">{note.synthesis}</p>
                              )}
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* CONTESTATIONS TAB */}
                  <TabsContent value="contestations">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contestations d'écarts</CardTitle>
                        <CardDescription>Contestations déposées par l'OEC</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {contestations.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">Aucune contestation</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Écart</TableHead>
                                <TableHead>Motif</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Examinateur</TableHead>
                                <TableHead>Décision</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {contestations.map((c: any) => (
                                <TableRow key={c.id}>
                                  <TableCell className="font-mono text-sm">{c.gap?.gapCode}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{c.contestationReason}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{c.status?.replace(/_/g, " ")}</Badge>
                                  </TableCell>
                                  <TableCell>{c.designatedExaminer?.fullName || "—"}</TableCell>
                                  <TableCell>
                                    {c.contestationFounded === true && <Badge className="bg-green-100 text-green-800">Fondée</Badge>}
                                    {c.contestationFounded === false && <Badge className="bg-red-100 text-red-800">Non fondée</Badge>}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>

          {/* DIALOGS */}

          {/* Opening Meeting Dialog */}
          <Dialog open={showOpeningMeeting} onOpenChange={setShowOpeningMeeting}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Réunion d'ouverture</DialogTitle>
                <DialogDescription>Démarrer l'évaluation par la réunion d'ouverture</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Participants présents</Label>
                  <Textarea
                    placeholder="Liste des participants..."
                    value={openingForm.attendees}
                    onChange={(e) => setOpeningForm({ ...openingForm, attendees: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Détails de la réunion</Label>
                  <Textarea
                    placeholder="Objectifs, programme, modalités..."
                    value={openingForm.openingDetails}
                    onChange={(e) => setOpeningForm({ ...openingForm, openingDetails: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOpeningMeeting(false)}>Annuler</Button>
                <Button onClick={handleOpeningMeeting}>
                  <Play className="w-4 h-4 mr-2" />Démarrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Closing Meeting Dialog */}
          <Dialog open={showClosingMeeting} onOpenChange={setShowClosingMeeting}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Réunion de clôture</DialogTitle>
                <DialogDescription>Présentation des résultats à l'OEC</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Résultats généraux</Label>
                  <Textarea value={closingForm.generalResults}
                    onChange={(e) => setClosingForm({ ...closingForm, generalResults: e.target.value })} />
                </div>
                <div>
                  <Label>Points forts</Label>
                  <Textarea value={closingForm.strengths}
                    onChange={(e) => setClosingForm({ ...closingForm, strengths: e.target.value })} />
                </div>
                <div>
                  <Label>Points d'amélioration</Label>
                  <Textarea value={closingForm.improvements}
                    onChange={(e) => setClosingForm({ ...closingForm, improvements: e.target.value })} />
                </div>
                <div>
                  <Label>Conséquences des écarts sur l'accréditation</Label>
                  <Textarea value={closingForm.gapConsequences}
                    onChange={(e) => setClosingForm({ ...closingForm, gapConsequences: e.target.value })} />
                </div>
                <div>
                  <Label>Droit de recours</Label>
                  <Textarea value={closingForm.appealRights}
                    onChange={(e) => setClosingForm({ ...closingForm, appealRights: e.target.value })} />
                </div>
                <div>
                  <Label>Détails de clôture</Label>
                  <Textarea value={closingForm.closingDetails}
                    onChange={(e) => setClosingForm({ ...closingForm, closingDetails: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClosingMeeting(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleClosingMeeting}>
                  <Square className="w-4 h-4 mr-2" />Clôturer l'évaluation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Gap Form Dialog */}
          <Dialog open={showGapForm} onOpenChange={setShowGapForm}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Fiche d'écart FOR 02</DialogTitle>
                <DialogDescription>Signaler un écart identifié</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type d'écart</Label>
                  <Select value={gapForm.type} onValueChange={(v) => setGapForm({ ...gapForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NON_CRITIQUE">Non Critique</SelectItem>
                      <SelectItem value="CRITIQUE">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Exigence concernée</Label>
                  <Input value={gapForm.requirement}
                    onChange={(e) => setGapForm({ ...gapForm, requirement: e.target.value })}
                    placeholder="Ex: ISO 17025 - 7.2.1" />
                </div>
                <div>
                  <Label>Description de l'écart</Label>
                  <Textarea value={gapForm.description}
                    onChange={(e) => setGapForm({ ...gapForm, description: e.target.value })} />
                </div>
                <div>
                  <Label>Preuves objectives</Label>
                  <Textarea value={gapForm.evidence}
                    onChange={(e) => setGapForm({ ...gapForm, evidence: e.target.value })} />
                </div>
                <div>
                  <Label>Contenu FOR 02</Label>
                  <Textarea value={gapForm.for02Content}
                    onChange={(e) => setGapForm({ ...gapForm, for02Content: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGapForm(false)}>Annuler</Button>
                <Button onClick={handleCreateGap}>
                  <AlertTriangle className="w-4 h-4 mr-2" />Créer l'écart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Note Form Dialog */}
          <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Note d'évaluation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type de note</Label>
                  <Select value={noteForm.noteType} onValueChange={(v) => setNoteForm({ ...noteForm, noteType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EVALUATION">Évaluation</SelectItem>
                      <SelectItem value="GENERAL">Général</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rôle</Label>
                  <Select value={noteForm.role} onValueChange={(v) => setNoteForm({ ...noteForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REE">REE</SelectItem>
                      <SelectItem value="ET">Évaluateur Technique</SelectItem>
                      <SelectItem value="EXP">Expert</SelectItem>
                      <SelectItem value="EQ">Évaluateur Qualité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observations</Label>
                  <Textarea value={noteForm.observations}
                    onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })} />
                </div>
                <div>
                  <Label>Synthèse</Label>
                  <Textarea value={noteForm.synthesis}
                    onChange={(e) => setNoteForm({ ...noteForm, synthesis: e.target.value })} />
                </div>
                <div>
                  <Label>Statut checklist</Label>
                  <Input value={noteForm.checklistStatus}
                    onChange={(e) => setNoteForm({ ...noteForm, checklistStatus: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNoteForm(false)}>Annuler</Button>
                <Button onClick={handleCreateNote}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Consensus Dialog */}
          <Dialog open={showConsensus} onOpenChange={setShowConsensus}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Consensus de l'équipe</DialogTitle>
                <DialogDescription>Saisir le consensus avant la réunion de clôture</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Détails du consensus</Label>
                  <Textarea value={consensusForm.consensusDetails}
                    onChange={(e) => setConsensusForm({ ...consensusForm, consensusDetails: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consensusForm.consensusReached}
                    onChange={(e) => setConsensusForm({ ...consensusForm, consensusReached: e.target.checked })}
                  />
                  <Label>Consensus atteint</Label>
                </div>
                {!consensusForm.consensusReached && (
                  <div>
                    <Label>Arbitrage CD requis</Label>
                    <Textarea value={consensusForm.cdArbitration}
                      onChange={(e) => setConsensusForm({ ...consensusForm, cdArbitration: e.target.value })} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConsensus(false)}>Annuler</Button>
                <Button onClick={handleConsensus}>Valider le consensus</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
}
