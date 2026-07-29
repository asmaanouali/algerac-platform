import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Loader2, FileText, CheckCircle, XCircle, Send, Globe, AlertTriangle,
  Download, Search, ClipboardCheck, ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { openAccreditationDoc1Pdf, openAccreditationTechnicalFormPdf } from "@/lib/pdf-documents";

// Persist study progress in localStorage so RA can resume where they stopped.
const storageKey = (requestId: number | string) => `ra-feasibility-${requestId}`;

interface PersistedStudy {
  step: "documents" | "resources" | "decision";
  technicalAnalysis: string;
  complianceCheck: string;
  resourcesAvailable: string;
  decision: string;
  comments: string;
  rejectionReason: string;
  docChecks: Record<string, boolean>;
  administrativeReview: {
    doc1Complete: boolean;
    docsAdminOk: boolean;
    forTechnicalOk: boolean;
    accreditationScope: string;
  };
  // PRO 26 §5.1 — revue des 6 critères par le RA pour les demandes multisites
  multisiteCriteriaReview: Record<string, { verified: boolean; comment: string }>;
  updatedAt: string;
}

// PRO 26 §5.1 — 6 critères de qualification ; identiques au formulaire OEC
const MULTISITE_CRITERIA: { id: string; label: string }[] = [
  { id: "legalLink",     label: "Lien juridique entre tous les sites (même entité légale)" },
  { id: "centralSM",     label: "Le siège social dispose d'un SM conforme à la norme" },
  { id: "commonSM",      label: "Tous les sites soumis au SM commun défini par le siège" },
  { id: "internalAudit", label: "Tous les sites couverts par le programme d'audit interne" },
  { id: "centralMgmt",   label: "SM géré centralement (audit interne + revue de direction)" },
  { id: "dataCapacity",  label: "Capacité à collecter et analyser les données de tous les sites" },
];

const emptyStudy: PersistedStudy = {
  step: "documents",
  technicalAnalysis: "",
  complianceCheck: "",
  resourcesAvailable: "",
  decision: "",
  comments: "",
  rejectionReason: "",
  docChecks: {},
  administrativeReview: { doc1Complete: false, docsAdminOk: false, forTechnicalOk: false, accreditationScope: "" },
  multisiteCriteriaReview: {},
  updatedAt: "",
};

