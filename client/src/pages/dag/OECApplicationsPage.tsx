import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, DollarSign, Building2, Eye, CheckCircle, XCircle, CreditCard, FileText, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface OECApplication {
  id: number;
  nomOrganisme: string;
  typeOrganisme: string;
  adresseSiege: string;
  telephone: string;
  email: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  status: string;
  rejectionReason?: string;
  manquements?: string;
  createdAt: string;
  reviewedByDtAt?: string;
  depositFeeAmount?: number;
  feeSetAt?: string;
  paymentDeadline?: string;
  paymentVerifiedAt?: string;
}

export default function OECApplicationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<OECApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("awaiting-fee");

  // Set fee dialog
  const [setFeeDialogOpen, setSetFeeDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<OECApplication | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [settingFee, setSettingFee] = useState(false);

  // Verify payment dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyApp, setVerifyApp] = useState<OECApplication | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(false);

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsApp, setDetailsApp] = useState<OECApplication | null>(null);

  useEffect(() => {
    if (user && !authLoading) loadApplications();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/oec-applications/dag/all");
      const data = await res.json();
      setApplications(data);
    } catch (err: any) {
      console.error("Erreur chargement candidatures OEC:", err);
      setApplications([]);
    } finally { setLoading(false); }
  };

  // ── Fee Setting ──────────────────────────────────────────────────────

  const openSetFeeDialog = (app: OECApplication) => {
    setSelectedApp(app);
    setFeeAmount("");
    setSetFeeDialogOpen(true);
  };

  const handleSetFee = async () => {
    if (!selectedApp || !feeAmount || parseFloat(feeAmount) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez saisir un montant valide" });
      return;
    }
    try {
      setSettingFee(true);
      await apiRequest("POST", `/api/oec-applications/${selectedApp.id}/set-deposit-fee`, {
        amount: parseFloat(feeAmount),
        dagUserId: user!.id
      });
      toast({
        title: "Frais fixés",
        description: `Frais de dépôt fixés à ${parseFloat(feeAmount).toLocaleString()} DA. L'OEC sera notifié par email.`
      });
      setSetFeeDialogOpen(false);
      loadApplications();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de fixer les frais" });
    } finally { setSettingFee(false); }
  };

  // ── Payment Verification ─────────────────────────────────────────────

  const openVerifyDialog = (app: OECApplication) => {
    setVerifyApp(app);
    setVerifyDialogOpen(true);
  };

  const handleVerifyPayment = async () => {
    if (!verifyApp) return;
    try {
      setVerifying(true);
      await apiRequest("POST", `/api/oec-applications/${verifyApp.id}/verify-payment`, {
        dagUserId: user!.id
      });
      toast({
        title: "Paiement vérifié",
        description: "Le paiement a été confirmé. L'administrateur sera notifié pour créer le compte."
      });
      setVerifyDialogOpen(false);
      loadApplications();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de vérifier le paiement" });
    } finally { setVerifying(false); }
  };

  const handleRejectNonPayment = async () => {
    if (!verifyApp) return;
    try {
      setRejectingPayment(true);
      await apiRequest("POST", `/api/oec-applications/${verifyApp.id}/reject-non-payment`, {
        dagUserId: user!.id
      });
      toast({
        title: "Candidature rejetée",
        description: "La candidature a été rejetée pour non-paiement. L'OEC sera notifié."
      });
      setVerifyDialogOpen(false);
      loadApplications();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de rejeter" });
    } finally { setRejectingPayment(false); }
  };

  // ── Filtering ────────────────────────────────────────────────────────

  const matchSearch = (app: OECApplication) =>
    (app.nomOrganisme || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.nomRepresentant || "").toLowerCase().includes(searchTerm.toLowerCase());

  const awaitingFee = applications.filter(a => a.status === "AWAITING_DAG_FEE" && matchSearch(a));
  const awaitingPayment = applications.filter(a => a.status === "FEE_SET_AWAITING_PAYMENT" && matchSearch(a));
  const allFiltered = applications.filter(matchSearch);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AWAITING_DAG_FEE": return <Badge className="bg-amber-500">Frais à fixer</Badge>;
      case "FEE_SET_AWAITING_PAYMENT": return <Badge className="bg-yellow-500">En attente paiement</Badge>;
      case "PAYMENT_VERIFIED": return <Badge className="bg-green-500">Paiement vérifié</Badge>;
      case "PAYMENT_EXPIRED": return <Badge className="bg-red-500">Paiement expiré</Badge>;
      case "ACCOUNT_CREATED": return <Badge className="bg-teal-500">Compte créé</Badge>;
      case "REJECTED_BY_DT": return <Badge className="bg-red-500">Rejeté par DT</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const stats = {
    total: applications.length,
    awaitingFee: applications.filter(a => a.status === "AWAITING_DAG_FEE").length,
    awaitingPayment: applications.filter(a => a.status === "FEE_SET_AWAITING_PAYMENT").length,
    verified: applications.filter(a => a.status === "PAYMENT_VERIFIED" || a.status === "ACCOUNT_CREATED").length,
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Candidatures OEC - Frais & Paiements</h1>
              <p className="text-muted-foreground mt-2">
                Fixez les frais de dépôt et vérifiez les paiements des organismes candidats
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total candidatures</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.awaitingFee > 0 ? "ring-2 ring-amber-400" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Frais à fixer</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.awaitingFee}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.awaitingPayment > 0 ? "ring-2 ring-blue-400" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente paiement</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.awaitingPayment}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vérifiés</p>
                      <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par organisme, email, représentant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="awaiting-fee" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Frais à fixer ({awaitingFee.length})
                </TabsTrigger>
                <TabsTrigger value="awaiting-payment" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  En attente paiement ({awaitingPayment.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Historique
                </TabsTrigger>
              </TabsList>

              {/* Tab: Frais à fixer */}
              <TabsContent value="awaiting-fee">
                <Card>
                  <CardHeader>
                    <CardTitle>Candidatures en attente de fixation des frais de dépôt</CardTitle>
                    <CardDescription>Ces candidatures ont été approuvées par la DT et nécessitent la fixation des frais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : awaitingFee.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune candidature en attente de frais</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Organisme</TableHead>
                            <TableHead>Représentant</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Date demande</TableHead>
                            <TableHead>Approuvé DT</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {awaitingFee.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.nomOrganisme}</TableCell>
                              <TableCell>{app.nomRepresentant}</TableCell>
                              <TableCell>{app.email}</TableCell>
                              <TableCell>{formatDate(app.createdAt)}</TableCell>
                              <TableCell>{formatDate(app.reviewedByDtAt)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { setDetailsApp(app); setDetailsOpen(true); }}>
                                    <Eye className="h-4 w-4 mr-1" /> Détails
                                  </Button>
                                  <Button size="sm" onClick={() => openSetFeeDialog(app)}>
                                    <DollarSign className="h-4 w-4 mr-1" /> Fixer frais
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

              {/* Tab: En attente paiement */}
              <TabsContent value="awaiting-payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Candidatures en attente de vérification du paiement</CardTitle>
                    <CardDescription>Les frais ont été fixés, l'OEC doit envoyer la preuve de paiement par email</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : awaitingPayment.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune candidature en attente de paiement</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Organisme</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Frais fixés le</TableHead>
                            <TableHead>Date limite</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {awaitingPayment.map((app) => {
                            const isExpired = app.paymentDeadline && new Date(app.paymentDeadline) < new Date();
                            return (
                              <TableRow key={app.id} className={isExpired ? "bg-red-50" : ""}>
                                <TableCell className="font-medium">{app.nomOrganisme}</TableCell>
                                <TableCell>{app.email}</TableCell>
                                <TableCell className="font-bold">{app.depositFeeAmount?.toLocaleString()} DA</TableCell>
                                <TableCell>{formatDate(app.feeSetAt)}</TableCell>
                                <TableCell>
                                  <span className={isExpired ? "text-red-600 font-bold" : ""}>
                                    {formatDate(app.paymentDeadline)}
                                    {isExpired && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => { setDetailsApp(app); setDetailsOpen(true); }}>
                                      <Eye className="h-4 w-4 mr-1" /> Détails
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openVerifyDialog(app)}>
                                      <CheckCircle className="h-4 w-4 mr-1" /> Vérifier
                                    </Button>
                                    {isExpired && (
                                      <Button size="sm" variant="destructive" onClick={() => { setVerifyApp(app); handleRejectNonPayment(); }}>
                                        <XCircle className="h-4 w-4 mr-1" /> Rejeter
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Historique */}
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>Toutes les candidatures OEC</CardTitle>
                    <CardDescription>Historique complet des candidatures passées par la DAG</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : allFiltered.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune candidature trouvée</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Organisme</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date demande</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allFiltered.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.nomOrganisme}</TableCell>
                              <TableCell>{app.email}</TableCell>
                              <TableCell>{app.depositFeeAmount ? `${app.depositFeeAmount.toLocaleString()} DA` : "-"}</TableCell>
                              <TableCell>{getStatusBadge(app.status)}</TableCell>
                              <TableCell>{formatDate(app.createdAt)}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => { setDetailsApp(app); setDetailsOpen(true); }}>
                                  <Eye className="h-4 w-4 mr-1" /> Détails
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
          </div>

          {/* Set Fee Dialog */}
          <Dialog open={setFeeDialogOpen} onOpenChange={setSetFeeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fixer les frais de dépôt</DialogTitle>
                <DialogDescription>
                  Organisme : {selectedApp?.nomOrganisme}<br />
                  L'OEC recevra un email avec le montant et les instructions de paiement.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Montant des frais de dépôt (DA) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex: 50000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  L'OEC aura 1 mois pour effectuer le paiement et envoyer la preuve par email.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSetFeeDialogOpen(false)} disabled={settingFee}>
                  Annuler
                </Button>
                <Button onClick={handleSetFee} disabled={settingFee || !feeAmount}>
                  {settingFee && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirmer les frais
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Verify Payment Dialog */}
          <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vérification du paiement</DialogTitle>
                <DialogDescription>
                  Organisme : {verifyApp?.nomOrganisme}<br />
                  Montant attendu : {verifyApp?.depositFeeAmount?.toLocaleString()} DA<br />
                  Date limite : {formatDate(verifyApp?.paymentDeadline)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm">
                  Avez-vous reçu et vérifié la preuve de paiement envoyée par email par l'OEC ?
                </p>
                {verifyApp?.paymentDeadline && new Date(verifyApp.paymentDeadline) < new Date() && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-700">La date limite de paiement est dépassée.</span>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setVerifyDialogOpen(false)} disabled={verifying || rejectingPayment}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleRejectNonPayment} disabled={verifying || rejectingPayment}>
                  {rejectingPayment && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Rejeter (non-paiement)
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleVerifyPayment} disabled={verifying || rejectingPayment}>
                  {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirmer le paiement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails de la candidature</DialogTitle>
              </DialogHeader>
              {detailsApp && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Organisme</Label>
                      <p className="font-medium">{detailsApp.nomOrganisme}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">{detailsApp.typeOrganisme}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Adresse</Label>
                      <p className="font-medium">{detailsApp.adresseSiege}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Téléphone</Label>
                      <p className="font-medium">{detailsApp.telephone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{detailsApp.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Représentant</Label>
                      <p className="font-medium">{detailsApp.nomRepresentant} ({detailsApp.fonction})</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Portée d'accréditation</Label>
                      <p className="font-medium">{detailsApp.porteeAccreditation}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Statut</Label>
                      <div className="mt-1">{getStatusBadge(detailsApp.status)}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date de soumission</Label>
                      <p className="font-medium">{formatDate(detailsApp.createdAt)}</p>
                    </div>
                    {detailsApp.depositFeeAmount && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Montant des frais</Label>
                          <p className="font-medium">{detailsApp.depositFeeAmount.toLocaleString()} DA</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Frais fixés le</Label>
                          <p className="font-medium">{formatDate(detailsApp.feeSetAt)}</p>
                        </div>
                      </>
                    )}
                    {detailsApp.paymentDeadline && (
                      <div>
                        <Label className="text-muted-foreground">Date limite paiement</Label>
                        <p className="font-medium">{formatDate(detailsApp.paymentDeadline)}</p>
                      </div>
                    )}
                    {detailsApp.paymentVerifiedAt && (
                      <div>
                        <Label className="text-muted-foreground">Paiement vérifié le</Label>
                        <p className="font-medium">{formatDate(detailsApp.paymentVerifiedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
