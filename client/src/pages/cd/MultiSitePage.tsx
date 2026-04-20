import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Network, Plus, CheckCircle, XCircle, Building, MapPin, Eye,
  ChevronRight, AlertTriangle, RefreshCw, Archive, Activity,
  Calculator, FileCheck, Info, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SatelliteSite {
  name: string;
  address: string;
  activities: string;
  personnel: string;
}

interface MultiSiteConfig {
  id: number;
  configCode: string;
  requestId: number;
  requestReferenceNumber: string;
  oecName: string;
  mainSiteName: string;
  mainSiteAddress: string;
  mainSiteContactName: string;
  mainSiteContactEmail: string;
  centralizedManagementSystem: boolean;
  managementSystemDescription: string;
  totalSatelliteSites: number;
  satelliteSites: string;
  sitesToEvaluateInitial: number;
  sitesToEvaluateAnnual: number;
  siteSelectionCriteria: string;
  siteSamplingJustification: string;
  evaluationSchedule: string;
  cycleDurationYears: number;
  evaluationFindings: string;
  status: string;
  statusLabel: string;
  validatedByName: string;
  validationDate: string;
  validationComments: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  DRAFT:             { color: "bg-gray-100 text-gray-700 border-gray-200",       label: "Brouillon",              icon: <Activity className="w-3 h-3" /> },
  SUBMITTED:         { color: "bg-blue-100 text-blue-700 border-blue-200",       label: "Soumis",                 icon: <ChevronRight className="w-3 h-3" /> },
  CD_REVIEW:         { color: "bg-purple-100 text-purple-700 border-purple-200", label: "En revue CD",            icon: <Eye className="w-3 h-3" /> },
  VALIDATED:         { color: "bg-green-100 text-green-700 border-green-200",    label: "Validé",                 icon: <CheckCircle className="w-3 h-3" /> },
  CHANGES_REQUESTED: { color: "bg-amber-100 text-amber-700 border-amber-200",    label: "Modifications requises", icon: <AlertTriangle className="w-3 h-3" /> },
  ACTIVE:            { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Actif",               icon: <Activity className="w-3 h-3" /> },
  ARCHIVED:          { color: "bg-slate-100 text-slate-600 border-slate-200",    label: "Archivé",                icon: <Archive className="w-3 h-3" /> },
};

const QUALIFICATION_CRITERIA = [
  { id: "legalLink",     label: "Lien juridique entre tous les sites (même entité légale)" },
  { id: "centralSM",    label: "Siège social dispose d'un SM conforme aux normes applicables" },
  { id: "commonSM",     label: "Tous les sites soumis au SM commun, défini et contrôlé par le siège" },
  { id: "internalAudit",label: "Tous les sites couverts par le programme d'audit interne" },
  { id: "centralMgmt",  label: "SM géré centralement selon un plan d'audit contrôlé + revue de direction" },
  { id: "dataCapacity", label: "Capacité à collecter et analyser les données de tous les sites" },
];

const blankForm = {
  requestId: "", mainSiteName: "", mainSiteAddress: "",
  mainSiteContact: "", mainSiteEmail: "", centralizedSystem: true,
  managementSystemDesc: "", totalSatellites: "",
  selectionCriteria: "", siteSamplingJustification: "", evaluationFindings: "",
};

const blankSatellite: SatelliteSite = { name: "", address: "", activities: "", personnel: "" };

export default function MultiSitePage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<MultiSiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [showFindings, setShowFindings] = useState(false);

