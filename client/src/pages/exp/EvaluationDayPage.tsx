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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardCheck, AlertTriangle, Users, MessageSquare, Send, Plus, Eye, CalendarClock, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EvaluationDayPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGapForm, setShowGapForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [gapForm, setGapForm] = useState({ description: "", normReference: "", severity: "NON_CRITICAL", evidence: "" });
  const [noteForm, setNoteForm] = useState({ content: "", noteType: "EVALUATION", section: "" });
  const [synthesisText, setSynthesisText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.filter((t: any) => t.commitmentSigned));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    try {
      const reqId = team.requestId;
      const [notesRes, gapsRes] = await Promise.all([
        fetch(`/api/workflow/notes/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/gaps/by-request/${reqId}`, { credentials: "include" }),
      ]);
      if (notesRes.ok) setNotes(await notesRes.json());
      if (gapsRes.ok) setGaps(await gapsRes.json());
    } catch (e) { }
  };

  const submitGap = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", "/api/workflow/gaps/create", {
        requestId: reqId, evaluatorId: user?.id,
        description: gapForm.description, normReference: gapForm.normReference,
        severity: gapForm.severity, evidence: gapForm.evidence,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Écart enregistré (FOR 02)" });
        setShowGapForm(false);
        setGapForm({ description: "", normReference: "", severity: "NON_CRITICAL", evidence: "" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const submitNote = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", "/api/workflow/notes/create", {
        requestId: reqId, authorId: user?.id,
        noteType: noteForm.noteType, content: noteForm.content,
        observations: noteForm.content, section: noteForm.section || "Évaluation",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Note enregistrée" });
        setShowNoteForm(false);
        setNoteForm({ content: "", noteType: "EVALUATION", section: "" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const sendToREE = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", `/api/workflow/evaluation/send-to-ree/${reqId}`, {
        synthesis: synthesisText,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Envoyé", description: "Fiches d'écart et synthèse envoyées au REE" });
        setShowSendDialog(false);
        setSynthesisText("");
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  if (!user) return null;

  const isWritable = selectedTeam?.dossierWritable !== false;
  const myGaps = gaps.filter((g: any) => g.createdById === user?.id || g.createdByName === user?.fullName);
  const myNotes = notes.filter((n: any) => n.authorId === user?.id);

  const openingChecklistItems = [
    "Présentation de l'équipe d'évaluation",
    "Confirmation du périmètre d'accréditation",
    "Présentation du programme d'évaluation",
    "Confirmation des ressources et disponibilités",
    "Règles de confidentialité et d'impartialité",
    "Modalités de communication pendant l'évaluation",
    "Questions et clarifications",
  ];

  const closingChecklistItems = [
    "Synthèse des constats et écarts",
    "Classification des écarts (critiques / non-critiques)",
    "Délais de réponse pour les plans d'action",
    "Prochaines étapes du processus",
    "Droit de recours",
    "Questions et observations de l'OEC",
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Évaluation sur Site (Étape 7)</h1>
            <p className="text-muted-foreground mt-1">Réunion d'ouverture, évaluation, réunion de clôture</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: Missions */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Missions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{t.requestReferenceNumber || `Équipe #${t.teamId}`}</p>
                        {!isWritable && selectedTeam?.id === t.id ? (
                          <span title="Lecture seule"><Eye className="w-3.5 h-3.5 text-amber-500" /></span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">{t.role}</Badge>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucune mission active</p>}
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez une mission</p>
                  </CardContent></Card>
                ) : (
                  <>
                    {/* Read-only banner */}
                    {!isWritable && (
                      <Card className="border-amber-200 bg-amber-50/50 mb-4">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Eye className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-amber-800">Mode lecture seule</h4>
                              <p className="text-sm text-amber-700">Le dossier est consultable mais l'écriture sera disponible le jour de l'évaluation.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200 flex-shrink-0">
                              <CalendarClock className="w-4 h-4 text-amber-600" />
                              <p className="font-semibold text-xs text-amber-800">
                                {(() => {
                                  const d = selectedTeam.evaluationDateAccepted
                                    ? selectedTeam.proposedEvaluationDate
                                    : (selectedTeam.oecProposedDate || selectedTeam.proposedEvaluationDate);
                                  return d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non définie";
                                })()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Tabs defaultValue="opening">
                      <TabsList className="mb-4">
                        <TabsTrigger value="opening"><Users className="w-4 h-4 mr-1" />1. Réunion d'ouverture</TabsTrigger>
                        <TabsTrigger value="evaluation"><ClipboardCheck className="w-4 h-4 mr-1" />2. Évaluation</TabsTrigger>
                        <TabsTrigger value="closing"><MessageSquare className="w-4 h-4 mr-1" />3. Réunion de clôture</TabsTrigger>
                      </TabsList>

                      {/* TAB 1: Réunion d'ouverture — Notes */}
                      <TabsContent value="opening">
                        <Card>
                          <CardHeader>
                            <CardTitle>1. Réunion d'Ouverture — Notes</CardTitle>
                            <CardDescription>Prenez vos notes pendant la réunion d'ouverture</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="font-medium text-sm text-blue-800 mb-2">Points évoqués lors de la réunion :</h4>
                              <ul className="space-y-1 text-sm text-blue-700">
                                {openingChecklistItems.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-0.5">•</span>{item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm mb-2">Mes notes — Réunion d'ouverture</h4>
                              {myNotes.filter((n: any) => n.noteType === "OPENING_MEETING").map((n: any) => (
                                <div key={n.id} className="p-3 border rounded-lg mb-2 bg-gray-50">
                                  <p className="text-sm">{n.content || n.observations}</p>
                                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                                </div>
                              ))}
                              {isWritable && (
                                <Button variant="outline" size="sm" onClick={() => {
                                  setNoteForm({ content: "", noteType: "OPENING_MEETING", section: "Réunion d'ouverture" });
                                  setShowNoteForm(true);
                                }}>
                                  <Plus className="w-4 h-4 mr-1" />Ajouter une note
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* TAB 2: Évaluation — Notes + Écarts + Envoi au REE */}
                      <TabsContent value="evaluation">
                        <div className="space-y-4">
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            <Card className="p-3 text-center">
                              <p className="text-xl font-bold">{myGaps.length}</p>
                              <p className="text-xs text-muted-foreground">Mes écarts</p>
                            </Card>
                            <Card className="p-3 text-center">
                              <p className="text-xl font-bold">{myNotes.filter((n: any) => n.noteType === "EVALUATION").length}</p>
                              <p className="text-xs text-muted-foreground">Mes notes</p>
                            </Card>
                            <Card className="p-3 text-center">
                              <p className="text-xl font-bold">{myGaps.filter((g: any) => g.sentToREE).length}</p>
                              <p className="text-xs text-muted-foreground">Envoyés au REE</p>
                            </Card>
                          </div>

                          {/* Actions */}
                          {isWritable && (
                            <div className="flex gap-2 flex-wrap">
                              <Button onClick={() => setShowGapForm(true)} variant="outline" className="text-orange-600 border-orange-300">
                                <AlertTriangle className="w-4 h-4 mr-2" />Signaler un Écart
                              </Button>
                              <Button onClick={() => {
                                setNoteForm({ content: "", noteType: "EVALUATION", section: "" });
                                setShowNoteForm(true);
                              }} variant="outline">
                                <FileText className="w-4 h-4 mr-2" />Prendre une Note
                              </Button>
                              <Button onClick={() => setShowSendDialog(true)} className="bg-blue-600 hover:bg-blue-700 ml-auto">
                                <Send className="w-4 h-4 mr-2" />Envoyer au REE
                              </Button>
                            </div>
                          )}

                          {/* My Gaps */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Mes Fiches d'Écart (FOR 02)</CardTitle>
                              <CardDescription>{myGaps.length} écart(s) signalé(s)</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {myGaps.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Réf. norme</TableHead>
                                      <TableHead>Gravité</TableHead>
                                      <TableHead>Statut</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {myGaps.map((g: any) => (
                                      <TableRow key={g.id}>
                                        <TableCell className="max-w-[200px] truncate">{g.description}</TableCell>
                                        <TableCell>{g.normReference || g.requirement}</TableCell>
                                        <TableCell>
                                          <Badge variant={g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "destructive" : "secondary"}>
                                            {g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "Critique" : "Non-critique"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {g.sentToREE ? (
                                            <Badge className="bg-green-100 text-green-800 text-xs">Envoyé REE ✓</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">En attente</Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">Aucun écart signalé</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* My Evaluation Notes */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Mes Notes d'Évaluation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {myNotes.filter((n: any) => n.noteType === "EVALUATION").map((n: any) => (
                                <div key={n.id} className="p-3 border rounded-lg bg-gray-50">
                                  <p className="text-sm">{n.content || n.observations}</p>
                                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                                </div>
                              ))}
                              {myNotes.filter((n: any) => n.noteType === "EVALUATION").length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucune note</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* TAB 3: Réunion de clôture — Notes */}
                      <TabsContent value="closing">
                        <Card>
                          <CardHeader>
                            <CardTitle>3. Réunion de Clôture — Notes</CardTitle>
                            <CardDescription>Prenez vos notes pendant la réunion de clôture</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                              <h4 className="font-medium text-sm text-orange-800 mb-2">Points évoqués lors de la clôture :</h4>
                              <ul className="space-y-1 text-sm text-orange-700">
                                {closingChecklistItems.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>{item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm mb-2">Mes notes — Réunion de clôture</h4>
                              {myNotes.filter((n: any) => n.noteType === "CLOSING_MEETING").map((n: any) => (
                                <div key={n.id} className="p-3 border rounded-lg mb-2 bg-gray-50">
                                  <p className="text-sm">{n.content || n.observations}</p>
                                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                                </div>
                              ))}
                              {isWritable && (
                                <Button variant="outline" size="sm" onClick={() => {
                                  setNoteForm({ content: "", noteType: "CLOSING_MEETING", section: "Réunion de clôture" });
                                  setShowNoteForm(true);
                                }}>
                                  <Plus className="w-4 h-4 mr-1" />Ajouter une note
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Gap Form Dialog */}
          <Dialog open={showGapForm} onOpenChange={setShowGapForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Signaler un Écart (FOR 02)</DialogTitle>
                <DialogDescription>Documentez l'écart identifié lors de l'évaluation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Description de l'écart</label>
                  <Textarea value={gapForm.description} onChange={(e) => setGapForm({ ...gapForm, description: e.target.value })}
                    placeholder="Décrivez l'écart constaté..." rows={3} /></div>
                <div><label className="text-sm font-medium">Référence norme</label>
                  <Input value={gapForm.normReference} onChange={(e) => setGapForm({ ...gapForm, normReference: e.target.value })}
                    placeholder="Ex: ISO 17025:2017 §7.2.1" /></div>
                <div><label className="text-sm font-medium">Gravité</label>
                  <select className="w-full border rounded-md p-2" value={gapForm.severity}
                    onChange={(e) => setGapForm({ ...gapForm, severity: e.target.value })}>
                    <option value="CRITICAL">Critique — Suspension immédiate requise</option>
                    <option value="NON_CRITICAL">Non-critique — Plan d'action requis</option>
                  </select></div>
                <div><label className="text-sm font-medium">Preuves / Observations</label>
                  <Textarea value={gapForm.evidence} onChange={(e) => setGapForm({ ...gapForm, evidence: e.target.value })}
                    placeholder="Preuves objectives constatées..." rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGapForm(false)}>Annuler</Button>
                <Button onClick={submitGap} disabled={submitting || !gapForm.description}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                  Enregistrer l'écart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Note Form Dialog */}
          <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Contenu</label>
                  <Textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="Observations détaillées..." rows={5} /></div>
                {noteForm.noteType === "EVALUATION" && (
                  <div><label className="text-sm font-medium">Section (optionnel)</label>
                    <Input value={noteForm.section} onChange={(e) => setNoteForm({ ...noteForm, section: e.target.value })}
                      placeholder="Ex: Système de management, Ressources..." /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNoteForm(false)}>Annuler</Button>
                <Button onClick={submitNote} disabled={submitting || !noteForm.content}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send to REE Dialog */}
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Envoyer Fiches d'Écart + Synthèse au REE</DialogTitle>
                <DialogDescription>
                  Vos {myGaps.filter((g: any) => !g.sentToREE).length} fiche(s) d'écart non envoyée(s) seront transmises avec votre synthèse.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-sm font-medium mb-1">Résumé :</p>
                  <p className="text-sm text-muted-foreground">{myGaps.length} écart(s) signalé(s), {myNotes.filter((n: any) => n.noteType === "EVALUATION").length} note(s)</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Votre synthèse</label>
                  <Textarea value={synthesisText} onChange={(e) => setSynthesisText(e.target.value)}
                    placeholder="Rédigez votre synthèse globale de l'évaluation..." rows={6} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Annuler</Button>
                <Button onClick={sendToREE} disabled={submitting || !synthesisText.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Envoyer au REE
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
