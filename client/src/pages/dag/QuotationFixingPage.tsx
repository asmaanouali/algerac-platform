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
  const [amount, setAmount] = useState("");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setAmount(q.amount ? String(q.amount) : "");
    setComments("");
    setDialogOpen(true);
  };

  const submitAmount = async () => {
    if (!selected) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast({ variant: "destructive", title: "Montant invalide", description: "Indiquez un montant positif." });
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest("POST", `/api/quotations/${selected.id}/approve`, {
        amount: n,
        comments: comments || undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Erreur lors de la fixation du devis");
      }
      toast({ title: "Devis fixé", description: "Le devis a été transmis au CD pour validation." });
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fixer le montant du devis</DialogTitle>
            <DialogDescription>
              Après validation, le devis sera transmis au CD. L'OEC recevra ensuite le devis et la convention.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Devis : <b>{selected.quotationNumber || `#${selected.id}`}</b> — dossier {selected.requestReferenceNumber || `#${selected.requestId}`}.
                  Consultez le DOC 1 et le formulaire technique pour évaluer l'effort avant de fixer le montant.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Montant (DA)</Label>
                <Input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 150000" />
              </div>
              <div className="space-y-2">
                <Label>Commentaires (optionnel)</Label>
                <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Détails ou hypothèses retenues..." />
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" /> Les documents DOC 1 et formulaires techniques (FOR 04 / FOR 05) sont disponibles dans la liste.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={submitAmount} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Envoi...</> : "Fixer et envoyer au CD"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
