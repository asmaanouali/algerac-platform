import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Download,
  CheckCircle,
  XCircle,
  Save,
  ClipboardCheck,
  FileText,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";

interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  nom?: string;
  prenom?: string;
  userType: string;
  domaineExpertise: string;
  sousDomaineExpertise?: string;
  email: string;
  telephone: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  status: string;
  photoBase64?: string;
  documentsJson?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewChecklistJson?: string;
  interviewDecision?: string;
  createdAt?: string;
  interviewPanelCdId?: number;
  interviewPanelRaId?: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "1", label: "Vérification de l'identité et des documents originaux", checked: false },
  { id: "2", label: "Expérience professionnelle vérifiée et pertinente", checked: false },
  { id: "3", label: "Compétences techniques dans le domaine d'expertise", checked: false },
  { id: "4", label: "Connaissance des normes et référentiels applicables", checked: false },
  { id: "5", label: "Capacité de communication et de rédaction de rapports", checked: false },
  { id: "6", label: "Disponibilité et flexibilité géographique", checked: false },
  { id: "7", label: "Compréhension du rôle et des responsabilités", checked: false },
  { id: "8", label: "Impartialité et indépendance confirmées", checked: false },
  { id: "9", label: "Maîtrise des langues requises (Arabe / Français)", checked: false },
  { id: "10", label: "Aptitude au travail en équipe d'évaluation", checked: false },
];

