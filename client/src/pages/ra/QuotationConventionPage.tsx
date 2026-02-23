import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, FileText, CheckCircle, ArrowRight, AlertTriangle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function QuotationAndConventionPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Team composition state (demande d'etablissement du devis)
  const [reeCount] = useState(1);
  const [etCount, setEtCount] = useState(1);
  const [eqCount, setEqCount] = useState(0);
  const [obsCount, setObsCount] = useState(0);
  const [supCount, setSupCount] = useState(0);
  const [expCount, setExpCount] = useState(0);
  const [evaluationDuration, setEvaluationDuration] = useState("");
  const [quotationDetails, setQuotationDetails] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const [quotationCreated, setQuotationCreated] = useState(false);
  const [quotationId, setQuotationId] = useState<number | null>(null);
  const [quotationApproved, setQuotationApproved] = useState(false);
  const [quotationData, setQuotationData] = useState<any>(null);
  
  // Convention state
  const [conventionContent, setConventionContent] = useState("");
  const [conventionTerms, setConventionTerms] = useState("");
  const [creatingConvention, setCreatingConvention] = useState(false);
  const [conventionCreated, setConventionCreated] = useState(false);
  const [conventionId, setConventionId] = useState<number | null>(null);
  
  const [sendingToDAG, setSendingToDAG] = useState(false);
  const [sendingToOEC, setSendingToOEC] = useState(false);

  useEffect(() => {
    if (user && !authLoading) { loadRequest(); checkExistingDocuments(); }
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        if (["QUOTATION_APPROVED_BY_DAG", "QUOTATION_SENT_TO_OEC", "QUOTATION_VALIDATED"].includes(data.status)) {
          setQuotationApproved(true);
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const checkExistingDocuments = async () => {
    try {
      const [quotRes, convRes] = await Promise.all([
        fetch(`/api/quotations/by-request/${requestId}`, { credentials: "include" }),
        fetch(`/api/conventions/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (quotRes.ok) { 
        const q = await quotRes.json(); 
        if (q.length > 0) { 
          setQuotationCreated(true); 
          setQuotationId(q[0].id);
          setQuotationData(q[0]);
        } 
      }
      if (convRes.ok) { const c = await convRes.json(); if (c.length > 0) { setConventionCreated(true); setConventionId(c[0].id); } }
    } catch (err) { console.error(err); }
  };

  const totalTeamMembers = reeCount + etCount + eqCount + obsCount + supCount + expCount;

  const handleCreateQuotation = async () => {
    if (!evaluationDuration || parseFloat(evaluationDuration) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "La duree de l'evaluation est obligatoire" });
      return;
    }
    if (etCount < 1) {
      toast({ variant: "destructive", title: "Erreur", description: "Il faut au minimum 1 evaluateur technique" });
      return;
    }
    try {
      setCreatingQuotation(true);
      const res = await apiRequest("POST", "/api/quotations/create", {
        requestId: parseInt(requestId!),
        reeCount,
        etCount,
        eqCount,
        obsCount,
        supCount,
        expCount,
        evaluationDurationDays: parseFloat(evaluationDuration),
        details: quotationDetails,
      });
      const result = await res.json();
      setQuotationId(result.data?.id || result.id);
      setQuotationData(result.data || result);
      setQuotationCreated(true);
      toast({ title: "Demande creee", description: "La demande d'etablissement du devis a ete creee avec succes" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingQuotation(false); }
  };

  const handleCreateConvention = async () => {
    try {
      setCreatingConvention(true);
      const res = await apiRequest("POST", "/api/conventions/create", {
        requestId: parseInt(requestId!),
        content: conventionContent,
        termsAndConditions: conventionTerms,
      });
      const result = await res.json();
      setConventionId(result.data?.id || result.id);
      setConventionCreated(true);
      toast({ title: "Convention creee", description: "La convention a ete creee avec succes" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingConvention(false); }
  };

  const handleSendToDAG = async () => {
    if (!quotationId) return;
    try {
      setSendingToDAG(true);
      await apiRequest("POST", `/api/quotations/${quotationId}/send-to-dag`);
      toast({ title: "Envoye au DAG", description: "La demande d'etablissement du devis a ete envoyee au DAG" });
      loadRequest();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToDAG(false); }
  };

  const handleSendToOEC = async () => {
    try {
      setSendingToOEC(true);
      await apiRequest("POST", `/api/requests/${requestId}/send-quotation-convention-to-oec`, {});
      toast({ title: "Envoye a l'OEC", description: "Le devis et la convention ont ete envoyes a l'OEC. Delai de reponse : 10 jours." });
      setTimeout(() => setLocation("/ra/dashboard"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToOEC(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!request) return <div className="container max-w-2xl mx-auto py-8"><Alert variant="destructive"><AlertDescription>Demande non trouvee</AlertDescription></Alert></div>;

  const step = !quotationCreated ? 1 : !conventionCreated ? 2 : !quotationApproved ? 3 : 4;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{"\u00C9"}tape 3 {"\u2014"} Contractualisation</h1>
              <p className="text-muted-foreground mt-2">Demande d'{"\u00E9"}tablissement du devis et convention pour {request.referenceNumber}</p>
            </div>

            <Alert><AlertDescription><strong>OEC :</strong> {request.oec?.organizationName}<br /><strong>Domaine :</strong> {request.domain}<br /><strong>Type :</strong> {request.type}</AlertDescription></Alert>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { num: 1, label: "Composition \u00E9quipe & dur\u00E9e" },
                { num: 2, label: "Cr\u00E9er convention" },
                { num: 3, label: "DAG fixe le montant" },
                { num: 4, label: "Envoyer \u00E0 l'OEC" },
              ].map(({ num, label }) => (
                <div key={num} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${num < step ? "bg-green-500 text-white" : num === step ? "bg-primary text-white" : "bg-gray-200 text-gray-600"}`}>
                    {num < step ? <CheckCircle className="w-5 h-5" /> : num}
                  </div>
                  <span className={`text-sm whitespace-nowrap ${num === step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
                  {num < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              ))}
            </div>

            <Tabs defaultValue="quotation" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quotation" className="flex items-center gap-2">{quotationCreated && <CheckCircle className="h-4 w-4 text-green-500" />}Demande de Devis</TabsTrigger>
                <TabsTrigger value="convention" className="flex items-center gap-2">{conventionCreated && <CheckCircle className="h-4 w-4 text-green-500" />}Convention</TabsTrigger>
              </TabsList>

              <TabsContent value="quotation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Demande d'{"\u00C9"}tablissement du Devis</CardTitle>
                    <CardDescription>Proposez la composition de l'{"\u00E9"}quipe et la dur{"\u00E9"}e de l'{"\u00E9"}valuation. Le DAG fixera le montant du devis.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {quotationCreated ? (
                      <div className="space-y-4">
                        <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Demande d'{"\u00E9"}tablissement du devis cr{"\u00E9"}{"\u00E9"}e avec succ{"\u00E8"}s</AlertDescription></Alert>
                        {quotationData && (
                          <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium">Composition propos{"\u00E9"}e</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div className="p-2 bg-blue-50 rounded"><span className="text-muted-foreground">REE :</span> <strong>{quotationData.reeCount || 1}</strong></div>
                              <div className="p-2 bg-blue-50 rounded"><span className="text-muted-foreground">{"\u00C9"}vl. Technique :</span> <strong>{quotationData.etCount || 1}</strong></div>
                              {(quotationData.eqCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">{"\u00C9"}vl. Qualit{"\u00E9"} :</span> <strong>{quotationData.eqCount}</strong></div>}
                              {(quotationData.obsCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Observateur :</span> <strong>{quotationData.obsCount}</strong></div>}
                              {(quotationData.supCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Superviseur :</span> <strong>{quotationData.supCount}</strong></div>}
                              {(quotationData.expCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Expert :</span> <strong>{quotationData.expCount}</strong></div>}
                            </div>
                            <div className="p-2 bg-primary/5 rounded">
                              <span className="text-muted-foreground">Dur{"\u00E9"}e d'{"\u00E9"}valuation :</span> <strong>{quotationData.evaluationDurationDays} H/j</strong>
                            </div>
                            {quotationData.amount > 0 && (
                              <div className="p-3 bg-green-50 rounded border border-green-200">
                                <span className="text-green-700 font-medium">Montant fix{"\u00E9"} par le DAG : {quotationData.amount?.toLocaleString()} DA</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Composition de l'{"\u00C9"}quipe</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>REE (fix{"\u00E9"})</Label>
                              <Input type="number" value={1} disabled className="bg-muted" />
                              <p className="text-xs text-muted-foreground">Responsable {"\u00C9"}quipe {"\u00C9"}valuation</p>
                            </div>
                            <div className="space-y-2">
                              <Label>{"\u00C9"}valuateur Technique *</Label>
                              <Input type="number" min={1} value={etCount} onChange={(e) => setEtCount(Math.max(1, parseInt(e.target.value) || 1))} />
                              <p className="text-xs text-muted-foreground">Minimum 1</p>
                            </div>
                            <div className="space-y-2">
                              <Label>{"\u00C9"}valuateur Qualit{"\u00E9"}</Label>
                              <Input type="number" min={0} value={eqCount} onChange={(e) => setEqCount(Math.max(0, parseInt(e.target.value) || 0))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Observateur</Label>
                              <Input type="number" min={0} value={obsCount} onChange={(e) => setObsCount(Math.max(0, parseInt(e.target.value) || 0))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Superviseur</Label>
                              <Input type="number" min={0} value={supCount} onChange={(e) => setSupCount(Math.max(0, parseInt(e.target.value) || 0))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Expert</Label>
                              <Input type="number" min={0} value={expCount} onChange={(e) => setExpCount(Math.max(0, parseInt(e.target.value) || 0))} />
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800">
                              Total membres de l'{"\u00E9"}quipe : <strong>{totalTeamMembers}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Dur{"\u00E9"}e de l'{"\u00E9"}valuation (H/j) *</Label>
                          <Input type="number" placeholder="Ex: 3" value={evaluationDuration} onChange={(e) => setEvaluationDuration(e.target.value)} min="0.5" step="0.5" />
                          <p className="text-xs text-muted-foreground">Dur{"\u00E9"}e estim{"\u00E9"}e en homme-jours</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes et d{"\u00E9"}tails (optionnel)</Label>
                          <Textarea placeholder="Pr\u00E9cisions sur la composition, justifications..." value={quotationDetails} onChange={(e) => setQuotationDetails(e.target.value)} rows={4} />
                        </div>

                        <Button className="w-full" onClick={handleCreateQuotation} disabled={creatingQuotation}>
                          {creatingQuotation ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cr{"\u00E9"}ation...</> : <><FileText className="mr-2 h-4 w-4" />Cr{"\u00E9"}er la demande d'{"\u00E9"}tablissement du devis</>}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convention">
                <Card>
                  <CardHeader><CardTitle>Convention</CardTitle><CardDescription>{"\u00C9"}tablissez la convention d'accr{"\u00E9"}ditation</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {conventionCreated ? (
                      <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Convention cr{"\u00E9"}{"\u00E9"}e avec succ{"\u00E8"}s</AlertDescription></Alert>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Contenu de la convention</Label>
                          <Textarea placeholder="Contenu principal..." value={conventionContent} onChange={(e) => setConventionContent(e.target.value)} rows={10} />
                        </div>
                        <div className="space-y-2">
                          <Label>Termes et conditions</Label>
                          <Textarea placeholder="Termes et conditions..." value={conventionTerms} onChange={(e) => setConventionTerms(e.target.value)} rows={6} />
                        </div>
                        <Button className="w-full" onClick={handleCreateConvention} disabled={creatingConvention}>
                          {creatingConvention ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cr{"\u00E9"}ation...</> : <><FileText className="mr-2 h-4 w-4" />Cr{"\u00E9"}er la convention</>}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {quotationCreated && conventionCreated && !quotationApproved && !["QUOTATION_APPROVED_BY_DAG","QUOTATION_SENT_TO_OEC","QUOTATION_VALIDATED"].includes(request?.status) && (
              <Card className="border-primary">
                <CardHeader><CardTitle>Envoi au DAG</CardTitle><CardDescription>La demande d'{"\u00E9"}tablissement du devis sera envoy{"\u00E9"}e au DAG qui d{"\u00E9"}finira le montant</CardDescription></CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg" onClick={handleSendToDAG} disabled={sendingToDAG}>
                    {sendingToDAG ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer au DAG</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {quotationApproved && request?.status === "QUOTATION_APPROVED_BY_DAG" && (
              <Card className="border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />Le DAG a {"\u00E9"}tabli le devis</CardTitle>
                  <CardDescription>Le DAG a d{"\u00E9"}fini le montant du devis. Envoyez le devis et la convention {"\u00E0"} l'OEC pour acceptation.</CardDescription>
                </CardHeader>
                <CardContent>
                  {quotationData?.amount > 0 && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-lg font-bold text-green-800">Montant du devis : {quotationData.amount?.toLocaleString()} DA</p>
                      {quotationData.dagComments && <p className="text-sm text-green-700 mt-1">Commentaires DAG : {quotationData.dagComments}</p>}
                    </div>
                  )}
                  <Alert className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>D{"\u00E9"}lai OEC :</strong> 10 jours pour accepter. Rappel automatique au bout de 5 jours.</AlertDescription></Alert>
                  <Button className="w-full" size="lg" onClick={handleSendToOEC} disabled={sendingToOEC}>
                    {sendingToOEC ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer {"\u00E0"} l'OEC</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {request?.status === "QUOTATION_SENT_TO_OEC" && (
              <Alert><AlertDescription>Le devis et la convention ont {"\u00E9"}t{"\u00E9"} envoy{"\u00E9"}s {"\u00E0"} l'OEC. En attente de validation...</AlertDescription></Alert>
            )}
            {request?.status === "QUOTATION_VALIDATED" && (
              <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>L'OEC a valid{"\u00E9"} le devis et sign{"\u00E9"} la convention. Passez {"\u00E0"} l'{"\u00E9"}tape 4 (constitution de l'{"\u00E9"}quipe).</AlertDescription></Alert>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
