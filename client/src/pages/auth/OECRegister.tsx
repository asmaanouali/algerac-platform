import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, Plus, Trash2, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker } from "@/components/ui/date-time-picker";

// Types de demande
const TYPES_DEMANDE = [
  { value: "initiale", label: "Accréditation initiale" },
  { value: "extension", label: "Extension" },
  { value: "renouvellement", label: "Renouvellement" },
  { value: "transfert", label: "Transfert" }
];

// Types d'activités
const TYPES_ACTIVITES = [
  { value: "inspection", label: "Inspection" },
  { value: "essais", label: "Essais" },
  { value: "etalonnage", label: "Étalonnage" },
  { value: "examens_medicaux", label: "Examens médicaux" },
  { value: "essais_aptitude", label: "Essais d'aptitude" },
  { value: "cert_sm", label: "Certification SM" },
  { value: "cert_produits", label: "Certification produits/procédés/services" },
  { value: "cert_personnes", label: "Certification personnes" }
];

// Types de prestation conseil
const TYPES_PRESTATION = [
  { value: "accompagnement", label: "Accompagnement" },
  { value: "formation", label: "Formation" },
  { value: "audit_interne", label: "Audit interne" },
  { value: "autre", label: "Autre" }
];

// Statuts juridiques
const STATUTS_JURIDIQUES = ["EURL", "SARL", "SPA", "EPE", "EPIC", "Autre"];

// Types de sites
const TYPES_SITES = [
  { value: "monosite", label: "Monosite" },
  { value: "multisites", label: "Multisites" }
];

// Liste des documents par annexe
const DOCUMENTS_ANNEXES: Record<string, string[]> = {
  inspection: [
    "FOR 04",
    "FOR 04-1",
    "Manuel qualité",
    "Procédures SM",
    "Procédures techniques",
    "Liste des documents",
    "Dernier rapport d'audit interne",
    "Dernier CR de revue de direction",
    "Liste des inspecteurs",
    "Liste des équipements",
    "Certificats d'étalonnage",
    "Police d'assurance",
    "Liste des sites clients",
    "Agrément",
    "Dossier de validation des méthodes",
    "Spécimen du rapport d'inspection"
  ],
  essais: [
    "FOR 05",
    "Manuel qualité",
    "Politiques/procédures",
    "Liste des documents",
    "Audit interne",
    "Revue de direction",
    "Procédure d'incertitudes",
    "Gestion des risques",
    "Spécimen rapport d'essai",
    "Dossier validation des méthodes",
    "Liste des étalons/équipements",
    "Certificats d'étalonnage",
    "Procédure de surveillance",
    "Rapport essais d'aptitude"
  ],
  etalonnage: [
    "FOR 06",
    "Manuel qualité",
    "Procédures",
    "Liste des documents",
    "Audit interne",
    "Revue de direction",
    "Procédure d'incertitudes",
    "Feuilles de calcul",
    "Gestion des risques",
    "Spécimen certificat d'étalonnage",
    "Liste des étalons",
    "Équipements étalonnés en interne",
    "Certificats d'étalonnage",
    "Procédure de surveillance",
    "Dossiers de validation",
    "Rapport essais d'aptitude",
    "Liste du personnel habilité"
  ],
  examens_medicaux: [
    "Organigramme",
    "Modalités des biologistes",
    "Procédure examens urgents",
    "Procédures gestion du personnel",
    "Gestion du système d'information",
    "Procédure validation/vérification méthode",
    "Certificats d'aptitude FOR 05-3",
    "Procédure CIQ/EEQ",
    "Résultats EEQ",
    "Procédure incertitudes",
    "Manuel qualité",
    "Liste des documents",
    "Planning audits internes",
    "Planning revues de direction",
    "Spécimen CR résultats",
    "Procédures SM",
    "Questionnaire FOR 05-2",
    "Certificats d'étalonnage"
  ],
  essais_aptitude: [
    "FOR 05-5",
    "Manuel SM",
    "Procédures",
    "Liste des documents",
    "Audit interne",
    "Revue de direction",
    "Dossier complet campagne ILC",
    "Technique de valeur assignée",
    "Liste prestataires externes",
    "Spécimen rapports",
    "Procédure et matrice des risques",
    "FOR 81"
  ],
  cert_sm: [
    "FOR 07",
    "Manuel SM",
    "Procédures",
    "Liste des documents",
    "Audit interne",
    "Revue de direction",
    "Composition comité de décision + preuves de compétences",
    "Analyse de risque du comité d'impartialité",
    "Police d'assurance RC",
    "Liste des documents par référentiel (ISO 9001/14001/22000/45001)",
    "Matrice des compétences auditeurs",
    "Liste des clients certifiés",
    "Planning des audits pour witnessing",
    "FOR 79",
    "FOR 80"
  ],
  cert_produits: [
    "FOR 07-5",
    "Liste des documents",
    "Procédures SM et technique",
    "Programme de certification + PV de validation",
    "Autorisation du propriétaire",
    "Audit interne",
    "Revue de direction",
    "Dispositif d'impartialité",
    "Liste des ressources",
    "Spécimen certificat",
    "Composition dispositif décisionnel",
    "Règles de gestion certificat/licence/marque",
    "Liste des produits certifiés",
    "Spécimen contrat",
    "FOR 07-6",
    "Planning audits de suivi"
  ],
  cert_personnes: [
    "FOR 07-8",
    "Manuel SM",
    "Dispositions SM",
    "Liste des documents",
    "Audit interne",
    "Revue de direction",
    "Composition des dispositifs de gestion/appels/impartialité",
    "Analyse des risques impartialité",
    "Programme de certification ISO/IEC 17024 + PV de validation",
    "Matrice des compétences évaluateurs",
    "Modèle de certificat",
    "Calendrier pour witnessing",
    "Liste des activités externalisées",
    "FOR 82"
  ],
  transfert: [
    "Statut juridique de l'entité réceptrice",
    "Dispositions gestion des risques",
    "Spécimens de rapports/certificats",
    "Rapports d'évaluation les plus récents",
    "État d'avancement clôture des écarts",
    "Certificat d'accréditation de l'organisme cédant"
  ]
};

