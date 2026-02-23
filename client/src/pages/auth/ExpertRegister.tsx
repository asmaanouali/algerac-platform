import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const nationalites = [
  "Algérienne", "Française", "Marocaine", "Tunisienne", "Libyenne", "Égyptienne",
  "Mauritanienne", "Sénégalaise", "Malienne", "Nigérienne", "Tchadienne", "Soudanaise", "Autre"
];

const situationsFamiliales = [
  "Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"
];

const domainesExpertise = [
  "Système de Management de la Qualité (ISO 9001)",
  "Système de Management Environnemental (ISO 14001)",
  "Système de Management de la Santé et Sécurité au Travail (ISO 45001)",
  "Système de Management de la Sécurité de l'Information (ISO 27001)",
  "Système de Management de l'Énergie (ISO 50001)",
  "Laboratoire d'essais",
  "Organisme d'inspection",
  "Organisme de certification de produits",
  "Autre"
];

const niveauxLangue = ["Basique", "Assez bien", "Bien", "Très bien", "Excellent"];

interface FormationAcademique {
  dateDuree: string;
  universite: string;
  coursSpecialite: string;
  diplome: string;
}

interface ExperienceProfessionnelle {
  dateDuAu: string;
  organisme: string;
  posteOccupe: string;
  activitesPrincipales: string;
  domaineCompetence: string;
  sousDomaineCompetence: string;
}

interface EvaluationAudit {
  moisAnnee: string;
  typeEvaluation: string;
  roleTenu: string;
  normesReferentiels: string;
}

interface FormationDispensee {
  dateDuree: string;
  formation: string;
  controleParAlgerac: string;
}

interface ConnaissanceLinguistique {
  langue: string;
  lu: string;
  parle: string;
  ecrit: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: "Type & Identification" },
  { id: 2, title: "Contacts" },
  { id: 3, title: "Formation académique" },
  { id: 4, title: "Expérience professionnelle" },
  { id: 5, title: "Évaluations / Audits" },
  { id: 6, title: "Formations dispensées" },
  { id: 7, title: "Connaissances linguistiques" },
  { id: 8, title: "Divers" },
];

