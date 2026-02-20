"""Helper script to write all workflow frontend pages."""
import os

BASE = r"c:\Users\la_no\OneDrive\Desktop\algerac-platform\client\src\pages"

files = {}

# ============================================================
# CD ManageRequestsPage.tsx
# ============================================================
files[os.path.join(BASE, "cd", "ManageRequestsPage.tsx")] = r'''import { useEffect, useState } from "react";
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
        <main className="p-8">
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
'''

# ============================================================
# RA Dashboard.tsx — Complete receivability workflow
# ============================================================
files[os.path.join(BASE, "ra", "Dashboard.tsx")] = r'''import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FileSearch, CheckCircle, XCircle, PlayCircle, FileSignature, AlertTriangle, Globe, Eye, ArrowRight, Send } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED_TO_RA: "Assigné",
  RECEIVABILITY_STUDY: "Étude en cours",
  RESOURCE_CHECK: "Vérification ressources",
  FOREIGN_EXPERT_PROPOSED: "Expert étranger proposé",
  PRELIMINARY_VISIT_PROPOSED: "Visite préliminaire proposée",
  PRELIMINARY_VISIT_ACCEPTED: "Visite acceptée",
  PRELIMINARY_VISIT_COMPLETED: "Visite terminée",
  OBSTACLES_IDENTIFIED: "Obstacles identifiés",
  PENDING_DG_VALIDATION: "Attente validation DG",
  DG_VALIDATED: "Validé par DG",
  RECEIVABLE: "Recevable",
  NOT_RECEIVABLE: "Non recevable",
  QUOTATION_PREPARATION: "Préparation devis",
  QUOTATION_SENT_TO_DAG: "Devis envoyé au DAG",
  DAG_APPROVED: "DAG approuvé",
  QUOTATION_SENT_TO_OEC: "Envoyé à l'OEC",
  QUOTATION_VALIDATED: "Devis validé par OEC",
  TEAM_DESIGNATION: "Constitution équipe",
  TEAM_SENT_TO_OEC: "Équipe envoyée à l'OEC",
  TEAM_VALIDATED: "Équipe validée",
  TEAM_RECUSED: "Équipe récusée",
  DOCUMENTARY_REVIEW: "Revue documentaire",
};

export default function RADashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Dialogs
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [dgPrepDialogOpen, setDgPrepDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);

  // Form state
  const [referenceNumber, setReferenceNumber] = useState("");
  const [decision, setDecision] = useState("");
  const [comments, setComments] = useState("");
  const [resourcesAvailable, setResourcesAvailable] = useState("");
  const [foreignExpertNeeded, setForeignExpertNeeded] = useState(false);
  const [visitNeeded, setVisitNeeded] = useState("");
  const [visitJustification, setVisitJustification] = useState("");
  const [dgSynthesis, setDgSynthesis] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadData();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadData = async () => {
    try {
      const res = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await res.json();
      setAllRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const newAssignments = allRequests.filter(r => r.status === "ASSIGNED_TO_RA");
  const inStudy = allRequests.filter(r => ["RECEIVABILITY_STUDY", "RESOURCE_CHECK", "FOREIGN_EXPERT_PROPOSED", "PRELIMINARY_VISIT_PROPOSED", "PRELIMINARY_VISIT_ACCEPTED", "PRELIMINARY_VISIT_COMPLETED", "OBSTACLES_IDENTIFIED", "PENDING_DG_VALIDATION"].includes(r.status));
  const validated = allRequests.filter(r => ["DG_VALIDATED", "RECEIVABLE"].includes(r.status));
  const inProgress = allRequests.filter(r => ["QUOTATION_PREPARATION", "QUOTATION_SENT_TO_DAG", "DAG_APPROVED", "QUOTATION_SENT_TO_OEC", "QUOTATION_VALIDATED", "TEAM_DESIGNATION", "TEAM_SENT_TO_OEC", "TEAM_VALIDATED", "TEAM_RECUSED", "DOCUMENTARY_REVIEW"].includes(r.status));

  // Actions
  const startStudy = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/start-study`);
      toast({ title: "Étude commencée", description: "L'étude de recevabilité a été lancée" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const openReferenceDialog = (request: any) => {
    setSelectedRequest(request);
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setReferenceNumber(`D-${year}-${num}`);
    setReferenceDialogOpen(true);
  };

  const handleSetReference = async () => {
    if (!referenceNumber.trim()) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/set-reference`, { referenceNumber: referenceNumber.trim() });
      toast({ title: "Numéro attribué", description: `Référence ${referenceNumber} attribuée` });
      setReferenceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openDecisionDialog = (request: any) => {
    setSelectedRequest(request);
    setDecision("");
    setComments("");
    setDecisionDialogOpen(true);
  };

  const handleDecision = async () => {
    if (!decision || !comments.trim()) { toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/receivability-decision`, {
        isReceivable: decision === "receivable",
        comments,
      });
      toast({ title: "Décision enregistrée", description: `Demande déclarée ${decision === "receivable" ? "recevable" : "non recevable"}` });
      setDecisionDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openResourceDialog = (request: any) => {
    setSelectedRequest(request);
    setResourcesAvailable("");
    setForeignExpertNeeded(false);
    setResourceDialogOpen(true);
  };

  const handleResourceCheck = async () => {
    if (!resourcesAvailable) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/resource-check`, {
        resourcesAvailable: resourcesAvailable === "yes",
        foreignExpertNeeded,
        comments,
      });
      toast({ title: "Vérification enregistrée" });
      setResourceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openVisitDialog = (request: any) => {
    setSelectedRequest(request);
    setVisitNeeded("");
    setVisitJustification("");
    setVisitDialogOpen(true);
  };

  const handleVisitDecision = async () => {
    if (!visitNeeded) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/preliminary-visit-decision`, {
        visitNeeded: visitNeeded === "yes",
        justification: visitJustification,
      });
      toast({ title: "Décision enregistrée", description: visitNeeded === "yes" ? "Visite préliminaire proposée à l'OEC" : "Pas de visite nécessaire" });
      setVisitDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openDGPrepDialog = (request: any) => {
    setSelectedRequest(request);
    setDgSynthesis("");
    setDgPrepDialogOpen(true);
  };

  const handleDGPrep = async () => {
    if (!dgSynthesis.trim()) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/prepare-dg-validation`, {
        synthesis: dgSynthesis,
      });
      toast({ title: "Dossier transmis", description: "Le dossier a été transmis au DG pour validation" });
      setDgPrepDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openNotifyDialog = (request: any) => {
    setSelectedRequest(request);
    setNotifyDialogOpen(true);
  };

  const handleNotifyReceivable = async () => {
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/notify-receivable`, {});
      toast({ title: "OEC notifié", description: "L'OEC a été notifié de la recevabilité. Note de synthèse envoyée au CD." });
      setNotifyDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const getStepActions = (request: any) => {
    switch (request.status) {
      case "ASSIGNED_TO_RA":
        return !request.referenceNumber ? (
          <Button size="sm" onClick={() => openReferenceDialog(request)}><FileSignature className="mr-2 h-4 w-4" />Attribuer numéro</Button>
        ) : (
          <Button size="sm" onClick={() => startStudy(request.id)}><PlayCircle className="mr-2 h-4 w-4" />Commencer l'étude</Button>
        );
      case "RECEIVABILITY_STUDY":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openResourceDialog(request)}><Globe className="mr-1 h-4 w-4" />Ressources</Button>
            <Button size="sm" onClick={() => openDecisionDialog(request)}>Décision</Button>
          </div>
        );
      case "RESOURCE_CHECK":
        return <Button size="sm" onClick={() => openVisitDialog(request)}><Eye className="mr-1 h-4 w-4" />Visite préliminaire</Button>;
      case "PRELIMINARY_VISIT_COMPLETED":
        return <Button size="sm" onClick={() => openDGPrepDialog(request)}><Send className="mr-1 h-4 w-4" />Préparer dossier DG</Button>;
      case "DG_VALIDATED":
        return <Button size="sm" onClick={() => openNotifyDialog(request)}><CheckCircle className="mr-1 h-4 w-4" />Notifier OEC</Button>;
      case "RECEIVABLE":
        return <Button size="sm" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 3 : Devis</Button>;
      case "QUOTATION_VALIDATED":
        return <Button size="sm" onClick={() => setLocation(`/ra/equipe-evaluation`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 4 : Équipe</Button>;
      case "TEAM_VALIDATED":
        return <Button size="sm" onClick={() => setLocation(`/ra/revue-documentaire`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 5 : Revue</Button>;
      default:
        return <Badge variant="secondary">{STATUS_LABELS[request.status] || request.status}</Badge>;
    }
  };

  const getProgress = (status: string) => {
    const steps = ["ASSIGNED_TO_RA","RECEIVABILITY_STUDY","RESOURCE_CHECK","PENDING_DG_VALIDATION","DG_VALIDATED","RECEIVABLE","QUOTATION_PREPARATION","DAG_APPROVED","QUOTATION_VALIDATED","TEAM_DESIGNATION","TEAM_VALIDATED","DOCUMENTARY_REVIEW"];
    const idx = steps.indexOf(status);
    return idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 5;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Responsable d'Accréditation</h1>
                <p className="text-muted-foreground">Gérez l'ensemble du processus d'accréditation pour vos dossiers</p>
              </div>

              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600">{newAssignments.length}</div><p className="text-xs text-muted-foreground">Nouvelles assignations</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{inStudy.length}</div><p className="text-xs text-muted-foreground">Étude recevabilité</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{validated.length}</div><p className="text-xs text-muted-foreground">Validés / Recevables</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{inProgress.length}</div><p className="text-xs text-muted-foreground">En progression</p></CardContent></Card>
              </div>

              <Tabs defaultValue="new" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="new">Assignations ({newAssignments.length})</TabsTrigger>
                  <TabsTrigger value="study">Recevabilité ({inStudy.length})</TabsTrigger>
                  <TabsTrigger value="validated">Validés ({validated.length})</TabsTrigger>
                  <TabsTrigger value="progress">En cours ({inProgress.length})</TabsTrigger>
                  <TabsTrigger value="all">Tous ({allRequests.length})</TabsTrigger>
                </TabsList>

                {/* Each tab renders the request table with appropriate actions */}
                {[
                  { value: "new", data: newAssignments, title: "Nouvelles assignations", desc: "Attribuez un numéro de référence puis démarrez l'étude" },
                  { value: "study", data: inStudy, title: "Étude de recevabilité", desc: "Vérifiez les ressources, décidez de la visite préliminaire, préparez le dossier DG" },
                  { value: "validated", data: validated, title: "Dossiers validés par DG", desc: "Notifiez l'OEC et passez à la contractualisation" },
                  { value: "progress", data: inProgress, title: "Dossiers en progression", desc: "Contractualisation, équipe d'évaluation, revue documentaire" },
                  { value: "all", data: allRequests, title: "Tous les dossiers", desc: "Vue complète de tous vos dossiers" },
                ].map(({ value, data, title, desc }) => (
                  <TabsContent key={value} value={value}>
                    <Card>
                      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{desc}</CardDescription></CardHeader>
                      <CardContent>
                        {data.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Aucun dossier</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>OEC</TableHead>
                                <TableHead>Domaine</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Progression</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.map((request: any) => (
                                <TableRow key={request.id}>
                                  <TableCell className="font-mono font-medium">{request.referenceNumber || <Badge variant="secondary">En attente</Badge>}</TableCell>
                                  <TableCell>{request.oec?.organizationName || request.oec?.fullName}</TableCell>
                                  <TableCell>{request.domain}</TableCell>
                                  <TableCell><Badge variant="outline">{STATUS_LABELS[request.status] || request.status.replace(/_/g, " ")}</Badge></TableCell>
                                  <TableCell><Progress value={getProgress(request.status)} className="w-20" /></TableCell>
                                  <TableCell>{getStepActions(request)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Reference Dialog */}
              <Dialog open={referenceDialogOpen} onOpenChange={setReferenceDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader><DialogTitle>Attribuer un numéro de référence</DialogTitle><DialogDescription>Numéro unique pour identifier ce dossier</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Numéro de référence *</Label>
                      <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="D-2026-001" />
                      <p className="text-xs text-muted-foreground">Format : D-ANNÉE-NUMÉRO</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReferenceDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleSetReference} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Attribuer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Receivability Decision Dialog */}
              <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Décision de recevabilité</DialogTitle><DialogDescription>Évaluez la conformité du dossier</DialogDescription></DialogHeader>
                  {selectedRequest && (
                    <div className="space-y-4 py-4">
                      <div className="border rounded-lg p-4 bg-muted/50 grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Référence:</span><p className="font-mono font-medium">{selectedRequest.referenceNumber}</p></div>
                        <div><span className="text-muted-foreground">OEC:</span><p className="font-medium">{selectedRequest.oec?.organizationName}</p></div>
                        <div><span className="text-muted-foreground">Type:</span><p className="font-medium">{selectedRequest.type}</p></div>
                        <div><span className="text-muted-foreground">Domaine:</span><p className="font-medium">{selectedRequest.domain}</p></div>
                      </div>
                      <div className="space-y-3">
                        <Label>Décision *</Label>
                        <RadioGroup value={decision} onValueChange={setDecision}>
                          <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="receivable" id="r1" /><Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle className="h-5 w-5 text-green-600" /><div><p className="font-medium">Recevable</p><p className="text-sm text-muted-foreground">Conforme, passe à l'étape suivante</p></div></Label></div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="not-receivable" id="r2" /><Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-600" /><div><p className="font-medium">Non recevable</p><p className="text-sm text-muted-foreground">L'OEC devra corriger et resoumettre</p></div></Label></div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2"><Label>Commentaires *</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Justification détaillée..." rows={4} /></div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDecisionDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleDecision} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Resource Check Dialog */}
              <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Vérification des ressources</DialogTitle><DialogDescription>Vérifiez la disponibilité des évaluateurs et experts</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Ressources disponibles ? *</Label>
                      <RadioGroup value={resourcesAvailable} onValueChange={setResourcesAvailable}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="res-y" /><Label htmlFor="res-y">Oui — évaluateurs compétents disponibles</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="res-n" /><Label htmlFor="res-n">Non — besoin d'experts étrangers</Label></div>
                      </RadioGroup>
                    </div>
                    {resourcesAvailable === "no" && (
                      <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>L'OEC sera consulté pour accepter les frais supplémentaires liés à l'intervention d'experts étrangers.</AlertDescription></Alert>
                    )}
                    <div className="space-y-2"><Label>Commentaires</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Détails..." rows={3} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResourceDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleResourceCheck} disabled={processing || !resourcesAvailable}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Valider</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Preliminary Visit Dialog */}
              <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Visite préliminaire</DialogTitle><DialogDescription>Décidez si une visite préliminaire est nécessaire</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Visite préliminaire nécessaire ? *</Label>
                      <RadioGroup value={visitNeeded} onValueChange={setVisitNeeded}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="v-y" /><Label htmlFor="v-y">Oui — une visite du site est nécessaire</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="v-n" /><Label htmlFor="v-n">Non — le dossier peut être traité sans visite</Label></div>
                      </RadioGroup>
                    </div>
                    {visitNeeded === "yes" && (
                      <div className="space-y-2"><Label>Justification *</Label><Textarea value={visitJustification} onChange={(e) => setVisitJustification(e.target.value)} placeholder="Pourquoi la visite est nécessaire..." rows={3} /></div>
                    )}
                    <Alert><AlertDescription>Si oui, l'OEC sera informé et devra accepter la visite préliminaire.</AlertDescription></Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setVisitDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleVisitDecision} disabled={processing || !visitNeeded}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* DG Preparation Dialog */}
              <Dialog open={dgPrepDialogOpen} onOpenChange={setDgPrepDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Préparer le dossier pour le DG</DialogTitle><DialogDescription>Rédigez la note de synthèse pour validation par le Directeur Général</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert><AlertDescription>Le DG validera la recevabilité du dossier sur la base de votre synthèse. Cette étape est obligatoire avant de notifier l'OEC.</AlertDescription></Alert>
                    <div className="space-y-2"><Label>Note de synthèse pour le DG *</Label><Textarea value={dgSynthesis} onChange={(e) => setDgSynthesis(e.target.value)} placeholder="Résumez les conclusions de votre étude de recevabilité..." rows={8} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDgPrepDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleDGPrep} disabled={processing || !dgSynthesis.trim()}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Transmettre au DG</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Notify OEC Dialog */}
              <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Notifier l'OEC de la recevabilité</DialogTitle><DialogDescription>L'OEC sera informé que sa demande est recevable. Une note de synthèse sera envoyée au CD.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Le dossier a été validé par le DG. L'OEC recevra une notification et vous pourrez passer à l'étape de contractualisation.</AlertDescription></Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleNotifyReceivable} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Notifier et continuer</Button>
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
'''

