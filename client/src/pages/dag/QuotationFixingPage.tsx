import { useEffect, useMemo, useState } from "react";
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
  Loader2, FileText, Download, DollarSign, Search, AlertTriangle, Send, ClipboardCheck, Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { DevisSheetEditor } from "@/components/DevisSheetEditor";
import {
  type DevisSheet,
  buildSheetForType,
  serializeDevisPayload,
  sheetMainTotal,
  sheetToBreakdown,
} from "@/lib/devis-sheet";

interface Quotation {
  id: number;
  quotationNumber: string;
  requestId: number;
  requestReferenceNumber?: string;
  requestType?: "INITIAL" | "RENOUVELLEMENT" | "SURVEILLANCE" | "EXTENSION" | string;
  oecName?: string;
  status: string;
  amount?: number;
  details?: string;
  reeCount?: number;
  etCount?: number;
  eqCount?: number;
  evaluationDurationDays?: number;
  daysCount?: number;
  approvedByDagDate?: string;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:                 { label: "Brouillon", color: "bg-slate-200 text-slate-700" },
  SENT_TO_DAG:           { label: "En attente DAG", color: "bg-amber-500 text-white" },
  APPROVED_BY_DAG:       { label: "Établi par DAG", color: "bg-blue-500 text-white" },
  PENDING_CD_VALIDATION: { label: "Validation CD", color: "bg-indigo-500 text-white" },
  CD_VALIDATED:          { label: "Validé CD", color: "bg-teal-600 text-white" },
  SENT_TO_OEC:           { label: "Envoyé à l'OEC", color: "bg-violet-600 text-white" },
  VALIDATED_BY_OEC:      { label: "Accepté OEC", color: "bg-emerald-600 text-white" },
  REJECTED_BY_OEC:       { label: "Refusé OEC", color: "bg-red-500 text-white" },
  EXPIRED:               { label: "Expiré", color: "bg-slate-500 text-white" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  return cfg ? <Badge className={cfg.color}>{cfg.label}</Badge> : <Badge variant="outline">{status}</Badge>;
}

function formatAmount(amount?: number) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(amount);
}

