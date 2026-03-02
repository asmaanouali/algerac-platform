import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryResponsePage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");
  const [decision, setDecision] = useState<"CONTINUE" | "CORRECT">("CONTINUE");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, revRes] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/documentary-review/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!response.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Rédigez votre réponse" }); return; }
    const review = reviews[0];
    if (!review) return;
    
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/documentary-review/${review.id}/oec-respond`, {
        response,
        decision,
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Réponse envoyée",
          description: decision === "CONTINUE"
            ? "Vous avez choisi de poursuivre l'évaluation. Le CD prendra sa décision."
            : "Vous avez choisi de corriger les manquements. Le CD prendra sa décision."
        });
        setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
      } else {
        toast({ variant: "destructive", title: "Erreur", description: data.message });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const review = reviews[0];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Résultats de la Revue Documentaire</h1>
              <p className="text-muted-foreground mt-2">Prenez connaissance des résultats et décidez de la suite</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>3 mois</strong> à compter de la notification pour répondre. 
                Passé ce délai, le CD décidera de poursuivre ou d'arrêter le processus.
                {review?.oecResponseDeadline && (
                  <span className="block mt-1">
                    <strong>Date limite :</strong> {new Date(review.oecResponseDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Results from CD/team */}
            {review && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Résultats de l'analyse</CardTitle>
                  <CardDescription>
                    {review.cdSentAsIs
                      ? "Résultats tels que soumis par l'équipe d'évaluation"
                      : "Synthèse rédigée par le Chef de Département"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {review.cdSynthesis ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Synthèse du CD:</p>
                      <p className="whitespace-pre-wrap">{review.cdSynthesis}</p>
                    </div>
                  ) : review.teamResults ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Résultats de l'équipe:</p>
                      <p className="whitespace-pre-wrap">{review.teamResults}</p>
                    </div>
                  ) : null}

                  {review.deficienciesIdentified && review.deficienciesDetails && (
                    <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Manquements identifiés:
                      </p>
                      <p className="whitespace-pre-wrap text-amber-900">{review.deficienciesDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Response form */}
            {(request?.status === "DOC_REVIEW_RESULTS_SENT_TO_OEC") && (
              <Card>
                <CardHeader>
                  <CardTitle><Send className="inline h-5 w-5 mr-2" />Votre Réponse</CardTitle>
                  <CardDescription>
                    Répondez aux manquements identifiés et indiquez votre décision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Votre décision</Label>
                    <RadioGroup value={decision} onValueChange={(v) => setDecision(v as "CONTINUE" | "CORRECT")}>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-green-50 transition-colors">
                        <RadioGroupItem value="CONTINUE" id="continue" className="mt-1" />
                        <div>
                          <Label htmlFor="continue" className="font-medium cursor-pointer">
                            <CheckCircle className="inline w-4 h-4 mr-1 text-green-600" />
                            Poursuivre et réaliser l'évaluation
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vous acceptez les observations et souhaitez passer directement à l'évaluation sur site.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-amber-50 transition-colors">
                        <RadioGroupItem value="CORRECT" id="correct" className="mt-1" />
                        <div>
                          <Label htmlFor="correct" className="font-medium cursor-pointer">
                            <AlertTriangle className="inline w-4 h-4 mr-1 text-amber-600" />
                            Corriger les manquements
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vous souhaitez corriger les manquements identifiés dans un délai n'excédant pas 3 mois.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Réponse détaillée *</Label>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder={decision === "CONTINUE"
                        ? "Expliquez pourquoi vous souhaitez poursuivre malgré les observations..."
                        : "Détaillez les corrections que vous comptez apporter et le planning envisagé..."}
                      rows={8}
                    />
                  </div>

                  <Button onClick={handleSubmit} disabled={submitting || !response.trim()} className="w-full" size="lg">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer la réponse</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Already responded */}
            {request?.status === "DOC_REVIEW_CD_DECISION" && review?.oecResponse && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 mx-auto text-blue-600" />
                  <h3 className="font-semibold">Réponse envoyée</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre réponse a été transmise au CD qui prendra la décision de poursuivre ou d'arrêter le processus.
                  </p>
                  <Badge variant="outline">
                    Votre choix: {review.oecDecision === "CONTINUE" ? "Poursuivre" : "Corriger"}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