# ============================================================
# DG Dashboard.tsx — Add Receivability Validation Tab
# ============================================================
files[os.path.join(BASE, "dg", "Dashboard.tsx")] = r'''import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Stamp, CheckCircle2, XCircle, Clock, FileCheck, TrendingUp, Award, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DGDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingValidation, setPendingValidation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [validationDecision, setValidationDecision] = useState("");
  const [validationComments, setValidationComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ordersRes, reqRes, pendingRes] = await Promise.all([
        fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" }),
        fetch("/api/requests", { credentials: "include" }),
        fetch("/api/requests/pending-dg-validation", { credentials: "include" }),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (reqRes.ok) { const d = await reqRes.json(); setRequests(Array.isArray(d) ? d : []); }
      if (pendingRes.ok) { const d = await pendingRes.json(); setPendingValidation(Array.isArray(d) ? d : []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDGApproval = async (orderId: number) => {
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/approve-dg`, { notes: reviewNotes });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission approuvé" });
        setShowReview(false); setSelectedOrder(null); setReviewNotes(""); loadData();
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setProcessing(false);
  };

  const handleReceivabilityValidation = async () => {
    if (!validationDecision || !selectedRequest) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/dg-validate-receivability`, {
        approved: validationDecision === "approved",
        comments: validationComments,
      });
      toast({
        title: "Décision enregistrée",
        description: validationDecision === "approved" ? "Recevabilité validée" : "Recevabilité rejetée — le RA sera notifié",
      });
      setShowValidation(false); setSelectedRequest(null); setValidationDecision(""); setValidationComments(""); loadData();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setProcessing(false);
  };

  if (!user) return null;
  const pendingDG = orders.filter((o: any) => o.status === "DT_APPROVED");
  const allApproved = orders.filter((o: any) => ["FULLY_APPROVED","SENT_TO_MEMBER","IN_PROGRESS","COMPLETED"].includes(o.status));
  const accredited = requests.filter((r: any) => r.status === "CAS_DECISION_GRANT").length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Direction Générale</h1>
                <p className="text-muted-foreground mt-1">{user.fullName} — Directrice Générale d'ALGERAC</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Recevabilité à valider</p><p className="text-2xl font-bold text-purple-600">{pendingValidation.length}</p></div><ShieldCheck className="w-8 h-8 text-purple-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ordres à signer</p><p className="text-2xl font-bold text-amber-600">{pendingDG.length}</p></div><Stamp className="w-8 h-8 text-amber-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Missions approuvées</p><p className="text-2xl font-bold">{allApproved.length}</p></div><CheckCircle2 className="w-8 h-8 text-green-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Dossiers actifs</p><p className="text-2xl font-bold">{requests.length}</p></div><TrendingUp className="w-8 h-8 text-blue-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Accréditations</p><p className="text-2xl font-bold text-green-600">{accredited}</p></div><Award className="w-8 h-8 text-primary/60" /></CardContent></Card>
              </div>

              <Tabs defaultValue="receivability">
                <TabsList className="mb-4">
                  <TabsTrigger value="receivability"><ShieldCheck className="w-4 h-4 mr-1" />Validation recevabilité ({pendingValidation.length})</TabsTrigger>
                  <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" />Ordres de mission ({pendingDG.length})</TabsTrigger>
                  <TabsTrigger value="approved"><CheckCircle2 className="w-4 h-4 mr-1" />Approuvés ({allApproved.length})</TabsTrigger>
                  <TabsTrigger value="overview"><TrendingUp className="w-4 h-4 mr-1" />Vue d'ensemble</TabsTrigger>
                </TabsList>

                {/* RECEIVABILITY VALIDATION TAB */}
                <TabsContent value="receivability">
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation de Recevabilité</CardTitle>
                      <CardDescription>Validez ou rejetez la recevabilité des dossiers préparés par les RAs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingValidation.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Référence</TableHead>
                              <TableHead>OEC</TableHead>
                              <TableHead>Domaine</TableHead>
                              <TableHead>RA</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingValidation.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono font-medium">{r.referenceNumber || `#${r.id}`}</TableCell>
                                <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                                <TableCell>{r.domain}</TableCell>
                                <TableCell>{r.assignedRa?.fullName || "—"}</TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={() => { setSelectedRequest(r); setValidationDecision(""); setValidationComments(""); setShowValidation(true); }}>
                                    <ShieldCheck className="w-4 h-4 mr-1" />Évaluer
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun dossier en attente de validation</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* MISSION ORDERS TAB */}
                <TabsContent value="pending">
                  <Card>
                    <CardHeader><CardTitle>Ordres de Mission — Signature DG</CardTitle><CardDescription>Ordres approuvés par la DT nécessitant votre signature</CardDescription></CardHeader>
                    <CardContent>
                      {pendingDG.length > 0 ? (
                        <Table>
                          <TableHeader><TableRow><TableHead>N° Ordre</TableHead><TableHead>Dossier</TableHead><TableHead>Dates</TableHead><TableHead>Destination</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {pendingDG.map((o: any) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                                <TableCell>Dossier #{o.requestId}</TableCell>
                                <TableCell className="text-sm">{o.startDate ? `${new Date(o.startDate).toLocaleDateString("fr-FR")} — ${new Date(o.endDate).toLocaleDateString("fr-FR")}` : "—"}</TableCell>
                                <TableCell className="text-sm">{o.destination || "—"}</TableCell>
                                <TableCell><Button size="sm" onClick={() => { setSelectedOrder(o); setShowReview(true); }}><Stamp className="w-4 h-4 mr-1" />Signer</Button></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre en attente</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="approved">
                  <Card><CardContent className="pt-6">
                    {allApproved.length > 0 ? (
                      <Table>
                        <TableHeader><TableRow><TableHead>N° Ordre</TableHead><TableHead>Dossier</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {allApproved.map((o: any) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                              <TableCell>Dossier #{o.requestId}</TableCell>
                              <TableCell><Badge variant="outline">{o.status === "FULLY_APPROVED" ? "Finalisé" : o.status}</Badge></TableCell>
                              <TableCell className="text-sm">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-center text-muted-foreground py-8">Aucun ordre approuvé</p>}
                  </CardContent></Card>
                </TabsContent>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Répartition des Dossiers</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { label: "En traitement", count: requests.filter((r: any) => !["CAS_DECISION_GRANT","CAS_DECISION_REFUSAL","REJECTED","CLOSED"].includes(r.status)).length, color: "bg-blue-500" },
                            { label: "Accrédités", count: accredited, color: "bg-green-500" },
                            { label: "Refusés/Classés", count: requests.filter((r: any) => ["CAS_DECISION_REFUSAL","REJECTED","CLOSED"].includes(r.status)).length, color: "bg-red-500" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${item.color}`} /><span className="text-sm flex-1">{item.label}</span><span className="font-bold">{item.count}</span></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Activité Récente</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {requests.slice(0, 5).map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                              <div><p className="text-sm font-medium">{r.referenceNumber || `#${r.id}`}</p><p className="text-xs text-muted-foreground">{r.domain}</p></div>
                              <Badge variant="outline" className="text-xs">{r.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Mission Order Signing Dialog */}
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader><DialogTitle>Signature DG — Ordre de Mission</DialogTitle><DialogDescription>{selectedOrder?.orderNumber || `OM-${selectedOrder?.id}`} — Dossier #{selectedOrder?.requestId}</DialogDescription></DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-muted-foreground">Dates</p><p>{selectedOrder.startDate ? `${new Date(selectedOrder.startDate).toLocaleDateString("fr-FR")} — ${new Date(selectedOrder.endDate).toLocaleDateString("fr-FR")}` : "—"}</p></div>
                    <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-muted-foreground">Destination</p><p>{selectedOrder.destination || "—"}</p></div>
                  </div>
                  <div className="p-2 bg-green-50 rounded text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span>Approuvé par la DT</span></div>
                  <div><label className="text-sm font-medium">Notes (optionnel)</label><Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Observations..." rows={3} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                <Button onClick={() => handleDGApproval(selectedOrder?.id)} disabled={processing}>{processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Stamp className="w-4 h-4 mr-2" />}Signer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Receivability Validation Dialog */}
          <Dialog open={showValidation} onOpenChange={setShowValidation}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Validation de Recevabilité — DG</DialogTitle><DialogDescription>Évaluez et validez la recevabilité de ce dossier</DialogDescription></DialogHeader>
              {selectedRequest && (
                <div className="space-y-4 py-4">
                  <div className="border rounded-lg p-4 bg-muted/50 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Référence:</span><p className="font-mono font-medium">{selectedRequest.referenceNumber}</p></div>
                    <div><span className="text-muted-foreground">OEC:</span><p className="font-medium">{selectedRequest.oec?.organizationName}</p></div>
                    <div><span className="text-muted-foreground">Domaine:</span><p className="font-medium">{selectedRequest.domain}</p></div>
                    <div><span className="text-muted-foreground">RA:</span><p className="font-medium">{selectedRequest.assignedRa?.fullName || "—"}</p></div>
                  </div>
                  <div className="space-y-3">
                    <Label>Décision *</Label>
                    <RadioGroup value={validationDecision} onValueChange={setValidationDecision}>
                      <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="approved" id="dg-a" /><Label htmlFor="dg-a" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle2 className="h-5 w-5 text-green-600" /><div><p className="font-medium">Valider la recevabilité</p><p className="text-sm text-muted-foreground">Le dossier est conforme et peut passer à la contractualisation</p></div></Label></div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="rejected" id="dg-r" /><Label htmlFor="dg-r" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-600" /><div><p className="font-medium">Rejeter</p><p className="text-sm text-muted-foreground">Le dossier nécessite des corrections supplémentaires</p></div></Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2"><Label>Commentaires</Label><Textarea value={validationComments} onChange={(e) => setValidationComments(e.target.value)} placeholder="Observations de la Direction Générale..." rows={4} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidation(false)} disabled={processing}>Annuler</Button>
                <Button onClick={handleReceivabilityValidation} disabled={processing || !validationDecision}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  {validationDecision === "approved" ? "Valider" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
'''

