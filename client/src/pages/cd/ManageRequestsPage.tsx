import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, UserPlus, CheckCircle, FolderOpen, Archive, XCircle, Users } from "lucide-react";
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
  oec: { organizationName: string; email: string; fullName: string };
  assignedRa?: { id: number; fullName: string };
}

interface RAWorkload {
  id: number;
  fullName: string;
  email: string;
  specialite: string;
  domaineExpertise: string;
  sousDomaineExpertise: string;
  assignedDossiers: number;
  activeDossiers: number;
}

export default function CDManageRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<AccreditationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AccreditationRequest[]>([]);
  const [rasWorkload, setRasWorkload] = useState<RAWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccreditationRequest | null>(null);
  const [selectedRaId, setSelectedRaId] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadData();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes, raRes] = await Promise.all([
        apiRequest("GET", "/api/requests/status/PAYMENT_COMPLETED"),
        apiRequest("GET", "/api/requests"),
        apiRequest("GET", "/api/workflow/ra-workload"),
      ]);
      setPendingRequests(await pendingRes.json());
      setAllRequests(await allRes.json());
      setRasWorkload(await raRes.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (r: AccreditationRequest) => { setSelectedRequest(r); setSelectedRaId(""); setAssignDialogOpen(true); };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedRaId) { toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un RA" }); return; }
    try {
      setAssigning(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/assign`, { raId: parseInt(selectedRaId) });
      const raName = rasWorkload.find(r => r.id === parseInt(selectedRaId))?.fullName || "RA";
      toast({ title: "Assignation réussie", description: `Demande assignée à ${raName}` });
      setAssignDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setAssigning(false); }
  };

  const openCloseDialog = (r: AccreditationRequest) => { setSelectedRequest(r); setCloseReason(""); setCloseDialogOpen(true); };

  const handleClose = async () => {
    if (!selectedRequest || !closeReason.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Indiquez la raison" }); return; }
    try {
      setClosing(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/close`, { reason: closeReason });
      toast({ title: "Dossier classé", description: "Le dossier a été classé" });
      setCloseDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setClosing(false); }
  };

  const assignedCount = allRequests.filter(r => !["DRAFT","PENDING_PAYMENT","PAYMENT_COMPLETED","CLOSED","REJECTED"].includes(r.status)).length;
  const closedCount = allRequests.filter(r => r.status === "CLOSED").length;
  const nonReceivableRequests = allRequests.filter(r => r.status === "NOT_RECEIVABLE");

  const getBestRAs = (domain: string) => [...rasWorkload].sort((a, b) => {
    const am = a.domaineExpertise?.toLowerCase().includes(domain?.toLowerCase()) ? 1 : 0;
    const bm = b.domaineExpertise?.toLowerCase().includes(domain?.toLowerCase()) ? 1 : 0;
    return am !== bm ? bm - am : a.activeDossiers - b.activeDossiers;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50/50"><Sidebar /><div className="md:ml-64"><Navbar /><div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Chef de Département — Gestion des Demandes</h1>
              <p className="text-muted-foreground mt-2">Assignez les demandes aux RAs compétents et gérez les dossiers</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En attente</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Assignés</CardTitle><FolderOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{assignedCount}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Non recevables</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{nonReceivableRequests.length}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Classés</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-slate-500">{closedCount}</div></CardContent></Card>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">En attente ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="non-receivable">Non recevables ({nonReceivableRequests.length})</TabsTrigger>
                <TabsTrigger value="all">Tous ({allRequests.length})</TabsTrigger>
                <TabsTrigger value="ra-workload"><Users className="h-4 w-4 mr-1" />Charge RAs</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Card>
                  <CardHeader><CardTitle>Demandes en attente d'assignation</CardTitle><CardDescription>Assignez chaque demande à un RA selon son expertise et sa charge</CardDescription></CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucune demande en attente</p></div>
                    ) : (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{request.oec?.organizationName || request.oec?.fullName}</h3>
                                <Badge variant="outline">{request.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Domaine : {request.domain}</p>
                              <p className="text-sm text-muted-foreground">Soumise le : {new Date(request.submissionDate).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <Button onClick={() => openAssignDialog(request)}><UserPlus className="h-4 w-4 mr-2" />Assigner</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="non-receivable">
                <Card>
                  <CardHeader><CardTitle>Dossiers non recevables</CardTitle><CardDescription>Classez les dossiers déclarés non recevables</CardDescription></CardHeader>
                  <CardContent>
                    {nonReceivableRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun dossier non recevable</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Réf.</TableHead><TableHead>OEC</TableHead><TableHead>Domaine</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {nonReceivableRequests.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                              <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                              <TableCell>{r.domain}</TableCell>
                              <TableCell><Button size="sm" variant="destructive" onClick={() => openCloseDialog(r)}><Archive className="h-4 w-4 mr-1" />Classer</Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all">
                <Card>
                  <CardHeader><CardTitle>Tous les dossiers</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Réf.</TableHead><TableHead>OEC</TableHead><TableHead>Domaine</TableHead><TableHead>Statut</TableHead><TableHead>RA</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {allRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                            <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                            <TableCell>{r.domain}</TableCell>
                            <TableCell><Badge variant={r.status === "CLOSED" ? "secondary" : r.status === "NOT_RECEIVABLE" ? "destructive" : "outline"}>{r.status.replace(/_/g, " ")}</Badge></TableCell>
                            <TableCell>{r.assignedRa?.fullName || "—"}</TableCell>
                            <TableCell className="text-sm">{r.submissionDate ? new Date(r.submissionDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ra-workload">
                <Card>
                  <CardHeader><CardTitle>Charge de travail des RAs</CardTitle><CardDescription>Expertise et dossiers actifs</CardDescription></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>RA</TableHead><TableHead>Domaine d'expertise</TableHead><TableHead>Spécialité</TableHead><TableHead>Actifs</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {rasWorkload.map((ra) => (
                          <TableRow key={ra.id}>
                            <TableCell><div><p className="font-medium">{ra.fullName}</p><p className="text-xs text-muted-foreground">{ra.email}</p></div></TableCell>
                            <TableCell>{ra.domaineExpertise || "—"}</TableCell>
                            <TableCell>{ra.specialite || "—"}</TableCell>
                            <TableCell><Badge variant={ra.activeDossiers > 5 ? "destructive" : "outline"}>{ra.activeDossiers}</Badge></TableCell>
                            <TableCell>{ra.assignedDossiers}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* ASSIGN DIALOG */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Assigner à un Responsable d'Accréditation</DialogTitle>
                <DialogDescription>Sélectionnez le RA le plus compétent selon le domaine et la charge</DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-4 py-4">
                  <Alert><AlertDescription><strong>OEC :</strong> {selectedRequest.oec?.organizationName}<br /><strong>Domaine :</strong> {selectedRequest.domain}<br /><strong>Type :</strong> {selectedRequest.type}</AlertDescription></Alert>
                  <div className="space-y-2">
                    <Label>Responsable d'accréditation</Label>
                    <Select value={selectedRaId} onValueChange={setSelectedRaId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez un RA" /></SelectTrigger>
                      <SelectContent>
                        {getBestRAs(selectedRequest.domain).map((ra) => {
                          const isMatch = ra.domaineExpertise?.toLowerCase().includes(selectedRequest.domain?.toLowerCase());
                          return (
                            <SelectItem key={ra.id} value={ra.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{ra.fullName}</span>
                                {isMatch && <Badge variant="default" className="text-xs py-0 px-1">Match</Badge>}
                                <span className="text-muted-foreground text-xs">({ra.activeDossiers} actifs)</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRaId && (() => {
                    const ra = rasWorkload.find(r => r.id === parseInt(selectedRaId));
                    if (!ra) return null;
                    return (
                      <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                        <h4 className="font-medium text-sm">Profil du RA</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Expertise :</span><p className="font-medium">{ra.domaineExpertise || "—"}</p></div>
                          <div><span className="text-muted-foreground">Spécialité :</span><p className="font-medium">{ra.specialite || "—"}</p></div>
                          <div><span className="text-muted-foreground">Actifs :</span><p className="font-medium">{ra.activeDossiers}</p></div>
                          <div><span className="text-muted-foreground">Total :</span><p className="font-medium">{ra.assignedDossiers}</p></div>
                        </div>
                        {ra.activeDossiers > 5 && <Alert variant="destructive"><AlertDescription>Charge élevée ({ra.activeDossiers} dossiers actifs)</AlertDescription></Alert>}
                      </div>
                    );
                  })()}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>Annuler</Button>
                <Button onClick={handleAssign} disabled={assigning || !selectedRaId}>
                  {assigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assignation...</> : "Assigner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CLOSE DIALOG */}
          <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Classer le dossier</DialogTitle><DialogDescription>Ce dossier sera classé et archivé. L'OEC sera notifié.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Raison du classement *</Label>
                  <Textarea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="Raison du classement..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closing}>Annuler</Button>
                <Button variant="destructive" onClick={handleClose} disabled={closing || !closeReason.trim()}>
                  {closing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Classement...</> : "Classer le dossier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
