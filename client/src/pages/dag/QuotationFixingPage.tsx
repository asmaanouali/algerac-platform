import { useEffect, useMemo, useState } from "react";
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
  Loader2, FileText, Download, DollarSign, Search, AlertTriangle, Send, ClipboardCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

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
  daysCount?: number;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:                       { label: "Brouillon", color: "bg-slate-200 text-slate-700" },
  SENT_TO_DAG:                 { label: "En attente DAG", color: "bg-amber-500 text-white" },
  AMOUNT_SET_PENDING_CD:       { label: "Montant fixé - attente CD", color: "bg-blue-500 text-white" },
  PENDING_CD_VALIDATION:       { label: "Validation CD", color: "bg-indigo-500 text-white" },
  VALIDATED_BY_CD:             { label: "Validé CD", color: "bg-teal-600 text-white" },
  SENT_TO_OEC:                 { label: "Envoyé à l'OEC", color: "bg-violet-600 text-white" },
  ACCEPTED_BY_OEC:             { label: "Accepté", color: "bg-emerald-600 text-white" },
  REJECTED_BY_OEC:             { label: "Refusé", color: "bg-red-500 text-white" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  return cfg ? <Badge className={cfg.color}>{cfg.label}</Badge> : <Badge variant="outline">{status}</Badge>;
}

