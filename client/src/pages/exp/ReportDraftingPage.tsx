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
import { Loader2, FileText, Send, CheckCircle2, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ReportDraftingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftForm, setDraftForm] = useState({
    title: "", context: "", evaluationScope: "", findingsSummary: "",
    gapsSummary: "", strengthsSummary: "", conclusion: "", recommendations: ""
  });

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // REE (Responsable d'Équipe d'Évaluation) is the one who drafts reports
        setTeams(data.filter((t: any) => t.commitmentSigned));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    try {
      const reqId = team.requestId;
      const [notesRes, gapsRes, reportsRes] = await Promise.all([
        fetch(`/api/workflow/notes/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/gaps/by-request/${reqId}`, { credentials: "include" }),
        fetch(`/api/workflow/reports/by-request/${reqId}`, { credentials: "include" }),
      ]);
      if (notesRes.ok) setNotes(await notesRes.json());
      if (gapsRes.ok) setGaps(await gapsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
    } catch (e) { }
  };

  const createDraft = async () => {
    setSubmitting(true);
    try {
      const reqId = selectedTeam.requestId;
      const res = await apiRequest("POST", "/api/workflow/reports/create", {
        requestId: reqId,
        authorId: user?.id,
        title: draftForm.title,
        context: draftForm.context,
        evaluationScope: draftForm.evaluationScope,
        findingsSummary: draftForm.findingsSummary,
        gapsSummary: draftForm.gapsSummary,
        strengthsSummary: draftForm.strengthsSummary,
        conclusion: draftForm.conclusion,
        recommendations: draftForm.recommendations,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Rapport brouillon créé" });
        setShowDraftForm(false);
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitReport = async (reportId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/reports/${reportId}/submit`);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Rapport soumis au RA pour validation" });
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const criticalGaps = gaps.filter((g: any) => g.severity === "CRITICAL");
  const nonCriticalGaps = gaps.filter((g: any) => g.severity !== "CRITICAL");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Rédaction du Rapport</h1>
            <p className="text-muted-foreground mt-1">Rédigez le rapport d'évaluation (FOR 23) (Étape 9)</p>
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
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucune mission</p>}
                </CardContent>
              </Card>

              <div className="lg:col-span-3">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez une mission</p>
                  </CardContent></Card>
                ) : (
                  <Tabs defaultValue="synthesis">
                    <TabsList className="mb-4">
                      <TabsTrigger value="synthesis">Données Collectées</TabsTrigger>
                      <TabsTrigger value="reports">Rapports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="synthesis">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-3xl font-bold text-primary">{notes.length}</p>
                              <p className="text-sm text-muted-foreground">Notes d'évaluation</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-3xl font-bold text-red-600">{criticalGaps.length}</p>
                              <p className="text-sm text-muted-foreground">Écarts critiques</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-3xl font-bold text-amber-600">{nonCriticalGaps.length}</p>
                              <p className="text-sm text-muted-foreground">Écarts non-critiques</p>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader><CardTitle className="text-lg">Synthèse des Constats</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {notes.slice(0, 10).map((n: any) => (
                                <div key={n.id} className="p-2 border-l-2 border-primary pl-3">
                                  <div className="flex gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">{n.noteType}</Badge>
                                    {n.section && <Badge variant="secondary" className="text-xs">{n.section}</Badge>}
                                  </div>
                                  <p className="text-sm">{n.content}</p>
                                </div>
                              ))}
                              {notes.length === 0 && <p className="text-sm text-muted-foreground">Aucune note</p>}
                            </div>
                          </CardContent>
                        </Card>

                        <Button onClick={() => setShowDraftForm(true)}>
                          <Edit className="w-4 h-4 mr-2" />Rédiger le Rapport
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="reports">
                      <div className="space-y-4">
                        {reports.length > 0 ? reports.map((r: any) => (
                          <Card key={r.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{r.title || "Rapport d'évaluation"}</CardTitle>
                                  <CardDescription>
                                    Créé le {new Date(r.createdAt).toLocaleDateString("fr-FR")} — Statut: {r.status}
                                  </CardDescription>
                                </div>
                                <Badge variant={r.status === "DRAFT" ? "secondary" : r.status === "SUBMITTED" ? "default" : "outline"}>
                                  {r.status === "DRAFT" ? "Brouillon" : r.status === "SUBMITTED" ? "Soumis" : r.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {r.context && <div><p className="text-xs font-medium text-muted-foreground">Contexte</p><p className="text-sm">{r.context}</p></div>}
                              {r.evaluationScope && <div><p className="text-xs font-medium text-muted-foreground">Périmètre</p><p className="text-sm">{r.evaluationScope}</p></div>}
                              {r.findingsSummary && <div><p className="text-xs font-medium text-muted-foreground">Constats</p><p className="text-sm">{r.findingsSummary}</p></div>}
                              {r.gapsSummary && <div><p className="text-xs font-medium text-muted-foreground">Écarts</p><p className="text-sm">{r.gapsSummary}</p></div>}
                              {r.strengthsSummary && <div><p className="text-xs font-medium text-muted-foreground">Points forts</p><p className="text-sm">{r.strengthsSummary}</p></div>}
                              {r.conclusion && <div><p className="text-xs font-medium text-muted-foreground">Conclusion</p><p className="text-sm">{r.conclusion}</p></div>}

                              {r.status === "DRAFT" && (
                                <Button onClick={() => submitReport(r.id)}>
                                  <Send className="w-4 h-4 mr-2" />Soumettre au RA
                                </Button>
                              )}
                              {r.status === "SUBMITTED" && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm">Rapport soumis — En attente de validation RA</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )) : (
                          <Card>
                            <CardContent className="pt-6 text-center py-8">
                              <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground">Aucun rapport rédigé</p>
                              <Button className="mt-4" onClick={() => setShowDraftForm(true)}>
                                <Edit className="w-4 h-4 mr-2" />Commencer la Rédaction
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          )}

          <Dialog open={showDraftForm} onOpenChange={setShowDraftForm}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Rapport d'Évaluation (FOR 23)</DialogTitle>
                <DialogDescription>Rédigez le rapport synthétisant l'ensemble de l'évaluation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Titre du rapport</label>
                  <Input value={draftForm.title} onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                    placeholder="Rapport d'évaluation — [Organisme]" /></div>
                <div><label className="text-sm font-medium">Contexte</label>
                  <Textarea value={draftForm.context} onChange={(e) => setDraftForm({ ...draftForm, context: e.target.value })}
                    placeholder="Contexte de l'évaluation, type de demande, historique..." rows={3} /></div>
                <div><label className="text-sm font-medium">Périmètre d'évaluation</label>
                  <Textarea value={draftForm.evaluationScope} onChange={(e) => setDraftForm({ ...draftForm, evaluationScope: e.target.value })}
                    placeholder="Domaines et activités évalués, référentiels applicables..." rows={2} /></div>
                <div><label className="text-sm font-medium">Synthèse des constats</label>
                  <Textarea value={draftForm.findingsSummary} onChange={(e) => setDraftForm({ ...draftForm, findingsSummary: e.target.value })}
                    placeholder="Résumé des observations par domaine..." rows={4} /></div>
                <div><label className="text-sm font-medium">Synthèse des écarts</label>
                  <Textarea value={draftForm.gapsSummary} onChange={(e) => setDraftForm({ ...draftForm, gapsSummary: e.target.value })}
                    placeholder="Résumé des écarts identifiés, classification, statut de résolution..." rows={3} /></div>
                <div><label className="text-sm font-medium">Points forts</label>
                  <Textarea value={draftForm.strengthsSummary} onChange={(e) => setDraftForm({ ...draftForm, strengthsSummary: e.target.value })}
                    placeholder="Bonnes pratiques identifiées..." rows={2} /></div>
                <div><label className="text-sm font-medium">Conclusion et recommandation</label>
                  <Textarea value={draftForm.conclusion} onChange={(e) => setDraftForm({ ...draftForm, conclusion: e.target.value })}
                    placeholder="Conclusion générale et recommandation pour le CAS..." rows={3} /></div>
                <div><label className="text-sm font-medium">Recommandations complémentaires</label>
                  <Textarea value={draftForm.recommendations} onChange={(e) => setDraftForm({ ...draftForm, recommendations: e.target.value })}
                    placeholder="Recommandations pour l'OEC..." rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDraftForm(false)}>Annuler</Button>
                <Button onClick={createDraft} disabled={submitting || !draftForm.title}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Sauvegarder le Brouillon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
