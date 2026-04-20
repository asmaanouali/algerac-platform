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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileSearch, Send, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const CD_REVIEW_STATUSES = [
  "DOC_REVIEW_RESULTS_SENT_TO_CD",
  "DOC_REVIEW_RESULTS_SENT_TO_OEC",
  "AWAITING_OEC_DOC_RESPONSE",
  "DOC_REVIEW_CD_DECISION",
  "DOCUMENTARY_REVIEW_COMPLETED",
];

export default function DocumentaryDecisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Send to OEC form
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMode, setSendMode] = useState<"as_is" | "synthesis">("as_is");
  const [synthesis, setSynthesis] = useState("");

  // Validate no deficiency form
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [validateComments, setValidateComments] = useState("");

  // Decision form
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decision, setDecision] = useState<"CONTINUE" | "STOP">("CONTINUE");
  const [decisionComments, setDecisionComments] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      if (res.ok) {
        const all = await res.json();
        setRequests(all.filter((r: any) => CD_REVIEW_STATUSES.includes(r.status)));
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/documentary-review/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) setReviews(await res.json());
    } catch (e) { }
  };

  const validateNoDeficiency = async () => {
    const review = reviews[0];
    if (!review) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/cd-validate-no-deficiency`, {
        comments: validateComments || null,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Revue documentaire validée. Aucun manquement — le RA peut préparer l'évaluation." });
        setShowValidateDialog(false);
        setValidateComments("");
        await loadData();
        await selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const sendToOEC = async () => {
    const review = reviews[0];
    if (!review) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/cd-send-to-oec`, {
        sendAsIs: sendMode === "as_is",
        synthesis: sendMode === "synthesis" ? synthesis : null,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Résultats envoyés à l'OEC. Délai de réponse: 3 mois." });
        setShowSendDialog(false);
        setSynthesis("");
        await loadData();
        await selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const submitDecision = async () => {
    const review = reviews[0];
    if (!review) return;
    setActionLoading(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/cd-decision`, {
        decision,
        comments: decisionComments,
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: decision === "CONTINUE"
            ? "Processus poursuivi. Le RA peut préparer l'évaluation."
            : "Processus arrêté. Le dossier a été classé."
        });
        setShowDecisionDialog(false);
        setDecisionComments("");
        await loadData();
        await selectRequest(selectedRequest);
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  if (!user) return null;

  const review = reviews[0];
  const reqStatus = selectedRequest?.status;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Revue Documentaire — Décision CD</h1>
            <p className="text-muted-foreground mt-1">Validez les résultats, rédigez une synthèse et prenez la décision de poursuivre ou arrêter</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left panel */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers</CardTitle><CardDescription>{requests.length} dossier(s)</CardDescription></CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente de décision</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.oec?.organizationName || r.domain}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{r.status.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Right panel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><FileSearch className="w-5 h-5" />Revue Documentaire</CardTitle>
                  <CardDescription>{selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Sélectionnez un dossier"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : !review ? (
                    <p className="text-center text-muted-foreground py-8">Aucune revue documentaire trouvée</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Team results */}
                      {review.teamResults && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" />Résultats de l'équipe d'évaluation</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{review.teamResults}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Deficiencies */}
                      {review.deficienciesIdentified && review.deficienciesDetails && (
                        <Alert className="border-amber-300 bg-amber-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Manquements identifiés par l'équipe:</strong>
                            <p className="mt-1 whitespace-pre-wrap">{review.deficienciesDetails}</p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Action based on deficiencies */}
                      {reqStatus === "DOC_REVIEW_RESULTS_SENT_TO_CD" && !review.deficienciesIdentified && (
                        <Card className="border-green-200 bg-green-50/50">
                          <CardContent className="pt-6 text-center space-y-4">
                            <CheckCircle className="w-10 h-10 mx-auto text-green-600" />
                            <div>
                              <h3 className="font-semibold text-green-800">Aucun manquement identifié</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                L'équipe d'évaluation n'a relevé aucun manquement documentaire.
                                Vous pouvez valider la revue et passer directement à la préparation de l'évaluation.
                              </p>
                            </div>
                            <Button onClick={() => setShowValidateDialog(true)} size="lg" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />Valider — Passer à l'évaluation
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {reqStatus === "DOC_REVIEW_RESULTS_SENT_TO_CD" && review.deficienciesIdentified && (
                        <Card className="border-blue-200 bg-blue-50/50">
                          <CardContent className="pt-6 text-center space-y-4">
                            <Send className="w-10 h-10 mx-auto text-blue-600" />
                            <div>
                              <h3 className="font-semibold">Manquements identifiés — Transmettre à l'OEC</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Des manquements ont été relevés. Transmettez les résultats à l'OEC qui pourra
                                poursuivre l'évaluation ou corriger les manquements dans un délai de 3 mois.
                              </p>
                            </div>
                            <Button onClick={() => setShowSendDialog(true)} size="lg">
                              <Send className="w-4 h-4 mr-2" />Envoyer à l'OEC
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Waiting for OEC response */}
                      {(reqStatus === "DOC_REVIEW_RESULTS_SENT_TO_OEC" || reqStatus === "AWAITING_OEC_DOC_RESPONSE") && (
                        <Card className="border-orange-200 bg-orange-50/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold">En attente de réponse de l'OEC</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Les résultats ont été envoyés à l'OEC. Délai de réponse: 3 mois maximum.
                                </p>
                                {review.oecResponseDeadline && (
                                  <p className="text-sm mt-2 font-medium">
                                    Date limite: {new Date(review.oecResponseDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                  </p>
                                )}
                                {review.cdSynthesis && (
                                  <div className="mt-3 bg-white p-3 rounded border">
                                    <p className="text-xs font-medium text-muted-foreground">Votre synthèse:</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{review.cdSynthesis}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Decision needed */}
                      {reqStatus === "DOC_REVIEW_CD_DECISION" && (
                        <Card className="border-purple-200 bg-purple-50/50">
                          <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-lg text-center">Réponse de l'OEC reçue — Votre décision</h3>

                            {review.oecResponse && (
                              <div className="bg-white p-4 rounded-lg border">
                                <p className="text-sm font-medium mb-2">Réponse de l'OEC:</p>
                                <p className="text-sm whitespace-pre-wrap">{review.oecResponse}</p>
                                {review.oecDecision && (
                                  <Badge className="mt-2" variant="outline">
                                    Décision OEC: {review.oecDecision === "CONTINUE" ? "Poursuivre l'évaluation" : "Corriger les manquements"}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex justify-center gap-4 pt-2">
                              <Button
                                onClick={() => { setDecision("CONTINUE"); setShowDecisionDialog(true); }}
                                className="bg-green-600 hover:bg-green-700"
                                size="lg"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />Poursuivre le processus
                              </Button>
                              <Button
                                onClick={() => { setDecision("STOP"); setShowDecisionDialog(true); }}
                                variant="destructive"
                                size="lg"
                              >
                                <XCircle className="w-4 h-4 mr-2" />Arrêter le processus
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Completed */}
                      {reqStatus === "DOCUMENTARY_REVIEW_COMPLETED" && (
                        <Card className="border-green-200 bg-green-50/50">
                          <CardContent className="pt-6 text-center space-y-3">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800">Revue documentaire terminée — Processus poursuivi</h3>
                            <p className="text-sm text-muted-foreground">
                              {review?.deficienciesIdentified
                                ? "Des manquements avaient été identifiés. Le processus continue après réponse de l'OEC."
                                : "Aucun manquement identifié — Le RA peut passer à la préparation de l'évaluation."
                              }
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Validate No Deficiency Dialog */}
          <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Valider la revue documentaire</DialogTitle>
                <DialogDescription>
                  Aucun manquement n'a été identifié. La revue sera clôturée et le RA pourra passer à la préparation de l'évaluation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Commentaires (optionnel)</Label>
                <Textarea
                  value={validateComments}
                  onChange={(e) => setValidateComments(e.target.value)}
                  placeholder="Ajoutez des commentaires sur la validation..."
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidateDialog(false)}>Annuler</Button>
                <Button onClick={validateNoDeficiency} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirmer la validation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send to OEC Dialog */}
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Envoyer les résultats à l'OEC</DialogTitle>
                <DialogDescription>Choisissez de rédiger votre propre synthèse ou d'envoyer les résultats de l'équipe tels quels.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <RadioGroup value={sendMode} onValueChange={(v) => setSendMode(v as "as_is" | "synthesis")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="as_is" id="as_is" />
                    <Label htmlFor="as_is">Envoyer les résultats de l'équipe tels quels</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="synthesis" id="synthesis" />
                    <Label htmlFor="synthesis">Rédiger ma propre synthèse</Label>
                  </div>
                </RadioGroup>
                {sendMode === "synthesis" && (
                  <div className="space-y-2">
                    <Label>Synthèse du CD</Label>
                    <Textarea
                      value={synthesis}
                      onChange={(e) => setSynthesis(e.target.value)}
                      placeholder="Rédigez votre synthèse des résultats de la revue documentaire..."
                      rows={8}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Annuler</Button>
                <Button onClick={sendToOEC} disabled={actionLoading || (sendMode === "synthesis" && !synthesis.trim())}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Decision Dialog */}
          <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {decision === "CONTINUE" ? "Poursuivre le processus d'accréditation" : "Arrêter le processus d'accréditation"}
                </DialogTitle>
                <DialogDescription>
                  {decision === "CONTINUE"
                    ? "Le processus passera à la phase de préparation de l'évaluation."
                    : "Le dossier sera définitivement classé. Cette action est irréversible."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Commentaires (optionnel)</Label>
                <Textarea
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder="Ajoutez des commentaires justifiant votre décision..."
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>Annuler</Button>
                <Button
                  onClick={submitDecision}
                  disabled={actionLoading}
                  className={decision === "CONTINUE" ? "bg-green-600 hover:bg-green-700" : ""}
                  variant={decision === "STOP" ? "destructive" : "default"}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {decision === "CONTINUE" ? "Confirmer — Poursuivre" : "Confirmer — Arrêter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
