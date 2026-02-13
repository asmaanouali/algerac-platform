import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

interface Quotation {
  id: number;
  quotationNumber: string;
  amount: number;
  details: string;
  status: string;
  sentToDagDate: string;
  preparedByRaName: string;
  request: {
    id: number;
    referenceNumber: string;
    domain: string;
    type: string;
    oec: {
      organizationName: string;
    };
  };
}

export default function DAGDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [comments, setComments] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadQuotations();
    }
  }, [user, authLoading]);

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

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/quotations/pending-approval", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des devis");
      }

      const data = await response.json();
      setQuotations(data);
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

  const openApprovalDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setComments("");
    setApprovalDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedQuotation) return;

    try {
      setApproving(true);

      const response = await fetch(`/api/quotations/${selectedQuotation.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          comments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'approbation");
      }

      toast({
        title: "Devis approuvé",
        description: "Le devis a été approuvé avec succès",
      });

      setApprovalDialogOpen(false);
      loadQuotations();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setApproving(false);
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
          <h1 className="text-3xl font-bold">Dashboard - DAG</h1>
          <p className="text-muted-foreground mt-2">
            Approuvez les devis soumis par les Responsables d'Accréditation
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Devis en attente
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.length}</div>
              <p className="text-xs text-muted-foreground">
                À approuver
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des devis */}
        <Card>
          <CardHeader>
            <CardTitle>Devis à approuver</CardTitle>
            <CardDescription>
              Vérifiez et approuvez les devis soumis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Aucun devis en attente d'approbation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {quotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{quotation.quotationNumber}</h3>
                        <Badge variant="outline">{quotation.request.type}</Badge>
                      </div>
                      <p className="text-sm font-medium">
                        Demande : {quotation.request.referenceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        OEC : {quotation.request.oec.organizationName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Domaine : {quotation.request.domain}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Montant</p>
                          <p className="text-lg font-bold">
                            {quotation.amount.toLocaleString()} DA
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Préparé par</p>
                          <p className="text-sm font-medium">
                            {quotation.preparedByRaName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Envoyé le</p>
                          <p className="text-sm">
                            {new Date(quotation.sentToDagDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Modal pour afficher les détails
                          alert(`Détails du devis:\n\n${quotation.details || "Aucun détail fourni"}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openApprovalDialog(quotation)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'approbation */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Approuver le devis</DialogTitle>
            <DialogDescription>
              Vérifiez les informations et approuvez le devis
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>Numéro :</strong> {selectedQuotation.quotationNumber}
                  <br />
                  <strong>Demande :</strong> {selectedQuotation.request.referenceNumber}
                  <br />
                  <strong>OEC :</strong> {selectedQuotation.request.oec.organizationName}
                  <br />
                  <strong>Montant :</strong> {selectedQuotation.amount.toLocaleString()} DA
                </AlertDescription>
              </Alert>

              {selectedQuotation.details && (
                <div className="space-y-2">
                  <Label>Détails du devis</Label>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{selectedQuotation.details}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires (optionnel)</Label>
                <Textarea
                  id="comments"
                  placeholder="Ajoutez des commentaires ou remarques..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Une fois approuvé, le RA pourra envoyer le devis et la convention à l'OEC.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialogOpen(false)}
              disabled={approving}
            >
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approbation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approuver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
