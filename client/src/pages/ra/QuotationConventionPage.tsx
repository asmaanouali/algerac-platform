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
import { Loader2, Send, FileText, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
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
  
  // Quotation state
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationDetails, setQuotationDetails] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const [quotationCreated, setQuotationCreated] = useState(false);
  const [quotationId, setQuotationId] = useState<number | null>(null);
  const [quotationApproved, setQuotationApproved] = useState(false);
  
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
        // Check if DAG already approved
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
      if (quotRes.ok) { const q = await quotRes.json(); if (q.length > 0) { setQuotationCreated(true); setQuotationId(q[0].id); } }
      if (convRes.ok) { const c = await convRes.json(); if (c.length > 0) { setConventionCreated(true); setConventionId(c[0].id); } }
    } catch (err) { console.error(err); }
  };

  const handleCreateQuotation = async () => {
    if (!quotationAmount || parseFloat(quotationAmount) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Montant invalide" });
      return;
    }
    try {
      setCreatingQuotation(true);
      const res = await apiRequest("POST", "/api/quotations/create", {
        requestId: parseInt(requestId!),
        amount: parseFloat(quotationAmount),
        details: quotationDetails,
      });
      const result = await res.json();
      setQuotationId(result.data?.id || result.id);
      setQuotationCreated(true);
      toast({ title: "Devis créé", description: "Le devis a été créé avec succès" });
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
      toast({ title: "Convention créée", description: "La convention a été créée avec succès" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingConvention(false); }
  };

  const handleSendToDAG = async () => {
    if (!quotationId) return;
    try {
      setSendingToDAG(true);
      await apiRequest("POST", `/api/quotations/${quotationId}/send-to-dag`);
      toast({ title: "Envoyé au DAG", description: "Le devis a été envoyé au DAG pour approbation" });
      loadRequest();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToDAG(false); }
  };

  const handleSendToOEC = async () => {
    try {
      setSendingToOEC(true);
      await apiRequest("POST", `/api/requests/${requestId}/send-quotation-convention-to-oec`, {});
      toast({ title: "Envoyé à l'OEC", description: "Le devis et la convention ont été envoyés à l'OEC. Délai de réponse : 10 jours." });
      setTimeout(() => setLocation("/ra/dashboard"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToOEC(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!request) return <div className="container max-w-2xl mx-auto py-8"><Alert variant="destructive"><AlertDescription>Demande non trouvée</AlertDescription></Alert></div>;

  // Step tracker
  const step = !quotationCreated ? 1 : !conventionCreated ? 2 : !quotationApproved ? 3 : 4;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Étape 3 — Contractualisation</h1>
              <p className="text-muted-foreground mt-2">Devis et convention pour {request.referenceNumber}</p>
            </div>

            <Alert><AlertDescription><strong>OEC :</strong> {request.oec?.organizationName}<br /><strong>Domaine :</strong> {request.domain}<br /><strong>Type :</strong> {request.type}</AlertDescription></Alert>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { num: 1, label: "Créer devis" },
                { num: 2, label: "Créer convention" },
                { num: 3, label: "Approbation DAG" },
                { num: 4, label: "Envoyer à l'OEC" },
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
                <TabsTrigger value="quotation" className="flex items-center gap-2">{quotationCreated && <CheckCircle className="h-4 w-4 text-green-500" />}Devis</TabsTrigger>
                <TabsTrigger value="convention" className="flex items-center gap-2">{conventionCreated && <CheckCircle className="h-4 w-4 text-green-500" />}Convention</TabsTrigger>
              </TabsList>

              <TabsContent value="quotation">
                <Card>
                  <CardHeader><CardTitle>Devis</CardTitle><CardDescription>Établissez le devis pour les frais d'accréditation</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {quotationCreated ? (
                      <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Devis créé avec succès</AlertDescription></Alert>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Montant (DA) *</Label>
                          <Input type="number" placeholder="50000" value={quotationAmount} onChange={(e) => setQuotationAmount(e.target.value)} min="0" step="100" />
                        </div>
                        <div className="space-y-2">
                          <Label>Détails du devis</Label>
                          <Textarea placeholder="Prestations incluses : audit documentaire, visite sur site, rapport..." value={quotationDetails} onChange={(e) => setQuotationDetails(e.target.value)} rows={8} />
                        </div>
                        <Button className="w-full" onClick={handleCreateQuotation} disabled={creatingQuotation}>
                          {creatingQuotation ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><FileText className="mr-2 h-4 w-4" />Créer le devis</>}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convention">
                <Card>
                  <CardHeader><CardTitle>Convention</CardTitle><CardDescription>Établissez la convention d'accréditation</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {conventionCreated ? (
                      <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Convention créée avec succès</AlertDescription></Alert>
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
                          {creatingConvention ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><FileText className="mr-2 h-4 w-4" />Créer la convention</>}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Send to DAG */}
            {quotationCreated && conventionCreated && !quotationApproved && !["QUOTATION_APPROVED_BY_DAG","QUOTATION_SENT_TO_OEC","QUOTATION_VALIDATED"].includes(request?.status) && (
              <Card className="border-primary">
                <CardHeader><CardTitle>Envoi au DAG</CardTitle><CardDescription>Le devis et la convention sont prêts à être envoyés au DAG pour approbation</CardDescription></CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg" onClick={handleSendToDAG} disabled={sendingToDAG}>
                    {sendingToDAG ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer au DAG</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Send to OEC after DAG approval */}
            {quotationApproved && request?.status === "QUOTATION_APPROVED_BY_DAG" && (
              <Card className="border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />DAG a approuvé le devis</CardTitle>
                  <CardDescription>Envoyez le devis et la convention à l'OEC pour acceptation. L'OEC dispose de 10 jours pour répondre.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Délai OEC :</strong> 10 jours pour accepter. Rappel automatique au bout de 5 jours.</AlertDescription></Alert>
                  <Button className="w-full" size="lg" onClick={handleSendToOEC} disabled={sendingToOEC}>
                    {sendingToOEC ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer à l'OEC</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {request?.status === "QUOTATION_SENT_TO_OEC" && (
              <Alert><AlertDescription>Le devis et la convention ont été envoyés à l'OEC. En attente de validation...</AlertDescription></Alert>
            )}
            {request?.status === "QUOTATION_VALIDATED" && (
              <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>L'OEC a validé le devis et signé la convention. Passez à l'étape 4 (constitution de l'équipe).</AlertDescription></Alert>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
