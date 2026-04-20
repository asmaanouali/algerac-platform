import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign, Plus, CheckCircle, Calculator, Globe2, Building, Edit,
  Archive, RefreshCw, AlertTriangle, BadgeCheck
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface TariffGrid {
  id: number;
  tariffCode: string;
  name: string;
  category: string;
  forNationalOEC: boolean;
  forForeignOEC: boolean;
  applicableDomain: string;
  oecType: string;
  registrationFee: number;
  evaluationFeePerDay: number;
  documentReviewFee: number;
  surveillanceFee: number;
  renewalFee: number;
  extensionFee: number;
  travelSupplement: number;
  administrativeFee: number;
  annualFee: number;
  certificateDeliveryFee: number;
  certificateModificationFee: number;
  certificateTranslationFee: number;
  suspensionLiftFee: number;
  transferFlatRate: number;
  multiSiteAdditionalSiteFee: number;
  paymentTermDaysEvaluation: number;
  paymentTermDaysAnnual: number;
  currency: string;
  standardEvaluationDaysMin: number;
  standardEvaluationDaysMax: number;
  notes: string;
  status: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "INITIAL_ACCREDITATION",      label: "Accréditation initiale (§5.2)" },
  { value: "SURVEILLANCE",               label: "Surveillance (§5.6)" },
  { value: "RENEWAL",                    label: "Renouvellement (§5.7)" },
  { value: "EXTENSION",                  label: "Extension de portée (§5.8)" },
  { value: "EXTENSION_WITH_SURVEILLANCE",label: "Extension + Surveillance simultanée (§5.8 — 50/50 + 30%)" },
  { value: "TRANSFER",                   label: "Transfert d'accréditation forfaitaire (§5.12)" },
  { value: "PRELIMINARY_VISIT",          label: "Visite préliminaire" },
  { value: "COMPLEMENTARY_EVALUATION",   label: "Évaluation complémentaire (§5.9)" },
  { value: "ADDITIONAL_EVALUATION",      label: "Évaluation supplémentaire (§5.10)" },
  { value: "DOCUMENT_REVIEW",            label: "Revue documentaire (§5.3)" },
  { value: "REMOTE_EVALUATION",          label: "Évaluation à distance" },
  { value: "MULTISITE",                  label: "Multi-sites (§5.13 + Annexe 2)" },
  { value: "SUSPENSION_LIFT",            label: "Levée de suspension (§5.11)" },
  { value: "CERTIFICATE_DELIVERY",       label: "Délivrance / Modification / Traduction certificat (§5.14)" },
  { value: "ANNUAL_FEE",                 label: "Redevance annuelle — (annual/12)×M (§5.5)" },
];

const EMPTY_FORM = {
  name: "", category: "INITIAL_ACCREDITATION",
  forNational: true, forForeign: false,
  domain: "", oecType: "", currency: "DZD",
  registrationFee: "", evalFeePerDay: "", docReviewFee: "",
  surveillanceFee: "", renewalFee: "", extensionFee: "",
  travelSupplement: "", adminFee: "",
  annualFee: "", certificateDeliveryFee: "", certificateModificationFee: "",
  certificateTranslationFee: "", suspensionLiftFee: "", transferFlatRate: "",
  multiSiteAdditionalSiteFee: "",
  paymentTermDaysEvaluation: "20", paymentTermDaysAnnual: "60",
  minDays: "", maxDays: "", effectiveDate: "", notes: "",
};

