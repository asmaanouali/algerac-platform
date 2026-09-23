import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Save, Download, FileText, Paperclip, X, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { openComplaintReviewPdf } from "@/lib/pdf-documents";

interface ComplaintAttachment {
  name: string;
  base64: string;
  mimeType?: string;
}

interface Complaint {
  id: number;
  trackingCode: string;
  complainantName: string;
  complainantEmail: string;
  category: string;
  subject: string;
  description: string;
  attachmentsJson?: string;
  status: string;
  reviewReport?: string;
  reviewAttachmentsJson?: string;
  reviewCompleted?: boolean;
  reviewCompletedAt?: string;
  createdAt: string;
}

function parseAttachments(json?: string): ComplaintAttachment[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ComplaintReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reviewReport, setReviewReport] = useState("");
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);

  useEffect(() => {
    document.title = "Bilan d'examen de plainte | ALGERAC";
  }, []);

  useEffect(() => {
    if (user && !authLoading && id) loadComplaint();
  }, [user, authLoading, id]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", `/api/complaints/${id}`);
      const json = await res.json();
      const data: Complaint = json.data || json;
      setComplaint(data);
      setReviewReport(data.reviewReport || "");
      setAttachments(parseAttachments(data.reviewAttachmentsJson));
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la plainte." });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachments((prev) => [...prev, { name: file.name, base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!complaint) return;
    setSaving(true);
    try {
      await apiRequest("PUT", `/api/complaints/${complaint.id}/review`, {
        reviewReport,
        attachments,
      });
      toast({ title: "Bilan enregistré", description: "Vos modifications ont été sauvegardées." });
      loadComplaint();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le bilan." });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!complaint) return;
    if (!reviewReport.trim()) {
      toast({ variant: "destructive", title: "Bilan requis", description: "Rédigez le bilan avant de terminer l'examen." });
      return;
    }
    setCompleting(true);
    try {
      await apiRequest("PUT", `/api/complaints/${complaint.id}/review`, { reviewReport, attachments });
      await apiRequest("POST", `/api/complaints/${complaint.id}/review/complete`, {});
      toast({ title: "Examen terminé", description: "La décision peut désormais être prise." });
      navigate("/rq/plaintes");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de terminer l'examen." });
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!complaint) return;
    openComplaintReviewPdf({ complaint, reviewReport, reviewedBy: user?.fullName });
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!user) { navigate("/"); return null; }
  if (!complaint) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Plainte introuvable.</p>
      </div>
    );
  }

  const initialAttachments = parseAttachments(complaint.attachmentsJson);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/rq/plaintes")} className="mb-2 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />Retour aux plaintes
                </Button>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  Examen de la plainte {complaint.trackingCode}
                  {complaint.reviewCompleted && <Badge className="bg-green-600">Examen terminé</Badge>}
                </h1>
                <p className="text-muted-foreground mt-1">{complaint.subject}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informations sur la plainte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><Label className="text-muted-foreground">Plaignant</Label><p className="font-medium">{complaint.complainantName}</p></div>
                  <div><Label className="text-muted-foreground">Email</Label><p>{complaint.complainantEmail}</p></div>
                  <div><Label className="text-muted-foreground">Catégorie</Label><p><Badge variant="outline">{complaint.category}</Badge></p></div>
                  <div><Label className="text-muted-foreground">Date de dépôt</Label><p>{new Date(complaint.createdAt).toLocaleDateString("fr-FR")}</p></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border">{complaint.description}</p>
                </div>
                {initialAttachments.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />Pièces jointes du plaignant</Label>
                    <div className="mt-1 space-y-2">
                      {initialAttachments.map((file, i) => (
                        <a key={i} href={`data:${file.mimeType || "application/octet-stream"};base64,${file.base64}`} download={file.name}
                           className="flex items-center justify-between p-2.5 bg-slate-50 rounded border hover:bg-slate-100 transition-colors">
                          <span className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-blue-500" />{file.name}</span>
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bilan d'examen (Responsable Qualité)</CardTitle>
                <CardDescription>
                  Rédigez ici le compte-rendu de votre examen de la plainte. Ce bilan reste accessible à tout moment
                  et doit être finalisé avant de pouvoir prendre une décision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Compte-rendu de l'examen</Label>
                  <Textarea
                    value={reviewReport}
                    onChange={(e) => setReviewReport(e.target.value)}
                    placeholder="Faits examinés, éléments recueillis, échanges avec les parties concernées, analyse..."
                    rows={12}
                    disabled={completing}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />Pièces jointes du bilan</Label>
                  <input type="file" multiple onChange={handleFileUpload} className="text-sm" disabled={completing} />
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border">
                          <span className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-blue-500" />{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(i)}><X className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {complaint.reviewCompleted && (
                  <Alert className="border-green-300 bg-green-50">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Examen terminé le {complaint.reviewCompletedAt ? new Date(complaint.reviewCompletedAt).toLocaleDateString("fr-FR") : ""}.
                      Vous pouvez toujours modifier le bilan, la décision reste accessible depuis la liste des plaintes.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="w-4 h-4 mr-2" />Télécharger en PDF
                  </Button>
                  <Button variant="outline" onClick={handleSave} disabled={saving || completing}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Enregistrer le brouillon
                  </Button>
                  {!complaint.reviewCompleted && (
                    <Button onClick={handleComplete} disabled={completing || saving} className="bg-green-600 hover:bg-green-700">
                      {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Terminer l'examen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