export default function ExpertRegisterWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const userTypes = [
    { value: "EXPERT", label: "Expert" },
    { value: "EVALUATEUR", label: "Évaluateur" },
    { value: "FORMATEUR", label: "Formateur" },
  ];

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  const [formData, setFormData] = useState({
    userType: "EXPERT",
    nom: "",
    prenom: "",
    dateNaissance: "",
    nationalite: "",
    situationFamiliale: "",
    email: "",
    telephone: "",
    telephoneMobile: "",
    fax: "",
    adresseDomicile: "",
    adresseEntreprise: "",
    contactUrgenceNom: "",
    contactUrgenceTelephone: "",
    contactUrgenceMobile: "",
    informationsComplementaires: "",
    domaineExpertise: "",
    sousDomaineExpertise: "",
  });

  // Dynamic arrays
  const [formations, setFormations] = useState<FormationAcademique[]>([
    { dateDuree: "", universite: "", coursSpecialite: "", diplome: "" },
    { dateDuree: "", universite: "", coursSpecialite: "", diplome: "" },
  ]);

  const [experiences, setExperiences] = useState<ExperienceProfessionnelle[]>([
    { dateDuAu: "", organisme: "", posteOccupe: "", activitesPrincipales: "", domaineCompetence: "", sousDomaineCompetence: "" },
  ]);

  const [evaluations, setEvaluations] = useState<EvaluationAudit[]>([
    { moisAnnee: "", typeEvaluation: "", roleTenu: "", normesReferentiels: "" },
  ]);

  const [formationsDispensees, setFormationsDispensees] = useState<FormationDispensee[]>([
    { dateDuree: "", formation: "", controleParAlgerac: "" },
  ]);

  const [langues, setLangues] = useState<ConnaissanceLinguistique[]>([
    { langue: "Arabe", lu: "", parle: "", ecrit: "" },
    { langue: "Français", lu: "", parle: "", ecrit: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoBase64(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validatePhone = (phone: string, fieldName: string) => {
    const phoneRegex = /^(\+213|0)(5|6|7)[0-9]{8}$/;
    if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: "Format invalide. Ex: +213 555 123 456 ou 0555 123 456"
      }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: "Format d'email invalide" }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
      return true;
    }
  };

  const validateAge = (dateNaissance: string): boolean => {
    if (!dateNaissance) return false;
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const nextStep = () => {
    // Validate current step before advancing
    if (currentStep === 1) {
      const newErrors: ValidationErrors = {};
      if (!formData.nom) newErrors.nom = "Le nom est requis";
      if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
      if (!formData.dateNaissance) newErrors.dateNaissance = "La date de naissance est requise";
      else if (!validateAge(formData.dateNaissance)) newErrors.dateNaissance = "Le candidat doit avoir au moins 18 ans";
      if (!formData.nationalite) newErrors.nationalite = "La nationalité est requise";
      if (!formData.situationFamiliale) newErrors.situationFamiliale = "La situation familiale est requise";
      if (!photoBase64) newErrors.photo = "La photo est obligatoire";
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setApiError("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }

    if (currentStep === 2) {
      const newErrors: ValidationErrors = {};
      if (!formData.email) newErrors.email = "L'email est requis";
      if (!formData.telephone) newErrors.telephone = "Le téléphone est requis";
      if (!formData.adresseDomicile) newErrors.adresseDomicile = "L'adresse domicile est requise";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setApiError("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }

    if (currentStep === 7) {
      // Linguistic knowledge is required - at least one language with all levels
      const hasValidLangue = langues.some(l => l.langue && l.lu && l.parle && l.ecrit);
      if (!hasValidLangue) {
        setApiError("Veuillez renseigner au moins une langue avec tous les niveaux");
        return;
      }
    }

    setApiError("");
    setErrors({});
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setApiError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!consent1 || !consent2) {
      setApiError("Vous devez accepter les deux engagements pour continuer");
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.email || !formData.domaineExpertise) {
      setApiError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!photoBase64) {
      setApiError("La photo est obligatoire");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      // Convertir les fichiers joints en base64
      const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const documents = await Promise.all(
        attachedFiles.map(async (file) => ({
          name: file.name,
          base64: await fileToBase64(file),
          mimeType: file.type,
        }))
      );

      const payload = {
        userType: formData.userType,
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.dateNaissance,
        nationalite: formData.nationalite,
        situationFamiliale: formData.situationFamiliale,
        email: formData.email,
        telephone: formData.telephone,
        telephoneMobile: formData.telephoneMobile,
        fax: formData.fax,
        adresseDomicile: formData.adresseDomicile,
        adresseEntreprise: formData.adresseEntreprise,
        contactUrgenceNom: formData.contactUrgenceNom,
        contactUrgenceTelephone: formData.contactUrgenceTelephone,
        contactUrgenceMobile: formData.contactUrgenceMobile,
        informationsComplementaires: formData.informationsComplementaires,
        domaineExpertise: formData.domaineExpertise,
        sousDomaineExpertise: formData.sousDomaineExpertise,
        photoBase64: photoBase64,
        formationsAcademiques: formations.filter(f => f.universite || f.diplome).map(f => ({
          dateDuree: f.dateDuree,
          universite: f.universite,
          cours: f.coursSpecialite,
          specialite: f.coursSpecialite,
          diplome: f.diplome,
        })),
        experiencesProfessionnelles: experiences.filter(e => e.organisme || e.posteOccupe).map(e => ({
          dateDebut: e.dateDuAu.split(' - ')[0] || e.dateDuAu,
          dateFin: e.dateDuAu.split(' - ')[1] || '',
          organisme: e.organisme,
          poste: e.posteOccupe,
          activitesPrincipales: e.activitesPrincipales,
          domaineCompetence: e.domaineCompetence,
          sousDomaineCompetence: e.sousDomaineCompetence,
        })),
        evaluationsAudits: evaluations.filter(e => e.moisAnnee || e.typeEvaluation).map(e => ({
          moisAnnee: e.moisAnnee,
          typeEvaluation: e.typeEvaluation,
          roleTenu: e.roleTenu,
          normesReferentiels: e.normesReferentiels,
        })),
        formationsDispensees: formationsDispensees.filter(f => f.formation).map(f => ({
          dateDebut: f.dateDuree,
          duree: f.dateDuree,
          intituleFormation: f.formation,
          controleParAlgerac: f.controleParAlgerac,
        })),
        connaissancesLinguistiques: langues.filter(l => l.langue).map(l => ({
          langue: l.langue,
          niveauLu: l.lu,
          niveauParle: l.parle,
          niveauEcrit: l.ecrit,
        })),
        documents: documents.length > 0 ? documents : undefined,
      };

      const response = await fetch("http://localhost:8082/api/auth/signup/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'inscription");
      }

      setLocation("/auth/success");
    } catch (err) {
      let msg = "Une erreur s'est produite. Veuillez réessayer.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for updating dynamic arrays
  const updateFormation = (index: number, field: keyof FormationAcademique, value: string) => {
    setFormations(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const updateExperience = (index: number, field: keyof ExperienceProfessionnelle, value: string) => {
    setExperiences(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const updateEvaluation = (index: number, field: keyof EvaluationAudit, value: string) => {
    setEvaluations(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const updateFormationDispensee = (index: number, field: keyof FormationDispensee, value: string) => {
    setFormationsDispensees(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const updateLangue = (index: number, field: keyof ConnaissanceLinguistique, value: string) => {
    setLangues(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <Label className="text-sm font-semibold text-green-800">Type de candidature <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.userType}
                onValueChange={(value) => setFormData({...formData, userType: value})}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sélectionnez votre type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {userTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nom <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
              </div>

              <div className="space-y-2">
                <Label>Prénom <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  className={errors.prenom ? "border-red-500" : ""}
                />
                {errors.prenom && <p className="text-xs text-red-500">{errors.prenom}</p>}
              </div>

              <div className="space-y-2">
                <Label>Date de naissance <span className="text-red-500">*</span></Label>
                <Input 
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className={errors.dateNaissance ? "border-red-500" : ""}
                />
                {errors.dateNaissance && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.dateNaissance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nationalité <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.nationalite}
                  onValueChange={(value) => setFormData({...formData, nationalite: value})}
                >
                  <SelectTrigger className={cn("bg-white", errors.nationalite && "border-red-500")}>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {nationalites.map((nat) => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationalite && <p className="text-xs text-red-500">{errors.nationalite}</p>}
              </div>

              <div className="space-y-2">
                <Label>Situation familiale <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.situationFamiliale}
                  onValueChange={(value) => setFormData({...formData, situationFamiliale: value})}
                >
                  <SelectTrigger className={cn("bg-white", errors.situationFamiliale && "border-red-500")}>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {situationsFamiliales.map((sit) => (
                      <SelectItem key={sit} value={sit}>{sit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.situationFamiliale && <p className="text-xs text-red-500">{errors.situationFamiliale}</p>}
              </div>

              <div className="space-y-2">
                <Label>Photo <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className={cn("gap-2 bg-white", errors.photo && "border-red-500")}
                    onClick={() => document.getElementById('photo-file')?.click()}
                  >
                    <FileText className="w-4 h-4" /> Choisir une photo
                  </Button>
                  <input 
                    type="file" 
                    id="photo-file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                  <span className="text-xs text-slate-400 italic">
                    {photo ? photo.name : 'Aucun fichier sélectionné'}
                  </span>
                </div>
                {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input 
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onBlur={(e) => validateEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Téléphone <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="+213 XXX XXX XXX"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  onBlur={(e) => validatePhone(e.target.value, 'telephone')}
                  className={errors.telephone ? "border-red-500" : ""}
                />
                {errors.telephone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.telephone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input 
                  placeholder="+213 XXX XXX XXX"
                  value={formData.telephoneMobile}
                  onChange={(e) => setFormData({...formData, telephoneMobile: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Fax</Label>
                <Input 
                  placeholder="+213 XXX XXX XXX"
                  value={formData.fax}
                  onChange={(e) => setFormData({...formData, fax: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Adresse domicile <span className="text-red-500">*</span></Label>
                <Textarea 
                  placeholder="Adresse complète"
                  rows={2}
                  value={formData.adresseDomicile}
                  onChange={(e) => setFormData({...formData, adresseDomicile: e.target.value})}
                  className={errors.adresseDomicile ? "border-red-500" : ""}
                />
                {errors.adresseDomicile && <p className="text-xs text-red-500">{errors.adresseDomicile}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Adresse entreprise</Label>
                <Textarea 
                  placeholder="Adresse complète"
                  rows={2}
                  value={formData.adresseEntreprise}
                  onChange={(e) => setFormData({...formData, adresseEntreprise: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-orange-800">Contact d&apos;urgence</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input 
                    placeholder="Nom du contact"
                    value={formData.contactUrgenceNom}
                    onChange={(e) => setFormData({...formData, contactUrgenceNom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactUrgenceTelephone}
                    onChange={(e) => setFormData({...formData, contactUrgenceTelephone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactUrgenceMobile}
                    onChange={(e) => setFormData({...formData, contactUrgenceMobile: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Formation académique</h3>
            
            {formations.map((formation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Formation {index + 1}</span>
                  {index >= 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setFormations(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & durée</Label>
                    <Input 
                      placeholder="Ex: 2015 - 2020 (5 ans)"
                      value={formation.dateDuree}
                      onChange={(e) => updateFormation(index, 'dateDuree', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Université / Institution</Label>
                    <Input 
                      placeholder="Nom de l'université ou institution"
                      value={formation.universite}
                      onChange={(e) => updateFormation(index, 'universite', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cours / Spécialité</Label>
                    <Input 
                      placeholder="Ex: Génie industriel"
                      value={formation.coursSpecialite}
                      onChange={(e) => updateFormation(index, 'coursSpecialite', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diplôme</Label>
                    <Input 
                      placeholder="Ex: Master, Licence, Doctorat..."
                      value={formation.diplome}
                      onChange={(e) => updateFormation(index, 'diplome', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() => setFormations(prev => [...prev, { dateDuree: "", universite: "", coursSpecialite: "", diplome: "" }])}
            >
              <Plus className="w-4 h-4" /> Ajouter une autre formation
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Expérience professionnelle</h3>
            
            {experiences.map((exp, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Expérience {index + 1}</span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setExperiences(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date (du - au)</Label>
                    <Input 
                      placeholder="Ex: 01/2018 - 06/2022"
                      value={exp.dateDuAu}
                      onChange={(e) => updateExperience(index, 'dateDuAu', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organisme</Label>
                    <Input 
                      placeholder="Nom de l'organisme"
                      value={exp.organisme}
                      onChange={(e) => updateExperience(index, 'organisme', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poste occupé</Label>
                    <Input 
                      placeholder="Ex: Responsable qualité"
                      value={exp.posteOccupe}
                      onChange={(e) => updateExperience(index, 'posteOccupe', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Domaine compétence actuel</Label>
                    <Input 
                      placeholder="Ex: Management de la qualité"
                      value={exp.domaineCompetence}
                      onChange={(e) => updateExperience(index, 'domaineCompetence', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tâches principales</Label>
                    <Textarea 
                      placeholder="Décrivez les activités principales..."
                      rows={2}
                      value={exp.activitesPrincipales}
                      onChange={(e) => updateExperience(index, 'activitesPrincipales', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Sous-domaine</Label>
                    <Input 
                      placeholder="Ex: Agroalimentaire, Pharmaceutique..."
                      value={exp.sousDomaineCompetence}
                      onChange={(e) => updateExperience(index, 'sousDomaineCompetence', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() => setExperiences(prev => [...prev, { dateDuAu: "", organisme: "", posteOccupe: "", activitesPrincipales: "", domaineCompetence: "", sousDomaineCompetence: "" }])}
            >
              <Plus className="w-4 h-4" /> Ajouter une autre expérience
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Évaluation ou Audit de SM réalisés</h3>
              <p className="text-sm text-slate-500 mt-1">Cette section est optionnelle</p>
            </div>
            
            {evaluations.map((evalItem, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Évaluation / Audit {index + 1}</span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setEvaluations(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mois / Année</Label>
                    <Input 
                      placeholder="Ex: 03/2021"
                      value={evalItem.moisAnnee}
                      onChange={(e) => updateEvaluation(index, 'moisAnnee', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d&apos;évaluation ou d&apos;audit</Label>
                    <Input 
                      placeholder="Ex: Audit de certification ISO 9001"
                      value={evalItem.typeEvaluation}
                      onChange={(e) => updateEvaluation(index, 'typeEvaluation', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rôle tenu dans l&apos;équipe</Label>
                    <Input 
                      placeholder="Ex: Auditeur principal"
                      value={evalItem.roleTenu}
                      onChange={(e) => updateEvaluation(index, 'roleTenu', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Normes utilisées comme référentiels</Label>
                    <Input 
                      placeholder="Ex: ISO 9001:2015, ISO 19011"
                      value={evalItem.normesReferentiels}
                      onChange={(e) => updateEvaluation(index, 'normesReferentiels', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() => setEvaluations(prev => [...prev, { moisAnnee: "", typeEvaluation: "", roleTenu: "", normesReferentiels: "" }])}
            >
              <Plus className="w-4 h-4" /> Ajouter une autre évaluation / audit
            </Button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Formations dispensées par le candidat</h3>
              <p className="text-sm text-slate-500 mt-1">Formations ayant un lien avec les activités d&apos;évaluation de la conformité (optionnel)</p>
            </div>
            
            {formationsDispensees.map((fd, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Formation dispensée {index + 1}</span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setFormationsDispensees(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Durée</Label>
                    <Input 
                      placeholder="Ex: 03/2021 - 2 jours"
                      value={fd.dateDuree}
                      onChange={(e) => updateFormationDispensee(index, 'dateDuree', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Formation</Label>
                    <Input 
                      placeholder="Intitulé de la formation"
                      value={fd.formation}
                      onChange={(e) => updateFormationDispensee(index, 'formation', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Contrôlé par ALGERAC</Label>
                    <RadioGroup
                      value={fd.controleParAlgerac}
                      onValueChange={(value) => updateFormationDispensee(index, 'controleParAlgerac', value)}
                      className="flex gap-6 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Oui" id={`ctrl-oui-${index}`} />
                        <Label htmlFor={`ctrl-oui-${index}`} className="cursor-pointer">Oui</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non" id={`ctrl-non-${index}`} />
                        <Label htmlFor={`ctrl-non-${index}`} className="cursor-pointer">Non</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() => setFormationsDispensees(prev => [...prev, { dateDuree: "", formation: "", controleParAlgerac: "" }])}
            >
              <Plus className="w-4 h-4" /> Ajouter une autre formation dispensée
            </Button>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Connaissance linguistique <span className="text-red-500">*</span></h3>
              <p className="text-sm text-slate-500 mt-1">Indiquez vos compétences linguistiques. Au moins une langue est requise.</p>
            </div>
            
            {langues.map((langue, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Langue {index + 1}</span>
                  {langues.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setLangues(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Input 
                      placeholder="Ex: Français"
                      value={langue.langue}
                      onChange={(e) => updateLangue(index, 'langue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lu</Label>
                    <Select 
                      value={langue.lu}
                      onValueChange={(value) => updateLangue(index, 'lu', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Parlé</Label>
                    <Select 
                      value={langue.parle}
                      onValueChange={(value) => updateLangue(index, 'parle', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Écrit</Label>
                    <Select 
                      value={langue.ecrit}
                      onValueChange={(value) => updateLangue(index, 'ecrit', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() => setLangues(prev => [...prev, { langue: "", lu: "", parle: "", ecrit: "" }])}
            >
              <Plus className="w-4 h-4" /> Ajouter une autre langue
            </Button>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-green-800">Domaine d&apos;expertise</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domaine principal <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.domaineExpertise}
                    onValueChange={(value) => setFormData({...formData, domaineExpertise: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez votre domaine" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {domainesExpertise.map((domaine) => (
                        <SelectItem key={domaine} value={domaine}>{domaine}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sous-domaine / Spécialisation</Label>
                  <Input 
                    placeholder="Ex: Industrie pharmaceutique, Agroalimentaire..."
                    value={formData.sousDomaineExpertise}
                    onChange={(e) => setFormData({...formData, sousDomaineExpertise: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Informations complémentaires</Label>
              <Textarea 
                placeholder="Toute information pertinente pour votre candidature..." 
                rows={4}
                value={formData.informationsComplementaires}
                onChange={(e) => setFormData({...formData, informationsComplementaires: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fichiers joints (Optionnel)</Label>
                <p className="text-xs text-slate-500">Joignez tout fichier que vous jugez pertinent pour votre candidature (CV, certificats, attestations...)</p>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="gap-2 bg-white" 
                    onClick={() => document.getElementById('attached-files')?.click()}
                  >
                    <FileText className="w-4 h-4" /> Ajouter un fichier
                  </Button>
                  <input 
                    type="file" 
                    id="attached-files" 
                    className="hidden" 
                    multiple
                    onChange={handleAttachedFilesChange} 
                  />
                </div>
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 border rounded-md">
                        <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 ml-2"
                          onClick={() => removeAttachedFile(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 space-y-4 border-t">
              <h3 className="font-semibold text-lg">Engagements</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <Checkbox 
                    id="consent1"
                    checked={consent1}
                    onCheckedChange={(checked) => setConsent1(checked === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="consent1" className="text-sm leading-relaxed font-medium cursor-pointer">
                    J&apos;ai lu et j&apos;accepte la{" "}
                    <a 
                      href="https://algerac.dz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#00A63E] underline hover:text-[#008f35]"
                    >
                      politique de confidentialité
                    </a>{" "}
                    d&apos;ALGERAC. <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <Checkbox 
                    id="consent2"
                    checked={consent2}
                    onCheckedChange={(checked) => setConsent2(checked === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="consent2" className="text-sm leading-relaxed font-medium cursor-pointer">
                    Je consens à ce que mes données personnelles soient collectées et traitées conformément à la{" "}
                    <a 
                      href="https://algerac.dz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#00A63E] underline hover:text-[#008f35]"
                    >
                      loi n° X
                    </a>{" "}
                    relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel. <span className="text-red-500">*</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#00A63E' }}>ALGERAC</h1>
              <p className="text-sm text-slate-600">Inscription Expert / Évaluateur / Formateur</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register">
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Link>
          </Button>
        </div>

        {/* Modern Progress Bar (like OEC) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Étape {currentStep} sur {STEPS.length}</h2>
              <p className="text-sm text-slate-600">{STEPS[currentStep - 1].title}</p>
            </div>
            <span className="text-sm font-medium text-slate-500">
              {Math.round((currentStep / STEPS.length) * 100)}% complété
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00A63E] to-[#00D44A] transition-all duration-500"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex flex-col items-center transition-all",
                  step.id <= currentStep ? "opacity-100" : "opacity-40"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step.id < currentStep 
                    ? "bg-[#00A63E] text-white" 
                    : step.id === currentStep
                    ? "bg-[#00A63E] text-white ring-4 ring-[#00A63E]/20"
                    : "bg-slate-200 text-slate-400"
                )}>
                  {step.id}
                </div>
                <span className="text-[10px] mt-1 text-center hidden md:block max-w-[80px]">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error alert */}
        {apiError && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="flex-1">{apiError}</p>
          </div>
        )}

        {/* Form Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8 md:p-12">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button 
                  type="button"
                  onClick={nextStep}
                  className="gap-2 ml-auto"
                  style={{ backgroundColor: '#00A63E' }}
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !consent1 || !consent2}
                  className="ml-auto"
                  style={{ backgroundColor: '#00A63E' }}
                >
                  {loading ? "Envoi en cours..." : "Soumettre ma candidature"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
