import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRightLeft, ArrowLeft, FileText, Paperclip, X,
  AlertTriangle, ShieldAlert, DollarSign
} from "lucide-react";

interface AttachedDoc { name: string; type: string; data: string; }
interface AccreditationRequest { id: number; referenceNumber: string; status: string; }

export default function TransferCreatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedDoc[]>([]);

  const [form, setForm] = useState({
    requestId: "",
    reason: "LEGAL_RESTRUCTURING",
    reasonDetails: "",
    targetOrgName: "",
    targetOrgDetails: "",
    targetIsNewEntity: false,
    transferredScope: "",
    fullScope: true,
    scopeModifications: "",
    impartialityCompliance: true,
    assessmentMethodsContinuity: true,
    lastEvaluationStatus: "",
    riskAnalysis: "",
    continuityAssessment: "",
    managementContinuity: true,
    personnelContinuity: true,
    equipmentContinuity: true,
    financialRegularized: false,
  });

  useEffect(() => {
    fetch("/api/requests/my-requests", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : (data.data || []);
        setRequests(all.filter((r: AccreditationRequest) =>
          ["active", "certificate_issued"].includes(r.status?.toLowerCase())
        ));
      })
      .catch(() => setRequests([]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachedFiles((prev) => [...prev, { name: file.name, type: file.type, data: base64 }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));

  const isSubmitDisabled =
    !form.requestId ||
    form.requestId === "_none" ||
    !form.targetOrgName ||
    !form.financialRegularized ||
    !form.riskAnalysis ||
    !form.continuityAssessment ||
    (form.reason === "OTHER" && !form.reasonDetails);

  const handleSubmit = async () => {
    if (!form.financialRegularized) {
      toast({ title: "Erreur", description: "Veuillez confirmer la régularisation de la situation financière", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await apiRequest("POST", "/api/transfers", {
        requestId: parseInt(form.requestId),
        reason: form.reason,
        sourceOrgName: (user as any)?.organizationName || user?.fullName,
        sourceOrgDetails: "",
        targetOrgName: form.targetOrgName,
        targetOrgDetails: form.targetOrgDetails,
        targetIsNewEntity: form.targetIsNewEntity,
        transferredScope: form.transferredScope,
        reasonDetails: form.reasonDetails,
        fullScope: form.fullScope,
        scopeModifications: form.scopeModifications,
        riskAnalysis: form.riskAnalysis,
        impartialityCompliance: form.impartialityCompliance,
        assessmentMethodsContinuity: form.assessmentMethodsContinuity,
        lastEvaluationStatus: form.lastEvaluationStatus,
        financialRegularized: form.financialRegularized,
      });
      const createData = await createRes.json();
      const transferId: number = createData.data?.id;

      await apiRequest("PUT", `/api/transfers/${transferId}/documents`, {
        continuityAssessment: form.continuityAssessment,
        managementContinuity: form.managementContinuity,
        personnelContinuity: form.personnelContinuity,
        equipmentContinuity: form.equipmentContinuity,
        attachedDocuments: attachedFiles.length > 0 ? attachedFiles : null,
      });

      toast({ title: "Demande de transfert soumise avec succès" });
      setLocation("/oec/transfert");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/oec/transfert")}>
              <ArrowLeft className="w-4 h-4 mr-1" />Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-primary" />Demander un transfert d'accréditation
              </h1>
            </div>
          </div>

          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="w-4 h-4 !text-amber-600" />
            <AlertDescription>
              Pendant la période de transfert, vous ne pouvez pas réaliser des prestations sous accréditation.
            </AlertDescription>
          </Alert>

          <div className="space-y-5">
            {/* Demande liée */}
            <Card>
              <CardHeader><CardTitle className="text-base">Accréditation concernée</CardTitle></CardHeader>
              <CardContent>
                <Label className="font-semibold">Demande d'accréditation liée *</Label>
                <Select value={form.requestId} onValueChange={(v) => set("requestId", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionnez votre accréditation active" />
                  </SelectTrigger>
                  <SelectContent>
                    {requests.length === 0 ? (
                      <SelectItem value="_none" disabled>Aucune accréditation active disponible</SelectItem>
                    ) : (
                      requests.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.referenceNumber || `Demande #${r.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Motif */}
            <Card>
              <CardHeader><CardTitle className="text-base">Motif du transfert</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="font-semibold">Motif *</Label>
                  <Select value={form.reason} onValueChange={(v) => set("reason", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARENT_REORGANIZATION">Réorganisation société mère</SelectItem>
                      <SelectItem value="SUBSIDIARY_CREATION">Création de filiale</SelectItem>
                      <SelectItem value="SCOPE_CESSION">Cession de portée à une autre entité</SelectItem>
                      <SelectItem value="MERGER">Fusion de deux OEC</SelectItem>
                      <SelectItem value="LEGAL_RESTRUCTURING">Restructuration juridique</SelectItem>
                      <SelectItem value="ACQUISITION">Acquisition</SelectItem>
                      <SelectItem value="NAME_CHANGE">Changement de nom</SelectItem>
                      <SelectItem value="LOCATION_CHANGE">Changement de localisation</SelectItem>
                      <SelectItem value="SPIN_OFF">Scission</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.reason === "OTHER" && (
                    <div className="mt-2">
                      <Label>Préciser le motif *</Label>
                      <Textarea
                        value={form.reasonDetails}
                        onChange={(e) => set("reasonDetails", e.target.value)}
                        placeholder="Décrivez le motif du transfert..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
                {form.reason !== "OTHER" && (
                  <div>
                    <Label>Détails / Justification</Label>
                    <Textarea
                      value={form.reasonDetails}
                      onChange={(e) => set("reasonDetails", e.target.value)}
                      placeholder="Informations complémentaires sur le transfert..."
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organisme cible */}
            <Card>
              <CardHeader><CardTitle className="text-base">Organisme bénéficiaire du transfert</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nom de l'organisme *</Label>
                  <Input value={form.targetOrgName} onChange={(e) => set("targetOrgName", e.target.value)}
                    placeholder="Nom du nouvel organisme" className="mt-1" />
                </div>
                <div>
                  <Label>Détails (adresse, statut juridique...)</Label>
                  <Textarea value={form.targetOrgDetails} onChange={(e) => set("targetOrgDetails", e.target.value)}
                    placeholder="Adresse, statut juridique, contact..." className="mt-1" rows={2} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.targetIsNewEntity} onCheckedChange={(v) => set("targetIsNewEntity", v)} />
                  <Label>Organisme en cours de création (nouvelle filiale)</Label>
                </div>
              </CardContent>
            </Card>

            {/* Périmètre */}
            <Card>
              <CardHeader><CardTitle className="text-base">Périmètre de transfert</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={form.fullScope} onCheckedChange={(v) => set("fullScope", v)} />
                  <Label>Transfert de tout le périmètre</Label>
                </div>
                <div>
                  <Label>Périmètre à transférer *</Label>
                  <Textarea value={form.transferredScope} onChange={(e) => set("transferredScope", e.target.value)}
                    placeholder="Décrivez le périmètre concerné..." className="mt-1" rows={2} />
                </div>
                {!form.fullScope && (
                  <div>
                    <Label>Modifications du périmètre</Label>
                    <Textarea value={form.scopeModifications} onChange={(e) => set("scopeModifications", e.target.value)}
                      placeholder="Périmètre exclu ou modifié..." className="mt-1" rows={2} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analyse des risques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />Analyse des risques (PRO 31 §5)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Respect des exigences d'impartialité</Label>
                  <Switch checked={form.impartialityCompliance} onCheckedChange={(v) => set("impartialityCompliance", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Continuité des méthodes d'évaluation de la conformité</Label>
                  <Switch checked={form.assessmentMethodsContinuity} onCheckedChange={(v) => set("assessmentMethodsContinuity", v)} />
                </div>
                <div>
                  <Label>État des écarts de la dernière évaluation et plan d'action</Label>
                  <Textarea value={form.lastEvaluationStatus} onChange={(e) => set("lastEvaluationStatus", e.target.value)}
                    placeholder="Décrivez le statut des écarts et les actions correctives prises..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Analyse des risques documentée *</Label>
                  <Textarea value={form.riskAnalysis} onChange={(e) => set("riskAnalysis", e.target.value)}
                    placeholder="Documentez l'analyse des risques couvrant : impartialité, système de management, personnel/équipements/locaux, méthodes d'évaluation..."
                    className="mt-1" rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Évaluation de la continuité — DOC 01 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évaluation de la continuité (DOC 01)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Évaluation de la continuité *</Label>
                  <Textarea value={form.continuityAssessment} onChange={(e) => set("continuityAssessment", e.target.value)}
                    placeholder="Décrivez comment la continuité du système de management est assurée..."
                    className="mt-1" rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Continuité du système de management</Label>
                  <Switch checked={form.managementContinuity} onCheckedChange={(v) => set("managementContinuity", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Continuité du personnel clé</Label>
                  <Switch checked={form.personnelContinuity} onCheckedChange={(v) => set("personnelContinuity", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Continuité des équipements et locaux</Label>
                  <Switch checked={form.equipmentContinuity} onCheckedChange={(v) => set("equipmentContinuity", v)} />
                </div>

                {/* Pièces jointes */}
                <div className="pt-1">
                  <Label>Documents joints (DOC 01 + pièces justificatives)</Label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm">
                      <Paperclip className="w-4 h-4" />Attacher des fichiers
                      <input type="file" multiple className="hidden" onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                    </label>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 px-2 py-1 rounded">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="flex-1 truncate">{f.name}</span>
                          <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Situation financière */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />Situation financière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch checked={form.financialRegularized} onCheckedChange={(v) => set("financialRegularized", v)} />
                  <Label>Je confirme que toutes les obligations financières envers ALGERAC ont été régularisées *</Label>
                </div>
                {!form.financialRegularized && (
                  <p className="text-sm text-red-600">La régularisation de la situation financière est obligatoire pour procéder au transfert.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setLocation("/oec/transfert")} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitDisabled || submitting}>
              {submitting ? "Soumission en cours..." : "Soumettre la demande"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
