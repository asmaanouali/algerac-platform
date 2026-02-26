import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, FileText, AlertCircle, Plus, Trash2, Upload, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";

registerLocale("fr", fr);

const nationalites = [
  "Algérienne", "Française", "Marocaine", "Tunisienne", "Libyenne", "Égyptienne",
  "Mauritanienne", "Sénégalaise", "Malienne", "Nigérienne", "Tchadienne", "Soudanaise", "Autre"
];

const situationsFamiliales = [
  "Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"
];

const diplomes = [
  "Baccalauréat", "BTS / DUT", "Licence (LMD)", "Licence classique",
  "Master 1", "Master 2", "Ingénieur d'État", "Magister",
  "Doctorat", "Doctorat d'État", "Habilitation Universitaire",
  "Certificat professionnel", "Diplôme de Technicien Supérieur", "Autre"
];

const languesListe = [
  "Arabe", "Français", "Anglais", "Espagnol", "Allemand", "Italien",
  "Portugais", "Russe", "Chinois", "Japonais", "Turc", "Autre"
];

const niveauxLangue = ["Basique", "Assez bien", "Bien", "Très bien", "Excellent"];

interface FormationAcademique {
  dateDebut: string;
  dateFin: string;
  universite: string;
  coursSpecialite: string;
  diplome: string;
}

interface AutreFormation {
  dateDebut: string;
  dateFin: string;
  universite: string;
  coursSpecialite: string;
  diplome: string;
}

interface ExperienceProfessionnelle {
  dateDebut: string;
  dateFin: string;
  organisme: string;
  posteOccupe: string;
  activitesPrincipales: string;
  domaineCompetence: string;
  sousDomaineCompetence: string;
}

interface EvaluationAudit {
  dateDebut: string;
  dateFin: string;
  type: "evaluation" | "audit" | "";
  typeEvaluation: string;
  roleTenu: string;
  normesReferentiels: string;
}

interface FormationDispensee {
  dateDebut: string;
  dateFin: string;
  duree: string;
  formation: string;
  organismeBeneficiaire: string;
}

interface ConnaissanceLinguistique {
  langue: string;
  langueAutre: string;
  lu: string;
  parle: string;
  ecrit: string;
}

interface StepFiles {
  [stepKey: string]: File[];
}

interface ValidationErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: "Type & Identification" },
  { id: 2, title: "Contacts" },
  { id: 3, title: "Formation académique" },
  { id: 4, title: "Autres Formations" },
  { id: 5, title: "Expérience professionnelle" },
  { id: 6, title: "Évaluations / Audits" },
  { id: 7, title: "Formations dispensées" },
  { id: 8, title: "Connaissances linguistiques" },
  { id: 9, title: "Divers" },
];

// Helper to parse date string "YYYY-MM" into comparable value
const parseDateForComparison = (dateStr: string): number => {
  if (!dateStr) return 0;
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    return parseInt(parts[0]) * 100 + parseInt(parts[1]);
  }
  return 0;
};

// Validate chronological order for date-based arrays
const validateChronologicalOrder = (
  items: Array<{ dateDebut: string; dateFin?: string }>,
  label: string
): string | null => {
  const filledItems = items.filter((it) => it.dateDebut);
  if (filledItems.length < 2) return null;

  for (let i = 1; i < filledItems.length; i++) {
    const prevStart = parseDateForComparison(filledItems[i - 1].dateDebut);
    const currStart = parseDateForComparison(filledItems[i].dateDebut);
    if (currStart > 0 && prevStart > 0 && currStart < prevStart) {
      return `${label} ${i + 1} doit être plus récente que ${label} ${i}. Les renseignements doivent être faits par ordre chronologique (du plus ancien au plus récent).`;
    }
  }
  return null;
};

