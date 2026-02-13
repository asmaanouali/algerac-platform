import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  oec: {
    organizationName: string;
  };
}

export default function QuotationAndConventionPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<AccreditationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Devis
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationDetails, setQuotationDetails] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const [sendingQuotation, setSendingQuotation] = useState(false);
  const [quotationCreated, setQuotationCreated] = useState(false);
  const [quotationId, setQuotationId] = useState<number | null>(null);
  
  // Convention
  const [conventionContent, setConventionContent] = useState("");
  const [conventionTerms, setConventionTerms] = useState("");
  const [creatingConvention, setCreatingConvention] = useState(false);
  const [conventionCreated, setConventionCreated] = useState(false);
  const [conventionId, setConventionId] = useState<number | null>(null);
  
  const [canSendToDAG, setCanSendToDAG] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadRequest();
      checkExistingDocuments();
    }
  }, [requestId, user, authLoading]);

  // Rediriger vers login si non authentifié
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${requestId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement de la demande");
      }

      const data = await response.json();
      setRequest(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDocuments = async () => {
    try {
      // Vérifier si un devis existe déjà
      const quotationRes = await fetch(`/api/quotations/by-request/${requestId}`, {
        credentials: "include",
      });
      if (quotationRes.ok) {
        const quotations = await quotationRes.json();
        if (quotations.length > 0) {
          setQuotationCreated(true);
          setQuotationId(quotations[0].id);
        }
      }

      // Vérifier si une convention existe déjà
      const conventionRes = await fetch(`/api/conventions/by-request/${requestId}`, {
        credentials: "include",
      });
      if (conventionRes.ok) {
        const conventions = await conventionRes.json();
        if (conventions.length > 0) {
          setConventionCreated(true);
          setConventionId(conventions[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la vérification des documents:", err);
    }
  };

  useEffect(() => {
    setCanSendToDAG(quotationCreated && conventionCreated);
  }, [quotationCreated, conventionCreated]);

  const handleCreateQuotation = async () => {
    if (!quotationAmount || parseFloat(quotationAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir un montant valide",
      });
      return;
    }

    try {
      setCreatingQuotation(true);

      const response = await fetch("/api/quotations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          requestId: parseInt(requestId!),
          amount: parseFloat(quotationAmount),
          details: quotationDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création du devis");
      }

      const result = await response.json();
      setQuotationId(result.data.id);
      setQuotationCreated(true);

      toast({
        title: "Devis créé",
        description: "Le devis a été créé avec succès",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setCreatingQuotation(false);
    }
  };

  const handleCreateConvention = async () => {
    try {
      setCreatingConvention(true);

      const response = await fetch("/api/conventions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          requestId: parseInt(requestId!),
          content: conventionContent,
          termsAndConditions: conventionTerms,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création de la convention");
      }

      const result = await response.json();
      setConventionId(result.data.id);
      setConventionCreated(true);

      toast({
        title: "Convention créée",
        description: "La convention a été créée avec succès",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setCreatingConvention(false);
    }
  };

  const handleSendToDAG = async () => {
    if (!quotationId) return;

    try {
      setSendingQuotation(true);

      const response = await fetch(`/api/quotations/${quotationId}/send-to-dag`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi au DAG");
      }

      toast({
        title: "Envoyé au DAG",
        description: "Le devis a été envoyé au DAG pour approbation",
      });

      setTimeout(() => {
        setLocation("/ra/dashboard");
      }, 2000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setSendingQuotation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Demande non trouvée</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Devis et Convention</h1>
          <p className="text-muted-foreground mt-2">
            Établissez le devis et la convention pour la demande {request.referenceNumber}
          </p>
        </div>

        <Alert>
          <AlertDescription>
            <strong>OEC :</strong> {request.oec.organizationName}
            <br />
            <strong>Domaine :</strong> {request.domain}
            <br />
            <strong>Type :</strong> {request.type}
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="quotation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quotation" className="flex items-center gap-2">
              {quotationCreated && <CheckCircle className="h-4 w-4" />}
              Devis
            </TabsTrigger>
            <TabsTrigger value="convention" className="flex items-center gap-2">
              {conventionCreated && <CheckCircle className="h-4 w-4" />}
              Convention
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotation">
            <Card>
              <CardHeader>
                <CardTitle>Création du Devis</CardTitle>
                <CardDescription>
                  Établissez le devis pour les frais d'accréditation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotationCreated ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Le devis a déjà été créé pour cette demande
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Montant (DA) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50000"
                        value={quotationAmount}
                        onChange={(e) => setQuotationAmount(e.target.value)}
                        min="0"
                        step="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="details">Détails du devis</Label>
                      <Textarea
                        id="details"
                        placeholder="Décrivez les prestations incluses dans le devis..."
                        value={quotationDetails}
                        onChange={(e) => setQuotationDetails(e.target.value)}
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        Incluez les différents frais : audit documentaire, visite sur site, rédaction du rapport, etc.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateQuotation}
                      disabled={creatingQuotation}
                    >
                      {creatingQuotation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Créer le devis
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="convention">
            <Card>
              <CardHeader>
                <CardTitle>Création de la Convention</CardTitle>
                <CardDescription>
                  Établissez la convention d'accréditation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {conventionCreated ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      La convention a déjà été créée pour cette demande
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="content">Contenu de la convention</Label>
                      <Textarea
                        id="content"
                        placeholder="Rédigez le contenu principal de la convention..."
                        value={conventionContent}
                        onChange={(e) => setConventionContent(e.target.value)}
                        rows={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="terms">Termes et conditions</Label>
                      <Textarea
                        id="terms"
                        placeholder="Listez les termes et conditions de la convention..."
                        value={conventionTerms}
                        onChange={(e) => setConventionTerms(e.target.value)}
                        rows={6}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateConvention}
                      disabled={creatingConvention}
                    >
                      {creatingConvention ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Créer la convention
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {canSendToDAG && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Envoi au DAG</CardTitle>
              <CardDescription>
                Le devis et la convention sont prêts à être envoyés au DAG pour approbation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={handleSendToDAG}
                disabled={sendingQuotation}
              >
                {sendingQuotation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer au DAG pour approbation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