export default function DAGQuotationFixingPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Champs d'en-tête du devis estimatif
  const [devisEstimatifNumber, setDevisEstimatifNumber] = useState("");
  const [devisEstimatifDate, setDevisEstimatifDate] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  // Détail HT par ligne
  const [breakdown, setBreakdown] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/quotations/pending-approval");
      const json = await res.json();
      setItems(Array.isArray(json) ? json : []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Chargement impossible" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      (i.quotationNumber || "").toLowerCase().includes(q) ||
      (i.requestReferenceNumber || "").toLowerCase().includes(q) ||
      (i.oecName || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const openFix = (q: Quotation) => {
    setSelected(q);
    setComments("");
    setDevisEstimatifNumber(q.quotationNumber || "");
    setDevisEstimatifDate(new Date().toISOString().slice(0, 10));
    setSiteName("");
    setSiteAddress("");
    setBreakdown({});
    setDialogOpen(true);
  };

  const setAmt = (key: string, value: string) => setBreakdown((prev) => ({ ...prev, [key]: value }));
  const num = (key: string) => {
    const v = Number(breakdown[key]);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };

  const submitAmount = async () => {
    if (!selected) return;
    const type = (selected.requestType || "INITIAL").toUpperCase();

    // Construire la map des montants HT renseignés
    const breakdownMap: Record<string, number> = {};
    Object.entries(breakdown).forEach(([k, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) breakdownMap[k] = n;
    });

    // Calcul du sous-total principal selon le type (sert de "amount" backend)
    let mainTotal = 0;
    if (type === "SURVEILLANCE") {
      mainTotal = num("analysisFeeP1") + num("evaluationFeeP1") + num("casFeeP2");
    } else if (type === "EXTENSION") {
      mainTotal = num("analysisFeeP1") + num("evaluationFeeP1") + num("certModFeeP2");
    } else {
      // INITIAL / RENOUVELLEMENT : Phase II + Phase III + (frais d'inscription si initial)
      mainTotal = num("analysisFeeP2") + num("evaluationFeeP2") + num("certificateFeeP3");
      if (type === "INITIAL") mainTotal += num("registrationFee");
    }

    if (mainTotal <= 0) {
      toast({ variant: "destructive", title: "Montants requis", description: "Veuillez saisir au moins un montant HT positif pour les frais principaux." });
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest("POST", `/api/quotations/${selected.id}/approve`, {
        amount: mainTotal,
        comments: comments || undefined,
        breakdown: breakdownMap,
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
      // Ouvre le PDF généré
      window.open(`/api/quotations/${selected.id}/devis.pdf`, "_blank", "noopener,noreferrer");
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Impossible de fixer le devis" });
    } finally {
      setSaving(false);
    }
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
              Fixez le montant des devis préparés par les RA et transmettez-les au CD pour validation.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Devis en attente ({filtered.length})</CardTitle>
                  <CardDescription>Seuls les devis envoyés par un RA à la DAG sont affichés ici.</CardDescription>
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
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun devis à traiter</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((q) => (
                    <Card key={q.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{q.quotationNumber || `Devis #${q.id}`}</p>
                            <StatusBadge status={q.status} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Dossier : {q.requestReferenceNumber || `#${q.requestId}`}
                            {q.oecName && <> · OEC : {q.oecName}</>}
                            {q.daysCount ? <> · {q.daysCount} jour(s)</> : null}
                          </p>
                          {q.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.details}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <a href={`/api/requests/${q.requestId}/doc1.pdf`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> DOC 1</Button>
                          </a>
                          <a href={`/api/requests/${q.requestId}/technical-form.pdf`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> FOR technique</Button>
                          </a>
                          <Button size="sm" onClick={() => openFix(q)}>
                            <Send className="h-3 w-3 mr-1" /> Fixer le montant
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis estimatif — Fixation des montants HT</DialogTitle>
            <DialogDescription>
              Renseignez les montants HT par phase. La TVA (19%) et les sous-totaux sont calculés automatiquement.
              Un PDF du devis estimatif (FOR 44 / 44-1 / 44-2) sera généré à la validation.
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
              breakdown={breakdown}
              setAmt={setAmt}
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

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : formulaire devis estimatif (FOR 44 / 44-1 / 44-2)
// ─────────────────────────────────────────────────────────────────────────────

const TVA = 0.19;

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
  breakdown: Record<string, string>;
  setAmt: (key: string, value: string) => void;
};

function DevisForm(props: DevisFormProps) {
  const { selected, comments, setComments,
    devisEstimatifNumber, setDevisEstimatifNumber,
    devisEstimatifDate, setDevisEstimatifDate,
    siteName, setSiteName, siteAddress, setSiteAddress,
    breakdown, setAmt } = props;

  const type = (selected.requestType || "INITIAL").toUpperCase();

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const num = (key: string) => {
    const v = Number(breakdown[key]);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  const ttc = (ht: number) => ht * (1 + TVA);

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

      {/* En-tête devis */}
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

      {/* Tableau des phases */}
      <div className="rounded border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 font-semibold">
            <tr>
              <th className="text-left p-2 w-24">Phases</th>
              <th className="text-left p-2">Désignation</th>
              <th className="text-right p-2 w-40">Montant HT (DA)</th>
              <th className="text-right p-2 w-32">Montant TTC (DA)</th>
            </tr>
          </thead>
          <tbody>
            {type === "SURVEILLANCE" && (
              <SurveillanceRows num={num} setAmt={setAmt} fmt={fmt} ttc={ttc} breakdown={breakdown} />
            )}
            {type === "EXTENSION" && (
              <ExtensionRows num={num} setAmt={setAmt} fmt={fmt} ttc={ttc} breakdown={breakdown} />
            )}
            {(type === "INITIAL" || type === "RENOUVELLEMENT") && (
              <InitialRows isInitial={type === "INITIAL"} num={num} setAmt={setAmt} fmt={fmt} ttc={ttc} breakdown={breakdown} />
            )}
          </tbody>
        </table>
      </div>

      <Separator />
      <div className="space-y-2">
        <Label>Observations / Commentaires (optionnel)</Label>
        <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Hypothèses retenues, remarques..." />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="w-3 h-3" /> TVA = 19% (modifiable selon réglementation). Frais d'hébergement et de transport à la charge de l'OEC.
      </div>
    </div>
  );
}

type RowsProps = {
  num: (k: string) => number;
  setAmt: (k: string, v: string) => void;
  fmt: (n: number) => string;
  ttc: (n: number) => number;
  breakdown: Record<string, string>;
};

function HtInput({ k, breakdown, setAmt }: { k: string; breakdown: Record<string, string>; setAmt: (k: string, v: string) => void; }) {
  return (
    <Input
      type="number" min="0" step="0.01"
      className="h-8 text-right"
      value={breakdown[k] ?? ""}
      onChange={(e) => setAmt(k, e.target.value)}
      placeholder="0.00"
    />
  );
}

function InitialRows({ isInitial, num, setAmt, fmt, ttc, breakdown }: RowsProps & { isInitial: boolean }) {
  const p2Analyse = num("analysisFeeP2");
  const p2Eval = num("evaluationFeeP2");
  const p2Sub = p2Analyse + p2Eval;
  const p3Cert = num("certificateFeeP3");
  const totalP2P3 = p2Sub + p3Cert;
  const annual = num("annualFeeP4");
  const p5A = num("analysisFeeP5");
  const p5E = num("evaluationFeeP5");
  const p5C = num("casFeeP5");
  const totalSurv = p5A + p5E + p5C;

  return (
    <>
      {isInitial && (
        <tr className="border-t">
          <td className="p-2 font-semibold align-middle text-center" rowSpan={1}>Phase I</td>
          <td className="p-2">Frais d'inscription du dossier (1)</td>
          <td className="p-2"><HtInput k="registrationFee" breakdown={breakdown} setAmt={setAmt} /></td>
          <td className="p-2 text-right">{fmt(ttc(num("registrationFee")))}</td>
        </tr>
      )}
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={3}>Phase II</td>
        <td className="p-2">Frais d'analyse documentaire</td>
        <td className="p-2"><HtInput k="analysisFeeP2" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p2Analyse))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'évaluation (2)</td>
        <td className="p-2"><HtInput k="evaluationFeeP2" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p2Eval))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">S/Total frais d'Accréditation. Phase II</td>
        <td className="p-2 text-right">{fmt(p2Sub)}</td>
        <td className="p-2 text-right">{fmt(ttc(p2Sub))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={2}>Phase III</td>
        <td className="p-2">Frais de délivrance du certificat et annexes</td>
        <td className="p-2"><HtInput k="certificateFeeP3" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p3Cert))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">Total frais d'Accréditation. Phase II + Phase III</td>
        <td className="p-2 text-right">{fmt(totalP2P3)}</td>
        <td className="p-2 text-right">{fmt(ttc(totalP2P3))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center">Phase IV</td>
        <td className="p-2">Redevance annuelle (Par année)</td>
        <td className="p-2"><HtInput k="annualFeeP4" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(annual))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={5}>Phase V</td>
        <td className="p-2 italic bg-slate-50" colSpan={3}>Évaluation de surveillance (Par année)</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'Analyse documentaire</td>
        <td className="p-2"><HtInput k="analysisFeeP5" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p5A))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'évaluation (2)</td>
        <td className="p-2"><HtInput k="evaluationFeeP5" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p5E))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais de modification du certificat et annexes (CAS) (3)</td>
        <td className="p-2"><HtInput k="casFeeP5" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p5C))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">Total Frais de Surveillance</td>
        <td className="p-2 text-right">{fmt(totalSurv)}</td>
        <td className="p-2 text-right">{fmt(ttc(totalSurv))}</td>
      </tr>
    </>
  );
}

