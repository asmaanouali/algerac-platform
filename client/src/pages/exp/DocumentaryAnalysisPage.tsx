import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileSearch, CheckCircle, AlertTriangle, Send, Users, Clock, FolderOpen, Wrench, FileText, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const DOC_TYPES = [
  { key: "dossier_candidature", label: "Dossier de demande (FOR-01)", category: "Administratif" },
  { key: "doc_administratif_statuts", label: "Statuts / Acte de création", category: "Administratif" },
  { key: "doc_administratif_organigramme", label: "Organigramme", category: "Administratif" },
  { key: "doc_administratif_locaux", label: "Description des locaux", category: "Administratif" },
  { key: "doc_technique_manuel_qualite", label: "Manuel qualité", category: "Technique" },
  { key: "doc_technique_procedures", label: "Procédures techniques", category: "Technique" },
  { key: "doc_technique_equipements", label: "Liste des équipements & étalonnage", category: "Technique" },
  { key: "doc_technique_personnel", label: "Qualifications du personnel", category: "Technique" },
  { key: "doc_technique_methodes", label: "Méthodes / normes appliquées", category: "Technique" },
  { key: "doc_technique_enregistrements", label: "Enregistrements qualité", category: "Technique" },
];

export default function DocumentaryAnalysisPage() {  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [memberProgress, setMemberProgress] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [results, setResults] = useState("");
  const [deficiencies, setDeficiencies] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingResults, setSubmittingResults] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

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
    setReview(null);
    setMemberProgress([]);
    setAlreadySubmitted(false);
    try {
      const [reqRes, notesRes, reviewRes] = await Promise.all([
        fetch(`/api/requests/${team.requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/notes/by-request/${team.requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/documentary-review/by-request/${team.requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (reviewRes.ok) {
        const reviews = await reviewRes.json();
        if (reviews.length > 0) {
          setReview(reviews[0]);
          // Charger la progression des membres
          try {
            const progRes = await fetch(`/api/workflow/documentary-review/${reviews[0].id}/member-progress`, { credentials: "include" });
            if (progRes.ok) {
              const progress = await progRes.json();
              setMemberProgress(progress);
              // Vérifier si le membre actuel a déjà soumis
              const myProgress = progress.find((p: any) => {
                // Chercher par ID expert ou nom
                return p.expertName === (user?.fullName || user?.nomOrganisme || "");
              });
              if (myProgress?.submitted) setAlreadySubmitted(true);
            }
          } catch (_) {}
        }
      }
    } catch (e) { }
  };

  const submitNote = async () => {
    if (!newNote.trim() || !selectedTeam) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/notes/create", {
        requestId: selectedTeam.requestId,
        authorId: user?.id,
        noteType: "EVALUATION",
        content: newNote,
        section: "Revue Documentaire",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Observation enregistrée" });
        setNewNote("");
        selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitResults = async () => {
    if (!results.trim() || !review) return;
    setSubmittingResults(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/member-submit`, {
        results: results.trim(),
        deficiencies: deficiencies.trim() || null,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Résultats soumis", description: data.message });
        setAlreadySubmitted(true);
        setResults("");
        setDeficiencies("");
        selectTeam(selectedTeam);
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmittingResults(false);
  };

  if (!user) return null;

  const documentChecklist = [
    { label: "Manuel qualité", key: "quality_manual" },
    { label: "Procédures techniques", key: "technical_procedures" },
    { label: "Registres d'étalonnage", key: "calibration_records" },
    { label: "Qualifications du personnel", key: "staff_qualifications" },
    { label: "Maîtrise documentaire", key: "document_control" },
    { label: "Audits internes", key: "internal_audits" },
    { label: "Actions correctives", key: "corrective_actions" },
    { label: "Revue de direction", key: "management_review" },
    { label: "Gestion des risques", key: "risk_management" },
    { label: "Traçabilité métrologique", key: "metrological_traceability" },
  ];

  const isDocReviewActive = request?.status === "DOC_REVIEW_IN_PROGRESS";
  const submittedCount = memberProgress.filter((m: any) => m.submitted).length;
  const totalCount = memberProgress.length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Revue Documentaire</h1>
            <p className="text-muted-foreground mt-1">Analysez les documents soumis par l'OEC (Étape 5)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Mes Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{t.requestReferenceNumber || `Équipe #${t.teamId}`}</p>
                      <p className="text-xs text-muted-foreground">Rôle: {t.role}</p>
                    </div>
                  ))}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier assigné avec engagement signé</p>}
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-6">
                {!selectedTeam ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground py-8">
                        <FileSearch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        Sélectionnez un dossier pour commencer la revue documentaire
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Deadline et progression */}
                    {isDocReviewActive && review?.teamResultsDeadline && (
                      <Alert className="border-indigo-300 bg-indigo-50">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Date limite de soumission :</strong>{" "}
                          {new Date(review.teamResultsDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          {totalCount > 0 && (
                            <span className="ml-3">
                              — <strong>{submittedCount}/{totalCount}</strong> membres ont soumis leurs résultats
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Documents sent by RA */}
                    {review?.transmittedDocumentTypes && (() => {
                      let docs: string[] = [];
                      try { docs = JSON.parse(review.transmittedDocumentTypes); } catch {}
                      if (!docs.length) return null;
                      const adminDocs = DOC_TYPES.filter(d => d.category === "Administratif" && docs.includes(d.key));
                      const techDocs = DOC_TYPES.filter(d => d.category === "Technique" && docs.includes(d.key));
                      return (
                        <Card className="border-emerald-200 bg-emerald-50/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <FolderOpen className="w-4 h-4 text-emerald-600" />Documents transmis par le RA
                            </CardTitle>
                            <CardDescription>Analysez les documents ci-dessous et soumettez vos résultats</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {adminDocs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2"><FolderOpen className="w-3 h-3" />Documents administratifs</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {adminDocs.map(d => (
                                    <div key={d.key} className="flex items-center gap-2 text-sm p-1.5 rounded bg-white border border-blue-100">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                      <span>{d.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {techDocs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-2"><Wrench className="w-3 h-3" />Documents techniques</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {techDocs.map(d => (
                                    <div key={d.key} className="flex items-center gap-2 text-sm p-1.5 rounded bg-white border border-orange-100">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                      <span>{d.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.transmissionNotes && (
                              <Alert className="border-amber-300 bg-amber-50">
                                <AlertDescription>
                                  <span className="font-medium">Note du RA :</span> {review.transmissionNotes}
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Progression des membres */}
                    {isDocReviewActive && memberProgress.length > 0 && (                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4" /> Progression de l'équipe
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {memberProgress.map((m: any) => (
                              <Badge key={m.memberId} variant="outline" className={`text-xs py-1 ${
                                m.submitted ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-600"
                              }`}>
                                {m.submitted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                {m.expertName} ({m.role})
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%` }} />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Already submitted */}
                    {alreadySubmitted && (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="pt-6 text-center space-y-2">
                          <CheckCircle className="w-10 h-10 mx-auto text-green-600" />
                          <h3 className="font-semibold text-green-800">Résultats soumis</h3>
                          <p className="text-sm text-muted-foreground">
                            Vos résultats ont été enregistrés.
                            {submittedCount < totalCount && (
                              <> En attente de {totalCount - submittedCount} autre(s) membre(s).</>
                            )}
                            {submittedCount === totalCount && (
                              <> Tous les membres ont soumis — le RA a été notifié.</>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Submit results form */}
                    {isDocReviewActive && !alreadySubmitted && (
                      <Card className="border-primary/30">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Send className="w-5 h-5" /> Soumettre vos Résultats
                          </CardTitle>
                          <CardDescription>
                            Soumettez vos résultats d'analyse. Dès que tous les membres auront soumis, le processus avancera automatiquement sans attendre la deadline.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Résultats d'analyse *</Label>
                            <Textarea value={results} onChange={(e) => setResults(e.target.value)}
                              placeholder="Décrivez vos observations, constats de conformité et recommandations..."
                              rows={6} />
                          </div>
                          <div className="space-y-2">
                            <Label>Manquements identifiés (optionnel)</Label>
                            <Textarea value={deficiencies} onChange={(e) => setDeficiencies(e.target.value)}
                              placeholder="Listez les non-conformités ou insuffisances documentaires trouvées..."
                              rows={4} />
                          </div>
                          <Button onClick={submitResults} disabled={submittingResults || !results.trim()} size="lg" className="w-full">
                            {submittingResults ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Soumettre mes Résultats
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Checklist */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileSearch className="w-5 h-5" />Checklist Documentaire
                        </CardTitle>
                        <CardDescription>Vérifiez la conformité de chaque document selon les référentiels applicables</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {documentChecklist.map((item) => (
                            <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Observations & Constats</CardTitle>
                        <CardDescription>Notez vos observations pendant la revue documentaire</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {notes.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {notes.filter((n: any) => n.section === "Revue Documentaire").map((n: any) => (
                              <div key={n.id} className="p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{n.noteType}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                                  </span>
                                </div>
                                <p className="text-sm">{n.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Saisissez vos observations, non-conformités ou recommandations..." rows={4} />
                        <Button onClick={submitNote} disabled={submitting || !newNote.trim()}>
                          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                          Enregistrer l'Observation
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
