import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, FileText, CheckCircle, ArrowRight, AlertTriangle, Users, HelpCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function QuotationAndConventionPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Team composition state
  const [reeCount] = useState(1);
  const [etCount, setEtCount] = useState(1);
  const [eqCount, setEqCount] = useState(0);
  const [obsCount, setObsCount] = useState(0);
  const [supCount, setSupCount] = useState(0);
  const [expCount, setExpCount] = useState(0);

  // Per-member duration state
  const [reeDuration, setReeDuration] = useState("");
  const [etDuration, setEtDuration] = useState("");
  const [eqDuration, setEqDuration] = useState("");
  const [obsDuration, setObsDuration] = useState("");
  const [supDuration, setSupDuration] = useState("");
  const [expDuration, setExpDuration] = useState("");

  const [quotationDetails, setQuotationDetails] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const [quotationCreated, setQuotationCreated] = useState(false);
  const [quotationId, setQuotationId] = useState<number | null>(null);
  const [quotationData, setQuotationData] = useState<any>(null);
  const [quotationSentToDAG, setQuotationSentToDAG] = useState(false);
  const [quotationApprovedByDAG, setQuotationApprovedByDAG] = useState(false);

  // CD help for estimation
  const [cdHelpRequested, setCdHelpRequested] = useState(false);
  const [cdHelpMessage, setCdHelpMessage] = useState("");

  // Convention state
  const [conventionContent, setConventionContent] = useState("");
  const [conventionTerms, setConventionTerms] = useState("");
  const [creatingConvention, setCreatingConvention] = useState(false);
  const [conventionCreated, setConventionCreated] = useState(false);
  const [conventionId, setConventionId] = useState<number | null>(null);
  const [conventionData, setConventionData] = useState<any>(null);

  // Actions
  const [sendingToDAG, setSendingToDAG] = useState(false);
  const [sendingToCD, setSendingToCD] = useState(false);

  useEffect(() => {
    if (user && !authLoading) { loadRequest(); checkExistingDocuments(); }
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const checkExistingDocuments = async () => {
    try {
      const [quotRes, convRes] = await Promise.all([
        fetch(`/api/quotations/by-request/${requestId}`, { credentials: "include" }),
        fetch(`/api/conventions/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (quotRes.ok) {
        const q = await quotRes.json();
        if (q.length > 0) {
          setQuotationCreated(true);
          setQuotationId(q[0].id);
          setQuotationData(q[0]);
          if (["SENT_TO_DAG"].includes(q[0].status)) setQuotationSentToDAG(true);
          if (["APPROVED_BY_DAG", "PENDING_CD_VALIDATION", "CD_VALIDATED", "SENT_TO_OEC", "VALIDATED_BY_OEC"].includes(q[0].status)) {
            setQuotationSentToDAG(true);
            setQuotationApprovedByDAG(true);
          }
        }
      }
      if (convRes.ok) {
        const c = await convRes.json();
        if (c.length > 0) {
          setConventionCreated(true);
          setConventionId(c[0].id);
          setConventionData(c[0]);
        }
      }
    } catch (err) { console.error(err); }
  };

  const totalTeamMembers = reeCount + etCount + eqCount + obsCount + supCount + expCount;

  // Calculate total duration from per-member durations
  const computeTotalDuration = () => {
    let total = 0;
    if (reeDuration) total += parseFloat(reeDuration) * reeCount;
    if (etDuration) total += parseFloat(etDuration) * etCount;
    if (eqDuration && eqCount > 0) total += parseFloat(eqDuration) * eqCount;
    if (obsDuration && obsCount > 0) total += parseFloat(obsDuration) * obsCount;
    if (supDuration && supCount > 0) total += parseFloat(supDuration) * supCount;
    if (expDuration && expCount > 0) total += parseFloat(expDuration) * expCount;
    return total;
  };

  const handleCreateQuotation = async () => {
    if (!reeDuration || parseFloat(reeDuration) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "La durée du REE est obligatoire" });
      return;
    }
    if (!etDuration || parseFloat(etDuration) <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "La durée des évaluateurs techniques est obligatoire" });
      return;
    }
    if (eqCount > 0 && (!eqDuration || parseFloat(eqDuration) <= 0)) {
      toast({ variant: "destructive", title: "Erreur", description: "La durée des évaluateurs qualité est obligatoire" });
      return;
    }
    if (etCount < 1) {
      toast({ variant: "destructive", title: "Erreur", description: "Il faut au minimum 1 évaluateur technique" });
      return;
    }

    const totalDuration = computeTotalDuration();
    if (totalDuration <= 0) {
      toast({ variant: "destructive", title: "Erreur", description: "La durée totale doit être positive" });
      return;
    }

    try {
      setCreatingQuotation(true);
      const res = await apiRequest("POST", "/api/quotations/create", {
        requestId: parseInt(requestId!),
        reeCount,
        etCount,
        eqCount,
        obsCount,
        supCount,
        expCount,
        evaluationDurationDays: totalDuration,
        reeDurationDays: reeDuration ? parseFloat(reeDuration) : null,
        etDurationDays: etDuration ? parseFloat(etDuration) : null,
        eqDurationDays: eqCount > 0 && eqDuration ? parseFloat(eqDuration) : null,
        obsDurationDays: obsCount > 0 && obsDuration ? parseFloat(obsDuration) : null,
        supDurationDays: supCount > 0 && supDuration ? parseFloat(supDuration) : null,
        expDurationDays: expCount > 0 && expDuration ? parseFloat(expDuration) : null,
        cdHelpRequested,
        cdHelpMessage: cdHelpRequested ? cdHelpMessage : null,
        details: quotationDetails,
      });
      const result = await res.json();
      setQuotationId(result.data?.id || result.id);
      setQuotationData(result.data || result);
      setQuotationCreated(true);
      toast({ title: "Demande créée", description: "La demande d'établissement du devis a été créée avec succès" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingQuotation(false); }
  };

  const handleSendToDAG = async () => {
    if (!quotationId) return;
    try {
      setSendingToDAG(true);
      await apiRequest("POST", `/api/quotations/${quotationId}/send-to-dag`);
      setQuotationSentToDAG(true);
      toast({ title: "Envoyé au DAG", description: "La demande d'établissement du devis a été envoyée au DAG" });
      loadRequest();
      checkExistingDocuments();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToDAG(false); }
  };

  const handleCreateConvention = async () => {
    if (!conventionContent.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Le contenu de la convention est obligatoire" });
      return;
    }
    try {
      setCreatingConvention(true);
      const res = await apiRequest("POST", "/api/conventions/create", {
        requestId: parseInt(requestId!),
        content: conventionContent,
        termsAndConditions: conventionTerms,
      });
      const result = await res.json();
      setConventionId(result.data?.id || result.id);
      setConventionData(result.data || result);
      setConventionCreated(true);
      toast({ title: "Convention créée", description: "La convention a été créée avec succès" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCreatingConvention(false); }
  };

  const handleSendToCD = async () => {
    try {
      setSendingToCD(true);
      await apiRequest("POST", `/api/quotations/request-cd-validation/${requestId}`);
      toast({ title: "Envoyé au CD", description: "Le devis et la convention ont été envoyés au CD pour validation" });
      setTimeout(() => setLocation("/ra/dashboard"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSendingToCD(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!request) return <div className="container max-w-2xl mx-auto py-8"><Alert variant="destructive"><AlertDescription>Demande non trouvée</AlertDescription></Alert></div>;

  // Determine current step
  const getStep = () => {
    if (!quotationCreated) return 1;
    if (!quotationSentToDAG) return 2;
    if (!conventionCreated) return 3;
    if (!quotationApprovedByDAG) return 3; // Still waiting for DAG
    const bothReady = quotationApprovedByDAG && conventionCreated;
    if (bothReady && !["QUOTATION_CONVENTION_PENDING_CD", "QUOTATION_SENT_TO_OEC", "QUOTATION_VALIDATED"].includes(request?.status)) return 4;
    return 5;
  };
  const step = getStep();

  const cdModification = request?.status === "QUOTATION_CONVENTION_CD_MODIF";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Étape 3 — Contractualisation</h1>
              <p className="text-muted-foreground mt-2">Devis et convention pour {request.referenceNumber}</p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>OEC :</strong> {request.oec?.organizationName}<br />
                <strong>Domaine :</strong> {request.domain}<br />
                <strong>Type :</strong> {request.type}
              </AlertDescription>
            </Alert>

            {cdModification && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Le CD a demandé des modifications.</strong> Veuillez corriger le devis et/ou la convention puis renvoyer au CD.
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Steps */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { num: 1, label: "Demande de devis" },
                { num: 2, label: "Envoi au DAG" },
                { num: 3, label: "Convention" },
                { num: 4, label: "Validation CD" },
                { num: 5, label: "Envoi OEC" },
              ].map(({ num, label }) => (
                <div key={num} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${num < step ? "bg-green-500 text-white" : num === step ? "bg-primary text-white" : "bg-gray-200 text-gray-600"}`}>
                    {num < step ? <CheckCircle className="w-5 h-5" /> : num}
                  </div>
                  <span className={`text-sm whitespace-nowrap ${num === step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
                  {num < 5 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>

            {/* ──────── ÉTAPE 1: DEMANDE DE DEVIS ──────── */}
            <Card className={step === 1 || cdModification ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Demande d'Établissement du Devis
                  {quotationCreated && <Badge variant="outline" className="text-green-600 border-green-300 ml-2">Créée</Badge>}
                  {quotationSentToDAG && <Badge variant="outline" className="text-blue-600 border-blue-300 ml-1">Envoyée au DAG</Badge>}
                  {quotationApprovedByDAG && <Badge variant="outline" className="text-green-700 border-green-400 ml-1">DAG approuvé</Badge>}
                </CardTitle>
                <CardDescription>
                  Proposez la composition de l'équipe et la durée d'évaluation <strong>par membre</strong>. Le DAG fixera le montant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {quotationCreated && !cdModification ? (
                  <div className="space-y-4">
                    <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Demande d'établissement du devis créée avec succès</AlertDescription></Alert>
                    {quotationData && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium">Composition proposée</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="p-2 bg-blue-50 rounded">
                            <span className="text-muted-foreground">REE :</span> <strong>{quotationData.reeCount || 1}</strong>
                            {quotationData.reeDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.reeDurationDays} H/j)</span>}
                          </div>
                          <div className="p-2 bg-blue-50 rounded">
                            <span className="text-muted-foreground">Évl. Technique :</span> <strong>{quotationData.etCount || 1}</strong>
                            {quotationData.etDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.etDurationDays} H/j)</span>}
                          </div>
                          {(quotationData.eqCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Évl. Qualité :</span> <strong>{quotationData.eqCount}</strong>{quotationData.eqDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.eqDurationDays} H/j)</span>}</div>}
                          {(quotationData.obsCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Observateur :</span> <strong>{quotationData.obsCount}</strong>{quotationData.obsDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.obsDurationDays} H/j)</span>}</div>}
                          {(quotationData.supCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Superviseur :</span> <strong>{quotationData.supCount}</strong>{quotationData.supDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.supDurationDays} H/j)</span>}</div>}
                          {(quotationData.expCount > 0) && <div className="p-2 bg-gray-50 rounded"><span className="text-muted-foreground">Expert :</span> <strong>{quotationData.expCount}</strong>{quotationData.expDurationDays && <span className="text-xs text-blue-600 ml-1">({quotationData.expDurationDays} H/j)</span>}</div>}
                        </div>
                        <div className="p-2 bg-primary/5 rounded">
                          <span className="text-muted-foreground">Durée totale d'évaluation :</span> <strong>{quotationData.evaluationDurationDays} H/j</strong>
                        </div>
                        {quotationData.cdHelpRequested && (
                          <div className="p-2 bg-amber-50 rounded border border-amber-200">
                            <span className="text-amber-700 text-sm"><HelpCircle className="h-4 w-4 inline mr-1" />Aide CD demandée pour estimation</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Étape 2: Envoi au DAG */}
                    {!quotationSentToDAG && quotationId && (
                      <Card className="border-primary mt-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Envoyer au DAG</CardTitle>
                          <CardDescription>Le DAG définira le montant du devis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full" onClick={handleSendToDAG} disabled={sendingToDAG}>
                            {sendingToDAG ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer au DAG</>}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {quotationSentToDAG && !quotationApprovedByDAG && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Clock className="h-4 w-4" />
                        <AlertDescription className="text-blue-800">
                          En attente que le DAG établisse le montant du devis. Vous pouvez commencer à préparer la convention en attendant.
                        </AlertDescription>
                      </Alert>
                    )}

                    {quotationApprovedByDAG && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          Le DAG a approuvé et établi le montant du devis.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Composition de l'Équipe</h4>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>REE (fixé)</Label>
                          <Input type="number" value={1} disabled className="bg-muted" />
                          <p className="text-xs text-muted-foreground">Responsable Équipe Évaluation</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Évaluateur Technique *</Label>
                          <Input type="number" min={1} value={etCount} onChange={(e) => setEtCount(Math.max(1, parseInt(e.target.value) || 1))} />
                          <p className="text-xs text-muted-foreground">Minimum 1</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Évaluateur Qualité</Label>
                          <Input type="number" min={0} value={eqCount} onChange={(e) => setEqCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Observateur</Label>
                          <Input type="number" min={0} value={obsCount} onChange={(e) => setObsCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Superviseur</Label>
                          <Input type="number" min={0} value={supCount} onChange={(e) => setSupCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Expert</Label>
                          <Input type="number" min={0} value={expCount} onChange={(e) => setExpCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800">
                          Total membres de l'équipe : <strong>{totalTeamMembers}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Per-member duration */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Durée de l'évaluation par membre (H/j) *
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Indiquez la durée d'intervention en homme-jours pour chaque type de membre de l'équipe.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>REE ({reeCount}) *</Label>
                          <Input type="number" placeholder="Ex: 3" value={reeDuration} onChange={(e) => setReeDuration(e.target.value)} min="0.5" step="0.5" />
                        </div>
                        <div className="space-y-2">
                          <Label>Évl. Technique ({etCount}) *</Label>
                          <Input type="number" placeholder="Ex: 3" value={etDuration} onChange={(e) => setEtDuration(e.target.value)} min="0.5" step="0.5" />
                        </div>
                        {eqCount > 0 && (
                          <div className="space-y-2">
                            <Label>Évl. Qualité ({eqCount}) *</Label>
                            <Input type="number" placeholder="Ex: 2" value={eqDuration} onChange={(e) => setEqDuration(e.target.value)} min="0.5" step="0.5" />
                          </div>
                        )}
                        {obsCount > 0 && (
                          <div className="space-y-2">
                            <Label>Observateur ({obsCount})</Label>
                            <Input type="number" placeholder="Ex: 1" value={obsDuration} onChange={(e) => setObsDuration(e.target.value)} min="0.5" step="0.5" />
                          </div>
                        )}
                        {supCount > 0 && (
                          <div className="space-y-2">
                            <Label>Superviseur ({supCount})</Label>
                            <Input type="number" placeholder="Ex: 1" value={supDuration} onChange={(e) => setSupDuration(e.target.value)} min="0.5" step="0.5" />
                          </div>
                        )}
                        {expCount > 0 && (
                          <div className="space-y-2">
                            <Label>Expert ({expCount})</Label>
                            <Input type="number" placeholder="Ex: 2" value={expDuration} onChange={(e) => setExpDuration(e.target.value)} min="0.5" step="0.5" />
                          </div>
                        )}
                      </div>

                      {computeTotalDuration() > 0 && (
                        <div className="p-3 bg-primary/5 rounded-lg border">
                          <p className="text-sm font-medium">
                            Durée totale estimée : <strong>{computeTotalDuration().toFixed(1)} H/j</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CD Help */}
                    <div className="space-y-3 p-4 border rounded-lg bg-amber-50/50">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="cd-help"
                          checked={cdHelpRequested}
                          onCheckedChange={(checked) => setCdHelpRequested(!!checked)}
                        />
                        <label htmlFor="cd-help" className="cursor-pointer">
                          <p className="font-medium text-sm flex items-center gap-1">
                            <HelpCircle className="h-4 w-4 text-amber-600" />
                            J'ai besoin de l'aide du CD pour estimer la durée
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Le CD pourra consulter un expert pour vous aider
                          </p>
                        </label>
                      </div>
                      {cdHelpRequested && (
                        <Textarea
                          placeholder="Décrivez votre difficulté d'estimation..."
                          value={cdHelpMessage}
                          onChange={(e) => setCdHelpMessage(e.target.value)}
                          rows={3}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Notes et détails (optionnel)</Label>
                      <Textarea placeholder="Précisions sur la composition, justifications..." value={quotationDetails} onChange={(e) => setQuotationDetails(e.target.value)} rows={4} />
                    </div>

                    <Button className="w-full" onClick={handleCreateQuotation} disabled={creatingQuotation}>
                      {creatingQuotation ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><FileText className="mr-2 h-4 w-4" />Créer la demande d'établissement du devis</>}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ──────── ÉTAPE 3: CONVENTION ──────── */}
            {/* Convention can be created even before DAG approves the quotation */}
            {quotationSentToDAG && (
              <Card className={step === 3 ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Convention d'Accréditation
                    {conventionCreated && <Badge variant="outline" className="text-green-600 border-green-300 ml-2">Créée</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Établissez la convention d'accréditation. Vous pouvez la créer même si le DAG n'a pas encore établi le montant du devis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conventionCreated ? (
                    <div className="space-y-4">
                      <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Convention créée avec succès</AlertDescription></Alert>
                      {conventionData && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">N° Convention</p>
                            <p className="font-mono font-medium">{conventionData.conventionNumber}</p>
                          </div>
                          {conventionData.content && (
                            <div>
                              <p className="text-sm text-muted-foreground">Contenu</p>
                              <p className="text-sm whitespace-pre-wrap mt-1">{conventionData.content?.substring(0, 200)}{conventionData.content?.length > 200 ? "..." : ""}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Contenu de la convention *</Label>
                        <Textarea placeholder="Contenu principal de la convention..." value={conventionContent} onChange={(e) => setConventionContent(e.target.value)} rows={10} />
                      </div>
                      <div className="space-y-2">
                        <Label>Termes et conditions</Label>
                        <Textarea placeholder="Termes et conditions..." value={conventionTerms} onChange={(e) => setConventionTerms(e.target.value)} rows={6} />
                      </div>
                      <Button className="w-full" onClick={handleCreateConvention} disabled={creatingConvention}>
                        {creatingConvention ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><FileText className="mr-2 h-4 w-4" />Créer la convention</>}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ──────── ÉTAPE 4: ENVOI AU CD POUR VALIDATION ──────── */}
            {quotationApprovedByDAG && conventionCreated && !["QUOTATION_CONVENTION_PENDING_CD", "QUOTATION_SENT_TO_OEC", "QUOTATION_VALIDATED"].includes(request?.status) && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Demander la validation du CD
                  </CardTitle>
                  <CardDescription>
                    Le devis est approuvé par le DAG et la convention est prête. Envoyez les deux documents au CD pour validation.
                    Le CD pourra valider et transmettre à l'OEC, ou vous demander des modifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <div><p className="text-sm font-medium text-green-800">Devis</p><p className="text-xs text-green-600">Approuvé par le DAG</p></div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <div><p className="text-sm font-medium text-green-800">Convention</p><p className="text-xs text-green-600">Créée</p></div>
                    </div>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important :</strong> Ni vous ni le CD n'avez accès au montant du devis. Seuls le DAG et l'OEC peuvent voir le montant.
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" size="lg" onClick={handleSendToCD} disabled={sendingToCD}>
                    {sendingToCD ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer au CD pour validation</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Waiting for DAG + convention ready = explain the blocking */}
            {quotationSentToDAG && !quotationApprovedByDAG && conventionCreated && (
              <Alert className="border-amber-200 bg-amber-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  <strong>En attente du DAG.</strong> La convention est prête, mais le devis n'est pas encore approuvé par le DAG.
                  Vous pourrez demander la validation du CD dès que le DAG aura établi le montant.
                </AlertDescription>
              </Alert>
            )}

            {/* Status messages */}
            {request?.status === "QUOTATION_CONVENTION_PENDING_CD" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Le devis et la convention sont en cours de validation par le CD. En attente de sa décision...
                </AlertDescription>
              </Alert>
            )}
            {request?.status === "QUOTATION_SENT_TO_OEC" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Le CD a validé le devis et la convention et les a envoyés à l'OEC. L'OEC a 10 jours pour accepter.
                </AlertDescription>
              </Alert>
            )}
            {request?.status === "QUOTATION_VALIDATED" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  L'OEC a validé le devis et signé la convention. Passez à l'étape 4 (constitution de l'équipe).
                </AlertDescription>
              </Alert>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
