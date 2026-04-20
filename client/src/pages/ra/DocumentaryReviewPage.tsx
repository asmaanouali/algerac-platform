import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileSearch, Send, CheckCircle, Clock, Users, ArrowRight, Play, User, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const DOC_REVIEW_STATUSES = [
  "TEAM_VALIDATED", "TEAM_RECUSATION_INVALID",
  "DOC_REVIEW_IN_PROGRESS", "DOC_REVIEW_RESULTS_SUBMITTED",
  "DOC_REVIEW_RESULTS_SENT_TO_CD", "DOC_REVIEW_RESULTS_SENT_TO_OEC",
  "DOC_REVIEW_CD_DECISION", "AWAITING_OEC_DOC_RESPONSE",
  "DOCUMENTARY_REVIEW_COMPLETED",
  "DOCUMENTARY_REVIEW", "DOCUMENTARY_REVIEW_DEFICIENCIES",
];

const statusLabels: Record<string, { label: string; color: string; step: number }> = {
  TEAM_VALIDATED: { label: "Équipe validée — Prêt à lancer", color: "bg-green-100 text-green-800", step: 0 },
  TEAM_RECUSATION_INVALID: { label: "Équipe maintenue — Prêt à lancer", color: "bg-green-100 text-green-800", step: 0 },
  DOC_REVIEW_IN_PROGRESS: { label: "Documents transmis à l'équipe (15j)", color: "bg-indigo-100 text-indigo-800", step: 2 },
  DOC_REVIEW_RESULTS_SUBMITTED: { label: "Résultats reçus de l'équipe", color: "bg-purple-100 text-purple-800", step: 3 },
  DOC_REVIEW_RESULTS_SENT_TO_CD: { label: "Résultats envoyés au CD", color: "bg-slate-100 text-slate-800", step: 4 },
  DOC_REVIEW_RESULTS_SENT_TO_OEC: { label: "Résultats envoyés à l'OEC", color: "bg-cyan-100 text-cyan-800", step: 5 },
  AWAITING_OEC_DOC_RESPONSE: { label: "Attente réponse OEC", color: "bg-orange-100 text-orange-800", step: 5 },
  DOC_REVIEW_CD_DECISION: { label: "En attente décision CD", color: "bg-yellow-100 text-yellow-800", step: 6 },
  DOCUMENTARY_REVIEW_COMPLETED: { label: "Revue terminée ✓", color: "bg-green-100 text-green-800", step: 7 },
};

