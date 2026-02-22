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
import { Loader2, ClipboardCheck, AlertTriangle, Users, MessageSquare, Send, Plus } from "lucide-react";
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
  const [gapForm, setGapForm] = useState({ description: "", normReference: "", severity: "NON_CRITICAL", evidence: "" });
  const [noteForm, setNoteForm] = useState({ content: "", noteType: "EVALUATION", section: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.filter((t: any) => t.commitmentSigned));
      }
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
  };

  const submitGap = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", "/api/workflow/gaps/create", {
        requestId: reqId,
        evaluatorId: user?.id,
        description: gapForm.description,
        normReference: gapForm.normReference,
        severity: gapForm.severity,
        evidence: gapForm.evidence,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Écart enregistré (FOR 02)" });
        setShowGapForm(false);
        setGapForm({ description: "", normReference: "", severity: "NON_CRITICAL", evidence: "" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitNote = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", "/api/workflow/notes/create", {
        requestId: reqId,
        authorId: user?.id,
        noteType: noteForm.noteType,
        content: noteForm.content,
        section: noteForm.section || "Évaluation sur site",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Note enregistrée" });
        setShowNoteForm(false);
        setNoteForm({ content: "", noteType: "EVALUATION", section: "" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  const checklistItems = [
    { category: "Système de Management", items: ["Politique qualité", "Objectifs qualité", "Revue de direction", "Audit interne"] },
    { category: "Ressources", items: ["Compétences du personnel", "Environnement de travail", "Équipements", "Traçabilité métrologique"] },
    { category: "Processus Opérationnels", items: ["Maîtrise des documents", "Gestion des échantillons", "Méthodes d'essai/étalonnage", "Validation des résultats"] },
    { category: "Amélioration", items: ["Non-conformités", "Actions correctives", "Gestion des risques", "Amélioration continue"] },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Évaluation sur Site</h1>
            <p className="text-muted-foreground mt-1">Conduisez l'évaluation sur site avec checklists et fiches d'écart (Étape 7)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Missions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{t.requestReferenceNumber || `Équipe #${t.teamId}`}</p>
                      <Badge variant="outline" className="text-xs mt-1">{t.role}</Badge>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucune mission active</p>}
                </CardContent>
              </Card>

              <div className="lg:col-span-3">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez une mission</p>
                  </CardContent></Card>
                ) : (
                  <Tabs defaultValue="checklist">
                    <TabsList className="mb-4">
                      <TabsTrigger value="checklist"><ClipboardCheck className="w-4 h-4 mr-1" />Checklists</TabsTrigger>
                      <TabsTrigger value="gaps"><AlertTriangle className="w-4 h-4 mr-1" />Écarts (FOR 02)</TabsTrigger>
                      <TabsTrigger value="notes"><MessageSquare className="w-4 h-4 mr-1" />Notes & Synthèse</TabsTrigger>
                      <TabsTrigger value="meetings"><Users className="w-4 h-4 mr-1" />Réunions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="checklist">
                      <Card>
                        <CardHeader>
                          <CardTitle>Checklist d'Évaluation</CardTitle>
                          <CardDescription>Vérifiez chaque point selon le référentiel applicable</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {checklistItems.map((cat) => (
                              <div key={cat.category}>
                                <h4 className="font-semibold text-sm mb-2 text-primary">{cat.category}</h4>
                                <div className="space-y-1">
                                  {cat.items.map((item) => (
                                    <label key={item} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" />
                                      <span className="text-sm">{item}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="gaps">
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle>Fiches d'Écart (FOR 02)</CardTitle>
                              <CardDescription>{gaps.length} écart(s) identifié(s)</CardDescription>
                            </div>
                            <Button onClick={() => setShowGapForm(true)}>
                              <Plus className="w-4 h-4 mr-2" />Nouvel Écart
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {gaps.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Référence norme</TableHead>
                                  <TableHead>Gravité</TableHead>
                                  <TableHead>Statut</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {gaps.map((g: any) => (
                                  <TableRow key={g.id}>
                                    <TableCell className="max-w-[200px] truncate">{g.description}</TableCell>
                                    <TableCell>{g.normReference}</TableCell>
                                    <TableCell>
                                      <Badge variant={g.severity === "CRITICAL" ? "destructive" : "secondary"}>
                                        {g.severity === "CRITICAL" ? "Critique" : "Non-critique"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{g.status}</Badge></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">Aucun écart enregistré</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="notes">
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle>Notes d'Évaluation</CardTitle>
                              <CardDescription>Observations et synthèse de l'évaluation</CardDescription>
                            </div>
                            <Button onClick={() => setShowNoteForm(true)}>
                              <Plus className="w-4 h-4 mr-2" />Ajouter Note
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {notes.map((n: any) => (
                              <div key={n.id} className="p-3 border rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {n.noteType === "OPENING_MEETING" ? "Réunion d'ouverture" :
                                     n.noteType === "CLOSING_MEETING" ? "Réunion de clôture" :
                                     n.noteType === "EVALUATION" ? "Évaluation" : "Général"}
                                  </Badge>
                                  {n.section && <Badge variant="secondary" className="text-xs">{n.section}</Badge>}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                                  </span>
                                </div>
                                <p className="text-sm">{n.content}</p>
                              </div>
                            ))}
                            {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune note</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="meetings">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader><CardTitle className="text-lg">Réunion d'Ouverture</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <p>Points à aborder :</p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Présentation de l'équipe d'évaluation</li>
                                <li>Confirmation du périmètre d'accréditation</li>
                                <li>Présentation du programme d'évaluation</li>
                                <li>Confirmation des ressources et disponibilités</li>
                                <li>Règles de confidentialité</li>
                              </ul>
                              <Button variant="outline" className="mt-2" onClick={() => {
                                setNoteForm({ content: "", noteType: "OPENING_MEETING", section: "Réunion d'ouverture" });
                                setShowNoteForm(true);
                              }}>
                                <MessageSquare className="w-4 h-4 mr-2" />Compte-rendu d'ouverture
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader><CardTitle className="text-lg">Réunion de Clôture</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <p>Points à aborder :</p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Synthèse des constats et écarts</li>
                                <li>Classification des écarts (critiques / non-critiques)</li>
                                <li>Délais de réponse pour les plans d'action</li>
                                <li>Prochaines étapes du processus</li>
                              </ul>
                              <Button variant="outline" className="mt-2" onClick={() => {
                                setNoteForm({ content: "", noteType: "CLOSING_MEETING", section: "Réunion de clôture" });
                                setShowNoteForm(true);
                              }}>
                                <MessageSquare className="w-4 h-4 mr-2" />Compte-rendu de clôture
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          )}

          {/* Gap Form Dialog */}
          <Dialog open={showGapForm} onOpenChange={setShowGapForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fiche d'Écart (FOR 02)</DialogTitle>
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
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enregistrer
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
                <div><label className="text-sm font-medium">Type</label>
                  <select className="w-full border rounded-md p-2" value={noteForm.noteType}
                    onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}>
                    <option value="EVALUATION">Évaluation</option>
                    <option value="OPENING_MEETING">Réunion d'ouverture</option>
                    <option value="CLOSING_MEETING">Réunion de clôture</option>
                    <option value="GENERAL">Général</option>
                  </select></div>
                <div><label className="text-sm font-medium">Section</label>
                  <Input value={noteForm.section} onChange={(e) => setNoteForm({ ...noteForm, section: e.target.value })}
                    placeholder="Ex: Système de management, Ressources..." /></div>
                <div><label className="text-sm font-medium">Contenu</label>
                  <Textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="Observations détaillées..." rows={4} /></div>
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
        </main>
      </div>
    </div>
  );
}
