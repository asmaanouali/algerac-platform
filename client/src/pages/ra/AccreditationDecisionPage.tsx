import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker, StringDateTimePicker } from "@/components/ui/date-time-picker";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Award, FileText, CheckCircle, Calendar, Shield, Gavel,
  Clock, AlertTriangle, Send, BookOpen, Stamp
} from "lucide-react";

export default function AccreditationDecisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [casDecisions, setCasDecisions] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [fullInfo, setFullInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showCASMeeting, setShowCASMeeting] = useState(false);
  const [showCASDecision, setShowCASDecision] = useState(false);
  const [showPrepareCert, setShowPrepareCert] = useState(false);
  const [showSurvPlan, setShowSurvPlan] = useState(false);
  const [showRefusal, setShowRefusal] = useState(false);
  const [showPostponement, setShowPostponement] = useState(false);

  // Forms
  const [casMeetingForm, setCasMeetingForm] = useState({ meetingDate: "", agenda: "" });
  const [casDecisionForm, setCasDecisionForm] = useState({
    decisionType: "", conditions: "", scope: "", duration: ""
  });
  const [certForm, setCertForm] = useState({
    certificateType: "FOR_05_1", scope: "", validityYears: "4"
  });
  const [survPlanForm, setSurvPlanForm] = useState({
    frequency: "ANNUAL", firstSurveillanceDate: "", criteria: ""
  });
  const [refusalForm, setRefusalForm] = useState({ reason: "" });
  const [postponementForm, setPostponementForm] = useState({ reason: "", conditions: "" });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const relevant = data.data.filter((r: any) =>
          ["REPORT_DRAFTING", "REPORT_VALIDATION", "REPORT_VALIDATED",
           "CAS_PREPARATION", "CAS_SCHEDULED",
           "CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT",
           "CERTIFICATE_PREPARATION", "CERTIFICATE_ISSUED",
           "ACTIVE", "SUSPENDED", "SURVEILLANCE_SCHEDULED"].includes(r.status)
        );
        setRequests(relevant);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const selectRequest = async (r: any) => {
    setSelectedRequest(r);
    try {
      const [rptRes, casRes, certRes, infoRes] = await Promise.all([
        fetch(`/api/workflow/accreditation/${r.id}/reports`, { credentials: "include" }),
        fetch(`/api/workflow/accreditation/${r.id}/cas-decisions`, { credentials: "include" }),
        fetch(`/api/workflow/accreditation/${r.id}/certificate`, { credentials: "include" }),
        fetch(`/api/workflow/accreditation/${r.id}/full-info`, { credentials: "include" })
      ]);
      const rptData = await rptRes.json();
      const casData = await casRes.json();
      const certData = await certRes.json();
      const infoData = await infoRes.json();
      if (rptData.success) setReports(rptData.data || []);
      if (casData.success) setCasDecisions(casData.data || []);
      if (certData.success) setCertificate(certData.data);
      if (infoData.success) setFullInfo(infoData.data);
    } catch (err) { console.error(err); }
  };

  // Report validation chain
  const handleValidateReport = async (rptId: number) => {
    try {
      await apiRequest("PUT", `/api/workflow/accreditation/reports/${rptId}/validate`, {});
      toast({ title: "Rapport validé par le CD" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDTValidateReport = async (rptId: number) => {
    try {
      await apiRequest("PUT", `/api/workflow/accreditation/reports/${rptId}/dt-validate`, {});
      toast({ title: "Rapport validé par le DT" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSendConsolidation = async (rptId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/reports/${rptId}/consolidation`, {});
      toast({ title: "Rapport envoyé en consolidation" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // CAS
  const handleScheduleCAS = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/cas-meeting`, casMeetingForm);
      toast({ title: "Réunion CAS programmée" });
      setShowCASMeeting(false); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCASDecision = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/cas-decision`, {
        ...casDecisionForm,
        duration: casDecisionForm.duration ? parseInt(casDecisionForm.duration) : null
      });
      toast({ title: "Décision CAS enregistrée" });
      setShowCASDecision(false); selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSendDecisionToOEC = async () => {
    try {
      await apiRequest("POST", `/api/workflow/cas/by-request/${selectedRequest.id}/send-decision-to-oec`, {});
      toast({ title: "Décision transmise à l'OEC", description: "L'OEC a été notifié de la décision du CAS" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // Certificate
  const handlePrepareCert = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/certificate`, {
        ...certForm, validityYears: parseInt(certForm.validityYears)
      });
      toast({ title: "Certificat préparé" });
      setShowPrepareCert(false); selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSignCert = async (certId: number) => {
    try {
      await apiRequest("PUT", `/api/workflow/accreditation/certificates/${certId}/sign`, {});
      toast({ title: "Certificat signé" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handlePublishCert = async (certId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/certificates/${certId}/publish`, {});
      toast({ title: "Certificat publié" });
      selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // Surveillance plan
  const handleCreateSurvPlan = async (certId: number) => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/certificates/${certId}/surveillance-plan`, survPlanForm);
      toast({ title: "Plan de surveillance PRO 13 créé" });
      setShowSurvPlan(false); selectRequest(selectedRequest); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleRefusal = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/process-refusal`, refusalForm);
      toast({ title: "Refus traité – OEC informé de ses droits de recours" });
      setShowRefusal(false); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handlePostponement = async () => {
    try {
      await apiRequest("POST", `/api/workflow/accreditation/${selectedRequest.id}/process-postponement`, postponementForm);
      toast({ title: "Report d'accréditation traité" });
      setShowPostponement(false); loadRequests();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getDecisionColor = (type: string) => {
    const m: Record<string, string> = {
      ACCREDITATION: "bg-emerald-100 text-emerald-800",
      EXTENSION: "bg-blue-100 text-blue-800",
      REDUCTION: "bg-yellow-100 text-yellow-800",
      SUSPENSION: "bg-orange-100 text-orange-800",
      WITHDRAWAL: "bg-red-100 text-red-800",
      RENEWAL: "bg-green-100 text-green-800",
      REFUSAL: "bg-red-100 text-red-800",
      POSTPONEMENT: "bg-gray-100 text-gray-800"
    };
    return m[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Décision d'accréditation & Certificat</h1>
            <p className="text-muted-foreground">
              Validation des rapports, décisions CAS et délivrance des certificats
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dossiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> :
                   requests.length === 0 ? <p className="text-sm text-muted-foreground">Aucun dossier</p> :
                   requests.map((r) => (
                    <div key={r.id} onClick={() => selectRequest(r)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedRequest?.id === r.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50 border-transparent"
                      }`}>
                      <p className="font-medium text-sm">{r.referenceNumber}</p>
                      <Badge className="mt-1" variant="outline">{r.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-3">
              {!selectedRequest ? (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez un dossier</p>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedRequest.referenceNumber}</CardTitle>
                        <CardDescription>{selectedRequest.organizationName}</CardDescription>
                      </div>
                      <Badge variant="outline">{selectedRequest.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="reports">
                      <TabsList className="mb-4">
                        <TabsTrigger value="reports">Rapports</TabsTrigger>
                        <TabsTrigger value="cas">CAS</TabsTrigger>
                        <TabsTrigger value="certificate">Certificat</TabsTrigger>
                      </TabsList>

                      {/* REPORTS Tab */}
                      <TabsContent value="reports">
                        <div className="space-y-3">
                          {reports.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun rapport</p>
                          ) : reports.map((rpt: any) => (
                            <Card key={rpt.id} className="p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span className="font-medium">Rapport #{rpt.id}</span>
                                  <Badge variant="outline">{rpt.status?.replace(/_/g, " ")}</Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3">{rpt.content}</p>

                              <div className="mt-3 flex gap-2 flex-wrap">
                                {rpt.status === "SUBMITTED" && (
                                  <Button size="sm" onClick={() => handleValidateReport(rpt.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Valider (CD)
                                  </Button>
                                )}
                                {rpt.status === "CD_VALIDATED" && (
                                  <Button size="sm" onClick={() => handleDTValidateReport(rpt.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Valider (DT)
                                  </Button>
                                )}
                                {rpt.status === "DT_VALIDATED" && (
                                  <Button size="sm" onClick={() => handleSendConsolidation(rpt.id)}>
                                    <Send className="w-3 h-3 mr-1" />Consolidation
                                  </Button>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      {/* CAS Tab */}
                      <TabsContent value="cas">
                        <div className="space-y-4">
                          {/* CAS actions */}
                          <div className="flex gap-2 flex-wrap">
                            {["REPORT_CONSOLIDATION", "CAS_SCHEDULED"].includes(selectedRequest.status) && (
                              <Button onClick={() => setShowCASMeeting(true)}>
                                <Calendar className="w-4 h-4 mr-2" />Programmer réunion CAS
                              </Button>
                            )}
                            {selectedRequest.status === "CAS_DECISION_PENDING" && (
                              <>
                                <Button onClick={() => setShowCASDecision(true)}>
                                  <Gavel className="w-4 h-4 mr-2" />Enregistrer décision
                                </Button>
                                <Button variant="outline" className="text-red-600" onClick={() => setShowRefusal(true)}>
                                  Refuser
                                </Button>
                                <Button variant="outline" className="text-yellow-600" onClick={() => setShowPostponement(true)}>
                                  Reporter
                                </Button>
                              </>
                            )}
                            {["CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT"].includes(selectedRequest.status) && (
                              <div className="w-full space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <Gavel className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium text-blue-900">Décision CAS reçue du Président</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                      {selectedRequest.status === "CAS_DECISION_GRANT" && "Décision : Accréditation accordée"}
                                      {selectedRequest.status === "CAS_DECISION_REFUSAL" && "Décision : Accréditation refusée"}
                                      {selectedRequest.status === "CAS_DECISION_POSTPONEMENT" && "Décision : Décision ajournée"}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">Vous devez transmettre cette décision à l'OEC.</p>
                                  </div>
                                </div>
                                <Button onClick={handleSendDecisionToOEC} className="bg-blue-600 hover:bg-blue-700">
                                  <Send className="w-4 h-4 mr-2" />Transmettre la décision à l'OEC
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* CAS decisions history */}
                          {casDecisions.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Décisions CAS</h4>
                              {casDecisions.map((d: any) => (
                                <Card key={d.id} className="p-4 border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Gavel className="w-4 h-4" />
                                    <Badge className={getDecisionColor(d.decisionType)}>
                                      {d.decisionType}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {d.decisionDate && new Date(d.decisionDate).toLocaleDateString("fr-FR")}
                                    </span>
                                  </div>
                                  {d.conditions && <p className="text-sm">{d.conditions}</p>}
                                  {d.scope && <p className="text-sm text-muted-foreground">Portée: {d.scope}</p>}
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* CERTIFICATE Tab */}
                      <TabsContent value="certificate">
                        <div className="space-y-4">
                          {/* Certificate actions */}
                          {selectedRequest.status === "ACCREDITATION_GRANTED" && !certificate && (
                            <Button onClick={() => setShowPrepareCert(true)}>
                              <Award className="w-4 h-4 mr-2" />Préparer le certificat
                            </Button>
                          )}

                          {certificate && (
                            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50/50">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Award className="w-5 h-5 text-emerald-600" />
                                    Certificat d'accréditation
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {certificate.certificateNumber}
                                  </p>
                                </div>
                                <Badge className={certificate.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}>
                                  {certificate.status?.replace(/_/g, " ")}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <p className="text-muted-foreground">Type</p>
                                  <p className="font-medium">{certificate.certificateType}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Portée</p>
                                  <p className="font-medium">{certificate.scope}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Début de validité</p>
                                  <p className="font-medium">
                                    {certificate.validFrom && new Date(certificate.validFrom).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fin de validité</p>
                                  <p className="font-medium">
                                    {certificate.validTo && new Date(certificate.validTo).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                {certificate.status === "PREPARED" && (
                                  <Button size="sm" onClick={() => handleSignCert(certificate.id)}>
                                    <Stamp className="w-3 h-3 mr-1" />Signer (DT/DG)
                                  </Button>
                                )}
                                {certificate.status === "SIGNED" && (
                                  <Button size="sm" onClick={() => handlePublishCert(certificate.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Publier
                                  </Button>
                                )}
                                {certificate.status === "PUBLISHED" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => setShowSurvPlan(true)}>
                                      <Shield className="w-3 h-3 mr-1" />Plan de surveillance (PRO 13)
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-emerald-700" onClick={async () => {
                                      try {
                                        if (fullInfo?.surveillancePlan?.id) {
                                          await apiRequest("POST", `/api/workflow/accreditation/surveillance-plans/${fullInfo.surveillancePlan.id}/satisfaction-form`, {});
                                          toast({ title: "Formulaire de satisfaction FOR 22 envoyé à l'OEC" });
                                        } else {
                                          toast({ title: "Info", description: "Créez d'abord le plan de surveillance", variant: "destructive" });
                                        }
                                      } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                                    }}>
                                      <Send className="w-3 h-3 mr-1" />Envoyer FOR 22 (satisfaction)
                                    </Button>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                                      toast({ title: "Documents envoyés", description: "Certificat FOR 05, annexe technique et plan de surveillance PRO 13 transmis à l'OEC" });
                                    }}>
                                      <Send className="w-3 h-3 mr-1" />Envoyer tous les documents à l'OEC
                                    </Button>
                                  </>
                                )}
                              </div>
                            </Card>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* CAS Meeting Dialog */}
          <Dialog open={showCASMeeting} onOpenChange={setShowCASMeeting}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer la réunion CAS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date de la réunion</Label>
                  <StringDateTimePicker value={casMeetingForm.meetingDate}
                    onChange={(v) => setCasMeetingForm({ ...casMeetingForm, meetingDate: v })} />
                </div>
                <div>
                  <Label>Ordre du jour</Label>
                  <Textarea value={casMeetingForm.agenda}
                    onChange={(e) => setCasMeetingForm({ ...casMeetingForm, agenda: e.target.value })}
                    placeholder="Points à l'ordre du jour..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCASMeeting(false)}>Annuler</Button>
                <Button onClick={handleScheduleCAS}>Programmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CAS Decision Dialog */}
          <Dialog open={showCASDecision} onOpenChange={setShowCASDecision}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enregistrer la décision CAS</DialogTitle>
                <DialogDescription>
                  Décision du Comité d'Accréditation Sectoriel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type de décision</Label>
                  <Select value={casDecisionForm.decisionType}
                    onValueChange={(v) => setCasDecisionForm({ ...casDecisionForm, decisionType: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCREDITATION">Accréditation</SelectItem>
                      <SelectItem value="EXTENSION">Extension</SelectItem>
                      <SelectItem value="RENEWAL">Renouvellement</SelectItem>
                      <SelectItem value="REDUCTION">Réduction</SelectItem>
                      <SelectItem value="SUSPENSION">Suspension</SelectItem>
                      <SelectItem value="WITHDRAWAL">Retrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Portée</Label>
                  <Textarea value={casDecisionForm.scope}
                    onChange={(e) => setCasDecisionForm({ ...casDecisionForm, scope: e.target.value })}
                    placeholder="Portée de l'accréditation..." />
                </div>
                <div>
                  <Label>Conditions</Label>
                  <Textarea value={casDecisionForm.conditions}
                    onChange={(e) => setCasDecisionForm({ ...casDecisionForm, conditions: e.target.value })}
                    placeholder="Conditions éventuelles..." />
                </div>
                <div>
                  <Label>Durée (mois)</Label>
                  <Input type="number" value={casDecisionForm.duration}
                    onChange={(e) => setCasDecisionForm({ ...casDecisionForm, duration: e.target.value })}
                    placeholder="48" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCASDecision(false)}>Annuler</Button>
                <Button onClick={handleCASDecision}>
                  <Gavel className="w-4 h-4 mr-2" />Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Prepare Certificate Dialog */}
          <Dialog open={showPrepareCert} onOpenChange={setShowPrepareCert}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Préparer le certificat d'accréditation (FOR 05)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type de certificat</Label>
                  <Select value={certForm.certificateType}
                    onValueChange={(v) => setCertForm({ ...certForm, certificateType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOR_05_1">FOR 05-1 (Laboratoires d'essais)</SelectItem>
                      <SelectItem value="FOR_05_2">FOR 05-2 (Laboratoires d'étalonnage)</SelectItem>
                      <SelectItem value="FOR_05_3">FOR 05-3 (Organismes d'inspection)</SelectItem>
                      <SelectItem value="FOR_05_4">FOR 05-4 (Organismes de certification)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Portée de l'accréditation</Label>
                  <Textarea value={certForm.scope}
                    onChange={(e) => setCertForm({ ...certForm, scope: e.target.value })}
                    placeholder="Portée détaillée de l'accréditation..." />
                </div>
                <div>
                  <Label>Durée de validité (années)</Label>
                  <Input type="number" value={certForm.validityYears}
                    onChange={(e) => setCertForm({ ...certForm, validityYears: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPrepareCert(false)}>Annuler</Button>
                <Button onClick={handlePrepareCert}>
                  <Award className="w-4 h-4 mr-2" />Préparer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Surveillance Plan Dialog */}
          <Dialog open={showSurvPlan} onOpenChange={setShowSurvPlan}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Plan de surveillance (PRO 13)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Fréquence</Label>
                  <Select value={survPlanForm.frequency}
                    onValueChange={(v) => setSurvPlanForm({ ...survPlanForm, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUAL">Annuelle</SelectItem>
                      <SelectItem value="SEMI_ANNUAL">Semestrielle</SelectItem>
                      <SelectItem value="QUARTERLY">Trimestrielle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de première surveillance</Label>
                  <StringDatePicker value={survPlanForm.firstSurveillanceDate}
                    onChange={(v) => setSurvPlanForm({ ...survPlanForm, firstSurveillanceDate: v })} />
                </div>
                <div>
                  <Label>Critères de surveillance</Label>
                  <Textarea value={survPlanForm.criteria}
                    onChange={(e) => setSurvPlanForm({ ...survPlanForm, criteria: e.target.value })}
                    placeholder="Critères et points de surveillance..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSurvPlan(false)}>Annuler</Button>
                <Button onClick={() => certificate && handleCreateSurvPlan(certificate.id)}>Créer le plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Refusal Dialog */}
          <Dialog open={showRefusal} onOpenChange={setShowRefusal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refus d'accréditation</DialogTitle>
                <DialogDescription>L'OEC sera informé avec mention de ses droits de recours</DialogDescription>
              </DialogHeader>
              <div>
                <Label>Motif du refus</Label>
                <Textarea value={refusalForm.reason}
                  onChange={(e) => setRefusalForm({ reason: e.target.value })}
                  placeholder="Justification détaillée du refus..." className="min-h-[120px]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRefusal(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleRefusal}>Confirmer le refus</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Postponement Dialog */}
          <Dialog open={showPostponement} onOpenChange={setShowPostponement}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report d'accréditation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif du report</Label>
                  <Textarea value={postponementForm.reason}
                    onChange={(e) => setPostponementForm({ ...postponementForm, reason: e.target.value })}
                    placeholder="Raison du report..." />
                </div>
                <div>
                  <Label>Conditions de reprise</Label>
                  <Textarea value={postponementForm.conditions}
                    onChange={(e) => setPostponementForm({ ...postponementForm, conditions: e.target.value })}
                    placeholder="Conditions pour reprendre le processus..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPostponement(false)}>Annuler</Button>
                <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handlePostponement}>
                  Confirmer le report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
