import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, UserPlus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  submissionDate: string;
  oecId: number;
  oec: {
    organizationName: string;
    email: string;
  };
}

interface RA {
  id: number;
  fullName: string;
  email: string;
}

export default function CDDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [ras, setRas] = useState<RA[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccreditationRequest | null>(null);
  const [selectedRaId, setSelectedRaId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    } else if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // Afficher un loader pendant la vérification de l'auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Ne rien afficher pendant la redirection
  if (!user) {
    return null;
  }

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les demandes en attente d'assignation
      const requestsResponse = await apiRequest("GET", "/api/requests/status/PAYMENT_COMPLETED");
      const requestsData = await requestsResponse.json();
      setRequests(requestsData);

      // Charger les RAs disponibles
      const rasResponse = await apiRequest("GET", "/api/users/by-role/RA");
      const rasData = await rasResponse.json();
      setRas(rasData);
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

  const openAssignDialog = (request: AccreditationRequest) => {
    setSelectedRequest(request);
    setSelectedRaId("");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedRaId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un RA",
      });
      return;
    }

    try {
      setAssigning(true);

      const response = await apiRequest(
        "POST",
        `/api/requests/${selectedRequest.id}/assign`,
        {
          raId: parseInt(selectedRaId),
        }
      );

      toast({
        title: "Assignation réussie",
        description: `La demande a été assignée avec succès au RA`,
      });

      setAssignDialogOpen(false);
      loadData(); // Recharger la liste
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="md:ml-64">
          <Navbar />
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard - Chef de Département</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les demandes d'accréditation et assignez-les aux responsables
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes en attente
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                À assigner à des RAs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                RAs disponibles
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ras.length}</div>
              <p className="text-xs text-muted-foreground">
                Responsables d'accréditation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes en attente d'assignation</CardTitle>
            <CardDescription>
              Attribuez un numéro de référence et assignez chaque demande à un RA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Aucune demande en attente d'assignation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                          {request.oec.organizationName}
                        </h3>
                        <Badge variant="outline">{request.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Domaine : {request.domain}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Soumise le :{" "}
                        {new Date(request.submissionDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button onClick={() => openAssignDialog(request)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assigner
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'assignation */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assigner la demande à un RA</DialogTitle>
            <DialogDescription>
              Sélectionnez un responsable d'accréditation pour cette demande. Le RA attribuera le numéro de référence après avoir pris en charge le dossier.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>OEC :</strong> {selectedRequest.oec.organizationName}
                  <br />
                  <strong>Domaine :</strong> {selectedRequest.domain}
                  <br />
                  <strong>Type :</strong> {selectedRequest.type}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="ra">Responsable d'accréditation</Label>
                <Select value={selectedRaId} onValueChange={setSelectedRaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un RA" />
                  </SelectTrigger>
                  <SelectContent>
                    {ras.map((ra) => (
                      <SelectItem key={ra.id} value={ra.id.toString()}>
                        {ra.fullName} ({ra.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={assigning}
            >
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assignation...
                </>
              ) : (
                "Assigner"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </main>
      </div>
    </div>
  );
}
