import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Download,
  Users,
  Eye,
} from "lucide-react";

interface Interview {
  id: number;
  registrationId: string;
  fullName: string;
  nom?: string;
  prenom?: string;
  userType: string;
  domaineExpertise: string;
  sousDomaineExpertise?: string;
  email: string;
  phone?: string;
  telephoneMobile?: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  wilaya?: string;
  status: string;
  photoBase64?: string;
  interviewDate: string;
  interviewScheduledAt?: string;
  interviewPanelCdId?: number;
  interviewPanelRaId?: number;
  documentsJson?: string;
  experience?: string;
  specialite?: string;
  diplomes?: string;
  langues?: string;
}

export default function InterviewPanelPage() {
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    document.title = "Mes Entretiens (Panel) | ALGERAC";
    fetchMyInterviews();
  }, []);

  const fetchMyInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/candidatures/experts/my-interviews", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les entretiens", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFor20 = async (interview: Interview) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${interview.id}/for20`, { credentials: "include" });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FOR20_${interview.registrationId}_${interview.fullName}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast({ title: "Erreur", description: "Impossible de télécharger le FOR20", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { EXPERT: "Expert", EVALUATEUR: "Évaluateur", FORMATEUR: "Formateur" };
    return labels[type] || type;
  };

  const getTypeBadgeClass = (type: string) => {
    const map: Record<string, string> = {
      EXPERT: "bg-blue-50 text-blue-700 border-blue-300",
      EVALUATEUR: "bg-purple-50 text-purple-700 border-purple-300",
      FORMATEUR: "bg-indigo-50 text-indigo-700 border-indigo-300",
    };
    return map[type] || "";
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Accepté" },
      APPROVED: { class: "bg-green-50 text-green-700 border-green-300", label: "Actif" },
      REJECTED: { class: "bg-slate-50 text-slate-600 border-slate-300", label: "Non retenu" },
    };
    return map[status] || { class: "", label: status };
  };

  const filteredInterviews = interviews.filter((i) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      i.fullName?.toLowerCase().includes(term) ||
      i.registrationId?.toLowerCase().includes(term) ||
      i.domaineExpertise?.toLowerCase().includes(term) ||
      i.email?.toLowerCase().includes(term)
    );
  });

  // Separate upcoming and past
  const now = new Date();
  const upcoming = filteredInterviews
    .filter((i) => ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED"].includes(i.status) && new Date(i.interviewDate) >= now)
    .sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
  const past = filteredInterviews
    .filter((i) => !upcoming.includes(i))
    .sort((a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime());

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Entretiens de Candidats</h1>
            <p className="text-muted-foreground mt-1">
              Vous faites partie du panel d'entretien pour les candidats ci-dessous. Consultez les dossiers avant l'entretien.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="cursor-default">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-blue-600">{upcoming.length}</div>
                <p className="text-xs text-muted-foreground">À venir</p>
              </CardContent>
            </Card>
            <Card className="cursor-default">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-teal-600">
                  {filteredInterviews.filter((i) => i.status === "INTERVIEW_COMPLETED").length}
                </div>
                <p className="text-xs text-muted-foreground">Terminés</p>
              </CardContent>
            </Card>
            <Card className="cursor-default">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-emerald-600">
                  {filteredInterviews.filter((i) => ["CANDIDATURE_APPROVED", "APPROVED"].includes(i.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">Acceptés</p>
              </CardContent>
            </Card>
            <Card className="cursor-default">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-slate-600">{interviews.length}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, ID, domaine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <p className="text-muted-foreground text-center py-12">Chargement...</p>
          ) : interviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun entretien programmé pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Upcoming Interviews */}
              {upcoming.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Entretiens à Venir ({upcoming.length})
                  </h2>
                  <div className="grid gap-4">
                    {upcoming.map((interview) => {
                      const statusInfo = getStatusInfo(interview.status);
                      return (
                        <Card key={interview.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                {interview.photoBase64 ? (
                                  <img
                                    src={`data:image/jpeg;base64,${interview.photoBase64}`}
                                    alt=""
                                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="w-7 h-7 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-slate-900">{interview.fullName}</h3>
                                    <Badge variant="outline" className={getTypeBadgeClass(interview.userType)}>
                                      {getTypeLabel(interview.userType)}
                                    </Badge>
                                    <Badge variant="outline" className={statusInfo.class}>
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{interview.registrationId}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    <Briefcase className="w-3 h-3 inline mr-1" />
                                    {interview.domaineExpertise || "Non spécifié"}
                                  </p>
                                  <p className="text-sm font-medium text-blue-700 mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {new Date(interview.interviewDate).toLocaleDateString("fr-FR", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedInterview(interview)}>
                                  <Eye className="w-4 h-4 mr-1" /> Voir le dossier
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDownloadFor20(interview)}>
                                  <Download className="w-4 h-4 mr-1" /> FOR20
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Interviews */}
              {past.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    Historique ({past.length})
                  </h2>
                  <div className="grid gap-3">
                    {past.map((interview) => {
                      const statusInfo = getStatusInfo(interview.status);
                      return (
                        <Card key={interview.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{interview.fullName}</span>
                                    <Badge variant="outline" className={`${getTypeBadgeClass(interview.userType)} text-xs`}>
                                      {getTypeLabel(interview.userType)}
                                    </Badge>
                                    <Badge variant="outline" className={`${statusInfo.class} text-xs`}>
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(interview.interviewDate).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    {" — "}
                                    {interview.domaineExpertise || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedInterview(interview)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Candidate Detail Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={(open) => !open && setSelectedInterview(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dossier du Candidat</DialogTitle>
          </DialogHeader>

          {selectedInterview && (
            <div className="space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                {selectedInterview.photoBase64 ? (
                  <img
                    src={`data:image/jpeg;base64,${selectedInterview.photoBase64}`}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{selectedInterview.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{selectedInterview.registrationId}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={getTypeBadgeClass(selectedInterview.userType)}>
                      {getTypeLabel(selectedInterview.userType)}
                    </Badge>
                    <Badge variant="outline" className={getStatusInfo(selectedInterview.status).class}>
                      {getStatusInfo(selectedInterview.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Informations de Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{selectedInterview.email}</span>
                  </div>
                  {(selectedInterview.phone || selectedInterview.telephoneMobile) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedInterview.telephoneMobile || selectedInterview.phone}</span>
                    </div>
                  )}
                  {selectedInterview.adresseDomicile && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{selectedInterview.adresseDomicile}</span>
                    </div>
                  )}
                  {selectedInterview.wilaya && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{selectedInterview.wilaya}</span>
                    </div>
                  )}
                  {selectedInterview.dateNaissance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Né(e) le {selectedInterview.dateNaissance}</span>
                    </div>
                  )}
                  {selectedInterview.nationalite && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{selectedInterview.nationalite}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Expertise */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Expertise & Qualifications</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedInterview.domaineExpertise || "Non spécifié"}</p>
                      {selectedInterview.sousDomaineExpertise && (
                        <p className="text-muted-foreground">{selectedInterview.sousDomaineExpertise}</p>
                      )}
                    </div>
                  </div>
                  {selectedInterview.experience && (
                    <p><span className="font-medium">Expérience :</span> {selectedInterview.experience}</p>
                  )}
                  {selectedInterview.specialite && (
                    <p><span className="font-medium">Spécialité :</span> {selectedInterview.specialite}</p>
                  )}
                  {selectedInterview.diplomes && (
                    <p><span className="font-medium">Diplômes :</span> {selectedInterview.diplomes}</p>
                  )}
                  {selectedInterview.langues && (
                    <p><span className="font-medium">Langues :</span> {selectedInterview.langues}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Interview Date */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Date de l'entretien</span>
                </div>
                <p className="text-blue-800 font-medium">
                  {new Date(selectedInterview.interviewDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFor20(selectedInterview)}>
                    <Download className="w-4 h-4 mr-2" /> Télécharger FOR20
                  </Button>
                  {selectedInterview.documentsJson && (() => {
                    try {
                      const docs: Array<{ name: string; base64?: string; mimeType?: string }> = JSON.parse(selectedInterview.documentsJson);
                      if (!docs || docs.length === 0) return null;
                      return docs.map((doc, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => {
                            if (!doc.base64) return;
                            const mime = doc.mimeType || "application/octet-stream";
                            const byteChars = atob(doc.base64);
                            const byteArr = new Uint8Array(byteChars.length);
                            for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                            const blob = new Blob([byteArr], { type: mime });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = doc.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-3 h-3 mr-2" />
                          {doc.name}
                        </Button>
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
