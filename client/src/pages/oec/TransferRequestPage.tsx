import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ArrowRightLeft, Plus, FileText, Eye, Paperclip, X } from "lucide-react";

interface AttachedDoc {
  name: string;
  type: string;
  data: string;
}

interface Transfer {
  id: number; transferCode: string; reason: string;
  sourceOrganizationName: string; targetOrganizationName: string; transferredScope: string;
  status: string; createdAt: string; continuityAssessment: string;
  managementSystemContinuity: boolean; personnelContinuity: boolean; equipmentContinuity: boolean;
  decisionJustification: string;
}

export default function TransferRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const [form, setForm] = useState({
    requestId: "", reason: "MERGER",
    targetOrgName: "", targetOrgDetails: "",
    transferredScope: "", reasonDetails: "", fullScope: true, scopeModifications: ""
  });

  const [docForm, setDocForm] = useState({
    continuityAssessment: "",
    managementContinuity: true, personnelContinuity: true, equipmentContinuity: true
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedDoc[]>([]);

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

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try {
      const res = await fetch("/api/transfers/mine", { credentials: "include" });
      const data = await res.json();
      setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/transfers", {
        requestId: parseInt(form.requestId),
        reason: form.reason,
        sourceOrgName: user?.organizationName || user?.fullName,
        sourceOrgDetails: "",
        targetOrgName: form.targetOrgName,
        targetOrgDetails: form.targetOrgDetails,
        transferredScope: form.transferredScope,
        reasonDetails: form.reasonDetails,
        fullScope: form.fullScope,
        scopeModifications: form.scopeModifications
      });
      toast({ title: "Demande de transfert soumise" });
      setShowCreate(false);
      setForm({ requestId: "", reason: "MERGER", targetOrgName: "", targetOrgDetails: "", transferredScope: "", reasonDetails: "", fullScope: true, scopeModifications: "" });
      loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmitDocs = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/transfers/${selected.id}/documents`, {
        ...docForm,
        attachedDocuments: attachedFiles.length > 0 ? attachedFiles : null
      });
      toast({ title: "Documents soumis avec succès" });
      setShowDocs(false);
      setAttachedFiles([]);
      loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (s: string) => {
    const m: Record<string, { c: string; l: string }> = {
      INITIATED: { c: "bg-blue-100 text-blue-800", l: "Initié" },
      DOCUMENTS_SUBMITTED: { c: "bg-indigo-100 text-indigo-800", l: "Documents soumis" },
      UNDER_REVIEW: { c: "bg-yellow-100 text-yellow-800", l: "En examen" },
      EVALUATION_REQUIRED: { c: "bg-purple-100 text-purple-800", l: "Évaluation requise" },
      EVALUATION_COMPLETED: { c: "bg-indigo-100 text-indigo-800", l: "Évaluation terminée" },
      PENDING_CAS_DECISION: { c: "bg-orange-100 text-orange-800", l: "En attente décision CAS" },
      APPROVED: { c: "bg-green-100 text-green-800", l: "Approuvé" },
      CERTIFICATE_ISSUED: { c: "bg-teal-100 text-teal-800", l: "Certificat émis" },
      COMPLETED: { c: "bg-emerald-100 text-emerald-800", l: "Complété" },
      REJECTED: { c: "bg-red-100 text-red-800", l: "Rejeté" },
    };
    const v = m[s] || { c: "bg-gray-100 text-gray-800", l: s };
    return <Badge className={v.c}>{v.l}</Badge>;
  };

  const reasonLabel: Record<string, string> = {
    MERGER: "Fusion", ACQUISITION: "Acquisition", LEGAL_RESTRUCTURING: "Restructuration juridique",
    NAME_CHANGE: "Changement de nom", SPIN_OFF: "Scission", LOCATION_CHANGE: "Changement de localisation", OTHER: "Autre"
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-primary" />Transfert d'accréditation
              </h1>
              <p className="text-muted-foreground">Demander le transfert de votre accréditation (PRO 31)</p>
            </div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Demander un transfert</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Mes demandes de transfert</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> :
              transfers.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune demande de transfert</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>OEC cible</TableHead>
                    <TableHead>Motif</TableHead><TableHead>Périmètre</TableHead>
                    <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
                      <TableCell>{t.targetOrganizationName}</TableCell>
                      <TableCell>{reasonLabel[t.reason] || t.reason?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{t.transferredScope}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {t.status === "INITIATED" && (
                            <Button size="sm" variant="outline" onClick={() => { setSelected(t); setShowDocs(true); }}>
                              <FileText className="w-3 h-3 mr-1" />Soumettre documents
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelected(t); setShowDetail(true); }}>
                            <Eye className="w-3 h-3 mr-1" />Détails
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog: Nouvelle demande de transfert */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Demander un transfert d'accréditation</DialogTitle>
                <DialogDescription>Remplissez les informations sur le transfert souhaité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Demande d'accréditation liée (ID)</Label>
                  <Input type="number" value={form.requestId} onChange={(e) => setForm({...form, requestId: e.target.value})} placeholder="ID de votre demande d'accréditation" />
                </div>
                <div><Label>Motif du transfert</Label>
                  <Select value={form.reason} onValueChange={(v) => setForm({...form, reason: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MERGER">Fusion</SelectItem>
                      <SelectItem value="ACQUISITION">Acquisition</SelectItem>
                      <SelectItem value="LEGAL_RESTRUCTURING">Restructuration juridique</SelectItem>
                      <SelectItem value="NAME_CHANGE">Changement de nom</SelectItem>
                      <SelectItem value="LOCATION_CHANGE">Changement de localisation</SelectItem>
                      <SelectItem value="SPIN_OFF">Scission</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Détails / Justification</Label>
                  <Textarea value={form.reasonDetails} onChange={(e) => setForm({...form, reasonDetails: e.target.value})} placeholder="Décrivez les raisons du transfert..." />
                </div>
                <div><Label>Nouvel organisme (nom)</Label>
                  <Input value={form.targetOrgName} onChange={(e) => setForm({...form, targetOrgName: e.target.value})} placeholder="Nom du nouvel organisme" />
                </div>
                <div><Label>Nouvel organisme (détails)</Label>
                  <Input value={form.targetOrgDetails} onChange={(e) => setForm({...form, targetOrgDetails: e.target.value})} placeholder="Adresse, statut juridique..." />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.fullScope} onCheckedChange={(v) => setForm({...form, fullScope: v})} />
                  <Label>Transfert de tout le périmètre</Label>
                </div>
                <div><Label>Périmètre à transférer</Label>
                  <Textarea value={form.transferredScope} onChange={(e) => setForm({...form, transferredScope: e.target.value})} placeholder="Décrivez le périmètre concerné..." />
                </div>
                {!form.fullScope && (
                  <div><Label>Modifications du périmètre</Label>
                    <Textarea value={form.scopeModifications} onChange={(e) => setForm({...form, scopeModifications: e.target.value})} placeholder="Périmètre exclu ou modifié..." />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={!form.requestId || !form.targetOrgName}>Soumettre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Soumettre les documents de continuité */}
          <Dialog open={showDocs} onOpenChange={setShowDocs}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Documents de transfert — {selected?.transferCode}</DialogTitle>
                <DialogDescription>Évaluation de la continuité entre les deux organismes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Évaluation de la continuité</Label>
                  <Textarea value={docForm.continuityAssessment}
                    onChange={(e) => setDocForm({...docForm, continuityAssessment: e.target.value})}
                    placeholder="Décrivez comment la continuité du système de management est assurée..." />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Continuité du système de management</Label>
                    <Switch checked={docForm.managementContinuity} onCheckedChange={(v) => setDocForm({...docForm, managementContinuity: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Continuité du personnel</Label>
                    <Switch checked={docForm.personnelContinuity} onCheckedChange={(v) => setDocForm({...docForm, personnelContinuity: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Continuité des équipements</Label>
                    <Switch checked={docForm.equipmentContinuity} onCheckedChange={(v) => setDocForm({...docForm, equipmentContinuity: v})} />
                  </div>
                </div>
                <div>
                  <Label>Documents joints</Label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm">
                      <Paperclip className="w-4 h-4" />
                      Attacher des fichiers
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDocs(false)}>Annuler</Button>
                <Button onClick={handleSubmitDocs} disabled={!docForm.continuityAssessment}>Soumettre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Détails du transfert */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transfert {selected?.transferCode}</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>{getStatusBadge(selected.status)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Motif</span><span>{reasonLabel[selected.reason] || selected.reason}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC cible</span><span>{selected.targetOrganizationName}</span></div>
                  <div><span className="text-muted-foreground">Périmètre</span><p className="mt-1">{selected.transferredScope}</p></div>
                  {selected.decisionJustification && (
                    <div><span className="text-muted-foreground">Décision</span><p className="mt-1">{selected.decisionJustification}</p></div>
                  )}
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setShowDetail(false)}>Fermer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
