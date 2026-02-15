import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText, CheckCircle, XCircle, Send, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ReportValidationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValidate, setShowValidate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [corrections, setCorrections] = useState("");
  const [approved, setApproved] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) => ["REPORT_DRAFTING", "REPORT_VALIDATION", "REPORT_VALIDATED"].includes(r.status)));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/reports/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) setReports(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleValidate = async () => {
    try {
      const res = await apiRequest("POST", `/api/workflow/reports/${selectedReport.id}/validate`, {
        approved, corrections: !approved ? corrections : "",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: approved ? "Rapport validé" : "Corrections demandées au REE" });
        setShowValidate(false);
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;
  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
    SUBMITTED_TO_CD: { label: "Soumis", color: "bg-blue-100 text-blue-800" },
    CORRECTIONS_NEEDED: { label: "Corrections", color: "bg-amber-100 text-amber-800" },
    VALIDATED: { label: "Validé", color: "bg-green-100 text-green-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Validation du Rapport d'Évaluation</h1>
            <p className="text-muted-foreground mt-1">Vérifiez et validez les rapports soumis par le REE (Étapes 9-10)</p>
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
                    </div>
                  ))}
                  {requests.length === 0 && <p className="text-sm text-muted-foreground">Aucun rapport à valider</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg"><FileText className="inline w-5 h-5 mr-2" />Rapports d'Évaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : reports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun rapport soumis pour ce dossier</p>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{report.reportNumber}</h3>
                              <Badge className={statusLabels[report.status]?.color}>{statusLabels[report.status]?.label || report.status}</Badge>
                            </div>
                            {report.status === "SUBMITTED_TO_CD" && (
                              <Button onClick={() => { setSelectedReport(report); setShowValidate(true); }}>
                                <CheckCircle className="w-4 h-4 mr-2" />Examiner
                              </Button>
                            )}
                          </div>

                          {report.contextAndObjectives && (
                            <div><p className="text-xs font-medium text-muted-foreground uppercase">Contexte et objectifs</p>
                              <p className="text-sm mt-1">{report.contextAndObjectives}</p></div>
                          )}
                          {report.findingsByRequirement && (
                            <div><p className="text-xs font-medium text-muted-foreground uppercase">Constats par exigence</p>
                              <p className="text-sm mt-1">{report.findingsByRequirement}</p></div>
                          )}
                          {report.gapsSummary && (
                            <div><p className="text-xs font-medium text-muted-foreground uppercase">Synthèse des écarts</p>
                              <p className="text-sm mt-1">{report.gapsSummary}</p></div>
                          )}
                          {report.strengths && (
                            <div><p className="text-xs font-medium text-muted-foreground uppercase">Points forts</p>
                              <p className="text-sm mt-1">{report.strengths}</p></div>
                          )}
                          {report.conclusionAndRecommendation && (
                            <div><p className="text-xs font-medium text-muted-foreground uppercase">Conclusion & Recommandation</p>
                              <p className="text-sm mt-1">{report.conclusionAndRecommendation}</p></div>
                          )}

                          {report.correctionRequests && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-amber-800"><Edit className="inline w-4 h-4 mr-1" />Corrections demandées</p>
                              <p className="text-sm text-amber-700 mt-1">{report.correctionRequests}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={showValidate} onOpenChange={setShowValidate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Examiner le Rapport</DialogTitle>
                <DialogDescription>Rapport: {selectedReport?.reportNumber}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={approved ? "default" : "outline"} className="flex-1" onClick={() => setApproved(true)}>
                    <CheckCircle className="w-4 h-4 mr-2" />Valider
                  </Button>
                  <Button variant={!approved ? "destructive" : "outline"} className="flex-1" onClick={() => setApproved(false)}>
                    <XCircle className="w-4 h-4 mr-2" />Demander corrections
                  </Button>
                </div>
                {!approved && (
                  <div><label className="text-sm font-medium">Corrections demandées</label>
                    <Textarea value={corrections} onChange={(e) => setCorrections(e.target.value)}
                      placeholder="Précisez les ajustements nécessaires..." rows={4} /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidate(false)}>Annuler</Button>
                <Button onClick={handleValidate}>{approved ? "Valider le Rapport" : "Demander les Corrections"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
