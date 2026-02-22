import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileSearch, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryAnalysisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
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
      const [reqRes, notesRes] = await Promise.all([
        fetch(`/api/requests/${team.requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/notes/by-request/${team.requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
    } catch (e) { console.error(e); }
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Revue Documentaire</h1>
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