# ============================================================
# OEC ValidateQuotationPage.tsx — Enhanced with convention signing + payment
# ============================================================
files[os.path.join(BASE, "oec", "ValidateQuotationPage.tsx")] = r'''import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, FileText, CreditCard, FileSignature, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

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
  
  const [request, setRequest] = useState<any>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [convention, setConvention] = useState<Convention | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [conventionSigned, setConventionSigned] = useState(false);
  const [quotationAccepted, setQuotationAccepted] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, quotRes, convRes] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { credentials: "include" }),
        fetch(`/api/quotations/by-request/${requestId}`, { credentials: "include" }),
        fetch(`/api/conventions/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (quotRes.ok) { const q = await quotRes.json(); if (q.length > 0) setQuotation(q[0]); }
      if (convRes.ok) { const c = await convRes.json(); if (c.length > 0) setConvention(c[0]); }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!conventionSigned || !quotationAccepted) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez accepter le devis ET signer la convention" });
      return;
    }
    try {
      setValidating(true);
      await apiRequest("POST", `/api/requests/${requestId}/oec-validate-quotation`, {
        accepted: true,
        conventionSigned: true,
      });
      toast({ title: "Succès", description: "Devis accepté et convention signée. Vous serez redirigé vers le paiement." });
      setTimeout(() => setLocation(`/oec/paiement/${requestId}`), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  const handleReject = async () => {
    try {
      setValidating(true);
      await apiRequest("POST", `/api/requests/${requestId}/oec-validate-quotation`, { accepted: false });
      toast({ title: "Devis refusé", description: "Le processus d'accréditation sera arrêté", variant: "destructive" });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Validation du Devis et Convention</h1>
              <p className="text-muted-foreground mt-2">Examinez le devis et la convention pour votre demande d'accréditation</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}<br /><strong>Type :</strong> {request.type}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>10 jours</strong> pour accepter ou refuser le devis et signer la convention. Un rappel sera envoyé au bout de 5 jours.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="quotation">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quotation"><FileText className="h-4 w-4 mr-2" />Devis</TabsTrigger>
                <TabsTrigger value="convention"><FileSignature className="h-4 w-4 mr-2" />Convention</TabsTrigger>
              </TabsList>

              <TabsContent value="quotation">
                <Card>
                  <CardHeader><CardTitle>Devis d'Accréditation</CardTitle><CardDescription>Détail des frais proposés par ALGERAC</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {quotation ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">N° Devis</p><p className="font-mono font-medium">{quotation.quotationNumber}</p></div>
                          <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">Montant</p><p className="text-2xl font-bold text-primary">{quotation.amount?.toLocaleString("fr-FR")} DA</p></div>
                        </div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Détails</p><p className="whitespace-pre-wrap">{quotation.details}</p></div>
                        {quotation.dagComments && <div className="border rounded-lg p-4 bg-blue-50"><p className="text-sm text-muted-foreground mb-1">Commentaires DAG</p><p>{quotation.dagComments}</p></div>}
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <input type="checkbox" id="accept-quotation" checked={quotationAccepted} onChange={(e) => setQuotationAccepted(e.target.checked)} className="h-5 w-5" />
                          <label htmlFor="accept-quotation" className="cursor-pointer"><p className="font-medium">J'accepte le devis</p><p className="text-sm text-muted-foreground">Je confirme avoir pris connaissance du montant et des détails</p></label>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucun devis disponible</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convention">
                <Card>
                  <CardHeader><CardTitle>Convention d'Accréditation</CardTitle><CardDescription>Termes et conditions de l'accréditation</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {convention ? (
                      <>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">N° Convention</p><p className="font-mono font-medium">{convention.conventionNumber}</p></div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Contenu</p><p className="whitespace-pre-wrap">{convention.content}</p></div>
                        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">Termes et Conditions</p><p className="whitespace-pre-wrap">{convention.termsAndConditions}</p></div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <input type="checkbox" id="sign-convention" checked={conventionSigned} onChange={(e) => setConventionSigned(e.target.checked)} className="h-5 w-5" />
                          <label htmlFor="sign-convention" className="cursor-pointer"><p className="font-medium">Je signe la convention</p><p className="text-sm text-muted-foreground">Je m'engage à respecter les termes et conditions</p></label>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucune convention disponible</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {quotation && convention && (
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="destructive" onClick={handleReject} disabled={validating} className="flex-1">
                      Refuser le devis
                    </Button>
                    <Button onClick={handleValidate} disabled={validating || !quotationAccepted || !conventionSigned} className="flex-1">
                      {validating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><CreditCard className="mr-2 h-4 w-4" />Accepter et procéder au paiement</>}
                    </Button>
                  </div>
                  {(!quotationAccepted || !conventionSigned) && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">Acceptez le devis et signez la convention pour continuer</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
'''

