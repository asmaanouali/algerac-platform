import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FileText, UserCheck } from "lucide-react";

export default function CDAccreditations() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [raList, setRaList] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedRaId, setSelectedRaId] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
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
    setLocation("/");
    return null;
  }

  const loadData = async () => {
    try {
      const requestsRes = await fetch("/api/requests/status/PAYMENT_COMPLETED", {
        credentials: "include"
      });
      if (requestsRes.ok) {
        setRequests(await requestsRes.json());
      }
      const usersRes = await fetch("/api/users?role=RA", {
        credentials: "include"
      });
      if (usersRes.ok) {
        setRaList(await usersRes.json());
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (request: any) => {
    setSelectedRequest(request);
    const year = new Date().getFullYear();
    const count = requests.length + 1;
    setReferenceNumber(`D-${year}-${String(count).padStart(3, "0")}`);
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedRaId || !referenceNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un RA et saisir un numéro de référence",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          raId: parseInt(selectedRaId),
          referenceNumber: referenceNumber
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de l'assignation");
      }
      toast({
        title: "Assignation réussie",
        description: `La demande ${referenceNumber} a été assignée avec succès`,
      });
      setAssignDialogOpen(false);
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
        <h1 className="text-3xl font-bold mb-2">Chef de Département</h1>
        <p className="text-muted-foreground">
          Attribuez un numéro de référence et assignez les demandes aux responsables d'accréditation
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demandes en attente d'assignation
          </CardTitle>
          <CardDescription>
            {requests.length} demande(s) payée(s) en attente d'attribution et d'assignation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune demande en attente d'assignation
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>OEC</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Date de soumission</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono">{request.id}</TableCell>
                    <TableCell>{request.oec?.organizationName || request.oec?.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.type}</Badge>
                    </TableCell>
                    <TableCell>{request.domain}</TableCell>
                    <TableCell>
                      {request.submissionDate 
                        ? new Date(request.submissionDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">Paiement complété</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => openAssignDialog(request)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Attribuer & Assigner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un numéro et assigner au RA</DialogTitle>
            <DialogDescription>
              Attribuez un numéro de référence et sélectionnez un responsable d'accréditation pour cette demande
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">OEC:</span>
                  <span className="font-medium">
                    {selectedRequest.oec?.organizationName || selectedRequest.oec?.fullName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Domaine:</span>
                  <span className="font-medium">{selectedRequest.domain}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Numéro de référence *</Label>
                <Input
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ex: D-2026-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raId">Responsable d'Accréditation *</Label>
                <Select
                  value={selectedRaId}
                  onValueChange={setSelectedRaId}
                >
                  <SelectTrigger id="raId">
                    <SelectValue placeholder="Sélectionnez un RA" />
                  </SelectTrigger>
                  <SelectContent>
                    {raList.map((ra) => (
                      <SelectItem key={ra.id} value={ra.id.toString()}>
                        {ra.fullName} - {ra.email}
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
              disabled={processing}
            >
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l'assignation
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
