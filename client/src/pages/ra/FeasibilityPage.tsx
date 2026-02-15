import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle, XCircle, Eye, Send } from "lucide-react";
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
  description: string;
  status: string;
  progress: number;
  submissionDate: string;
  assignmentDate: string;
  oec: {
    organizationName: string;
    email: string;
  };
}

interface FeasibilityStudy {
  id: number;
  decision: string;
  comments: string;
  technicalAnalysis: string;
  complianceCheck: string;
  studyStartDate: string;
}

export default function RAFeasibilityPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccreditationRequest | null>(null);
  const [decision, setDecision] = useState<"RECEIVABLE" | "NOT_RECEIVABLE">("RECEIVABLE");
  const [comments, setComments] = useState("");
  const [technicalAnalysis, setTechnicalAnalysis] = useState("");
  const [complianceCheck, setComplianceCheck] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const response = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await response.json();
      // Filtrer uniquement les demandes en état ASSIGNED_TO_RA ou RECEIVABILITY_STUDY
      const pendingRequests = data.filter(
        (r: AccreditationRequest) =>
          r.status === "ASSIGNED_TO_RA" || r.status === "RECEIVABILITY_STUDY"
      );
      setRequests(pendingRequests);
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

  const openStudyDialog = async (request: AccreditationRequest) => {
    setSelectedRequest(request);
    setDecision("RECEIVABLE");
    setComments("");
    setTechnicalAnalysis("");
    setComplianceCheck("");
    setRejectionReason("");

    // Si la demande est en ASSIGNED_TO_RA, démarrer l'étude
    if (request.status === "ASSIGNED_TO_RA") {
      try {
        await apiRequest("POST", `/api/feasibility-studies/start/${request.id}`);
      } catch (err) {
        console.error("Erreur lors du démarrage de l'étude:", err);
      }
    }

    setStudyDialogOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) return;

    if (decision === "NOT_RECEIVABLE" && !rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez indiquer la raison du rejet",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiRequest(
        "POST",
        `/api/feasibility-studies/submit-decision/${selectedRequest.id}`,
        {
          decision,
          comments,
          technicalAnalysis,
          complianceCheck,
          rejectionReason: decision === "NOT_RECEIVABLE" ? rejectionReason : null,
        }
      );

      toast({
        title: "Décision enregistrée",
        description:
          decision === "RECEIVABLE"
            ? "La demande a été déclarée recevable"
            : "La demande a été déclarée non recevable",
      });

      setStudyDialogOpen(false);
      loadRequests();
      
      // Si recevable, naviguer vers la page de création de devis
      if (decision === "RECEIVABLE") {
        setLocation(`/ra/demandes/${selectedRequest.id}/devis`);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setSubmitting(false);
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
        <div>
          <h1 className="text-3xl font-bold">Études de Faisabilité</h1>
          <p className="text-muted-foreground mt-2">
            Évaluez les demandes d'accréditation qui vous sont assignées
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes assignées
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                En attente d'étude
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes à évaluer</CardTitle>
            <CardDescription>
              Effectuez l'étude de faisabilité pour chaque demande
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Aucune demande en attente d'étude
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{request.referenceNumber}</h3>
                        <Badge variant="outline">{request.type}</Badge>
                        <Badge
                          variant={
                            request.status === "RECEIVABILITY_STUDY"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {request.status === "RECEIVABILITY_STUDY"
                            ? "En cours d'étude"
                            : "Nouvelle"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {request.oec.organizationName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Domaine : {request.domain}
                      </p>
                      {request.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Assignée le :{" "}
                        {new Date(request.assignmentDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/ra/demandes/${request.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button size="sm" onClick={() => openStudyDialog(request)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Étudier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'étude de faisabilité */}
      <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Étude de Faisabilité</DialogTitle>
            <DialogDescription>
              Évaluez la recevabilité de la demande
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>Référence :</strong> {selectedRequest.referenceNumber}
                  <br />
                  <strong>OEC :</strong> {selectedRequest.oec.organizationName}
                  <br />
                  <strong>Domaine :</strong> {selectedRequest.domain}
                </AlertDescription>
              </Alert>

              {/* Décision */}
              <div className="space-y-3">
                <Label>Décision de recevabilité</Label>
                <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RECEIVABLE" id="receivable" />
                    <Label htmlFor="receivable" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Recevable
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NOT_RECEIVABLE" id="not-receivable" />
                    <Label htmlFor="not-receivable" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        Non recevable
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Analyse technique */}
              <div className="space-y-2">
                <Label htmlFor="technicalAnalysis">Analyse technique</Label>
                <Textarea
                  id="technicalAnalysis"
                  placeholder="Décrivez l'analyse technique de la demande..."
                  value={technicalAnalysis}
                  onChange={(e) => setTechnicalAnalysis(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Vérification de conformité */}
              <div className="space-y-2">
                <Label htmlFor="complianceCheck">Vérification de conformité</Label>
                <Textarea
                  id="complianceCheck"
                  placeholder="Décrivez la vérification de conformité..."
                  value={complianceCheck}
                  onChange={(e) => setComplianceCheck(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Commentaires */}
              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires généraux</Label>
                <Textarea
                  id="comments"
                  placeholder="Ajoutez des commentaires si nécessaire..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Raison du rejet (si non recevable) */}
              {decision === "NOT_RECEIVABLE" && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    Raison du rejet <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Expliquez en détail pourquoi la demande est non recevable..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    required
                  />
                  <Alert variant="destructive">
                    <AlertDescription>
                      L'OEC sera notifié et recevra un email avec cette raison.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {decision === "RECEIVABLE" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Une fois validée, vous serez redirigé vers la page de création du devis
                    et de la convention.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStudyDialogOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmitDecision} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Soumettre la décision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