function SurveillanceRows({ num, setAmt, fmt, ttc, breakdown }: RowsProps) {
  const a = num("analysisFeeP1");
  const e = num("evaluationFeeP1");
  const sub = a + e;
  const cas = num("casFeeP2");
  const total = sub + cas;
  return (
    <>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={3}>Phase I</td>
        <td className="p-2">Frais Analyse documentaire</td>
        <td className="p-2"><HtInput k="analysisFeeP1" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(a))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'évaluation (1)</td>
        <td className="p-2"><HtInput k="evaluationFeeP1" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(e))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">S/TOTAL frais de surveillance</td>
        <td className="p-2 text-right">{fmt(sub)}</td>
        <td className="p-2 text-right">{fmt(ttc(sub))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center">Phase II</td>
        <td className="p-2">Frais de modification du certificat et annexes (CAS) (2)</td>
        <td className="p-2"><HtInput k="casFeeP2" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(cas))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2" colSpan={2}>Total Frais de surveillance (Phase I + Phase II)</td>
        <td className="p-2 text-right">{fmt(total)}</td>
        <td className="p-2 text-right">{fmt(ttc(total))}</td>
      </tr>
    </>
  );
}

function ExtensionRows({ num, setAmt, fmt, ttc, breakdown }: RowsProps) {
  const p1A = num("analysisFeeP1");
  const p1E = num("evaluationFeeP1");
  const p1Sub = p1A + p1E;
  const p2Cert = num("certModFeeP2");
  const annualExt = num("annualExtensionFeeP3");
  const nextAnnual = num("nextAnnualFeeP3");
  const p4A = num("analysisFeeP4");
  const p4E = num("evaluationFeeP4");
  const p4C = num("casFeeP4");
  const totalSurv = p4A + p4E + p4C;
  return (
    <>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={3}>Phase I</td>
        <td className="p-2">Frais analyse documentaire</td>
        <td className="p-2"><HtInput k="analysisFeeP1" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p1A))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'évaluation (1)</td>
        <td className="p-2"><HtInput k="evaluationFeeP1" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p1E))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">S/Total Frais d'extension (Phase I)</td>
        <td className="p-2 text-right">{fmt(p1Sub)}</td>
        <td className="p-2 text-right">{fmt(ttc(p1Sub))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={2}>Phase II</td>
        <td className="p-2">Frais de modification du certificat ou annexes</td>
        <td className="p-2"><HtInput k="certModFeeP2" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p2Cert))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2">S/Total Frais d'extension (Phase II)</td>
        <td className="p-2 text-right">{fmt(p2Cert)}</td>
        <td className="p-2 text-right">{fmt(ttc(p2Cert))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={2}>Phase III</td>
        <td className="p-2">Redevance annuelle sur extension (par année) (2)</td>
        <td className="p-2"><HtInput k="annualExtensionFeeP3" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(annualExt))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Prochaine redevance (INITIALE + EXTENSIONS)</td>
        <td className="p-2"><HtInput k="nextAnnualFeeP3" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(nextAnnual))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2 font-semibold align-middle text-center" rowSpan={4}>Phase IV</td>
        <td className="p-2 italic bg-slate-50" colSpan={3}>Prochaine Évaluation de surveillance (INITIALE + EXTENSIONS) (par année)</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais Analyse documentaire</td>
        <td className="p-2"><HtInput k="analysisFeeP4" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p4A))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais d'évaluation (1)</td>
        <td className="p-2"><HtInput k="evaluationFeeP4" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p4E))}</td>
      </tr>
      <tr className="border-t">
        <td className="p-2">Frais de modification du certificat et annexes (CAS) (3)</td>
        <td className="p-2"><HtInput k="casFeeP4" breakdown={breakdown} setAmt={setAmt} /></td>
        <td className="p-2 text-right">{fmt(ttc(p4C))}</td>
      </tr>
      <tr className="border-t bg-slate-50 font-semibold">
        <td className="p-2" colSpan={2}>Total Frais de surveillance</td>
        <td className="p-2 text-right">{fmt(totalSurv)}</td>
        <td className="p-2 text-right">{fmt(ttc(totalSurv))}</td>
      </tr>
    </>
  );
}
