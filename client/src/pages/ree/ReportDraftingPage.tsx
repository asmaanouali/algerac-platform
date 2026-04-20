import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Send, BookOpen, Clock, AlertTriangle, Loader2 } from "lucide-react";

const REPORT_TYPES = [
  { value: "FOR_09_LABORATORY", label: "FOR 09  Laboratoire d'essais/étalonnage" },
  { value: "FOR_09_1_BIOMEDICAL", label: "FOR 09.1  Laboratoire biomédical" },
  { value: "FOR_08_INSPECTION", label: "FOR 08  Organisme d'inspection" },
  { value: "FOR_10_CERTIFICATION", label: "FOR 10  Organisme de certification" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SUBMITTED_TO_CD: "Soumis au CD",
  CORRECTIONS_NEEDED: "Corrections demandées",
  VALIDATED: "Validé par CD",
  DT_VALIDATED: "Validé par DT",
  CONSOLIDATED: "Consolidé",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED_TO_CD: "bg-blue-100 text-blue-800",
  CORRECTIONS_NEEDED: "bg-orange-100 text-orange-800",
  VALIDATED: "bg-green-100 text-green-800",
  DT_VALIDATED: "bg-emerald-100 text-emerald-800",
  CONSOLIDATED: "bg-purple-100 text-purple-800",
};

export default function ReportDraftingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reportForm, setReportForm] = useState({
    type: "FOR_09_LABORATORY",
    contextAndObjectives: "",
    teamComposition: "",
    programRealized: "",
    findingsByRequirement: "",
    gapsSummary: "",
    gapsStatus: "",
    strengths: "",
    improvementAreas: "",
    conclusion: "",
  });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["GAPS_RESOLVED", "EVALUATION_COMPLETED", "REPORT_DRAFTING", "REPORT_VALIDATION",
           "REPORT_VALIDATED", "REPORT_DT_VALIDATED", "REPORT_CONSOLIDATION"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { }
    setLoading(false);
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    try {
      const res = await fetch(`/api/workflow/accreditation/${r.id}/reports`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch (err) { setReports([]); }
  };

  const handleCreateReport = async () => {
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/report`, reportForm);
      toast({ title: "Rapport d'évaluation créé avec succès" });
      setShowCreateReport(false);
      setReportForm({
        type: "FOR_09_LABORATORY", contextAndObjectives: "", teamComposition: "",
        programRealized: "", findingsByRequirement: "", gapsSummary: "",
        gapsStatus: "", strengths: "", improvementAreas: "", conclusion: "",
      });
      selectRequest(selectedRequest);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const handleSubmitReport = async (reportId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/reports/${reportId}/submit`, {});
      toast({ title: "Rapport soumis au CD pour validation" });
      selectRequest(selectedRequest);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getDeadlineDays = (r: any) => {
    if (!r?.evaluationEndDate) return null;
    const end = new Date(r.evaluationEndDate);
    const deadline = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Rédaction du Rapport d'Évaluation</h1>
            <p className="text-muted-foreground">
              Rédigez et soumettez le rapport au CD/RA pour validation (Étape 9)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Dossiers</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                {loading ? <p className="text-sm text-muted-foreground">Chargement...</p>
                 : requests.length === 0 ? <p className="text-sm text-muted-foreground">Aucun dossier</p>
                 : requests.map((r) => (
                  <div key={r.id} onClick={() => selectRequest(r)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50"}`}>
                    <p className="font-medium text-sm">{r.referenceNumber}</p>
                    <Badge className="mt-1" variant="outline">{r.status?.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Deadline indicator */}
                  {(() => {
                    const days = getDeadlineDays(selectedRequest);
                    if (days === null) return null;
                    const overdue = days < 0;
                    return (
                      <div className={`flex items-center gap-3 p-4 rounded-lg border ${overdue ? "bg-red-50 border-red-200" : days <= 7 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                        {overdue ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                        <div>
                          <p className={`text-sm font-medium ${overdue ? "text-red-800" : "text-amber-800"}`}>
                            {overdue ? `Délai de 30 jours dépassé de ${Math.abs(days)} jour(s)` : `${days} jour(s) restant(s) pour rédiger le rapport`}
                          </p>
                          <p className="text-xs text-muted-foreground">Délai réglementaire : 30 jours à compter de la réunion de clôture</p>
                        </div>
                      </div>
                    );
                  })()}

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedRequest.referenceNumber}</CardTitle>
                          <CardDescription>{selectedRequest.organizationName}</CardDescription>
                        </div>
                        {["GAPS_RESOLVED", "EVALUATION_COMPLETED", "REPORT_DRAFTING"].includes(selectedRequest.status) && (
                          <Button onClick={() => setShowCreateReport(true)}>
                            <FileText className="w-4 h-4 mr-2" />Rédiger le rapport
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Rapports</CardTitle></CardHeader>
                    <CardContent>
                      {reports.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun rapport rédigé</p>
                      ) : (
                        <div className="space-y-3">
                          {reports.map((rpt: any) => (
                            <Card key={rpt.id} className="p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span className="font-medium text-sm">{rpt.reportNumber}</span>
                                  <Badge className={STATUS_COLORS[rpt.status] || "bg-gray-100"}>
                                    {STATUS_LABELS[rpt.status] || rpt.status}
                                  </Badge>
                                  {rpt.type && <Badge variant="outline" className="text-xs">{rpt.type.replace(/_/g, " ")}</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {rpt.createdAt && new Date(rpt.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>

                              {rpt.conclusionAndRecommendation && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{rpt.conclusionAndRecommendation}</p>
                              )}

                              {rpt.correctionRequests && rpt.status === "CORRECTIONS_NEEDED" && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                                  <p className="text-xs font-semibold text-orange-800">Corrections demandées par le CD :</p>
                                  <p className="text-xs text-orange-700">{rpt.correctionRequests}</p>
                                </div>
                              )}

                              {(rpt.status === "DRAFT" || rpt.status === "CORRECTIONS_NEEDED") && (
                                <Button size="sm" className="mt-2" onClick={() => handleSubmitReport(rpt.id)}>
                                  <Send className="w-3 h-3 mr-1" />Soumettre au CD
                                </Button>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Create Report Dialog */}
          <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Rédiger le Rapport d'Évaluation</DialogTitle>
                <DialogDescription>
                  Structurez votre rapport selon le formulaire applicable. Tous les champs contribuent au dossier soumis au CAS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type de rapport *</Label>
                  <select className="w-full border rounded-md p-2 mt-1" value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}>
                    {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Contexte et objectifs de l'évaluation *</Label>
                  <Textarea value={reportForm.contextAndObjectives}
                    onChange={(e) => setReportForm({ ...reportForm, contextAndObjectives: e.target.value })}
                    placeholder="Périmètre de l'évaluation, objectifs, normes applicables..." className="min-h-[80px]" />
                </div>
                <div>
                  <Label>Composition de l'équipe d'évaluation</Label>
                  <Textarea value={reportForm.teamComposition}
                    onChange={(e) => setReportForm({ ...reportForm, teamComposition: e.target.value })}
                    placeholder="REE, évaluateurs techniques, experts..." className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Programme réalisé</Label>
                  <Textarea value={reportForm.programRealized}
                    onChange={(e) => setReportForm({ ...reportForm, programRealized: e.target.value })}
                    placeholder="Déroulement chronologique de l'évaluation sur site..." className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Constats par exigence *</Label>
                  <Textarea value={reportForm.findingsByRequirement}
                    onChange={(e) => setReportForm({ ...reportForm, findingsByRequirement: e.target.value })}
                    placeholder="Constats détaillés par exigence du référentiel..." className="min-h-[100px]" />
                </div>
                <div>
                  <Label>Synthèse des écarts *</Label>
                  <Textarea value={reportForm.gapsSummary}
                    onChange={(e) => setReportForm({ ...reportForm, gapsSummary: e.target.value })}
                    placeholder="Résumé des écarts critiques et non-critiques (FOR 02)..." className="min-h-[80px]" />
                </div>
                <div>
                  <Label>État du traitement des écarts</Label>
                  <Textarea value={reportForm.gapsStatus}
                    onChange={(e) => setReportForm({ ...reportForm, gapsStatus: e.target.value })}
                    placeholder="Plans d'action soumis, preuves vérifiées, écarts soldés..." className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Points forts identifiés</Label>
                  <Textarea value={reportForm.strengths}
                    onChange={(e) => setReportForm({ ...reportForm, strengths: e.target.value })}
                    placeholder="Points forts et bonnes pratiques observées..." />
                </div>
                <div>
                  <Label>Axes d'amélioration</Label>
                  <Textarea value={reportForm.improvementAreas}
                    onChange={(e) => setReportForm({ ...reportForm, improvementAreas: e.target.value })}
                    placeholder="Opportunités d'amélioration identifiées..." />
                </div>
                <div>
                  <Label>Conclusion et recommandation *</Label>
                  <Textarea value={reportForm.conclusion}
                    onChange={(e) => setReportForm({ ...reportForm, conclusion: e.target.value })}
                    placeholder="Conclusion générale et recommandation pour la décision d'accréditation..." className="min-h-[80px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateReport(false)}>Annuler</Button>
                <Button onClick={handleCreateReport}
                  disabled={submitting || !reportForm.contextAndObjectives || !reportForm.findingsByRequirement || !reportForm.conclusion}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Créer le rapport
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
