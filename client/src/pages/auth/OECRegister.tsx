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
import { ArrowRight, ChevronLeft, Plus, Trash2, FileText, AlertCircle, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/hooks/use-theme";

// Types de demande
const TYPES_DEMANDE = [
  { value: "initiale", label: "Accréditation initiale" },
  { value: "extension", label: "Extension" },
  { value: "renouvellement", label: "Renouvellement" }
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
  autrePrecision?: string;
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

interface ForRow {
  id: number;
  [key: string]: string | number;
}

function newRow(fields: string[]): ForRow {
  const row: ForRow = { id: Date.now() + Math.random() };
  fields.forEach((f) => { row[f] = ""; });
  return row;
}

function DynamicTable({
  title, columns, rows, onAdd, onRemove, onUpdate,
}: {
  title: string;
  columns: { key: string; label: string; placeholder?: string; type?: string }[];
  rows: ForRow[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, field: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">{title}</Label>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-slate-50">
          <Plus className="w-3 h-3" /> Ajouter
        </button>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left text-xs font-medium text-slate-600 w-8">N°</th>
              {columns.map((col) => (
                <th key={col.key} className="p-2 text-left text-xs font-medium text-slate-600">{col.label}</th>
              ))}
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 text-xs text-slate-500">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="p-1">
                    <Input
                      type={col.type || "text"}
                      value={(row[col.key] as string) || ""}
                      onChange={(e) => onUpdate(row.id, col.key, e.target.value)}
                      placeholder={col.placeholder || ""}
                      className="h-8 text-xs"
                    />
                  </td>
                ))}
                <td className="p-1">
                  {rows.length > 1 && (
                    <button type="button" onClick={() => onRemove(row.id)} className="p-1 hover:bg-red-50 rounded">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Non-FOR documents (stay as uploads per activity)
const UPLOAD_DOCS: Record<string, string[]> = {
  inspection: [
    "Manuel qualité", "Procédures SM", "Procédures techniques", "Liste des documents",
    "Dernier rapport d'audit interne", "Dernier CR de revue de direction",
    "Liste des inspecteurs", "Liste des équipements", "Certificats d'étalonnage",
    "Police d'assurance", "Liste des sites clients", "Agrément",
    "Dossier de validation des méthodes", "Spécimen du rapport d'inspection",
  ],
  essais: [
    "Manuel qualité", "Politiques/procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Procédure d'incertitudes",
    "Gestion des risques", "Spécimen rapport d'essai", "Dossier validation des méthodes",
    "Liste des étalons/équipements", "Certificats d'étalonnage",
    "Procédure de surveillance", "Rapport essais d'aptitude",
  ],
  etalonnage: [
    "Manuel qualité", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Procédure d'incertitudes",
    "Feuilles de calcul", "Gestion des risques", "Spécimen certificat d'étalonnage",
    "Liste des étalons", "Équipements étalonnés en interne", "Certificats d'étalonnage",
    "Procédure de surveillance", "Dossiers de validation",
    "Rapport essais d'aptitude", "Liste du personnel habilité",
  ],
  examens_medicaux: [
    "Organigramme", "Modalités des biologistes", "Procédure examens urgents",
    "Procédures gestion du personnel", "Gestion du système d'information",
    "Procédure validation/vérification méthode", "Procédure CIQ/EEQ",
    "Résultats EEQ", "Procédure incertitudes", "Manuel qualité",
    "Liste des documents", "Planning audits internes", "Planning revues de direction",
    "Spécimen CR résultats", "Procédures SM", "Certificats d'étalonnage",
  ],
  essais_aptitude: [
    "Manuel SM", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Dossier complet campagne ILC",
    "Technique de valeur assignée", "Liste prestataires externes",
    "Spécimen rapports", "Procédure et matrice des risques",
  ],
  cert_sm: [
    "Manuel SM", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction",
    "Composition comité de décision + preuves de compétences",
    "Analyse de risque du comité d'impartialité", "Police d'assurance RC",
    "Liste des documents par référentiel (ISO 9001/14001/22000/45001)",
    "Matrice des compétences auditeurs", "Liste des clients certifiés",
    "Planning des audits pour witnessing",
  ],
  cert_produits: [
    "Liste des documents", "Procédures SM et technique",
    "Programme de certification + PV de validation", "Autorisation du propriétaire",
    "Audit interne", "Revue de direction", "Dispositif d'impartialité",
    "Liste des ressources", "Spécimen certificat",
    "Composition dispositif décisionnel",
    "Règles de gestion certificat/licence/marque",
    "Liste des produits certifiés", "Spécimen contrat", "Planning audits de suivi",
  ],
  cert_personnes: [
    "Manuel SM", "Dispositions SM", "Liste des documents",
    "Audit interne", "Revue de direction",
    "Composition des dispositifs de gestion/appels/impartialité",
    "Analyse des risques impartialité",
    "Programme de certification ISO/IEC 17024 + PV de validation",
    "Matrice des compétences évaluateurs", "Modèle de certificat",
    "Calendrier pour witnessing", "Liste des activités externalisées",
  ],
  transfert: [
    "Statut juridique de l'entité réceptrice",
    "Dispositions gestion des risques", "Spécimens de rapports/certificats",
    "Rapports d'évaluation les plus récents",
    "État d'avancement clôture des écarts",
    "Certificat d'accréditation de l'organisme cédant",
  ],
};

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
  statutJuridiqueAutre: string;
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
  { id: 8, title: "Formulaires techniques" },
  { id: 9, title: "Documents administratifs" },
  { id: 10, title: "Déclaration et signature" }
];

export default function OECRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
      aria-label="Changer de thème"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});

  // FOR form state
  const addForRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, fields: string[]) =>
    setter((prev) => [...prev, newRow(fields)]);
  const removeForRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, id: number) =>
    setter((prev) => prev.filter((r) => r.id !== id));
  const updateForRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, id: number, field: string, value: string) =>
    setter((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  // FOR 04 - Inspection
  const [for04Type, setFor04Type] = useState("");
  const [for04Domaines, setFor04Domaines] = useState<ForRow[]>([newRow(["domaine", "sousDomaine", "objetInspecte", "norme", "typeInspection"])]);
  const [for04Inspecteurs, setFor04Inspecteurs] = useState<ForRow[]>([newRow(["nom", "qualification", "domaineHabilitation", "experience", "statut"])]);
  const [for04Equipements, setFor04Equipements] = useState<ForRow[]>([newRow(["designation", "marqueModele", "noSerie", "gamme", "dateEtalonnage"])]);
  // FOR 05 - Essais
  const [for05Domaines, setFor05Domaines] = useState<ForRow[]>([newRow(["domaine", "sousDomaine", "produitMatrice", "essaiAnalyse", "methodeRef", "norme"])]);
  const [for05Methodes, setFor05Methodes] = useState<ForRow[]>([newRow(["reference", "titre", "type", "statutValidation"])]);
  const [for05Equipements, setFor05Equipements] = useState<ForRow[]>([newRow(["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage", "noCertificat"])]);
  const [for05Personnel, setFor05Personnel] = useState<ForRow[]>([newRow(["nom", "diplome", "specialite", "fonction", "experience", "habilitations"])]);
  const [for05ParticipationEIL, setFor05ParticipationEIL] = useState("");
  const [for05ProcedureIncertitudes, setFor05ProcedureIncertitudes] = useState("");
  // FOR 06 - Étalonnage
  const [for06Grandeurs, setFor06Grandeurs] = useState<ForRow[]>([newRow(["grandeur", "domaineMesure", "gamme", "cmc", "methode", "norme"])]);
  const [for06Etalons, setFor06Etalons] = useState<ForRow[]>([newRow(["designation", "noIdentification", "grandeur", "gamme", "incertitude", "tracabilite", "dateEtalonnage"])]);
  const [for06Equipements, setFor06Equipements] = useState<ForRow[]>([newRow(["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage"])]);
  const [for06Personnel, setFor06Personnel] = useState<ForRow[]>([newRow(["nom", "diplome", "specialite", "experience", "habilitations"])]);
  const [for06ConditionsEnv, setFor06ConditionsEnv] = useState("");
  // FOR 07 - Certification SM
  const [for07Referentiels, setFor07Referentiels] = useState<string[]>([]);
  const [for07Secteurs, setFor07Secteurs] = useState<ForRow[]>([newRow(["codeIAF", "description", "sousSecteurs", "nbAuditeurs"])]);
  const [for07Auditeurs, setFor07Auditeurs] = useState<ForRow[]>([newRow(["nom", "qualification", "secteursQualifies", "experienceAudits", "statut"])]);
  const [for07Comite, setFor07Comite] = useState<ForRow[]>([newRow(["nom", "fonction", "domaineCompetence", "representation"])]);
  const [for07NbClientsCertifies, setFor07NbClientsCertifies] = useState("");
  // FOR 05-1 - Laboratoires médicales
  const [for051Disciplines, setFor051Disciplines] = useState<ForRow[]>([newRow(["discipline", "typeExamen", "methode", "automate"])]);
  const [for051Personnel, setFor051Personnel] = useState<ForRow[]>([newRow(["nom", "qualification", "specialite", "fonction", "experience"])]);
  const [for051ParticipationEEQ, setFor051ParticipationEEQ] = useState("");
  // FOR 05-5 - Essais d'aptitude
  const [for055Programmes, setFor055Programmes] = useState<ForRow[]>([newRow(["domaine", "typeProgramme", "frequence", "nbParticipants", "methodeStatistique"])]);
  const [for055Personnel, setFor055Personnel] = useState<ForRow[]>([newRow(["nom", "qualification", "role", "experience"])]);
  // FOR 07-5 - Certification produits
  const [for075Produits, setFor075Produits] = useState<ForRow[]>([newRow(["categorie", "normeApplicable", "schemaCertification", "programme"])]);
  const [for075Evaluateurs, setFor075Evaluateurs] = useState<ForRow[]>([newRow(["nom", "qualification", "domaine", "experience"])]);
  // FOR 07-8 - Certification personnes
  const [for078Schemas, setFor078Schemas] = useState<ForRow[]>([newRow(["domaine", "referentiel", "niveau", "criteresEligibilite"])]);
  const [for078Evaluateurs, setFor078Evaluateurs] = useState<ForRow[]>([newRow(["nom", "qualification", "domaineCertifie", "experience"])]);
  
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
    statutJuridiqueAutre: "",
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

  const validateRows = (rows: Array<Record<string, any>>, keys: string[]): boolean => {
    if (!rows || rows.length === 0) return false;
    return rows.every((r) => keys.every((k) => String(r[k] ?? "").trim() !== ""));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.typeDemande) newErrors.typeDemande = "Le type de demande est requis";
      if (!formData.dateEvaluation) newErrors.dateEvaluation = "La date d'évaluation souhaitée est requise";
      if (formData.activites.length === 0) newErrors.activites = "Veuillez sélectionner au moins une activité";
      if (!formData.siteType) newErrors.siteType = "Le type de site est requis";
    }
    if (currentStep === 2) {
      if (!formData.nomLegal.trim()) newErrors.nomLegal = "Le nom légal est requis";
      if (!formData.statutJuridique) newErrors.statutJuridique = "Le statut juridique est requis";
      if (formData.statutJuridique === "Autre" && !formData.statutJuridiqueAutre?.trim()) newErrors.statutJuridiqueAutre = "Précisez le statut juridique";
      if (!formData.registreCommerce.trim()) newErrors.registreCommerce = "Le registre de commerce est requis";
      if (!formData.codesActivite.trim()) newErrors.codesActivite = "Les codes d'activité sont requis";
      if (!formData.adresseSiege.trim()) newErrors.adresseSiege = "L'adresse du siège est requise";
      if (!formData.email.trim()) newErrors.email = "L'email est requis";
      if (!formData.appartientGroupe) newErrors.appartientGroupe = "Indiquez si vous appartenez à un groupe";
      if (formData.appartientGroupe === "oui") {
        if (!formData.groupeNom.trim()) newErrors.groupeNom = "Nom du groupe requis";
        if (!formData.groupeRelation.trim()) newErrors.groupeRelation = "Type de relation requis";
      }
    }
    if (currentStep === 3) {
      if (!formData.contactNom.trim()) newErrors.contactNom = "Le nom du contact est requis";
      if (!formData.contactFonction.trim()) newErrors.contactFonction = "La fonction est requise";
      if (!formData.contactAdresse.trim()) newErrors.contactAdresse = "L'adresse du contact est requise";
      if (!formData.contactTelephone.trim()) newErrors.contactTelephone = "Le téléphone est requis";
      if (!formData.contactEmail.trim()) newErrors.contactEmail = "L'email du contact est requis";
    }
    if (currentStep === 4) {
      if (!validateRows(formData.sites, ["localisation", "adresse", "activites"])) {
        newErrors.sites = "Chaque site doit avoir localisation, adresse et activités";
      }
    }
    if (currentStep === 5) {
      if (!validateRows(formData.personnelSites, ["site", "permanents"])) newErrors.personnelSites = "Indiquez le personnel de chaque site";
      if (!validateRows(formData.responsablesTechniques, ["nom", "qualifications", "experience"])) newErrors.responsablesTechniques = "Remplissez les infos du responsable technique";
      if (!formData.responsableQualiteNom.trim()) newErrors.responsableQualiteNom = "Responsable qualité requis";
      if (!formData.responsableQualiteQualif.trim()) newErrors.responsableQualiteQualif = "Qualifications du responsable qualité requises";
      if (!formData.responsableQualiteExp.trim()) newErrors.responsableQualiteExp = "Expérience du responsable qualité requise";
    }
    if (currentStep === 6) {
      if (!formData.prestationConseil) newErrors.prestationConseil = "Indiquez si vous avez eu recours à des prestations de conseil";
      if (formData.prestationConseil === "oui") {
        if (formData.prestations.length === 0) newErrors.prestations = "Ajoutez au moins une prestation";
        else {
          const invalid = formData.prestations.some((pr) =>
            pr.types.length === 0 || !pr.prestataire.trim() || !pr.date || !pr.description.trim() ||
            (pr.types.includes("autre") && !(pr as any).autrePrecision?.toString().trim())
          );
          if (invalid) newErrors.prestations = "Complétez chaque prestation (type, prestataire, date, description)";
        }
      }
    }
    if (currentStep === 7) {
      if (formData.typeDemande === "transfert" && !formData.motifTransfert.trim()) newErrors.motifTransfert = "Le motif du transfert est requis";
    }
    if (currentStep === 8) {
      if (formData.activites.includes("inspection")) {
        if (!for04Type) newErrors.for04Type = "Type d'organisme d'inspection requis";
        if (!validateRows(for04Domaines, ["domaine", "objetInspecte", "norme"])) newErrors.for04Domaines = "Complétez les domaines d'inspection";
        if (!validateRows(for04Inspecteurs, ["nom", "qualification", "statut"])) newErrors.for04Inspecteurs = "Complétez le personnel d'inspection";
        if (!validateRows(for04Equipements, ["designation", "gamme"])) newErrors.for04Equipements = "Complétez les équipements";
      }
      if (formData.activites.includes("essais")) {
        if (!validateRows(for05Domaines, ["domaine", "essaiAnalyse", "methodeRef"])) newErrors.for05Domaines = "Complétez la portée d'essais";
        if (!validateRows(for05Methodes, ["reference", "titre"])) newErrors.for05Methodes = "Complétez les méthodes d'essai";
        if (!validateRows(for05Personnel, ["nom", "diplome", "fonction"])) newErrors.for05Personnel = "Complétez le personnel technique";
        if (!for05ProcedureIncertitudes.trim()) newErrors.for05ProcedureIncertitudes = "Procédure d'incertitudes requise";
      }
      if (formData.activites.includes("etalonnage")) {
        if (!validateRows(for06Grandeurs, ["grandeur", "gamme", "methode"])) newErrors.for06Grandeurs = "Complétez les grandeurs";
        if (!validateRows(for06Etalons, ["designation", "grandeur"])) newErrors.for06Etalons = "Complétez les étalons";
      }
      if (formData.activites.includes("cert_sm")) {
        if (for07Referentiels.length === 0) newErrors.for07Referentiels = "Sélectionnez au moins un référentiel";
        if (!validateRows(for07Secteurs, ["codeIAF", "description"])) newErrors.for07Secteurs = "Complétez les secteurs";
      }
      if (formData.activites.includes("examens_medicaux") && !validateRows(for051Disciplines, ["discipline", "typeExamen"])) {
        newErrors.for051Disciplines = "Complétez les disciplines";
      }
      const missingFile = Object.entries(formData.documentsChecked).some(([k, v]) => v && !documentFiles[k]);
      if (missingFile) newErrors.docsChecked = "Joignez un fichier à chaque document coché";
    }
    if (currentStep === 9) {
      const missing = Object.entries(formData.docsAdminChecked).some(([k, v]) => v && !documentFiles[`admin-${k}`]);
      if (missing) newErrors.docsAdminChecked = "Joignez un fichier à chaque document administratif coché";
    }
    if (currentStep === 10) {
      if (!formData.engagementsAcceptes) newErrors.engagements = "Vous devez accepter les engagements";
      if (!formData.demandeurNom.trim()) newErrors.demandeurNom = "Nom du demandeur requis";
      if (!formData.demandeurFonction.trim()) newErrors.demandeurFonction = "Fonction du demandeur requise";
      if (!formData.demandeurDate) newErrors.demandeurDate = "Date requise";
      if (!formData.signature.trim()) newErrors.signature = "Signature requise";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: "Champs requis manquants", description: Object.values(newErrors)[0] || "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
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
      const description = JSON.stringify({
        typeDemande: formData.typeDemande,
        dateEvaluation: formData.dateEvaluation,
        activites: formData.activites,
        siteType: formData.siteType,
        nomLegal: formData.nomLegal,
        abreviation: formData.abreviation,
        sigle: formData.sigle,
        statutJuridique: formData.statutJuridique === "Autre" ? `Autre: ${formData.statutJuridiqueAutre}` : formData.statutJuridique,
        registreCommerce: formData.registreCommerce,
        codesActivite: formData.codesActivite,
        adresseSiege: formData.adresseSiege,
        adresseFacturation: formData.adresseFacturation,
        emailOrg: formData.email,
        siteWeb: formData.siteWeb,
        appartientGroupe: formData.appartientGroupe,
        groupeNom: formData.groupeNom,
        groupeAdresse: formData.groupeAdresse,
        groupeRelation: formData.groupeRelation,
        groupeImpact: formData.groupeImpact,
        contactNom: formData.contactNom,
        contactFonction: formData.contactFonction,
        contactAdresse: formData.contactAdresse,
        contactTelephone: formData.contactTelephone,
        contactFax: formData.contactFax,
        contactEmail: formData.contactEmail,
        sites: formData.sites,
        personnelSites: formData.personnelSites,
        responsablesTechniques: formData.responsablesTechniques,
        responsableQualiteNom: formData.responsableQualiteNom,
        responsableQualiteQualif: formData.responsableQualiteQualif,
        responsableQualiteExp: formData.responsableQualiteExp,
        prestationConseil: formData.prestationConseil,
        prestations: formData.prestations,
        reconnaissances: formData.reconnaissances,
        motifTransfert: formData.motifTransfert,
        demandeurNom: formData.demandeurNom,
        demandeurFonction: formData.demandeurFonction,
        demandeurDate: formData.demandeurDate,
        signature: formData.signature,
        organismeSoumission: formData.organismeSoumission,
        technicalForms: {
          ...(formData.activites.includes("inspection") ? { for04: { typeOrganisme: for04Type, domaines: for04Domaines, inspecteurs: for04Inspecteurs, equipements: for04Equipements } } : {}),
          ...(formData.activites.includes("essais") ? { for05: { domaines: for05Domaines, methodes: for05Methodes, equipements: for05Equipements, personnel: for05Personnel, participationEIL: for05ParticipationEIL, procedureIncertitudes: for05ProcedureIncertitudes } } : {}),
          ...(formData.activites.includes("etalonnage") ? { for06: { grandeurs: for06Grandeurs, etalons: for06Etalons, equipements: for06Equipements, personnel: for06Personnel, conditionsEnvironnementales: for06ConditionsEnv } } : {}),
          ...(formData.activites.includes("cert_sm") ? { for07: { referentiels: for07Referentiels, secteurs: for07Secteurs, auditeurs: for07Auditeurs, comite: for07Comite, nbClientsCertifies: for07NbClientsCertifies } } : {}),
          ...(formData.activites.includes("examens_medicaux") ? { for051: { disciplines: for051Disciplines, personnel: for051Personnel, participationEEQ: for051ParticipationEEQ } } : {}),
          ...(formData.activites.includes("essais_aptitude") ? { for055: { programmes: for055Programmes, personnel: for055Personnel } } : {}),
          ...(formData.activites.includes("cert_produits") ? { for075: { produits: for075Produits, evaluateurs: for075Evaluateurs } } : {}),
          ...(formData.activites.includes("cert_personnes") ? { for078: { schemas: for078Schemas, evaluateurs: for078Evaluateurs } } : {}),
        },
        documents: docsList,
      });

      const payload = {
        nomOrganisme: formData.nomLegal,
        typeOrganisme: formData.statutJuridique === "Autre" ? formData.statutJuridiqueAutre || "Autre" : formData.statutJuridique || "OEC",
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
        description,
        documents: docsList.length > 0 ? docsList : undefined,
      };

      const response = await fetch("/api/auth/signup/oec", {
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
        <Label>Date d'évaluation souhaitée <span className="text-red-500">*</span></Label>
        <StringDatePicker
          value={formData.dateEvaluation}
          onChange={(v) => updateFormData("dateEvaluation", v)}
        />
        {errors.dateEvaluation && <p className="text-sm text-red-500">{errors.dateEvaluation}</p>}
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
        <Label className="text-base font-semibold">Type de site <span className="text-red-500">*</span></Label>
        {errors.siteType && <p className="text-sm text-red-500">{errors.siteType}</p>}
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
          {formData.statutJuridique === "Autre" && (
            <Input
              value={formData.statutJuridiqueAutre}
              onChange={(e) => updateFormData("statutJuridiqueAutre", e.target.value)}
              placeholder="Précisez le statut juridique *"
              className="mt-1"
            />
          )}
          {errors.statutJuridiqueAutre && <p className="text-sm text-red-500">{errors.statutJuridiqueAutre}</p>}
        </div>

        <div className="space-y-2">
          <Label>N° registre de commerce <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.registreCommerce}
            onChange={(e) => updateFormData("registreCommerce", e.target.value)}
            placeholder="Ex: 12-3456789-01"
          />
          {errors.registreCommerce && <p className="text-sm text-red-500">{errors.registreCommerce}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Codes d'activité <span className="text-red-500">*</span></Label>
          <Input 
            value={formData.codesActivite}
            onChange={(e) => updateFormData("codesActivite", e.target.value)}
            placeholder="Codes NAA"
          />
          {errors.codesActivite && <p className="text-sm text-red-500">{errors.codesActivite}</p>}
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
        <Label className="text-base font-semibold">Appartient à un groupe ? <span className="text-red-500">*</span></Label>
        {errors.appartientGroupe && <p className="text-sm text-red-500">{errors.appartientGroupe}</p>}
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
            <Label>Nom du groupe <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.groupeNom}
              onChange={(e) => updateFormData("groupeNom", e.target.value)}
              placeholder="Nom du groupe"
            />
            {errors.groupeNom && <p className="text-sm text-red-500">{errors.groupeNom}</p>}
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
            <Label>Type de relation <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.groupeRelation}
              onChange={(e) => updateFormData("groupeRelation", e.target.value)}
              placeholder="Ex: Filiale, Maison-mère"
            />
            {errors.groupeRelation && <p className="text-sm text-red-500">{errors.groupeRelation}</p>}
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
          <Label>Adresse <span className="text-red-500">*</span></Label>
          <Textarea 
            value={formData.contactAdresse}
            onChange={(e) => updateFormData("contactAdresse", e.target.value)}
            placeholder="Adresse du contact"
            rows={2}
          />
          {errors.contactAdresse && <p className="text-sm text-red-500">{errors.contactAdresse}</p>}
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
        <Label className="text-base font-semibold">Sites et activités <span className="text-red-500">*</span></Label>
        <Button type="button" onClick={addSite} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </Button>
      </div>
      {errors.sites && <p className="text-sm text-red-500">{errors.sites}</p>}

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
                  <Label className="text-sm">Site/Localisation <span className="text-red-500">*</span></Label>
                  <Input 
                    value={site.localisation}
                    onChange={(e) => updateSite(site.id, "localisation", e.target.value)}
                    placeholder="Nom du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Adresse <span className="text-red-500">*</span></Label>
                  <Input 
                    value={site.adresse}
                    onChange={(e) => updateSite(site.id, "adresse", e.target.value)}
                    placeholder="Adresse du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Activités réalisées sur site <span className="text-red-500">*</span></Label>
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
          <Label className="text-base font-semibold">Personnel par site <span className="text-red-500">*</span></Label>
          <Button type="button" onClick={addPersonnelSite} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {errors.personnelSites && <p className="text-sm text-red-500">{errors.personnelSites}</p>}

        <div className="space-y-3">
          {formData.personnelSites.map((ps) => (
            <Card key={ps.id} className="p-4">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-sm">Site <span className="text-red-500">*</span></Label>
                  <Input 
                    value={ps.site}
                    onChange={(e) => updatePersonnelSite(ps.id, "site", e.target.value)}
                    placeholder="Nom du site"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Personnel technique permanent <span className="text-red-500">*</span></Label>
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
          <Label className="text-base font-semibold">Responsable(s) technique(s) <span className="text-red-500">*</span></Label>
          <Button type="button" onClick={addResponsableTechnique} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {errors.responsablesTechniques && <p className="text-sm text-red-500">{errors.responsablesTechniques}</p>}

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
                    <Label className="text-sm">Nom complet <span className="text-red-500">*</span></Label>
                    <Input 
                      value={rt.nom}
                      onChange={(e) => updateResponsableTechnique(rt.id, "nom", e.target.value)}
                      placeholder="Nom et prénom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Qualifications <span className="text-red-500">*</span></Label>
                    <Input 
                      value={rt.qualifications}
                      onChange={(e) => updateResponsableTechnique(rt.id, "qualifications", e.target.value)}
                      placeholder="Diplômes, certifications"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Années d'expérience <span className="text-red-500">*</span></Label>
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
        <Label className="text-base font-semibold">Responsable qualité <span className="text-red-500">*</span></Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Nom complet <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.responsableQualiteNom}
              onChange={(e) => updateFormData("responsableQualiteNom", e.target.value)}
              placeholder="Nom et prénom"
            />
            {errors.responsableQualiteNom && <p className="text-sm text-red-500">{errors.responsableQualiteNom}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Qualifications <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.responsableQualiteQualif}
              onChange={(e) => updateFormData("responsableQualiteQualif", e.target.value)}
              placeholder="Diplômes, certifications"
            />
            {errors.responsableQualiteQualif && <p className="text-sm text-red-500">{errors.responsableQualiteQualif}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Années d'expérience dans la fonction <span className="text-red-500">*</span></Label>
            <Input 
              type="number"
              value={formData.responsableQualiteExp}
              onChange={(e) => updateFormData("responsableQualiteExp", e.target.value)}
              placeholder="Années"
            />
            {errors.responsableQualiteExp && <p className="text-sm text-red-500">{errors.responsableQualiteExp}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  // ÉTAPE 6: Prestations de conseil
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">L'organisme a-t-il eu recours à des prestations de conseil ? <span className="text-red-500">*</span></Label>
        {errors.prestationConseil && <p className="text-sm text-red-500">{errors.prestationConseil}</p>}
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
                    {prestation.types.includes("autre") && (
                      <div className="space-y-2">
                        <Label className="text-sm">Précisez le type de prestation <span className="text-red-500">*</span></Label>
                        <Input
                          value={(prestation as any).autrePrecision || ""}
                          onChange={(e) => updatePrestation(prestation.id, "autrePrecision" as any, e.target.value)}
                          placeholder="Détaillez la prestation..."
                        />
                      </div>
                    )}
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
        <div className="space-y-4 pt-6 border-t">
          <Label className="text-base font-semibold">Motif du transfert <span className="text-red-500">*</span></Label>
          <Textarea
            value={formData.motifTransfert}
            onChange={(e) => updateFormData("motifTransfert", e.target.value)}
            placeholder="Décrivez le motif du transfert"
            rows={3}
          />
          {errors.motifTransfert && <p className="text-sm text-red-500">{errors.motifTransfert}</p>}
        </div>
      )}
    </div>
  );

  // ÉTAPE 8: Documents techniques à joindre
  const renderFor04 = () => (
    <div className="space-y-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
      <h4 className="font-bold text-base text-blue-800">FOR 04 — Renseignements Techniques Inspection (ISO/IEC 17020)</h4>
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Type d'organisme d'inspection</Label>
        <RadioGroup value={for04Type} onValueChange={setFor04Type} className="flex gap-6">
          {["A", "B", "C"].map((t) => (<div key={t} className="flex items-center space-x-2"><RadioGroupItem value={t} id={`for04-${t}`} /><Label htmlFor={`for04-${t}`}>Type {t}</Label></div>))}
        </RadioGroup>
      </div>
      <DynamicTable title="Domaines d'inspection" columns={[
        { key: "domaine", label: "Domaine d'activité", placeholder: "Ex: Équipements sous pression" },
        { key: "sousDomaine", label: "Sous-domaine", placeholder: "Précisez" },
        { key: "objetInspecte", label: "Objet inspecté", placeholder: "Type d'objet" },
        { key: "norme", label: "Norme/Méthode", placeholder: "Référence" },
        { key: "typeInspection", label: "Type", placeholder: "Réglementaire/Client" },
      ]} rows={for04Domaines} onAdd={() => addForRow(setFor04Domaines, ["domaine", "sousDomaine", "objetInspecte", "norme", "typeInspection"])} onRemove={(id) => removeForRow(setFor04Domaines, id)} onUpdate={(id, f, v) => updateForRow(setFor04Domaines, id, f, v)} />
      <DynamicTable title="Personnel d'inspection" columns={[
        { key: "nom", label: "Nom & Prénom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification/Diplôme", placeholder: "Diplôme" },
        { key: "domaineHabilitation", label: "Domaine d'habilitation", placeholder: "Domaine" },
        { key: "experience", label: "Expérience (ans)", placeholder: "Années", type: "number" },
        { key: "statut", label: "Statut", placeholder: "Permanent/Vacataire" },
      ]} rows={for04Inspecteurs} onAdd={() => addForRow(setFor04Inspecteurs, ["nom", "qualification", "domaineHabilitation", "experience", "statut"])} onRemove={(id) => removeForRow(setFor04Inspecteurs, id)} onUpdate={(id, f, v) => updateForRow(setFor04Inspecteurs, id, f, v)} />
      <DynamicTable title="Équipements de mesure et d'essai" columns={[
        { key: "designation", label: "Désignation", placeholder: "Nom équipement" },
        { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
        { key: "noSerie", label: "N° de série", placeholder: "N° série" },
        { key: "gamme", label: "Gamme de mesure", placeholder: "Gamme" },
        { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "JJ/MM/AAAA" },
      ]} rows={for04Equipements} onAdd={() => addForRow(setFor04Equipements, ["designation", "marqueModele", "noSerie", "gamme", "dateEtalonnage"])} onRemove={(id) => removeForRow(setFor04Equipements, id)} onUpdate={(id, f, v) => updateForRow(setFor04Equipements, id, f, v)} />
    </div>
  );

  const renderFor05 = () => (
    <div className="space-y-6 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
      <h4 className="font-bold text-base text-green-800">FOR 05 — Renseignements Techniques Laboratoire d'Essais (ISO/IEC 17025)</h4>
      <DynamicTable title="Portée d'accréditation demandée" columns={[
        { key: "domaine", label: "Domaine", placeholder: "Ex: Chimie" },
        { key: "sousDomaine", label: "Sous-domaine", placeholder: "Précisez" },
        { key: "produitMatrice", label: "Produit/Matrice", placeholder: "Type produit" },
        { key: "essaiAnalyse", label: "Essai/Analyse", placeholder: "Type essai" },
        { key: "methodeRef", label: "Méthode", placeholder: "Référence" },
        { key: "norme", label: "Norme", placeholder: "ISO/NF..." },
      ]} rows={for05Domaines} onAdd={() => addForRow(setFor05Domaines, ["domaine", "sousDomaine", "produitMatrice", "essaiAnalyse", "methodeRef", "norme"])} onRemove={(id) => removeForRow(setFor05Domaines, id)} onUpdate={(id, f, v) => updateForRow(setFor05Domaines, id, f, v)} />
      <DynamicTable title="Méthodes d'essai" columns={[
        { key: "reference", label: "Référence", placeholder: "Réf. méthode" },
        { key: "titre", label: "Titre", placeholder: "Titre de la méthode" },
        { key: "type", label: "Type", placeholder: "Normative/Interne" },
        { key: "statutValidation", label: "Statut validation", placeholder: "Validée/En cours" },
      ]} rows={for05Methodes} onAdd={() => addForRow(setFor05Methodes, ["reference", "titre", "type", "statutValidation"])} onRemove={(id) => removeForRow(setFor05Methodes, id)} onUpdate={(id, f, v) => updateForRow(setFor05Methodes, id, f, v)} />
      <DynamicTable title="Équipements principaux" columns={[
        { key: "designation", label: "Désignation", placeholder: "Nom" },
        { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
        { key: "gamme", label: "Gamme", placeholder: "Gamme mesure" },
        { key: "resolution", label: "Résolution", placeholder: "Résolution" },
        { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
        { key: "noCertificat", label: "N° certificat", placeholder: "N°" },
      ]} rows={for05Equipements} onAdd={() => addForRow(setFor05Equipements, ["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage", "noCertificat"])} onRemove={(id) => removeForRow(setFor05Equipements, id)} onUpdate={(id, f, v) => updateForRow(setFor05Equipements, id, f, v)} />
      <DynamicTable title="Personnel technique" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "diplome", label: "Diplôme", placeholder: "Diplôme" },
        { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
        { key: "fonction", label: "Fonction", placeholder: "Fonction" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        { key: "habilitations", label: "Habilitations", placeholder: "Domaines" },
      ]} rows={for05Personnel} onAdd={() => addForRow(setFor05Personnel, ["nom", "diplome", "specialite", "fonction", "experience", "habilitations"])} onRemove={(id) => removeForRow(setFor05Personnel, id)} onUpdate={(id, f, v) => updateForRow(setFor05Personnel, id, f, v)} />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label className="text-sm">Participation aux essais d'aptitude (EIL)</Label><Textarea value={for05ParticipationEIL} onChange={(e) => setFor05ParticipationEIL(e.target.value)} placeholder="Programmes, fournisseurs, résultats..." rows={2} /></div>
        <div className="space-y-2"><Label className="text-sm">Procédure d'estimation des incertitudes</Label><Textarea value={for05ProcedureIncertitudes} onChange={(e) => setFor05ProcedureIncertitudes(e.target.value)} placeholder="Décrivez la procédure..." rows={2} /></div>
      </div>
    </div>
  );

  const renderFor06 = () => (
    <div className="space-y-6 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/30">
      <h4 className="font-bold text-base text-purple-800">FOR 06 — Renseignements Techniques Laboratoire d'Étalonnage (ISO/IEC 17025)</h4>
      <DynamicTable title="Portée d'accréditation — Grandeurs et gammes" columns={[
        { key: "grandeur", label: "Grandeur", placeholder: "Ex: Masse" },
        { key: "domaineMesure", label: "Domaine mesure", placeholder: "Précisez" },
        { key: "gamme", label: "Gamme", placeholder: "Min - Max" },
        { key: "cmc", label: "CMC", placeholder: "Incertitude meilleure" },
        { key: "methode", label: "Méthode", placeholder: "Méthode" },
        { key: "norme", label: "Norme", placeholder: "Référence" },
      ]} rows={for06Grandeurs} onAdd={() => addForRow(setFor06Grandeurs, ["grandeur", "domaineMesure", "gamme", "cmc", "methode", "norme"])} onRemove={(id) => removeForRow(setFor06Grandeurs, id)} onUpdate={(id, f, v) => updateForRow(setFor06Grandeurs, id, f, v)} />
      <DynamicTable title="Étalons de référence" columns={[
        { key: "designation", label: "Désignation", placeholder: "Nom" },
        { key: "noIdentification", label: "N° identification", placeholder: "N°" },
        { key: "grandeur", label: "Grandeur", placeholder: "Grandeur" },
        { key: "gamme", label: "Gamme", placeholder: "Gamme" },
        { key: "incertitude", label: "Incertitude", placeholder: "U" },
        { key: "tracabilite", label: "Traçabilité", placeholder: "Organisme" },
        { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
      ]} rows={for06Etalons} onAdd={() => addForRow(setFor06Etalons, ["designation", "noIdentification", "grandeur", "gamme", "incertitude", "tracabilite", "dateEtalonnage"])} onRemove={(id) => removeForRow(setFor06Etalons, id)} onUpdate={(id, f, v) => updateForRow(setFor06Etalons, id, f, v)} />
      <DynamicTable title="Équipements" columns={[
        { key: "designation", label: "Désignation", placeholder: "Nom" },
        { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
        { key: "gamme", label: "Gamme", placeholder: "Gamme" },
        { key: "resolution", label: "Résolution", placeholder: "Résolution" },
        { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
      ]} rows={for06Equipements} onAdd={() => addForRow(setFor06Equipements, ["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage"])} onRemove={(id) => removeForRow(setFor06Equipements, id)} onUpdate={(id, f, v) => updateForRow(setFor06Equipements, id, f, v)} />
      <DynamicTable title="Personnel technique" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "diplome", label: "Diplôme", placeholder: "Diplôme" },
        { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        { key: "habilitations", label: "Habilitations", placeholder: "Domaines" },
      ]} rows={for06Personnel} onAdd={() => addForRow(setFor06Personnel, ["nom", "diplome", "specialite", "experience", "habilitations"])} onRemove={(id) => removeForRow(setFor06Personnel, id)} onUpdate={(id, f, v) => updateForRow(setFor06Personnel, id, f, v)} />
      <div className="space-y-2"><Label className="text-sm">Conditions environnementales (température, humidité, contrôle)</Label><Textarea value={for06ConditionsEnv} onChange={(e) => setFor06ConditionsEnv(e.target.value)} placeholder="Décrivez les conditions environnementales du laboratoire..." rows={2} /></div>
    </div>
  );

  const renderFor07 = () => (
    <div className="space-y-6 p-4 border-2 border-orange-200 rounded-lg bg-orange-50/30">
      <h4 className="font-bold text-base text-orange-800">FOR 07 — Renseignements Techniques Certification SM (ISO/IEC 17021-1)</h4>
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Référentiels de certification couverts</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["ISO 9001", "ISO 14001", "ISO 22000", "ISO 45001", "ISO 50001", "ISO 13485", "ISO 27001", "ISO 22301"].map((ref) => (
            <div key={ref} className="flex items-center space-x-2">
              <Checkbox id={`for07-${ref}`} checked={for07Referentiels.includes(ref)} onCheckedChange={(checked) => setFor07Referentiels((prev) => checked ? [...prev, ref] : prev.filter((r) => r !== ref))} />
              <Label htmlFor={`for07-${ref}`} className="text-sm cursor-pointer">{ref}</Label>
            </div>
          ))}
        </div>
      </div>
      <DynamicTable title="Secteurs d'activité (codes IAF/EA)" columns={[
        { key: "codeIAF", label: "Code IAF", placeholder: "Ex: IAF 01" },
        { key: "description", label: "Description", placeholder: "Description secteur" },
        { key: "sousSecteurs", label: "Sous-secteurs", placeholder: "Précisez" },
        { key: "nbAuditeurs", label: "Nb auditeurs qualifiés", placeholder: "N", type: "number" },
      ]} rows={for07Secteurs} onAdd={() => addForRow(setFor07Secteurs, ["codeIAF", "description", "sousSecteurs", "nbAuditeurs"])} onRemove={(id) => removeForRow(setFor07Secteurs, id)} onUpdate={(id, f, v) => updateForRow(setFor07Secteurs, id, f, v)} />
      <DynamicTable title="Liste des auditeurs" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification", placeholder: "Qualification" },
        { key: "secteursQualifies", label: "Secteurs qualifiés", placeholder: "Codes IAF" },
        { key: "experienceAudits", label: "Exp. audits (ans)", placeholder: "Années", type: "number" },
        { key: "statut", label: "Statut", placeholder: "Permanent/Contractuel" },
      ]} rows={for07Auditeurs} onAdd={() => addForRow(setFor07Auditeurs, ["nom", "qualification", "secteursQualifies", "experienceAudits", "statut"])} onRemove={(id) => removeForRow(setFor07Auditeurs, id)} onUpdate={(id, f, v) => updateForRow(setFor07Auditeurs, id, f, v)} />
      <DynamicTable title="Comité de décision de certification" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "fonction", label: "Fonction", placeholder: "Fonction" },
        { key: "domaineCompetence", label: "Domaine compétence", placeholder: "Domaine" },
        { key: "representation", label: "Représentation", placeholder: "Partie prenante" },
      ]} rows={for07Comite} onAdd={() => addForRow(setFor07Comite, ["nom", "fonction", "domaineCompetence", "representation"])} onRemove={(id) => removeForRow(setFor07Comite, id)} onUpdate={(id, f, v) => updateForRow(setFor07Comite, id, f, v)} />
      <div className="space-y-2"><Label className="text-sm">Nombre de clients certifiés</Label><Input value={for07NbClientsCertifies} onChange={(e) => setFor07NbClientsCertifies(e.target.value)} placeholder="Nombre total" type="number" /></div>
    </div>
  );

  const renderFor051 = () => (
    <div className="space-y-6 p-4 border-2 border-rose-200 rounded-lg bg-rose-50/30">
      <h4 className="font-bold text-base text-rose-800">FOR 05-1 — Renseignements Techniques Laboratoire Médical (ISO 15189)</h4>
      <DynamicTable title="Disciplines et examens" columns={[
        { key: "discipline", label: "Discipline", placeholder: "Ex: Biochimie" },
        { key: "typeExamen", label: "Type d'examen", placeholder: "Type" },
        { key: "methode", label: "Méthode", placeholder: "Méthode" },
        { key: "automate", label: "Automate/Équipement", placeholder: "Équipement" },
      ]} rows={for051Disciplines} onAdd={() => addForRow(setFor051Disciplines, ["discipline", "typeExamen", "methode", "automate"])} onRemove={(id) => removeForRow(setFor051Disciplines, id)} onUpdate={(id, f, v) => updateForRow(setFor051Disciplines, id, f, v)} />
      <DynamicTable title="Personnel médical" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification", placeholder: "Diplôme" },
        { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
        { key: "fonction", label: "Fonction", placeholder: "Fonction" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
      ]} rows={for051Personnel} onAdd={() => addForRow(setFor051Personnel, ["nom", "qualification", "specialite", "fonction", "experience"])} onRemove={(id) => removeForRow(setFor051Personnel, id)} onUpdate={(id, f, v) => updateForRow(setFor051Personnel, id, f, v)} />
      <div className="space-y-2"><Label className="text-sm">Participation aux EEQ (programmes, fournisseurs)</Label><Textarea value={for051ParticipationEEQ} onChange={(e) => setFor051ParticipationEEQ(e.target.value)} placeholder="Programmes EEQ, fournisseurs, résultats..." rows={2} /></div>
    </div>
  );

  const renderFor055 = () => (
    <div className="space-y-6 p-4 border-2 border-teal-200 rounded-lg bg-teal-50/30">
      <h4 className="font-bold text-base text-teal-800">FOR 05-5 — Renseignements Techniques Essais d'Aptitude (ISO/IEC 17043)</h4>
      <DynamicTable title="Programmes d'essais d'aptitude" columns={[
        { key: "domaine", label: "Domaine", placeholder: "Domaine" },
        { key: "typeProgramme", label: "Type programme", placeholder: "Type" },
        { key: "frequence", label: "Fréquence", placeholder: "Fréquence" },
        { key: "nbParticipants", label: "Nb participants", placeholder: "N", type: "number" },
        { key: "methodeStatistique", label: "Méthode statistique", placeholder: "Méthode" },
      ]} rows={for055Programmes} onAdd={() => addForRow(setFor055Programmes, ["domaine", "typeProgramme", "frequence", "nbParticipants", "methodeStatistique"])} onRemove={(id) => removeForRow(setFor055Programmes, id)} onUpdate={(id, f, v) => updateForRow(setFor055Programmes, id, f, v)} />
      <DynamicTable title="Personnel" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification", placeholder: "Qualification" },
        { key: "role", label: "Rôle", placeholder: "Rôle" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
      ]} rows={for055Personnel} onAdd={() => addForRow(setFor055Personnel, ["nom", "qualification", "role", "experience"])} onRemove={(id) => removeForRow(setFor055Personnel, id)} onUpdate={(id, f, v) => updateForRow(setFor055Personnel, id, f, v)} />
    </div>
  );

  const renderFor075 = () => (
    <div className="space-y-6 p-4 border-2 border-amber-200 rounded-lg bg-amber-50/30">
      <h4 className="font-bold text-base text-amber-800">FOR 07-5 — Renseignements Techniques Certification Produits (ISO/IEC 17065)</h4>
      <DynamicTable title="Produits/Services couverts" columns={[
        { key: "categorie", label: "Catégorie", placeholder: "Catégorie produit" },
        { key: "normeApplicable", label: "Norme applicable", placeholder: "Norme/Règlement" },
        { key: "schemaCertification", label: "Schéma", placeholder: "Schéma certification" },
        { key: "programme", label: "Programme", placeholder: "Programme" },
      ]} rows={for075Produits} onAdd={() => addForRow(setFor075Produits, ["categorie", "normeApplicable", "schemaCertification", "programme"])} onRemove={(id) => removeForRow(setFor075Produits, id)} onUpdate={(id, f, v) => updateForRow(setFor075Produits, id, f, v)} />
      <DynamicTable title="Personnel d'évaluation" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification", placeholder: "Qualification" },
        { key: "domaine", label: "Domaine", placeholder: "Domaine" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
      ]} rows={for075Evaluateurs} onAdd={() => addForRow(setFor075Evaluateurs, ["nom", "qualification", "domaine", "experience"])} onRemove={(id) => removeForRow(setFor075Evaluateurs, id)} onUpdate={(id, f, v) => updateForRow(setFor075Evaluateurs, id, f, v)} />
    </div>
  );

  const renderFor078 = () => (
    <div className="space-y-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50/30">
      <h4 className="font-bold text-base text-indigo-800">FOR 07-8 — Renseignements Techniques Certification Personnes (ISO/IEC 17024)</h4>
      <DynamicTable title="Schémas de certification" columns={[
        { key: "domaine", label: "Domaine", placeholder: "Domaine" },
        { key: "referentiel", label: "Référentiel", placeholder: "Norme/Référentiel" },
        { key: "niveau", label: "Niveau", placeholder: "Niveau" },
        { key: "criteresEligibilite", label: "Critères d'éligibilité", placeholder: "Critères" },
      ]} rows={for078Schemas} onAdd={() => addForRow(setFor078Schemas, ["domaine", "referentiel", "niveau", "criteresEligibilite"])} onRemove={(id) => removeForRow(setFor078Schemas, id)} onUpdate={(id, f, v) => updateForRow(setFor078Schemas, id, f, v)} />
      <DynamicTable title="Évaluateurs" columns={[
        { key: "nom", label: "Nom", placeholder: "Nom complet" },
        { key: "qualification", label: "Qualification", placeholder: "Qualification" },
        { key: "domaineCertifie", label: "Domaine certifié", placeholder: "Domaine" },
        { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
      ]} rows={for078Evaluateurs} onAdd={() => addForRow(setFor078Evaluateurs, ["nom", "qualification", "domaineCertifie", "experience"])} onRemove={(id) => removeForRow(setFor078Evaluateurs, id)} onUpdate={(id, f, v) => updateForRow(setFor078Evaluateurs, id, f, v)} />
    </div>
  );

  const renderStep8 = () => {
    const selectedActivities = formData.activites;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Formulaires techniques à remplir</h3>
          <p className="text-sm text-slate-600 mb-4">
            Remplissez les formulaires techniques correspondant à vos activités sélectionnées, puis joignez les documents complémentaires requis.
          </p>
        </div>

        {selectedActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            Veuillez sélectionner au moins une activité à l'étape 1 pour voir les formulaires requis
          </div>
        ) : (
          <div className="space-y-8">
            {/* Fillable FOR forms */}
            {selectedActivities.includes("inspection") && renderFor04()}
            {selectedActivities.includes("essais") && renderFor05()}
            {selectedActivities.includes("etalonnage") && renderFor06()}
            {selectedActivities.includes("cert_sm") && renderFor07()}
            {selectedActivities.includes("examens_medicaux") && renderFor051()}
            {selectedActivities.includes("essais_aptitude") && renderFor055()}
            {selectedActivities.includes("cert_produits") && renderFor075()}
            {selectedActivities.includes("cert_personnes") && renderFor078()}

            {/* Non-FOR documents to upload */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Documents complémentaires à joindre</h3>
              <p className="text-sm text-slate-600">Cochez chaque document que vous inclurez et joignez le fichier correspondant.</p>

              {selectedActivities.map(activity => {
                const activityLabel = TYPES_ACTIVITES.find(a => a.value === activity)?.label || activity;
                const docs = UPLOAD_DOCS[activity] || [];
                if (docs.length === 0) return null;
                return (
                  <div key={activity} className="space-y-3">
                    <h4 className="font-semibold text-sm text-[#00A63E]">{activityLabel}</h4>
                    <div className="space-y-2 pl-4">
                      {docs.map((doc, idx) => {
                        const key = `${activity}-${doc}`;
                        return (
                          <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                            <Checkbox
                              id={`doc-${key}`}
                              checked={!!formData.documentsChecked[key]}
                              onCheckedChange={() => toggleDocumentCheck(key)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                              {!!formData.documentsChecked[key] && (
                                <div className="mt-1">
                                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) setDocumentFiles(prev => ({ ...prev, [key]: file })); }} className="text-xs w-full" />
                                  {documentFiles[key] && <p className="text-xs text-green-600 mt-0.5">{documentFiles[key].name}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {formData.typeDemande === "transfert" && (UPLOAD_DOCS.transfert || []).length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm text-[#00A63E]">Annexe 09 - Documents de transfert</h4>
                  <div className="space-y-2 pl-4">
                    {(UPLOAD_DOCS.transfert || []).map((doc, idx) => {
                      const key = `transfert-${doc}`;
                      return (
                        <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                          <Checkbox id={`doc-${key}`} checked={!!formData.documentsChecked[key]} onCheckedChange={() => toggleDocumentCheck(key)} />
                          <div className="flex-1">
                            <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                            {!!formData.documentsChecked[key] && (
                              <div className="mt-1">
                                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) setDocumentFiles(prev => ({ ...prev, [key]: file })); }} className="text-xs w-full" />
                                {documentFiles[key] && <p className="text-xs text-green-600 mt-0.5">{documentFiles[key].name}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-slate-950 transition-colors registration-wizard">
      {/* Fixed top header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60 sticky top-0 z-20 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-[#00A63E] leading-tight">ALGERAC</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Demande d'Accréditation OEC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
              <Link href="/auth/register">
                <ChevronLeft className="w-4 h-4 mr-1" /> Retour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Progress section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200/60 dark:border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Étape {currentStep} sur {STEPS.length}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{STEPS[currentStep - 1].title}</p>
            </div>
            <span className="text-sm font-medium text-[#00A63E] bg-[#00A63E]/8 px-3 py-1 rounded-full">
              {Math.round((currentStep / STEPS.length) * 100)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
                    : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600"
                )}>
                  {step.id < currentStep ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : step.id}
                </div>
                <span className="text-[10px] mt-1.5 text-center hidden md:block max-w-[80px] text-gray-600 dark:text-slate-400">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200/60 dark:border-slate-700/60">
          <div className="p-6 md:p-10">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={prevStep}
                  className="gap-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
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