# ============================================================
# OEC ValidateTeamPage.tsx — Enhanced with recusation PRO 22
# ============================================================
files[os.path.join(BASE, "oec", "ValidateTeamPage.tsx")] = r'''import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Users, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface TeamMember {
  id: number;
  expert: { id: number; fullName: string; email: string; specialite: string };
  role: string;
  specialization: string;
  confidentialityAgreementSigned: boolean;
}

const roleLabels: Record<string, string> = {
  REE: "Responsable Équipe Évaluation",
  ET: "Évaluateur Technique",
  EXP: "Expert",
  EQ: "Évaluateur Qualité",
  SUP: "Superviseur",
  OBS: "Observateur",
  EF: "Évaluateur en Formation",
};

export default function ValidateTeamPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recuseDialogOpen, setRecuseDialogOpen] = useState(false);
  const [recusedMemberIds, setRecusedMemberIds] = useState<number[]>([]);
  const [recuseReason, setRecuseReason] = useState("");

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (reqRes.ok) setRequest(await reqRes.json());

      const teamRes = await fetch(`/api/workflow/teams/by-request/${requestId}`, { credentials: "include" });
      if (teamRes.ok) {
        const teams = await teamRes.json();
        if (teams.length > 0) {
          setTeam(teams[0]);
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) setMembers(await memRes.json());
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
        accepted: true,
      });
      toast({ title: "Équipe validée", description: "L'équipe d'évaluation a été validée. La revue documentaire peut commencer." });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setProcessing(false); }
  };

  const toggleRecuseMember = (memberId: number) => {
    setRecusedMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleRecuse = async () => {
    if (recusedMemberIds.length === 0 || !recuseReason.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez au moins un membre et indiquez la raison" });
      return;
    }
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
        accepted: false,
        recusedMemberIds,
        recuseReason,
      });
      toast({ title: "Récusation enregistrée", description: "Le RA sera notifié et devra proposer une nouvelle équipe (PRO 22)" });
      setRecuseDialogOpen(false);
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Validation de l'Équipe d'Évaluation</h1>
              <p className="text-muted-foreground mt-2">Examinez la composition de l'équipe proposée par ALGERAC</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>3 jours</strong> pour accepter ou récuser des membres de l'équipe. Sans réponse dans ce délai, la composition sera considérée comme acceptée.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Composition de l'Équipe (FOR 26)</CardTitle>
                <CardDescription>Fiche de composition de l'équipe d'évaluation</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun membre dans l'équipe</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Évaluateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Spécialisation</TableHead>
                        <TableHead>Engagement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell><div><p className="font-medium">{m.expert?.fullName}</p><p className="text-xs text-muted-foreground">{m.expert?.email}</p></div></TableCell>
                          <TableCell><Badge variant="outline">{roleLabels[m.role] || m.role}</Badge></TableCell>
                          <TableCell>{m.specialization || m.expert?.specialite || "—"}</TableCell>
                          <TableCell>{m.confidentialityAgreementSigned ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Shield className="h-4 w-4 text-gray-300" />}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="destructive" onClick={() => { setRecuseDialogOpen(true); setRecusedMemberIds([]); setRecuseReason(""); }} disabled={processing} className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />Récuser des membres (PRO 22)
                  </Button>
                  <Button onClick={handleAccept} disabled={processing} className="flex-1">
                    {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : <><CheckCircle className="mr-2 h-4 w-4" />Accepter l'équipe</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={recuseDialogOpen} onOpenChange={setRecuseDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Récusation de membres (PRO 22)</DialogTitle><DialogDescription>Sélectionnez les membres à récuser et indiquez votre justification</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Membres à récuser :</Label>
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" checked={recusedMemberIds.includes(m.id)} onChange={() => toggleRecuseMember(m.id)} className="h-4 w-4" />
                      <div className="flex-1"><p className="font-medium">{m.expert?.fullName}</p><p className="text-xs text-muted-foreground">{roleLabels[m.role] || m.role}</p></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2"><Label>Raison de la récusation *</Label><Textarea value={recuseReason} onChange={(e) => setRecuseReason(e.target.value)} placeholder="Justifiez votre récusation (conflit d'intérêts, manque d'impartialité, etc.)..." rows={4} /></div>
                <Alert><AlertDescription>Conformément à la procédure PRO 22, le RA devra proposer de nouveaux membres pour remplacer les membres récusés.</AlertDescription></Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecuseDialogOpen(false)} disabled={processing}>Annuler</Button>
                <Button variant="destructive" onClick={handleRecuse} disabled={processing || recusedMemberIds.length === 0 || !recuseReason.trim()}>
                  {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : "Confirmer la récusation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
'''