export default function RAFeasibilityPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [study, setStudy] = useState<PersistedStudy>(emptyStudy);

  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentValidationDate, setPaymentValidationDate] = useState<string | null>(null);

  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [refusing, setRefusing] = useState(false);

  // Debounce timer for backend draft saves
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Depend on the user id (a stable primitive) rather than the whole `user`
  // object — some auth consumers derive a new `user` object reference on each
  // render, which would otherwise re-trigger this effect and re-flash the
  // full-page loader on every unrelated re-render.
  const userId = (user as any)?.id;
  useEffect(() => {
    if (!authLoading && !userId) setLocation("/");
    else if (userId && !authLoading) loadRequests(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadRequests = async (isInitial = false) => {
    try {
      // Only show the blocking full-page loader on the very first load —
      // subsequent refreshes (e.g. after starting a study) should not blank
      // the whole page and reset the user's scroll position/selection.
      if (isInitial) setLoading(true);
      const res = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await res.json();
      const filtered = data.filter((r: any) => ["ASSIGNED_TO_RA", "RECEIVABILITY_STUDY", "RESOURCE_CHECK", "RECEIVABILITY_PENDING_CD_REVIEW"].includes(r.status));
      setRequests(filtered);
      // Auto-select last active request so RA can resume seamlessly after reconnect
      const lastId = localStorage.getItem("ra-feasibility-last-request");
      if (lastId) {
        const last = filtered.find((r: any) => String(r.id) === lastId && r.status === "RECEIVABILITY_STUDY");
        if (last) selectRequest(last);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const persist = (patch: Partial<PersistedStudy>) => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.id;
    setStudy((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      // Always save to localStorage immediately
      try { localStorage.setItem(storageKey(reqId), JSON.stringify(next)); } catch { /* quota */ }
      // Debounce-save to backend so progress survives any device/browser
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        fetch(`/api/feasibility-studies/draft/${reqId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => { /* best-effort, localStorage is the fallback */ });
      }, 1500);
      return next;
    });
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    setDetails(null);
    // Remember last opened request for auto-resume on next login
    localStorage.setItem("ra-feasibility-last-request", String(r.id));

    // Restore persisted study – prefer backend (survives any device) then localStorage
    let restored: PersistedStudy = emptyStudy;
    if (r.status === "RECEIVABILITY_STUDY") {
      try {
        const draftRes = await fetch(`/api/feasibility-studies/draft/${r.id}`, { credentials: "include" });
        if (draftRes.ok) {
          const text = await draftRes.text();
          if (text && text.trim() !== "{}" && text.trim() !== "") {
            const parsed = JSON.parse(text);
            if (parsed && Object.keys(parsed).length > 0) {
              restored = { ...emptyStudy, ...parsed };
            }
          }
        }
      } catch { /* fall through */ }
    }
    // Fall back to localStorage if backend had nothing
    if (restored === emptyStudy) {
      try {
        const raw = localStorage.getItem(storageKey(r.id));
        if (raw) restored = { ...emptyStudy, ...JSON.parse(raw) };
      } catch { /* ignore */ }
    }
    setStudy(restored);

    // Load dossier details (doc1 + FOR forms + documents)
    setLoadingDetails(true);
    try {
      const d = await apiRequest("GET", `/api/requests/${r.id}/full-details`);
      setDetails(await d.json());
    } catch { setDetails(null); }
    finally { setLoadingDetails(false); }

    // Check payment verification from DAG
    setPaymentVerified(false);
    setPaymentValidationDate(null);
    try {
      const pr = await apiRequest("GET", `/api/payments/request/${r.id}`);
      const payments = await pr.json();
      const validated = Array.isArray(payments)
        ? payments.find((p: any) => p.status === "DAG_VALIDATED" || p.status === "COMPLETED")
        : (payments?.status === "DAG_VALIDATED" || payments?.status === "COMPLETED") ? payments : null;
      if (validated) {
        setPaymentVerified(true);
        setPaymentValidationDate(validated.dagValidatedDate || validated.paymentDate || null);
      }
    } catch { /* best effort */ }
  };

  const startStudy = async () => {
    if (!selectedRequest) return;
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/start-study`);
      toast({ title: "Dossier confirmé", description: "Étude de recevabilité démarrée." });
      loadRequests();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const refuseAssignment = async () => {
    if (!selectedRequest || !refuseReason.trim()) return;
    try {
      setRefusing(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/refuse-assignment`, { reason: refuseReason.trim() });
      toast({ title: "Dossier refusé", description: "Le Chef de Département a été notifié pour réassignation." });
      setRefuseDialogOpen(false);
      setRefuseReason("");
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setRefusing(false); }
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) return;
    if (!study.decision) return;
    if (study.decision === "RECEIVABLE" && !paymentVerified) {
      toast({ variant: "destructive", title: "Paiement non confirmé", description: "Le DAG doit d'abord confirmer le paiement des frais d'enregistrement." });
      return;
    }
    if (study.decision === "NOT_RECEIVABLE" && !study.rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Raison requise" }); return;
    }
    // PRO 26 §5.2.1 : si demande multisites, tous les critères §5.1 doivent avoir été examinés
    const isMultisite = !!details?.request?.isMultisite;
    if (isMultisite) {
      const allReviewed = MULTISITE_CRITERIA.every(c => {
        const r = study.multisiteCriteriaReview[c.id];
        return r && (r.comment?.trim().length || 0) > 0;
      });
      if (!allReviewed) {
        toast({ variant: "destructive", title: "Revue §5.1 incomplète", description: "Tous les critères PRO 26 §5.1 doivent être examinés avec un commentaire." });
        return;
      }
      if (study.decision === "RECEIVABLE" && !MULTISITE_CRITERIA.every(c => study.multisiteCriteriaReview[c.id]?.verified)) {
        toast({ variant: "destructive", title: "Critères non vérifiés", description: "Pour déclarer la demande recevable, les 6 critères §5.1 doivent être vérifiés." });
        return;
      }
    }
    try {
      setSubmitting(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/receivability-decision`, {
        isReceivable: study.decision === "RECEIVABLE",
        comments: `${study.technicalAnalysis}\n\nConformité: ${study.complianceCheck}\n\nPortée évaluée: ${study.administrativeReview.accreditationScope}\n\nCommentaires: ${study.comments}${study.rejectionReason ? "\n\nRaison du rejet: " + study.rejectionReason : ""}`,
        multisiteCriteriaReviewJson: isMultisite ? JSON.stringify(study.multisiteCriteriaReview) : null,
      });
      toast({ title: "Étude envoyée au CD", description: "Votre étude a été soumise pour validation." });
      // Clear persisted draft since it's submitted
      try { localStorage.removeItem(storageKey(selectedRequest.id)); } catch { /* ignore */ }
      loadRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  // Parse documents from the request description JSON
  const parsedDescription = (() => {
    try { return details?.request?.description ? JSON.parse(details.request.description) : null; } catch { return null; }
  })();
  const documents: Array<{ key?: string; name: string; base64?: string; mimeType?: string }> = Array.isArray(parsedDescription?.documents) ? parsedDescription.documents : [];
  const filteredDocs = documents.filter((d) => !docSearch.trim() || d.name.toLowerCase().includes(docSearch.toLowerCase()));

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

  const openDoc1 = () => {
    if (!selectedRequest) return;
    openAccreditationDoc1Pdf({ request: selectedRequest, oecProfile: details?.oecProfile, parsed: parsedDescription });
  };

  const openTechnicalForm = () => {
    if (!selectedRequest) return;
    openAccreditationTechnicalFormPdf({ request: selectedRequest, oecProfile: details?.oecProfile, parsed: parsedDescription });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Étude de Recevabilité</h1>
              <p className="text-muted-foreground mt-2">Analysez le dossier (DOC1 + formulaires FOR) selon les critères de recevabilité (étape 2, PRO 12 / FOR 55).</p>
            </div>

            <Alert><AlertDescription><strong>Délai :</strong> 6 mois maximum à compter de la réception du dossier. <span className="text-muted-foreground">Votre progression est sauvegardée automatiquement — vous pouvez quitter et reprendre plus tard.</span></AlertDescription></Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Dossiers à étudier</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente</p>
                  ) : requests.map((r) => {
                    const hasDraft = typeof window !== "undefined" && !!localStorage.getItem(storageKey(r.id));
                    return (
                      <div key={r.id} onClick={() => selectRequest(r)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{r.referenceNumber || `#${r.id}`}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.oec?.organizationName}</p>
                            <p className="text-xs text-muted-foreground">{r.domain}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <Badge variant={r.status === "RECEIVABILITY_STUDY" ? "default" : r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "outline" : "secondary"} className={`text-xs ${r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "border-blue-300 text-blue-700" : ""}`}>
                              {r.status === "RECEIVABILITY_STUDY" ? "En cours" : r.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? "Chez le CD" : "Nouveau"}
                            </Badge>
                            {hasDraft && r.status !== "RECEIVABILITY_PENDING_CD_REVIEW" && (
                              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">Reprendre</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Study form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Étude de recevabilité administrative</CardTitle>
                  <CardDescription>
                    {selectedRequest
                      ? `Dossier: ${selectedRequest.referenceNumber || `Séq. #${(selectedRequest as any).sequenceNumber ?? selectedRequest.id}`}`
                      : "Sélectionnez un dossier"}
                  </CardDescription>
                  {selectedRequest && !selectedRequest.referenceNumber && selectedRequest.status === "RECEIVABLE" && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between gap-3">
                      <div className="text-sm text-emerald-800">
                        Dossier accepté — attribuez la référence d'accréditation finale (AC/domaine/séq./année).
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/requests/${selectedRequest.id}/assign-final-reference`, {
                              method: "POST",
                              credentials: "include",
                            });
                            const json = await res.json();
                            if (!res.ok || json?.success === false) throw new Error(json?.message || "Erreur");
                            window.location.reload();
                          } catch (e: any) {
                            alert(e?.message || "Impossible d'attribuer la référence");
                          }
                        }}
                      >
                        Attribuer la référence
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Sélectionnez un dossier à gauche</p>
                  ) : selectedRequest.status === "ASSIGNED_TO_RA" ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">Ce dossier vous a été assigné par le CD. Confirmez-le pour démarrer l'étude de recevabilité, ou refusez-le en indiquant un motif.</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={startStudy}><CheckCircle className="mr-2 h-4 w-4" />Confirmer & démarrer l'étude</Button>
                        <Button variant="destructive" onClick={() => { setRefuseReason(""); setRefuseDialogOpen(true); }}>
                          <XCircle className="mr-2 h-4 w-4" />Refuser le dossier
                        </Button>
                      </div>
                    </div>
                  ) : selectedRequest.status === "RECEIVABILITY_PENDING_CD_REVIEW" ? (
                    <div className="text-center py-8 space-y-4">
                      <CheckCircle className="h-12 w-12 mx-auto text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg">En attente de validation du CD</h3>
                        <p className="text-muted-foreground mt-2">Votre étude a été envoyée au Chef de Département.</p>
                      </div>
                    </div>
                  ) : (
                    <Tabs value={study.step} onValueChange={(v) => persist({ step: v as any })} className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="documents"><FileText className="w-3 h-3 mr-1" />1. Documents & Paiement</TabsTrigger>
                        <TabsTrigger value="resources"><ShieldCheck className="w-3 h-3 mr-1" />2. Ressources</TabsTrigger>
                        <TabsTrigger value="decision"><ClipboardCheck className="w-3 h-3 mr-1" />3. Décision</TabsTrigger>
                      </TabsList>

                      {/* ── 1. Documents ── */}
                      <TabsContent value="documents" className="space-y-4">
                        <Card className="border-slate-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Documents du dossier ({documents.length})</CardTitle>
                            <CardDescription>Consultez les pièces soumises par l'OEC (DOC1 + formulaires techniques FOR + administratifs)</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {/* Official generated PDFs */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Button size="sm" variant="outline" onClick={openDoc1} disabled={!parsedDescription}>
                                <Download className="w-3 h-3 mr-1" />DOC 01 (PDF)
                              </Button>
                              <Button size="sm" variant="outline" onClick={openTechnicalForm} disabled={!parsedDescription?.technicalForms}>
                                <Download className="w-3 h-3 mr-1" />Formulaire technique (PDF)
                              </Button>
                            </div>
                            {loadingDetails ? (
                              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" /></div>
                            ) : documents.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Aucun document disponible</p>
                            ) : (
                              <>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input placeholder="Rechercher un document..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} className="pl-9 h-9" />
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                  {filteredDocs.map((d, i) => {
                                    const k = d.key || d.name;
                                    return (
                                      <div key={`${k}-${i}`} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <input type="checkbox"
                                            checked={!!study.docChecks[k]}
                                            onChange={(e) => persist({ docChecks: { ...study.docChecks, [k]: e.target.checked } })}
                                            className="h-4 w-4"
                                          />
                                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                          <span className="truncate">{d.name}</span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7" disabled={!d.base64} onClick={() => downloadDoc(d)}>
                                          <Download className="w-3 h-3 mr-1" /> {d.base64 ? "Télécharger" : "Sans fichier"}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5"
                              checked={study.administrativeReview.doc1Complete}
                              onChange={(e) => persist({ administrativeReview: { ...study.administrativeReview, doc1Complete: e.target.checked } })}
                            />
                            DOC1 complet et cohérent
                          </label>
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5"
                              checked={study.administrativeReview.docsAdminOk}
                              onChange={(e) => persist({ administrativeReview: { ...study.administrativeReview, docsAdminOk: e.target.checked } })}
                            />
                            Documents administratifs complets
                          </label>
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5"
                              checked={study.administrativeReview.forTechnicalOk}
                              onChange={(e) => persist({ administrativeReview: { ...study.administrativeReview, forTechnicalOk: e.target.checked } })}
                            />
                            Formulaires techniques (FOR 04/05/06/07…) remplis
                          </label>
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs">Portée d'accréditation évaluée</Label>
                            <Input value={study.administrativeReview.accreditationScope}
                              onChange={(e) => persist({ administrativeReview: { ...study.administrativeReview, accreditationScope: e.target.value } })}
                              placeholder="Résumé de la portée demandée" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Analyse technique des documents *</Label>
                          <Textarea value={study.technicalAnalysis}
                            onChange={(e) => persist({ technicalAnalysis: e.target.value })}
                            placeholder="Vérifiez la complétude et la conformité des documents soumis..." rows={4} />
                        </div>
                        <div className="space-y-2">
                          <Label>Vérification de conformité aux normes *</Label>
                          <Textarea value={study.complianceCheck}
                            onChange={(e) => persist({ complianceCheck: e.target.value })}
                            placeholder="Vérifiez la conformité aux normes applicables..." rows={4} />
                        </div>

                        <div className={`flex items-center gap-3 p-4 border rounded-lg ${paymentVerified ? "border-green-300 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                          {paymentVerified ? <CheckCircle className="h-4 w-4 text-green-700" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}
                          <div>
                            <p className={`font-medium text-sm ${paymentVerified ? "text-green-700" : "text-amber-700"}`}>
                              {paymentVerified ? "Paiement validé par le DAG" : "En attente de validation du paiement par le DAG"}
                            </p>
                            <p className={`text-xs ${paymentVerified ? "text-green-600" : "text-amber-600"}`}>
                              {paymentVerified
                                ? (paymentValidationDate ? `Validé le ${new Date(paymentValidationDate).toLocaleDateString("fr-FR")}` : "Frais d'enregistrement vérifiés")
                                : "Vous ne pourrez pas valider (recevable) tant que le DAG n'a pas confirmé le paiement."}
                            </p>
                          </div>
                        </div>

                        <Button onClick={() => persist({ step: "resources" })} disabled={!study.technicalAnalysis || !study.complianceCheck}>
                          Suivant : Ressources
                        </Button>
                      </TabsContent>

                      {/* ── 2. Resources ── */}
                      <TabsContent value="resources" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Disponibilité des ressources d'évaluation *</Label>
                          <RadioGroup value={study.resourcesAvailable} onValueChange={(v) => persist({ resourcesAvailable: v })}>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 cursor-pointer">
                              <RadioGroupItem value="yes" id="ra-y" />
                              <Label htmlFor="ra-y" className="cursor-pointer flex-1"><p className="font-medium">Ressources disponibles</p><p className="text-sm text-muted-foreground">Évaluateurs compétents disponibles en interne</p></Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 cursor-pointer">
                              <RadioGroupItem value="foreign" id="ra-f" />
                              <Label htmlFor="ra-f" className="cursor-pointer flex-1"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><div><p className="font-medium">Experts étrangers nécessaires</p><p className="text-sm text-muted-foreground">L'OEC sera consulté pour les frais supplémentaires</p></div></div></Label>
                            </div>
                          </RadioGroup>
                        </div>
                        {study.resourcesAvailable === "foreign" && <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Si l'OEC refuse, le dossier sera classé.</AlertDescription></Alert>}
                        <Button onClick={() => persist({ step: "decision" })} disabled={!study.resourcesAvailable}>Suivant : Décision</Button>
                      </TabsContent>

                      {/* ── 3. Decision ── */}
                      <TabsContent value="decision" className="space-y-4">
                        {!paymentVerified && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription><strong>Validation impossible.</strong> Le DAG n'a pas encore confirmé le paiement des frais d'enregistrement. Vous pouvez cependant enregistrer votre étude et revenir plus tard.</AlertDescription>
                          </Alert>
                        )}
                        <div className="space-y-3">
                          <Label>Décision de recevabilité *</Label>
                          <RadioGroup value={study.decision} onValueChange={(v) => persist({ decision: v })}>
                            <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer ${!paymentVerified ? "opacity-50" : "hover:border-green-300"}`}>
                              <RadioGroupItem value="RECEIVABLE" id="dec-r" disabled={!paymentVerified} />
                              <Label htmlFor="dec-r" className="cursor-pointer flex-1"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="font-medium">Recevable</p><p className="text-sm text-muted-foreground">Le dossier passera à la contractualisation</p></div></div></Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-red-300 cursor-pointer">
                              <RadioGroupItem value="NOT_RECEIVABLE" id="dec-nr" />
                              <Label htmlFor="dec-nr" className="cursor-pointer flex-1"><div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" /><div><p className="font-medium">Non recevable</p><p className="text-sm text-muted-foreground">L'OEC devra corriger et resoumettre</p></div></div></Label>
                            </div>
                          </RadioGroup>
                        </div>
                        {/* PRO 26 §5.1 — revue des critères de qualification multisites */}
                        {details?.request?.isMultisite && (
                          <Card className="p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck className="h-4 w-4 text-blue-700" />
                              <h4 className="font-medium text-sm text-blue-900">Revue des critères de qualification multisites</h4>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">Examinez chacun des 6 critères déclarés par l'OEC et confirmez leur vérification à partir des pièces du dossier.</p>
                            <div className="space-y-3">
                              {MULTISITE_CRITERIA.map(c => {
                                const r = study.multisiteCriteriaReview[c.id] || { verified: false, comment: "" };
                                return (
                                  <div key={c.id} className="pb-3 border-b border-blue-100 last:border-0">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                      <input type="checkbox" className="mt-1" checked={r.verified}
                                        onChange={(e) => persist({ multisiteCriteriaReview: { ...study.multisiteCriteriaReview, [c.id]: { ...r, verified: e.target.checked } } })} />
                                      <span className="text-sm flex-1">{c.label}</span>
                                    </label>
                                    <Textarea className="mt-2" rows={2} placeholder="Commentaire / preuves examinées…"
                                      value={r.comment}
                                      onChange={(e) => persist({ multisiteCriteriaReview: { ...study.multisiteCriteriaReview, [c.id]: { ...r, comment: e.target.value } } })} />
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        )}
                        <div className="space-y-2"><Label>Commentaires</Label><Textarea value={study.comments} onChange={(e) => persist({ comments: e.target.value })} placeholder="Observations générales..." rows={3} /></div>
                        {study.decision === "NOT_RECEIVABLE" && (
                          <div className="space-y-2"><Label>Raison du rejet *</Label><Textarea value={study.rejectionReason} onChange={(e) => persist({ rejectionReason: e.target.value })} placeholder="Détaillez les raisons..." rows={4} /></div>
                        )}
                        <Button onClick={handleSubmitDecision} disabled={submitting || !study.decision || (study.decision === "RECEIVABLE" && !paymentVerified)}>
                          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : <><Send className="mr-2 h-4 w-4" />Soumettre la décision au CD</>}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={refuseDialogOpen} onOpenChange={setRefuseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser ce dossier</DialogTitle>
            <DialogDescription>
              Le dossier repartira chez le Chef de Département pour être réassigné à un autre RA. Un motif est obligatoire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motif du refus *</Label>
            <Textarea rows={4} value={refuseReason} onChange={(e) => setRefuseReason(e.target.value)} placeholder="Expliquez pourquoi vous refusez ce dossier..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefuseDialogOpen(false)} disabled={refusing}>Annuler</Button>
            <Button variant="destructive" onClick={refuseAssignment} disabled={refusing || !refuseReason.trim()}>
              {refusing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Envoi...</> : <><XCircle className="w-4 h-4 mr-1" />Confirmer le refus</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
