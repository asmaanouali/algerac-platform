"""Second batch of workflow pages."""
import os

BASE = r"c:\Users\la_no\OneDrive\Desktop\algerac-platform\client\src\pages"

files = {}

# ============================================================
# RA QuotationConventionPage.tsx — Enhanced with DAG + OEC send flow
# ============================================================
files[os.path.join(BASE, "ra", "QuotationConventionPage.tsx")] = r'''import { useEffect, useState } from "react";
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
        if (["DAG_APPROVED", "QUOTATION_SENT_TO_OEC", "QUOTATION_VALIDATED"].includes(data.status)) {
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
      const res = await fetch("/api/quotations/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ requestId: parseInt(requestId!), amount: parseFloat(quotationAmount), details: quotationDetails }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
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
      const res = await fetch("/api/conventions/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ requestId: parseInt(requestId!), content: conventionContent, termsAndConditions: conventionTerms }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
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
      const res = await fetch(`/api/quotations/${quotationId}/send-to-dag`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
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
        <main className="p-8">
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
            {quotationCreated && conventionCreated && !quotationApproved && !["DAG_APPROVED","QUOTATION_SENT_TO_OEC","QUOTATION_VALIDATED"].includes(request?.status) && (
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
            {quotationApproved && request?.status === "DAG_APPROVED" && (
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
'''

# ============================================================
# OEC CorrectRequestPage.tsx — Enhanced
# ============================================================
files[os.path.join(BASE, "oec", "CorrectRequestPage.tsx")] = r'''import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

const DOMAINS = [
  "Laboratoires d'essais",
  "Laboratoires d'étalonnage",
  "Organismes d'inspection",
  "Organismes de certification de produits",
  "Organismes de certification de systèmes de management",
  "Organismes de certification de personnes",
  "Organismes de vérification/validation",
  "Producteurs de matériaux de référence",
];

export default function CorrectRequestPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setDomain(data.domain || "");
        setDescription(data.description || "");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!corrections.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Décrivez les corrections" }); return; }
    setSubmitting(true);
    try {
      // Resubmit the request with corrections
      await apiRequest("POST", `/api/requests/${requestId}/submit`, {
        corrections,
        domain,
        description,
      });
      toast({ title: "Corrections soumises", description: "Votre demande corrigée a été resoumise pour étude. Vous devez procéder au paiement." });
      setTimeout(() => setLocation(`/oec/paiement/${requestId}`), 2000);
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
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Corriger et Resoumettre</h1>
              <p className="text-muted-foreground mt-2">Votre demande a été déclarée non recevable. Corrigez-la et resoumettez.</p>
            </div>

            {request?.receivabilityComments && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Motifs de non-recevabilité :</strong>
                  <p className="mt-2 whitespace-pre-wrap">{request.receivabilityComments}</p>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader><CardTitle>Corrections</CardTitle><CardDescription>Modifiez les informations nécessaires et décrivez les corrections apportées</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Domaine d'accréditation</Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez le domaine" /></SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description mise à jour</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée de votre activité..." rows={6} />
                </div>

                <div className="space-y-2">
                  <Label>Description des corrections apportées *</Label>
                  <Textarea value={corrections} onChange={(e) => setCorrections(e.target.value)} placeholder="Décrivez les corrections effectuées en réponse aux motifs de non-recevabilité..." rows={6} />
                </div>

                <Button onClick={handleSubmit} disabled={submitting || !corrections.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Soumission...</> : <><Send className="mr-2 h-4 w-4" />Resoumettre la demande</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
'''