export default function DocumentaryReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [memberProgress, setMemberProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) => DOC_REVIEW_STATUSES.includes(r.status)));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    setMemberProgress([]);
    try {
      const res = await fetch(`/api/workflow/documentary-review/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        if (data.length > 0) {
          // Charger la progression des membres
          try {
            const progRes = await fetch(`/api/workflow/documentary-review/${data[0].id}/member-progress`, { credentials: "include" });
            if (progRes.ok) setMemberProgress(await progRes.json());
          } catch (_) {}
        }
      }
    } catch (e) { }
  };

  const launchReview = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", "/api/workflow/documentary-review/launch", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Revue documentaire lancée. Les documents peuvent être transmis à l'équipe." });
        await loadData();
        const updatedRes = await fetch(`/api/requests/${selectedRequest.id}`, { credentials: "include" });
        if (updatedRes.ok) { const u = await updatedRes.json(); setSelectedRequest(u); await selectRequest(u); }
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const transmitDocs = async () => {
    if (!reviews[0]) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${reviews[0].id}/transmit-docs`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Documents transmis à l'équipe. Délai: 15 jours." });
        await loadData(); await selectRequest(selectedRequest);
      } else { toast({ title: "Erreur", description: data.message, variant: "destructive" }); }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  const sendToCD = async () => {
    if (!reviews[0]) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${reviews[0].id}/send-to-cd`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Résultats envoyés au CD pour validation." });
        await loadData(); await selectRequest(selectedRequest);
      } else { toast({ title: "Erreur", description: data.message, variant: "destructive" }); }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setActionLoading(false);
  };

  if (!user) return null;

  const review = reviews[0];
  const reqStatus = selectedRequest?.status;
  const statusInfo = statusLabels[reqStatus] || { label: reqStatus?.replace(/_/g, " "), color: "bg-gray-100 text-gray-800", step: -1 };

  const steps = [
    { n: 0, label: "Lancer" }, { n: 1, label: "Transmettre" }, { n: 2, label: "Analyse (15j)" },
    { n: 3, label: "Résultats" }, { n: 4, label: "Envoi CD" }, { n: 5, label: "Envoi OEC" },
    { n: 6, label: "Décision CD" }, { n: 7, label: "Terminée" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Revue Documentaire</h1>
            <p className="text-muted-foreground mt-1">Gérez la revue documentaire des dossiers d'accréditation (Étape 5)</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle><CardDescription>{requests.length} dossier(s)</CardDescription></CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en phase de revue documentaire</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.oec?.organizationName || r.domain}</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${statusLabels[r.status]?.color || ""}`}>
                        {statusLabels[r.status]?.label || r.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><FileSearch className="w-5 h-5" />Revue Documentaire</CardTitle>
                      <CardDescription>{selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Sélectionnez un dossier"}</CardDescription>
                    </div>
                    {selectedRequest && <Badge className={statusInfo.color}>{statusInfo.label}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier pour voir les détails</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Progress stepper */}
                      <div className="overflow-x-auto">
                        <div className="flex items-center gap-1 min-w-[700px] px-2">
                          {steps.map((s, i) => (
                            <div key={s.n} className="flex items-center">
                              <div className={`flex flex-col items-center ${s.n <= statusInfo.step ? "text-primary" : "text-gray-400"}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                  s.n < statusInfo.step ? "bg-primary text-white border-primary" :
                                  s.n === statusInfo.step ? "border-primary text-primary bg-primary/10" :
                                  "border-gray-300 text-gray-400"
                                }`}>{s.n}</div>
                                <span className="text-[10px] mt-1 text-center w-16 leading-tight">{s.label}</span>
                              </div>
                              {i < steps.length - 1 && <div className={`w-4 h-0.5 mt-[-14px] ${s.n < statusInfo.step ? "bg-primary" : "bg-gray-300"}`} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step 0: Launch */}
                      {(reqStatus === "TEAM_VALIDATED" || reqStatus === "TEAM_RECUSATION_INVALID") && (
                        <Card className="border-green-200 bg-green-50/50">
                          <CardContent className="pt-6 text-center space-y-4">
                            <Play className="w-12 h-12 mx-auto text-green-600" />
                            <div>
                              <h3 className="text-lg font-semibold">L'équipe est validée</h3>
                              <p className="text-sm text-muted-foreground mt-1">Lancez la revue documentaire. Les documents seront transmis à l'équipe d'évaluation.</p>
                            </div>
                            <Button onClick={launchReview} disabled={actionLoading} size="lg">
                              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                              Lancer la Revue Documentaire
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 1: Transmit docs */}
                      {(reqStatus === "DOC_REVIEW_PAYMENT_VALIDATED" || reqStatus === "DOC_REVIEW_AWAITING_FEE" || reqStatus === "DOC_REVIEW_FEE_PENDING_PAYMENT" || reqStatus === "DOC_REVIEW_PAYMENT_SUBMITTED") && (
                        <Card className="border-emerald-200 bg-emerald-50/50">
                          <CardContent className="pt-6 text-center space-y-4">
                            <Send className="w-12 h-12 mx-auto text-emerald-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-emerald-800">Revue lancée</h3>
                              <p className="text-sm text-muted-foreground mt-1">Transmettez les documents de l'OEC à l'équipe d'évaluation. L'équipe aura <strong>15 jours</strong> maximum.</p>
                            </div>
                            <Button onClick={transmitDocs} disabled={actionLoading} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                              Transmettre les Documents à l'Équipe
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 5: Waiting for team */}
                      {reqStatus === "DOC_REVIEW_IN_PROGRESS" && (
                        <Card className="border-indigo-200 bg-indigo-50/50">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-4">
                              <Clock className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold">Analyse en cours par l'équipe</h3>
                                <p className="text-sm text-muted-foreground mt-1">Les documents ont été transmis. L'équipe dispose de <strong>15 jours</strong> max.</p>
                                {review?.teamResultsDeadline && (
                                  <Alert className="mt-3 border-indigo-300">
                                    <AlertDescription><strong>Date limite:</strong> {new Date(review.teamResultsDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                            {/* Progression des soumissions par membre */}
                            {memberProgress.length > 0 && (
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Progression des membres
                                  </h4>
                                  <Badge variant="outline" className={`text-xs ${
                                    memberProgress.filter((m: any) => m.submitted).length === memberProgress.length
                                      ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {memberProgress.filter((m: any) => m.submitted).length}/{memberProgress.length} soumis
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {memberProgress.map((m: any) => (
                                    <div key={m.memberId} className={`flex items-center justify-between p-2 rounded-lg border ${
                                      m.submitted ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        {m.submitted
                                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          : <User className="w-4 h-4 text-gray-400" />}
                                        <span className="text-sm font-medium">{m.expertName}</span>
                                        <Badge variant="outline" className="text-xs">{m.role}</Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {m.submitted
                                          ? new Date(m.submittedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                          : "En attente"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Barre de progression visuelle */}
                                <div className="mt-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full transition-all"
                                      style={{ width: `${(memberProgress.filter((m: any) => m.submitted).length / memberProgress.length) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 6: Results received */}
                      {reqStatus === "DOC_REVIEW_RESULTS_SUBMITTED" && (
                        <Card className="border-purple-200 bg-purple-50/50">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-4">
                              <Users className="w-8 h-8 text-purple-600 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold">Résultats reçus de l'équipe</h3>
                                <p className="text-sm text-muted-foreground mt-1">Transmettez-les au CD pour validation.</p>
                              </div>
                            </div>
                            {review?.teamResults && (
                              <div className="bg-white p-4 rounded-lg border">
                                <p className="text-sm font-medium mb-2">Résultats de l'équipe:</p>
                                <p className="text-sm whitespace-pre-wrap">{review.teamResults}</p>
                              </div>
                            )}
                            {review?.deficienciesIdentified && review?.deficienciesDetails && (
                              <Alert className="border-amber-300 bg-amber-50">
                                <AlertDescription><strong>Manquements identifiés:</strong><p className="mt-1 whitespace-pre-wrap">{review.deficienciesDetails}</p></AlertDescription>
                              </Alert>
                            )}
                            <div className="text-center pt-2">
                              <Button onClick={sendToCD} disabled={actionLoading} size="lg">
                                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                Envoyer les Résultats au CD
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 7+: Waiting */}
                      {["DOC_REVIEW_RESULTS_SENT_TO_CD", "DOC_REVIEW_RESULTS_SENT_TO_OEC", "AWAITING_OEC_DOC_RESPONSE", "DOC_REVIEW_CD_DECISION"].includes(reqStatus) && (
                        <Card className="border-slate-200 bg-slate-50/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Clock className="w-8 h-8 text-slate-600 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold">Processus en cours</h3>
                                <p className="text-sm text-muted-foreground mt-1">{statusInfo.label}</p>
                                {review?.cdSynthesis && (
                                  <div className="mt-3 bg-white p-3 rounded border">
                                    <p className="text-xs font-medium text-muted-foreground">Synthèse du CD:</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{review.cdSynthesis}</p>
                                  </div>
                                )}
                                {review?.oecResponse && (
                                  <div className="mt-3 bg-white p-3 rounded border">
                                    <p className="text-xs font-medium text-muted-foreground">Réponse de l'OEC:</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{review.oecResponse}</p>
                                    {review.oecDecision && <Badge className="mt-2" variant="outline">Décision: {review.oecDecision === "CONTINUE" ? "Poursuivre" : "Corriger"}</Badge>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Completed */}
                      {reqStatus === "DOCUMENTARY_REVIEW_COMPLETED" && (
                        <Card className="border-green-200 bg-green-50/50">
                          <CardContent className="pt-6 text-center space-y-3">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800">Revue documentaire terminée</h3>
                            <p className="text-sm text-muted-foreground">
                              {review?.deficienciesIdentified
                                ? "Le CD a décidé de poursuivre le processus malgré les manquements identifiés. Passez à la préparation de l'évaluation."
                                : "Aucun manquement n'a été identifié. Vous pouvez directement passer à la préparation de l'évaluation."
                              }
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Review details */}
                      {review && (
                        <Card>
                          <CardHeader><CardTitle className="text-sm">Détails de la revue</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableBody>
                                <TableRow><TableCell className="font-medium text-muted-foreground">Date de lancement</TableCell><TableCell>{review.reviewStartDate ? new Date(review.reviewStartDate).toLocaleDateString("fr-FR") : "-"}</TableCell></TableRow>
                                {review.documentationSentToTeam && <TableRow><TableCell className="font-medium text-muted-foreground">Documents transmis</TableCell><TableCell>{new Date(review.documentationSentToTeam).toLocaleDateString("fr-FR")}</TableCell></TableRow>}
                                {review.teamResultsDeadline && <TableRow><TableCell className="font-medium text-muted-foreground">Date limite résultats</TableCell><TableCell>{new Date(review.teamResultsDeadline).toLocaleDateString("fr-FR")}</TableCell></TableRow>}
                                {review.reviewCompletionDate && <TableRow><TableCell className="font-medium text-muted-foreground">Résultats reçus</TableCell><TableCell>{new Date(review.reviewCompletionDate).toLocaleDateString("fr-FR")}</TableCell></TableRow>}
                                {review.resultsSentToOEC && <TableRow><TableCell className="font-medium text-muted-foreground">Envoyé à l'OEC</TableCell><TableCell>{new Date(review.resultsSentToOEC).toLocaleDateString("fr-FR")}</TableCell></TableRow>}
                                {review.oecResponseDeadline && <TableRow><TableCell className="font-medium text-muted-foreground">Date limite OEC</TableCell><TableCell>{new Date(review.oecResponseDeadline).toLocaleDateString("fr-FR")}</TableCell></TableRow>}
                                <TableRow><TableCell className="font-medium text-muted-foreground">Statut</TableCell><TableCell><Badge className={statusInfo.color}>{statusInfo.label}</Badge></TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