# ============================================================
# OEC DocumentaryResponsePage.tsx — Enhanced with 3-month deadline
# ============================================================
files[os.path.join(BASE, "oec", "DocumentaryResponsePage.tsx")] = r'''import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryResponsePage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, revRes] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/documentary-review/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!response.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Rédigez votre réponse" }); return; }
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/documentary-response`, { response, documentsProvided: true });
      toast({ title: "Réponse envoyée", description: "Votre réponse aux insuffisances documentaires a été transmise" });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const deficiencies = reviews.filter((r: any) => r.deficienciesIdentified);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Réponse aux Insuffisances Documentaires</h1>
              <p className="text-muted-foreground mt-2">Répondez aux observations de l'équipe d'évaluation</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>3 mois</strong> pour répondre aux insuffisances documentaires. Passé ce délai, le dossier sera classé par le CD.
              </AlertDescription>
            </Alert>

            {deficiencies.map((review: any) => (
              <Card key={review.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Insuffisances identifiées</CardTitle>
                  <CardDescription>Revue du {new Date(review.reviewStartDate).toLocaleDateString("fr-FR")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 p-4 rounded-lg"><p className="whitespace-pre-wrap">{review.deficienciesDetails}</p></div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader><CardTitle><FileText className="inline h-5 w-5 mr-2" />Votre Réponse</CardTitle><CardDescription>Décrivez les corrections apportées et les documents complémentaires fournis</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Réponse détaillée *</Label>
                  <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Détaillez les corrections apportées, les documents mis à jour ou ajoutés..." rows={10} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !response.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer la réponse</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
'''