export default function TariffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tariffs, setTariffs] = useState<TariffGrid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [editTarget, setEditTarget] = useState<TariffGrid | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [calcTab, setCalcTab] = useState<"standard" | "annual" | "extension">("standard");
  const [calcForm, setCalcForm] = useState({ domain: "", oecType: "", category: "INITIAL_ACCREDITATION", days: "3", type: "national" });
  const [annualCalc, setAnnualCalc] = useState({ annualFee: "", effectiveMonth: String(new Date().getMonth() + 1) });
  const [extCalc, setExtCalc] = useState({ evaluationFeeTotal: "", extensionDocReviewFee: "" });
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => { loadTariffs(); }, []);

  const loadTariffs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tariffs", { credentials: "include" });
      const data = await res.json();
      setTariffs(data.data || []);
    } catch { setTariffs([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.domain.trim() || !form.oecType.trim()) {
      toast({ title: "Champs requis", description: "Nom, domaine et type OEC sont obligatoires.", variant: "destructive" });
      return;
    }
    if (!form.forNational && !form.forForeign) {
      toast({ title: "Champs requis", description: "Sélectionnez au moins National ou Étranger.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await apiRequest("POST", "/api/tariffs", {
        ...form,
        paymentTermDaysEvaluation: parseInt(form.paymentTermDaysEvaluation) || 20,
        paymentTermDaysAnnual: parseInt(form.paymentTermDaysAnnual) || 60,
      });
      toast({ title: "Grille tarifaire créée", description: "Elle est en statut Brouillon. Activez-la pour la mettre en vigueur." });
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await apiRequest("PUT", `/api/tariffs/${editTarget.id}`, {
        name: form.name, notes: form.notes, currency: form.currency,
        registrationFee: form.registrationFee, evalFeePerDay: form.evalFeePerDay,
        docReviewFee: form.docReviewFee, surveillanceFee: form.surveillanceFee,
        renewalFee: form.renewalFee, extensionFee: form.extensionFee,
        travelSupplement: form.travelSupplement, adminFee: form.adminFee,
        annualFee: form.annualFee, certificateDeliveryFee: form.certificateDeliveryFee,
        certificateModificationFee: form.certificateModificationFee,
        certificateTranslationFee: form.certificateTranslationFee,
        suspensionLiftFee: form.suspensionLiftFee, transferFlatRate: form.transferFlatRate,
        multiSiteAdditionalSiteFee: form.multiSiteAdditionalSiteFee,
      });
      toast({ title: "Grille tarifaire mise à jour" });
      setShowEdit(false);
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/tariffs/${id}/activate`, {});
      toast({ title: "Tarif activé", description: "Ce tarif est maintenant en vigueur." });
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("Archiver ce tarif ? Il ne sera plus utilisable.")) return;
    try {
      await apiRequest("PUT", `/api/tariffs/${id}/archive`, {});
      toast({ title: "Tarif archivé" });
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const openEdit = (t: TariffGrid) => {
    setEditTarget(t);
    setForm({
      ...EMPTY_FORM,
      name: t.name || "", domain: t.applicableDomain || "", oecType: t.oecType || "",
      currency: t.currency || "DZD", notes: t.notes || "",
      registrationFee: t.registrationFee?.toString() || "",
      evalFeePerDay: t.evaluationFeePerDay?.toString() || "",
      docReviewFee: t.documentReviewFee?.toString() || "",
      surveillanceFee: t.surveillanceFee?.toString() || "",
      renewalFee: t.renewalFee?.toString() || "",
      extensionFee: t.extensionFee?.toString() || "",
      travelSupplement: t.travelSupplement?.toString() || "",
      adminFee: t.administrativeFee?.toString() || "",
      annualFee: t.annualFee?.toString() || "",
      certificateDeliveryFee: t.certificateDeliveryFee?.toString() || "",
      certificateModificationFee: t.certificateModificationFee?.toString() || "",
      certificateTranslationFee: t.certificateTranslationFee?.toString() || "",
      suspensionLiftFee: t.suspensionLiftFee?.toString() || "",
      transferFlatRate: t.transferFlatRate?.toString() || "",
      multiSiteAdditionalSiteFee: t.multiSiteAdditionalSiteFee?.toString() || "",
      paymentTermDaysEvaluation: t.paymentTermDaysEvaluation?.toString() || "20",
      paymentTermDaysAnnual: t.paymentTermDaysAnnual?.toString() || "60",
      minDays: t.standardEvaluationDaysMin?.toString() || "",
      maxDays: t.standardEvaluationDaysMax?.toString() || "",
    });
    setShowEdit(true);
  };

  const handleCalculate = async () => {
    try {
      if (calcTab === "standard") {
        const endpoint = calcForm.type === "national" ? "/api/tariffs/calculate/national" : "/api/tariffs/calculate/foreign";
        const params = new URLSearchParams({ domain: calcForm.domain, oecType: calcForm.oecType, category: calcForm.category, days: calcForm.days });
        const res = await fetch(`${endpoint}?${params}`, { credentials: "include" });
        const data = await res.json();
        setCalcResult({ type: "standard", total: data.data?.total });
      } else if (calcTab === "annual") {
        const params = new URLSearchParams({ annualFee: annualCalc.annualFee, effectiveMonth: annualCalc.effectiveMonth });
        const res = await fetch(`/api/tariffs/calculate/annual-prorated?${params}`, { credentials: "include" });
        const data = await res.json();
        setCalcResult({ type: "annual", ...data.data });
      } else {
        const params = new URLSearchParams({ evaluationFeeTotal: extCalc.evaluationFeeTotal, extensionDocReviewFee: extCalc.extensionDocReviewFee });
        const res = await fetch(`/api/tariffs/calculate/extension-surveillance?${params}`, { credentials: "include" });
        const data = await res.json();
        setCalcResult({ type: "extension", ...data.data });
      }
    } catch (err: any) { toast({ title: "Erreur de calcul", description: err.message, variant: "destructive" }); }
  };

  const fmtAmt = (v?: number, cur = "DZD") => v != null ? `${Number(v).toLocaleString("fr-DZ")} ${cur}` : "—";
  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label?.split(" (")[0] ?? cat.replace(/_/g, " ");

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-800", ACTIVE: "bg-green-100 text-green-800", EXPIRED: "bg-red-100 text-red-800", ARCHIVED: "bg-slate-100 text-slate-600" };
    const labels: Record<string, string> = { DRAFT: "Brouillon", ACTIVE: "Actif", EXPIRED: "Expiré", ARCHIVED: "Archivé" };
    return <Badge className={map[status] ?? "bg-gray-100 text-gray-800"}>{labels[status] ?? status}</Badge>;
  };

  const filterTariffs = (tab: string) => tariffs.filter(t =>
    tab === "all" ? true : tab === "national" ? t.forNationalOEC : tab === "foreign" ? t.forForeignOEC : t.status === tab
  );

  const TariffForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nom de la grille tarifaire *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Tarif Laboratoires – Accréditation initiale 2025" />
        </div>
        {!isEdit && (<>
          <div>
            <Label>Catégorie *</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Devise *</Label>
            <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DZD">DZD — Dinar algérien (OEC nationaux)</SelectItem>
                <SelectItem value="EUR">EUR — Euro (OEC étrangers PRO18-1)</SelectItem>
                <SelectItem value="USD">USD — Dollar US (OEC étrangers PRO18-1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Domaine d'accréditation *</Label>
            <Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="ex: Laboratoires d'essais" />
          </div>
          <div>
            <Label>Type OEC *</Label>
            <Input value={form.oecType} onChange={e => setForm({ ...form, oecType: e.target.value })} placeholder="ex: LAB, INSP, CERT, MED" />
          </div>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.forNational} onChange={e => setForm({ ...form, forNational: e.target.checked })} className="h-4 w-4" />
              <span>OEC Nationaux (PRO_18) — CPA Banque / DZD</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.forForeign} onChange={e => setForm({ ...form, forForeign: e.target.checked })} className="h-4 w-4" />
              <span>OEC Étrangers (PRO_18-1) — BEA / EUR / USD</span>
            </label>
          </div>
        </>)}
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frais principaux</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Frais d'inscription dossier (§5.1) *</Label>
          <Input type="number" min="0" value={form.registrationFee} onChange={e => setForm({ ...form, registrationFee: e.target.value })} placeholder="0" />
          <p className="text-xs text-muted-foreground mt-1">Non remboursables</p>
        </div>
        <div>
          <Label>Frais d'évaluation / j·h (§5.2)</Label>
          <Input type="number" min="0" value={form.evalFeePerDay} onChange={e => setForm({ ...form, evalFeePerDay: e.target.value })} placeholder="0" />
          <p className="text-xs text-muted-foreground mt-1">50% signature, 50% évaluation (PRO_18)</p>
        </div>
        <div>
          <Label>Revue documentaire (§5.3)</Label>
          <Input type="number" min="0" value={form.docReviewFee} onChange={e => setForm({ ...form, docReviewFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Surveillance (§5.6)</Label>
          <Input type="number" min="0" value={form.surveillanceFee} onChange={e => setForm({ ...form, surveillanceFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Renouvellement (§5.7)</Label>
          <Input type="number" min="0" value={form.renewalFee} onChange={e => setForm({ ...form, renewalFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Extension de portée (§5.8)</Label>
          <Input type="number" min="0" value={form.extensionFee} onChange={e => setForm({ ...form, extensionFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Frais administratifs</Label>
          <Input type="number" min="0" value={form.adminFee} onChange={e => setForm({ ...form, adminFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Supplément déplacement (PRO18-1)</Label>
          <Input type="number" min="0" value={form.travelSupplement} onChange={e => setForm({ ...form, travelSupplement: e.target.value })} placeholder="0" />
          <p className="text-xs text-muted-foreground mt-1">OEC étrangers uniquement</p>
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Certificat &amp; Redevance annuelle (§5.4 / §5.5)</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Redevance annuelle base 12 mois (§5.5)</Label>
          <Input type="number" min="0" value={form.annualFee} onChange={e => setForm({ ...form, annualFee: e.target.value })} placeholder="0" />
          <p className="text-xs text-muted-foreground mt-1">Proratée : (x/12) × M</p>
        </div>
        <div>
          <Label>Délivrance certificat + annexes (§5.4)</Label>
          <Input type="number" min="0" value={form.certificateDeliveryFee} onChange={e => setForm({ ...form, certificateDeliveryFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Modification certificat/annexes</Label>
          <Input type="number" min="0" value={form.certificateModificationFee} onChange={e => setForm({ ...form, certificateModificationFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Traduction certificat (§5.16 PRO18-1)</Label>
          <Input type="number" min="0" value={form.certificateTranslationFee} onChange={e => setForm({ ...form, certificateTranslationFee: e.target.value })} placeholder="0" />
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frais spéciaux (§5.11 / §5.12 / §5.13)</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Levée de suspension (§5.11)</Label>
          <Input type="number" min="0" value={form.suspensionLiftFee} onChange={e => setForm({ ...form, suspensionLiftFee: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Transfert forfaitaire (§5.12)</Label>
          <Input type="number" min="0" value={form.transferFlatRate} onChange={e => setForm({ ...form, transferFlatRate: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Supplément par site additionnel (§5.13)</Label>
          <Input type="number" min="0" value={form.multiSiteAdditionalSiteFee} onChange={e => setForm({ ...form, multiSiteAdditionalSiteFee: e.target.value })} placeholder="0" />
          <p className="text-xs text-muted-foreground mt-1">Multi-sites (Annexe 2)</p>
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Délais de paiement (§6 PRO_18)</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Délai frais d'évaluation (jours)</Label>
          <Input type="number" min="1" value={form.paymentTermDaysEvaluation} onChange={e => setForm({ ...form, paymentTermDaysEvaluation: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">Défaut PRO_18 : 20 jours</p>
        </div>
        <div>
          <Label>Délai redevance annuelle (jours)</Label>
          <Input type="number" min="1" value={form.paymentTermDaysAnnual} onChange={e => setForm({ ...form, paymentTermDaysAnnual: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">Défaut PRO_18 : 60 jours</p>
        </div>
        {!isEdit && (<>
          <div>
            <Label>Durée éval. min (j·h)</Label>
            <Input type="number" min="1" value={form.minDays} onChange={e => setForm({ ...form, minDays: e.target.value })} placeholder="1" />
          </div>
          <div>
            <Label>Durée éval. max (j·h)</Label>
            <Input type="number" min="1" value={form.maxDays} onChange={e => setForm({ ...form, maxDays: e.target.value })} placeholder="5" />
          </div>
          <div className="col-span-2">
            <Label>Date d'entrée en vigueur</Label>
            <Input type="datetime-local" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
          </div>
        </>)}
      </div>

      <div>
        <Label>Notes / Références (FOR 44, FOR 44-1, FOR 44-2)</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ex: Conforme à l'Annexe 1 de PRO_18 Ver09 — Applicable aux laboratoires d'essais ISO 17025" rows={3} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Grilles Tarifaires — PRO_18 / PRO_18-1
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Tarifs et frais d'accréditation pour OEC nationaux et étrangers
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCalcResult(null); setShowCalc(true); }}>
                <Calculator className="w-4 h-4 mr-2" />Calculateur
              </Button>
              <Button onClick={() => { setForm({ ...EMPTY_FORM }); setShowCreate(true); }}>
                <Plus className="w-4 h-4 mr-2" />Nouvelle grille
              </Button>
              <Button variant="ghost" size="sm" onClick={loadTariffs}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Bank info cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">OEC Nationaux — PRO_18 — Paiement en DZD</p>
                    <p className="text-blue-800 mt-1">
                      Virement CPA · N° compte : <span className="font-mono font-medium">007 00400 2500001 02 67</span>
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      À l'ordre de l'Organisme Algérien d'Accréditation (ALGERAC) · Délai éval : 20j · Redevance annuelle : 60j
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <Globe2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-900">OEC Étrangers — PRO_18-1 — Paiement en EUR / USD</p>
                    <p className="text-emerald-800 mt-1">
                      BEA 038HBB · Virement : <span className="font-mono font-medium">002000380383000019/97</span>
                    </p>
                    <p className="text-emerald-700 text-xs mt-1">
                      88 Rue Hassiba Ben Bouali, Alger · SWIFT : <span className="font-mono">BEXADZAL038</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PRO_18 rules */}
          <Alert className="mb-6 border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">
              <strong>Règles PRO_18 §6 :</strong> Frais d'inscription <strong>non remboursables</strong> quel que soit le résultat de la recevabilité.
              Chaque étape facturée doit être payée avant le déclenchement de la suivante.
              Annulation avec moins de <strong>8 jours ouvrables</strong> → frais engagés dus.
              La <strong>suspension</strong> n'exonère pas la redevance annuelle (seule la résiliation y met fin).
              Factures de référence : <strong>FOR 44</strong> (initial) · <strong>FOR 44-1</strong> (surveillance) · <strong>FOR 44-2</strong> (extension).
            </AlertDescription>
          </Alert>

          {/* Main tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tous ({tariffs.length})</TabsTrigger>
              <TabsTrigger value="national"><Building className="w-4 h-4 mr-1" />Nationaux</TabsTrigger>
              <TabsTrigger value="foreign"><Globe2 className="w-4 h-4 mr-1" />Étrangers</TabsTrigger>
              <TabsTrigger value="ACTIVE"><BadgeCheck className="w-4 h-4 mr-1" />Actifs</TabsTrigger>
            </TabsList>

            {["all", "national", "foreign", "ACTIVE"].map(tab => (
              <TabsContent key={tab} value={tab}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grilles tarifaires</CardTitle>
                    <CardDescription className="text-xs">
                      PRO_18 (nationaux) et PRO_18-1 (étrangers) — Annexe 1
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                    ) : filterTariffs(tab).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Aucune grille tarifaire</p>
                        <Button variant="outline" className="mt-4" onClick={() => { setForm({ ...EMPTY_FORM }); setShowCreate(true); }}>
                          <Plus className="w-4 h-4 mr-2" />Créer une grille
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="text-xs">
                              <TableHead>Code</TableHead>
                              <TableHead>Nom / Catégorie</TableHead>
                              <TableHead>OEC</TableHead>
                              <TableHead>Dev.</TableHead>
                              <TableHead>Inscription</TableHead>
                              <TableHead>Éval/j·h</TableHead>
                              <TableHead>Revue doc.</TableHead>
                              <TableHead>Redevance ann.</TableHead>
                              <TableHead>Certificat</TableHead>
                              <TableHead>Suspension</TableHead>
                              <TableHead>Délais</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterTariffs(tab).map(t => (
                              <TableRow key={t.id} className="text-xs">
                                <TableCell className="font-mono text-xs">{t.tariffCode}</TableCell>
                                <TableCell>
                                  <div className="font-medium max-w-[180px] truncate">{t.name}</div>
                                  <div className="text-muted-foreground text-xs">{categoryLabel(t.category)}</div>
                                  <div className="text-muted-foreground text-xs">{t.applicableDomain} · {t.oecType}</div>
                                </TableCell>
                                <TableCell>
                                  {t.forNationalOEC && <div className="text-xs">🇩🇿 National</div>}
                                  {t.forForeignOEC && <div className="text-xs">🌐 Étranger</div>}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{t.currency || "DZD"}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.registrationFee, t.currency)}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.evaluationFeePerDay, t.currency)}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.documentReviewFee, t.currency)}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.annualFee, t.currency)}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.certificateDeliveryFee, t.currency)}</TableCell>
                                <TableCell className="tabular-nums">{fmtAmt(t.suspensionLiftFee, t.currency)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  <div>Éval : {t.paymentTermDaysEvaluation ?? 20}j</div>
                                  <div>Ann. : {t.paymentTermDaysAnnual ?? 60}j</div>
                                </TableCell>
                                <TableCell>{getStatusBadge(t.status)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-1 justify-end">
                                    {t.status === "DRAFT" && (
                                      <>
                                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)} title="Modifier">
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleActivate(t.id)} className="text-xs h-7 px-2">
                                          <CheckCircle className="w-3 h-3 mr-1" />Activer
                                        </Button>
                                      </>
                                    )}
                                    {(t.status === "ACTIVE" || t.status === "EXPIRED") && (
                                      <Button size="sm" variant="ghost" onClick={() => handleArchive(t.id)} title="Archiver">
                                        <Archive className="w-3 h-3" />
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
            ))}
          </Tabs>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle grille tarifaire — PRO_18 / PRO_18-1</DialogTitle>
            <DialogDescription>Définissez l'ensemble des tarifs et frais conformément aux procédures en vigueur.</DialogDescription>
          </DialogHeader>
          <TariffForm isEdit={false} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer (Brouillon)"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la grille — {editTarget?.tariffCode}</DialogTitle>
            <DialogDescription>Seuls les brouillons peuvent être modifiés. Les tarifs actifs doivent être archivés puis recréés.</DialogDescription>
          </DialogHeader>
          <TariffForm isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Annuler</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Sauvegarde..." : "Sauvegarder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={showCalc} onOpenChange={setShowCalc}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />Calculateur tarifaire PRO_18</DialogTitle>
          </DialogHeader>

          <Tabs value={calcTab} onValueChange={v => { setCalcTab(v as any); setCalcResult(null); }}>
            <TabsList className="w-full">
              <TabsTrigger value="standard" className="flex-1 text-xs">Standard</TabsTrigger>
              <TabsTrigger value="annual" className="flex-1 text-xs">Redevance §5.5</TabsTrigger>
              <TabsTrigger value="extension" className="flex-1 text-xs">Ext.+Surv. §5.8</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">Calcul : inscription + (éval/j × jours) + revue doc + admin (+ déplacement si étranger)</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Domaine</Label><Input value={calcForm.domain} onChange={e => setCalcForm({ ...calcForm, domain: e.target.value })} placeholder="ex: Laboratoires" /></div>
                <div><Label>Type OEC</Label><Input value={calcForm.oecType} onChange={e => setCalcForm({ ...calcForm, oecType: e.target.value })} placeholder="ex: LAB" /></div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={calcForm.category} onValueChange={v => setCalcForm({ ...calcForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label.split(" (")[0]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>National / Étranger</Label>
                  <Select value={calcForm.type} onValueChange={v => setCalcForm({ ...calcForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="national">National (DZD)</SelectItem><SelectItem value="foreign">Étranger (EUR/USD)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Jours d'évaluation (j·h)</Label><Input type="number" min="1" value={calcForm.days} onChange={e => setCalcForm({ ...calcForm, days: e.target.value })} /></div>
              </div>
              {calcResult?.type === "standard" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">Total estimé (hors redevance annuelle)</p>
                    <p className="text-3xl font-bold text-green-700">{Number(calcResult.total).toLocaleString("fr-DZ")}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="annual" className="space-y-3 mt-3">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                <strong>Formule PRO_18 §5.5 :</strong> Redevance proratée = (Redevance / 12) × M<br />
                M = nombre de mois entiers entre la prise d'effet et le 31 décembre.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Redevance annuelle de base</Label><Input type="number" value={annualCalc.annualFee} onChange={e => setAnnualCalc({ ...annualCalc, annualFee: e.target.value })} placeholder="ex: 120000" /></div>
                <div>
                  <Label>Mois de prise d'effet</Label>
                  <Select value={annualCalc.effectiveMonth} onValueChange={v => setAnnualCalc({ ...annualCalc, effectiveMonth: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m} → M = {12 - i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {calcResult?.type === "annual" && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 space-y-1 text-center">
                    <p className="text-xs font-mono text-muted-foreground">{calcResult.formula}</p>
                    <p className="text-2xl font-bold text-blue-700">{Number(calcResult.proratedAmount).toLocaleString("fr-DZ")}</p>
                    <p className="text-xs text-muted-foreground">M = {calcResult.monthsM} mois</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="extension" className="space-y-3 mt-3">
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900">
                <strong>Règle PRO_18 §5.8 :</strong> Extension simultanée à une surveillance :<br />
                • Frais équipe : 50% surveillance / 50% extension<br />
                • Revue documentaire extension : <strong>−30%</strong>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Frais totaux équipe d'évaluation</Label><Input type="number" value={extCalc.evaluationFeeTotal} onChange={e => setExtCalc({ ...extCalc, evaluationFeeTotal: e.target.value })} placeholder="ex: 80000" /></div>
                <div><Label>Revue documentaire (extension)</Label><Input type="number" value={extCalc.extensionDocReviewFee} onChange={e => setExtCalc({ ...extCalc, extensionDocReviewFee: e.target.value })} placeholder="ex: 20000" /></div>
              </div>
              {calcResult?.type === "extension" && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Part surveillance (50%)</span><span className="font-bold">{Number(calcResult.surveillancePortion).toLocaleString("fr-DZ")}</span></div>
                    <div className="flex justify-between"><span>Part extension (50%)</span><span className="font-bold">{Number(calcResult.extensionPortion).toLocaleString("fr-DZ")}</span></div>
                    <div className="flex justify-between text-green-700"><span>Revue doc. extension (−30%)</span><span className="font-bold">{Number(calcResult.extensionDocReviewDiscounted).toLocaleString("fr-DZ")}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Total extension</span><span>{Number(calcResult.totalExtension).toLocaleString("fr-DZ")}</span></div>
                    <div className="flex justify-between font-semibold"><span>Total surveillance</span><span>{Number(calcResult.totalSurveillance).toLocaleString("fr-DZ")}</span></div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalc(false)}>Fermer</Button>
            <Button onClick={handleCalculate}><Calculator className="w-4 h-4 mr-2" />Calculer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
