import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, FileText, CreditCard, FileSignature, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface Quotation {
  id: number;
  quotationNumber: string;
  amount: number;
  details: string;
  dagComments: string;
  preparedByRaName: string;
  approvedByDagName: string;
}

interface Convention {
  id: number;
  conventionNumber: string;
  content: string;
  termsAndConditions: string;
  preparedByRaName: string;
}

export default function ValidateQuotationConventionPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [convention, setConvention] = useState<Convention | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [conventionSigned, setConventionSigned] = useState(false);
  const [quotationAccepted, setQuotationAccepted] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, quotRes, convRes] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { credentials: "include" }),
        fetch(`/api/quotations/by-request/${requestId}`, { credentials: "include" }),
        fetch(`/api/conventions/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (quotRes.ok) { const q = await quotRes.json(); if (q.length > 0) setQuotation(q[0]); }
      if (convRes.ok) { const c = await convRes.json(); if (c.length > 0) setConvention(c[0]); }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!conventionSigned || !quotationAccepted) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez accepter le devis ET signer la convention" });
      return;
    }
    try {
      setValidating(true);
      await apiRequest("POST", `/api/requests/${requestId}/oec-validate-quotation`, {
        accepted: true,
        conventionSigned: true,
      });
      toast({ title: "Succès", description: "Devis accepté et convention signée. Vous serez redirigé vers le paiement." });
      setTimeout(() => setLocation(`/oec/paiement/${requestId}`), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  const handleReject = async () => {
    try {
      setValidating(true);
      await apiRequest("POST", `/api/requests/${requestId}/oec-validate-quotation`, { accepted: false });
      toast({ title: "Devis refusé", description: "Le processus d'accréditation sera arrêté", variant: "destructive" });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Validation du Devis et Convention</h1>
              <p className="text-muted-foreground mt-2">Examinez le devis et la convention pour votre demande d'accréditation</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}<br /><strong>Type :</strong> {request.type}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>10 jours</strong> pour accepter ou refuser le devis et signer la convention. Un rappel sera envoyé au bout de 5 jours.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="quotation">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quotation"><FileText className="h-4 w-4 mr-2" />Devis</TabsTrigger>
                <TabsTrigger value="convention"><FileSignature className="h-4 w-4 mr-2" />Convention</TabsTrigger>
              </TabsList>

              <TabsContent value="quotation">
                <Card>
                  <CardHeader><CardTitle>Devis d'Accréditation</CardTitle><CardDescription>Détail des frais proposés par ALGERAC</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {quotation ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">N° Devis</p><p className="font-mono font-medium">{quotation.quotationNumber}</p></div>
                          <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">Montant</p><p className="text-2xl font-bold text-primary">{quotation.amount?.toLocaleString("fr-FR")} DA</p></div>
                        </div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Détails</p><p className="whitespace-pre-wrap">{quotation.details}</p></div>
                        {quotation.dagComments && <div className="border rounded-lg p-4 bg-blue-50"><p className="text-sm text-muted-foreground mb-1">Commentaires DAG</p><p>{quotation.dagComments}</p></div>}
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <input type="checkbox" id="accept-quotation" checked={quotationAccepted} onChange={(e) => setQuotationAccepted(e.target.checked)} className="h-5 w-5" />
                          <label htmlFor="accept-quotation" className="cursor-pointer"><p className="font-medium">J'accepte le devis</p><p className="text-sm text-muted-foreground">Je confirme avoir pris connaissance du montant et des détails</p></label>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucun devis disponible</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convention">
                <Card>
                  <CardHeader><CardTitle>Convention d'Accréditation</CardTitle><CardDescription>Termes et conditions de l'accréditation</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {convention ? (
                      <>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">N° Convention</p><p className="font-mono font-medium">{convention.conventionNumber}</p></div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Contenu</p><p className="whitespace-pre-wrap">{convention.content}</p></div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Termes et Conditions</p><p className="whitespace-pre-wrap">{convention.termsAndConditions}</p></div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <input type="checkbox" id="sign-convention" checked={conventionSigned} onChange={(e) => setConventionSigned(e.target.checked)} className="h-5 w-5" />
                          <label htmlFor="sign-convention" className="cursor-pointer"><p className="font-medium">Je signe la convention</p><p className="text-sm text-muted-foreground">Je m'engage à respecter les termes et conditions</p></label>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucune convention disponible</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {quotation && convention && (
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="destructive" onClick={handleReject} disabled={validating} className="flex-1">
                      Refuser le devis
                    </Button>
                    <Button onClick={handleValidate} disabled={validating || !quotationAccepted || !conventionSigned} className="flex-1">
                      {validating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><CreditCard className="mr-2 h-4 w-4" />Accepter et procéder au paiement</>}
                    </Button>
                  </div>
                  {(!quotationAccepted || !conventionSigned) && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">Acceptez le devis et signez la convention pour continuer</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
