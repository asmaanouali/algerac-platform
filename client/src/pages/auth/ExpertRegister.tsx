import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, FileText, Upload, Calendar, AlertCircle } from "lucide-react";

interface FormItem {
  id: number;
}

interface ValidationErrors {
  [key: string]: string;
}

interface FormationAcademique {
  id: number;
  dateDebut: string;
  dateFin: string;
  duree: string;
  universite: string;
  cours: string;
  specialite: string;
  diplome: string;
}

interface AutreFormation {
  id: number;
  dateDebut: string;
  dateFin: string;
  duree: string;
  institution: string;
  cours: string;
  specialite: string;
  certificat: string;
}

interface ExperienceProfessionnelle {
  id: number;
  dateDebut: string;
  dateFin: string;
  organisme: string;
  poste: string;
  activitesPrincipales: string;
  domaineCompetence: string;
  sousDomaineCompetence: string;
}

interface EvaluationAudit {
  id: number;
  moisAnnee: string;
  typeEvaluation: string;
  roleTenu: string;
  normesReferentiels: string;
}

interface FormationDispensee {
  id: number;
  dateDebut: string;
  duree: string;
  intituleFormation: string;
}

interface ConnaissanceLinguistique {
  langue: string;
  niveauLu: number;
  niveauParle: number;
  niveauEcrit: number;
}

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

