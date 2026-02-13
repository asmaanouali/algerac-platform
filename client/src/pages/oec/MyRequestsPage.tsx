import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  submissionDate: string;
  assignedToRaName?: string;
  receivabilityComments?: string;
}

export default function MyRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    } else if (user && !authLoading) {
      loadRequests();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/requests/my-requests");
      const data = await response.json();
      setRequests(data);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DRAFT: { label: "Brouillon", variant: "secondary" },
      SUBMITTED: { label: "Soumise", variant: "default" },
      PENDING_PAYMENT: { label: "En attente de paiement", variant: "outline" },
      PAYMENT_COMPLETED: { label: "Paiement effectué", variant: "default" },
      ASSIGNED_TO_RA: { label: "Assignée à un RA", variant: "default" },
      RECEIVABILITY_STUDY: { label: "Étude de recevabilité", variant: "default" },
      RECEIVABLE: { label: "Recevable", variant: "default" },
      NOT_RECEIVABLE: { label: "Non recevable", variant: "destructive" },
      QUOTATION_PREPARATION: { label: "Préparation du devis", variant: "default" },
      QUOTATION_SENT_TO_DAG: { label: "Devis envoyé au DAG", variant: "default" },
      QUOTATION_APPROVED_BY_DAG: { label: "Devis approuvé", variant: "default" },
      QUOTATION_SENT_TO_OEC: { label: "Devis et convention reçus", variant: "default" },
      QUOTATION_VALIDATED: { label: "Devis validé", variant: "default" },
    };

    const config = statusConfig[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "NOT_RECEIVABLE") {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (status === "RECEIVABLE" || status === "QUOTATION_VALIDATED") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const handleViewDetails = (requestId: number) => {
    setLocation(`/oec/demandes/${requestId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes Demandes d'Accréditation</h1>
            <p className="text-muted-foreground mt-2">
              Suivez l'avancement de vos demandes en temps réel
            </p>
          </div>
          <Button onClick={() => setLocation("/oec/nouvelle-demande")}>
            Nouvelle demande
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Vous n'avez aucune demande pour le moment
              </p>
              <Button
                className="mt-4"
                onClick={() => setLocation("/oec/nouvelle-demande")}
              >
                Créer une demande
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {request.referenceNumber || `Demande #${request.id}`}
                      </CardTitle>
                      <CardDescription>
                        {request.domain} - {request.type}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Barre de progression */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{request.progress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${request.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Informations additionnelles */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date de soumission</p>
                        <p className="font-medium">
                          {request.submissionDate
                            ? new Date(request.submissionDate).toLocaleDateString("fr-FR")
                            : "Non soumise"}
                        </p>
                      </div>
                      {request.assignedToRaName && (
                        <div>
                          <p className="text-muted-foreground">Responsable assigné</p>
                          <p className="font-medium">{request.assignedToRaName}</p>
                        </div>
                      )}
                    </div>

                    {/* Alertes spécifiques */}
                    {request.status === "PENDING_PAYMENT" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> Veuillez
                          effectuer le paiement des frais de dépôt pour poursuivre le
                          traitement de votre demande.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "NOT_RECEIVABLE" && request.receivabilityComments && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <p className="font-medium mb-1">Raison du rejet :</p>
                          <p>{request.receivabilityComments}</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "QUOTATION_SENT_TO_OEC" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> Le devis et
                          la convention sont disponibles pour validation.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les détails
                      </Button>
                      {request.status === "PENDING_PAYMENT" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/paiement/${request.id}`)}
                        >
                          Effectuer le paiement
                        </Button>
                      )}
                      {request.status === "QUOTATION_SENT_TO_OEC" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/validation`)}
                        >
                          Valider le devis et la convention
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
