import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Search, DollarSign, Building2, Filter, Eye, CreditCard, XCircle, Send, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface PaymentRecord {
  id: number;
  requestId: number;
  requestReferenceNumber: string;
  oecName: string;
  oecEmail: string;
  paymentType: string;
  amount: number;
  status: string;
  transactionId?: string;
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
  proofDocumentName?: string;
  dagValidated?: boolean;
  dagComments?: string;
  dagValidatedDate?: string;
  requestRef?: string;
  dueDate?: string;
  currency?: string;
  invoiceNumber?: string;
}

export default function DAGPaymentTracking() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("awaiting-fees");
  
  // Set fee dialog
  const [setFeeDialogOpen, setSetFeeDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [settingFee, setSettingFee] = useState(false);
  
  // Verification dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyPayment, setVerifyPayment] = useState<PaymentRecord | null>(null);
  const [verifyComments, setVerifyComments] = useState("");
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPayment, setDetailsPayment] = useState<PaymentRecord | null>(null);

  // Create fee dialog (PRO_18 arbitrary invoice)
  const [createFeeOpen, setCreateFeeOpen] = useState(false);
  const [creatingFee, setCreatingFee] = useState(false);
  const [createFeeForm, setCreateFeeForm] = useState({
    requestId: "", paymentType: "ANNUAL_FEE", amount: "",
    currency: "DZD", dueDays: "60", invoiceNumber: ""
  });

  useEffect(() => {
    if (user && !authLoading) loadPayments();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/payments/all");
      const data = await res.json();
      setPayments(data);
    } catch (err: any) {
      setPayments([]);
    } finally { setLoading(false); }
  };

  // ── Fee Setting ──────────────────────────────────────────────────────────

  const openSetFeeDialog = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setFeeAmount("");
    setSetFeeDialogOpen(true);
  };

  const handleSetFee = async () => {
    if (!selectedPayment || !feeAmount || parseFloat(feeAmount) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez saisir un montant valide" });
      return;
    }
    try {
      setSettingFee(true);
      await apiRequest("POST", `/api/payments/${selectedPayment.id}/set-fee`, {
        amount: parseFloat(feeAmount)
      });
      toast({ 
        title: "Frais fixés", 
        description: `Frais d'enregistrement fixés à ${parseFloat(feeAmount).toLocaleString()} DA. L'OEC sera notifié.` 
      });
      setSetFeeDialogOpen(false);
      loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSettingFee(false); }
  };

  // ── Payment Verification ─────────────────────────────────────────────────

  const openVerifyDialog = (payment: PaymentRecord) => {
    setVerifyPayment(payment);
    setVerifyComments("");
    setVerifyDialogOpen(true);
  };

  const handleValidatePayment = async () => {
    if (!verifyPayment) return;
    try {
      setValidating(true);
      await apiRequest("POST", `/api/payments/${verifyPayment.id}/validate`, {
        comments: verifyComments
      });
      toast({ 
        title: "Paiement validé", 
        description: "Le paiement a été validé avec succès." 
      });
      setVerifyDialogOpen(false);
      loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  const handleRejectPayment = async () => {
    if (!verifyPayment) return;
    if (!verifyComments.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez indiquer la raison du rejet" });
      return;
    }
    try {
      setRejecting(true);
      await apiRequest("POST", `/api/payments/${verifyPayment.id}/reject`, {
        comments: verifyComments
      });
      toast({ 
        title: "Paiement rejeté", 
        description: "L'OEC sera notifié et devra resoumettre une preuve de paiement." 
      });
      setVerifyDialogOpen(false);
      loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setRejecting(false); }
  };

  // ── Create arbitrary fee (PRO_18) ─────────────────────────────────────

  const handleCreateFee = async () => {
    const { requestId, paymentType, amount, currency, dueDays, invoiceNumber } = createFeeForm;
    if (!requestId.trim() || !amount || parseFloat(amount) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "ID demande et montant valide requis" });
      return;
    }
    try {
      setCreatingFee(true);
      await apiRequest("POST", "/api/payments/create-fee", {
        requestId: parseInt(requestId),
        paymentType, amount: parseFloat(amount),
        currency: currency || "DZD",
        dueDays: parseInt(dueDays) || 60,
        invoiceNumber: invoiceNumber.trim() || undefined,
      });
      toast({ title: "Facture créée", description: "L'OEC a été notifié de la nouvelle facture." });
      setCreateFeeOpen(false);
      setCreateFeeForm({ requestId: "", paymentType: "ANNUAL_FEE", amount: "", currency: "DZD", dueDays: "60", invoiceNumber: "" });
      loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingFee(false); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────

  const isOverdue = (p: PaymentRecord) => p.dueDate && new Date(p.dueDate) < new Date() && p.status === "PENDING";

  const awaitingFees = payments.filter(p => p.status === "AWAITING_FEE_SETTING");
  const awaitingValidation = payments.filter(p => p.status === "PROOF_SUBMITTED");
  const overduePayments = payments.filter(isOverdue);
  const allFiltered = payments.filter(p => {
    const matchSearch = (p.oecName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.requestReferenceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.transactionId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const fmtPaymentType = (t: string) => ({
    REGISTRATION_FEE: "Inscription dossier", EVALUATION_FEE: "Frais d'évaluation",
    ANNUAL_FEE: "Redevance annuelle", SURVEILLANCE_FEE: "Surveillance",
    RENEWAL_FEE: "Renouvellement", EXTENSION_FEE: "Extension de portée",
    SUSPENSION_LIFT_FEE: "Levée de suspension", TRANSFER_FEE: "Transfert forfaitaire",
    CERTIFICATE_DELIVERY_FEE: "Délivrance certificat", COMPLEMENTARY_EVAL_FEE: "Éval. complémentaire",
    ADDITIONAL_EVAL_FEE: "Éval. supplémentaire", MULTISITE_FEE: "Multi-sites",
  }[t] || t.replace(/_/g, " "));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AWAITING_FEE_SETTING": return <Badge className="bg-amber-500 text-white">Frais à fixer</Badge>;
      case "PENDING": return <Badge className="bg-yellow-500 text-white">En attente paiement</Badge>;
      case "PROOF_SUBMITTED": return <Badge className="bg-blue-500 text-white">Preuve reçue</Badge>;
      case "DAG_VALIDATED": return <Badge className="bg-green-600 text-white">Validé</Badge>;
      case "DAG_REJECTED": return <Badge className="bg-red-500 text-white">Rejeté</Badge>;
      case "COMPLETED": return <Badge className="bg-green-700 text-white">Complété</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: payments.length,
    awaitingFees: awaitingFees.length,
    awaitingValidation: awaitingValidation.length,
    validated: payments.filter(p => p.status === "DAG_VALIDATED" || p.status === "COMPLETED").length,
    overdue: overduePayments.length,
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
                <p className="text-muted-foreground mt-2">
                  Fixez les frais d'enregistrement et vérifiez les preuves de paiement des organismes
                </p>
              </div>
              <Button onClick={() => setCreateFeeOpen(true)}>
                <DollarSign className="w-4 h-4 mr-2" />Créer une facture
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total paiements</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.awaitingFees > 0 ? "ring-2 ring-amber-400" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Frais à fixer</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.awaitingFees}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.awaitingValidation > 0 ? "ring-2 ring-blue-400" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Preuves à vérifier</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.awaitingValidation}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Validés</p>
                      <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.overdue > 0 ? "ring-2 ring-red-400" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En retard</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="awaiting-fees" className="gap-1 text-xs">
                  <DollarSign className="h-4 w-4" />
                  Frais à fixer ({awaitingFees.length})
                </TabsTrigger>
                <TabsTrigger value="awaiting-validation" className="gap-1 text-xs">
                  <FileText className="h-4 w-4" />
                  Preuves ({awaitingValidation.length})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="gap-1 text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  En retard ({overduePayments.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-1 text-xs">
                  <CreditCard className="h-4 w-4" />
                  Tous
                </TabsTrigger>
              </TabsList>

              {/* Tab: Frais à fixer */}
              <TabsContent value="awaiting-fees">
                <Card>
                  <CardHeader>
                    <CardTitle>Dossiers en attente de fixation des frais d'enregistrement</CardTitle>
                    <CardDescription>
                      Ces organismes ont soumis une demande d'accréditation. Fixez les frais d'enregistrement pour chaque dossier.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : awaitingFees.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Aucun dossier en attente de fixation des frais</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Référence</TableHead>
                              <TableHead>Organisme</TableHead>
                              <TableHead>Date de soumission</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {awaitingFees.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-mono text-sm">
                                  {payment.requestReferenceNumber || `#${payment.requestId}`}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{payment.oecName || "N/A"}</p>
                                    <p className="text-xs text-muted-foreground">{payment.oecEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{new Date(payment.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => openSetFeeDialog(payment)}>
                                    <DollarSign className="w-4 h-4 mr-1" /> Fixer les frais
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Preuves à vérifier */}
              <TabsContent value="awaiting-validation">
                <Card>
                  <CardHeader>
                    <CardTitle>Preuves de paiement à vérifier</CardTitle>
                    <CardDescription>
                      Ces organismes ont soumis une preuve de paiement. Vérifiez la validité de la transaction et validez ou rejetez le paiement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : awaitingValidation.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Aucune preuve de paiement en attente de vérification</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Référence</TableHead>
                              <TableHead>Organisme</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Transaction ID</TableHead>
                              <TableHead>Preuve</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {awaitingValidation.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-mono text-sm">
                                  {payment.requestReferenceNumber || `#${payment.requestId}`}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{payment.oecName || "N/A"}</p>
                                    <p className="text-xs text-muted-foreground">{payment.oecEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {payment.paymentType === "EVALUATION_FEE" ? "Évaluation" 
                                      : payment.paymentType === "REGISTRATION_FEE" ? "Enregistrement" 
                                      : payment.paymentType || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-semibold">{Number(payment.amount).toLocaleString()} DA</TableCell>
                                <TableCell className="font-mono text-sm">{payment.transactionId || "N/A"}</TableCell>
                                <TableCell>
                                  {payment.proofDocumentName ? (
                                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                                      <FileText className="w-3 h-3 mr-1" />{payment.proofDocumentName}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" onClick={() => openVerifyDialog(payment)}>
                                    <Eye className="w-4 h-4 mr-1" /> Vérifier
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: En retard */}
              <TabsContent value="overdue">
                <Card>
                  <CardHeader>
                    <CardTitle>Paiements en retard</CardTitle>
                    <CardDescription>Factures dont la date d'échéance est dépassée et le paiement non reçu (PRO_18 §6).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overduePayments.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Aucun paiement en retard</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="text-xs">
                              <TableHead>Référence</TableHead><TableHead>Facture</TableHead>
                              <TableHead>Organisme</TableHead><TableHead>Type</TableHead>
                              <TableHead>Montant</TableHead><TableHead>Devise</TableHead>
                              <TableHead>Échéance</TableHead><TableHead>Retard</TableHead>
                              <TableHead>Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {overduePayments.map(p => {
                              const daysLate = p.dueDate ? Math.floor((new Date().getTime() - new Date(p.dueDate).getTime()) / 86400000) : 0;
                              return (
                                <TableRow key={p.id} className="bg-red-50/60 text-xs">
                                  <TableCell className="font-mono">{p.requestReferenceNumber || `#${p.requestId}`}</TableCell>
                                  <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                                  <TableCell><div className="font-medium">{p.oecName}</div><div className="text-muted-foreground">{p.oecEmail}</div></TableCell>
                                  <TableCell>{fmtPaymentType(p.paymentType)}</TableCell>
                                  <TableCell className="font-semibold tabular-nums">{Number(p.amount).toLocaleString()} {p.currency || "DZD"}</TableCell>
                                  <TableCell className="font-mono">{p.currency || "DZD"}</TableCell>
                                  <TableCell className="text-red-700 font-medium">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                                  <TableCell><span className="text-red-700 font-bold">{daysLate}j de retard</span></TableCell>
                                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Tous les paiements */}
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>Tous les paiements ({allFiltered.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par organisme, référence, transaction..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : allFiltered.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Aucun paiement trouvé</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Référence</TableHead>
                              <TableHead>Facture</TableHead>
                              <TableHead>Organisme</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Dev.</TableHead>
                              <TableHead>Échéance</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allFiltered.map((payment) => (
                              <TableRow key={payment.id} className={isOverdue(payment) ? "bg-red-50/60" : ""}>
                                <TableCell className="font-mono text-xs">{payment.requestReferenceNumber || `#${payment.requestId}`}</TableCell>
                                <TableCell className="font-mono text-xs">{payment.invoiceNumber || "—"}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{payment.oecName || "N/A"}</p>
                                    <p className="text-xs text-muted-foreground">{payment.oecEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{fmtPaymentType(payment.paymentType)}</Badge>
                                </TableCell>
                                <TableCell className="font-semibold tabular-nums text-sm">
                                  {payment.amount > 0 ? Number(payment.amount).toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{payment.currency || "DZD"}</TableCell>
                                <TableCell className={isOverdue(payment) ? "text-red-700 font-medium text-xs" : "text-xs"}>
                                  {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("fr-FR") : "—"}
                                  {isOverdue(payment) && <div className="text-red-600 text-xs">En retard</div>}
                                </TableCell>
                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => { setDetailsPayment(payment); setDetailsOpen(true); }}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {payment.status === "AWAITING_FEE_SETTING" && (
                                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => openSetFeeDialog(payment)}>
                                        <DollarSign className="w-4 h-4 mr-1" /> Fixer
                                      </Button>
                                    )}
                                    {payment.status === "PROOF_SUBMITTED" && (
                                      <Button size="sm" onClick={() => openVerifyDialog(payment)}>
                                        <CheckCircle className="w-4 h-4 mr-1" /> Vérifier
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialog: Fixer les frais */}
      <Dialog open={setFeeDialogOpen} onOpenChange={setSetFeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fixer les frais d'enregistrement</DialogTitle>
            <DialogDescription>
              Dossier {selectedPayment?.requestReferenceNumber || `#${selectedPayment?.requestId}`} — {selectedPayment?.oecName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant des frais d'enregistrement (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="Ex: 5000"
              />
              <p className="text-xs text-muted-foreground">
                Ce montant sera communiqué à l'OEC qui devra le payer pour que son dossier soit traité.
              </p>
            </div>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                L'OEC sera notifié par email et devra se connecter à la plateforme pour effectuer le paiement.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetFeeDialogOpen(false)}>Annuler</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSetFee} disabled={settingFee || !feeAmount}>
              {settingFee ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Fixer et envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vérifier la preuve de paiement */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vérification du paiement</DialogTitle>
            <DialogDescription>
              Dossier {verifyPayment?.requestReferenceNumber || `#${verifyPayment?.requestId}`} — {verifyPayment?.oecName}
            </DialogDescription>
          </DialogHeader>
          {verifyPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Montant</Label>
                  <p className="font-bold text-lg">{Number(verifyPayment.amount).toLocaleString()} DA</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Identifiant transaction</Label>
                  <p className="font-mono font-medium">{verifyPayment.transactionId || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Organisme</Label>
                  <p className="font-medium">{verifyPayment.oecName}</p>
                  <p className="text-xs text-muted-foreground">{verifyPayment.oecEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Date paiement</Label>
                  <p>{verifyPayment.paymentDate ? new Date(verifyPayment.paymentDate).toLocaleDateString("fr-FR") : "-"}</p>
                </div>
              </div>

              {verifyPayment.proofDocumentName && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Preuve de paiement jointe</p>
                      <p className="text-sm text-blue-700">{verifyPayment.proofDocumentName}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Commentaires (obligatoire en cas de rejet)</Label>
                <Textarea
                  value={verifyComments}
                  onChange={(e) => setVerifyComments(e.target.value)}
                  placeholder="Observations sur la vérification du paiement..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={handleValidatePayment} 
                  disabled={validating || rejecting}
                >
                  {validating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><CheckCircle className="mr-2 h-4 w-4" />Valider le paiement</>}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={handleRejectPayment} 
                  disabled={validating || rejecting}
                >
                  {rejecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejet...</> : <><XCircle className="mr-2 h-4 w-4" />Rejeter</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Créer une facture PRO_18 */}
      <Dialog open={createFeeOpen} onOpenChange={setCreateFeeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Créer une facture — PRO_18</DialogTitle>
            <DialogDescription>Émettez une facture pour tout type de frais (redevance annuelle, surveillance, levée de suspension, etc.)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>ID Demande *</Label>
                <Input type="number" value={createFeeForm.requestId} onChange={e => setCreateFeeForm({ ...createFeeForm, requestId: e.target.value })} placeholder="ex: 42" />
              </div>
              <div className="col-span-2">
                <Label>Type de frais *</Label>
                <Select value={createFeeForm.paymentType} onValueChange={v => {
                  const dueDays = v === "ANNUAL_FEE" ? "60" : "20";
                  setCreateFeeForm({ ...createFeeForm, paymentType: v, dueDays });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL_FEE">Redevance annuelle (§5.5 — 60j)</SelectItem>
                    <SelectItem value="SURVEILLANCE_FEE">Surveillance (§5.6)</SelectItem>
                    <SelectItem value="RENEWAL_FEE">Renouvellement (§5.7)</SelectItem>
                    <SelectItem value="EXTENSION_FEE">Extension de portée (§5.8)</SelectItem>
                    <SelectItem value="SUSPENSION_LIFT_FEE">Levée de suspension (§5.11)</SelectItem>
                    <SelectItem value="TRANSFER_FEE">Transfert forfaitaire (§5.12)</SelectItem>
                    <SelectItem value="CERTIFICATE_DELIVERY_FEE">Délivrance certificat (§5.4/5.14)</SelectItem>
                    <SelectItem value="COMPLEMENTARY_EVAL_FEE">Évaluation complémentaire (§5.9)</SelectItem>
                    <SelectItem value="ADDITIONAL_EVAL_FEE">Évaluation supplémentaire (§5.10)</SelectItem>
                    <SelectItem value="MULTISITE_FEE">Multi-sites (§5.13)</SelectItem>
                    <SelectItem value="EVALUATION_FEE">Frais d'évaluation (§5.2)</SelectItem>
                    <SelectItem value="REGISTRATION_FEE">Frais d'inscription (§5.1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant *</Label>
                <Input type="number" min="0" value={createFeeForm.amount} onChange={e => setCreateFeeForm({ ...createFeeForm, amount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Devise</Label>
                <Select value={createFeeForm.currency} onValueChange={v => setCreateFeeForm({ ...createFeeForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DZD">DZD (Nationaux — CPA)</SelectItem>
                    <SelectItem value="EUR">EUR (Étrangers — BEA)</SelectItem>
                    <SelectItem value="USD">USD (Étrangers — BEA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Délai de paiement (jours)</Label>
                <Input type="number" min="1" value={createFeeForm.dueDays} onChange={e => setCreateFeeForm({ ...createFeeForm, dueDays: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">20j évaluation · 60j redevance annuelle</p>
              </div>
              <div>
                <Label>N° Facture (facultatif)</Label>
                <Input value={createFeeForm.invoiceNumber} onChange={e => setCreateFeeForm({ ...createFeeForm, invoiceNumber: e.target.value })} placeholder="FACT-2025-00001" />
                <p className="text-xs text-muted-foreground mt-1">Auto-généré si vide</p>
              </div>
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-xs">
                L'OEC sera notifié par email. Le paiement devra être effectué par virement CPA (nationaux) ou BEA SWIFT <span className="font-mono">BEXADZAL038</span> (étrangers) dans le délai imparti.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFeeOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateFee} disabled={creatingFee}>
              {creatingFee ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><Send className="mr-2 h-4 w-4" />Émettre la facture</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Détails paiement */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>{detailsPayment?.requestReferenceNumber || `#${detailsPayment?.requestId}`}</DialogDescription>
          </DialogHeader>
          {detailsPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground text-xs">Organisme</Label><p className="font-medium">{detailsPayment.oecName}</p></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><p>{detailsPayment.oecEmail}</p></div>
                <div><Label className="text-muted-foreground text-xs">Montant</Label><p className="font-bold text-lg">{detailsPayment.amount > 0 ? `${Number(detailsPayment.amount).toLocaleString()} ${detailsPayment.currency || "DZD"}` : "Non fixé"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Statut</Label><p>{getStatusBadge(detailsPayment.status)}</p></div>
                <div><Label className="text-muted-foreground text-xs">Transaction ID</Label><p className="font-mono">{detailsPayment.transactionId || "-"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Date de création</Label><p>{new Date(detailsPayment.createdAt).toLocaleDateString("fr-FR")}</p></div>
                {detailsPayment.invoiceNumber && (<div><Label className="text-muted-foreground text-xs">N° Facture</Label><p className="font-mono">{detailsPayment.invoiceNumber}</p></div>)}
                {detailsPayment.dueDate && (<div><Label className="text-muted-foreground text-xs">Échéance</Label><p className={isOverdue(detailsPayment) ? "text-red-600 font-semibold" : ""}>{new Date(detailsPayment.dueDate).toLocaleDateString("fr-FR")}{isOverdue(detailsPayment) && " ⚠ Dépassée"}</p></div>)}
                {detailsPayment.proofDocumentName && (
                  <div><Label className="text-muted-foreground text-xs">Preuve paiement</Label><p>{detailsPayment.proofDocumentName}</p></div>
                )}
                {detailsPayment.dagComments && (
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Commentaires DAG</Label><p>{detailsPayment.dagComments}</p></div>
                )}
                {detailsPayment.dagValidatedDate && (
                  <div><Label className="text-muted-foreground text-xs">Date validation DAG</Label><p>{new Date(detailsPayment.dagValidatedDate).toLocaleDateString("fr-FR")}</p></div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
