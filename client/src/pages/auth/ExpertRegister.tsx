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
import { useTranslation } from "react-i18next";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const NATIONALITY_KEYS = [
  "algerian", "french", "moroccan", "tunisian", "libyan", "egyptian",
  "mauritanian", "senegalese", "malian", "nigerien", "chadian", "sudanese", "other"
];

const FAMILY_STATUS_KEYS = ["single", "married", "divorced", "widowed"];

const DIPLOMA_KEYS = [
  "baccalaureat", "bts_dut", "licence_lmd", "licence_classique",
  "master1", "master2", "ingenieur", "magister",
  "doctorat", "doctorat_etat", "habilitation",
  "certificat_pro", "dts", "other"
];

const LANGUAGE_KEYS = [
  "arabic", "french", "english", "spanish", "german", "italian",
  "portuguese", "russian", "chinese", "japanese", "turkish", "other"
];

const LEVEL_KEYS = ["basic", "fairlyGood", "good", "veryGood", "excellent"];



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

const WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane",
  "49 - El M'Ghair", "50 - El Meniaa", "51 - Ouled Djellal", "52 - Bordj Badji Mokhtar",
  "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

export default function ExpertRegisterWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);

  const STEPS = [
    { id: 1, title: t("er.steps.step1") },
    { id: 2, title: t("er.steps.step2") },
    { id: 3, title: t("er.steps.step3") },
    { id: 4, title: t("er.steps.step4") },
    { id: 5, title: t("er.steps.step5") },
    { id: 6, title: t("er.steps.step6") },
    { id: 7, title: t("er.steps.step7") },
    { id: 8, title: t("er.steps.step8") },
    { id: 9, title: t("er.steps.step9") },
  ];

  const userTypes = [
    { value: "EXPERT", label: t("er.userTypes.expert") },
    { value: "EVALUATEUR", label: t("er.userTypes.evaluateur") },
    { value: "FORMATEUR", label: t("er.userTypes.formateur") },
  ];

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [stepFiles, setStepFiles] = useState<StepFiles>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  // Step 6 & 7 gate toggles
  const [hasEvaluations, setHasEvaluations] = useState<boolean | null>(null);
  const [hasFormationsDispensees, setHasFormationsDispensees] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    userType: "EXPERT",
    nom: "",
    prenom: "",
    dateNaissance: "",
    nationalite: "",
    nationaliteAutre: "",
    situationFamiliale: "",
    email: "",
    telephone: "",
    telephoneMobile: "",
    fax: "",
    adresseDomicile: "",
    adresseEntreprise: "",
    wilaya: "",
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
        {t("er.fileUpload.hint")}
      </p>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 bg-white"
          onClick={() => document.getElementById(`file-${stepKey}`)?.click()}
        >
          <FileText className="w-4 h-4" /> {t("er.fileUpload.addFile")}
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
      setErrors((prev) => ({ ...prev, email: t("er.errors.emailInvalid") }));
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

  const validateAge = (dateNaissance: string): boolean => {
    if (!dateNaissance) return false;
    const d = new Date(dateNaissance + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const nextStep = () => {
    const newErrors: ValidationErrors = {};

    if (currentStep === 1) {
      if (!formData.nom) newErrors.nom = t("er.errors.nomRequired");
      if (!formData.prenom) newErrors.prenom = t("er.errors.prenomRequired");
      if (!formData.dateNaissance) newErrors.dateNaissance = t("er.errors.dateNaissanceRequired");
      else if (!validateAge(formData.dateNaissance))
        newErrors.dateNaissance = t("er.errors.ageMinimum");
      if (!formData.nationalite) newErrors.nationalite = t("er.errors.nationaliteRequired");
      if (formData.nationalite === "other" && !formData.nationaliteAutre)
        newErrors.nationaliteAutre = t("er.errors.nationaliteAutreRequired");
      if (!formData.situationFamiliale)
        newErrors.situationFamiliale = t("er.errors.situationRequired");
      if (!photoBase64) newErrors.photo = t("er.errors.photoRequired");
    }

    if (currentStep === 2) {
      if (!formData.email) newErrors.email = t("er.errors.emailRequired");
      if (!formData.telephone) newErrors.telephone = t("er.errors.telephoneRequired");
      if (!formData.telephoneMobile) newErrors.telephoneMobile = t("er.errors.mobileRequired");
      if (!formData.contactUrgenceNom) newErrors.contactUrgenceNom = t("er.errors.urgenceNomRequired");
      if (!formData.contactUrgenceTelephone) newErrors.contactUrgenceTelephone = t("er.errors.urgenceTelRequired");
      // At least one address required
      if (!formData.adresseDomicile && !formData.adresseEntreprise) {
        newErrors.adresseDomicile = t("er.errors.addressRequired");
        newErrors.adresseEntreprise = t("er.errors.addressRequired");
      }
      if (!formData.wilaya) newErrors.wilaya = t("er.errors.wilayaRequired");
    }

    if (currentStep === 3) {
      const filledFormations = formations.filter(
        (f) => f.dateDebut || f.dateFin || f.universite || f.coursSpecialite || f.diplome
      );
      if (filledFormations.length === 0) {
        newErrors.formations = t("er.errors.formationRequired");
      } else {
        for (let i = 0; i < filledFormations.length; i++) {
          const f = filledFormations[i];
          if (!f.dateDebut) newErrors[`formation_${i}_dateDebut`] = t("er.errors.dateDebutRequired");
          if (!f.dateFin) newErrors[`formation_${i}_dateFin`] = t("er.errors.dateFinRequired");
          if (!f.universite) newErrors[`formation_${i}_universite`] = t("er.errors.universiteRequired");
          if (!f.coursSpecialite) newErrors[`formation_${i}_coursSpecialite`] = t("er.errors.specialiteRequired");
          if (!f.diplome) newErrors[`formation_${i}_diplome`] = t("er.errors.diplomeRequired");
        }
      }
      const chronErr = validateChronologicalOrder(formations.filter((f) => f.dateDebut), t("er.labels.formation"));
      if (chronErr) newErrors.formationsChronology = chronErr;
    }

    if (currentStep === 4) {
      const filledAutres = autresFormations.filter(
        (f) => f.dateDebut || f.dateFin || f.universite || f.coursSpecialite || f.diplome
      );
      for (let i = 0; i < filledAutres.length; i++) {
        const f = filledAutres[i];
        if (!f.dateDebut) newErrors[`autreFormation_${i}_dateDebut`] = t("er.errors.dateDebutRequired");
        if (!f.dateFin) newErrors[`autreFormation_${i}_dateFin`] = t("er.errors.dateFinRequired");
        if (!f.universite) newErrors[`autreFormation_${i}_universite`] = t("er.errors.institutionRequired");
        if (!f.coursSpecialite) newErrors[`autreFormation_${i}_coursSpecialite`] = t("er.errors.coursRequired");
        if (!f.diplome) newErrors[`autreFormation_${i}_diplome`] = t("er.errors.certificatRequired");
      }
      const chronErr = validateChronologicalOrder(
        autresFormations.filter((f) => f.dateDebut),
        t("er.labels.formation")
      );
      if (chronErr) newErrors.autresFormationsChronology = chronErr;
    }

    if (currentStep === 5) {
      const filledExps = experiences.filter(
        (e) => e.dateDebut || e.dateFin || e.organisme || e.posteOccupe
      );
      if (filledExps.length === 0) {
        newErrors.experiences = t("er.errors.experienceRequired");
      } else {
        for (let i = 0; i < filledExps.length; i++) {
          const e = filledExps[i];
          if (!e.dateDebut) newErrors[`exp_${i}_dateDebut`] = t("er.errors.dateDebutRequired");
          if (!e.dateFin) newErrors[`exp_${i}_dateFin`] = t("er.errors.dateFinRequired");
          if (!e.organisme) newErrors[`exp_${i}_organisme`] = t("er.errors.organismeRequired");
          if (!e.posteOccupe) newErrors[`exp_${i}_posteOccupe`] = t("er.errors.posteRequired");
          if (!e.activitesPrincipales) newErrors[`exp_${i}_activites`] = t("er.errors.activitesRequired");
          if (!e.domaineCompetence) newErrors[`exp_${i}_domaine`] = t("er.errors.domaineRequired");
          if (!e.sousDomaineCompetence) newErrors[`exp_${i}_sousDomaine`] = t("er.errors.sousDomaineRequired");
        }
      }
      const chronErr = validateChronologicalOrder(
        experiences.filter((e) => e.dateDebut),
        t("er.labels.experience")
      );
      if (chronErr) newErrors.experiencesChronology = chronErr;
    }

    if (currentStep === 6) {
      if (hasEvaluations === null) {
        newErrors.hasEvaluations = t("er.errors.answerRequired");
      }
      if (hasEvaluations) {
        const filledEvals = evaluations.filter(
          (e) => e.dateDebut || e.typeEvaluation || e.roleTenu
        );
        if (filledEvals.length === 0) {
          newErrors.evaluations = t("er.errors.evaluationRequired");
        } else {
          for (let i = 0; i < filledEvals.length; i++) {
            const e = filledEvals[i];
            if (!e.type) newErrors[`eval_${i}_type`] = t("er.errors.typeRequired");
            if (!e.dateDebut) newErrors[`eval_${i}_dateDebut`] = t("er.errors.dateDebutRequired");
            if (!e.dateFin) newErrors[`eval_${i}_dateFin`] = t("er.errors.dateFinRequired");
            if (!e.typeEvaluation) newErrors[`eval_${i}_typeEvaluation`] = t("er.errors.descriptionRequired");
            if (!e.roleTenu) newErrors[`eval_${i}_roleTenu`] = t("er.errors.roleRequired");
            if (!e.normesReferentiels) newErrors[`eval_${i}_normes`] = t("er.errors.normesRequired");
          }
        }
        const chronErr = validateChronologicalOrder(
          evaluations.filter((e) => e.dateDebut),
          t("er.labels.evaluationAudit")
        );
        if (chronErr) newErrors.evaluationsChronology = chronErr;
      }
    }

    if (currentStep === 7) {
      if (hasFormationsDispensees === null) {
        newErrors.hasFormationsDispensees = t("er.errors.answerRequired");
      }
      if (hasFormationsDispensees) {
        const filledFD = formationsDispensees.filter(
          (f) => f.dateDebut || f.formation
        );
        if (filledFD.length === 0) {
          newErrors.formationsDispensees = t("er.errors.formationDispenseeRequired");
        } else {
          for (let i = 0; i < filledFD.length; i++) {
            const f = filledFD[i];
            if (!f.dateDebut) newErrors[`fd_${i}_dateDebut`] = t("er.errors.dateDebutRequired");
            if (!f.dateFin) newErrors[`fd_${i}_dateFin`] = t("er.errors.dateFinRequired");
            if (!f.duree) newErrors[`fd_${i}_duree`] = t("er.errors.dureeRequired");
            if (!f.formation) newErrors[`fd_${i}_formation`] = t("er.errors.intituleRequired");
            if (!f.organismeBeneficiaire) newErrors[`fd_${i}_organisme`] = t("er.errors.organismeBenRequired");
          }
        }
        const chronErr = validateChronologicalOrder(
          formationsDispensees.filter((f) => f.dateDebut),
          t("er.labels.formationDispensee")
        );
        if (chronErr) newErrors.fdChronology = chronErr;
      }
    }

    if (currentStep === 8) {
      const hasValidLangue = langues.some((l) => {
        const langueVal = l.langue === "other" ? l.langueAutre : l.langue;
        return langueVal && l.lu && l.parle && l.ecrit;
      });
      if (!hasValidLangue) {
        newErrors.langues = t("er.errors.langueRequired");
      }
      for (let i = 0; i < langues.length; i++) {
        if (langues[i].langue === "other" && !langues[i].langueAutre) {
          newErrors[`langue_${i}_autre`] = t("er.errors.langueAutreRequired");
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
      setApiError(t("er.errors.consentsRequired"));
      return;
    }
    if (!formData.nom || !formData.prenom || !formData.email) {
      setApiError(t("er.errors.fillRequired"));
      return;
    }

    if (!photoBase64) {
      setApiError(t("er.errors.photoRequired"));
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

      const nationaliteFinal = formData.nationalite === "other" ? formData.nationaliteAutre : formData.nationalite;

      const payload = {
        userType: formData.userType,
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.dateNaissance || "",
        nationalite: nationaliteFinal,
        situationFamiliale: formData.situationFamiliale,
        email: formData.email,
        telephone: formData.telephone,
        telephoneMobile: formData.telephoneMobile,
        fax: formData.fax,
        adresseDomicile: formData.adresseDomicile,
        wilaya: formData.wilaya,
        adresseEntreprise: formData.adresseEntreprise,
        contactUrgenceNom: formData.contactUrgenceNom,
        contactUrgenceTelephone: formData.contactUrgenceTelephone,
        contactUrgenceMobile: formData.contactUrgenceMobile,
        informationsComplementaires: formData.informationsComplementaires,
        domaineExpertise: "",
        sousDomaineExpertise: "",
        photoBase64: photoBase64,
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
            langue: l.langue === "other" ? l.langueAutre : l.langue,
            niveauLu: l.lu,
            niveauParle: l.parle,
            niveauEcrit: l.ecrit,
          })),
      };

      const response = await fetch("/api/auth/signup/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || errorData.error || t("er.errors.registrationError");
        // Check for blacklist error
        if (errorMsg.startsWith("BLACKLISTED:")) {
          setShowBlacklistDialog(true);
          return;
        }
        throw new Error(errorMsg);
      }

      setLocation("/auth/success?type=expert");
    } catch (err) {
      let msg = t("er.errors.genericError");
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
                {t("er.labels.candidatureType")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t("er.placeholders.selectType")} />
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
                  {t("er.labels.nom")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={t("er.placeholders.nom")}
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("er.labels.prenom")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={t("er.placeholders.prenom")}
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={errors.prenom ? "border-red-500" : ""}
                />
                {errors.prenom && <p className="text-xs text-red-500">{errors.prenom}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("er.labels.dateNaissance")} <span className="text-red-500">*</span>
                </Label>
                <StringDatePicker
                  value={formData.dateNaissance}
                  onChange={(v) => setFormData((prev) => ({ ...prev, dateNaissance: v }))}
                  placeholder={t("er.labels.dateNaissance")}
                  className={cn(errors.dateNaissance && "border-red-500")}
                />
                {errors.dateNaissance && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.dateNaissance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("er.labels.nationalite")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.nationalite}
                  onValueChange={(value) => setFormData({ ...formData, nationalite: value })}
                >
                  <SelectTrigger className={cn("bg-white", errors.nationalite && "border-red-500")}>
                    <SelectValue placeholder={t("er.placeholders.select")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {NATIONALITY_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`er.nationalities.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationalite && <p className="text-xs text-red-500">{errors.nationalite}</p>}
                {formData.nationalite === "other" && (
                  <div className="mt-2">
                    <Input
                      placeholder={t("er.placeholders.nationaliteAutre")}
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
                  {t("er.labels.situationFamiliale")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.situationFamiliale}
                  onValueChange={(value) => setFormData({ ...formData, situationFamiliale: value })}
                >
                  <SelectTrigger className={cn("bg-white", errors.situationFamiliale && "border-red-500")}>
                    <SelectValue placeholder={t("er.placeholders.select")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {FAMILY_STATUS_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`er.familyStatus.${key}`)}
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
                  {t("er.labels.photo")} <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("gap-2 bg-white", errors.photo && "border-red-500")}
                    onClick={() => document.getElementById("photo-file")?.click()}
                  >
                    <FileText className="w-4 h-4" /> {t("er.labels.choosePhoto")}
                  </Button>
                  <input
                    type="file"
                    id="photo-file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <span className="text-xs text-slate-400 italic">
                    {photo ? photo.name : t("er.labels.noFileSelected")}
                  </span>
                </div>
                {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
              </div>
            </div>

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>
                  {t("er.labels.email")} <span className="text-red-500">*</span>
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
                  {t("er.labels.telephone")} <span className="text-red-500">*</span>
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
                  {t("er.labels.mobile")} <span className="text-red-500">*</span>
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
                <Label>{t("er.labels.fax")}</Label>
                <Input
                  placeholder="+213 XXX XXX XXX"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  {t("er.labels.adresseDomicile")}{" "}
                  {!formData.adresseEntreprise && <span className="text-red-500">*</span>}
                </Label>
                <p className="text-xs text-slate-500 mb-1">
                  {t("er.labels.addressHint")}
                </p>
                <Textarea
                  placeholder={t("er.placeholders.adresseComplete")}
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
                  {t("er.labels.adresseEntreprise")}{" "}
                  {!formData.adresseDomicile && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder={t("er.placeholders.adresseComplete")}
                  rows={2}
                  value={formData.adresseEntreprise}
                  onChange={(e) => setFormData({ ...formData, adresseEntreprise: e.target.value })}
                  className={errors.adresseEntreprise ? "border-red-500" : ""}
                />
                {errors.adresseEntreprise && (
                  <p className="text-xs text-red-500">{errors.adresseEntreprise}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  {t("er.labels.wilaya")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.wilaya}
                  onValueChange={(val) => setFormData({ ...formData, wilaya: val })}
                >
                  <SelectTrigger className={errors.wilaya ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("er.placeholders.selectWilaya")} />
                  </SelectTrigger>
                  <SelectContent>
                    {WILAYAS.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.wilaya && (
                  <p className="text-xs text-red-500">{errors.wilaya}</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-orange-800">{t("er.labels.contactUrgence")} <span className="text-red-500">*</span></h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    {t("er.labels.nomComplet")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={t("er.placeholders.contactNom")}
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
                    {t("er.labels.telephone")} <span className="text-red-500">*</span>
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
                  <Label>{t("er.labels.mobile")}</Label>
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
              <h3 className="font-semibold text-lg">{t("er.titles.formationAcademique")}</h3>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  {t("er.labels.chronologicalHint")}
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
                    {t("er.labels.formation")} {index + 1}
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
                      {t("er.labels.dateDebut")} <span className="text-red-500">*</span>
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
                      {t("er.labels.dateFin")} <span className="text-red-500">*</span>
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
                      {t("er.labels.universite")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.universite")}
                      value={formation.universite}
                      onChange={(e) => updateFormation(index, "universite", e.target.value)}
                      className={hasError(`formation_${index}_universite`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("er.labels.coursSpecialite")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.specialite")}
                      value={formation.coursSpecialite}
                      onChange={(e) => updateFormation(index, "coursSpecialite", e.target.value)}
                      className={hasError(`formation_${index}_coursSpecialite`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      {t("er.labels.diplome")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formation.diplome}
                      onValueChange={(value) => updateFormation(index, "diplome", value)}
                    >
                      <SelectTrigger
                        className={cn("bg-white", hasError(`formation_${index}_diplome`) && "border-red-500")}
                      >
                        <SelectValue placeholder={t("er.placeholders.selectDiplome")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {DIPLOMA_KEYS.map((dk) => (
                          <SelectItem key={dk} value={dk}>
                            {t(`er.diplomas.${dk}`)}
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
              <Plus className="w-4 h-4" /> {t("er.buttons.addFormation")}
            </Button>

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">{t("er.titles.autresFormations")}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {t("er.labels.autresFormationsDesc")}
              </p>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  {t("er.labels.chronologicalHint")}
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
                    {t("er.labels.formation")} {index + 1}
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
                      {t("er.labels.dateDebut")} <span className="text-red-500">*</span>
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
                      {t("er.labels.dateFin")} <span className="text-red-500">*</span>
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
                      {t("er.labels.institution")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.institution")}
                      value={formation.universite}
                      onChange={(e) => updateAutreFormation(index, "universite", e.target.value)}
                      className={
                        hasError(`autreFormation_${index}_universite`) ? "border-red-500" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("er.labels.coursSpecialite")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.coursSpecialite")}
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
                      {t("er.labels.certificat")} <span className="text-red-500">*</span>
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
                        <SelectValue placeholder={t("er.placeholders.select")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {DIPLOMA_KEYS.map((dk) => (
                          <SelectItem key={dk} value={dk}>
                            {t(`er.diplomas.${dk}`)}
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

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">{t("er.titles.experiencePro")}</h3>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  {t("er.labels.chronologicalHint")}
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
                    {t("er.labels.experience")} {index + 1}
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
                      {t("er.labels.dateDebutMonthYear")} <span className="text-red-500">*</span>
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
                      {t("er.labels.dateFinMonthYear")} <span className="text-red-500">*</span>
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
                      {t("er.labels.organisme")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.organisme")}
                      value={exp.organisme}
                      onChange={(e) => updateExperience(index, "organisme", e.target.value)}
                      className={hasError(`exp_${index}_organisme`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("er.labels.posteOccupe")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.poste")}
                      value={exp.posteOccupe}
                      onChange={(e) => updateExperience(index, "posteOccupe", e.target.value)}
                      className={hasError(`exp_${index}_posteOccupe`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("er.labels.domaineCompetence")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.domaine")}
                      value={exp.domaineCompetence}
                      onChange={(e) => updateExperience(index, "domaineCompetence", e.target.value)}
                      className={hasError(`exp_${index}_domaine`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("er.labels.sousDomaine")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("er.placeholders.sousDomaine")}
                      value={exp.sousDomaineCompetence}
                      onChange={(e) =>
                        updateExperience(index, "sousDomaineCompetence", e.target.value)
                      }
                      className={hasError(`exp_${index}_sousDomaine`) ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      {t("er.labels.tachesPrincipales")} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder={t("er.placeholders.taches")}
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
              <Plus className="w-4 h-4" /> {t("er.buttons.addExperience")}
            </Button>

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">{t("er.titles.evaluationsAudits")}</h3>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <p className="font-medium text-blue-800">
                {t("er.labels.hasEvaluationsQuestion")}
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
                    {t("er.labels.yes")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="eval-non" />
                  <Label htmlFor="eval-non" className="cursor-pointer">
                    {t("er.labels.no")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {hasEvaluations && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    {t("er.labels.chronologicalHint")}
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
                        {t("er.labels.evaluationAudit")} {index + 1}
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
                            <SelectValue placeholder={t("er.placeholders.evalOrAudit")} />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="evaluation">{t("er.labels.evaluation")}</SelectItem>
                            <SelectItem value="audit">{t("er.labels.audit")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t("er.labels.dateDebut")} <span className="text-red-500">*</span>
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
                          {t("er.labels.dateFin")} <span className="text-red-500">*</span>
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
                          {t("er.labels.typeEvaluation")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.typeEvaluation")}
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
                          {t("er.labels.roleTenu")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.roleTenu")}
                          value={evalItem.roleTenu}
                          onChange={(e) => updateEvaluation(index, "roleTenu", e.target.value)}
                          className={hasError(`eval_${index}_roleTenu`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          {t("er.labels.normesReferentiels")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.normes")}
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
                  <Plus className="w-4 h-4" /> {t("er.buttons.addEvaluation")}
                </Button>

                {/* Documents justificatifs seront demandés via FOR28 après présélection */}
              </>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">{t("er.titles.formationsDispensees")}</h3>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
              <p className="font-medium text-blue-800">
                {t("er.labels.hasFormationsDispenseesQuestion")}
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
                    {t("er.labels.yes")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="fd-non" />
                  <Label htmlFor="fd-non" className="cursor-pointer">
                    {t("er.labels.no")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {hasFormationsDispensees && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    {t("er.labels.chronologicalHint")}
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
                        {t("er.labels.formationDispensee")} {index + 1}
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
                          {t("er.labels.dateDebut")} <span className="text-red-500">*</span>
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
                          {t("er.labels.dateFin")} <span className="text-red-500">*</span>
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
                          {t("er.labels.duree")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.duree")}
                          value={fd.duree}
                          onChange={(e) =>
                            updateFormationDispensee(index, "duree", e.target.value)
                          }
                          className={hasError(`fd_${index}_duree`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t("er.labels.organismeBeneficiaire")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.organismeBeneficiaire")}
                          value={fd.organismeBeneficiaire}
                          onChange={(e) =>
                            updateFormationDispensee(index, "organismeBeneficiaire", e.target.value)
                          }
                          className={hasError(`fd_${index}_organisme`) ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          {t("er.labels.intituleFormation")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={t("er.placeholders.intituleFormation")}
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
                  <Plus className="w-4 h-4" /> {t("er.buttons.addFormationDispensee")}
                </Button>

                {/* Documents justificatifs seront demandés via FOR28 après présélection */}
              </>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">
                {t("er.titles.connaissancesLinguistiques")} <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {t("er.labels.langueHint")}
              </p>
              {errors.langues && <p className="text-sm text-red-500 mt-2">{errors.langues}</p>}
            </div>

            {langues.map((langue, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    {t("er.labels.langue")} {index + 1}
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
                    <Label>{t("er.labels.langue")} <span className="text-red-500">*</span></Label>
                    <Select
                      value={langue.langue}
                      onValueChange={(value) => updateLangue(index, "langue", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t("er.placeholders.select")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {LANGUAGE_KEYS.map((lk) => (
                          <SelectItem key={lk} value={lk}>
                            {t(`er.languages.${lk}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {langue.langue === "other" && (
                      <Input
                        placeholder={t("er.placeholders.langueAutre")}
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
                    <Label>{t("er.labels.lu")}</Label>
                    <Select
                      value={langue.lu}
                      onValueChange={(value) => updateLangue(index, "lu", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t("er.placeholders.level")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {LEVEL_KEYS.map((lk) => (
                          <SelectItem key={lk} value={lk}>
                            {t(`er.levels.${lk}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("er.labels.parle")}</Label>
                    <Select
                      value={langue.parle}
                      onValueChange={(value) => updateLangue(index, "parle", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t("er.placeholders.level")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {LEVEL_KEYS.map((lk) => (
                          <SelectItem key={lk} value={lk}>
                            {t(`er.levels.${lk}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("er.labels.ecrit")}</Label>
                    <Select
                      value={langue.ecrit}
                      onValueChange={(value) => updateLangue(index, "ecrit", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t("er.placeholders.level")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {LEVEL_KEYS.map((lk) => (
                          <SelectItem key={lk} value={lk}>
                            {t(`er.levels.${lk}`)}
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
              <Plus className="w-4 h-4" /> {t("er.buttons.addLangue")}
            </Button>

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{t("er.labels.informationsComplementaires")}</Label>
              <Textarea
                placeholder={t("er.placeholders.informationsComplementaires")}
                rows={4}
                value={formData.informationsComplementaires}
                onChange={(e) =>
                  setFormData({ ...formData, informationsComplementaires: e.target.value })
                }
              />
            </div>

            {/* Documents justificatifs seront demandés via FOR28 après présélection */}

            <div className="pt-6 space-y-4 border-t">
              <h3 className="font-semibold text-lg">{t("er.titles.engagements")}</h3>
              <div className="flex flex-col gap-3">
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
                    {t("er.labels.consent1")}{" "}
                    <a
                      href="https://algerac.dz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A63E] underline hover:text-[#008f35]"
                    >
                      {t("er.labels.privacyPolicy")}
                    </a>{" "}
                    {t("er.labels.consent1End")} <span className="text-red-500">*</span>
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
                    {t("er.labels.consent2")}{" "}
                    <a
                      href="https://algerac.dz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A63E] underline hover:text-[#008f35]"
                    >
                      {t("er.labels.dataProtectionLaw")}
                    </a>{" "}
                    {t("er.labels.consent2End")}{" "}
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
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Fixed top header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logoalgerac.png" alt="ALGERAC" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-[#00A63E] leading-tight">ALGERAC</h1>
              <p className="text-xs text-gray-500">
                {t("er.header.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-700">
              <Link href="/auth/register">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t("er.buttons.back")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {t("er.progress.step", { current: currentStep, total: STEPS.length })}
              </h2>
              <p className="text-sm text-gray-500">{STEPS[currentStep - 1].title}</p>
            </div>
            <span className="text-sm font-medium text-[#00A63E] bg-[#00A63E]/8 px-3 py-1 rounded-full">
              {Math.round((currentStep / STEPS.length) * 100)}%
            </span>
          </div>

          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#00A63E] rounded-full transition-all duration-500"
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
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step.id < currentStep
                      ? "bg-[#00A63E] text-white"
                      : step.id === currentStep
                        ? "bg-[#00A63E] text-white ring-2 ring-[#00A63E]/20 ring-offset-2"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  {step.id < currentStep ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : step.id}
                </div>
                <span className="text-[10px] mt-1.5 text-center hidden md:block max-w-[80px] text-gray-600">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error alert */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="flex-1 text-sm">{apiError}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60">
          <div className="p-6 md:p-10">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" /> {t("er.buttons.previous")}
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="gap-2 ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm"
                >
                  {t("er.buttons.next")} <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !consent1 || !consent2 || !consent3Type}
                  className="ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm"
                >
                  {loading ? t("er.buttons.submitting") : t("er.buttons.submit")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Blacklist Appeal Dialog */}
    <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="w-5 h-5" />
            {t("er.blacklist.title")}
          </DialogTitle>
          <DialogDescription>
            {t("er.blacklist.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            {t("er.blacklist.appealInfo")}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>
            {t("er.buttons.close")}
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
                    title: t("er.blacklist.appealSuccess"),
                    description: t("er.blacklist.appealSuccessDesc"),
                  });
                } else {
                  const err = await response.json();
                  toast({
                    title: t("er.blacklist.error"),
                    description: err.error || t("er.blacklist.appealError"),
                    variant: "destructive",
                  });
                }
              } catch {
                toast({
                  title: t("er.blacklist.error"),
                  description: t("er.blacklist.networkError"),
                  variant: "destructive",
                });
              } finally {
                setAppealLoading(false);
              }
            }}
          >
            {appealLoading ? t("er.buttons.submitting") : t("er.buttons.fileAppeal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
