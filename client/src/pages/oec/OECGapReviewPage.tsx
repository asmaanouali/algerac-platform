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
import { Loader2, CheckCircle2, XCircle, AlertTriangle, FileText, ThumbsUp, ThumbsDown } from "lucide-react";

/**
 * OEC Gap Review Page — Étape 7
 * The REE sends gaps + synthesis to OEC after closing meeting.
 * OEC must accept or refuse each gap. Refused → REE + CD notified.
 * If all accepted → OK to RA for CAS.
 */
export default function OECGapReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [oecGaps, setOecGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [refusalReason, setRefusalReason] = useState("");

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests/my-requests", { credentials: "include" });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      const relevant = list.filter((r: any) =>
        ["EVALUATION_GAPS_SENT_TO_OEC", "EVALUATION_OEC_REVIEW", "EVALUATION_OEC_ALL_ACCEPTED",
         "EVALUATION_CLOSING_MEETING", "EVALUATION_COMPLETED"].includes(r.status)
      );
      setRequests(relevant);
    } catch (err) { }
    setLoading(false);
  };

  const loadGaps = async (request: any) => {
    setSelectedRequest(request);
    try {
      const res = await fetch(`/api/workflow/evaluation/oec-gaps/${request.id}`, { credentials: "include" });
      const data = await res.json();
      setOecGaps(Array.isArray(data) ? data : (data.data || []));
    } catch (err) { }
  };

  const handleAccept = async (gap: any) => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/gap/${gap.id}/oec-response`, {
        accepted: true,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Écart accepté", description: data.message });
        loadGaps(selectedRequest);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const handleRefuse = async () => {
    if (!selectedGap || !refusalReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation/gap/${selectedGap.id}/oec-response`, {
        accepted: false,
        refusalReason: refusalReason,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Écart refusé", description: "Le REE et le CD ont été notifiés" });
        setShowRefuseDialog(false);
        setRefusalReason("");
        setSelectedGap(null);
        loadGaps(selectedRequest);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  if (!user) return null;

  const pendingGaps = oecGaps.filter((g: any) => g.oecAccepted === null || g.oecAccepted === undefined);
  const acceptedGaps = oecGaps.filter((g: any) => g.oecAccepted === true);
  const refusedGaps = oecGaps.filter((g: any) => g.oecAccepted === false);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Revue des Écarts — Étape 7</h1>
            <p className="text-muted-foreground mt-1">Acceptez ou refusez les écarts envoyés par l'équipe d'évaluation</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* LEFT: Request list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-sm">Mes dossiers</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier avec des écarts à examiner</p>
                  ) : requests.map((r: any) => (
                    <div key={r.id} onClick={() => loadGaps(r)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber}</p>
                      <Badge variant="outline" className="text-xs mt-1">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* RIGHT: Gaps detail */}
              <div className="lg:col-span-3">
                {!selectedRequest ? (
                  <Card className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Sélectionnez un dossier</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      <Card className="p-3 text-center">
                        <p className="text-xl font-bold">{oecGaps.length}</p>
                        <p className="text-xs text-muted-foreground">Total écarts</p>
                      </Card>
                      <Card className="p-3 text-center bg-amber-50">
                        <p className="text-xl font-bold text-amber-600">{pendingGaps.length}</p>
                        <p className="text-xs text-muted-foreground">En attente</p>
                      </Card>
                      <Card className="p-3 text-center bg-green-50">
                        <p className="text-xl font-bold text-green-600">{acceptedGaps.length}</p>
                        <p className="text-xs text-muted-foreground">Acceptés</p>
                      </Card>
                      <Card className="p-3 text-center bg-red-50">
                        <p className="text-xl font-bold text-red-600">{refusedGaps.length}</p>
                        <p className="text-xs text-muted-foreground">Refusés</p>
                      </Card>
                    </div>

                    {/* Info banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Important :</strong> Vous devez vous prononcer sur chaque écart identifié par l'équipe d'évaluation.
                        Les écarts refusés seront signalés au REE et au CD. Si tous sont acceptés, le processus passe au traitement des écarts (Étape 8).
                      </p>
                    </div>

                    {/* Pending gaps */}
                    {pendingGaps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-amber-700">
                            <AlertTriangle className="w-4 h-4 mr-1 inline" />Écarts en attente de votre réponse
                          </CardTitle>
                          <CardDescription>{pendingGaps.length} écart(s) à examiner</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {pendingGaps.map((g: any) => (
                            <div key={g.id} className="p-4 border rounded-lg">
                              <div className="flex items-start gap-2 mb-2">
                                <Badge variant={g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "destructive" : "secondary"}>
                                  {g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "Critique" : "Non-critique"}
                                </Badge>
                                {g.normReference && <span className="text-xs text-muted-foreground">Réf: {g.normReference || g.requirement}</span>}
                              </div>
                              <p className="text-sm font-medium mb-1">
                                {g.reeModifiedDescription || g.description}
                              </p>
                              {g.evidence && <p className="text-xs text-muted-foreground">Preuves: {g.reeModifiedEvidence || g.evidence}</p>}
                              {g.createdByName && <p className="text-xs text-muted-foreground mt-1">Rapporté par: {g.createdByName}</p>}

                              <div className="flex gap-2 mt-3">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAccept(g)} disabled={submitting}>
                                  <ThumbsUp className="w-3 h-3 mr-1" />Accepter
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  setSelectedGap(g);
                                  setRefusalReason("");
                                  setShowRefuseDialog(true);
                                }} disabled={submitting}>
                                  <ThumbsDown className="w-3 h-3 mr-1" />Refuser
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Accepted gaps */}
                    {acceptedGaps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1 inline" />Écarts Acceptés
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {acceptedGaps.map((g: any) => (
                            <div key={g.id} className="p-3 border border-green-200 bg-green-50/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "destructive" : "secondary"} className="text-xs">
                                  {g.severity === "CRITICAL" || g.type === "CRITIQUE" ? "Critique" : "Non-critique"}
                                </Badge>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                              <p className="text-sm">{g.reeModifiedDescription || g.description}</p>
                              {g.oecResponseDate && <span className="text-xs text-muted-foreground">Accepté le {new Date(g.oecResponseDate).toLocaleDateString("fr-FR")}</span>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Refused gaps */}
                    {refusedGaps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-red-700">
                            <XCircle className="w-4 h-4 mr-1 inline" />Écarts Refusés
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {refusedGaps.map((g: any) => (
                            <div key={g.id} className="p-3 border border-red-200 bg-red-50/50 rounded-lg">
                              <Badge variant="destructive" className="text-xs mb-1">Refusé</Badge>
                              <p className="text-sm">{g.reeModifiedDescription || g.description}</p>
                              {g.oecRefusalReason && (
                                <p className="text-xs text-red-700 mt-1">
                                  <strong>Motif :</strong> {g.oecRefusalReason}
                                </p>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* All reviewed message */}
                    {pendingGaps.length === 0 && oecGaps.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">
                          Tous les écarts ont été examinés. {acceptedGaps.length} accepté(s), {refusedGaps.length} refusé(s).
                        </p>
                        {acceptedGaps.length === oecGaps.length && (
                          <p className="text-xs text-green-700 mt-1">
                            Tous les écarts sont acceptés — le processus peut avancer vers le traitement des écarts (Étape 8).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refusal Dialog */}
          <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser l'écart</DialogTitle>
                <DialogDescription>
                  Indiquez le motif de votre refus. Le REE et le CD seront notifiés.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border text-sm">
                  <p className="font-medium mb-1">Écart concerné :</p>
                  <p className="text-muted-foreground">{selectedGap?.reeModifiedDescription || selectedGap?.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Motif du refus *</label>
                  <Textarea value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)}
                    placeholder="Expliquez pourquoi vous refusez cet écart..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRefuseDialog(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleRefuse} disabled={submitting || !refusalReason.trim()}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Confirmer le refus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
