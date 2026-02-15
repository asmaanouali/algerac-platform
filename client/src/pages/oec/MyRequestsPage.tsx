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
  
  // Nouveaux champs workflow
  currentPhase?: string;
  currentStep?: string;
  nextAction?: string;
  pendingWith?: string;
  isReceivable?: boolean;
  receivabilityCorrectionNeeded?: string;
  correctionDeadline?: string;
  receivabilityAttempts?: number;
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
      // Phase initiale
      DRAFT: { label: "Brouillon", variant: "secondary" },
      SUBMITTED: { label: "Soumise", variant: "default" },
      PENDING_PAYMENT: { label: "En attente de paiement", variant: "outline" },
      PAYMENT_COMPLETED: { label: "Paiement effectué", variant: "default" },
      ASSIGNED_TO_RA: { label: "Assignée à un RA", variant: "default" },
      
      // Phase recevabilité
      RECEIVABILITY_STUDY: { label: "Étude de recevabilité", variant: "default" },
      RECEIVABLE: { label: "Recevable ✓", variant: "default" },
      NOT_RECEIVABLE: { label: "Non recevable - Action requise", variant: "destructive" },
      RECEIVABILITY_CORRECTION: { label: "Correction en cours", variant: "outline" },
      RECEIVABILITY_RESUBMITTED: { label: "Re-soumise pour étude", variant: "default" },
      
      // Visite préliminaire
      PRELIMINARY_VISIT_PROPOSED: { label: "Visite proposée", variant: "default" },
      PRELIMINARY_VISIT_ACCEPTED: { label: "Visite acceptée", variant: "default" },
      PRELIMINARY_VISIT_SCHEDULED: { label: "Visite programmée", variant: "default" },
      PRELIMINARY_VISIT_COMPLETED: { label: "Visite effectuée", variant: "default" },
      PROCESS_SUSPENDED_OBSTACLES: { label: "Suspendu - Obstacles", variant: "destructive" },
      
      // Contractualisation
      QUOTATION_PREPARATION: { label: "Préparation du devis", variant: "default" },
      QUOTATION_SENT_TO_OEC: { label: "Devis reçu - Validation requise", variant: "default" },
      QUOTATION_VALIDATED: { label: "Devis validé", variant: "default" },
      
      // Constitution équipe
      TEAM_DESIGNATION: { label: "Constitution de l'équipe", variant: "default" },
      TEAM_SENT_TO_OEC: { label: "Équipe à valider", variant: "default" },
      TEAM_VALIDATED: { label: "Équipe validée", variant: "default" },
      
      // Évaluation
      DOCUMENTARY_REVIEW: { label: "Revue documentaire", variant: "default" },
      AWAITING_OEC_DOC_RESPONSE: { label: "Votre réponse attendue", variant: "outline" },
      EVALUATION_PLANNED: { label: "Évaluation planifiée", variant: "default" },
      EVALUATION_IN_PROGRESS: { label: "Évaluation en cours", variant: "default" },
      EVALUATION_COMPLETED: { label: "Évaluation terminée", variant: "default" },
      
      // Traitement écarts
      AWAITING_ACTION_PLANS: { label: "Plans d'actions requis", variant: "outline" },
      ACTION_PLANS_IMPLEMENTATION: { label: "Actions en cours", variant: "default" },
      GAPS_RESOLVED: { label: "Écarts résolus", variant: "default" },
      
      // CAS et décision
      CAS_SCHEDULED: { label: "Réunion CAS programmée", variant: "default" },
      CAS_DECISION_GRANT: { label: "Accréditation accordée! 🎉", variant: "default" },
      CAS_DECISION_REFUSAL: { label: "Refusée", variant: "destructive" },
      CAS_DECISION_POSTPONEMENT: { label: "Ajournée", variant: "outline" },
      
      // Statuts finaux
      CERTIFICATE_ISSUED: { label: "Certificat délivré", variant: "default" },
      ACTIVE: { label: "Active", variant: "default" },
      SUSPENDED: { label: "Suspendue", variant: "destructive" },
      WITHDRAWN: { label: "Retirée", variant: "destructive" },
      
      // Surveillance
      SURVEILLANCE_SCHEDULED: { label: "Surveillance programmée", variant: "default" },
      SURVEILLANCE_IN_PROGRESS: { label: "Surveillance en cours", variant: "default" },
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

  const handlePreliminaryVisitResponse = async (requestId: number, accepted: boolean) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/preliminary-visit-response`, {
        accepted
      });
      
      toast({
        title: "Réponse enregistrée",
        description: accepted 
          ? "Vous avez accepté la visite préliminaire." 
          : "Vous avez refusé la visite préliminaire.",
      });
      
      loadRequests(); // Recharger la liste
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    }
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

                    {/* Informations de workflow */}
                    {request.currentPhase && (
                      <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Phase actuelle:</span>
                          <span>{request.currentPhase}</span>
                        </div>
                        {request.currentStep && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Étape:</span>
                            <span>{request.currentStep}</span>
                          </div>
                        )}
                        {request.nextAction && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Prochaine action:</span>
                            <span>{request.nextAction}</span>
                          </div>
                        )}
                        {request.pendingWith === "OEC" && (
                          <Alert className="mt-2">
                            <AlertDescription>
                              <span className="font-medium">⏱️ Action requise de votre part</span>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

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

                    {request.status === "NOT_RECEIVABLE" && (
                      <Alert variant="destructive">
                        <AlertDescription className="space-y-2">
                          <p className="font-medium">Demande non recevable - Action requise</p>
                          {request.receivabilityCorrectionNeeded && (
                            <div className="space-y-1">
                              <p className="font-medium text-sm">Corrections nécessaires :</p>
                              <p className="text-sm">{request.receivabilityCorrectionNeeded}</p>
                            </div>
                          )}
                          {request.correctionDeadline && (
                            <p className="text-sm">
                              Délai de correction : {new Date(request.correctionDeadline).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                          {request.receivabilityAttempts && request.receivabilityAttempts > 0 && (
                            <p className="text-sm">
                              Tentative n°{request.receivabilityAttempts}
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "RECEIVABILITY_RESUBMITTED" && (
                      <Alert>
                        <AlertDescription>
                          Votre demande a été re-soumise et est en cours de réévaluation par le RA.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "PRELIMINARY_VISIT_PROPOSED" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> Une visite préliminaire
                          est proposée. Veuillez indiquer si vous l'acceptez.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "PROCESS_SUSPENDED_OBSTACLES" && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <span className="font-medium">Processus suspendu :</span> Des obstacles
                          bloquants ont été identifiés lors de la visite préliminaire. Veuillez
                          les lever pour continuer.
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

                    {request.status === "TEAM_SENT_TO_OEC" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> La composition
                          de l'équipe d'évaluation est disponible. Vous avez 3 jours pour
                          valider ou récuser des membres.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "AWAITING_OEC_DOC_RESPONSE" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> Des manquements
                          ont été identifiés lors de la revue documentaire. Votre réponse est attendue.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "AWAITING_ACTION_PLANS" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Action requise :</span> Des écarts ont été
                          identifiés. Veuillez soumettre vos plans d'actions sous 10 jours.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "CAS_DECISION_GRANT" && (
                      <Alert className="border-green-500 bg-green-50">
                        <AlertDescription>
                          <span className="font-medium text-green-700">🎉 Félicitations !</span>
                          <br />Votre accréditation a été accordée par le CAS!
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "CAS_DECISION_REFUSAL" && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Votre demande a été refusée par le CAS. Vous avez un droit de recours.
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === "CAS_DECISION_POSTPONEMENT" && (
                      <Alert>
                        <AlertDescription>
                          <span className="font-medium">Décision ajournée :</span> Des compléments
                          sont requis avant une nouvelle présentation au CAS.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 flex-wrap">
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
                      
                      {request.status === "NOT_RECEIVABLE" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/corriger`)}
                        >
                          Corriger et resoumettre
                        </Button>
                      )}
                      
                      {request.status === "PRELIMINARY_VISIT_PROPOSED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handlePreliminaryVisitResponse(request.id, true)}
                          >
                            Accepter la visite
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreliminaryVisitResponse(request.id, false)}
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                      
                      {request.status === "QUOTATION_SENT_TO_OEC" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/validation`)}
                        >
                          Valider le devis et la convention
                        </Button>
                      )}
                      
                      {request.status === "TEAM_SENT_TO_OEC" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/equipe`)}
                        >
                          Valider l'équipe
                        </Button>
                      )}
                      
                      {request.status === "AWAITING_OEC_DOC_RESPONSE" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/reponse-documentaire`)}
                        >
                          Répondre aux manquements
                        </Button>
                      )}
                      
                      {request.status === "AWAITING_ACTION_PLANS" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/plans-actions`)}
                        >
                          Soumettre plans d'actions
                        </Button>
                      )}
                      
                      {request.status === "PROCESS_SUSPENDED_OBSTACLES" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/oec/demandes/${request.id}/lever-obstacles`)}
                        >
                          Notifier levée obstacles
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