interface Site {
  id: number;
  localisation: string;
  adresse: string;
  activites: string;
  soustraitance: string;
  ebmd: string;
}

interface PersonnelSite {
  id: number;
  site: string;
  permanents: string;
  vacataires: string;
}

interface ResponsableTechnique {
  id: number;
  nom: string;
  qualifications: string;
  experience: string;
}

interface PrestationConseil {
  id: number;
  types: string[];
  prestataire: string;
  date: string;
  description: string;
}

interface Reconnaissance {
  id: number;
  organisation: string;
  domaine: string;
  validite: string;
}

interface ChangementTransfert {
  posteCles: string;
  effectif: string;
  locaux: string;
  equipements: string;
  systemeManagement: string;
}

interface FormData {
  // Étape 1
  typeDemande: string;
  dateEvaluation: string;
  activites: string[];
  siteType: string;
  
  // Étape 2
  nomLegal: string;
  abreviation: string;
  sigle: string;
  statutJuridique: string;
  registreCommerce: string;
  codesActivite: string;
  adresseSiege: string;
  adresseFacturation: string;
  email: string;
  siteWeb: string;
  appartientGroupe: string;
  groupeNom: string;
  groupeAdresse: string;
  groupeRelation: string;
  groupeImpact: string;
  
  // Étape 3
  contactNom: string;
  contactFonction: string;
  contactAdresse: string;
  contactTelephone: string;
  contactFax: string;
  contactEmail: string;
  
  // Étape 4
  sites: Site[];
  
  // Étape 5
  personnelSites: PersonnelSite[];
  responsablesTechniques: ResponsableTechnique[];
  responsableQualiteNom: string;
  responsableQualiteQualif: string;
  responsableQualiteExp: string;
  
  // Étape 6
  prestationConseil: string;
  prestations: PrestationConseil[];
  
  // Étape 7
  reconnaissances: Reconnaissance[];
  changementsTransfert: ChangementTransfert;
  motifTransfert: string;
  
  // Étape 8 - Documents techniques (cases à cocher)
  documentsChecked: Record<string, boolean>;
  
  // Étape 9 - Documents administratifs
  docsAdminChecked: Record<string, boolean>;
  
  // Étape 10 - Déclaration
  organismeSoumission: string;
  demandeurNom: string;
  demandeurFonction: string;
  demandeurDate: string;
  signature: string;
  engagementsAcceptes: boolean;
}

const STEPS = [
  { id: 1, title: "Type de demande" },
  { id: 2, title: "Informations organisme" },
  { id: 3, title: "Personne à contacter" },
  { id: 4, title: "Sites et activités" },
  { id: 5, title: "Personnel" },
  { id: 6, title: "Prestations conseil" },
  { id: 7, title: "Reconnaissances" },
  { id: 8, title: "Documents techniques" },
  { id: 9, title: "Documents administratifs" },
  { id: 10, title: "Déclaration et signature" }
];

