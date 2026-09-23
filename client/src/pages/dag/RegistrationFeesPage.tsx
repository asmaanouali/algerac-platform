import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, FileText, CheckCircle, XCircle, DollarSign, Download, Search,
  AlertTriangle, Send, Eye, ClipboardCheck,
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
  /** true = nouvel OEC (candidature), false = OEC existant */
  isNewOec?: boolean;
}

function OecTypeBadge({ isNewOec }: { isNewOec?: boolean }) {
  if (isNewOec) {
    return <Badge className="bg-violet-600 text-white">Nouvel OEC</Badge>;
  }
  return <Badge variant="outline" className="border-slate-300 text-slate-700">OEC existant</Badge>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  AWAITING_FEE_SETTING: { label: "Frais à fixer", color: "bg-amber-500 text-white" },
  PENDING:             { label: "En attente paiement", color: "bg-yellow-500 text-white" },
  PROOF_SUBMITTED:     { label: "Preuve reçue", color: "bg-blue-500 text-white" },
  DAG_VALIDATED:       { label: "Paiement validé", color: "bg-green-600 text-white" },
  DAG_REJECTED:        { label: "Rejeté", color: "bg-red-500 text-white" },
  COMPLETED:           { label: "Complété", color: "bg-green-700 text-white" },
};

/** Dossiers où le DAG doit encore agir */
const PENDING_STATUSES = new Set(["AWAITING_FEE_SETTING", "PROOF_SUBMITTED"]);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={cfg.color}>{cfg.label}</Badge>;
}

function formatAmount(amount?: number, currency = "DA") {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return `${Number(amount).toLocaleString("fr-FR")} ${currency}`;
}