export default function ExpertRegisterWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);

  const userTypes = [
    { value: "EXPERT", label: "Expert" },
    { value: "EVALUATEUR", label: "Évaluateur" },
    { value: "FORMATEUR", label: "Formateur" },
  ];

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [stepFiles, setStepFiles] = useState<StepFiles>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3Type, setConsent3Type] = useState<string>("");
  const [consent3Details, setConsent3Details] = useState<string>("");

  // Step 6 & 7 gate toggles
  const [hasEvaluations, setHasEvaluations] = useState<boolean | null>(null);
  const [hasFormationsDispensees, setHasFormationsDispensees] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    userType: "EXPERT",
    nom: "",
    prenom: "",
    dateNaissance: null as Date | null,
    nationalite: "",
    nationaliteAutre: "",
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
  });

  // Dynamic arrays
  const [formations, setFormations] = useState<FormationAcademique[]>([
    { dateDebut: "", dateFin: "", universite: "", coursSpecialite: "", diplome: "" },
  ]);

  const [autresFormations, setAutresFormations] = useState<AutreFormation[]>([
    { dateDebut: "", dateFin: "", universite: "", coursSpecialite: "", diplome: "" },
  ]);

  const [experiences, setExperiences] = useState<ExperienceProfessionnelle[]>([
    { dateDebut: "", dateFin: "", organisme: "", posteOccupe: "", activitesPrincipales: "", domaineCompetence: "", sousDomaineCompetence: "" },
  ]);

  const [evaluations, setEvaluations] = useState<EvaluationAudit[]>([
    { dateDebut: "", dateFin: "", type: "", typeEvaluation: "", roleTenu: "", normesReferentiels: "" },
  ]);

  const [formationsDispensees, setFormationsDispensees] = useState<FormationDispensee[]>([
    { dateDebut: "", dateFin: "", duree: "", formation: "", organismeBeneficiaire: "" },
  ]);

  const [langues, setLangues] = useState<ConnaissanceLinguistique[]>([
    { langue: "Arabe", langueAutre: "", lu: "", parle: "", ecrit: "" },
    { langue: "Français", langueAutre: "", lu: "", parle: "", ecrit: "" },
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
        setPhotoBase64(base64String.split(",")[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepFilesChange = (stepKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStepFiles((prev) => ({
        ...prev,
        [stepKey]: [...(prev[stepKey] || []), ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeStepFile = (stepKey: string, index: number) => {
    setStepFiles((prev) => ({
      ...prev,
      [stepKey]: (prev[stepKey] || []).filter((_, i) => i !== index),
    }));
  };

  const renderFileUpload = (stepKey: string, label: string) => (
    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-blue-600" />
        <Label className="text-sm font-semibold text-blue-800">{label}</Label>
      </div>
      <p className="text-xs text-blue-600">
        Joignez les justificatifs correspondants à cette section (diplômes, attestations, certificats...)
      </p>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 bg-white"
          onClick={() => document.getElementById(`file-${stepKey}`)?.click()}
        >
          <FileText className="w-4 h-4" /> Ajouter un fichier
        </Button>
        <input
          type="file"
          id={`file-${stepKey}`}
          className="hidden"
          multiple
          onChange={(e) => handleStepFilesChange(stepKey, e)}
        />
      </div>
      {(stepFiles[stepKey] || []).length > 0 && (
        <div className="space-y-1">
          {(stepFiles[stepKey] || []).map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-md">
              <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 ml-2"
                onClick={() => removeStepFile(stepKey, index)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Format d'email invalide" }));
      return false;
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
      return true;
    }
  };

  const validateAge = (dateNaissance: Date | null): boolean => {
    if (!dateNaissance) return false;
    const today = new Date();
    let age = today.getFullYear() - dateNaissance.getFullYear();
    const monthDiff = today.getMonth() - dateNaissance.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateNaissance.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const nextStep = () => {
    const newErrors: ValidationErrors = {};

    if (currentStep === 1) {
      if (!formData.nom) newErrors.nom = "Le nom est requis";
      if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
      if (!formData.dateNaissance) newErrors.dateNaissance = "La date de naissance est requise";
      else if (!validateAge(formData.dateNaissance))
        newErrors.dateNaissance = "Le candidat doit avoir au moins 18 ans";
      if (!formData.nationalite) newErrors.nationalite = "La nationalité est requise";
      if (formData.nationalite === "Autre" && !formData.nationaliteAutre)
        newErrors.nationaliteAutre = "Veuillez indiquer votre nationalité";
      if (!formData.situationFamiliale)
        newErrors.situationFamiliale = "La situation familiale est requise";
      if (!photoBase64) newErrors.photo = "La photo est obligatoire";
    }

    if (currentStep === 2) {
      if (!formData.email) newErrors.email = "L'email est requis";
      if (!formData.telephone) newErrors.telephone = "Le téléphone est requis";
      if (!formData.telephoneMobile) newErrors.telephoneMobile = "Le mobile est requis";
      if (!formData.contactUrgenceNom) newErrors.contactUrgenceNom = "Le nom du contact d'urgence est requis";
      if (!formData.contactUrgenceTelephone) newErrors.contactUrgenceTelephone = "Le téléphone du contact d'urgence est requis";
      // At least one address required
      if (!formData.adresseDomicile && !formData.adresseEntreprise) {
        newErrors.adresseDomicile = "Veuillez renseigner au moins une adresse (domicile ou entreprise)";
        newErrors.adresseEntreprise = "Veuillez renseigner au moins une adresse (domicile ou entreprise)";
      }
    }

    if (currentStep === 3) {
      const filledFormations = formations.filter(
        (f) => f.dateDebut || f.dateFin || f.universite || f.coursSpecialite || f.diplome
      );
      if (filledFormations.length === 0) {
        newErrors.formations = "Au moins une formation académique est requise";
      } else {
        for (let i = 0; i < filledFormations.length; i++) {
          const f = filledFormations[i];
          if (!f.dateDebut) newErrors[`formation_${i}_dateDebut`] = "Date début requise";
          if (!f.dateFin) newErrors[`formation_${i}_dateFin`] = "Date fin requise";
          if (!f.universite) newErrors[`formation_${i}_universite`] = "Université requise";
          if (!f.coursSpecialite) newErrors[`formation_${i}_coursSpecialite`] = "Spécialité requise";
          if (!f.diplome) newErrors[`formation_${i}_diplome`] = "Diplôme requis";
        }
      }
      const chronErr = validateChronologicalOrder(formations.filter((f) => f.dateDebut), "Formation");
      if (chronErr) newErrors.formationsChronology = chronErr;
    }

    if (currentStep === 4) {
      const filledAutres = autresFormations.filter(
        (f) => f.dateDebut || f.dateFin || f.universite || f.coursSpecialite || f.diplome
      );
      for (let i = 0; i < filledAutres.length; i++) {
        const f = filledAutres[i];
        if (!f.dateDebut) newErrors[`autreFormation_${i}_dateDebut`] = "Date début requise";
        if (!f.dateFin) newErrors[`autreFormation_${i}_dateFin`] = "Date fin requise";
        if (!f.universite) newErrors[`autreFormation_${i}_universite`] = "Institution requise";
        if (!f.coursSpecialite) newErrors[`autreFormation_${i}_coursSpecialite`] = "Cours requis";
        if (!f.diplome) newErrors[`autreFormation_${i}_diplome`] = "Certificat/Diplôme requis";
      }
      const chronErr = validateChronologicalOrder(
        autresFormations.filter((f) => f.dateDebut),
        "Formation"
      );
      if (chronErr) newErrors.autresFormationsChronology = chronErr;
    }

    if (currentStep === 5) {
      const filledExps = experiences.filter(
        (e) => e.dateDebut || e.dateFin || e.organisme || e.posteOccupe
      );
      if (filledExps.length === 0) {
        newErrors.experiences = "Au moins une expérience professionnelle est requise";
      } else {
        for (let i = 0; i < filledExps.length; i++) {
          const e = filledExps[i];
          if (!e.dateDebut) newErrors[`exp_${i}_dateDebut`] = "Date début requise";
          if (!e.dateFin) newErrors[`exp_${i}_dateFin`] = "Date fin requise";
          if (!e.organisme) newErrors[`exp_${i}_organisme`] = "Organisme requis";
          if (!e.posteOccupe) newErrors[`exp_${i}_posteOccupe`] = "Poste requis";
          if (!e.activitesPrincipales) newErrors[`exp_${i}_activites`] = "Activités requises";
          if (!e.domaineCompetence) newErrors[`exp_${i}_domaine`] = "Domaine requis";
          if (!e.sousDomaineCompetence) newErrors[`exp_${i}_sousDomaine`] = "Sous-domaine requis";
        }
      }
      const chronErr = validateChronologicalOrder(
        experiences.filter((e) => e.dateDebut),
        "Expérience"
      );
      if (chronErr) newErrors.experiencesChronology = chronErr;
    }

    if (currentStep === 6) {
      if (hasEvaluations === null) {
        newErrors.hasEvaluations = "Veuillez répondre à la question";
      }
      if (hasEvaluations) {
        const filledEvals = evaluations.filter(
          (e) => e.dateDebut || e.typeEvaluation || e.roleTenu
        );
        if (filledEvals.length === 0) {
          newErrors.evaluations = "Veuillez renseigner au moins une évaluation/audit";
        } else {
          for (let i = 0; i < filledEvals.length; i++) {
            const e = filledEvals[i];
            if (!e.type) newErrors[`eval_${i}_type`] = "Type requis";
            if (!e.dateDebut) newErrors[`eval_${i}_dateDebut`] = "Date début requise";
            if (!e.dateFin) newErrors[`eval_${i}_dateFin`] = "Date fin requise";
            if (!e.typeEvaluation) newErrors[`eval_${i}_typeEvaluation`] = "Description requise";
            if (!e.roleTenu) newErrors[`eval_${i}_roleTenu`] = "Rôle requis";
            if (!e.normesReferentiels) newErrors[`eval_${i}_normes`] = "Normes requises";
          }
        }
        const chronErr = validateChronologicalOrder(
          evaluations.filter((e) => e.dateDebut),
          "Évaluation/Audit"
        );
        if (chronErr) newErrors.evaluationsChronology = chronErr;
      }
    }

    if (currentStep === 7) {
      if (hasFormationsDispensees === null) {
        newErrors.hasFormationsDispensees = "Veuillez répondre à la question";
      }
      if (hasFormationsDispensees) {
        const filledFD = formationsDispensees.filter(
          (f) => f.dateDebut || f.formation
        );
        if (filledFD.length === 0) {
          newErrors.formationsDispensees = "Veuillez renseigner au moins une formation dispensée";
        } else {
          for (let i = 0; i < filledFD.length; i++) {
            const f = filledFD[i];
            if (!f.dateDebut) newErrors[`fd_${i}_dateDebut`] = "Date début requise";
            if (!f.dateFin) newErrors[`fd_${i}_dateFin`] = "Date fin requise";
            if (!f.duree) newErrors[`fd_${i}_duree`] = "Durée requise";
            if (!f.formation) newErrors[`fd_${i}_formation`] = "Intitulé requis";
            if (!f.organismeBeneficiaire) newErrors[`fd_${i}_organisme`] = "Organisme bénéficiaire requis";
          }
        }
        const chronErr = validateChronologicalOrder(
          formationsDispensees.filter((f) => f.dateDebut),
          "Formation dispensée"
        );
        if (chronErr) newErrors.fdChronology = chronErr;
      }
    }

    if (currentStep === 8) {
      const hasValidLangue = langues.some((l) => {
        const langueVal = l.langue === "Autre" ? l.langueAutre : l.langue;
        return langueVal && l.lu && l.parle && l.ecrit;
      });
      if (!hasValidLangue) {
        newErrors.langues = "Veuillez renseigner au moins une langue avec tous les niveaux";
      }
      for (let i = 0; i < langues.length; i++) {
        if (langues[i].langue === "Autre" && !langues[i].langueAutre) {
          newErrors[`langue_${i}_autre`] = "Veuillez indiquer la langue";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const chronErrors = Object.entries(newErrors).filter(([k]) => k.includes("Chronology") || k.includes("chronology"));
      if (chronErrors.length > 0) {
        setApiError(chronErrors[0][1]);
      } else {
        setApiError("Veuillez remplir tous les champs obligatoires");
      }
      return;
    }

    setApiError("");
    setErrors({});
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setApiError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!consent1 || !consent2) {
      setApiError("Vous devez accepter les deux engagements pour continuer");
      return;
    }
    if (!consent3Type) {
      setApiError("Veuillez indiquer votre préférence concernant le partage de données avec les OEC");
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.email) {
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
      const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const allFiles: File[] = [];
      Object.values(stepFiles).forEach((files) => allFiles.push(...files));

      const documents = await Promise.all(
        allFiles.map(async (file) => ({
          name: file.name,
          base64: await fileToBase64(file),
          mimeType: file.type,
        }))
      );

      const nationaliteFinal = formData.nationalite === "Autre" ? formData.nationaliteAutre : formData.nationalite;

      const payload = {
        userType: formData.userType,
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.dateNaissance
          ? formData.dateNaissance.toISOString().split("T")[0]
          : "",
        nationalite: nationaliteFinal,
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
        domaineExpertise: "",
        sousDomaineExpertise: "",
        photoBase64: photoBase64,
        consentOecData: consent3Type,
        consentOecDataDetails: consent3Details,
        formationsAcademiques: formations
          .filter((f) => f.universite || f.diplome)
          .map((f) => ({
            dateDebut: f.dateDebut,
            dateFin: f.dateFin,
            universite: f.universite,
            cours: f.coursSpecialite,
            specialite: f.coursSpecialite,
            diplome: f.diplome,
          })),
        autresFormations: autresFormations
          .filter((f) => f.universite || f.diplome)
          .map((f) => ({
            dateDebut: f.dateDebut,
            dateFin: f.dateFin,
            institution: f.universite,
            cours: f.coursSpecialite,
            specialite: f.coursSpecialite,
            certificat: f.diplome,
          })),
        experiencesProfessionnelles: experiences
          .filter((e) => e.organisme || e.posteOccupe)
          .map((e) => ({
            dateDebut: e.dateDebut,
            dateFin: e.dateFin,
            organisme: e.organisme,
            poste: e.posteOccupe,
            activitesPrincipales: e.activitesPrincipales,
            domaineCompetence: e.domaineCompetence,
            sousDomaineCompetence: e.sousDomaineCompetence,
          })),
        evaluationsAudits: hasEvaluations
          ? evaluations
              .filter((e) => e.typeEvaluation || e.roleTenu)
              .map((e) => ({
                dateDebut: e.dateDebut,
                dateFin: e.dateFin,
                type: e.type,
                typeEvaluation: e.typeEvaluation,
                roleTenu: e.roleTenu,
                normesReferentiels: e.normesReferentiels,
                moisAnnee: e.dateDebut,
              }))
          : [],
        formationsDispensees: hasFormationsDispensees
          ? formationsDispensees
              .filter((f) => f.formation)
              .map((f) => ({
                dateDebut: f.dateDebut,
                dateFin: f.dateFin,
                duree: f.duree,
                intituleFormation: f.formation,
                organismeBeneficiaire: f.organismeBeneficiaire,
              }))
          : [],
        connaissancesLinguistiques: langues
          .filter((l) => l.langue)
          .map((l) => ({
            langue: l.langue === "Autre" ? l.langueAutre : l.langue,
            niveauLu: l.lu,
            niveauParle: l.parle,
            niveauEcrit: l.ecrit,
          })),
        documents: documents.length > 0 ? documents : undefined,
      };

      const response = await fetch("/api/auth/signup/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || errorData.error || "Erreur lors de l'inscription";
        // Check for blacklist error
        if (errorMsg.startsWith("BLACKLISTED:")) {
          setShowBlacklistDialog(true);
          return;
        }
        throw new Error(errorMsg);
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
    setFormations((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const updateAutreFormation = (index: number, field: keyof AutreFormation, value: string) => {
    setAutresFormations((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const updateExperience = (index: number, field: keyof ExperienceProfessionnelle, value: string) => {
    setExperiences((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const updateEvaluation = (index: number, field: keyof EvaluationAudit, value: string) => {
    setEvaluations((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const updateFormationDispensee = (index: number, field: keyof FormationDispensee, value: string) => {
    setFormationsDispensees((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const updateLangue = (index: number, field: keyof ConnaissanceLinguistique, value: string) => {
    setLangues((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const hasError = useCallback(
    (key: string) => !!errors[key],
    [errors]
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <Label className="text-sm font-semibold text-green-800">
                Type de candidature <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sélectionnez votre type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {userTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={errors.prenom ? "border-red-500" : ""}
                />
                {errors.prenom && <p className="text-xs text-red-500">{errors.prenom}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Date de naissance <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={formData.dateNaissance}
                  onChange={(date: Date | null) => setFormData({ ...formData, dateNaissance: date })}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                  placeholderText="Sélectionnez votre date de naissance"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    errors.dateNaissance && "border-red-500"
                  )}
                  wrapperClassName="w-full"
                />
                {errors.dateNaissance && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.dateNaissance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Nationalité <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.nationalite}
                  onValueChange={(value) => setFormData({ ...formData, nationalite: value })}
                >
                  <SelectTrigger className={cn("bg-white", errors.nationalite && "border-red-500")}>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {nationalites.map((nat) => (
                      <SelectItem key={nat} value={nat}>
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationalite && <p className="text-xs text-red-500">{errors.nationalite}</p>}
                {formData.nationalite === "Autre" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Indiquez votre nationalité"
                      value={formData.nationaliteAutre}
                      onChange={(e) => setFormData({ ...formData, nationaliteAutre: e.target.value })}
                      className={errors.nationaliteAutre ? "border-red-500" : ""}
                    />
                    {errors.nationaliteAutre && (
                      <p className="text-xs text-red-500">{errors.nationaliteAutre}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Situation familiale <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.situationFamiliale}
                  onValueChange={(value) => setFormData({ ...formData, situationFamiliale: value })}
                >
                  <SelectTrigger className={cn("bg-white", errors.situationFamiliale && "border-red-500")}>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {situationsFamiliales.map((sit) => (
                      <SelectItem key={sit} value={sit}>
                        {sit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.situationFamiliale && (
                  <p className="text-xs text-red-500">{errors.situationFamiliale}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Photo <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("gap-2 bg-white", errors.photo && "border-red-500")}
                    onClick={() => document.getElementById("photo-file")?.click()}
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
                    {photo ? photo.name : "Aucun fichier sélectionné"}
                  </span>
                </div>
                {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
              </div>
            </div>

            {renderFileUpload("step1", "Fichiers justificatifs (pièce d'identité, etc.)")}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <Label>
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="+213 XXX XXX XXX"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className={errors.telephone ? "border-red-500" : ""}
                />
                {errors.telephone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.telephone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Mobile <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="+213 XXX XXX XXX"
                  value={formData.telephoneMobile}
                  onChange={(e) => setFormData({ ...formData, telephoneMobile: e.target.value })}
                  className={errors.telephoneMobile ? "border-red-500" : ""}
                />
                {errors.telephoneMobile && (
                  <p className="text-xs text-red-500">{errors.telephoneMobile}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fax</Label>
                <Input
                  placeholder="+213 XXX XXX XXX"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  Adresse domicile{" "}
                  {!formData.adresseEntreprise && <span className="text-red-500">*</span>}
                </Label>
                <p className="text-xs text-slate-500 mb-1">
                  Vous devez renseigner au moins une adresse (domicile ou entreprise), vous pouvez renseigner les deux.
                </p>
                <Textarea
                  placeholder="Adresse complète"
                  rows={2}
                  value={formData.adresseDomicile}
                  onChange={(e) => setFormData({ ...formData, adresseDomicile: e.target.value })}
                  className={errors.adresseDomicile ? "border-red-500" : ""}
                />
                {errors.adresseDomicile && (
                  <p className="text-xs text-red-500">{errors.adresseDomicile}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  Adresse entreprise{" "}
                  {!formData.adresseDomicile && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder="Adresse complète"
                  rows={2}
                  value={formData.adresseEntreprise}
                  onChange={(e) => setFormData({ ...formData, adresseEntreprise: e.target.value })}
                  className={errors.adresseEntreprise ? "border-red-500" : ""}
                />
                {errors.adresseEntreprise && (
                  <p className="text-xs text-red-500">{errors.adresseEntreprise}</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-orange-800">Contact d&apos;urgence <span className="text-red-500">*</span></h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Nom du contact"
                    value={formData.contactUrgenceNom}
                    onChange={(e) => setFormData({ ...formData, contactUrgenceNom: e.target.value })}
                    className={errors.contactUrgenceNom ? "border-red-500" : ""}
                  />
                  {errors.contactUrgenceNom && (
                    <p className="text-xs text-red-500">{errors.contactUrgenceNom}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactUrgenceTelephone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactUrgenceTelephone: e.target.value })
                    }
                    className={errors.contactUrgenceTelephone ? "border-red-500" : ""}
                  />
                  {errors.contactUrgenceTelephone && (
                    <p className="text-xs text-red-500">{errors.contactUrgenceTelephone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactUrgenceMobile}
                    onChange={(e) =>
                      setFormData({ ...formData, contactUrgenceMobile: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Formation académique</h3>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Les renseignements des formations doivent être faits par ordre chronologique ; toujours du plus ancien (Formation 1) au plus récent.
                </p>
              </div>
              {errors.formations && (
                <p className="text-sm text-red-500 mt-2">{errors.formations}</p>
              )}
              {errors.formationsChronology && (
                <p className="text-sm text-red-500 mt-2">{errors.formationsChronology}</p>
              )}
            </div>

            {formations.map((formation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Formation {index + 1}
                  </span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setFormations((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Date début <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={formation.dateDebut}
                      onChange={(e) => updateFormation(index, "dateDebut", e.target.value)}
                      className={hasError(`formation_${index}_dateDebut`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Date fin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={formation.dateFin}
                      onChange={(e) => updateFormation(index, "dateFin", e.target.value)}
                      className={hasError(`formation_${index}_dateFin`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Université / Institution <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nom de l'université ou institution"
                      value={formation.universite}
                      onChange={(e) => updateFormation(index, "universite", e.target.value)}
                      className={hasError(`formation_${index}_universite`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Cours / Spécialité <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Génie industriel"
                      value={formation.coursSpecialite}
                      onChange={(e) => updateFormation(index, "coursSpecialite", e.target.value)}
                      className={hasError(`formation_${index}_coursSpecialite`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Diplôme <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formation.diplome}
                      onValueChange={(value) => updateFormation(index, "diplome", value)}
                    >
                      <SelectTrigger
                        className={cn("bg-white", hasError(`formation_${index}_diplome`) && "border-red-500")}
                      >
                        <SelectValue placeholder="Sélectionnez le diplôme" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {diplomes.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
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
              onClick={() =>
                setFormations((prev) => [
                  ...prev,
                  { dateDebut: "", dateFin: "", universite: "", coursSpecialite: "", diplome: "" },
                ])
              }
            >
              <Plus className="w-4 h-4" /> Ajouter une autre formation académique
            </Button>

            {renderFileUpload("step3", "Fichiers justificatifs (diplômes, relevés de notes...)")}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Autres Formations</h3>
              <p className="text-sm text-slate-500 mt-1">
                Formations complémentaires, certifications professionnelles, etc.
              </p>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Les renseignements des formations doivent être faits par ordre chronologique ; toujours du plus ancien (Formation 1) au plus récent.
                </p>
              </div>
              {errors.autresFormationsChronology && (
                <p className="text-sm text-red-500 mt-2">{errors.autresFormationsChronology}</p>
              )}
            </div>

            {autresFormations.map((formation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Formation {index + 1}
                  </span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setAutresFormations((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Date début <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={formation.dateDebut}
                      onChange={(e) => updateAutreFormation(index, "dateDebut", e.target.value)}
                      className={
                        hasError(`autreFormation_${index}_dateDebut`) ? "border-red-500" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Date fin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={formation.dateFin}
                      onChange={(e) => updateAutreFormation(index, "dateFin", e.target.value)}
                      className={
                        hasError(`autreFormation_${index}_dateFin`) ? "border-red-500" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Institution / Organisme <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nom de l'institution ou organisme"
                      value={formation.universite}
                      onChange={(e) => updateAutreFormation(index, "universite", e.target.value)}
                      className={
                        hasError(`autreFormation_${index}_universite`) ? "border-red-500" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Cours / Spécialité <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: ISO 9001 Lead Auditor"
                      value={formation.coursSpecialite}
                      onChange={(e) =>
                        updateAutreFormation(index, "coursSpecialite", e.target.value)
                      }
                      className={
                        hasError(`autreFormation_${index}_coursSpecialite`) ? "border-red-500" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Certificat / Diplôme <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formation.diplome}
                      onValueChange={(value) => updateAutreFormation(index, "diplome", value)}
                    >
                      <SelectTrigger
                        className={cn(
                          "bg-white",
                          hasError(`autreFormation_${index}_diplome`) && "border-red-500"
                        )}
                      >
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {diplomes.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
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
              onClick={() =>
                setAutresFormations((prev) => [
                  ...prev,
                  { dateDebut: "", dateFin: "", universite: "", coursSpecialite: "", diplome: "" },
                ])
              }
            >
              <Plus className="w-4 h-4" /> Ajouter une autre formation
            </Button>

            {renderFileUpload("step4", "Fichiers justificatifs (certificats, attestations...)")}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Expérience professionnelle</h3>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Les renseignements doivent être faits par ordre chronologique ; toujours du plus ancien (Expérience 1) au plus récent.
                </p>
              </div>
              {errors.experiences && (
                <p className="text-sm text-red-500 mt-2">{errors.experiences}</p>
              )}
              {errors.experiencesChronology && (
                <p className="text-sm text-red-500 mt-2">{errors.experiencesChronology}</p>
              )}
            </div>

            {experiences.map((exp, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Expérience {index + 1}
                  </span>
                  {index >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setExperiences((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Date début (mois/année) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={exp.dateDebut}
                      onChange={(e) => updateExperience(index, "dateDebut", e.target.value)}
                      className={hasError(`exp_${index}_dateDebut`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Date fin (mois/année) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={exp.dateFin}
                      onChange={(e) => updateExperience(index, "dateFin", e.target.value)}
                      className={hasError(`exp_${index}_dateFin`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Organisme <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nom de l'organisme"
                      value={exp.organisme}
                      onChange={(e) => updateExperience(index, "organisme", e.target.value)}
                      className={hasError(`exp_${index}_organisme`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Poste occupé <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Responsable qualité"
                      value={exp.posteOccupe}
                      onChange={(e) => updateExperience(index, "posteOccupe", e.target.value)}
                      className={hasError(`exp_${index}_posteOccupe`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Domaine de compétence <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Management de la qualité"
                      value={exp.domaineCompetence}
                      onChange={(e) => updateExperience(index, "domaineCompetence", e.target.value)}
                      className={hasError(`exp_${index}_domaine`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Sous-domaine <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Agroalimentaire, Pharmaceutique..."
                      value={exp.sousDomaineCompetence}
                      onChange={(e) =>
                        updateExperience(index, "sousDomaineCompetence", e.target.value)
                      }
                      className={hasError(`exp_${index}_sousDomaine`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Tâches principales <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="Décrivez les activités principales..."
                      rows={2}
                      value={exp.activitesPrincipales}
                      onChange={(e) =>
                        updateExperience(index, "activitesPrincipales", e.target.value)
                      }
                      className={hasError(`exp_${index}_activites`) ? "border-red-500" : ""}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
              onClick={() =>
                setExperiences((prev) => [
                  ...prev,
                  {
                    dateDebut: "",
                    dateFin: "",
                    organisme: "",
                    posteOccupe: "",
                    activitesPrincipales: "",
                    domaineCompetence: "",
                    sousDomaineCompetence: "",
                  },
                ])
              }
            >
              <Plus className="w-4 h-4" /> Ajouter une autre expérience
            </Button>

            {renderFileUpload("step5", "Fichiers justificatifs (attestations de travail, contrats...)")}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Évaluations / Audits</h3>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <p className="font-medium text-blue-800">
                Avez-vous déjà réalisé une évaluation ou un audit ?
              </p>
              {errors.hasEvaluations && (
                <p className="text-xs text-red-500">{errors.hasEvaluations}</p>
              )}
              <RadioGroup
                value={hasEvaluations === null ? "" : hasEvaluations ? "oui" : "non"}
                onValueChange={(val) => setHasEvaluations(val === "oui")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oui" id="eval-oui" />
                  <Label htmlFor="eval-oui" className="cursor-pointer">
                    Oui
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="eval-non" />
                  <Label htmlFor="eval-non" className="cursor-pointer">
                    Non
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {hasEvaluations && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    Les renseignements doivent être faits par ordre chronologique (du plus ancien au plus récent).
                  </p>
                </div>
                {errors.evaluations && (
                  <p className="text-sm text-red-500">{errors.evaluations}</p>
                )}
                {errors.evaluationsChronology && (
                  <p className="text-sm text-red-500">{errors.evaluationsChronology}</p>
                )}

                {evaluations.map((evalItem, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-4 bg-slate-50 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Évaluation / Audit {index + 1}
                      </span>
                      {index >= 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            setEvaluations((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={evalItem.type}
                          onValueChange={(value) => updateEvaluation(index, "type", value)}
                        >
                          <SelectTrigger
                            className={cn(
                              "bg-white",
                              hasError(`eval_${index}_type`) && "border-red-500"
                            )}
                          >
                            <SelectValue placeholder="Évaluation ou Audit ?" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="evaluation">Évaluation</SelectItem>
                            <SelectItem value="audit">Audit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Date début <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="month"
                          value={evalItem.dateDebut}
                          onChange={(e) => updateEvaluation(index, "dateDebut", e.target.value)}
                          className={hasError(`eval_${index}_dateDebut`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Date fin <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="month"
                          value={evalItem.dateFin}
                          onChange={(e) => updateEvaluation(index, "dateFin", e.target.value)}
                          className={hasError(`eval_${index}_dateFin`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Type d&apos;évaluation ou d&apos;audit <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: Audit de certification ISO 9001"
                          value={evalItem.typeEvaluation}
                          onChange={(e) =>
                            updateEvaluation(index, "typeEvaluation", e.target.value)
                          }
                          className={
                            hasError(`eval_${index}_typeEvaluation`) ? "border-red-500" : ""
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rôle tenu dans l&apos;équipe <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: Auditeur principal"
                          value={evalItem.roleTenu}
                          onChange={(e) => updateEvaluation(index, "roleTenu", e.target.value)}
                          className={hasError(`eval_${index}_roleTenu`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Normes utilisées comme référentiels <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: ISO 9001:2015, ISO 19011"
                          value={evalItem.normesReferentiels}
                          onChange={(e) =>
                            updateEvaluation(index, "normesReferentiels", e.target.value)
                          }
                          className={hasError(`eval_${index}_normes`) ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
                  onClick={() =>
                    setEvaluations((prev) => [
                      ...prev,
                      {
                        dateDebut: "",
                        dateFin: "",
                        type: "",
                        typeEvaluation: "",
                        roleTenu: "",
                        normesReferentiels: "",
                      },
                    ])
                  }
                >
                  <Plus className="w-4 h-4" /> Ajouter une autre évaluation / audit
                </Button>

                {renderFileUpload("step6", "Fichiers justificatifs (rapports d'audit, attestations...)")}
              </>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Formations dispensées</h3>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <p className="font-medium text-blue-800">
                Avez-vous déjà dispensé une formation en tant que formateur ?
              </p>
              {errors.hasFormationsDispensees && (
                <p className="text-xs text-red-500">{errors.hasFormationsDispensees}</p>
              )}
              <RadioGroup
                value={
                  hasFormationsDispensees === null
                    ? ""
                    : hasFormationsDispensees
                      ? "oui"
                      : "non"
                }
                onValueChange={(val) => setHasFormationsDispensees(val === "oui")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oui" id="fd-oui" />
                  <Label htmlFor="fd-oui" className="cursor-pointer">
                    Oui
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="fd-non" />
                  <Label htmlFor="fd-non" className="cursor-pointer">
                    Non
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {hasFormationsDispensees && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    Les renseignements doivent être faits par ordre chronologique (du plus ancien au plus récent).
                  </p>
                </div>
                {errors.formationsDispensees && (
                  <p className="text-sm text-red-500">{errors.formationsDispensees}</p>
                )}
                {errors.fdChronology && (
                  <p className="text-sm text-red-500">{errors.fdChronology}</p>
                )}

                {formationsDispensees.map((fd, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-4 bg-slate-50 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Formation dispensée {index + 1}
                      </span>
                      {index >= 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            setFormationsDispensees((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Date début <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="month"
                          value={fd.dateDebut}
                          onChange={(e) =>
                            updateFormationDispensee(index, "dateDebut", e.target.value)
                          }
                          className={hasError(`fd_${index}_dateDebut`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Date fin <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="month"
                          value={fd.dateFin}
                          onChange={(e) =>
                            updateFormationDispensee(index, "dateFin", e.target.value)
                          }
                          className={hasError(`fd_${index}_dateFin`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Durée <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: 5 jours, 3 mois..."
                          value={fd.duree}
                          onChange={(e) =>
                            updateFormationDispensee(index, "duree", e.target.value)
                          }
                          className={hasError(`fd_${index}_duree`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Organisme bénéficiaire <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Nom de l'organisme bénéficiaire"
                          value={fd.organismeBeneficiaire}
                          onChange={(e) =>
                            updateFormationDispensee(index, "organismeBeneficiaire", e.target.value)
                          }
                          className={hasError(`fd_${index}_organisme`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Intitulé de la formation <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Intitulé de la formation dispensée"
                          value={fd.formation}
                          onChange={(e) =>
                            updateFormationDispensee(index, "formation", e.target.value)
                          }
                          className={hasError(`fd_${index}_formation`) ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-dashed border-2 text-slate-600 hover:text-[#00A63E] hover:border-[#00A63E]"
                  onClick={() =>
                    setFormationsDispensees((prev) => [
                      ...prev,
                      {
                        dateDebut: "",
                        dateFin: "",
                        duree: "",
                        formation: "",
                        organismeBeneficiaire: "",
                      },
                    ])
                  }
                >
                  <Plus className="w-4 h-4" /> Ajouter une autre formation dispensée
                </Button>

                {renderFileUpload("step7", "Fichiers justificatifs (supports de formation, attestations...)")}
              </>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">
                Connaissance linguistique <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Indiquez vos compétences linguistiques. Au moins une langue est requise.
              </p>
              {errors.langues && <p className="text-sm text-red-500 mt-2">{errors.langues}</p>}
            </div>

            {langues.map((langue, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Langue {index + 1}
                  </span>
                  {langues.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setLangues((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Langue <span className="text-red-500">*</span></Label>
                    <Select
                      value={langue.langue}
                      onValueChange={(value) => updateLangue(index, "langue", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {languesListe.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {langue.langue === "Autre" && (
                      <Input
                        placeholder="Indiquez la langue"
                        value={langue.langueAutre}
                        onChange={(e) => updateLangue(index, "langueAutre", e.target.value)}
                        className={cn("mt-1", hasError(`langue_${index}_autre`) && "border-red-500")}
                      />
                    )}
                    {errors[`langue_${index}_autre`] && (
                      <p className="text-xs text-red-500">{errors[`langue_${index}_autre`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Lu</Label>
                    <Select
                      value={langue.lu}
                      onValueChange={(value) => updateLangue(index, "lu", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Parlé</Label>
                    <Select
                      value={langue.parle}
                      onValueChange={(value) => updateLangue(index, "parle", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Écrit</Label>
                    <Select
                      value={langue.ecrit}
                      onValueChange={(value) => updateLangue(index, "ecrit", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {niveauxLangue.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
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
              onClick={() =>
                setLangues((prev) => [
                  ...prev,
                  { langue: "", langueAutre: "", lu: "", parle: "", ecrit: "" },
                ])
              }
            >
              <Plus className="w-4 h-4" /> Ajouter une autre langue
            </Button>

            {renderFileUpload("step8", "Fichiers justificatifs (certificats de langue...)")}
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Informations complémentaires</Label>
              <Textarea
                placeholder="Toute information pertinente pour votre candidature..."
                rows={4}
                value={formData.informationsComplementaires}
                onChange={(e) =>
                  setFormData({ ...formData, informationsComplementaires: e.target.value })
                }
              />
            </div>

            {renderFileUpload("step9", "Autres fichiers complémentaires (CV, lettres de recommandation...)")}

            <div className="pt-6 space-y-4 border-t">
              <h3 className="font-semibold text-lg">Engagements</h3>
              <div className="flex flex-col gap-3">
                {/* Consent OEC data sharing */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <p className="text-sm font-medium text-blue-800">
                    Si un Organisme d&apos;Évaluation de la Conformité (OEC) a besoin d&apos;informations de votre profil, consentez-vous à ce que nous partagions vos données ? <span className="text-red-500">*</span>
                  </p>
                  <RadioGroup
                    value={consent3Type}
                    onValueChange={(val) => {
                      setConsent3Type(val);
                      if (val !== "partial") setConsent3Details("");
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="consent3-full" />
                      <Label htmlFor="consent3-full" className="cursor-pointer text-sm">
                        Oui, tout le CV peut être partagé
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="consent3-partial" />
                      <Label htmlFor="consent3-partial" className="cursor-pointer text-sm">
                        Oui, mais seulement certaines informations
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="consent3-none" />
                      <Label htmlFor="consent3-none" className="cursor-pointer text-sm">
                        Non, aucune information ne doit être partagée
                      </Label>
                    </div>
                  </RadioGroup>
                  {consent3Type === "partial" && (
                    <div className="mt-2">
                      <Label className="text-sm">
                        Précisez les informations que vous autorisez à partager :
                      </Label>
                      <Textarea
                        placeholder="Ex: Nom, domaine d'expertise, expériences professionnelles..."
                        rows={2}
                        value={consent3Details}
                        onChange={(e) => setConsent3Details(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <Checkbox
                    id="consent1"
                    checked={consent1}
                    onCheckedChange={(checked) => setConsent1(checked === true)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="consent1"
                    className="text-sm leading-relaxed font-medium cursor-pointer"
                  >
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
                  <Label
                    htmlFor="consent2"
                    className="text-sm leading-relaxed font-medium cursor-pointer"
                  >
                    Je consens à ce que mes données personnelles soient collectées et traitées
                    conformément à la{" "}
                    <a
                      href="https://algerac.dz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A63E] underline hover:text-[#008f35]"
                    >
                      loi n° X
                    </a>{" "}
                    relative à la protection des personnes physiques à l&apos;égard du traitement des
                    données à caractère personnel.{" "}
                    <span className="text-red-500">*</span>
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logoalgerac.png" alt="ALGERAC" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#00A63E" }}>
                ALGERAC
              </h1>
              <p className="text-sm text-slate-600">
                Inscription Expert / Évaluateur / Formateur
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register">
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Link>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                Étape {currentStep} sur {STEPS.length}
              </h2>
              <p className="text-sm text-slate-600">{STEPS[currentStep - 1].title}</p>
            </div>
            <span className="text-sm font-medium text-slate-500">
              {Math.round((currentStep / STEPS.length) * 100)}% complété
            </span>
          </div>

          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00A63E] to-[#00D44A] transition-all duration-500"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center transition-all",
                  step.id <= currentStep ? "opacity-100" : "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step.id < currentStep
                      ? "bg-[#00A63E] text-white"
                      : step.id === currentStep
                        ? "bg-[#00A63E] text-white ring-4 ring-[#00A63E]/20"
                        : "bg-slate-200 text-slate-400"
                  )}
                >
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
                <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="gap-2 ml-auto"
                  style={{ backgroundColor: "#00A63E" }}
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !consent1 || !consent2 || !consent3Type}
                  className="ml-auto"
                  style={{ backgroundColor: "#00A63E" }}
                >
                  {loading ? "Envoi en cours..." : "Soumettre ma candidature"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Blacklist Appeal Dialog */}
    <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="w-5 h-5" />
            Inscription impossible
          </DialogTitle>
          <DialogDescription>
            Votre adresse email est associée à un compte qui a fait l'objet d'une décision de blocage.
            Si vous estimez que cette décision est injustifiée, vous pouvez introduire un recours.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            En introduisant un recours, votre demande sera examinée par le service compétent.
            Vous recevrez une réponse par email dans les meilleurs délais.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>
            Fermer
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={appealLoading}
            onClick={async () => {
              setAppealLoading(true);
              try {
                const response = await fetch("/api/auth/appeal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: formData.email,
                    message: `Recours introduit par ${formData.prenom} ${formData.nom} (${formData.email}) - Type: ${formData.userType}`
                  }),
                });
                if (response.ok) {
                  setShowBlacklistDialog(false);
                  toast({
                    title: "Recours enregistré",
                    description: "Votre recours a bien été pris en compte. Vous recevrez une réponse par email dans les meilleurs délais.",
                  });
                } else {
                  const err = await response.json();
                  toast({
                    title: "Erreur",
                    description: err.error || "Impossible de soumettre le recours",
                    variant: "destructive",
                  });
                }
              } catch {
                toast({
                  title: "Erreur",
                  description: "Une erreur est survenue lors de l'envoi du recours",
                  variant: "destructive",
                });
              } finally {
                setAppealLoading(false);
              }
            }}
          >
            {appealLoading ? "Envoi en cours..." : "Introduire un recours"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