# ============================================================
# RA FeasibilityPage.tsx — Enhanced with sub-steps
# ============================================================
files[os.path.join(BASE, "ra", "FeasibilityPage.tsx")] = r'''import { useEffect, useState } from "react";
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
      setRequests(data.filter((r: any) => ["ASSIGNED_TO_RA","RECEIVABILITY_STUDY","RESOURCE_CHECK"].includes(r.status)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const selectRequest = (r: any) => {
    setSelectedRequest(r);
    setStep("documents");
    setTechnicalAnalysis(""); setComplianceCheck(""); setPaymentVerified(false);
    setResourcesAvailable(""); setDecision(""); setComments(""); setRejectionReason("");
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
      toast({ title: "Décision enregistrée" });
      if (decision === "RECEIVABLE") setLocation(`/ra/demandes/${selectedRequest.id}/devis`);
      else loadRequests();
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
        <main className="p-8">
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
                        <Badge variant={r.status === "RECEIVABILITY_STUDY" ? "default" : "secondary"} className="text-xs">
                          {r.status === "RECEIVABILITY_STUDY" ? "En cours" : "Nouveau"}
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
                  ) : (
                    <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="documents">1. Documents & Paiement</TabsTrigger>
                        <TabsTrigger value="resources">2. Ressources</TabsTrigger>
                        <TabsTrigger value="decision">3. Décision</TabsTrigger>
                      </TabsList>

                      <TabsContent value="documents" className="space-y-4">
                        <div className="space-y-2"><Label>Analyse technique des documents *</Label><Textarea value={technicalAnalysis} onChange={(e) => setTechnicalAnalysis(e.target.value)} placeholder="Vérifiez la complétude et la conformité des documents soumis..." rows={5} /></div>
                        <div className="space-y-2"><Label>Vérification de conformité *</Label><Textarea value={complianceCheck} onChange={(e) => setComplianceCheck(e.target.value)} placeholder="Vérifiez la conformité aux normes applicables..." rows={5} /></div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <input type="checkbox" id="payment-check" checked={paymentVerified} onChange={(e) => setPaymentVerified(e.target.checked)} className="h-5 w-5" />
                          <label htmlFor="payment-check" className="cursor-pointer"><p className="font-medium">Paiement des frais de dossier vérifié</p><p className="text-sm text-muted-foreground">Confirmez que les droits fixes (5 000 DA) ont été payés</p></label>
                        </div>
                        <Button onClick={() => setStep("resources")} disabled={!technicalAnalysis || !complianceCheck || !paymentVerified}>Suivant : Ressources</Button>
                      </TabsContent>

                      <TabsContent value="resources" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Disponibilité des ressources d'évaluation *</Label>
                          <RadioGroup value={resourcesAvailable} onValueChange={setResourcesAvailable}>
                            <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="yes" id="ra-y" /><Label htmlFor="ra-y" className="cursor-pointer flex-1"><p className="font-medium">Ressources disponibles</p><p className="text-sm text-muted-foreground">Évaluateurs compétents disponibles en interne</p></Label></div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="foreign" id="ra-f" /><Label htmlFor="ra-f" className="cursor-pointer flex-1"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><div><p className="font-medium">Experts étrangers nécessaires</p><p className="text-sm text-muted-foreground">L'OEC sera consulté pour les frais supplémentaires</p></div></div></Label></div>
                          </RadioGroup>
                        </div>
                        {resourcesAvailable === "foreign" && <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>L'OEC sera contacté pour accepter les frais supplémentaires. S'il refuse, le dossier sera classé.</AlertDescription></Alert>}
                        <Button onClick={() => setStep("decision")} disabled={!resourcesAvailable}>Suivant : Décision</Button>
                      </TabsContent>

                      <TabsContent value="decision" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Décision de recevabilité *</Label>
                          <RadioGroup value={decision} onValueChange={setDecision}>
                            <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="RECEIVABLE" id="dec-r" /><Label htmlFor="dec-r" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="font-medium">Recevable</p><p className="text-sm text-muted-foreground">Le dossier passera à la validation DG puis à la contractualisation</p></div></Label></div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="NOT_RECEIVABLE" id="dec-nr" /><Label htmlFor="dec-nr" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-500" /><div><p className="font-medium">Non recevable</p><p className="text-sm text-muted-foreground">L'OEC devra corriger et soumettre à nouveau</p></div></Label></div>
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
'''

# Write
for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {filepath}")

print(f"\nDone! Wrote {len(files)} files.")
