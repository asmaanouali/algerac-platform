import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, FileText } from "lucide-react";
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
}

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
  
  const [request, setRequest] = useState<AccreditationRequest | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [convention, setConvention] = useState<Convention | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger la demande
      const requestRes = await fetch(`/api/requests/${requestId}`, {
        credentials: "include",
      });
      if (requestRes.ok) {
        setRequest(await requestRes.json());
      }

      // Charger le devis
      const quotationRes = await fetch(`/api/quotations/by-request/${requestId}`, {
        credentials: "include",
      });
      if (quotationRes.ok) {
        const quotations = await quotationRes.json();
        if (quotations.length > 0) {
          setQuotation(quotations[0]);
        }
      }

      // Charger la convention
      const conventionRes = await fetch(`/api/conventions/by-request/${requestId}`, {
        credentials: "include",
      });
      if (conventionRes.ok) {
        const conventions = await conventionRes.json();
        if (conventions.length > 0) {
          setConvention(conventions[0]);
        }
      }
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

  const handleValidate = async () => {
    if (!quotation || !convention) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le devis et la convention doivent être disponibles",
      });
      return;
    }

    try {
      setValidating(true);

      // Valider le devis
      const quotationRes = await fetch(`/api/quotations/${quotation.id}/validate`, {
        method: "POST",
        credentials: "include",
      });

      if (!quotationRes.ok) {
        throw new Error("Erreur lors de la validation du devis");
      }

      // Valider la convention
      const conventionRes = await fetch(`/api/conventions/${convention.id}/validate`, {
        method: "POST",
        credentials: "include",
      });

      if (!conventionRes.ok) {
        throw new Error("Erreur lors de la validation de la convention");
      }

      toast({
        title: "Validation réussie",
        description: "Le devis et la convention ont été validés avec succès",
      });

      setTimeout(() => {
        setLocation("/oec/mes-demandes");
      }, 2000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!request || !quotation || !convention) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Les informations de la demande n'ont pas pu être chargées
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Validation du Devis et de la Convention</h1>
          <p className="text-muted-foreground mt-2">
            Examinez et validez les documents pour la demande {request.referenceNumber}
          </p>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Type :</strong> {request.type}
            <br />
            <strong>Domaine :</strong> {request.domain}
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="quotation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quotation">
              <FileText className="h-4 w-4 mr-2" />
              Devis
            </TabsTrigger>
            <TabsTrigger value="convention">
              <FileText className="h-4 w-4 mr-2" />
              Convention
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotation">
            <Card>
              <CardHeader>
                <CardTitle>Devis - {quotation.quotationNumber}</CardTitle>
                <CardDescription>
                  Préparé par {quotation.preparedByRaName}
                  {quotation.approvedByDagName && ` • Approuvé par ${quotation.approvedByDagName}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Montant total</p>
                      <p className="text-3xl font-bold">
                        {quotation.amount.toLocaleString()} DA
                      </p>
                    </div>
                  </div>

                  {quotation.details && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Détails des prestations</p>
                      <div className="p-3 bg-muted/50 rounded text-sm whitespace-pre-wrap">
                        {quotation.details}
                      </div>
                    </div>
                  )}

                  {quotation.dagComments && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-semibold">Commentaires du DAG</p>
                      <div className="p-3 bg-muted/50 rounded text-sm">
                        {quotation.dagComments}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="convention">
            <Card>
              <CardHeader>
                <CardTitle>Convention - {convention.conventionNumber}</CardTitle>
                <CardDescription>
                  Préparée par {convention.preparedByRaName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Contenu de la convention</p>
                    <div className="p-4 border rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {convention.content || "Aucun contenu fourni"}
                    </div>
                  </div>

                  {convention.termsAndConditions && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Termes et conditions</p>
                      <div className="p-4 border rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {convention.termsAndConditions}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Validation</CardTitle>
            <CardDescription>
              En validant, vous acceptez le devis et la convention pour cette demande d'accréditation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Veuillez examiner attentivement le devis et la convention avant de valider.
                Cette action confirmera votre accord et permettra de poursuivre le processus d'accréditation.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/oec/mes-demandes")}
                disabled={validating}
              >
                Retour
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleValidate}
                disabled={validating}
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valider le devis et la convention
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