export default function InterviewEvaluationPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matched, params] = useRoute("/ges-competences/entretien/:id");
  const candidateId = params?.id;

  const [candidature, setCandidature] = useState<Candidature | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Evaluation state
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Decision dialogs
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [acceptRole, setAcceptRole] = useState("EXPERT");

  // Panel members info
  const [panelMembers, setPanelMembers] = useState<{
    cd?: { id: number; fullName: string; email: string };
    ra?: { id: number; fullName: string; email: string };
  }>({});

  useEffect(() => {
    document.title = "Évaluation Entretien - Gestion des Compétences | ALGERAC";
    if (candidateId) fetchCandidature();
  }, [candidateId]);

  // Fetch panel member details when candidature is loaded
  useEffect(() => {
    if (candidature) {
      fetchPanelMemberDetails();
    }
  }, [candidature?.interviewPanelCdId, candidature?.interviewPanelRaId]);

  const fetchPanelMemberDetails = async () => {
    if (!candidature) return;
    try {
      const response = await fetch("/api/candidatures/experts/panel-members", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const allCDs: Array<{id: number; fullName: string; email: string}> = data.chefsDepartement || [];
        const allRAs: Array<{id: number; fullName: string; email: string}> = data.responsablesAccreditation || [];
        
        setPanelMembers({
          cd: allCDs.find(cd => cd.id === candidature.interviewPanelCdId),
          ra: allRAs.find(ra => ra.id === candidature.interviewPanelRaId),
        });
      }
    } catch (error) {
    }
  };

  const fetchCandidature = async () => {
    try {
      setLoading(true);
      // Try both endpoints to find the candidature
      const [expertsRes, interviewsRes] = await Promise.all([
        fetch("/api/candidatures/experts", { credentials: "include" }),
        fetch("/api/candidatures/experts/interviews", { credentials: "include" })
      ]);
      
      let allData: Candidature[] = [];
      if (expertsRes.ok) {
        const data = await expertsRes.json();
        allData = [...allData, ...data];
      }
      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        // Merge without duplicates
        data.forEach((item: Candidature) => {
          if (!allData.some(existing => String(existing.id) === String(item.id))) {
            allData.push(item);
          }
        });
      }
      
      // Compare both as strings to handle type mismatch
      const found = allData.find((c) => String(c.id) === String(candidateId));
      if (found) {
        setCandidature(found);
        // Restore saved notes / checklist
        if (found.interviewNotes) setNotes(found.interviewNotes);
        if (found.interviewChecklistJson) {
          try {
            const saved = JSON.parse(found.interviewChecklistJson);
            if (Array.isArray(saved) && saved.length > 0) setChecklist(saved);
          } catch {
            // keep default
          }
        }
      } else {
        toast({ title: "Erreur", description: "Candidature introuvable", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger la candidature", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      label: newChecklistItem.trim(),
      checked: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistItem("");
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveNotes = async () => {
    if (!candidature) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/candidatures/experts/${candidature.id}/interview-notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            notes: notes,
            checklistJson: JSON.stringify(checklist),
          }),
        }
      );
      if (response.ok) {
        toast({ title: "Sauvegardé", description: "Notes et checklist enregistrées" });
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!candidature) return;
    try {
      // Save notes first
      await fetch(`/api/candidatures/experts/${candidature.id}/interview-notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: notes, checklistJson: JSON.stringify(checklist) }),
      });

      const response = await fetch(
        `/api/candidatures/experts/${candidature.id}/complete-interview`,
        { method: "POST", credentials: "include" }
      );
      if (response.ok) {
        toast({ title: "Succès", description: "Entretien marqué comme terminé" });
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleAccept = async () => {
    if (!candidature) return;
    try {
      // Save notes first
      await fetch(`/api/candidatures/experts/${candidature.id}/interview-notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: notes, checklistJson: JSON.stringify(checklist) }),
      });

      const response = await fetch(
        `/api/candidatures/experts/${candidature.id}/interview-accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: acceptRole }),
        }
      );
      if (response.ok) {
        toast({
          title: "Candidature acceptée",
          description: "L'administrateur a reçu une notification pour créer le compte.",
        });
        setShowAcceptDialog(false);
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!candidature) return;
    try {
      // Save notes first
      await fetch(`/api/candidatures/experts/${candidature.id}/interview-notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: notes, checklistJson: JSON.stringify(checklist) }),
      });

      const response = await fetch(
        `/api/candidatures/experts/${candidature.id}/interview-reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ notes: rejectNotes || notes }),
        }
      );
      if (response.ok) {
        toast({
          title: "Traitement effectué",
          description: "Le candidat a été notifié par email de manière appropriée.",
        });
        setShowRejectDialog(false);
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleDownloadFor20 = async () => {
    if (!candidature) return;
    try {
      const response = await fetch(
        `/api/candidatures/experts/${candidature.id}/for20`,
        { credentials: "include" }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FOR20_${candidature.registrationId}_${candidature.fullName}.pdf`;
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

  const getStatusInfo = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Entretien planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Entretien confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Entretien terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Acceptée" },
      REJECTED: { class: "bg-slate-50 text-slate-600 border-slate-300", label: "Non retenue" },
    };
    return map[status] || { class: "", label: status };
  };

  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistProgress = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  const canDecide =
    candidature &&
    ["INTERVIEW_CONFIRMED", "INTERVIEW_COMPLETED", "INTERVIEW_SCHEDULED"].includes(candidature.status);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full md:ml-64">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!candidature) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full md:ml-64">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Candidature introuvable</p>
              <Button variant="outline" onClick={() => setLocation("/ges-competences/entretiens")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour au planning
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Require interview confirmation before accessing preparation page
  if (candidature.status === "INTERVIEW_SCHEDULED") {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full md:ml-64">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Entretien non confirmé</h2>
              <p className="text-muted-foreground mb-2">
                L'entretien avec <strong>{candidature.fullName}</strong> n'a pas encore été confirmé.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Vous devez d'abord confirmer la date d'entretien avant de pouvoir accéder à la page de préparation et d'évaluation.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setLocation("/ges-competences/entretiens")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour au planning
                </Button>
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/candidatures/experts/${candidature.id}/confirm-interview`,
                        { method: "POST", credentials: "include" }
                      );
                      if (response.ok) {
                        toast({ title: "Succès", description: "Entretien confirmé" });
                        fetchCandidature();
                      } else {
                        const error = await response.json();
                        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Confirmer l'entretien
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(candidature.status);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-slate-600"
              onClick={() => setLocation("/ges-competences/entretiens")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour au planning
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Évaluation d'Entretien</h1>
                <p className="text-muted-foreground mt-1">
                  {candidature.fullName} — {getTypeLabel(candidature.userType)}
                </p>
              </div>
              <Badge variant="outline" className={`${statusInfo.class} text-sm px-3 py-1`}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Candidate Profile */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center mb-6">
                    {candidature.photoBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${candidature.photoBase64}`}
                        alt=""
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 mb-3"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                        <User className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    <h2 className="font-bold text-lg text-center">{candidature.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{candidature.registrationId}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{candidature.email}</span>
                    </div>
                    {candidature.telephone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{candidature.telephone}</span>
                      </div>
                    )}
                    {candidature.dateNaissance && (
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{candidature.dateNaissance}</span>
                      </div>
                    )}
                    {candidature.nationalite && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{candidature.nationalite}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-start gap-3 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{candidature.domaineExpertise}</p>
                        {candidature.sousDomaineExpertise && (
                          <p className="text-muted-foreground text-xs mt-0.5">{candidature.sousDomaineExpertise}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interview Info */}
              {candidature.interviewDate && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Date de l'entretien
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      {new Date(candidature.interviewDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Interview Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" /> Panel d'Entretien
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="font-medium">DT</span> — <span className="text-muted-foreground">Directeur Technique</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span className="font-medium">RQ</span> — <span className="text-muted-foreground">Responsable Qualité</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="font-medium">CD</span> — {panelMembers.cd ? (
                        <span className="text-muted-foreground">{panelMembers.cd.fullName}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Non sélectionné</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                      <div className="w-2 h-2 bg-teal-500 rounded-full" />
                      <span className="font-medium">RA</span> — {panelMembers.ra ? (
                        <span className="text-muted-foreground">{panelMembers.ra.fullName}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Non sélectionné</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="font-medium">GES</span> — <span className="text-muted-foreground">Gestionnaire de Compétences</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-sm" onClick={handleDownloadFor20}>
                    <Download className="w-4 h-4 mr-2" /> Télécharger FOR20
                  </Button>
                  {candidature.documentsJson &&
                    (() => {
                      try {
                        const docs: Array<{ name: string; base64?: string; mimeType?: string }> = JSON.parse(
                          candidature.documentsJson
                        );
                        if (!docs || docs.length === 0) return null;
                        return docs.map((doc, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            className="w-full justify-start text-sm h-auto py-2"
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
                            <Download className="w-3 h-3 mr-2 shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </Button>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Evaluation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Checklist */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5" /> Checklist d'Évaluation
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {checkedCount}/{checklist.length} ({checklistProgress}%)
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        checklistProgress === 100
                          ? "bg-green-500"
                          : checklistProgress > 50
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          item.checked ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => toggleChecklistItem(item.id)}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                          className="mt-0.5"
                        />
                        <span
                          className={`text-sm flex-1 ${item.checked ? "line-through text-green-700" : "text-slate-700"}`}
                        >
                          {item.label}
                        </span>
                        {item.id.startsWith("custom-") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChecklistItem(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {/* Add custom checklist item */}
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Ajouter un critère personnalisé..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Notes d'Entretien
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Notez vos observations pendant l'entretien : compétences techniques, savoir-être, points forts, points d'amélioration, recommandations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    className="resize-y"
                  />
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" onClick={handleSaveNotes} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Decision Section */}
              {canDecide && (
                <Card className="border-2 border-slate-200">
                  <CardHeader>
                    <CardTitle>Décision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidature.status !== "INTERVIEW_COMPLETED" && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          className="w-full text-teal-700 border-teal-300 hover:bg-teal-50"
                          onClick={handleMarkCompleted}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marquer l'entretien comme terminé
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Marquez l'entretien comme terminé avant de prendre une décision finale.
                        </p>
                        <Separator className="my-4" />
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button
                        className="h-auto py-4 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          // Pre-select role based on userType
                          // Exception : EVALUATEUR obtient automatiquement le rôle EF
                          const typeMap: Record<string, string> = { EXPERT: "EXPERT", EVALUATEUR: "EF", FORMATEUR: "FORMATEUR" };
                          setAcceptRole(typeMap[candidature.userType] || "EXPERT");
                          setShowAcceptDialog(true);
                        }}
                        disabled={candidature.status !== "INTERVIEW_COMPLETED"}
                      >
                        <div className="text-center px-2 break-words">
  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
  <span className="font-semibold text-sm block">
    Accepter la Candidature
  </span>
  <p className="text-xs font-normal opacity-80 mt-1">
    L'administrateur sera notifié pour créer le compte
  </p>
</div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 text-slate-600 border-slate-300 hover:bg-slate-50"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={candidature.status !== "INTERVIEW_COMPLETED"}
                      >
                        <div className="text-center">
                          <XCircle className="w-6 h-6 mx-auto mb-1" />
                          <span className="font-semibold">Non Retenue</span>
                          <p className="text-xs font-normal opacity-80 mt-1">
                            Le candidat recevra un email professionnel
                          </p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Already decided */}
              {candidature.interviewDecision && (
                <Card
                  className={`border-2 ${candidature.interviewDecision === "ACCEPTED" ? "border-green-300 bg-green-50" : "border-slate-300 bg-slate-50"}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      {candidature.interviewDecision === "ACCEPTED" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-slate-500" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {candidature.interviewDecision === "ACCEPTED"
                            ? "Candidature Acceptée"
                            : "Candidature Non Retenue"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {candidature.interviewDecision === "ACCEPTED"
                            ? "L'administrateur a été notifié pour la création du compte."
                            : "Le candidat a été notifié par email."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accepter la Candidature</DialogTitle>
            <DialogDescription>
              Veuillez vérifier les informations et sélectionner le rôle à attribuer au candidat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={candidature?.email || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={candidature?.nom || candidature?.fullName?.split(" ").slice(1).join(" ") || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={candidature?.prenom || candidature?.fullName?.split(" ")[0] || ""} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôle à attribuer <span className="text-red-500">*</span></Label>
              <Select value={acceptRole} onValueChange={setAcceptRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                  <SelectItem value="EF">Évaluateur en Formation</SelectItem>
                  <SelectItem value="ET">Évaluateur Technique</SelectItem>
                  <SelectItem value="EQ">Évaluateur Qualité</SelectItem>
                  <SelectItem value="FORMATEUR">Formateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Une notification sera envoyée à l'administrateur pour créer le compte utilisateur.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Annuler
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAccept}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer l'acceptation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidature Non Retenue</DialogTitle>
            <DialogDescription>
              Le candidat recevra un email professionnel indiquant que sa candidature n'a pas pu être retenue dans le
              cadre des contraintes opérationnelles actuelles, tout en restant encourageant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Note interne additionnelle (optionnel)</Label>
              <Textarea
                placeholder="Raison interne du refus (non visible par le candidat)..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Note :</strong> Le candidat recevra un email professionnel mentionnant que ses qualifications
                sont reconnues mais que la décision est liée aux contraintes opérationnelles. Aucune mention explicite
                de refus.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button variant="outline" className="text-slate-600" onClick={handleReject}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
