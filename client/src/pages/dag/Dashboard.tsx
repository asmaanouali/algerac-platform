import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle, Eye, Users, DollarSign, Clock, BadgeDollarSign } from "lucide-react";
import { StatCard } from "@/components/stat-card";
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
  status: string;
  sentToDagDate: string;
  preparedByRaName: string;
  reeCount: number;
  etCount: number;
  eqCount: number;
  obsCount: number;
  supCount: number;
  expCount: number;
  evaluationDurationDays: number;
  reeDurationDays: number;
  etDurationDays: number;
  eqDurationDays: number;
  obsDurationDays: number;
  supDurationDays: number;
  expDurationDays: number;
  cdHelpRequested: boolean;
  cdHelpMessage: string;
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
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [dagAllApps, setDagAllApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [amount, setAmount] = useState("");
  const [comments, setComments] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadQuotations();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const [qRes, appsRes] = await Promise.all([
        apiRequest("GET", "/api/quotations/pending-approval"),
        apiRequest("GET", "/api/oec-applications/dag/all").catch(() => null),
      ]);
      const data = await qRes.json();
      setQuotations(data);
      if (appsRes) {
        const appsData = await appsRes.json();
        setDagAllApps(Array.isArray(appsData) ? appsData : []);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const openApprovalDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setAmount("");
    setComments("");
    setApprovalDialogOpen(true);
  };

  const openDetailsDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedQuotation) return;
    if (!amount || parseFloat(amount) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Le montant du devis est obligatoire et doit \u00EAtre positif" });
      return;
    }
    try {
      setApproving(true);
      await apiRequest("POST", `/api/quotations/${selectedQuotation.id}/approve`, { 
        amount: parseFloat(amount),
        comments 
      });
      toast({ title: "Devis \u00E9tabli", description: "Le montant du devis a \u00E9t\u00E9 d\u00E9fini. Le RA peut maintenant envoyer \u00E0 l'OEC." });
      setApprovalDialogOpen(false);
      loadQuotations();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setApproving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const getTotalMembers = (q: Quotation) => (q.reeCount || 0) + (q.etCount || 0) + (q.eqCount || 0) + (q.obsCount || 0) + (q.supCount || 0) + (q.expCount || 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{t('dag_page.dashboardTitle')}</h1>
              <p className="text-muted-foreground mt-2">
                {"\u00C9"}tablissez les devis sur la base des demandes soumises par les Responsables d'Accr\u00E9ditation
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Devis en Attente" value={quotations.length} icon={Clock} description="À établir" className={quotations.length > 0 ? "border-l-amber-500" : ""} />
              <StatCard title="Frais à Définir" value={dagAllApps.filter(a => a.status === "AWAITING_DAG_FEE").length} icon={BadgeDollarSign} description="Inscription OEC" className="border-l-blue-500" />
              <StatCard title="Paiements en Cours" value={dagAllApps.filter(a => a.status === "FEE_SET_AWAITING_PAYMENT").length} icon={DollarSign} description="En attente de paiement" />
              <StatCard title="Paiements Vérifiés" value={dagAllApps.filter(a => a.status === "PAYMENT_VERIFIED" || a.status === "ACCOUNT_CREATED").length} icon={CheckCircle} description="Traitement terminé" className="border-l-emerald-500" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Demandes d'{"\u00E9"}tablissement de devis</CardTitle>
                <CardDescription>
                  V\u00E9rifiez la composition d'{"\u00E9"}quipe propos\u00E9e et d\u00E9finissez le montant du devis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quotations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">Aucune demande de devis en attente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotations.map((quotation) => (
                      <div key={quotation.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{quotation.quotationNumber}</h3>
                              <Badge variant="outline">{quotation.request?.type}</Badge>
                            </div>
                            <p className="text-sm font-medium">
                              Demande : {quotation.request?.referenceNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              OEC : {quotation.request?.oec?.organizationName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Domaine : {quotation.request?.domain}
                            </p>
                            
                            {/* Composition de l'equipe */}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                                <Users className="w-4 h-4" /> Composition d'{"\u00E9"}quipe propos{"\u00E9"}e
                              </h4>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div><span className="text-blue-600">REE :</span> <strong>{quotation.reeCount || 1}</strong></div>
                                <div><span className="text-blue-600">{"\u00C9"}vl. Technique :</span> <strong>{quotation.etCount || 0}</strong></div>
                                {(quotation.eqCount > 0) && <div><span className="text-blue-600">{"\u00C9"}vl. Qualit{"\u00E9"} :</span> <strong>{quotation.eqCount}</strong></div>}
                                {(quotation.obsCount > 0) && <div><span className="text-blue-600">Observateur :</span> <strong>{quotation.obsCount}</strong></div>}
                                {(quotation.supCount > 0) && <div><span className="text-blue-600">Superviseur :</span> <strong>{quotation.supCount}</strong></div>}
                                {(quotation.expCount > 0) && <div><span className="text-blue-600">Expert :</span> <strong>{quotation.expCount}</strong></div>}
                              </div>
                              <div className="mt-2 pt-2 border-t border-blue-200 flex gap-4 text-sm">
                                <div><span className="text-blue-600">Total membres :</span> <strong>{getTotalMembers(quotation)}</strong></div>
                                <div><span className="text-blue-600">Dur{"\u00E9"}e {"\u00E9"}valuation :</span> <strong>{quotation.evaluationDurationDays} H/j</strong></div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Pr{"\u00E9"}par{"\u00E9"} par</p>
                                <p className="text-sm font-medium">{quotation.preparedByRaName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Envoy{"\u00E9"} le</p>
                                <p className="text-sm">
                                  {quotation.sentToDagDate ? new Date(quotation.sentToDagDate).toLocaleDateString("fr-FR") : "\u2014"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {quotation.details && (
                              <Button variant="outline" size="sm" onClick={() => openDetailsDialog(quotation)}>
                                <Eye className="h-4 w-4 mr-2" />D{"\u00E9"}tails
                              </Button>
                            )}
                            <Button size="sm" onClick={() => openApprovalDialog(quotation)}>
                              <DollarSign className="h-4 w-4 mr-2" />{"\u00C9"}tablir le devis
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>D\u00E9tails de la demande</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{selectedQuotation.details || "Aucun d\u00E9tail fourni"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog - DAG sets the amount */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{"\u00C9"}tablir le devis</DialogTitle>
            <DialogDescription>
              Sur la base de la composition d'{"\u00E9"}quipe propos{"\u00E9"}e, d{"\u00E9"}finissez le montant du devis
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>Num{"\u00E9"}ro :</strong> {selectedQuotation.quotationNumber}
                  <br />
                  <strong>Demande :</strong> {selectedQuotation.request?.referenceNumber}
                  <br />
                  <strong>OEC :</strong> {selectedQuotation.request?.oec?.organizationName}
                </AlertDescription>
              </Alert>

              {/* Composition summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Composition propos{"\u00E9"}e par le RA</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>REE : <strong>{selectedQuotation.reeCount || 1}</strong></div>
                  <div>{"\u00C9"}vl. Technique : <strong>{selectedQuotation.etCount || 0}</strong></div>
                  {(selectedQuotation.eqCount > 0) && <div>{"\u00C9"}vl. Qualit{"\u00E9"} : <strong>{selectedQuotation.eqCount}</strong></div>}
                  {(selectedQuotation.obsCount > 0) && <div>Observateur : <strong>{selectedQuotation.obsCount}</strong></div>}
                  {(selectedQuotation.supCount > 0) && <div>Superviseur : <strong>{selectedQuotation.supCount}</strong></div>}
                  {(selectedQuotation.expCount > 0) && <div>Expert : <strong>{selectedQuotation.expCount}</strong></div>}
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 text-sm">
                  <strong>Total : {getTotalMembers(selectedQuotation)} membres</strong> | Dur{"\u00E9"}e totale : <strong>{selectedQuotation.evaluationDurationDays} H/j</strong>
                </div>
                {/* Per-member durations */}
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Dur\u00E9e par membre (H/j) :</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {selectedQuotation.reeDurationDays > 0 && <div>REE : <strong>{selectedQuotation.reeDurationDays}</strong></div>}
                    {selectedQuotation.etDurationDays > 0 && <div>{"\u00C9"}vl. Tech : <strong>{selectedQuotation.etDurationDays}</strong></div>}
                    {selectedQuotation.eqDurationDays > 0 && <div>{"\u00C9"}vl. Qualit{"\u00E9"} : <strong>{selectedQuotation.eqDurationDays}</strong></div>}
                    {selectedQuotation.obsDurationDays > 0 && <div>Observateur : <strong>{selectedQuotation.obsDurationDays}</strong></div>}
                    {selectedQuotation.supDurationDays > 0 && <div>Superviseur : <strong>{selectedQuotation.supDurationDays}</strong></div>}
                    {selectedQuotation.expDurationDays > 0 && <div>Expert : <strong>{selectedQuotation.expDurationDays}</strong></div>}
                  </div>
                </div>
                {selectedQuotation.cdHelpRequested && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-700">
                    <strong>Le RA a demand\u00E9 l'aide du CD pour l'estimation.</strong>
                    {selectedQuotation.cdHelpMessage && <p className="mt-1">{selectedQuotation.cdHelpMessage}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant du devis (DA) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">D{"\u00E9"}finissez le montant en fonction de la composition et de la dur{"\u00E9"}e</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires (optionnel)</Label>
                <Textarea
                  id="comments"
                  placeholder="Justification du montant, remarques..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Une fois le montant d{"\u00E9"}fini, le RA pourra demander la validation du CD avant l'envoi \u00E0 l'OEC. <strong>Seul le DAG et l'OEC voient le montant.</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} disabled={approving}>Annuler</Button>
            <Button onClick={handleApprove} disabled={approving || !amount}>
              {approving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{"\u00C9"}tablissement...</>
              ) : (
                <><DollarSign className="mr-2 h-4 w-4" />{"\u00C9"}tablir le devis</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
