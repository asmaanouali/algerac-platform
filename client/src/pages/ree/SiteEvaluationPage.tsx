import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, ClipboardCheck, AlertTriangle, Users, MessageSquare, Send, Plus, Eye,
  CalendarClock, FileText, CheckCircle2, XCircle, Handshake, ArrowRight, RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SiteEvaluationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGapForm, setShowGapForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showSendToOEC, setShowSendToOEC] = useState(false);
  const [showTransmitDocs, setShowTransmitDocs] = useState(false);
  const [gapForm, setGapForm] = useState({ description: "", normReference: "", severity: "NON_CRITICAL", evidence: "" });
  const [noteForm, setNoteForm] = useState({ content: "", noteType: "EVALUATION", section: "" });
  const [reeSynthesis, setReeSynthesis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openingChecked, setOpeningChecked] = useState<Record<number, boolean>>({});
  const [closingChecked, setClosingChecked] = useState<Record<number, boolean>>({});

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.filter((t: any) => t.commitmentSigned && t.role === "REE"));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    try {
      const reqId = team.requestId;
      const [notesRes, gapsRes, subsRes] = await Promise.all([
        fetch(`/api/workflow/notes/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/gaps/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/evaluation/team-submissions/${reqId}`, { credentials: "include" }),
      ]);
      if (notesRes.ok) setNotes(await notesRes.json());
      if (gapsRes.ok) setGaps(await gapsRes.json());
      if (subsRes.ok) setTeamSubmissions(await subsRes.json());
    } catch (e) { }
  };

  const submitGap = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/gaps/create", {
        requestId: selectedTeam.requestId, evaluatorId: user?.id,
        description: gapForm.description, normReference: gapForm.normReference,
        severity: gapForm.severity, evidence: gapForm.evidence,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Écart enregistré" });
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
      const res = await apiRequest("POST", "/api/workflow/notes/create", {
        requestId: selectedTeam.requestId, authorId: user?.id,
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

  const handleREEDecision = async (gapId: number, keep: boolean, modDesc?: string, modEvidence?: string) => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/gap/${gapId}/ree-decision`, {
        keep,
        modifiedDescription: modDesc || null,
        modifiedEvidence: modEvidence || null,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: keep ? "Écart conservé" : "Écart écarté", description: data.message });
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const saveREESynthesis = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/ree-synthesis/${selectedTeam.requestId}`, {
        synthesis: reeSynthesis,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Synthèse enregistrée", description: "Synthèse REE sauvegardée" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const sendToOEC = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/send-to-oec/${selectedTeam.requestId}`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Envoyé à l'OEC", description: data.message });
        setShowSendToOEC(false);
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const transmitDocs = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/transmit-docs/${selectedTeam.requestId}`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Documents transmis", description: data.message });
        setShowTransmitDocs(false);
        selectTeam(selectedTeam);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  if (!user) return null;

  const isWritable = selectedTeam?.dossierWritable !== false;
  const myGaps = gaps.filter((g: any) => g.createdById === user?.id || g.createdByName === user?.fullName);
  const myNotes = notes.filter((n: any) => n.authorId === user?.id);
  const keptGaps = gaps.filter((g: any) => g.keptByREE === true);
  const sentToOECGaps = gaps.filter((g: any) => g.sentToOEC === true);

  // Team submissions data
  const memberNotes = teamSubmissions?.memberNotes || [];
  const memberGaps = teamSubmissions?.memberGaps || [];
  const memberSyntheses = teamSubmissions?.memberSyntheses || [];

  const openingChecklistItems = [
    "Présentation de l'équipe d'évaluation et rôles de chaque membre",
    "Confirmation du périmètre d'accréditation demandé",
    "Présentation du programme d'évaluation détaillé",
    "Confirmation des ressources et disponibilités de l'OEC",
    "Rappel des règles de confidentialité et d'impartialité",
    "Modalités de communication pendant l'évaluation",
    "Conditions de réalisation (accès aux locaux, équipements, personnel)",
    "Identification des guides/accompagnateurs OEC",
    "Questions et clarifications de l'OEC",
  ];

  const closingChecklistItems = [
    "Synthèse des constats et observations",
    "Présentation des écarts identifiés (critiques et non-critiques)",
    "Explication de la classification des écarts",
    "Délais de réponse pour les plans d'action correctif (10 jours)",
    "Processus de traitement des écarts (Étape 8)",
    "Prochaines étapes du processus d'accréditation",
    "Droit de recours de l'OEC sur les écarts constatés",
    "Remerciements et clôture formelle de l'évaluation",
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Évaluation sur Site — REE (Étape 7)</h1>
              <p className="text-muted-foreground mt-1">Gestion de l'évaluation, consensus, envoi des écarts à l'OEC</p>
            </div>
            <Button variant="outline" onClick={loadTeams} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: Missions */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Mes Évaluations</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{t.requestReferenceNumber || `Dossier #${t.requestId}`}</p>
                      <Badge variant="outline" className="text-xs mt-1">REE</Badge>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucune évaluation REE</p>}
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez une évaluation</p>
                  </CardContent></Card>
                ) : (
                  <>
                    {!isWritable && (
                      <Card className="border-amber-200 bg-amber-50/50 mb-4">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-amber-600" />
                            <p className="text-sm text-amber-700">Mode lecture seule — l'écriture sera disponible le jour de l'évaluation.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Tabs defaultValue="opening">
                      <TabsList className="mb-4 flex-wrap">
                        <TabsTrigger value="opening"><Users className="w-4 h-4 mr-1" />1. Ouverture</TabsTrigger>
                        <TabsTrigger value="evaluation"><ClipboardCheck className="w-4 h-4 mr-1" />2. Évaluation</TabsTrigger>
                        <TabsTrigger value="consensus"><Handshake className="w-4 h-4 mr-1" />3. Consensus</TabsTrigger>
                        <TabsTrigger value="closing"><MessageSquare className="w-4 h-4 mr-1" />4. Clôture</TabsTrigger>
                      </TabsList>

                      {/* ===== TAB 1: Réunion d'ouverture — Checklist REE ===== */}
                      <TabsContent value="opening">
                        <Card>
                          <CardHeader>
                            <CardTitle>1. Réunion d'Ouverture — Checklist REE</CardTitle>
                            <CardDescription>Vérifiez chaque point lors de la réunion d'ouverture</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              {openingChecklistItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                  <Checkbox
                                    checked={openingChecked[i] || false}
                                    onCheckedChange={(checked) => setOpeningChecked({ ...openingChecked, [i]: !!checked })}
                                  />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                {Object.values(openingChecked).filter(Boolean).length} / {openingChecklistItems.length} points vérifiés
                              </span>
                            </div>

                            {/* REE notes for opening */}
                            <div className="mt-6">
                              <h4 className="font-medium text-sm mb-2">Notes de la réunion d'ouverture</h4>
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

                      {/* ===== TAB 2: Évaluation — REE propres notes + écarts ===== */}
                      <TabsContent value="evaluation">
                        <div className="space-y-4">
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
                              <p className="text-xl font-bold">{gaps.length}</p>
                              <p className="text-xs text-muted-foreground">Total écarts (équipe)</p>
                            </Card>
                          </div>

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
                            </div>
                          )}

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Mes Fiches d'Écart</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {myGaps.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Réf. norme</TableHead>
                                      <TableHead>Gravité</TableHead>
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
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">Aucun écart propre</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader><CardTitle className="text-base">Mes Notes d'Évaluation</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {myNotes.filter((n: any) => n.noteType === "EVALUATION").map((n: any) => (
                                <div key={n.id} className="p-3 border rounded-lg bg-gray-50">
                                  <p className="text-sm">{n.content || n.observations}</p>
                                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* ===== TAB 3: Consensus — Receive submissions, keep/discard gaps ===== */}
                      <TabsContent value="consensus">
                        <div className="space-y-4">
                          {/* Summary stats */}
                          <div className="grid grid-cols-4 gap-3">
                            <Card className="p-3 text-center">
                              <p className="text-xl font-bold">{myGaps.length + memberGaps.length}</p>
                              <p className="text-xs text-muted-foreground">Écarts à traiter</p>
                            </Card>
                            <Card className="p-3 text-center">
                              <p className="text-xl font-bold">{memberSyntheses.length}</p>
                              <p className="text-xs text-muted-foreground">Synthèses reçues</p>
                            </Card>
                            <Card className="p-3 text-center bg-green-50">
                              <p className="text-xl font-bold text-green-600">{keptGaps.length}</p>
                              <p className="text-xs text-muted-foreground">Conservés</p>
                            </Card>
                            <Card className="p-3 text-center bg-red-50">
                              <p className="text-xl font-bold text-red-600">{gaps.filter((g: any) => g.keptByREE === false).length}</p>
                              <p className="text-xs text-muted-foreground">Écartés</p>
                            </Card>
                          </div>

                          {/* Member Syntheses */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Synthèses des Membres</CardTitle>
                              <CardDescription>Synthèses envoyées par les membres de l'équipe</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {memberSyntheses.length > 0 ? memberSyntheses.map((s: any, i: number) => (
                                <div key={i} className="p-4 border rounded-lg bg-blue-50/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline">{s.authorTeamRole || s.authorName || "Membre"}</Badge>
                                    {s.sentDate && <span className="text-xs text-muted-foreground">{new Date(s.sentDate).toLocaleString("fr-FR")}</span>}
                                  </div>
                                  <p className="text-sm">{s.synthesis || s.content || s.observations}</p>
                                </div>
                              )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucune synthèse reçue — les membres n'ont pas encore envoyé</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* REE own gaps — must also go through keep/discard before sending to OEC */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Mes Écarts (Signalés directement)</CardTitle>
                              <CardDescription>Écarts que vous avez signalés — conservez ou écartez avant envoi à l'OEC</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {myGaps.length > 0 ? (
                                <div className="space-y-4">
                                  {myGaps.map((g: any) => (
                                    <GapDecisionCard key={g.id} gap={g} onDecision={handleREEDecision} isWritable={isWritable} submitting={submitting} />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun écart signalé directement</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Member Gaps — REE keeps or discards */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Écarts Soumis par les Membres</CardTitle>
                              <CardDescription>Conservez, modifiez ou écartez chaque écart</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {memberGaps.length > 0 ? (
                                <div className="space-y-4">
                                  {memberGaps.map((g: any) => (
                                    <GapDecisionCard key={g.id} gap={g} onDecision={handleREEDecision} isWritable={isWritable} submitting={submitting} />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun écart reçu des membres</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* REE own synthesis */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Synthèse REE</CardTitle>
                              <CardDescription>Rédigez votre propre synthèse en intégrant les observations de l'équipe</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Textarea
                                value={reeSynthesis} onChange={(e) => setReeSynthesis(e.target.value)}
                                placeholder="Synthèse globale de l'évaluation intégrant les contributions de tous les membres..."
                                rows={8} disabled={!isWritable}
                              />
                              {isWritable && (
                                <Button onClick={saveREESynthesis} disabled={submitting || !reeSynthesis.trim()}>
                                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                  Enregistrer la synthèse REE
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* ===== TAB 4: Réunion de clôture — Checklist + Send to OEC ===== */}
                      <TabsContent value="closing">
                        <div className="space-y-4">
                          {/* Closing Checklist */}
                          <Card>
                            <CardHeader>
                              <CardTitle>4. Réunion de Clôture — Checklist</CardTitle>
                              <CardDescription>Points à couvrir lors de la réunion de clôture avec l'OEC</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {closingChecklistItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                  <Checkbox
                                    checked={closingChecked[i] || false}
                                    onCheckedChange={(checked) => setClosingChecked({ ...closingChecked, [i]: !!checked })}
                                  />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                              <div className="flex items-center gap-2 mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                                <span className="text-sm text-orange-800">
                                  {Object.values(closingChecked).filter(Boolean).length} / {closingChecklistItems.length} points vérifiés
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Summary of gaps to send */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Récapitulatif des Écarts à Transmettre</CardTitle>
                              <CardDescription>{keptGaps.length} écart(s) conservé(s) à envoyer à l'OEC</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {keptGaps.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Gravité</TableHead>
                                      <TableHead>Auteur</TableHead>
                                      <TableHead>Envoyé OEC</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {keptGaps.map((g: any) => (
                                      <TableRow key={g.id}>
                                        <TableCell className="max-w-[250px] truncate">
                                          {g.reeModifiedDescription || g.description}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "destructive" : "secondary"}>
                                            {g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "Critique" : "Non-critique"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{g.createdByName || "REE"}</TableCell>
                                        <TableCell>
                                          {g.sentToOEC ? (
                                            <Badge className="bg-green-100 text-green-800 text-xs">Envoyé ✓</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">En attente</Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">Aucun écart conservé</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Notes for closing */}
                          <Card>
                            <CardHeader><CardTitle className="text-base">Notes — Réunion de clôture</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {myNotes.filter((n: any) => n.noteType === "CLOSING_MEETING").map((n: any) => (
                                <div key={n.id} className="p-3 border rounded-lg bg-gray-50">
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
                            </CardContent>
                          </Card>

                          {/* Action buttons */}
                          {isWritable && (
                            <div className="flex gap-3 justify-end flex-wrap">
                              <Button onClick={() => setShowSendToOEC(true)} className="bg-blue-600 hover:bg-blue-700"
                                disabled={keptGaps.length === 0}>
                                <Send className="w-4 h-4 mr-2" />Envoyer fiches + synthèse à l'OEC
                              </Button>
                              <Button onClick={() => setShowTransmitDocs(true)} variant="outline"
                                disabled={sentToOECGaps.length === 0}>
                                <ArrowRight className="w-4 h-4 mr-2" />Transmettre documents au CD/RA
                              </Button>
                            </div>
                          )}
                        </div>
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
                <DialogDescription>Documentez l'écart identifié</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Description</label>
                  <Textarea value={gapForm.description} onChange={(e) => setGapForm({ ...gapForm, description: e.target.value })}
                    placeholder="Décrivez l'écart constaté..." rows={3} /></div>
                <div><label className="text-sm font-medium">Référence norme</label>
                  <Input value={gapForm.normReference} onChange={(e) => setGapForm({ ...gapForm, normReference: e.target.value })}
                    placeholder="Ex: ISO 17025:2017 §7.2.1" /></div>
                <div><label className="text-sm font-medium">Gravité</label>
                  <select className="w-full border rounded-md p-2" value={gapForm.severity}
                    onChange={(e) => setGapForm({ ...gapForm, severity: e.target.value })}>
                    <option value="CRITICAL">Critique</option>
                    <option value="NON_CRITICAL">Non-critique</option>
                  </select></div>
                <div><label className="text-sm font-medium">Preuves</label>
                  <Textarea value={gapForm.evidence} onChange={(e) => setGapForm({ ...gapForm, evidence: e.target.value })}
                    placeholder="Preuves objectives..." rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGapForm(false)}>Annuler</Button>
                <Button onClick={submitGap} disabled={submitting || !gapForm.description}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Note Form Dialog */}
          <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajouter une Note</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Contenu</label>
                  <Textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="Observations..." rows={5} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNoteForm(false)}>Annuler</Button>
                <Button onClick={submitNote} disabled={submitting || !noteForm.content}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send to OEC Dialog */}
          <Dialog open={showSendToOEC} onOpenChange={setShowSendToOEC}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer les Écarts et la Synthèse à l'OEC</DialogTitle>
                <DialogDescription>
                  {keptGaps.length} écart(s) conservé(s) seront envoyés à l'organisme évalué avec votre synthèse.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Attention :</strong> Une fois envoyés, l'OEC devra se prononcer sur chaque écart (accepter/refuser).
                  Les écarts refusés seront signalés au CD/RA.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendToOEC(false)}>Annuler</Button>
                <Button onClick={sendToOEC} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Confirmer l'envoi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Transmit Docs Dialog */}
          <Dialog open={showTransmitDocs} onOpenChange={setShowTransmitDocs}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transmettre les Documents au CD/RA</DialogTitle>
                <DialogDescription>
                  Les fiches d'écart, la synthèse et les notes de clôture seront transmises au CD et au RA.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTransmitDocs(false)}>Annuler</Button>
                <Button onClick={transmitDocs} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Transmettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

/* ============ Gap Decision Card (Consensus) ============ */
function GapDecisionCard({ gap, onDecision, isWritable, submitting }: {
  gap: any; onDecision: (id: number, keep: boolean, desc?: string, ev?: string) => void;
  isWritable: boolean; submitting: boolean;
}) {
  const [modDesc, setModDesc] = useState(gap.description || "");
  const [modEvidence, setModEvidence] = useState(gap.evidence || "");
  const [editing, setEditing] = useState(false);

  const decided = gap.keptByREE !== null && gap.keptByREE !== undefined;
  const kept = gap.keptByREE === true;
  const discarded = gap.keptByREE === false;

  return (
    <div className={`p-4 rounded-lg border ${decided ? (kept ? "border-green-300 bg-green-50/50" : "border-red-200 bg-red-50/50") : "border-gray-200"}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">{gap.createdByName || "Membre"}</Badge>
            <Badge variant={gap.severity === "CRITICAL" || gap.type === "CRITIQUE" ? "destructive" : "secondary"} className="text-xs">
              {gap.severity === "CRITICAL" || gap.type === "CRITIQUE" ? "Critique" : "Non-critique"}
            </Badge>
            {gap.normReference && <span className="text-xs text-muted-foreground">Réf: {gap.normReference}</span>}
          </div>
          <p className="text-sm font-medium">{gap.description}</p>
          {gap.evidence && <p className="text-xs text-muted-foreground mt-1">Preuves: {gap.evidence}</p>}
        </div>
        {decided && (
          <div className="flex-shrink-0 ml-3">
            {kept ? (
              <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Conservé</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Écarté</Badge>
            )}
          </div>
        )}
      </div>

      {/* Editing mode for modifications */}
      {editing && isWritable && (
        <div className="mt-3 space-y-2 p-3 bg-white rounded border">
          <div><label className="text-xs font-medium">Description modifiée</label>
            <Textarea value={modDesc} onChange={(e) => setModDesc(e.target.value)} rows={2} className="text-sm" /></div>
          <div><label className="text-xs font-medium">Preuves modifiées</label>
            <Textarea value={modEvidence} onChange={(e) => setModEvidence(e.target.value)} rows={2} className="text-sm" /></div>
        </div>
      )}

      {/* Action buttons */}
      {!decided && isWritable && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="text-xs">
            {editing ? "Masquer modifications" : "Modifier"}
          </Button>
          <Button size="sm" onClick={() => onDecision(gap.id, true, editing ? modDesc : undefined, editing ? modEvidence : undefined)}
            disabled={submitting} className="bg-green-600 hover:bg-green-700 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />Conserver
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDecision(gap.id, false)}
            disabled={submitting} className="text-xs">
            <XCircle className="w-3 h-3 mr-1" />Écarter
          </Button>
        </div>
      )}
    </div>
  );
}
