import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, CheckCircle, XCircle, Eye, Send, Globe, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function RAFeasibilityPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Study form
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [step, setStep] = useState<"documents" | "resources" | "decision">("documents");
  const [technicalAnalysis, setTechnicalAnalysis] = useState("");
  const [complianceCheck, setComplianceCheck] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentAutoVerified, setPaymentAutoVerified] = useState(false);
  const [paymentValidationDate, setPaymentValidationDate] = useState<string | null>(null);
  const [resourcesAvailable, setResourcesAvailable] = useState("");
  const [decision, setDecision] = useState("");
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadRequests();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await res.json();
      setRequests(data.filter((r: any) => ["ASSIGNED_TO_RA","RECEIVABILITY_STUDY","RESOURCE_CHECK","RECEIVABILITY_PENDING_CD_REVIEW"].includes(r.status)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    setStep("documents");
    setTechnicalAnalysis(""); setComplianceCheck(""); setPaymentVerified(false);
    setPaymentAutoVerified(false); setPaymentValidationDate(null);
    setResourcesAvailable(""); setDecision(""); setComments(""); setRejectionReason("");
    
    // Check if DAG has already validated the payment for this request
    try {
      const res = await apiRequest("GET", `/api/payments/request/${r.id}`);
      const payments = await res.json();
      const validatedPayment = Array.isArray(payments) 
        ? payments.find((p: any) => p.status === "DAG_VALIDATED" || p.status === "COMPLETED")
        : (payments.status === "DAG_VALIDATED" || payments.status === "COMPLETED") ? payments : null;
      if (validatedPayment) {
        setPaymentVerified(true);
        setPaymentAutoVerified(true);
        setPaymentValidationDate(validatedPayment.dagValidatedDate || validatedPayment.paymentDate || null);
      }
    } catch (err) {
      // If API fails, leave as manual verification
      console.log("Could not fetch payment status for request", r.id);
    }
  };

  const startStudy = async () => {
    if (!selectedRequest) return;
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/start-study`);
      toast({ title: "Étude démarrée" });
      loadRequests();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleSubmitDecision = async () => {
    if (!decision) return;
    if (decision === "NOT_RECEIVABLE" && !rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Indiquez la raison du rejet" }); return;
    }
    try {
      setSubmitting(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/receivability-decision`, {
        isReceivable: decision === "RECEIVABLE",
        comments: `${technicalAnalysis}\n\nConformité: ${complianceCheck}\n\nCommentaires: ${comments}${rejectionReason ? "\n\nRaison du rejet: " + rejectionReason : ""}`,
      });
      toast({ 
        title: "Étude envoyée au CD", 
        description: "Votre étude de recevabilité a été soumise au Chef de Département pour validation." 
      });
      loadRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Étude de Recevabilité</h1>
              <p className="text-muted-foreground mt-2">Analysez les dossiers selon les critères de recevabilité (Étape 2)</p>
            </div>

            <Alert><AlertDescription><strong>Délai :</strong> L'étude de recevabilité doit être complétée dans un délai de <strong>6 mois</strong> à compter de la réception du dossier.</AlertDescription></Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers à étudier</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente</p>
                  ) : requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <div className="flex justify-between items-start">
                        <div><p className="font-medium text-sm">{r.referenceNumber || `#${r.id}`}</p><p className="text-xs text-muted-foreground">{r.oec?.organizationName}</p><p className="text-xs text-muted-foreground">{r.domain}</p></div>
                        <Badge variant={r.status === "RECEIVABILITY_STUDY" ? "default" : r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "outline" : "secondary"} className={`text-xs ${r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "border-blue-300 text-blue-700" : ""}`}>
                          {r.status === "RECEIVABILITY_STUDY" ? "En cours" : r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "Chez le CD" : "Nouveau"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Study form */}
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Étude de Recevabilité</CardTitle><CardDescription>{selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Sélectionnez un dossier"}</CardDescription></CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier</p>
                  ) : selectedRequest.status === "ASSIGNED_TO_RA" ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Démarrez l'étude de recevabilité pour ce dossier</p>
                      <Button onClick={startStudy}><FileText className="mr-2 h-4 w-4" />Démarrer l'étude</Button>
                    </div>
                  ) : selectedRequest.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? (
                    <div className="text-center py-8 space-y-4">
                      <CheckCircle className="h-12 w-12 mx-auto text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg">En attente de validation du CD</h3>
                        <p className="text-muted-foreground mt-2">Votre étude de recevabilité a été envoyée au Chef de Département pour vérification.</p>
                        <p className="text-muted-foreground">Vous serez notifié dès qu'il aura validé ou demandé des modifications.</p>
                      </div>
                    </div>
                  ) : (
                    <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="space-y-4">
                      {selectedRequest.currentStep?.includes("Modifications demandées") && (
                        <Alert className="border-amber-300 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            <strong>Le CD a demandé des modifications.</strong> Veuillez revoir votre étude et resoumettre.
                            {selectedRequest.receivabilityComments?.includes("[Remarques CD]") && (
                              <div className="mt-2 text-sm">
                                {selectedRequest.receivabilityComments.split("[Remarques CD]").pop()}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="documents">1. Documents & Paiement</TabsTrigger>
                        <TabsTrigger value="resources">2. Ressources</TabsTrigger>
                        <TabsTrigger value="decision">3. Décision</TabsTrigger>
                      </TabsList>

                      <TabsContent value="documents" className="space-y-4">
                        <div className="space-y-2"><Label>Analyse technique des documents *</Label><Textarea value={technicalAnalysis} onChange={(e) => setTechnicalAnalysis(e.target.value)} placeholder="Vérifiez la complétude et la conformité des documents soumis..." rows={5} /></div>
                        <div className="space-y-2"><Label>Vérification de conformité *</Label><Textarea value={complianceCheck} onChange={(e) => setComplianceCheck(e.target.value)} placeholder="Vérifiez la conformité aux normes applicables..." rows={5} /></div>
                        <div className={`flex items-center gap-3 p-4 border rounded-lg ${paymentAutoVerified ? "border-green-300 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                          <input type="checkbox" id="payment-check" checked={paymentVerified} disabled className="h-5 w-5" />
                          <label htmlFor="payment-check">
                            {paymentAutoVerified ? (
                              <><p className="font-medium text-green-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Paiement validé par le DAG</p><p className="text-sm text-green-600">{paymentValidationDate ? `Validé le ${new Date(paymentValidationDate).toLocaleDateString("fr-FR")}` : "Les frais d'enregistrement ont été vérifiés et validés par le DAG"}</p></>
                            ) : (
                              <><p className="font-medium text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />En attente de validation du paiement par le DAG</p><p className="text-sm text-amber-600">Ce champ sera automatiquement rempli lorsque le DAG aura confirmé la validité du paiement</p></>
                            )}
                          </label>
                        </div>
                        <Button onClick={() => setStep("resources")} disabled={!technicalAnalysis || !complianceCheck}>Suivant : Ressources</Button>
                      </TabsContent>

                      <TabsContent value="resources" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Disponibilité des ressources d'évaluation *</Label>
                          <RadioGroup value={resourcesAvailable} onValueChange={setResourcesAvailable}>
                            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"><RadioGroupItem value="yes" id="ra-y" /><Label htmlFor="ra-y" className="cursor-pointer flex-1"><p className="font-medium">Ressources disponibles</p><p className="text-sm text-muted-foreground">Évaluateurs compétents disponibles en interne</p></Label></div>
                            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"><RadioGroupItem value="foreign" id="ra-f" /><Label htmlFor="ra-f" className="cursor-pointer flex-1"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><div><p className="font-medium">Experts étrangers nécessaires</p><p className="text-sm text-muted-foreground">L'OEC sera consulté pour les frais supplémentaires</p></div></div></Label></div>
                          </RadioGroup>
                        </div>
                        {resourcesAvailable === "foreign" && <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>L'OEC sera contacté pour accepter les frais supplémentaires. S'il refuse, le dossier sera classé.</AlertDescription></Alert>}
                        <Button onClick={() => setStep("decision")} disabled={!resourcesAvailable}>Suivant : Décision</Button>
                      </TabsContent>

                      <TabsContent value="decision" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Décision de recevabilité *</Label>
                          <RadioGroup value={decision} onValueChange={setDecision}>
                            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors cursor-pointer"><RadioGroupItem value="RECEIVABLE" id="dec-r" /><Label htmlFor="dec-r" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="font-medium">Recevable</p><p className="text-sm text-muted-foreground">Le dossier passera à la validation DG puis à la contractualisation</p></div></Label></div>
                            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-colors cursor-pointer"><RadioGroupItem value="NOT_RECEIVABLE" id="dec-nr" /><Label htmlFor="dec-nr" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-500" /><div><p className="font-medium">Non recevable</p><p className="text-sm text-muted-foreground">L'OEC devra corriger et soumettre à nouveau</p></div></Label></div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2"><Label>Commentaires</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Observations générales..." rows={3} /></div>
                        {decision === "NOT_RECEIVABLE" && <div className="space-y-2"><Label>Raison du rejet *</Label><Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Détaillez les raisons..." rows={4} /></div>}
                        <Button onClick={handleSubmitDecision} disabled={submitting || !decision}>
                          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : <><Send className="mr-2 h-4 w-4" />Soumettre la décision</>}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