export default function DAGQuotationFixingPage() {
  const { toast } = useToast();
  const [pending, setPending] = useState<Quotation[]>([]);
  const [established, setEstablished] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const [devisEstimatifNumber, setDevisEstimatifNumber] = useState("");
  const [devisEstimatifDate, setDevisEstimatifDate] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [sheet, setSheet] = useState<DevisSheet>(() => buildSheetForType("INITIAL"));

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [pendingRes, establishedRes] = await Promise.all([
        apiRequest("GET", "/api/quotations/pending-approval"),
        apiRequest("GET", "/api/quotations/established"),
      ]);
      const pendingJson = await pendingRes.json();
      const establishedJson = await establishedRes.json();
      setPending(Array.isArray(pendingJson) ? pendingJson : []);
      setEstablished(Array.isArray(establishedJson) ? establishedJson : []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Chargement impossible" });
    } finally {
      setLoading(false);
    }
  };

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((i) =>
      (i.quotationNumber || "").toLowerCase().includes(q) ||
      (i.requestReferenceNumber || "").toLowerCase().includes(q) ||
      (i.oecName || "").toLowerCase().includes(q)
    );
  }, [pending, search]);

  const filteredEstablished = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? established
      : established.filter((i) =>
          (i.quotationNumber || "").toLowerCase().includes(q) ||
          (i.requestReferenceNumber || "").toLowerCase().includes(q) ||
          (i.oecName || "").toLowerCase().includes(q)
        );
    return [...list].sort((a, b) => {
      const da = a.approvedByDagDate || a.createdAt || "";
      const db = b.approvedByDagDate || b.createdAt || "";
      return db.localeCompare(da);
    });
  }, [established, search]);

  const openFix = (q: Quotation) => {
    setSelected(q);
    setComments("");
    setDevisEstimatifNumber(q.quotationNumber || "");
    setDevisEstimatifDate(new Date().toISOString().slice(0, 10));
    setSiteName("");
    setSiteAddress("");
    setSheet(buildSheetForType(q.requestType || "INITIAL"));
    setDialogOpen(true);
  };

  const submitAmount = async () => {
    if (!selected) return;

    const breakdownMap = sheetToBreakdown(sheet);
    const mainTotal = sheetMainTotal(sheet);

    if (mainTotal <= 0) {
      toast({
        variant: "destructive",
        title: "Montants requis",
        description: "Saisissez au moins un montant HT positif sur une ligne comptée dans le montant principal.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = serializeDevisPayload(sheet);
      const res = await apiRequest("POST", `/api/quotations/${selected.id}/approve`, {
        amount: mainTotal,
        comments: comments || undefined,
        breakdown: breakdownMap,
        sheet: payload.sheet,
        devisEstimatifNumber: devisEstimatifNumber || undefined,
        devisEstimatifDate: devisEstimatifDate || undefined,
        siteName: siteName || undefined,
        siteAddress: siteAddress || undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Erreur lors de la fixation du devis");
      }
      toast({
        title: "Devis fixé",
        description: "Le devis a été fixé. Le PDF est en cours de téléchargement.",
      });
      window.open(`/api/quotations/${selected.id}/devis.pdf`, "_blank", "noopener,noreferrer");
      setDialogOpen(false);
      setActiveTab("established");
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Impossible de fixer le devis" });
    } finally {
      setSaving(false);
    }
  };

  const renderQuotationCard = (q: Quotation, mode: "pending" | "established") => {
    const days = q.evaluationDurationDays ?? q.daysCount;
    return (
      <Card key={q.id} className={`border-l-4 ${mode === "pending" ? "border-l-primary" : "border-l-emerald-500"}`}>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{q.quotationNumber || `Devis #${q.id}`}</p>
              <StatusBadge status={q.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dossier : {q.requestReferenceNumber || `#${q.requestId}`}
              {q.oecName && <> · OEC : {q.oecName}</>}
              {days ? <> · {days} jour(s)</> : null}
            </p>
            {mode === "established" && (
              <p className="text-sm font-medium mt-1">
                Montant : {formatAmount(q.amount)}
                {q.approvedByDagDate && (
                  <span className="text-muted-foreground font-normal">
                    {" "}· Établi le {new Date(q.approvedByDagDate).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </p>
            )}
            {q.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.details}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/api/requests/${q.requestId}/doc1.pdf`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> DOC 1</Button>
            </a>
            <a href={`/api/requests/${q.requestId}/technical-form.pdf`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> FOR technique</Button>
            </a>
            {mode === "pending" ? (
              <Button size="sm" onClick={() => openFix(q)}>
                <Send className="h-3 w-3 mr-1" /> Fixer le montant
              </Button>
            ) : (
              <a href={`/api/quotations/${q.id}/devis.pdf`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  <Eye className="h-3 w-3 mr-1" /> Voir le devis PDF
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-primary" /> Fixation des devis
            </h1>
            <p className="text-muted-foreground mt-1">
              Fixez le montant des devis préparés par les RA, puis consultez l&apos;historique des devis établis.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" /> Devis
                  </CardTitle>
                  <CardDescription>
                    Devis envoyés par les RA et devis déjà établis par la DAG.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                    <TabsTrigger value="established" className="gap-2">
                      Établis ({filteredEstablished.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-3">
                    {filteredPending.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun devis à traiter</p>
                    ) : (
                      filteredPending.map((q) => renderQuotationCard(q, "pending"))
                    )}
                  </TabsContent>

                  <TabsContent value="established" className="space-y-3">
                    {filteredEstablished.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun devis établi pour le moment</p>
                    ) : (
                      filteredEstablished.map((q) => renderQuotationCard(q, "established"))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis estimatif — Feuille de fixation</DialogTitle>
            <DialogDescription>
              La feuille est préremplie selon le type de dossier. Modifiez les cases, ajoutez ou supprimez
              des lignes et colonnes, puis validez pour générer le PDF.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <DevisForm
              selected={selected}
              comments={comments}
              setComments={setComments}
              devisEstimatifNumber={devisEstimatifNumber}
              setDevisEstimatifNumber={setDevisEstimatifNumber}
              devisEstimatifDate={devisEstimatifDate}
              setDevisEstimatifDate={setDevisEstimatifDate}
              siteName={siteName}
              setSiteName={setSiteName}
              siteAddress={siteAddress}
              setSiteAddress={setSiteAddress}
              sheet={sheet}
              setSheet={setSheet}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={submitAmount} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Envoi...</> : "Valider et générer le PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type DevisFormProps = {
  selected: Quotation;
  comments: string;
  setComments: (v: string) => void;
  devisEstimatifNumber: string;
  setDevisEstimatifNumber: (v: string) => void;
  devisEstimatifDate: string;
  setDevisEstimatifDate: (v: string) => void;
  siteName: string;
  setSiteName: (v: string) => void;
  siteAddress: string;
  setSiteAddress: (v: string) => void;
  sheet: DevisSheet;
  setSheet: (s: DevisSheet) => void;
};

function DevisForm(props: DevisFormProps) {
  const {
    selected, comments, setComments,
    devisEstimatifNumber, setDevisEstimatifNumber,
    devisEstimatifDate, setDevisEstimatifDate,
    siteName, setSiteName, siteAddress, setSiteAddress,
    sheet, setSheet,
  } = props;

  const type = (selected.requestType || "INITIAL").toUpperCase();

  const formCode =
    type === "SURVEILLANCE" ? "FOR 44-1 Rév 04/23-01-2017" :
    type === "EXTENSION" ? "FOR 44-2 Rév 04/23-01-2017" :
    "FOR 44 Rév 04/17-10-2016";

  const formTitle =
    type === "SURVEILLANCE" ? "Devis estimatif de l'évaluation de surveillance" :
    type === "EXTENSION" ? "Devis estimatif de l'extension" :
    "Devis estimatif de l'accréditation initiale ou de renouvellement";

  return (
    <div className="space-y-4 text-sm">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Devis : <b>{selected.quotationNumber || `#${selected.id}`}</b> — dossier {selected.requestReferenceNumber || `#${selected.requestId}`}
          {selected.oecName && <> — OEC : {selected.oecName}</>} — Type :&nbsp;
          <Badge variant="outline">{type}</Badge>
        </AlertDescription>
      </Alert>

      <div className="rounded border bg-slate-50 p-3">
        <div className="text-xs text-muted-foreground">{formCode}</div>
        <div className="font-semibold">{formTitle}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>N° Devis estimatif</Label>
          <Input value={devisEstimatifNumber} onChange={(e) => setDevisEstimatifNumber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Date du devis</Label>
          <Input type="date" value={devisEstimatifDate} onChange={(e) => setDevisEstimatifDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Nom du site</Label>
          <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Site concerné par l'évaluation" />
        </div>
        <div className="space-y-1">
          <Label>Adresse du site</Label>
          <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="Adresse complète du site" />
        </div>
      </div>

      <DevisSheetEditor sheet={sheet} onChange={setSheet} />

      <Separator />
      <div className="space-y-2">
        <Label>Observations / Commentaires (optionnel)</Label>
        <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Hypothèses retenues, remarques..." />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="w-3 h-3" /> TVA = 19% (modifiable selon réglementation). Frais d&apos;hébergement et de transport à la charge de l&apos;OEC.
      </div>
    </div>
  );
}
