import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FileSearch, CheckCircle, XCircle, PlayCircle, FileSignature } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

export default function RADashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [assignedRequests, setAssignedRequests] = useState<any[]>([]);
  const [studyRequests, setStudyRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [decision, setDecision] = useState("");
  const [comments, setComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    } else if (user && !authLoading) {
      loadData();
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

  const loadData = async () => {
    try {
      // Charger les demandes assignées à ce RA
      const assignedRes = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await assignedRes.json();
      // Séparer les demandes par statut
      setAssignedRequests(data.filter((r: any) => r.status === "ASSIGNED_TO_RA"));
      setStudyRequests(data.filter((r: any) => r.status === "RECEIVABILITY_STUDY"));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const startStudy = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/start-study`);

      toast({
        title: "Étude commencée",
        description: "L'étude de recevabilité a été lancée",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const openReferenceDialog = (request: any) => {
    setSelectedRequest(request);
    // Générer un numéro de référence par défaut
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setReferenceNumber(`D-${year}-${randomNum}`);
    setReferenceDialogOpen(true);
  };

  const handleSetReference = async () => {
    if (!referenceNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de référence",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      await apiRequest(
        "POST",
        `/api/requests/${selectedRequest.id}/set-reference`,
        { referenceNumber: referenceNumber.trim() }
      );

      toast({
        title: "Numéro attribué",
        description: `Le numéro ${referenceNumber} a été attribué avec succès`,
      });

      setReferenceDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDecisionDialog = (request: any) => {
    setSelectedRequest(request);
    setDecision("");
    setComments("");
    setDecisionDialogOpen(true);
  };

  const handleDecision = async () => {
    if (!decision || !comments.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une décision et saisir des commentaires",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      await apiRequest(
        "POST",
        `/api/requests/${selectedRequest.id}/receivability-decision`,
        {
          isReceivable: decision === "receivable",
          comments: comments
        }
      );

      toast({
        title: "Décision enregistrée",
        description: `La demande a été déclarée ${decision === "receivable" ? "recevable" : "non recevable"}`,
      });

      setDecisionDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Responsable d'Accréditation</h1>
        <p className="text-muted-foreground">
          Étudiez la recevabilité des demandes qui vous sont assignées
        </p>
      </div>

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">
            Nouvelles assignations ({assignedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="study">
            En cours d'étude ({studyRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Demandes assignées
              </CardTitle>
              <CardDescription>
                Demandes qui vous ont été assignées et qui nécessitent de commencer l'étude
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande assignée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>OEC</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Date d'assignation</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono font-medium">
                          {request.referenceNumber || (
                            <Badge variant="secondary">En attente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.oec?.organizationName || request.oec?.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.type}</Badge>
                        </TableCell>
                        <TableCell>{request.domain}</TableCell>
                        <TableCell>
                          {request.assignmentDate 
                            ? new Date(request.assignmentDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {!request.referenceNumber ? (
                            <Button
                              size="sm"
                              onClick={() => openReferenceDialog(request)}
                              variant="default"
                            >
                              <FileSignature className="mr-2 h-4 w-4" />
                              Attribuer numéro
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => startStudy(request.id)}
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Commencer l'étude
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Demandes en cours d'étude
              </CardTitle>
              <CardDescription>
                Demandes pour lesquelles l'étude de recevabilité est en cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studyRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande en cours d'étude
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>OEC</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studyRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono font-medium">
                          {request.referenceNumber}
                        </TableCell>
                        <TableCell>
                          {request.oec?.organizationName || request.oec?.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.type}</Badge>
                        </TableCell>
                        <TableCell>{request.domain}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openDecisionDialog(request)}
                          >
                            Prendre une décision
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Décision de recevabilité</DialogTitle>
            <DialogDescription>
              Prenez une décision concernant la recevabilité de cette demande
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Référence:</span>
                    <p className="font-mono font-medium">{selectedRequest.referenceNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OEC:</span>
                    <p className="font-medium">
                      {selectedRequest.oec?.organizationName || selectedRequest.oec?.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{selectedRequest.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domaine:</span>
                    <p className="font-medium">{selectedRequest.domain}</p>
                  </div>
                </div>
                {selectedRequest.description && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Description:</span>
                    <p className="text-sm mt-1">{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Décision *</Label>
                <RadioGroup value={decision} onValueChange={setDecision}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="receivable" id="receivable" />
                    <Label htmlFor="receivable" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Recevable</p>
                        <p className="text-sm text-muted-foreground">
                          La demande est conforme et peut passer à l'étape suivante
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="not-receivable" id="not-receivable" />
                    <Label htmlFor="not-receivable" className="flex items-center gap-2 cursor-pointer flex-1">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">Non recevable</p>
                        <p className="text-sm text-muted-foreground">
                          La demande ne répond pas aux critères requis
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires et justification *</Label>
                <Textarea
                  id="comments"
                  placeholder="Détaillez les raisons de votre décision..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDecisionDialogOpen(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button onClick={handleDecision} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer la décision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'attribution du numéro de référence */}
      <Dialog open={referenceDialogOpen} onOpenChange={setReferenceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attribuer un numéro de référence</DialogTitle>
            <DialogDescription>
              Attribuez un numéro de référence unique à cette demande pour la prendre en charge
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">OEC:</span>
                    <p className="font-medium">
                      {selectedRequest.oec?.organizationName || selectedRequest.oec?.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{selectedRequest.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domaine:</span>
                    <span className="ml-2 font-medium">{selectedRequest.domain}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Numéro de référence *</Label>
                <Input
                  id="referenceNumber"
                  placeholder="D-2026-001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format recommandé : D-ANNÉE-NUMÉRO (ex: D-2026-001)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReferenceDialogOpen(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button onClick={handleSetReference} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Attribuer le numéro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