# ============================================================
# OEC LiftObstaclesPage.tsx — Enhanced
# ============================================================
files[os.path.join(BASE, "oec", "LiftObstaclesPage.tsx")] = r'''import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function LiftObstaclesPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (res.ok) setRequest(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!description.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Décrivez les mesures prises" }); return; }
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/lift-obstacles`, { description, resolved: true });
      toast({ title: "Obstacles levés", description: "Votre réponse a été transmise. Le processus continue." });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Levée des Obstacles</h1>
              <p className="text-muted-foreground mt-2">Suite à la visite préliminaire, des obstacles bloquants ont été identifiés</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le rapport de visite préliminaire (FOR 12) a identifié des obstacles bloquants.
                Vous devez décrire les mesures correctives prises pour lever ces obstacles avant que le processus puisse continuer.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader><CardTitle>Mesures Correctives</CardTitle><CardDescription>Décrivez les actions entreprises pour résoudre chaque obstacle identifié</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Description des mesures prises *</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pour chaque obstacle identifié, décrivez les mesures correctives mises en place..." rows={10} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !description.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><CheckCircle className="mr-2 h-4 w-4" />Confirmer la levée des obstacles</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
'''

# Write all files
for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {filepath}")

print(f"\nDone! Wrote {len(files)} files.")
