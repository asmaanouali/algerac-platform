import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, FileText, Download, Clock, UserCheck, UserX, Users, CalendarDays, CalendarPlus, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  telephone: string;
  dateInscription: string;
  status: "PENDING" | "INTERVIEW_SCHEDULED" | "INTERVIEW_CONFIRMED" | "INTERVIEW_COMPLETED" | "CANDIDATURE_APPROVED" | "APPROVED" | "REJECTED";
  photoBase64?: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  sousDomaineExpertise?: string;
  rejectionReason?: string;
  documentsJson?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewChecklistJson?: string;
  interviewDecision?: string;
  createdAt?: string;
}

export default function GesCompetencesCandidaturesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interview scheduling dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [schedulingCandidature, setSchedulingCandidature] = useState<Candidature | null>(null);
  
  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    document.title = "Candidatures - Gestion des Compétences | ALGERAC";
    fetchCandidatures();
  }, []);

  const fetchCandidatures = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8082/api/candidatures/experts", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidatures(data);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les candidatures", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = candidatures.filter(c => c.status === "PENDING").length;
    const interviewing = candidatures.filter(c => ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED", "INTERVIEW_COMPLETED"].includes(c.status)).length;
    const approved = candidatures.filter(c => c.status === "CANDIDATURE_APPROVED" || c.status === "APPROVED").length;
    const rejected = candidatures.filter(c => c.status === "REJECTED").length;
    return { pending, interviewing, approved, rejected, total: candidatures.length };
  }, [candidatures]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      PENDING: { class: "bg-amber-50 text-amber-700 border-amber-300", label: "En attente" },
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Entretien planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Entretien confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Entretien terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Acceptée (compte en attente)" },
      APPROVED: { class: "bg-green-50 text-green-700 border-green-300", label: "Compte actif" },
      REJECTED: { class: "bg-slate-50 text-slate-600 border-slate-300", label: "Non retenue" },
    };
    const s = map[status] || { class: "", label: status };
    return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      EXPERT: "bg-blue-100 text-blue-800",
      EVALUATEUR: "bg-purple-100 text-purple-800",
      FORMATEUR: "bg-indigo-100 text-indigo-800",
    };
    const labels: Record<string, string> = { EXPERT: "Expert", EVALUATEUR: "Évaluateur", FORMATEUR: "Formateur" };
    return <Badge className={colors[type]}>{labels[type] || type}</Badge>;
  };

  const filteredCandidatures = candidatures.filter(c => {
    const matchesSearch = 
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.domaineExpertise?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesType = filterType === "all" || c.userType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Schedule interview
  const handleScheduleInterview = async () => {
    if (!schedulingCandidature || !interviewDate || !interviewTime) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une date et une heure", variant: "destructive" });
      return;
    }

    const dateTime = `${interviewDate}T${interviewTime}:00`;

    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${schedulingCandidature.id}/schedule-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ interviewDate: dateTime })
      });
      
      if (response.ok) {
        toast({ title: "Succès", description: "Entretien planifié. Un email de convocation a été envoyé au candidat." });
        fetchCandidatures();
        setShowScheduleDialog(false);
        setSelectedCandidature(null);
        setInterviewDate("");
        setInterviewTime("");
        setSchedulingCandidature(null);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Impossible de planifier l'entretien", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Reject dossier (implicit rejection)
  const handleRejectDossier = async (candidature: Candidature) => {
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${candidature.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejectionReason: rejectionReason || "Profil non retenu dans le cadre des besoins actuels" })
      });
      
      if (response.ok) {
        toast({ title: "Traitement effectué", description: "Le candidat a été notifié par email de manière appropriée." });
        fetchCandidatures();
        setSelectedCandidature(null);
        setShowRejectDialog(false);
        setRejectionReason("");
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleDownloadFor20 = async (candidature: Candidature) => {
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${candidature.id}/for20`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FOR20_${candidature.registrationId}_${candidature.fullName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({ title: "Erreur", description: "Impossible de télécharger le FOR20", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Candidatures d&apos;Inscription</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Gérer les demandes d'inscription des Experts, Évaluateurs et Formateurs
              </p>
            </div>
            <Button className="shrink-0">
              <FileText className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("PENDING")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("INTERVIEW_SCHEDULED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entretiens</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.interviewing}</p>
                  </div>
                  <CalendarDays className="w-8 h-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("CANDIDATURE_APPROVED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Acceptées</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-emerald-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("REJECTED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Non retenues</p>
                    <p className="text-2xl font-bold text-slate-500">{stats.rejected}</p>
                  </div>
                  <UserX className="w-8 h-8 text-slate-400 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("all")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-slate-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 w-full">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher par nom, ID, domaine..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="INTERVIEW_SCHEDULED">Entretien planifié</SelectItem>
                    <SelectItem value="INTERVIEW_CONFIRMED">Entretien confirmé</SelectItem>
                    <SelectItem value="INTERVIEW_COMPLETED">Entretien terminé</SelectItem>
                    <SelectItem value="CANDIDATURE_APPROVED">Acceptées</SelectItem>
                    <SelectItem value="APPROVED">Compte actif</SelectItem>
                    <SelectItem value="REJECTED">Non retenues</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                    <SelectItem value="EVALUATEUR">Évaluateur</SelectItem>
                    <SelectItem value="FORMATEUR">Formateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="w-full overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Nom Complet</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Domaine</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Statut</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell></TableRow>
                  ) : filteredCandidatures.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune candidature trouvée</TableCell></TableRow>
                  ) : (
                    filteredCandidatures.map((candidature) => (
                      <TableRow key={candidature.id}>
                        <TableCell className="font-mono text-xs">{candidature.registrationId}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{candidature.fullName}</TableCell>
                        <TableCell>{getTypeBadge(candidature.userType)}</TableCell>
                        <TableCell className="max-w-xs truncate">{candidature.domaineExpertise}</TableCell>
                        <TableCell className="whitespace-nowrap">{candidature.createdAt ? new Date(candidature.createdAt).toLocaleDateString("fr-FR") : candidature.dateInscription}</TableCell>
                        <TableCell>{getStatusBadge(candidature.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCandidature(candidature)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidature} onOpenChange={() => setSelectedCandidature(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Candidature</DialogTitle>
            <DialogDescription>{selectedCandidature && `Référence : ${selectedCandidature.registrationId}`}</DialogDescription>
          </DialogHeader>

          {selectedCandidature && (
            <div className="space-y-6">
              {selectedCandidature.photoBase64 && (
                <div className="flex justify-center">
                  <img src={`data:image/jpeg;base64,${selectedCandidature.photoBase64}`} alt="Photo" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Nom Complet</Label><p className="font-medium">{selectedCandidature.fullName}</p></div>
                <div><Label className="text-xs text-muted-foreground">Type</Label><div className="mt-1">{getTypeBadge(selectedCandidature.userType)}</div></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><p className="font-medium">{selectedCandidature.email}</p></div>
                <div><Label className="text-xs text-muted-foreground">Téléphone</Label><p className="font-medium">{selectedCandidature.telephone}</p></div>
                {selectedCandidature.dateNaissance && (<div><Label className="text-xs text-muted-foreground">Date de naissance</Label><p className="font-medium">{selectedCandidature.dateNaissance}</p></div>)}
                {selectedCandidature.nationalite && (<div><Label className="text-xs text-muted-foreground">Nationalité</Label><p className="font-medium">{selectedCandidature.nationalite}</p></div>)}
                <div><Label className="text-xs text-muted-foreground">Statut</Label><div className="mt-1">{getStatusBadge(selectedCandidature.status)}</div></div>
                <div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Domaine d&apos;expertise</Label><p className="font-medium">{selectedCandidature.domaineExpertise}</p></div>
                {selectedCandidature.sousDomaineExpertise && (<div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Sous-domaine</Label><p className="font-medium">{selectedCandidature.sousDomaineExpertise}</p></div>)}
                {selectedCandidature.adresseDomicile && (<div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Adresse</Label><p className="font-medium">{selectedCandidature.adresseDomicile}</p></div>)}
              </div>

              {/* Interview info if scheduled */}
              {selectedCandidature.interviewDate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-semibold text-blue-700 mb-1 block">Entretien planifié</Label>
                  <p className="text-sm text-blue-800">
                    {new Date(selectedCandidature.interviewDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}

              {/* Rejection info */}
              {selectedCandidature.status === "REJECTED" && selectedCandidature.rejectionReason && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <Label className="text-sm font-semibold text-slate-700 mb-1 block">Note interne</Label>
                  <p className="text-sm text-slate-600">{selectedCandidature.rejectionReason}</p>
                </div>
              )}

              {/* Documents */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">Documents</Label>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleDownloadFor20(selectedCandidature)}>
                  <Download className="w-4 h-4" /> Télécharger le formulaire FOR20
                </Button>
                {selectedCandidature.documentsJson && (() => {
                  try {
                    const docs: Array<{name: string, base64?: string, mimeType?: string}> = JSON.parse(selectedCandidature.documentsJson);
                    if (!docs || docs.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Fichiers joints :</p>
                        {docs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                            <span className="text-sm truncate flex-1 mr-2">{doc.name}</span>
                            {doc.base64 && (
                              <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={() => {
                                const mime = doc.mimeType || "application/octet-stream";
                                const byteChars = atob(doc.base64!);
                                const byteArr = new Uint8Array(byteChars.length);
                                for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                                const blob = new Blob([byteArr], { type: mime });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url; a.download = doc.name; a.click();
                                URL.revokeObjectURL(url);
                              }}>
                                <Download className="w-3 h-3 mr-1" /> Télécharger
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>

              {/* Actions for PENDING candidatures */}
              {selectedCandidature.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                    setSchedulingCandidature(selectedCandidature);
                    setShowScheduleDialog(true);
                  }}>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Planifier un Entretien
                  </Button>
                  <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50" onClick={() => setShowRejectDialog(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Dossier Non Retenu
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planifier un Entretien</DialogTitle>
            <DialogDescription>
              {schedulingCandidature && `Candidat(e) : ${schedulingCandidature.fullName}`}
              <br />
              Un email de convocation sera envoyé au candidat avec les détails de l'entretien.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="interviewDate">Date de l'entretien *</Label>
              <Input id="interviewDate" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="mt-2" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label htmlFor="interviewTime">Heure de l'entretien *</Label>
              <Input id="interviewTime" type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} className="mt-2" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowScheduleDialog(false); setInterviewDate(""); setInterviewTime(""); }}>
              Annuler
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleScheduleInterview} disabled={!interviewDate || !interviewTime}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Confirmer & Envoyer la Convocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dossier Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dossier Non Retenu</DialogTitle>
            <DialogDescription>
              Le candidat recevra un email professionnel indiquant que son profil ne correspond pas aux besoins actuels, 
              tout en gardant son dossier pour de futures opportunités.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Note interne (non visible par le candidat)</Label>
              <Textarea id="rejectionReason" placeholder="Raison interne du refus (pour vos archives uniquement)..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} className="mt-2" />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Note :</strong> Le candidat recevra un email optimiste mentionnant que son dossier sera conservé dans le vivier de compétences pour de futures opportunités. Aucune mention directe de refus.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowRejectDialog(false); setRejectionReason(""); }}>
                Annuler
              </Button>
              <Button variant="outline" className="flex-1 text-slate-600" onClick={() => selectedCandidature && handleRejectDossier(selectedCandidature)}>
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