export default function ExpertRegister() {
  const [, setLocation] = useLocation();
  
  // Ajout : options de rôle
  const userTypes = [
    { value: "EXPERT", label: "Expert" },
    { value: "EVALUATEUR", label: "Évaluateur" },
    { value: "FORMATEUR", label: "Formateur" },
  ];

  // États pour les listes dynamiques
  const [formationsAcademiques, setFormationsAcademiques] = useState<FormationAcademique[]>([{
    id: 1, dateDebut: "", dateFin: "", duree: "", universite: "", cours: "", specialite: "", diplome: ""
  }]);
  
  const [autresFormations, setAutresFormations] = useState<AutreFormation[]>([{
    id: 1, dateDebut: "", dateFin: "", duree: "", institution: "", cours: "", specialite: "", certificat: ""
  }]);
  
  const [experiences, setExperiences] = useState<ExperienceProfessionnelle[]>([{
    id: 1, dateDebut: "", dateFin: "", organisme: "", poste: "", activitesPrincipales: "", 
    domaineCompetence: "", sousDomaineCompetence: ""
  }]);
  
  const [evaluations, setEvaluations] = useState<EvaluationAudit[]>([{
    id: 1, moisAnnee: "", typeEvaluation: "", roleTenu: "", normesReferentiels: ""
  }]);
  
  const [formationsDispensees, setFormationsDispensees] = useState<FormationDispensee[]>([{
    id: 1, dateDebut: "", duree: "", intituleFormation: ""
  }]);
  
  const [connaissancesLinguistiques, setConnaissancesLinguistiques] = useState<ConnaissanceLinguistique[]>([
    { langue: "Arabe", niveauLu: 0, niveauParle: 0, niveauEcrit: 0 },
    { langue: "Français", niveauLu: 0, niveauParle: 0, niveauEcrit: 0 },
    { langue: "Anglais", niveauLu: 0, niveauParle: 0, niveauEcrit: 0 },
    { langue: "Autre", niveauLu: 0, niveauParle: 0, niveauEcrit: 0 }
  ]);
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [cv, setCV] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // États pour les données principales du formulaire
  const [formData, setFormData] = useState({
    // Section 1: Identification
    nom: "",
    prenom: "",
    dateNaissance: "",
    nationalite: "",
    situationFamiliale: "",
    
    // Section 2: Contacts
    email: "",
    telephone: "",
    telephoneMobile: "",
    fax: "",
    adresseDomicile: "",
    adresseEntreprise: "",
    contactUrgenceNom: "",
    contactUrgenceTelephone: "",
    contactUrgenceMobile: "",
    
    // Section 8: Divers & Expertise
    informationsComplementaires: "",
    domaineExpertise: "",
    sousDomaineExpertise: "",
    
    userType: "EXPERT"
  });

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Gestion de la photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      
      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoBase64(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCV(e.target.files[0]);
    }
  };

  // Validation du téléphone
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

  // Validation de l'email
  const validateEmail = (email: string, fieldName: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: "Format d'email invalide"
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

  // Gestion des listes dynamiques - Formations académiques
  const updateFormationAcademique = (index: number, field: keyof FormationAcademique, value: string) => {
    const updated = [...formationsAcademiques];
    updated[index] = { ...updated[index], [field]: value };
    setFormationsAcademiques(updated);
  };

  const addFormationAcademique = () => {
    setFormationsAcademiques([...formationsAcademiques, {
      id: Date.now(), dateDebut: "", dateFin: "", duree: "", universite: "", cours: "", specialite: "", diplome: ""
    }]);
  };

  const removeFormationAcademique = (id: number) => {
    if (formationsAcademiques.length > 1) {
      setFormationsAcademiques(formationsAcademiques.filter(f => f.id !== id));
    }
  };

  // Gestion des listes dynamiques - Autres formations
  const updateAutreFormation = (index: number, field: keyof AutreFormation, value: string) => {
    const updated = [...autresFormations];
    updated[index] = { ...updated[index], [field]: value };
    setAutresFormations(updated);
  };

  const addAutreFormation = () => {
    setAutresFormations([...autresFormations, {
      id: Date.now(), dateDebut: "", dateFin: "", duree: "", institution: "", cours: "", specialite: "", certificat: ""
    }]);
  };

  const removeAutreFormation = (id: number) => {
    if (autresFormations.length > 1) {
      setAutresFormations(autresFormations.filter(f => f.id !== id));
    }
  };

  // Gestion des listes dynamiques - Expériences
  const updateExperience = (index: number, field: keyof ExperienceProfessionnelle, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now(), dateDebut: "", dateFin: "", organisme: "", poste: "", 
      activitesPrincipales: "", domaineCompetence: "", sousDomaineCompetence: ""
    }]);
  };

  const removeExperience = (id: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(e => e.id !== id));
    }
  };

  // Gestion des listes dynamiques - Évaluations/Audits
  const updateEvaluation = (index: number, field: keyof EvaluationAudit, value: string) => {
    const updated = [...evaluations];
    updated[index] = { ...updated[index], [field]: value };
    setEvaluations(updated);
  };

  const addEvaluation = () => {
    setEvaluations([...evaluations, {
      id: Date.now(), moisAnnee: "", typeEvaluation: "", roleTenu: "", normesReferentiels: ""
    }]);
  };

  const removeEvaluation = (id: number) => {
    if (evaluations.length > 1) {
      setEvaluations(evaluations.filter(e => e.id !== id));
    }
  };

  // Gestion des listes dynamiques - Formations dispensées
  const updateFormationDispensee = (index: number, field: keyof FormationDispensee, value: string) => {
    const updated = [...formationsDispensees];
    updated[index] = { ...updated[index], [field]: value };
    setFormationsDispensees(updated);
  };

  const addFormationDispensee = () => {
    setFormationsDispensees([...formationsDispensees, {
      id: Date.now(), dateDebut: "", duree: "", intituleFormation: ""
    }]);
  };

  const removeFormationDispensee = (id: number) => {
    if (formationsDispensees.length > 1) {
      setFormationsDispensees(formationsDispensees.filter(f => f.id !== id));
    }
  };

  // Gestion des connaissances linguistiques
  const updateLangue = (index: number, field: 'niveauLu' | 'niveauParle' | 'niveauEcrit', value: number) => {
    const updated = [...connaissancesLinguistiques];
    updated[index] = { ...updated[index], [field]: value };
    setConnaissancesLinguistiques(updated);
  };

  // Fonction de soumission
  const handleSubmit = async () => {
    // Validation
    if (!agreedToTerms) {
      setApiError("Vous devez accepter les conditions d'inscription.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone || 
        !formData.dateNaissance || !formData.nationalite || !formData.domaineExpertise) {
      setApiError("Veuillez remplir tous les champs obligatoires.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setApiError("");
    
    try {
      // Filtrer les langues avec au moins un niveau renseigné
      const languesFiltered = connaissancesLinguistiques.filter(
        l => l.niveauLu > 0 || l.niveauParle > 0 || l.niveauEcrit > 0
      );

      const payload = {
        ...formData,
        photoBase64: photoBase64,
        formationsAcademiques: formationsAcademiques.filter(f => f.universite || f.diplome),
        autresFormations: autresFormations.filter(f => f.institution || f.certificat),
        experiencesProfessionnelles: experiences.filter(e => e.organisme || e.poste),
        evaluationsAudits: evaluations.filter(e => e.typeEvaluation || e.moisAnnee),
        formationsDispensees: formationsDispensees.filter(f => f.intituleFormation),
        connaissancesLinguistiques: languesFiltered
      };

      const response = await fetch("http://localhost:8080/api/auth/signup/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'inscription");
      }
      
      setLocation("/auth/success");
    } catch (err: any) {
      setApiError(err.message || "Une erreur s'est produite. Veuillez réessayer.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ color: '#00A63E' }}>ALGERAC</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Candidature Expert / Évaluateur / Formateur</h2>
          <p className="text-slate-600">Formulaire FOR 20 - Curriculum Vitae</p>
        </div>

        {/* Sélection du type de candidature */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <Label htmlFor="userType" className="font-semibold">Je candidate en tant que :</Label>
          <Select
            value={formData.userType}
            onValueChange={(value) => setFormData({ ...formData, userType: value })}
          >
            <SelectTrigger className="w-48 bg-white" id="userType">
              <SelectValue placeholder="Choisir un rôle" />
            </SelectTrigger>
            <SelectContent>
              {userTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-10">
            
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Section 1 - Identification */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                1 - Identification
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Nom de famille" 
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prénom <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Prénom" 
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date" 
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationalité <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.nationalite}
                    onValueChange={(value) => setFormData({...formData, nationalite: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {nationalites.map((nat) => (
                        <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Situation familiale <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.situationFamiliale}
                    onValueChange={(value) => setFormData({...formData, situationFamiliale: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {situationsFamiliales.map((sit) => (
                        <SelectItem key={sit} value={sit}>{sit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="gap-2 bg-white" 
                      onClick={() => document.getElementById('photo-file')?.click()}
                    >
                      <Upload className="w-4 h-4" /> Télécharger photo
                    </Button>
                    <input 
                      type="file" 
                      id="photo-file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                    />
                    <span className="text-xs text-slate-400 italic">
                      {photo ? photo.name : 'Aucune photo sélectionnée'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Contacts */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                2 - Contacts
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="exemple@email.com" 
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      validateEmail(e.target.value, 'email');
                    }}
                    required
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Téléphone <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="+213 555 123 456" 
                    value={formData.telephone}
                    onChange={(e) => {
                      setFormData({...formData, telephone: e.target.value});
                      validatePhone(e.target.value, 'telephone');
                    }}
                    required
                  />
                  {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Téléphone mobile</Label>
                  <Input 
                    placeholder="+213 666 123 456" 
                    value={formData.telephoneMobile}
                    onChange={(e) => setFormData({...formData, telephoneMobile: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fax</Label>
                  <Input 
                    placeholder="044 12 34 56" 
                    value={formData.fax}
                    onChange={(e) => setFormData({...formData, fax: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse domicile</Label>
                  <Input 
                    placeholder="Adresse complète du domicile" 
                    value={formData.adresseDomicile}
                    onChange={(e) => setFormData({...formData, adresseDomicile: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse entreprise</Label>
                  <Input 
                    placeholder="Adresse de l'entreprise (si applicable)" 
                    value={formData.adresseEntreprise}
                    onChange={(e) => setFormData({...formData, adresseEntreprise: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-4">Contact d&apos;urgence</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input 
                      placeholder="Nom du contact" 
                      value={formData.contactUrgenceNom}
                      onChange={(e) => setFormData({...formData, contactUrgenceNom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input 
                      placeholder="+213 555 000 000" 
                      value={formData.contactUrgenceTelephone}
                      onChange={(e) => setFormData({...formData, contactUrgenceTelephone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input 
                      placeholder="+213 666 000 000" 
                      value={formData.contactUrgenceMobile}
                      onChange={(e) => setFormData({...formData, contactUrgenceMobile: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Formations académiques */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">
                  3 - Formation(s) académique(s)
                </h3>
                <Button variant="outline" size="sm" onClick={addFormationAcademique}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">
                Par ordre chronologique : du plus récent au plus ancien
              </p>
              {formationsAcademiques.map((formation, index) => (
                <div key={formation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Formation {index + 1}</span>
                    {formationsAcademiques.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFormationAcademique(formation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Input 
                        type="month"
                        value={formation.dateDebut}
                        onChange={(e) => updateFormationAcademique(index, 'dateDebut', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input 
                        type="month"
                        value={formation.dateFin}
                        onChange={(e) => updateFormationAcademique(index, 'dateFin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée</Label>
                      <Input 
                        placeholder="Ex: 3 ans"
                        value={formation.duree}
                        onChange={(e) => updateFormationAcademique(index, 'duree', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Université / Institution</Label>
                      <Input 
                        placeholder="Nom de l'université"
                        value={formation.universite}
                        onChange={(e) => updateFormationAcademique(index, 'universite', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Cours / Spécialité</Label>
                      <Input 
                        placeholder="Intitulé du cours"
                        value={formation.cours}
                        onChange={(e) => updateFormationAcademique(index, 'cours', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spécialité</Label>
                      <Input 
                        placeholder="Spécialité"
                        value={formation.specialite}
                        onChange={(e) => updateFormationAcademique(index, 'specialite', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Diplôme</Label>
                      <Input 
                        placeholder="Diplôme obtenu"
                        value={formation.diplome}
                        onChange={(e) => updateFormationAcademique(index, 'diplome', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3bis - Autres formations */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">
                  3 - Autres formations
                </h3>
                <Button variant="outline" size="sm" onClick={addAutreFormation}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              {autresFormations.map((formation, index) => (
                <div key={formation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Autre formation {index + 1}</span>
                    {autresFormations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAutreFormation(formation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Input 
                        type="month"
                        value={formation.dateDebut}
                        onChange={(e) => updateAutreFormation(index, 'dateDebut', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input 
                        type="month"
                        value={formation.dateFin}
                        onChange={(e) => updateAutreFormation(index, 'dateFin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée</Label>
                      <Input 
                        placeholder="Ex: 2 semaines"
                        value={formation.duree}
                        onChange={(e) => updateAutreFormation(index, 'duree', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Institution</Label>
                      <Input 
                        placeholder="Nom de l'institution"
                        value={formation.institution}
                        onChange={(e) => updateAutreFormation(index, 'institution', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Cours / Spécialité</Label>
                      <Input 
                        placeholder="Intitulé"
                        value={formation.cours}
                        onChange={(e) => updateAutreFormation(index, 'cours', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spécialité</Label>
                      <Input 
                        placeholder="Spécialité"
                        value={formation.specialite}
                        onChange={(e) => updateAutreFormation(index, 'specialite', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Certificat</Label>
                      <Input 
                        placeholder="Certificat obtenu"
                        value={formation.certificat}
                        onChange={(e) => updateAutreFormation(index, 'certificat', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 4 - Expérience professionnelle */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">
                  4 - Expérience professionnelle
                </h3>
                <Button variant="outline" size="sm" onClick={addExperience}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">
                Par ordre chronologique : du plus récent au plus ancien
              </p>
              {experiences.map((exp, index) => (
                <div key={exp.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Expérience {index + 1}</span>
                    {experiences.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeExperience(exp.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Input 
                        type="month"
                        value={exp.dateDebut}
                        onChange={(e) => updateExperience(index, 'dateDebut', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input 
                        type="month"
                        value={exp.dateFin}
                        onChange={(e) => updateExperience(index, 'dateFin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Organisme</Label>
                      <Input 
                        placeholder="Nom de l'organisme"
                        value={exp.organisme}
                        onChange={(e) => updateExperience(index, 'organisme', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Poste occupé</Label>
                      <Input 
                        placeholder="Intitulé du poste"
                        value={exp.poste}
                        onChange={(e) => updateExperience(index, 'poste', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Activités principales</Label>
                      <Textarea 
                        placeholder="Description des activités"
                        value={exp.activitesPrincipales}
                        onChange={(e) => updateExperience(index, 'activitesPrincipales', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Domaine de compétence</Label>
                      <Input 
                        placeholder="Ex: Management de la qualité"
                        value={exp.domaineCompetence}
                        onChange={(e) => updateExperience(index, 'domaineCompetence', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous-domaine</Label>
                      <Input 
                        placeholder="Sous-domaine spécifique"
                        value={exp.sousDomaineCompetence}
                        onChange={(e) => updateExperience(index, 'sousDomaineCompetence', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 5 - Évaluation ou Audit de SM réalisés */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">
                  5 - Évaluation ou Audit de SM réalisés
                </h3>
                <Button variant="outline" size="sm" onClick={addEvaluation}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">
                Par ordre chronologique : du plus récent au plus ancien
              </p>
              {evaluations.map((evaluation, index) => (
                <div key={evaluation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Évaluation/Audit {index + 1}</span>
                    {evaluations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeEvaluation(evaluation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mois/Année</Label>
                      <Input 
                        type="month"
                        value={evaluation.moisAnnee}
                        onChange={(e) => updateEvaluation(index, 'moisAnnee', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type d&apos;évaluation ou d&apos;audit</Label>
                      <Input 
                        placeholder="Ex: Audit de certification"
                        value={evaluation.typeEvaluation}
                        onChange={(e) => updateEvaluation(index, 'typeEvaluation', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle tenu dans l&apos;équipe</Label>
                      <Input 
                        placeholder="Ex: Chef d'équipe, Auditeur..."
                        value={evaluation.roleTenu}
                        onChange={(e) => updateEvaluation(index, 'roleTenu', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Normes utilisées comme référentiels</Label>
                      <Input 
                        placeholder="Ex: ISO 9001, ISO 14001..."
                        value={evaluation.normesReferentiels}
                        onChange={(e) => updateEvaluation(index, 'normesReferentiels', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 6 - Formations dispensées */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">
                  6 - Formations dispensées ayant un lien avec les activités d&apos;évaluation
                </h3>
                <Button variant="outline" size="sm" onClick={addFormationDispensee}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">
                Par ordre chronologique : du plus récent au plus ancien
              </p>
              {formationsDispensees.map((formation, index) => (
                <div key={formation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Formation dispensée {index + 1}</span>
                    {formationsDispensees.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFormationDispensee(formation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & Durée</Label>
                      <Input 
                        placeholder="Ex: 10/2022"
                        value={formation.dateDebut}
                        onChange={(e) => updateFormationDispensee(index, 'dateDebut', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée</Label>
                      <Input 
                        placeholder="Ex: 3 jours"
                        value={formation.duree}
                        onChange={(e) => updateFormationDispensee(index, 'duree', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Formation</Label>
                      <Input 
                        placeholder="Intitulé de la formation"
                        value={formation.intituleFormation}
                        onChange={(e) => updateFormationDispensee(index, 'intituleFormation', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 7 - Connaissance Linguistique */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                7 - Connaissance Linguistique
              </h3>
              <p className="text-xs text-slate-500 italic">
                1 = Basique | 2 = Bien | 3 = Très bien | 4 = Excellent
              </p>
              <div className="space-y-4">
                {connaissancesLinguistiques.map((langue, index) => (
                  <div key={langue.langue} className="grid grid-cols-4 gap-4 items-center p-3 bg-slate-50 rounded">
                    <Label className="font-semibold">{langue.langue}</Label>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Lu</Label>
                      <Select
                        value={langue.niveauLu > 0 ? String(langue.niveauLu) : ""}
                        onValueChange={(value) => updateLangue(index, 'niveauLu', parseInt(value))}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Parlé</Label>
                      <Select
                        value={langue.niveauParle > 0 ? String(langue.niveauParle) : ""}
                        onValueChange={(value) => updateLangue(index, 'niveauParle', parseInt(value))}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Écrit</Label>
                      <Select
                        value={langue.niveauEcrit > 0 ? String(langue.niveauEcrit) : ""}
                        onValueChange={(value) => updateLangue(index, 'niveauEcrit', parseInt(value))}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 8 - Divers & Domaine d'expertise */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                8 - Divers & Domaine d&apos;expertise
              </h3>
              
              {/* NOUVEAU: Domaine d'expertise */}
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
            </div>

            {/* Documents & Engagements */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                Documents & Engagements
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CV Détaillé (Optionnel)</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="gap-2 bg-white" 
                      onClick={() => document.getElementById('cv-file')?.click()}
                    >
                      <FileText className="w-4 h-4" /> Choisir un fichier
                    </Button>
                    <input 
                      type="file" 
                      id="cv-file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx" 
                      onChange={handleCVChange} 
                    />
                    <span className="text-xs text-slate-400 italic">
                      {cv ? cv.name : 'Aucun fichier sélectionné'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    id="agree"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <Label htmlFor="agree" className="text-sm leading-relaxed font-medium">
                    Je confirme l&apos;exactitude des informations fournies et mon engagement 
                    d&apos;indépendance, d&apos;objectivité et de confidentialité conformément 
                    aux règles d&apos;ALGERAC. <span className="text-red-500">*</span>
                  </Label>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base font-bold" 
              onClick={handleSubmit}
              disabled={loading || !agreedToTerms}
              style={{ backgroundColor: '#00A63E' }}
            >
              {loading ? "Envoi en cours..." : "Soumettre ma candidature"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}