  const [form, setForm] = useState({ ...blankForm });
  const [satellites, setSatellites] = useState<SatelliteSite[]>([{ ...blankSatellite }]);
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selected, setSelected] = useState<MultiSiteConfig | null>(null);
  const [validateForm, setValidateForm] = useState({ approved: true, comments: "" });
  const [findingsText, setFindingsText] = useState("");

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/multi-site", { credentials: "include" });
      const data = await res.json();
      setConfigs(data.data || []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const n = parseInt(form.totalSatellites) || 0;
  const samplingInitial = n + 1;
  const samplingAnnual  = n === 0 ? 1 : 1 + Math.ceil(Math.sqrt(n));

  const filtered = configs.filter(c => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["SUBMITTED", "CD_REVIEW"].includes(c.status);
    if (activeTab === "active") return c.status === "ACTIVE";
    if (activeTab === "changes") return c.status === "CHANGES_REQUESTED";
    return true;
  });

  const stats = {
    total:   configs.length,
    pending: configs.filter(c => ["SUBMITTED", "CD_REVIEW"].includes(c.status)).length,
    active:  configs.filter(c => c.status === "ACTIVE").length,
    changes: configs.filter(c => c.status === "CHANGES_REQUESTED").length,
  };

  const addSatellite    = () => setSatellites(p => [...p, { ...blankSatellite }]);
  const removeSatellite = (i: number) => setSatellites(p => p.filter((_, idx) => idx !== i));
  const updateSatellite = (i: number, field: keyof SatelliteSite, value: string) =>
    setSatellites(p => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const resetForm = () => {
    setForm({ ...blankForm });
    setSatellites([{ ...blankSatellite }]);
    setCriteria({});
    setEditingId(null);
  };

  const handleSubmitForm = async () => {
    if (!form.requestId || !form.mainSiteName) {
      toast({ title: "Champs requis", description: "ID demande et nom du siège central sont obligatoires", variant: "destructive" });
      return;
    }
    const allCriteriaMet = QUALIFICATION_CRITERIA.every(c => criteria[c.id]);
    if (!allCriteriaMet) {
      toast({ title: "Critères §5.1 non satisfaits", description: "Cochez tous les critères de qualification pour continuer", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      totalSatellites: n,
      requestId: parseInt(form.requestId),
      satelliteSites: JSON.stringify(satellites.filter(s => s.name)),
    };
    try {
      if (editingId) {
        await apiRequest("PUT", `/api/multi-site/${editingId}`, payload);
        toast({ title: "Configuration mise à jour" });
      } else {
        await apiRequest("POST", "/api/multi-site", payload);
        toast({ title: "Configuration multi-site créée" });
      }
      setShowCreate(false);
      resetForm();
      loadConfigs();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleAction = async (id: number, action: string, body: object = {}) => {
    try {
      await apiRequest("PUT", `/api/multi-site/${id}/${action}`, body);
      const labels: Record<string, string> = {
        submit: "Soumis pour revue CD",
        "cd-review": "Prise en charge par le CD",
        activate: "Configuration activée",
        archive: "Configuration archivée",
      };
      toast({ title: labels[action] || "Action effectuée" });
      loadConfigs();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDecide = async () => {
    if (!selected) return;
    if (!validateForm.approved && !validateForm.comments.trim()) {
      toast({ title: "Commentaires requis", description: "Précisez les modifications demandées", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("PUT", `/api/multi-site/${selected.id}/decide`, validateForm);
      toast({ title: validateForm.approved ? "✓ Configuration validée" : "Modifications demandées" });
      setShowValidate(false);
      setValidateForm({ approved: true, comments: "" });
      loadConfigs();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveFindings = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/multi-site/${selected.id}`, {
        mainSiteName: selected.mainSiteName,
        mainSiteAddress: selected.mainSiteAddress,
        mainSiteContact: selected.mainSiteContactName,
        mainSiteEmail: selected.mainSiteContactEmail,
        centralizedSystem: selected.centralizedManagementSystem,
        managementSystemDesc: selected.managementSystemDescription,
        totalSatellites: selected.totalSatelliteSites,
        satelliteSites: selected.satelliteSites,
        selectionCriteria: selected.siteSelectionCriteria,
        siteSamplingJustification: selected.siteSamplingJustification,
        evaluationFindings: findingsText,
      });
      toast({ title: "Constatations enregistrées" });
      setShowFindings(false);
      loadConfigs();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (c: MultiSiteConfig) => {
    setForm({
      requestId: String(c.requestId),
      mainSiteName: c.mainSiteName || "",
      mainSiteAddress: c.mainSiteAddress || "",
      mainSiteContact: c.mainSiteContactName || "",
      mainSiteEmail: c.mainSiteContactEmail || "",
      centralizedSystem: c.centralizedManagementSystem ?? true,
      managementSystemDesc: c.managementSystemDescription || "",
      totalSatellites: String(c.totalSatelliteSites || 0),
      selectionCriteria: c.siteSelectionCriteria || "",
      siteSamplingJustification: c.siteSamplingJustification || "",
      evaluationFindings: c.evaluationFindings || "",
    });
    try {
      const parsed = c.satelliteSites ? JSON.parse(c.satelliteSites) : [];
      setSatellites(parsed.length > 0 ? parsed : [{ ...blankSatellite }]);
    } catch { setSatellites([{ ...blankSatellite }]); }
    setCriteria(Object.fromEntries(QUALIFICATION_CRITERIA.map(cr => [cr.id, true])));
    setEditingId(c.id);
    setShowCreate(true);
  };

  const parseSatellites = (json?: string): SatelliteSite[] => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("fr-DZ") : "—";

  const getStatusBadge = (status: string) => {
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
      <Badge className={`flex items-center gap-1 border text-xs font-medium ${s.color}`}>
        {s.icon}{s.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Network className="w-6 h-6 text-primary" />
                Accréditation Multi-sites — PRO 26
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gestion des OEC à sites multiples · Rév. 03 · 24/01/2023
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowCreate(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle configuration
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "En attente revue", value: stats.pending, color: "text-blue-600" },
              { label: "Actives", value: stats.active, color: "text-emerald-600" },
              { label: "Modifications requises", value: stats.changes, color: "text-amber-600" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sampling formula info */}
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Formules PRO 26 / PRO 13-1 :</strong>
              &nbsp;Évaluation initiale = <strong>tous les sites</strong> (siège + tous les satellites, §5.3.2-a)
              &nbsp;·&nbsp;Surveillance annuelle = siège + ⌈<strong>√n</strong>⌉ sites satellites (PRO 13-1)
            </AlertDescription>
          </Alert>

          {/* Tabs + Table */}
          <Card>
            <CardHeader className="pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Toutes ({configs.length})</TabsTrigger>
                  <TabsTrigger value="pending">En revue ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="active">Actives ({stats.active})</TabsTrigger>
                  <TabsTrigger value="changes">Modifications ({stats.changes})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  <CardContent className="px-0 pb-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement…
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <Network className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Aucune configuration dans cette catégorie</p>
                        <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
                          <Plus className="w-4 h-4 mr-2" />Créer une configuration
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Demande / OEC</TableHead>
                            <TableHead>Siège central</TableHead>
                            <TableHead className="text-center">Satellites</TableHead>
                            <TableHead className="text-center">Initial (tous)</TableHead>
                            <TableHead className="text-center">Surveillance (√n)</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map(c => (
                            <TableRow key={c.id} className="hover:bg-muted/40">
                              <TableCell className="font-mono text-xs text-muted-foreground">{c.configCode}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{c.requestReferenceNumber || `#${c.requestId}`}</p>
                                  {c.oecName && <p className="text-xs text-muted-foreground">{c.oecName}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{c.mainSiteName}</p>
                                  {c.mainSiteAddress && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.mainSiteAddress}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">{c.totalSatelliteSites}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{c.sitesToEvaluateInitial} sites</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-xs">{c.sitesToEvaluateAnnual}/an</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(c.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end flex-wrap">
                                  <Button size="sm" variant="ghost" onClick={() => { setSelected(c); setShowDetail(true); }}>
                                    <Eye className="w-3 h-3 mr-1" />Voir
                                  </Button>
                                  {(c.status === "DRAFT" || c.status === "CHANGES_REQUESTED") && (
                                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Modifier</Button>
                                  )}
                                  {(c.status === "DRAFT" || c.status === "CHANGES_REQUESTED") && (
                                    <Button size="sm" onClick={() => handleAction(c.id, "submit")}>
                                      <ChevronRight className="w-3 h-3 mr-1" />Soumettre
                                    </Button>
                                  )}
                                  {c.status === "SUBMITTED" && (
                                    <Button size="sm" variant="outline" onClick={() => handleAction(c.id, "cd-review")}>
                                      <Eye className="w-3 h-3 mr-1" />Prendre en charge
                                    </Button>
                                  )}
                                  {c.status === "CD_REVIEW" && (
                                    <Button size="sm" onClick={() => { setSelected(c); setValidateForm({ approved: true, comments: "" }); setShowValidate(true); }}>
                                      <FileCheck className="w-3 h-3 mr-1" />Décision §5.2.1
                                    </Button>
                                  )}
                                  {c.status === "VALIDATED" && (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(c.id, "activate")}>
                                      <CheckCircle className="w-3 h-3 mr-1" />Activer
                                    </Button>
                                  )}
                                  {c.status === "ACTIVE" && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => { setSelected(c); setFindingsText(c.evaluationFindings || ""); setShowFindings(true); }}>
                                        Constatations
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleAction(c.id, "archive")}>
                                        <Archive className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </main>
      </div>

      {/* ── Create / Edit Dialog ────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              {editingId ? "Modifier la configuration" : "Nouvelle configuration multi-site"}
            </DialogTitle>
            <DialogDescription>PRO 26 §5.2 — Demande d'accréditation d'un OEC multisite</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Demande */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                Demande d'accréditation
              </h3>
              <Label>ID de la demande *</Label>
              <Input type="number" value={form.requestId} onChange={(e) => setForm({ ...form, requestId: e.target.value })} placeholder="Ex: 12" />
            </div>

            <Separator />

            {/* Step 2: Siège central */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                Siège central (convention DOC 02 signée avec le siège social)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du siège central *</Label>
                  <Input value={form.mainSiteName} onChange={(e) => setForm({ ...form, mainSiteName: e.target.value })} placeholder="Ex: Laboratoire Central SARL" />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input value={form.mainSiteAddress} onChange={(e) => setForm({ ...form, mainSiteAddress: e.target.value })} placeholder="Adresse complète" />
                </div>
                <div>
                  <Label>Responsable qualité</Label>
                  <Input value={form.mainSiteContact} onChange={(e) => setForm({ ...form, mainSiteContact: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.mainSiteEmail} onChange={(e) => setForm({ ...form, mainSiteEmail: e.target.value })} placeholder="email@organisme.dz" />
                </div>
              </div>
              <div className="mt-3">
                <Label>Description du système de management centralisé</Label>
                <Textarea value={form.managementSystemDesc} onChange={(e) => setForm({ ...form, managementSystemDesc: e.target.value })} rows={2} placeholder="Comment le SM est géré centralement depuis le siège…" />
              </div>
            </div>

            <Separator />

            {/* Step 3: Critères §5.1 */}
            <div>
              <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                Critères de qualification — PRO 26 §5.1
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Tous les critères doivent être satisfaits (recevabilité §5.2.1).</p>
              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                {QUALIFICATION_CRITERIA.map((cr) => (
                  <div key={cr.id} className="flex items-start gap-2">
                    <Checkbox id={cr.id} checked={!!criteria[cr.id]} onCheckedChange={(v) => setCriteria(p => ({ ...p, [cr.id]: !!v }))} className="mt-0.5" />
                    <Label htmlFor={cr.id} className="text-sm font-normal cursor-pointer">{cr.label}</Label>
                  </div>
                ))}
              </div>
              {QUALIFICATION_CRITERIA.some(cr => !criteria[cr.id]) && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {QUALIFICATION_CRITERIA.filter(cr => !criteria[cr.id]).length} critère(s) non satisfait(s) — demande refusée (§5.2.1)
                </p>
              )}
            </div>

            <Separator />

            {/* Step 4: Sites satellites */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                Sites satellites
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label>Nombre de sites satellites</Label>
                  <Input type="number" min={0} value={form.totalSatellites} onChange={(e) => setForm({ ...form, totalSatellites: e.target.value })} placeholder="0" />
                </div>
                {n > 0 && (
                  <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm">
                    <p className="font-medium text-blue-800 mb-1 flex items-center gap-1"><Calculator className="w-3.5 h-3.5" />Plan d'échantillonnage calculé</p>
                    <p className="text-blue-700">Initial: <strong>{samplingInitial} sites</strong> (tous, §5.3.2-a)</p>
                    <p className="text-blue-700">Surveillance: <strong>{samplingAnnual} sites/an</strong> (1+⌈√{n}⌉, PRO 13-1)</p>
                    <p className="text-blue-600 text-xs mt-1">Cycle: 4 ans</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {satellites.map((s, i) => (
                  <div key={i} className="border rounded-md p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground">Site satellite #{i + 1}</p>
                      {satellites.length > 1 && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeSatellite(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Nom du site</Label><Input value={s.name} placeholder="Nom" onChange={(e) => updateSatellite(i, "name", e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Adresse</Label><Input value={s.address} placeholder="Adresse" onChange={(e) => updateSatellite(i, "address", e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Activités (portée)</Label><Input value={s.activities} placeholder="Activités" onChange={(e) => updateSatellite(i, "activities", e.target.value)} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs">Personnel clé</Label><Input value={s.personnel} placeholder="Responsable, etc." onChange={(e) => updateSatellite(i, "personnel", e.target.value)} className="h-8 text-sm" /></div>
                    </div>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addSatellite}>
                  <Plus className="w-3 h-3 mr-1" />Ajouter un site satellite
                </Button>
              </div>
            </div>

            <Separator />

            {/* Step 5: Sélection */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                Critères de sélection & Justification
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>Critères de sélection des sites pour l'évaluation</Label>
                  <Textarea value={form.selectionCriteria} onChange={(e) => setForm({ ...form, selectionCriteria: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label>Justification de l'échantillonnage (surveillance)</Label>
                  <Textarea value={form.siteSamplingJustification} onChange={(e) => setForm({ ...form, siteSamplingJustification: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleSubmitForm}>{editingId ? "Enregistrer" : "Créer la configuration"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────── */}
      {selected && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />{selected.configCode}
              </DialogTitle>
              <DialogDescription>
                Demande {selected.requestReferenceNumber || `#${selected.requestId}`}
                {selected.oecName && ` · ${selected.oecName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border flex-wrap">
                {getStatusBadge(selected.status)}
                <Separator orientation="vertical" className="h-5" />
                <span className="text-xs text-muted-foreground">Créé le {formatDate(selected.createdAt)}</span>
                {selected.validationDate && (
                  <><Separator orientation="vertical" className="h-5" />
                  <span className="text-xs text-muted-foreground">Validé le {formatDate(selected.validationDate)} par {selected.validatedByName}</span></>
                )}
              </div>
              {selected.validationComments && (
                <Alert className={selected.status === "CHANGES_REQUESTED" ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm"><strong>Commentaires CD :</strong> {selected.validationComments}</AlertDescription>
                </Alert>
              )}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Building className="w-4 h-4 text-primary" />Siège central</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div><span className="text-muted-foreground">Nom :</span> <strong>{selected.mainSiteName}</strong></div>
                  <div><span className="text-muted-foreground">Adresse :</span> {selected.mainSiteAddress || "—"}</div>
                  <div><span className="text-muted-foreground">Contact :</span> {selected.mainSiteContactName || "—"}</div>
                  <div><span className="text-muted-foreground">Email :</span> {selected.mainSiteContactEmail || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">SM centralisé :</span>{" "}
                    <Badge variant="outline" className={selected.centralizedManagementSystem ? "text-green-700" : "text-red-700"}>
                      {selected.centralizedManagementSystem ? "✓ Oui" : "✗ Non"}
                    </Badge>
                  </div>
                </div>
                {selected.managementSystemDescription && (
                  <p className="text-sm text-muted-foreground mt-2 bg-muted/30 p-2 rounded">{selected.managementSystemDescription}</p>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Calculator className="w-4 h-4 text-primary" />Plan d'échantillonnage</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border p-3"><p className="text-2xl font-bold text-blue-600">{selected.totalSatelliteSites}</p><p className="text-xs text-muted-foreground mt-1">Sites satellites</p></div>
                  <div className="rounded-md border p-3 bg-blue-50"><p className="text-2xl font-bold text-blue-700">{selected.sitesToEvaluateInitial}</p><p className="text-xs text-muted-foreground mt-1">Initiale (tous)</p></div>
                  <div className="rounded-md border p-3 bg-violet-50"><p className="text-2xl font-bold text-violet-700">{selected.sitesToEvaluateAnnual}</p><p className="text-xs text-muted-foreground mt-1">Surveillance/an (√n)</p></div>
                </div>
                {selected.siteSelectionCriteria && (
                  <p className="text-sm text-muted-foreground mt-2 bg-muted/30 p-2 rounded"><strong>Critères :</strong> {selected.siteSelectionCriteria}</p>
                )}
              </div>
              {parseSatellites(selected.satelliteSites).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" />Sites satellites ({parseSatellites(selected.satelliteSites).length})</h4>
                    <div className="space-y-2">
                      {parseSatellites(selected.satelliteSites).map((s, i) => (
                        <div key={i} className="border rounded-md p-3 text-sm bg-white">
                          <div className="flex items-start justify-between">
                            <div><p className="font-medium">{s.name || `Site ${i + 1}`}</p>{s.address && <p className="text-muted-foreground text-xs">{s.address}</p>}</div>
                            <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                          </div>
                          {s.activities && <p className="text-xs mt-1"><span className="text-muted-foreground">Activités :</span> {s.activities}</p>}
                          {s.personnel && <p className="text-xs"><span className="text-muted-foreground">Personnel :</span> {s.personnel}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {selected.evaluationFindings && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" />Constatations d'évaluation (§5.4)</h4>
                    <div className="rounded-md border p-3 bg-amber-50 text-sm whitespace-pre-wrap">{selected.evaluationFindings}</div>
                  </div>
                </>
              )}
              <div className="rounded-md border p-3 bg-green-50 text-sm">
                <p className="font-medium text-green-800 flex items-center gap-1 mb-1"><FileCheck className="w-4 h-4" />Certificat (§5.5)</p>
                <p className="text-green-700 text-xs">Un <strong>certificat unique</strong> sera émis (FOR 16-1 si portée reconnue EA, FOR 16-3 sinon), incluant le nom du siège et la liste de tous les sites en annexe technique.</p>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowDetail(false)}>Fermer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Validate Dialog ───────────────────────────────────────── */}
      {selected && (
        <Dialog open={showValidate} onOpenChange={setShowValidate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-primary" />Décision CD — Recevabilité §5.2.1</DialogTitle>
              <DialogDescription>
                <strong>{selected.configCode}</strong> · {selected.mainSiteName} · {selected.totalSatelliteSites} sites satellites
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setValidateForm(p => ({ ...p, approved: true }))}
                  className={`rounded-md border p-3 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                    validateForm.approved ? "bg-green-50 border-green-400 text-green-700" : "hover:bg-muted/50"
                  }`}>
                  <CheckCircle className="w-5 h-5" />Valider
                  <span className="text-xs font-normal text-muted-foreground">Convention DOC 02 avec le siège</span>
                </button>
                <button type="button" onClick={() => setValidateForm(p => ({ ...p, approved: false }))}
                  className={`rounded-md border p-3 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                    !validateForm.approved ? "bg-amber-50 border-amber-400 text-amber-700" : "hover:bg-muted/50"
                  }`}>
                  <XCircle className="w-5 h-5" />Demander modifications
                  <span className="text-xs font-normal text-muted-foreground">Critères §5.1 non satisfaits</span>
                </button>
              </div>
              <div>
                <Label>Commentaires{!validateForm.approved && <span className="text-destructive ml-1">*</span>}</Label>
                <Textarea value={validateForm.comments} onChange={(e) => setValidateForm(p => ({ ...p, comments: e.target.value }))}
                  placeholder={validateForm.approved ? "Observations éventuelles…" : "Précisez les modifications requises ou critères non satisfaits…"}
                  rows={3} />
              </div>
              {!validateForm.approved && (
                <Alert className="border-amber-300 bg-amber-50">
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Si un critère §5.1 n'est pas satisfait, la demande multisite est refusée ou acceptée avec réduction du périmètre (PRO 26 §5.2.1).
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowValidate(false)}>Annuler</Button>
              <Button onClick={handleDecide} className={validateForm.approved ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}>
                {validateForm.approved ? "✓ Valider" : "Demander modifications"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Findings Dialog ───────────────────────────────────────── */}
      {selected && (
        <Dialog open={showFindings} onOpenChange={setShowFindings}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Constatations d'évaluation — §5.4</DialogTitle>
              <DialogDescription>{selected.configCode} · {selected.mainSiteName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Enregistrez les écarts critiques et/ou systémiques par site. En cas d'écart systémique, le CD peut décider d'une évaluation complémentaire de tous les sites (§5.4-a).
                </AlertDescription>
              </Alert>
              <div>
                <Label>Constatations par site</Label>
                <Textarea value={findingsText} onChange={(e) => setFindingsText(e.target.value)}
                  placeholder={`Ex:\n[Siège] NC-001: non-conformité critique...\n[Site Annaba] EC-001: écart mineur...\nÉcart systémique: ...`}
                  rows={7} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFindings(false)}>Annuler</Button>
              <Button onClick={handleSaveFindings}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
