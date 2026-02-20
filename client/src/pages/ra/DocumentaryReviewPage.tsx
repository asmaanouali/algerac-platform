import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileSearch, AlertTriangle, CheckCircle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeficiency, setShowDeficiency] = useState(false);
  const [deficiencyDetails, setDeficiencyDetails] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) =>
          ["TEAM_VALIDATED", "DOCUMENTARY_REVIEW", "DOCUMENTARY_REVIEW_DEFICIENCIES", "AWAITING_OEC_DOC_RESPONSE", "DOCUMENTARY_REVIEW_COMPLETED"].includes(r.status)
        ));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/documentary-review/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  const startReview = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/documentary-review/start", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Revue documentaire démarrée. Les documents ont été transmis à l'équipe." });
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const reportDeficiency = async () => {
    if (!deficiencyDetails.trim()) return;
    const review = reviews[0];
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/report-deficiency`, {
        details: deficiencyDetails,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Insuffisances signalées. L'OEC sera notifié." });
        setShowDeficiency(false);
        setDeficiencyDetails("");
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const completeReview = async () => {
    const review = reviews[0];
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/complete`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Revue documentaire complétée avec succès." });
        loadData();
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const statusMap: Record<string, { label: string; color: string }> = {
    IN_PROGRESS: { label: "En cours", color: "bg-blue-100 text-blue-800" },
    COMPLETED_NO_ISSUES: { label: "Complétée", color: "bg-green-100 text-green-800" },
    DEFICIENCIES_FOUND: { label: "Insuffisances", color: "bg-amber-100 text-amber-800" },
    AWAITING_OEC_RESPONSE: { label: "Attente OEC", color: "bg-orange-100 text-orange-800" },
    OEC_RESPONSE_ACCEPTED: { label: "Réponse acceptée", color: "bg-green-100 text-green-800" },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Revue Documentaire</h1>
            <p className="text-muted-foreground mt-1">Transmettez et analysez les documents de l'OEC (Étape 5 — Délai: 15 jours)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Dossiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en phase de revue documentaire</p>
                  ) : (
                    requests.map((r) => (
                      <div key={r.id} onClick={() => selectRequest(r)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                        <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                        <p className="text-xs text-muted-foreground">{r.domain}</p>
                        <Badge variant="outline" className="mt-1 text-xs">{r.status.replace(/_/g, " ")}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">
                        <FileSearch className="inline w-5 h-5 mr-2" />
                        Revue Documentaire
                      </CardTitle>
                      <CardDescription>
                        {selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Sélectionnez un dossier"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Aucune revue documentaire n'a été démarrée pour ce dossier.</p>
                      <Button onClick={startReview}>
                        <Send className="w-4 h-4 mr-2" />Démarrer la Revue Documentaire
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Les documents seront transmis aux membres de l'équipe d'évaluation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Revue #{review.id}</p>
                              <p className="text-xs text-muted-foreground">
                                Démarrée le {new Date(review.reviewStartDate).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <Badge className={statusMap[review.status]?.color || "bg-gray-100 text-gray-800"}>
                              {statusMap[review.status]?.label || review.status}
                            </Badge>
                          </div>

                          {review.deficienciesIdentified && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Insuffisances identifiées
                              </p>
                              <p className="text-sm text-amber-700 mt-1">{review.deficienciesDetails}</p>
                            </div>
                          )}

                          {review.status === "IN_PROGRESS" && (
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setShowDeficiency(true)}>
                                <AlertTriangle className="w-4 h-4 mr-2" />Signaler des Insuffisances
                              </Button>
                              <Button onClick={completeReview}>
                                <CheckCircle className="w-4 h-4 mr-2" />Valider la Revue
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Délai:</strong> L'équipe dispose de 15 jours pour analyser les documents.
                          En cas d'insuffisance, l'OEC sera notifié pour résoudre les problèmes.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={showDeficiency} onOpenChange={setShowDeficiency}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Signaler des Insuffisances</DialogTitle>
                <DialogDescription>Décrivez les documents manquants ou les informations ambiguës</DialogDescription>
              </DialogHeader>
              <Textarea
                value={deficiencyDetails}
                onChange={(e) => setDeficiencyDetails(e.target.value)}
                placeholder="Détaillez les insuffisances constatées..."
                rows={5}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeficiency(false)}>Annuler</Button>
                <Button onClick={reportDeficiency}>Signaler</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
