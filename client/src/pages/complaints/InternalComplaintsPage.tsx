import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, Upload, X, ArrowLeft, Send, Shield, CheckCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AttachedFile {
  name: string;
  size: number;
  base64: string;
  mimeType: string;
}

interface MyComplaint {
  id: number;
  trackingCode: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  decision?: string;
}

const categoryLabels: Record<string, string> = {
  quality: "Qualité",
  delay: "Délais",
  competence: "Compétence",
  impartiality: "Impartialité",
  confidentiality: "Confidentialité",
  other: "Autre",
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Reçue",
  UNDER_REVIEW: "En examen",
  ASSIGNED: "Assignée",
  INVESTIGATION: "Investigation",
  FOUNDED: "Fondée",
  UNFOUNDED: "Non fondée",
  CORRECTIVE_ACTIONS: "Actions correctives",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

export default function InternalComplaintsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [myComplaints, setMyComplaints] = useState<MyComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<MyComplaint | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    targetOrganization: "",
    category: "",
    subject: "",
    description: "",
    expectedResolution: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: "quality", label: t('complaints.categories.quality') },
    { value: "delay", label: t('complaints.categories.delay') },
    { value: "competence", label: t('complaints.categories.competence') },
    { value: "impartiality", label: t('complaints.categories.impartiality') },
    { value: "confidentiality", label: t('complaints.categories.confidentiality') },
    { value: "other", label: t('complaints.categories.other') },
  ];

  // Redirect unauthenticated users via useEffect (React best practice)
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (user && !authLoading) loadMyComplaints();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;

  const loadMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/complaints/mine");
      const data = await res.json();
      // Backend wraps response in ApiResponse { success, message, data }
      const complaints = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setMyComplaints(complaints);
    } catch {
      setMyComplaints([]);
    } finally { setLoading(false); }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachedFiles(prev => [...prev, { name: file.name, size: file.size, base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.category) newErrors.category = "Catégorie requise";
    if (!formData.subject.trim()) newErrors.subject = "Objet requis";
    if (!formData.description.trim()) newErrors.description = "Description requise";
    if (formData.description.trim().length < 50) newErrors.description = "Description trop courte (50 caractères min.)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        complainantName: user.fullName || `${user.prenom || ""} ${user.nom || ""}`.trim(),
        complainantEmail: user.email,
        ...formData,
        attachments: attachedFiles.map(f => ({ name: f.name, base64: f.base64, mimeType: f.mimeType })),
        isPublic: false,
      };
      const res = await apiRequest("POST", "/api/complaints", payload);
      const data = await res.json();
      toast({ title: "Plainte soumise", description: `Code de suivi : ${data.data?.trackingCode || data.trackingCode || ""}` });
      setFormData({ targetOrganization: "", category: "", subject: "", description: "", expectedResolution: "" });
      setAttachedFiles([]);
      loadMyComplaints();
    } catch {
      toast({ title: "Plainte enregistrée", description: "Votre plainte sera examinée par le responsable qualité." });
    } finally { setSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      RECEIVED: { color: "bg-blue-500", label: "Reçue" },
      UNDER_REVIEW: { color: "bg-yellow-500", label: "En examen" },
      ASSIGNED: { color: "bg-indigo-500", label: "Assignée" },
      INVESTIGATION: { color: "bg-orange-500", label: "Investigation" },
      FOUNDED: { color: "bg-red-500", label: "Fondée" },
      UNFOUNDED: { color: "bg-gray-500", label: "Non fondée" },
      CORRECTIVE_ACTIONS: { color: "bg-amber-500", label: "Actions correctives" },
      RESOLVED: { color: "bg-green-500", label: "Résolue" },
      CLOSED: { color: "bg-slate-500", label: "Clôturée" },
    };
    const m = map[status] || { color: "bg-gray-400", label: status };
    return <Badge className={m.color}>{m.label}</Badge>;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <Tabs defaultValue="new" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{t('complaints.internal.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('complaints.internal.subtitle')}</p>
              </div>
              <TabsList>
                <TabsTrigger value="new"><FileText className="w-4 h-4 mr-2" />Nouvelle plainte</TabsTrigger>
                <TabsTrigger value="history"><Clock className="w-4 h-4 mr-2" />Mes plaintes</TabsTrigger>
              </TabsList>
            </div>

            {/* New Complaint Tab */}
            <TabsContent value="new" className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Votre plainte sera transmise au Département Qualité pour analyse. 
                  Vous serez notifié(e) de la décision.
                </AlertDescription>
              </Alert>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Déposer une plainte</CardTitle>
                  <CardDescription>Remplissez le formulaire ci-dessous. Les champs marqués * sont obligatoires.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organisme concerné</Label>
                      <Input value={formData.targetOrganization} onChange={(e) => handleChange("targetOrganization", e.target.value)} placeholder="Nom de l'organisme visé" />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie <span className="text-red-500">*</span></Label>
                      <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Objet <span className="text-red-500">*</span></Label>
                    <Input value={formData.subject} onChange={(e) => handleChange("subject", e.target.value)} placeholder="Résumé concis de votre plainte" className={errors.subject ? "border-red-500" : ""} />
                    {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Description détaillée <span className="text-red-500">*</span></Label>
                    <Textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Décrivez les faits, les circonstances, les dates..." rows={6} className={errors.description ? "border-red-500" : ""} />
                    <div className="flex justify-between">
                      {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                      <p className="text-xs text-muted-foreground ml-auto">{formData.description.length}/50 min</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Résolution attendue</Label>
                    <Textarea value={formData.expectedResolution} onChange={(e) => handleChange("expectedResolution", e.target.value)} placeholder="Décrivez ce que vous attendez comme résolution..." rows={3} />
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <Label>Pièces jointes</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Cliquez ou glissez vos fichiers ici</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Images — 10 MB max par fichier</p>
                      <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                    </div>
                    {attachedFiles.length > 0 && (
                      <div className="space-y-2">
                        {attachedFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(i)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSubmit} disabled={submitting} size="lg">
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</> : <><Send className="mr-2 h-4 w-4" />Soumettre la plainte</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Mes plaintes déposées</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : myComplaints.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Vous n'avez déposé aucune plainte</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myComplaints.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono text-sm">{c.trackingCode}</TableCell>
                            <TableCell>{c.subject}</TableCell>
                            <TableCell><Badge variant="outline">{categoryLabels[c.category] || c.category}</Badge></TableCell>
                            <TableCell>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell>{getStatusBadge(c.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedComplaint(c); setDetailsOpen(true); }}>
                                <Eye className="w-4 h-4 mr-1" />Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plainte {selectedComplaint?.trackingCode}</DialogTitle>
            <DialogDescription>{selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Catégorie</Label><p><Badge variant="outline">{categoryLabels[selectedComplaint.category] || selectedComplaint.category}</Badge></p></div>
                <div><Label className="text-muted-foreground">Statut</Label><p>{getStatusBadge(selectedComplaint.status)}</p></div>
                <div><Label className="text-muted-foreground">Date</Label><p>{new Date(selectedComplaint.createdAt).toLocaleDateString("fr-FR")}</p></div>
              </div>
              {selectedComplaint.decision && (
                <Alert className={selectedComplaint.status === "FOUNDED" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}>
                  <AlertDescription><strong>Décision :</strong> {selectedComplaint.decision}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
