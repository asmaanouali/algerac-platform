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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Send, CheckCircle, BookOpen, Upload, Clock } from "lucide-react";

export default function ReportDraftingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showSubmitReport, setShowSubmitReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Forms
  const [reportForm, setReportForm] = useState({
    content: "", findings: "", conformityAssessment: "", nonConformities: "",
    observations: "", recommendations: ""
  });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["GAPS_RESOLVED", "REPORT_DRAFTING", "REPORT_SUBMITTED", "REPORT_VALIDATED",
           "REPORT_DT_VALIDATED", "REPORT_CONSOLIDATION"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    try {
      const res = await fetch(`/api/workflow/accreditation/${r.id}/reports`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch (err) { console.error(err); setReports([]); }
  };

  const handleCreateReport = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/report`, reportForm);
      toast({ title: "Rapport d'évaluation créé" });
      setShowCreateReport(false);
      setReportForm({ content: "", findings: "", conformityAssessment: "", nonConformities: "", observations: "", recommendations: "" });
      selectRequest(selectedRequest);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmitReport = async (reportId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/reports/${reportId}/submit`, {});
      toast({ title: "Rapport soumis au responsable d'accréditation" });
      selectRequest(selectedRequest);
      loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getReportStatusColor = (status: string) => {
    const m: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      CD_VALIDATED: "bg-green-100 text-green-800",
      DT_VALIDATED: "bg-emerald-100 text-emerald-800",
      CONSOLIDATED: "bg-purple-100 text-purple-800"
    };
    return m[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Rédaction du rapport d'évaluation</h1>
            <p className="text-muted-foreground">
              Rédigez et soumettez les rapports d'évaluation pour validation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dossiers à rapporter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => selectRequest(r)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-sm">{r.referenceNumber}</p>
                        <Badge className="mt-1" variant="outline">{r.status?.replace(/_/g, " ")}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedRequest.referenceNumber}</CardTitle>
                          <CardDescription>{selectedRequest.organizationName}</CardDescription>
                        </div>
                        <Badge variant="outline">{selectedRequest.status?.replace(/_/g, " ")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {["GAPS_RESOLVED", "REPORT_DRAFTING"].includes(selectedRequest.status) && (
                        <Button onClick={() => setShowCreateReport(true)}>
                          <FileText className="w-4 h-4 mr-2" />Rédiger le rapport
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reports list */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rapports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reports.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun rapport rédigé</p>
                      ) : (
                        <div className="space-y-3">
                          {reports.map((rpt: any) => (
                            <Card key={rpt.id} className="p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span className="font-medium text-sm">Rapport #{rpt.id}</span>
                                  <Badge className={getReportStatusColor(rpt.status)}>
                                    {rpt.status?.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {rpt.createdAt && new Date(rpt.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{rpt.content}</p>

                              {rpt.status === "DRAFT" && (
                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" onClick={() => handleSubmitReport(rpt.id)}>
                                    <Send className="w-3 h-3 mr-1" />Soumettre au CD
                                  </Button>
                                </div>
                              )}

                              {/* Deadline warning */}
                              {rpt.status === "SUBMITTED" && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                                  <Clock className="w-3 h-3" />
                                  <span>Délai de validation: 15 jours</span>
                                </div>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Rédiger le rapport d'évaluation</DialogTitle>
                <DialogDescription>
                  Rapport confidentiel destiné au responsable d'accréditation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Contenu du rapport</Label>
                  <Textarea value={reportForm.content}
                    onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                    placeholder="Résumé de l'évaluation sur site..." className="min-h-[100px]" />
                </div>
                <div>
                  <Label>Constats</Label>
                  <Textarea value={reportForm.findings}
                    onChange={(e) => setReportForm({ ...reportForm, findings: e.target.value })}
                    placeholder="Constats détaillés..." className="min-h-[80px]" />
                </div>
                <div>
                  <Label>Évaluation de la conformité</Label>
                  <Textarea value={reportForm.conformityAssessment}
                    onChange={(e) => setReportForm({ ...reportForm, conformityAssessment: e.target.value })}
                    placeholder="Analyse de conformité par rapport aux exigences normatives..." className="min-h-[80px]" />
                </div>
                <div>
                  <Label>Non-conformités identifiées</Label>
                  <Textarea value={reportForm.nonConformities}
                    onChange={(e) => setReportForm({ ...reportForm, nonConformities: e.target.value })}
                    placeholder="Liste des non-conformités..." />
                </div>
                <div>
                  <Label>Observations</Label>
                  <Textarea value={reportForm.observations}
                    onChange={(e) => setReportForm({ ...reportForm, observations: e.target.value })}
                    placeholder="Observations complémentaires..." />
                </div>
                <div>
                  <Label>Recommandations</Label>
                  <Textarea value={reportForm.recommendations}
                    onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                    placeholder="Recommandations pour la décision d'accréditation..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateReport(false)}>Annuler</Button>
                <Button onClick={handleCreateReport}>
                  <FileText className="w-4 h-4 mr-2" />Créer le rapport
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
