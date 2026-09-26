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
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText, CheckCircle, XCircle, Edit, Clock, BookOpen, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { consumeDeepLinkedRequest } from "@/lib/ra-resume";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  SUBMITTED_TO_CD: { label: "Soumis au CD", color: "bg-blue-100 text-blue-800" },
  CORRECTIONS_NEEDED: { label: "Corrections demandées", color: "bg-amber-100 text-amber-800" },
  VALIDATED: { label: "Validé par CD", color: "bg-green-100 text-green-800" },
  DT_VALIDATED: { label: "Validé par DT", color: "bg-emerald-100 text-emerald-800" },
  CONSOLIDATED: { label: "Consolidé", color: "bg-purple-100 text-purple-800" },
};

export default function ReportValidationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValidate, setShowValidate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [validated, setValidated] = useState(true);
  const [correctionRequests, setCorrectionRequests] = useState("");
  const [for23Content, setFor23Content] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        const filtered = all.filter((r: any) =>
          ["GAPS_RESOLVED", "REPORT_DRAFTING", "REPORT_VALIDATION", "REPORT_VALIDATED", "REPORT_DT_VALIDATED", "REPORT_CONSOLIDATION"].includes(r.status)
        );
        setRequests(filtered);
        consumeDeepLinkedRequest(filtered, (req) => { void selectRequest(req); });
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/accreditation/${req.id}/reports`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setReports(data.data || []);
      else if (Array.isArray(data)) setReports(data);
    } catch (e) { setReports([]); }
  };

  const openValidateDialog = (report: any) => {
    setSelectedReport(report);
    setValidated(true);
    setCorrectionRequests("");
    setFor23Content(report.fOR23AppreciationSheet || report.FOR23AppreciationSheet || "");
    setShowValidate(true);
  };

  const handleValidate = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest("PUT", `/api/workflow/accreditation/reports/${selectedReport.id}/validate`, {
        validated,
        correctionRequests: !validated ? correctionRequests : null,
        for23Content: validated ? for23Content : null,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: validated ? "Rapport validé  FOR 23 enregistrée" : "Corrections demandées au REE" });
        setShowValidate(false);
        loadData();
        selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Validation du Rapport d'évaluation</h1>
              <p className="text-muted-foreground mt-1">Vérifiez les rapports, remplissez le FOR 23 et validez (Étape 9)</p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.domain}</p>
                      <Badge variant="outline" className="text-xs mt-1">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                  {requests.length === 0 && <p className="text-sm text-muted-foreground">Aucun rapport → valider</p>}
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-4">
                {!selectedRequest ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier pour examiner le rapport</p>
                  </CardContent></Card>
                ) : reports.length === 0 ? (
                  <Card><CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">Aucun rapport soumis pour ce dossier</p>
                  </CardContent></Card>
                ) : (
                  reports.map((report: any) => (
                    <Card key={report.id} className="overflow-hidden">
                      <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5" />{report.reportNumber}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {report.type?.replace(/_/g, " ")}  Créé le {report.createdAt && new Date(report.createdAt).toLocaleDateString("fr-FR")}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_LABELS[report.status]?.color || "bg-gray-100"}>
                              {STATUS_LABELS[report.status]?.label || report.status}
                            </Badge>
                            {report.status === "SUBMITTED_TO_CD" && (
                              <Button onClick={() => openValidateDialog(report)}>
                                <CheckCircle className="w-4 h-4 mr-2" />Examiner & Valider
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {/* 15-day deadline warning */}
                        {report.status === "SUBMITTED_TO_CD" && report.submittedToCD && (() => {
                          const submitted = new Date(report.submittedToCD);
                          const deadline = new Date(submitted.getTime() + 15 * 24 * 60 * 60 * 1000);
                          const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return (
                            <div className={`flex items-center gap-2 p-3 rounded-lg ${daysLeft <= 3 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"} border`}>
                              <Clock className={`w-4 h-4 ${daysLeft <= 3 ? "text-red-600" : "text-amber-600"}`} />
                              <span className={`text-sm ${daysLeft <= 3 ? "text-red-800" : "text-amber-800"}`}>
                                {daysLeft > 0 ? `${daysLeft} jour(s) restant(s) pour valider (délai 15 jours)` : "Délai de validation dépassé"}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Report content sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {report.contextAndObjectives && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Contexte & Objectifs</p>
                              <p className="text-sm">{report.contextAndObjectives}</p>
                            </div>
                          )}
                          {report.teamComposition && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">équipe d'évaluation</p>
                              <p className="text-sm">{report.teamComposition}</p>
                            </div>
                          )}
                        </div>

                        {report.findingsByRequirement && (
                          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Constats par exigence</p>
                            <p className="text-sm">{report.findingsByRequirement}</p>
                          </div>
                        )}

                        {report.gapsSummary && (
                          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                            <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Synthèse des écarts</p>
                            <p className="text-sm">{report.gapsSummary}</p>
                          </div>
                        )}

                        {report.gapsStatus && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Traitement des écarts</p>
                            <p className="text-sm">{report.gapsStatus}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {report.strengths && (
                            <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                              <p className="text-xs font-semibold text-green-800 uppercase mb-1">Points forts</p>
                              <p className="text-sm">{report.strengths}</p>
                            </div>
                          )}
                          {report.improvementAreas && (
                            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                              <p className="text-xs font-semibold text-purple-800 uppercase mb-1">Axes d'amélioration</p>
                              <p className="text-sm">{report.improvementAreas}</p>
                            </div>
                          )}
                        </div>

                        {report.conclusionAndRecommendation && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-xs font-semibold text-primary uppercase mb-1">Conclusion & Recommandation</p>
                            <p className="text-sm">{report.conclusionAndRecommendation}</p>
                          </div>
                        )}

                        {/* FOR 23 if filled */}
                        {(report.fOR23AppreciationSheet || report.FOR23AppreciationSheet) && (
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                            <p className="text-xs font-semibold text-indigo-800 uppercase mb-1">FOR 23  Fiche d'appréciation (CD)</p>
                            <p className="text-sm">{report.fOR23AppreciationSheet || report.FOR23AppreciationSheet}</p>
                          </div>
                        )}

                        {/* Corrections feedback */}
                        {report.correctionRequests && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-medium text-amber-800"><Edit className="inline w-4 h-4 mr-1" />Corrections demandées</p>
                            <p className="text-sm text-amber-700 mt-1">{report.correctionRequests}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Validate Dialog with FOR 23 */}
          <Dialog open={showValidate} onOpenChange={setShowValidate}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Examiner le Rapport</DialogTitle>
                <DialogDescription>Rapport: {selectedReport?.reportNumber}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={validated ? "default" : "outline"} className="flex-1" onClick={() => setValidated(true)}>
                    <CheckCircle className="w-4 h-4 mr-2" />Valider
                  </Button>
                  <Button variant={!validated ? "destructive" : "outline"} className="flex-1" onClick={() => setValidated(false)}>
                    <XCircle className="w-4 h-4 mr-2" />Demander corrections
                  </Button>
                </div>

                {validated ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      FOR 23  Fiche d'appréciation du CD *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Renseignez vos observations et votre appréciation globale. Ce document sera transmis au CAS avec le dossier.
                    </p>
                    <Textarea value={for23Content} onChange={(e) => setFor23Content(e.target.value)}
                      placeholder="Appréciation du CD : synthèse de l'évaluation, recommandation pour le CAS..." rows={6} />
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-red-600">Corrections demandées</Label>
                    <Textarea value={correctionRequests} onChange={(e) => setCorrectionRequests(e.target.value)}
                      placeholder="Précisez les ajustements que le REE doit apporter au rapport..." rows={4} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidate(false)}>Annuler</Button>
                <Button onClick={handleValidate}
                  disabled={submitting || (validated && !for23Content) || (!validated && !correctionRequests)}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {validated ? "Valider & Enregistrer FOR 23" : "Demander les Corrections"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