export default function OECRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  
  const [formData, setFormData] = useState<FormData>({
    // Étape 1
    typeDemande: "",
    dateEvaluation: "",
    activites: [],
    siteType: "",
    
    // Étape 2
    nomLegal: "",
    abreviation: "",
    sigle: "",
    statutJuridique: "",
    registreCommerce: "",
    codesActivite: "",
    adresseSiege: "",
    adresseFacturation: "",
    email: "",
    siteWeb: "",
    appartientGroupe: "",
    groupeNom: "",
    groupeAdresse: "",
    groupeRelation: "",
    groupeImpact: "",
    
    // Étape 3
    contactNom: "",
    contactFonction: "",
    contactAdresse: "",
    contactTelephone: "",
    contactFax: "",
    contactEmail: "",
    
    // Étape 4
    sites: [{ id: 1, localisation: "", adresse: "", activites: "", soustraitance: "", ebmd: "" }],
    
    // Étape 5
    personnelSites: [{ id: 1, site: "", permanents: "", vacataires: "" }],
    responsablesTechniques: [{ id: 1, nom: "", qualifications: "", experience: "" }],
    responsableQualiteNom: "",
    responsableQualiteQualif: "",
    responsableQualiteExp: "",
    
    // Étape 6
    prestationConseil: "",
    prestations: [],
    
    // Étape 7
    reconnaissances: [{ id: 1, organisation: "", domaine: "", validite: "" }],
    changementsTransfert: {
      posteCles: "",
      effectif: "",
      locaux: "",
      equipements: "",
      systemeManagement: ""
    },
    motifTransfert: "",
    
    // Étape 8
    documentsChecked: {},
    
    // Étape 9
    docsAdminChecked: {},
    
    // Étape 10
    organismeSoumission: "",
    demandeurNom: "",
    demandeurFonction: "",
    demandeurDate: "",
    signature: "",
    engagementsAcceptes: false
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleActivite = (activite: string) => {
    const current = formData.activites;
    if (current.includes(activite)) {
      updateFormData("activites", current.filter(a => a !== activite));
    } else {
      updateFormData("activites", [...current, activite]);
    }
  };

  const addSite = () => {
    const newId = Math.max(...formData.sites.map(s => s.id), 0) + 1;
    updateFormData("sites", [...formData.sites, { id: newId, localisation: "", adresse: "", activites: "", soustraitance: "", ebmd: "" }]);
  };

  const removeSite = (id: number) => {
    updateFormData("sites", formData.sites.filter(s => s.id !== id));
  };

  const updateSite = (id: number, field: keyof Site, value: string) => {
    updateFormData("sites", formData.sites.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addPersonnelSite = () => {
    const newId = Math.max(...formData.personnelSites.map(p => p.id), 0) + 1;
    updateFormData("personnelSites", [...formData.personnelSites, { id: newId, site: "", permanents: "", vacataires: "" }]);
  };

  const removePersonnelSite = (id: number) => {
    updateFormData("personnelSites", formData.personnelSites.filter(p => p.id !== id));
  };

  const updatePersonnelSite = (id: number, field: keyof PersonnelSite, value: string) => {
    updateFormData("personnelSites", formData.personnelSites.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addResponsableTechnique = () => {
    const newId = Math.max(...formData.responsablesTechniques.map(r => r.id), 0) + 1;
    updateFormData("responsablesTechniques", [...formData.responsablesTechniques, { id: newId, nom: "", qualifications: "", experience: "" }]);
  };

  const removeResponsableTechnique = (id: number) => {
    updateFormData("responsablesTechniques", formData.responsablesTechniques.filter(r => r.id !== id));
  };

  const updateResponsableTechnique = (id: number, field: keyof ResponsableTechnique, value: string) => {
    updateFormData("responsablesTechniques", formData.responsablesTechniques.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addPrestation = () => {
    const newId = Math.max(...formData.prestations.map(p => p.id), 0) + 1;
    updateFormData("prestations", [...formData.prestations, { id: newId, types: [], prestataire: "", date: "", description: "" }]);
  };

  const removePrestation = (id: number) => {
    updateFormData("prestations", formData.prestations.filter(p => p.id !== id));
  };

  const updatePrestation = (id: number, field: keyof PrestationConseil, value: any) => {
    updateFormData("prestations", formData.prestations.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addReconnaissance = () => {
    const newId = Math.max(...formData.reconnaissances.map(r => r.id), 0) + 1;
    updateFormData("reconnaissances", [...formData.reconnaissances, { id: newId, organisation: "", domaine: "", validite: "" }]);
  };

  const removeReconnaissance = (id: number) => {
    updateFormData("reconnaissances", formData.reconnaissances.filter(r => r.id !== id));
  };

  const updateReconnaissance = (id: number, field: keyof Reconnaissance, value: string) => {
    updateFormData("reconnaissances", formData.reconnaissances.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleDocumentCheck = (doc: string) => {
    updateFormData("documentsChecked", {
      ...formData.documentsChecked,
      [doc]: !formData.documentsChecked[doc]
    });
  };

  const toggleDocAdminCheck = (doc: string) => {
    updateFormData("docsAdminChecked", {
      ...formData.docsAdminChecked,
      [doc]: !formData.docsAdminChecked[doc]
    });
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.typeDemande) {
          newErrors.typeDemande = "Le type de demande est requis";
        }
        if (formData.activites.length === 0) {
          newErrors.activites = "Veuillez sélectionner au moins une activité";
        }
        break;

      case 2:
        if (!formData.nomLegal.trim()) {
          newErrors.nomLegal = "Le nom légal complet est requis";
        }
        if (!formData.statutJuridique) {
          newErrors.statutJuridique = "Le statut juridique est requis";
        }
        if (!formData.adresseSiege.trim()) {
          newErrors.adresseSiege = "L'adresse du siège est requise";
        }
        if (!formData.email.trim()) {
          newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "L'email n'est pas valide";
        }
        break;

      case 3:
        if (!formData.contactNom.trim()) {
          newErrors.contactNom = "Le nom complet est requis";
        }
        if (!formData.contactFonction.trim()) {
          newErrors.contactFonction = "La fonction/titre est requise";
        }
        if (!formData.contactTelephone.trim()) {
          newErrors.contactTelephone = "Le téléphone est requis";
        }
        if (!formData.contactEmail.trim()) {
          newErrors.contactEmail = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = "L'email n'est pas valide";
        }
        break;
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    try {
      // Convertir les fichiers joints en base64
      const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const docsList: Array<{key: string, name: string, base64?: string, mimeType?: string}> = [];
      for (const [key, checked] of Object.entries(formData.documentsChecked)) {
        if (checked) {
          const file = documentFiles[key];
          if (file) {
            docsList.push({ key, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          } else {
            docsList.push({ key, name: key });
          }
        }
      }
      for (const [doc, checked] of Object.entries(formData.docsAdminChecked)) {
        if (checked) {
          const file = documentFiles[`admin-${doc}`];
          if (file) {
            docsList.push({ key: `admin-${doc}`, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          } else {
            docsList.push({ key: `admin-${doc}`, name: doc });
          }
        }
      }

      // Mapper les données du formulaire vers le format attendu par le backend
      const payload = {
        nomOrganisme: formData.nomLegal,
        typeOrganisme: formData.statutJuridique || "OEC",
        adresseSiege: formData.adresseSiege,
        telephone: formData.contactTelephone,
        email: formData.email,
        nomRepresentant: formData.contactNom,
        fonction: formData.contactFonction,
        telephoneDirect: formData.contactTelephone,
        emailProfessionnel: formData.contactEmail,
        porteeAccreditation: formData.activites.join(", "),
        typeDemande: formData.typeDemande,
        userType: "OEC",
        documents: docsList.length > 0 ? docsList : undefined
      };

      const response = await fetch("http://localhost:8082/api/auth/signup/oec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'inscription");
      }

      toast({
        title: "Demande soumise",
        description: "Votre demande d'accréditation a été envoyée avec succès",
      });
      
      setLocation("/auth/success?type=oec");
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      case 9:
        return renderStep9();
      case 10:
        return renderStep10();
      default:
        return null;
    }
  };

  // ÉTAPE 1: Type de demande
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">Type de demande <span className="text-red-500">*</span></Label>
        <RadioGroup value={formData.typeDemande} onValueChange={(v) => updateFormData("typeDemande", v)}>
          <div className="grid md:grid-cols-2 gap-3">
            {TYPES_DEMANDE.map(type => (
              <div key={type.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label htmlFor={type.value} className="cursor-pointer flex-1">{type.label}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        {errors.typeDemande && <p className="text-sm text-red-500">{errors.typeDemande}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date d'évaluation souhaitée</Label>
        <StringDatePicker
          value={formData.dateEvaluation}
          onChange={(v) => updateFormData("dateEvaluation", v)}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Type d'activité <span className="text-red-500">*</span></Label>
        <div className="grid md:grid-cols-2 gap-3">
          {TYPES_ACTIVITES.map(activite => (
            <div key={activite.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
              <Checkbox 
                id={activite.value}
                checked={formData.activites.includes(activite.value)}
                onCheckedChange={() => toggleActivite(activite.value)}
              />
              <Label htmlFor={activite.value} className="cursor-pointer flex-1 text-sm">{activite.label}</Label>
            </div>
          ))}
        </div>
        {errors.activites && <p className="text-sm text-red-500">{errors.activites}</p>}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Type de site</Label>
        <RadioGroup value={formData.siteType} onValueChange={(v) => updateFormData("siteType", v)}>
          <div className="grid md:grid-cols-2 gap-3">
            {TYPES_SITES.map(type => (
              <div key={type.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                <RadioGroupItem value={type.value} id={`site-${type.value}`} />
                <Label htmlFor={`site-${type.value}`} className="cursor-pointer flex-1">{type.label}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  // ÉTAPE 2: Informations sur l'organisme
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>Nom légal complet <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.nomLegal}
            onChange={(e) => updateFormData("nomLegal", e.target.value)}
            placeholder="Nom complet de l'organisme"
          />
          {errors.nomLegal && <p className="text-sm text-red-500">{errors.nomLegal}</p>}
        </div>

        <div className="space-y-2">
          <Label>Abréviation</Label>
          <Input 
            value={formData.abreviation}
            onChange={(e) => updateFormData("abreviation", e.target.value)}
            placeholder="Abréviation"
          />
        </div>

        <div className="space-y-2">
          <Label>Sigle utilisé</Label>
          <Input 
            value={formData.sigle}
            onChange={(e) => updateFormData("sigle", e.target.value)}
            placeholder="Sigle"
          />
        </div>

        <div className="space-y-2">
          <Label>Statut juridique <span className="text-red-500">*</span></Label>
          <Select value={formData.statutJuridique} onValueChange={(v) => updateFormData("statutJuridique", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {STATUTS_JURIDIQUES.map(statut => (
                <SelectItem key={statut} value={statut}>{statut}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.statutJuridique && <p className="text-sm text-red-500">{errors.statutJuridique}</p>}
        </div>

        <div className="space-y-2">
          <Label>Numéro de registre de commerce</Label>
          <Input 
            value={formData.registreCommerce}
            onChange={(e) => updateFormData("registreCommerce", e.target.value)}
            placeholder="Ex: 12-3456789-01"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Codes d'activité</Label>
          <Input 
            value={formData.codesActivite}
            onChange={(e) => updateFormData("codesActivite", e.target.value)}
            placeholder="Codes NAA"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Adresse du siège <span className="text-red-500">*</span></Label>
          <Textarea 
            value={formData.adresseSiege}
            onChange={(e) => updateFormData("adresseSiege", e.target.value)}
            placeholder="Adresse complète du siège social"
            rows={3}
          />
          {errors.adresseSiege && <p className="text-sm text-red-500">{errors.adresseSiege}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Adresse de facturation (si différente)</Label>
          <Textarea 
            value={formData.adresseFacturation}
            onChange={(e) => updateFormData("adresseFacturation", e.target.value)}
            placeholder="Laisser vide si identique au siège"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Email <span className="text-red-500">*</span></Label>
          <Input 
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder="contact@exemple.dz"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label>Site web</Label>
          <Input 
            value={formData.siteWeb}
            onChange={(e) => updateFormData("siteWeb", e.target.value)}
            placeholder="www.exemple.dz"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Appartient à un groupe ?</Label>
        <RadioGroup value={formData.appartientGroupe} onValueChange={(v) => updateFormData("appartientGroupe", v)}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oui" id="groupe-oui" />
              <Label htmlFor="groupe-oui">Oui</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non" id="groupe-non" />
              <Label htmlFor="groupe-non">Non</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {formData.appartientGroupe === "oui" && (
        <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2 md:col-span-2">
            <Label>Nom du groupe</Label>
            <Input 
              value={formData.groupeNom}
              onChange={(e) => updateFormData("groupeNom", e.target.value)}
              placeholder="Nom du groupe"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Adresse du groupe</Label>
            <Textarea 
              value={formData.groupeAdresse}
              onChange={(e) => updateFormData("groupeAdresse", e.target.value)}
              placeholder="Adresse complète du groupe"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de relation</Label>
            <Input 
              value={formData.groupeRelation}
              onChange={(e) => updateFormData("groupeRelation", e.target.value)}
              placeholder="Ex: Filiale, Maison-mère"
            />
          </div>

          <div className="space-y-2">
            <Label>Impact du groupe sur les activités locales</Label>
            <Input 
              value={formData.groupeImpact}
              onChange={(e) => updateFormData("groupeImpact", e.target.value)}
              placeholder="Précisez l'impact"
            />
          </div>
        </div>
      )}
    </div>
  );

  // ÉTAPE 3: Personne à contacter
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Nom complet <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.contactNom}
            onChange={(e) => updateFormData("contactNom", e.target.value)}
            placeholder="Nom et prénom"
          />
          {errors.contactNom && <p className="text-sm text-red-500">{errors.contactNom}</p>}
        </div>

        <div className="space-y-2">
          <Label>Fonction/Titre <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.contactFonction}
            onChange={(e) => updateFormData("contactFonction", e.target.value)}
            placeholder="Ex: Directeur Général"
          />
          {errors.contactFonction && <p className="text-sm text-red-500">{errors.contactFonction}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Adresse</Label>
          <Textarea 
            value={formData.contactAdresse}
            onChange={(e) => updateFormData("contactAdresse", e.target.value)}
            placeholder="Adresse du contact"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Téléphone <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.contactTelephone}
            onChange={(e) => updateFormData("contactTelephone", e.target.value)}
            placeholder="+213 XXX XXX XXX"
          />
          {errors.contactTelephone && <p className="text-sm text-red-500">{errors.contactTelephone}</p>}
        </div>

        <div className="space-y-2">
          <Label>Fax</Label>
          <Input 
            value={formData.contactFax}
            onChange={(e) => updateFormData("contactFax", e.target.value)}
            placeholder="+213 XXX XXX XXX"
          />
        </div>

        <div className="space-y-2">
          <Label>Email <span className="text-red-500">*</span></Label>
          <Input 
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData("contactEmail", e.target.value)}
            placeholder="contact@exemple.dz"
          />
          {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}
        </div>
      </div>
    </div>
  );

  // ÉTAPE 4: Sites et activités
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Sites et activités</Label>
        <Button type="button" onClick={addSite} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </Button>
      </div>

      <div className="space-y-4">
        {formData.sites.map((site) => (
          <Card key={site.id} className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">Site #{site.id}</h4>
                {formData.sites.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSite(site.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Site/Localisation</Label>
                  <Input 
                    value={site.localisation}
                    onChange={(e) => updateSite(site.id, "localisation", e.target.value)}
                    placeholder="Nom du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Adresse</Label>
                  <Input 
                    value={site.adresse}
                    onChange={(e) => updateSite(site.id, "adresse", e.target.value)}
                    placeholder="Adresse du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Activités réalisées sur site</Label>
                  <Input 
                    value={site.activites}
                    onChange={(e) => updateSite(site.id, "activites", e.target.value)}
                    placeholder="Activités"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Activités sous-traitées</Label>
                  <Input 
                    value={site.soustraitance}
                    onChange={(e) => updateSite(site.id, "soustraitance", e.target.value)}
                    placeholder="Sous-traitance"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm">EBMD avec nom de la structure</Label>
                  <Input 
                    value={site.ebmd}
                    onChange={(e) => updateSite(site.id, "ebmd", e.target.value)}
                    placeholder="Examens de biologie médicale délocalisés"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // ÉTAPE 5: Personnel
  const renderStep5 = () => (
    <div className="space-y-8">
      {/* Section Personnel par site */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Personnel par site</Label>
          <Button type="button" onClick={addPersonnelSite} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {formData.personnelSites.map((ps) => (
            <Card key={ps.id} className="p-4">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-sm">Site</Label>
                  <Input 
                    value={ps.site}
                    onChange={(e) => updatePersonnelSite(ps.id, "site", e.target.value)}
                    placeholder="Nom du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Personnel technique permanent</Label>
                  <Input 
                    type="number"
                    value={ps.permanents}
                    onChange={(e) => updatePersonnelSite(ps.id, "permanents", e.target.value)}
                    placeholder="Nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Personnel vacataire/extérieur</Label>
                  <Input 
                    type="number"
                    value={ps.vacataires}
                    onChange={(e) => updatePersonnelSite(ps.id, "vacataires", e.target.value)}
                    placeholder="Nombre"
                  />
                </div>

                {formData.personnelSites.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePersonnelSite(ps.id)}
                    className="h-10"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Responsables techniques */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Responsable(s) technique(s)</Label>
          <Button type="button" onClick={addResponsableTechnique} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {formData.responsablesTechniques.map((rt) => (
            <Card key={rt.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">Responsable technique #{rt.id}</h4>
                  {formData.responsablesTechniques.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeResponsableTechnique(rt.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Nom complet</Label>
                    <Input 
                      value={rt.nom}
                      onChange={(e) => updateResponsableTechnique(rt.id, "nom", e.target.value)}
                      placeholder="Nom et prénom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Qualifications</Label>
                    <Input 
                      value={rt.qualifications}
                      onChange={(e) => updateResponsableTechnique(rt.id, "qualifications", e.target.value)}
                      placeholder="Diplômes, certifications"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Années d'expérience</Label>
                    <Input 
                      type="number"
                      value={rt.experience}
                      onChange={(e) => updateResponsableTechnique(rt.id, "experience", e.target.value)}
                      placeholder="Années"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Responsable qualité */}
      <div className="space-y-4 pt-6 border-t">
        <Label className="text-base font-semibold">Responsable qualité</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Nom complet</Label>
            <Input 
              value={formData.responsableQualiteNom}
              onChange={(e) => updateFormData("responsableQualiteNom", e.target.value)}
              placeholder="Nom et prénom"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Qualifications</Label>
            <Input 
              value={formData.responsableQualiteQualif}
              onChange={(e) => updateFormData("responsableQualiteQualif", e.target.value)}
              placeholder="Diplômes, certifications"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Années d'expérience dans la fonction</Label>
            <Input 
              type="number"
              value={formData.responsableQualiteExp}
              onChange={(e) => updateFormData("responsableQualiteExp", e.target.value)}
              placeholder="Années"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ÉTAPE 6: Prestations de conseil
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">L'organisme a-t-il eu recours à des prestations de conseil ?</Label>
        <RadioGroup value={formData.prestationConseil} onValueChange={(v) => updateFormData("prestationConseil", v)}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oui" id="conseil-oui" />
              <Label htmlFor="conseil-oui">Oui</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non" id="conseil-non" />
              <Label htmlFor="conseil-non">Non</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {formData.prestationConseil === "oui" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Détails des prestations</Label>
            <Button type="button" onClick={addPrestation} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter une prestation
            </Button>
          </div>

          <div className="space-y-4">
            {formData.prestations.map((prestation) => (
              <Card key={prestation.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">Prestation #{prestation.id}</h4>
                    {formData.prestations.length > 0 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePrestation(prestation.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm">Type de prestation</Label>
                    <div className="grid md:grid-cols-2 gap-2">
                      {TYPES_PRESTATION.map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`prestation-${prestation.id}-${type.value}`}
                            checked={prestation.types.includes(type.value)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked 
                                ? [...prestation.types, type.value]
                                : prestation.types.filter(t => t !== type.value);
                              updatePrestation(prestation.id, "types", newTypes);
                            }}
                          />
                          <Label htmlFor={`prestation-${prestation.id}-${type.value}`} className="text-sm cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Identité et adresse du prestataire</Label>
                      <Input 
                        value={prestation.prestataire}
                        onChange={(e) => updatePrestation(prestation.id, "prestataire", e.target.value)}
                        placeholder="Nom et adresse"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Date</Label>
                      <StringDatePicker
                        value={prestation.date}
                        onChange={(v) => updatePrestation(prestation.id, "date", v)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm">Description de la prestation</Label>
                      <Textarea 
                        value={prestation.description}
                        onChange={(e) => updatePrestation(prestation.id, "description", e.target.value)}
                        placeholder="Détails de la prestation"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ÉTAPE 7: Autres informations et reconnaissances
  const renderStep7 = () => (
    <div className="space-y-8">
      {/* Section Reconnaissances */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Autres informations et reconnaissances</Label>
          <Button type="button" onClick={addReconnaissance} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {formData.reconnaissances.map((rec) => (
            <Card key={rec.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">Reconnaissance #{rec.id}</h4>
                  {formData.reconnaissances.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeReconnaissance(rec.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Nom et localisation de l'organisation</Label>
                    <Input 
                      value={rec.organisation}
                      onChange={(e) => updateReconnaissance(rec.id, "organisation", e.target.value)}
                      placeholder="Organisation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Domaine couvert</Label>
                    <Input 
                      value={rec.domaine}
                      onChange={(e) => updateReconnaissance(rec.id, "domaine", e.target.value)}
                      placeholder="Domaine"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Validité</Label>
                    <Input 
                      value={rec.validite}
                      onChange={(e) => updateReconnaissance(rec.id, "validite", e.target.value)}
                      placeholder="Date de validité"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Transfert (si applicable) */}
      {formData.typeDemande === "transfert" && (
        <div className="space-y-6 pt-6 border-t">
          <Label className="text-base font-semibold">Informations sur le transfert</Label>
          
          <div className="space-y-4">
            <Label className="text-sm font-medium">Motif du transfert</Label>
            <RadioGroup value={formData.motifTransfert} onValueChange={(v) => updateFormData("motifTransfert", v)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="reorganisation" id="motif-reorganisation" />
                  <Label htmlFor="motif-reorganisation" className="cursor-pointer">
                    Réorganisation/création de filiale
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="cession" id="motif-cession" />
                  <Label htmlFor="motif-cession" className="cursor-pointer">
                    Cession de portée à une autre entité
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="fusion" id="motif-fusion" />
                  <Label htmlFor="motif-fusion" className="cursor-pointer">
                    Fusion de deux OEC
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Tableau des changements</Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Postes clés - changement opéré</Label>
                <Textarea 
                  value={formData.changementsTransfert.posteCles}
                  onChange={(e) => updateFormData("changementsTransfert", {
                    ...formData.changementsTransfert,
                    posteCles: e.target.value
                  })}
                  placeholder="Décrire les changements"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Effectif - changement opéré</Label>
                <Textarea 
                  value={formData.changementsTransfert.effectif}
                  onChange={(e) => updateFormData("changementsTransfert", {
                    ...formData.changementsTransfert,
                    effectif: e.target.value
                  })}
                  placeholder="Décrire les changements"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Locaux - changement opéré</Label>
                <Textarea 
                  value={formData.changementsTransfert.locaux}
                  onChange={(e) => updateFormData("changementsTransfert", {
                    ...formData.changementsTransfert,
                    locaux: e.target.value
                  })}
                  placeholder="Décrire les changements"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Équipements - changement opéré</Label>
                <Textarea 
                  value={formData.changementsTransfert.equipements}
                  onChange={(e) => updateFormData("changementsTransfert", {
                    ...formData.changementsTransfert,
                    equipements: e.target.value
                  })}
                  placeholder="Décrire les changements"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Système de management - changement opéré</Label>
                <Textarea 
                  value={formData.changementsTransfert.systemeManagement}
                  onChange={(e) => updateFormData("changementsTransfert", {
                    ...formData.changementsTransfert,
                    systemeManagement: e.target.value
                  })}
                  placeholder="Décrire les changements"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ÉTAPE 8: Documents techniques à joindre
  const renderStep8 = () => {
    const selectedActivities = formData.activites;
    const allDocuments: string[] = [];
    
    selectedActivities.forEach(activity => {
      if (DOCUMENTS_ANNEXES[activity]) {
        allDocuments.push(...DOCUMENTS_ANNEXES[activity]);
      }
    });
    
    // Ajouter annexe transfert si applicable
    if (formData.typeDemande === "transfert" && DOCUMENTS_ANNEXES.transfert) {
      allDocuments.push(...DOCUMENTS_ANNEXES.transfert);
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Liste des documents à joindre</h3>
          <p className="text-sm text-slate-600 mb-4">
            Cochez chaque document que vous inclurez dans votre dossier
          </p>
        </div>

        {selectedActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            Veuillez sélectionner au moins une activité à l'étape 1 pour voir les documents requis
          </div>
        ) : (
          <div className="space-y-6">
            {selectedActivities.map(activity => {
              const activityLabel = TYPES_ACTIVITES.find(a => a.value === activity)?.label || activity;
              const docs = DOCUMENTS_ANNEXES[activity] || [];
              
              return (
                <div key={activity} className="space-y-3">
                  <h4 className="font-semibold text-base text-[#00A63E]">
                    {activityLabel}
                  </h4>
                  <div className="space-y-2 pl-4">
                    {docs.map((doc, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                        <Checkbox 
                          id={`doc-${activity}-${idx}`}
                          checked={!!formData.documentsChecked[`${activity}-${doc}`]}
                          onCheckedChange={() => toggleDocumentCheck(`${activity}-${doc}`)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`doc-${activity}-${idx}`} className="cursor-pointer text-sm">
                            {doc}
                          </Label>
                          {!!formData.documentsChecked[`${activity}-${doc}`] && (
                            <div className="mt-1">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setDocumentFiles(prev => ({ ...prev, [`${activity}-${doc}`]: file }));
                                }}
                                className="text-xs w-full"
                              />
                              {documentFiles[`${activity}-${doc}`] && (
                                <p className="text-xs text-green-600 mt-0.5">{documentFiles[`${activity}-${doc}`].name}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {formData.typeDemande === "transfert" && DOCUMENTS_ANNEXES.transfert && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-base text-[#00A63E]">
                  Annexe 09 - Documents de transfert
                </h4>
                <div className="space-y-2 pl-4">
                  {DOCUMENTS_ANNEXES.transfert.map((doc, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox 
                        id={`doc-transfert-${idx}`}
                        checked={!!formData.documentsChecked[`transfert-${doc}`]}
                        onCheckedChange={() => toggleDocumentCheck(`transfert-${doc}`)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`doc-transfert-${idx}`} className="cursor-pointer text-sm">
                          {doc}
                        </Label>
                        {!!formData.documentsChecked[`transfert-${doc}`] && (
                          <div className="mt-1">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setDocumentFiles(prev => ({ ...prev, [`transfert-${doc}`]: file }));
                              }}
                              className="text-xs w-full"
                            />
                            {documentFiles[`transfert-${doc}`] && (
                              <p className="text-xs text-green-600 mt-0.5">{documentFiles[`transfert-${doc}`].name}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ÉTAPE 9: Documents administratifs
  const renderStep9 = () => {
    const docsAdmin = [
      "Copie des statuts de l'organisme",
      "Copie de la carte d'immatriculation fiscale (NIS, NIF)",
      "Copie du N° article d'imposition",
      "Copie du registre de commerce",
      "Chèque à l'ordre d'ALGERAC (organismes nationaux)",
      "Ordre de virement à l'ordre d'ALGERAC (organismes étrangers)"
    ];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Documents administratifs</h3>
          <p className="text-sm text-slate-600 mb-4">
            Cochez chaque document administratif que vous inclurez
          </p>
        </div>

        <div className="space-y-2">
          {docsAdmin.map((doc, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50">
              <Checkbox 
                id={`admin-doc-${idx}`}
                checked={!!formData.docsAdminChecked[doc]}
                onCheckedChange={() => toggleDocAdminCheck(doc)}
              />
              <div className="flex-1">
                <Label htmlFor={`admin-doc-${idx}`} className="cursor-pointer text-sm">
                  {doc}
                </Label>
                {!!formData.docsAdminChecked[doc] && (
                  <div className="mt-1">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setDocumentFiles(prev => ({ ...prev, [`admin-${doc}`]: file }));
                      }}
                      className="text-xs w-full"
                    />
                    {documentFiles[`admin-${doc}`] && (
                      <p className="text-xs text-green-600 mt-0.5">{documentFiles[`admin-${doc}`].name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ÉTAPE 10: Déclaration et signature
  const renderStep10 = () => (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-lg space-y-4">
        <h3 className="font-semibold text-lg">Engagements du demandeur</h3>
        <div className="text-sm leading-relaxed space-y-2 text-slate-700">
          <p>En soumettant cette demande, je déclare que :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Toutes les informations fournies sont exactes et complètes</li>
            <li>L'organisme s'engage à respecter toutes les exigences d'accréditation</li>
            <li>L'organisme informera ALGERAC de tout changement significatif</li>
            <li>L'organisme accepte de se soumettre aux évaluations prévues</li>
            <li>L'organisme s'engage à payer les frais d'accréditation applicables</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nom de l'organisme autorisant la soumission</Label>
          <Input 
            value={formData.organismeSoumission}
            onChange={(e) => updateFormData("organismeSoumission", e.target.value)}
            placeholder="Nom officiel de l'organisme"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom complet du demandeur</Label>
            <Input 
              value={formData.demandeurNom}
              onChange={(e) => updateFormData("demandeurNom", e.target.value)}
              placeholder="Nom et prénom"
            />
          </div>

          <div className="space-y-2">
            <Label>Fonction</Label>
            <Input 
              value={formData.demandeurFonction}
              onChange={(e) => updateFormData("demandeurFonction", e.target.value)}
              placeholder="Fonction du demandeur"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <StringDatePicker
              value={formData.demandeurDate}
              onChange={(v) => updateFormData("demandeurDate", v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Signature (nom)</Label>
            <Input 
              value={formData.signature}
              onChange={(e) => updateFormData("signature", e.target.value)}
              placeholder="Signature électronique"
            />
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border-2">
        <Checkbox 
          id="engagements"
          checked={formData.engagementsAcceptes}
          onCheckedChange={(checked) => updateFormData("engagementsAcceptes", checked)}
        />
        <Label htmlFor="engagements" className="cursor-pointer text-sm leading-relaxed">
          J'accepte les engagements ci-dessus et confirme que j'ai l'autorité pour soumettre cette demande au nom de l'organisme
        </Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Fixed top header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-[#00A63E] leading-tight">ALGERAC</h1>
              <p className="text-xs text-gray-500">Demande d'Accréditation OEC</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-700">
            <Link href="/auth/register">
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Progress section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Étape {currentStep} sur {STEPS.length}</h2>
              <p className="text-sm text-gray-500">{STEPS[currentStep - 1].title}</p>
            </div>
            <span className="text-sm font-medium text-[#00A63E] bg-[#00A63E]/8 px-3 py-1 rounded-full">
              {Math.round((currentStep / STEPS.length) * 100)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#00A63E] rounded-full transition-all duration-500"
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
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step.id < currentStep 
                    ? "bg-[#00A63E] text-white" 
                    : step.id === currentStep
                    ? "bg-[#00A63E] text-white ring-2 ring-[#00A63E]/20 ring-offset-2"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                )}>
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

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60">
          <div className="p-6 md:p-10">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={prevStep}
                  className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button 
                  type="button"
                  onClick={nextStep}
                  className="gap-2 ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm"
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm"
                >
                  {loading ? "Envoi en cours..." : "Soumettre la demande"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
