import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, FileText, CheckCircle, XCircle, DollarSign, Download, Search,
  Building2, AlertTriangle, Send, Eye, ClipboardCheck,
} from "lucide-react";
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
  paymentDate?: string;
  createdAt: string;
  proofDocumentName?: string;
  proofDocumentBase64?: string;
  dagValidated?: boolean;
  dagComments?: string;
  dagValidatedDate?: string;
  feeSetDate?: string;
  currency?: string;
  invoiceNumber?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  AWAITING_FEE_SETTING: { label: "Frais à fixer", color: "bg-amber-500 text-white" },
  PENDING:             { label: "En attente paiement", color: "bg-yellow-500 text-white" },
  PROOF_SUBMITTED:     { label: "Preuve reçue", color: "bg-blue-500 text-white" },
  DAG_VALIDATED:       { label: "Paiement validé", color: "bg-green-600 text-white" },
  DAG_REJECTED:        { label: "Rejeté", color: "bg-red-500 text-white" },
  COMPLETED:           { label: "Complété", color: "bg-green-700 text-white" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={cfg.color}>{cfg.label}</Badge>;
}

export default function DAGRegistrationFeesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [docSearch, setDocSearch] = useState("");

  const [selected, setSelected] = useState<PaymentRecord | null>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Fix fee dialog
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [settingFee, setSettingFee] = useState(false);

  // Validate payment dialog
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validateComments, setValidateComments] = useState("");
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadPayments();
  }, [user, authLoading]);

  if (authLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
  if (!user) return null;

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/payments/all");
      const data = await res.json();
      // Only show registration fee payments
      const filtered = Array.isArray(data)
        ? data.filter((p: PaymentRecord) =>
            p.paymentType === "REGISTRATION_FEE" ||
            p.status === "AWAITING_FEE_SETTING"
          )
        : [];
      setPayments(filtered);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const selectPayment = async (p: PaymentRecord) => {
    setSelected(p);
    setDossier(null);
    setDocSearch("");
    setLoadingDossier(true);
    try {
      const res = await apiRequest("GET", `/api/requests/${p.requestId}/full-details`);
      setDossier(await res.json());
    } catch {
      setDossier(null);
    } finally {
      setLoadingDossier(false);
    }
  };

  // ── Documents helpers ──────────────────────────────────────────────────────

  const parsedDescription = (() => {
    try {
      return dossier?.request?.description ? JSON.parse(dossier.request.description) : null;
    } catch { return null; }
  })();

  // DAG only needs to see DOC1 and the technical form (FOR4/5/...) to fix the
  // registration fee. Administrative documents are NOT shown at this step.
  const allDocuments: Array<{ key?: string; name: string; base64?: string; mimeType?: string }> =
    Array.isArray(parsedDescription?.documents) ? parsedDescription.documents : [];
  const documents = allDocuments.filter((d) => {
    const k = (d.key || d.name || "").toString();
    return !k.startsWith("admin-") && !k.toLowerCase().includes("administratif");
  });

  const filteredDocs = documents.filter(
    (d) => !docSearch.trim() || d.name.toLowerCase().includes(docSearch.toLowerCase()),
  );

  const downloadDoc = (d: any) => {
    if (!d.base64) { toast({ title: "Fichier non disponible" }); return; }
    const mime = d.mimeType || "application/octet-stream";
    const bc = atob(d.base64);
    const ba = new Uint8Array(bc.length);
    for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
    const blob = new Blob([ba], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = d.name; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProof = () => {
    if (!selected?.proofDocumentBase64 || !selected?.proofDocumentName) {
      toast({ title: "Preuve non disponible" }); return;
    }
    const bc = atob(selected.proofDocumentBase64);
    const ba = new Uint8Array(bc.length);
    for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
    const blob = new Blob([ba]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = selected.proofDocumentName; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSetFee = async () => {
    if (!selected || !feeAmount || parseFloat(feeAmount) <= 0) {
      toast({ variant: "destructive", title: "Montant invalide" }); return;
    }
    try {
      setSettingFee(true);
      await apiRequest("POST", `/api/payments/${selected.id}/set-fee`, {
        amount: parseFloat(feeAmount),
      });
      toast({
        title: "Frais fixés",
        description: `Frais d'enregistrement fixés à ${parseFloat(feeAmount).toLocaleString()} DA. L'OEC sera notifié.`,
      });
      setFeeDialogOpen(false);
      setFeeAmount("");
      await loadPayments();
      setSelected(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSettingFee(false); }
  };

  const handleValidate = async () => {
    if (!selected) return;
    try {
      setValidating(true);
      await apiRequest("POST", `/api/payments/${selected.id}/validate`, {
        comments: validateComments,
      });
      toast({ title: "Paiement validé", description: "Le RA peut maintenant finaliser son étude de recevabilité." });
      setValidateDialogOpen(false);
      setValidateComments("");
      await loadPayments();
      setSelected(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setValidating(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!validateComments.trim()) {
      toast({ variant: "destructive", title: "Raison requise", description: "Indiquez la raison du rejet." }); return;
    }
    try {
      setRejecting(true);
      await apiRequest("POST", `/api/payments/${selected.id}/reject`, {
        comments: validateComments,
      });
      toast({ title: "Paiement rejeté", description: "L'OEC devra resoumettre une preuve de paiement." });
      setValidateDialogOpen(false);
      setValidateComments("");
      await loadPayments();
      setSelected(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setRejecting(false); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    toFix:      payments.filter(p => p.status === "AWAITING_FEE_SETTING").length,
    proofRecd:  payments.filter(p => p.status === "PROOF_SUBMITTED").length,
    validated:  payments.filter(p => p.status === "DAG_VALIDATED" || p.status === "COMPLETED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Frais d'enregistrement</h1>
              <p className="text-muted-foreground mt-1">
                Consultez les dossiers d'accréditation, fixez les frais d'enregistrement et validez les preuves de paiement.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className={stats.toFix > 0 ? "ring-2 ring-amber-400" : ""}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frais à fixer</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.toFix}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-400" />
                </CardContent>
              </Card>
              <Card className={stats.proofRecd > 0 ? "ring-2 ring-blue-400" : ""}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Preuves reçues</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.proofRecd}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Validés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </CardContent>
              </Card>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: dossier list */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Dossiers
                  </CardTitle>
                  <CardDescription>Demandes d'accréditation reçues du CD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Aucun dossier</p>
                  ) : payments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => selectPayment(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected?.id === p.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold truncate">
                            {p.requestReferenceNumber || `#${p.requestId}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{p.oecName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Right: dossier detail */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    {selected ? `Dossier ${selected.requestReferenceNumber || `#${selected.requestId}`}` : "Détails du dossier"}
                  </CardTitle>
                  {selected && (
                    <CardDescription>{selected.oecName} — {selected.oecEmail}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {!selected ? (
                    <p className="text-center text-muted-foreground py-12">
                      Sélectionnez un dossier à gauche pour consulter les documents et fixer les frais.
                    </p>
                  ) : (
                    <div className="space-y-5">

                      {/* Status banner */}
                      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                        selected.status === "AWAITING_FEE_SETTING"
                          ? "bg-amber-50 border-amber-200"
                          : selected.status === "PROOF_SUBMITTED"
                          ? "bg-blue-50 border-blue-200"
                          : selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED"
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        {selected.status === "AWAITING_FEE_SETTING" && <DollarSign className="h-5 w-5 text-amber-600 shrink-0" />}
                        {selected.status === "PROOF_SUBMITTED" && <FileText className="h-5 w-5 text-blue-600 shrink-0" />}
                        {(selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED") && <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {selected.status === "AWAITING_FEE_SETTING" && "En attente de fixation des frais"}
                            {selected.status === "PENDING" && `Frais fixés à ${Number(selected.amount).toLocaleString()} DA — en attente du paiement de l'OEC`}
                            {selected.status === "PROOF_SUBMITTED" && "Preuve de paiement reçue — à vérifier"}
                            {(selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED") && "Paiement validé"}
                          </p>
                          {selected.feeSetDate && selected.status !== "AWAITING_FEE_SETTING" && (
                            <p className="text-xs text-muted-foreground">
                              Frais fixés le {new Date(selected.feeSetDate).toLocaleDateString("fr-FR")} — {Number(selected.amount).toLocaleString()} {selected.currency || "DA"}
                            </p>
                          )}
                          {selected.dagValidatedDate && (
                            <p className="text-xs text-muted-foreground">
                              Validé le {new Date(selected.dagValidatedDate).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={selected.status} />
                      </div>

                      {/* Info DAG → RA */}
                      {selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED" ? (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Le paiement a été confirmé. Le Responsable d'Accréditation peut maintenant valider la recevabilité du dossier.
                          </AlertDescription>
                        </Alert>
                      ) : selected.status === "AWAITING_FEE_SETTING" ? (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            Consultez les documents ci-dessous, puis fixez le montant des frais d'enregistrement. Le RA ne pourra pas valider la recevabilité tant que le paiement n'est pas confirmé.
                          </AlertDescription>
                        </Alert>
                      ) : selected.status === "PENDING" ? (
                        <Alert>
                          <AlertDescription>
                            L'OEC a été notifié du montant à payer ({Number(selected.amount).toLocaleString()} {selected.currency || "DA"}). En attente de la preuve de paiement.
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      <Separator />

                      {/* Official generated PDFs — DOC1 and technical form */}
                      <div className="space-y-2 p-3 rounded-md border bg-emerald-50/50">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-700" /> Documents officiels
                        </h3>
                        <p className="text-xs text-emerald-800">
                          Pour fixer les frais, consultez le DOC 1 et le formulaire technique (FOR 04 / FOR 05 selon les activités).
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/api/requests/${selected.requestId}/doc1.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" /> DOC 1 (PDF)
                            </Button>
                          </a>
                          <a
                            href={`/api/requests/${selected.requestId}/technical-form.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" /> Formulaires techniques (PDF)
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Attachments from DOC1/FOR (admin documents excluded) */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Pièces techniques jointes ({documents.length})
                        </h3>

                        {loadingDossier ? (
                          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : documents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {dossier ? "Aucun document joint à ce dossier" : "Impossible de charger le dossier"}
                          </p>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Filtrer les documents..."
                                value={docSearch}
                                onChange={(e) => setDocSearch(e.target.value)}
                                className="pl-9 h-9"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border p-2 bg-slate-50">
                              {filteredDocs.map((d, i) => (
                                <div
                                  key={`${d.key || d.name}-${i}`}
                                  className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="truncate">{d.name}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 shrink-0"
                                    disabled={!d.base64}
                                    onClick={() => downloadDoc(d)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {d.base64 ? "Télécharger" : "N/A"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Proof of payment section (PROOF_SUBMITTED) */}
                      {selected.status === "PROOF_SUBMITTED" && selected.proofDocumentName && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Preuve de paiement soumise
                            </h3>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-blue-900 text-sm">{selected.proofDocumentName}</p>
                                {selected.transactionId && (
                                  <p className="text-xs text-blue-700 font-mono">Réf. transaction : {selected.transactionId}</p>
                                )}
                                {selected.paymentDate && (
                                  <p className="text-xs text-blue-600">
                                    Date déclarée : {new Date(selected.paymentDate).toLocaleDateString("fr-FR")}
                                  </p>
                                )}
                              </div>
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/api/payments/${selected.id}/proof`} download={selected.proofDocumentName} target="_blank" rel="noreferrer">
                                  <Download className="w-3 h-3 mr-1" /> Télécharger
                                </a>
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Action buttons */}
                      <div className="flex gap-3 flex-wrap">
                        {selected.status === "AWAITING_FEE_SETTING" && (
                          <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => { setFeeAmount(""); setFeeDialogOpen(true); }}
                          >
                            <DollarSign className="w-4 h-4 mr-2" /> Fixer les frais d'enregistrement
                          </Button>
                        )}
                        {selected.status === "PROOF_SUBMITTED" && (
                          <Button
                            onClick={() => { setValidateComments(""); setValidateDialogOpen(true); }}
                          >
                            <Eye className="w-4 h-4 mr-2" /> Vérifier le paiement
                          </Button>
                        )}
                      </div>

                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog: Fixer les frais */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fixer les frais d'enregistrement</DialogTitle>
            <DialogDescription>
              Dossier {selected?.requestReferenceNumber || `#${selected?.requestId}`} — {selected?.oecName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="Ex : 5 000"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Ce montant sera communiqué à l'OEC qui devra effectuer le virement avant que le RA puisse valider la recevabilité.
              </p>
            </div>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Une fois les frais fixés, l'étude de recevabilité du RA affichera automatiquement :<br />
                <strong>« En attente de validation du paiement par le DAG »</strong>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeeDialogOpen(false)}>Annuler</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSetFee}
              disabled={settingFee || !feeAmount || parseFloat(feeAmount) <= 0}
            >
              {settingFee
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</>
                : <><Send className="mr-2 h-4 w-4" />Fixer et notifier l'OEC</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Valider / Rejeter le paiement */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vérification du paiement</DialogTitle>
            <DialogDescription>
              Dossier {selected?.requestReferenceNumber || `#${selected?.requestId}`} — montant attendu : {Number(selected?.amount).toLocaleString()} {selected?.currency || "DA"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selected?.proofDocumentName && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-900 text-sm">{selected.proofDocumentName}</p>
                  {selected.transactionId && (
                    <p className="text-xs font-mono text-blue-700">Réf. : {selected.transactionId}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/payments/${selected.id}/proof`} download={selected.proofDocumentName} target="_blank" rel="noreferrer">
                    <Download className="w-3 h-3 mr-1" /> Télécharger
                  </a>
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Commentaires (obligatoires en cas de rejet)</Label>
              <Textarea
                value={validateComments}
                onChange={(e) => setValidateComments(e.target.value)}
                placeholder="Observations sur la vérification..."
                rows={3}
              />
            </div>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                En validant, l'étude de recevabilité du RA affichera <strong>« Paiement validé par le DAG »</strong> et il pourra finaliser sa décision.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setValidateDialogOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={validating || rejecting}
            >
              {rejecting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejet...</>
                : <><XCircle className="mr-2 h-4 w-4" />Rejeter</>}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleValidate}
              disabled={validating || rejecting}
            >
              {validating
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</>
                : <><CheckCircle className="mr-2 h-4 w-4" />Valider le paiement</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
