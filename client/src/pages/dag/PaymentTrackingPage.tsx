import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Search, DollarSign, Building2, Filter, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface PaymentRecord {
  id: number;
  oecName: string;
  oecEmail: string;
  type: "deposit" | "quotation" | "other";
  typeLabel: string;
  amount: number;
  reference: string;
  status: "PENDING" | "PROOF_SENT" | "VALIDATED" | "REJECTED";
  createdAt: string;
  proofSentAt?: string;
  validatedAt?: string;
  requestRef?: string;
}

export default function DAGPaymentTracking() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [validating, setValidating] = useState(false);

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
      // Use mock data for now
      setPayments([
        {
          id: 1, oecName: "ENACT", oecEmail: "enact@example.dz", type: "deposit", typeLabel: "Frais de dépôt",
          amount: 15000, reference: "PAY-2026-001", status: "PROOF_SENT",
          createdAt: "2026-02-15", proofSentAt: "2026-02-16"
        },
        {
          id: 2, oecName: "CETIC", oecEmail: "cetic@example.dz", type: "quotation", typeLabel: "Devis d'évaluation",
          amount: 350000, reference: "PAY-2026-002", status: "VALIDATED",
          createdAt: "2026-02-10", validatedAt: "2026-02-12", requestRef: "ACC-2026-001"
        },
        {
          id: 3, oecName: "LGCE", oecEmail: "lgce@example.dz", type: "deposit", typeLabel: "Frais de dépôt",
          amount: 15000, reference: "PAY-2026-003", status: "PENDING",
          createdAt: "2026-02-20"
        }
      ]);
    } finally { setLoading(false); }
  };

  const handleValidatePayment = async (paymentId: number) => {
    setValidating(true);
    try {
      await apiRequest("POST", `/api/payments/${paymentId}/validate`);
      toast({ title: t('dag.paymentTracking.paymentValidated'), description: "L'admin sera notifié pour créer le compte de l'OEC." });
      setDetailsOpen(false);
      loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common.error'), description: err.message });
    } finally { setValidating(false); }
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.oecName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || p.type === filterType;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge className="bg-yellow-500">{t('common.pending')}</Badge>;
      case "PROOF_SENT": return <Badge className="bg-blue-500">Preuve envoyée</Badge>;
      case "VALIDATED": return <Badge className="bg-green-500">{t('common.approved')}</Badge>;
      case "REJECTED": return <Badge className="bg-red-500">{t('common.rejected')}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit": return <Badge variant="outline" className="border-orange-300 text-orange-700">{t('dag.paymentTracking.types.deposit')}</Badge>;
      case "quotation": return <Badge variant="outline" className="border-blue-300 text-blue-700">{t('dag.paymentTracking.types.quotation')}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === "PENDING" || p.status === "PROOF_SENT").length,
    validated: payments.filter(p => p.status === "VALIDATED").length,
    totalAmount: payments.filter(p => p.status === "VALIDATED").reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{t('dag.paymentTracking.title')}</h1>
              <p className="text-muted-foreground mt-2">
                Suivi de tous les paiements effectués par les organismes
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.total')}</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.pending')}</p>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.approved')}</p>
                      <p className="text-2xl font-bold">{stats.validated}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Montant total validé</p>
                      <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()} DA</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('dag.paymentTracking.filterByOrg')}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('common.search') + "..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('dag.paymentTracking.filterByType')}</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('dag.paymentTracking.types.all')}</SelectItem>
                        <SelectItem value="deposit">{t('dag.paymentTracking.types.deposit')}</SelectItem>
                        <SelectItem value="quotation">{t('dag.paymentTracking.types.quotation')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.status')}</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="PENDING">{t('common.pending')}</SelectItem>
                        <SelectItem value="PROOF_SENT">Preuve envoyée</SelectItem>
                        <SelectItem value="VALIDATED">{t('common.approved')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Paiements ({filteredPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : filteredPayments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">{t('common.noData')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Organisme</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>{t('common.date')}</TableHead>
                          <TableHead>{t('common.status')}</TableHead>
                          <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-sm">{payment.reference}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{payment.oecName}</p>
                                <p className="text-xs text-muted-foreground">{payment.oecEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(payment.type)}</TableCell>
                            <TableCell className="font-semibold">{payment.amount.toLocaleString()} DA</TableCell>
                            <TableCell>{new Date(payment.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(payment); setDetailsOpen(true); }}>
                                  <Eye className="w-4 h-4 mr-1" /> {t('common.view')}
                                </Button>
                                {payment.status === "PROOF_SENT" && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleValidatePayment(payment.id)} disabled={validating}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> {t('dag.paymentTracking.validatePayment')}
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
          </div>
        </main>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>{selectedPayment?.reference}</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Organisme</Label><p className="font-medium">{selectedPayment.oecName}</p></div>
                <div><Label className="text-muted-foreground">Email</Label><p>{selectedPayment.oecEmail}</p></div>
                <div><Label className="text-muted-foreground">Type</Label><p>{getTypeBadge(selectedPayment.type)}</p></div>
                <div><Label className="text-muted-foreground">Montant</Label><p className="font-bold text-lg">{selectedPayment.amount.toLocaleString()} DA</p></div>
                <div><Label className="text-muted-foreground">Date de création</Label><p>{selectedPayment.createdAt}</p></div>
                <div><Label className="text-muted-foreground">Statut</Label><p>{getStatusBadge(selectedPayment.status)}</p></div>
                {selectedPayment.proofSentAt && (
                  <div><Label className="text-muted-foreground">Preuve envoyée le</Label><p>{selectedPayment.proofSentAt}</p></div>
                )}
                {selectedPayment.validatedAt && (
                  <div><Label className="text-muted-foreground">Validé le</Label><p>{selectedPayment.validatedAt}</p></div>
                )}
              </div>
              {selectedPayment.status === "PROOF_SENT" && (
                <div className="pt-4 border-t">
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleValidatePayment(selectedPayment.id)} disabled={validating}>
                    {validating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><CheckCircle className="mr-2 h-4 w-4" />{t('dag.paymentTracking.validatePayment')}</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