export default function DAGRegistrationFeesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [docSearch, setDocSearch] = useState("");

  const [selected, setSelected] = useState<PaymentRecord | null>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const matchesSearch = (p: PaymentRecord, q: string) =>
    (p.requestReferenceNumber || "").toLowerCase().includes(q) ||
    (p.oecName || "").toLowerCase().includes(q) ||
    (p.oecEmail || "").toLowerCase().includes(q) ||
    String(p.requestId).includes(q);

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = payments.filter((p) => PENDING_STATUSES.has(p.status));
    if (!q) return list;
    return list.filter((p) => matchesSearch(p, q));
  }, [payments, search]);

  const filteredDone = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = payments.filter((p) => !PENDING_STATUSES.has(p.status));
    const filtered = !q ? list : list.filter((p) => matchesSearch(p, q));
    return [...filtered].sort((a, b) => {
      const da = a.dagValidatedDate || a.feeSetDate || a.createdAt || "";
      const db = b.dagValidatedDate || b.feeSetDate || b.createdAt || "";
      return db.localeCompare(da);
    });
  }, [payments, search]);

  const openDetail = async (p: PaymentRecord) => {
    setSelected(p);
    setDossier(null);
    setDocSearch("");
    setDetailOpen(true);
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

  // DAG only needs DOC1 and the technical form (FOR4/5/...) — admin docs excluded
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
      setDetailOpen(false);
      setSelected(null);
      setActiveTab("done");
      await loadPayments();
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
      toast({
        title: "Paiement validé",
        description: selected.isNewOec
          ? "Paiement confirmé. L'administrateur pourra créer le compte OEC."
          : "Le RA peut maintenant finaliser son étude de recevabilité.",
      });
      setValidateDialogOpen(false);
      setValidateComments("");
      setDetailOpen(false);
      setSelected(null);
      setActiveTab("done");
      await loadPayments();
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
      setDetailOpen(false);
      setSelected(null);
      setActiveTab("done");
      await loadPayments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setRejecting(false); }
  };

  const renderPaymentCard = (p: PaymentRecord, mode: "pending" | "done") => (
    <Card key={p.id} className={`border-l-4 ${mode === "pending" ? "border-l-primary" : "border-l-emerald-500"}`}>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold font-mono">
              {p.requestReferenceNumber || `Dossier #${p.requestId}`}
            </p>
            <StatusBadge status={p.status} />
            <OecTypeBadge isNewOec={!!p.isNewOec} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            OEC : {p.oecName || "—"}
            {p.oecEmail && <> · {p.oecEmail}</>}
          </p>
          {mode === "done" && p.amount != null && Number(p.amount) > 0 && (
            <p className="text-sm font-medium mt-1">
              Montant : {formatAmount(p.amount, p.currency || "DA")}
              {p.feeSetDate && (
                <span className="text-muted-foreground font-normal">
                  {" "}· Fixés le {new Date(p.feeSetDate).toLocaleDateString("fr-FR")}
                </span>
              )}
              {p.dagValidatedDate && (
                <span className="text-muted-foreground font-normal">
                  {" "}· Validé le {new Date(p.dagValidatedDate).toLocaleDateString("fr-FR")}
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Créé le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/requests/${p.requestId}/doc1.pdf`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> DOC 1</Button>
          </a>
          <a href={`/api/requests/${p.requestId}/technical-form.pdf`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> FOR technique</Button>
          </a>
          {mode === "pending" && p.status === "AWAITING_FEE_SETTING" ? (
            <Button size="sm" onClick={() => openDetail(p)}>
              <Send className="h-3 w-3 mr-1" /> Fixer les frais
            </Button>
          ) : mode === "pending" && p.status === "PROOF_SUBMITTED" ? (
            <Button size="sm" onClick={() => openDetail(p)}>
              <Eye className="h-3 w-3 mr-1" /> Vérifier le paiement
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => openDetail(p)}>
              <Eye className="h-3 w-3 mr-1" /> Voir le dossier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-primary" /> Frais d&apos;enregistrement
            </h1>
            <p className="text-muted-foreground mt-1">
              Fixez les frais d&apos;enregistrement, validez les preuves de paiement, puis consultez l&apos;historique des dossiers traités.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" /> Frais d&apos;enregistrement
                  </CardTitle>
                  <CardDescription>
                    Dossiers en attente d&apos;action DAG et dossiers déjà traités.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="pending" className="gap-2">
                      En attente ({filteredPending.length})
                    </TabsTrigger>
                    <TabsTrigger value="done" className="gap-2">
                      Traités ({filteredDone.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-3">
                    {filteredPending.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun dossier à traiter</p>
                    ) : (
                      filteredPending.map((p) => renderPaymentCard(p, "pending"))
                    )}
                  </TabsContent>

                  <TabsContent value="done" className="space-y-3">
                    {filteredDone.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun dossier traité pour le moment</p>
                    ) : (
                      filteredDone.map((p) => renderPaymentCard(p, "done"))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialog: détail dossier */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dossier {selected?.requestReferenceNumber || `#${selected?.requestId}`}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span>{selected?.oecName} — {selected?.oecEmail}</span>
              {selected && <OecTypeBadge isNewOec={!!selected.isNewOec} />}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-slate-50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Type d&apos;OEC</p>
                  <p className="text-sm font-medium mt-0.5">
                    {selected.isNewOec
                      ? "Nouvel organisme (candidature / inscription)"
                      : "Organisme déjà enregistré"}
                  </p>
                </div>
                <OecTypeBadge isNewOec={!!selected.isNewOec} />
              </div>

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
                    {selected.status === "PENDING" && `Frais fixés à ${formatAmount(selected.amount, selected.currency || "DA")} — en attente du paiement de l'OEC`}
                    {selected.status === "PROOF_SUBMITTED" && "Preuve de paiement reçue — à vérifier"}
                    {(selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED") && "Paiement validé"}
                    {selected.status === "DAG_REJECTED" && "Paiement rejeté — en attente d'une nouvelle preuve"}
                  </p>
                  {selected.feeSetDate && selected.status !== "AWAITING_FEE_SETTING" && (
                    <p className="text-xs text-muted-foreground">
                      Frais fixés le {new Date(selected.feeSetDate).toLocaleDateString("fr-FR")} — {formatAmount(selected.amount, selected.currency || "DA")}
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

              {selected.status === "DAG_VALIDATED" || selected.status === "COMPLETED" ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Le paiement a été confirmé. Le Responsable d&apos;Accréditation peut maintenant valider la recevabilité du dossier.
                  </AlertDescription>
                </Alert>
              ) : selected.status === "AWAITING_FEE_SETTING" ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Consultez les documents ci-dessous, puis fixez le montant des frais d&apos;enregistrement. Le RA ne pourra pas valider la recevabilité tant que le paiement n&apos;est pas confirmé.
                  </AlertDescription>
                </Alert>
              ) : selected.status === "PENDING" ? (
                <Alert>
                  <AlertDescription>
                    L&apos;OEC a été notifié du montant à payer ({formatAmount(selected.amount, selected.currency || "DA")}). En attente de la preuve de paiement.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <div className="space-y-2 p-3 rounded-md border bg-emerald-50/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" /> Documents officiels
                </h3>
                <p className="text-xs text-emerald-800">
                  Pour fixer les frais, consultez le DOC 1 et le formulaire technique (FOR 04 / FOR 05 selon les activités).
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={`/api/requests/${selected.requestId}/doc1.pdf`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" /> DOC 1 (PDF)
                    </Button>
                  </a>
                  <a href={`/api/requests/${selected.requestId}/technical-form.pdf`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" /> Formulaires techniques (PDF)
                    </Button>
                  </a>
                </div>
              </div>

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

              <div className="flex gap-3 flex-wrap justify-end">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
                {selected.status === "AWAITING_FEE_SETTING" && (
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => { setFeeAmount(""); setFeeDialogOpen(true); }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> Fixer les frais d&apos;enregistrement
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
        </DialogContent>
      </Dialog>

      {/* Dialog: Fixer les frais */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fixer les frais d&apos;enregistrement</DialogTitle>
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
                Ce montant sera communiqué à l&apos;OEC qui devra effectuer le virement avant que le RA puisse valider la recevabilité.
              </p>
            </div>
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
                : <><Send className="mr-2 h-4 w-4" />Fixer et notifier l&apos;OEC</>}
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
              Dossier {selected?.requestReferenceNumber || `#${selected?.requestId}`} — montant attendu : {formatAmount(selected?.amount, selected?.currency || "DA")}
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
                En validant, l&apos;étude de recevabilité du RA affichera <strong>« Paiement validé par le DAG »</strong> et il pourra finaliser sa décision.
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
