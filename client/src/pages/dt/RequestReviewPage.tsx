import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FileCheck, XCircle, CheckCircle, Eye, Clock, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  description: string;
  submissionDate: string;
  dtReviewComments: string;
  oec: { id: number; organizationName: string; email: string; fullName: string };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_DT_REVIEW: { label: "En attente de vérification", variant: "secondary" },
  DT_APPROVED: { label: "Validée", variant: "default" },
  DT_REJECTED: { label: "Rejetée", variant: "destructive" },
  PENDING_CD_ASSIGNMENT: { label: "Transmise au CD", variant: "default" },
};

export default function DTRequestReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<AccreditationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AccreditationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccreditationRequest | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadData();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        apiRequest("GET", "/api/requests/pending-dt-review"),
        apiRequest("GET", "/api/requests"),
      ]);
      setPendingRequests(await pendingRes.json());
      const allData = await allRes.json();
      setAllRequests(Array.isArray(allData) ? allData : allData.data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (r: AccreditationRequest) => {
    setSelectedRequest(r);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const openDetailDialog = async (r: AccreditationRequest) => {
    setLoadingDetail(true);
    setDetailDialogOpen(true);
    try {
      const res = await apiRequest("GET", `/api/requests/${r.id}/full-details`);
      setDetailRequest(await res.json());
    } catch {
      setDetailRequest(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedRequest) return;
    if (!approved && !reviewComments.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez indiquer les raisons du rejet" });
      return;
    }
    try {
      setReviewing(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/dt-review`, {
        approved,
        comments: reviewComments,
      });
      toast({
        title: approved ? "Documents validés" : "Documents rejetés",
        description: approved
          ? "La demande a été transmise au Chef de Département."
          : "L'OEC a été notifié des corrections nécessaires.",
      });
      setReviewDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  const reviewedRequests = allRequests.filter(
    (r) => r.status !== "PENDING_DT_REVIEW" && r.status !== "DRAFT"
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Vérification des Demandes d'Accréditation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifiez les documents soumis par les OEC avant transmission au Chef de Département
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">En attente de vérification</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold">
                    {allRequests.filter((r) => ["DT_APPROVED", "PENDING_CD_ASSIGNMENT", "ASSIGNED_TO_RA"].includes(r.status)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Validées</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
                <div>
                  <p className="text-2xl font-bold">
                    {allRequests.filter((r) => r.status === "DT_REJECTED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Rejetées</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                En attente ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Toutes les demandes ({allRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Demandes en attente de vérification
                  </CardTitle>
                  <CardDescription>
                    Vérifiez les documents et validez ou rejetez la demande
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : pendingRequests.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune demande en attente de vérification</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Organisme</TableHead>
                          <TableHead>Domaine</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date soumission</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono font-medium">{r.referenceNumber || `#${r.id}`}</TableCell>
                            <TableCell>{r.oec?.organizationName || "—"}</TableCell>
                            <TableCell>{r.domain}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{r.type}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(r.submissionDate)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openDetailDialog(r)}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Voir
                                </Button>
                                <Button size="sm" className="bg-[#00A63E] hover:bg-[#009235]" onClick={() => openReviewDialog(r)}>
                                  <FileCheck className="w-3.5 h-3.5 mr-1" /> Vérifier
                                </Button>
                              </div>
                            </TableCell>
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
                <CardHeader>
                  <CardTitle>Toutes les demandes</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : allRequests.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune demande</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Organisme</TableHead>
                          <TableHead>Domaine</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date soumission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRequests.filter(r => r.status !== "DRAFT").map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono font-medium">{r.referenceNumber || `#${r.id}`}</TableCell>
                            <TableCell>{r.oec?.organizationName || "—"}</TableCell>
                            <TableCell>{r.domain}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[r.status]?.variant || "outline"}>
                                {statusConfig[r.status]?.label || r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(r.submissionDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Review Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Vérification des documents</DialogTitle>
                <DialogDescription>
                  {selectedRequest && (
                    <>
                      Demande <strong>{selectedRequest.referenceNumber}</strong> — {selectedRequest.oec?.organizationName}
                      <br />
                      Domaine : {selectedRequest.domain} | Type : {selectedRequest.type}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Commentaires / Observations</Label>
                  <Textarea
                    className="mt-1"
                    rows={4}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="Observations sur les documents soumis (obligatoire en cas de rejet)..."
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(false)}
                  disabled={reviewing}
                >
                  {reviewing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  Rejeter
                </Button>
                <Button
                  className="bg-[#00A63E] hover:bg-[#009235]"
                  onClick={() => handleReview(true)}
                  disabled={reviewing}
                >
                  {reviewing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Valider & Transmettre au CD
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Detail Dialog */}
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails de la demande</DialogTitle>
              </DialogHeader>
              {loadingDetail ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : detailRequest ? (
                <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Référence</p>
                      <p className="font-mono font-medium">{detailRequest.request?.referenceNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <Badge>{detailRequest.request?.status}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Domaine</p>
                      <p>{detailRequest.request?.domain}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p>{detailRequest.request?.type}</p>
                    </div>
                  </div>
                  {detailRequest.oecProfile && (
                    <div className="border-t pt-3">
                      <h4 className="font-semibold mb-2">Informations OEC</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Organisme</p>
                          <p>{detailRequest.oecProfile.organizationName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p>{detailRequest.oecProfile.typeOrganisme}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p>{detailRequest.oecProfile.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Représentant</p>
                          <p>{detailRequest.oecProfile.nomRepresentant}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Portée d'accréditation</p>
                          <p>{detailRequest.oecProfile.porteeAccreditation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {detailRequest.request?.description && (
                    <div className="border-t pt-3">
                      <h4 className="font-semibold mb-2">Description / Documents</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48">
                        {detailRequest.request.description}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Impossible de charger les détails</p>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
