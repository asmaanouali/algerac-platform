import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CheckCircle, CreditCard, ArrowRight, ChevronLeft, AlertCircle, Plus, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPES_DEMANDE = [
  { value: "initiale", label: "Accréditation initiale" },
  { value: "extension", label: "Extension" },
  { value: "renouvellement", label: "Renouvellement" },
  { value: "transfert", label: "Transfert" },
];

const TYPES_ACTIVITES = [
  { value: "inspection", label: "Inspection" },
  { value: "essais", label: "Essais" },
  { value: "etalonnage", label: "Étalonnage" },
  { value: "examens_medicaux", label: "Examens médicaux" },
  { value: "essais_aptitude", label: "Essais d'aptitude" },
  { value: "cert_sm", label: "Certification SM" },
  { value: "cert_produits", label: "Certification produits/procédés/services" },
  { value: "cert_personnes", label: "Certification personnes" },
];

const STATUTS_JURIDIQUES = ["EURL", "SARL", "SPA", "EPE", "EPIC", "Autre"];
const REQUIRES_AUTRE_TEXT = "Autre";

const TYPES_SITES = [
  { value: "monosite", label: "Monosite" },
  { value: "multisites", label: "Multisites" },
];

// PRO 26 §5.1 — 6 qualification criteria keys (labels resolved via t())
const MULTISITE_CRITERIA_KEYS: string[] = [
  "legalLink", "centralSM", "commonSM", "internalAudit", "centralMgmt", "dataCapacity",
];

const TYPES_PRESTATION = [
  { value: "accompagnement", label: "Accompagnement" },
  { value: "formation", label: "Formation" },
  { value: "audit_interne", label: "Audit interne" },
  { value: "autre", label: "Autre" },
];

const DOCS_ADMIN = [
  "Copie des statuts de l'organisme",
  "Copie de la carte d'immatriculation fiscale (NIS, NIF)",
  "Copie du N° article d'imposition",
  "Copie du registre de commerce",
  "Chèque à l'ordre d'ALGERAC (organismes nationaux)",
  "Ordre de virement à l'ordre d'ALGERAC (organismes étrangers)",
];

// Documents à joindre (non-FOR) par activité
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

const TYPE_MAP: Record<string, string> = {
  initiale: "INITIAL",
  extension: "EXTENSION",
  renouvellement: "RENOUVELLEMENT",
  transfert: "EXTENSION",
};

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
  { id: 10, title: "Déclaration et signature" },
];

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface Site {
  id: number; localisation: string; adresse: string; activites: string; soustraitance: string; ebmd: string;
}
interface PersonnelSite {
  id: number; site: string; permanents: string; vacataires: string;
}
interface ResponsableTechnique {
  id: number; nom: string; qualifications: string; experience: string;
}
interface PrestationConseil {
  id: number; types: string[]; prestataire: string; date: string; description: string; autrePrecision?: string;
}
interface Reconnaissance {
  id: number; organisation: string; domaine: string; validite: string;
}
interface ForRow {
  id: number; [key: string]: string | number;
}

// ── Helper: DynamicTable ───────────────────────────────────────────────────────

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
        <Button type="button" onClick={onAdd} size="sm" variant="outline" className="gap-1 h-8 text-xs">
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(row.id)} className="h-7 w-7 p-0">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
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

// ── Helper: generic row management ─────────────────────────────────────────────

function newRow(fields: string[]): ForRow {
  const row: ForRow = { id: Date.now() + Math.random() };
  fields.forEach((f) => { row[f] = ""; });
  return row;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function NewRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── DOC1 Fields ──
  const [typeDemande, setTypeDemande] = useState("");
  const [dateEvaluation, setDateEvaluation] = useState("");
  const [activites, setActivites] = useState<string[]>([]);
  const [siteType, setSiteType] = useState("");

  // Organisme
  const [nomLegal, setNomLegal] = useState("");
  const [abreviation, setAbreviation] = useState("");
  const [sigle, setSigle] = useState("");
  const [statutJuridique, setStatutJuridique] = useState("");
  const [statutJuridiqueAutre, setStatutJuridiqueAutre] = useState("");
  const [registreCommerce, setRegistreCommerce] = useState("");
  const [codesActivite, setCodesActivite] = useState("");
  const [adresseSiege, setAdresseSiege] = useState("");
  const [adresseFacturation, setAdresseFacturation] = useState("");
  const [emailOrg, setEmailOrg] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [appartientGroupe, setAppartientGroupe] = useState("");
  const [groupeNom, setGroupeNom] = useState("");
  const [groupeAdresse, setGroupeAdresse] = useState("");
  const [groupeRelation, setGroupeRelation] = useState("");
  const [groupeImpact, setGroupeImpact] = useState("");

  // Contact
  const [contactNom, setContactNom] = useState("");
  const [contactFonction, setContactFonction] = useState("");
  const [contactAdresse, setContactAdresse] = useState("");
  const [contactTelephone, setContactTelephone] = useState("");
  const [contactFax, setContactFax] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Sites & Personnel
  const [sites, setSites] = useState<Site[]>([{ id: 1, localisation: "", adresse: "", activites: "", soustraitance: "", ebmd: "" }]);
  const [personnelSites, setPersonnelSites] = useState<PersonnelSite[]>([{ id: 1, site: "", permanents: "", vacataires: "" }]);
  const [responsablesTechniques, setResponsablesTechniques] = useState<ResponsableTechnique[]>([{ id: 1, nom: "", qualifications: "", experience: "" }]);
  const [responsableQualiteNom, setResponsableQualiteNom] = useState("");

  // ── PRO 26: Multisites ─────────────────────────────────────────────────────
  // Siège central (HQ)
  const [msMainSiteName, setMsMainSiteName] = useState("");
  const [msMainSiteAddress, setMsMainSiteAddress] = useState("");
  const [msMainSiteContactName, setMsMainSiteContactName] = useState("");
  const [msMainSiteContactEmail, setMsMainSiteContactEmail] = useState("");
  const [msCentralizedSM, setMsCentralizedSM] = useState(true);
  const [msSMDescription, setMsSMDescription] = useState("");
  const [msInterSiteExchangesDoc, setMsInterSiteExchangesDoc] = useState("");

  // Sites satellites (PRO 26 §5.2-2)
  const [satelliteSites, setSatelliteSites] = useState<
    { id: number; name: string; address: string; activities: string; personnel: string; isInScope: boolean }[]
  >([{ id: 1, name: "", address: "", activities: "", personnel: "", isInScope: true }]);

  const [msCriteria, setMsCriteria] = useState<Record<string, { checked: boolean; justification: string }>>({
    legalLink:    { checked: false, justification: "" },
    centralSM:    { checked: false, justification: "" },
    commonSM:     { checked: false, justification: "" },
    internalAudit:{ checked: false, justification: "" },
    centralMgmt:  { checked: false, justification: "" },
    dataCapacity: { checked: false, justification: "" },
  });
  const [responsableQualiteQualif, setResponsableQualiteQualif] = useState("");
  const [responsableQualiteExp, setResponsableQualiteExp] = useState("");

  // Conseil
  const [prestationConseil, setPrestationConseil] = useState("");
  const [prestations, setPrestations] = useState<PrestationConseil[]>([]);

  // Reconnaissances
  const [reconnaissances, setReconnaissances] = useState<Reconnaissance[]>([{ id: 1, organisation: "", domaine: "", validite: "" }]);
  const [motifTransfert, setMotifTransfert] = useState("");

  // Technical docs uploads (non-FOR)
  const [docsChecked, setDocsChecked] = useState<Record<string, boolean>>({});

  // Admin docs
  const [docsAdminChecked, setDocsAdminChecked] = useState<Record<string, boolean>>({});

  // Declaration
  const [organismeSoumission, setOrganismeSoumission] = useState("");
  const [demandeurNom, setDemandeurNom] = useState("");
  const [demandeurFonction, setDemandeurFonction] = useState("");
  const [demandeurDate, setDemandeurDate] = useState(new Date().toISOString().split("T")[0]);
  const [signature, setSignature] = useState("");
  const [engagementsAcceptes, setEngagementsAcceptes] = useState(false);

  // ── FOR Form Data ──
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

  // ── Pre-fill from user profile ──
  useEffect(() => {
    if (user) {
      setNomLegal((user as any).organizationName || user.fullName || "");
      setAdresseSiege((user as any).adresseSiege || "");
      setEmailOrg(user.email || "");
      setContactNom((user as any).nomRepresentant || user.fullName || "");
      setContactFonction((user as any).fonction || "");
      setContactTelephone((user as any).phone || (user as any).telephoneDirect || "");
      setContactEmail((user as any).emailProfessionnel || user.email || "");
      setStatutJuridique((user as any).typeOrganisme || "");
      setOrganismeSoumission((user as any).organizationName || user.fullName || "");
      setDemandeurNom((user as any).nomRepresentant || user.fullName || "");
      setDemandeurFonction((user as any).fonction || "");
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  // ── Helpers ──
  const toggleActivite = (val: string) =>
    setActivites((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);

  const toggleDoc = (key: string) =>
    setDocsChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleDocAdmin = (doc: string) =>
    setDocsAdminChecked((prev) => ({ ...prev, [doc]: !prev[doc] }));

  const addRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, fields: string[]) =>
    setter((prev) => [...prev, newRow(fields)]);

  const removeRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, id: number) =>
    setter((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (setter: React.Dispatch<React.SetStateAction<ForRow[]>>, id: number, field: string, value: string) =>
    setter((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  // ── Demo Fill (dev only) ──
  const fillDemo = (type: string) => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    // Step 1
    setTypeDemande(type);
    setDateEvaluation(futureDateStr);
    setActivites(["inspection"]);
    setSiteType("monosite");

    // Step 2
    setNomLegal("LABO DEMO SARL");
    setAbreviation("LDEMO");
    setSigle("LD");
    setStatutJuridique("SARL");
    setRegistreCommerce("16B1234567");
    setCodesActivite("7120 – Services d'essais et analyses techniques");
    setAdresseSiege("12 Rue des Labos, Alger");
    setAdresseFacturation("12 Rue des Labos, Alger");
    setEmailOrg("contact@labodemo.dz");
    setSiteWeb("www.labodemo.dz");
    setAppartientGroupe("non");

    // Step 3
    setContactNom("Ahmed Bensalem");
    setContactFonction("Directeur Qualité");
    setContactAdresse("12 Rue des Labos, Alger");
    setContactTelephone("+213 555 123 456");
    setContactFax("+213 21 123 456");
    setContactEmail("ahmed.bensalem@labodemo.dz");

    // Step 4
    setSites([{ id: 1, localisation: "Alger", adresse: "12 Rue des Labos, Alger", activites: "Inspection", soustraitance: "Non", ebmd: "Non" }]);

    // Step 5
    setPersonnelSites([{ id: 1, site: "Alger", permanents: "10", vacataires: "3" }]);
    setResponsablesTechniques([{ id: 1, nom: "Karim Zouaoui", qualifications: "Ingénieur génie industriel", experience: "8 ans" }]);
    setResponsableQualiteNom("Fatima Cherif");
    setResponsableQualiteQualif("Master Qualité");
    setResponsableQualiteExp("5 ans");

    // Step 6
    setPrestationConseil("non");

    // Step 7
    setReconnaissances([{ id: 1, organisation: "IAF", domaine: "Inspection industrielle", validite: "2025" }]);
    if (type === "transfert") setMotifTransfert("Transfert suite à réorganisation interne de l'organisme.");
    else setMotifTransfert("");

    // Step 8 – FOR 04 (inspection)
    setFor04Type("A");
    setFor04Domaines([{ id: Date.now(), domaine: "Équipements sous pression", sousDomaine: "Chaudières", objetInspecte: "Chaudière industrielle", norme: "EN 13445", typeInspection: "Périodique" }]);
    setFor04Inspecteurs([{ id: Date.now() + 1, nom: "Mourad Kaci", qualification: "Ingénieur mécanique", domaineHabilitation: "Équipements sous pression", experience: "6", statut: "Permanent" }]);
    setFor04Equipements([{ id: Date.now() + 2, designation: "Étalon de pression", marqueModele: "Fluke 700", noSerie: "SN-001", gamme: "0–600 bar", dateEtalonnage: "2024-01-15" }]);

    // Step 9 – no file uploads in demo
    setDocsAdminChecked({});
    setDocsChecked({});

    // Step 10
    setDemandeurNom("Ahmed Bensalem");
    setDemandeurFonction("Directeur Général");
    setDemandeurDate(new Date().toISOString().split("T")[0]);
    setSignature("A. Bensalem");
    setEngagementsAcceptes(true);
    setOrganismeSoumission("LABO DEMO SARL");

    setCurrentStep(1);
    setErrors({});
  };

  // ── Validation ──
  const validateRows = (rows: Array<Record<string, any>>, keys: string[]): boolean => {
    if (!rows || rows.length === 0) return false;
    return rows.every((r) => keys.every((k) => String(r[k] ?? "").trim() !== ""));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!typeDemande) errs.typeDemande = t("nrp.validation.typeDemande");
      if (!dateEvaluation) errs.dateEvaluation = t("nrp.validation.dateEvaluation");
      if (activites.length === 0) errs.activites = t("nrp.validation.activites");
      if (!siteType) errs.siteType = t("nrp.validation.siteType");
    }
    if (currentStep === 2) {
      if (!nomLegal.trim()) errs.nomLegal = t("nrp.validation.nomLegal");
      if (!statutJuridique) errs.statutJuridique = t("nrp.validation.statutJuridique");
      if (statutJuridique === REQUIRES_AUTRE_TEXT && !statutJuridiqueAutre.trim()) errs.statutJuridiqueAutre = t("nrp.validation.statutJuridiqueAutre");
      if (!registreCommerce.trim()) errs.registreCommerce = t("nrp.validation.registreCommerce");
      if (!codesActivite.trim()) errs.codesActivite = t("nrp.validation.codesActivite");
      if (!adresseSiege.trim()) errs.adresseSiege = t("nrp.validation.adresseSiege");
      if (!emailOrg.trim()) errs.emailOrg = t("nrp.validation.emailOrg");
      if (!appartientGroupe) errs.appartientGroupe = t("nrp.validation.appartientGroupe");
      if (appartientGroupe === "oui") {
        if (!groupeNom.trim()) errs.groupeNom = t("nrp.validation.groupeNom");
        if (!groupeAdresse.trim()) errs.groupeAdresse = t("nrp.validation.groupeAdresse");
        if (!groupeRelation.trim()) errs.groupeRelation = t("nrp.validation.groupeRelation");
        if (!groupeImpact.trim()) errs.groupeImpact = t("nrp.validation.groupeImpact");
      }
    }
    if (currentStep === 3) {
      if (!contactNom.trim()) errs.contactNom = t("nrp.validation.contactNom");
      if (!contactFonction.trim()) errs.contactFonction = t("nrp.validation.contactFonction");
      if (!contactAdresse.trim()) errs.contactAdresse = t("nrp.validation.contactAdresse");
      if (!contactTelephone.trim()) errs.contactTelephone = t("nrp.validation.contactTelephone");
      if (!contactEmail.trim()) errs.contactEmail = t("nrp.validation.contactEmail");
    }
    if (currentStep === 4) {
      if (siteType === "monosite") {
        const s = sites[0];
        if (!s.adresse.trim()) errs.sites = t("nrp.validation.sites");
        else if (!s.activites.trim()) errs.sites = t("nrp.validation.sitesActivites");
      } else {
        // PRO 26 multisites
        if (!msMainSiteName.trim())    errs.msMainSiteName = t("nrp.validation.msMainSiteName");
        if (!msMainSiteAddress.trim()) errs.msMainSiteAddress = t("nrp.validation.msMainSiteAddress");
        if (!msMainSiteContactName.trim())  errs.msMainSiteContactName = t("nrp.validation.msMainSiteContactName");
        if (!msMainSiteContactEmail.trim()) errs.msMainSiteContactEmail = t("nrp.validation.msMainSiteContactEmail");
        if (!msSMDescription.trim())   errs.msSMDescription = t("nrp.validation.msSMDescription");
        if (!msInterSiteExchangesDoc.trim()) errs.msInterSiteExchangesDoc = t("nrp.validation.msInterSiteExchangesDoc");
        const validSatellites = satelliteSites.filter(s => s.name.trim() && s.address.trim() && s.activities.trim());
        if (validSatellites.length === 0) errs.satelliteSites = t("nrp.validation.satelliteSites");
        const allChecked = MULTISITE_CRITERIA_KEYS.every(c => msCriteria[c]?.checked);
        if (!allChecked) errs.msCriteria = t("nrp.validation.msCriteria");
      }
    }
    if (currentStep === 5) {
      if (!validateRows(personnelSites, ["site", "permanents"])) errs.personnelSites = t("nrp.validation.personnelSites");
      if (!validateRows(responsablesTechniques, ["nom", "qualifications", "experience"])) errs.responsablesTechniques = t("nrp.validation.responsablesTechniques");
      if (!responsableQualiteNom.trim()) errs.responsableQualiteNom = t("nrp.validation.responsableQualiteNom");
      if (!responsableQualiteQualif.trim()) errs.responsableQualiteQualif = t("nrp.validation.responsableQualiteQualif");
      if (!responsableQualiteExp.trim()) errs.responsableQualiteExp = t("nrp.validation.responsableQualiteExp");
    }
    if (currentStep === 6) {
      if (!prestationConseil) errs.prestationConseil = t("nrp.validation.prestationConseil");
      if (prestationConseil === "oui") {
        if (prestations.length === 0) errs.prestations = t("nrp.validation.prestations");
        else {
          const invalid = prestations.some((pr) =>
            pr.types.length === 0 || !pr.prestataire.trim() || !pr.date || !pr.description.trim() ||
            (pr.types.includes("autre") && !(pr as any).autrePrecision?.toString().trim())
          );
          if (invalid) errs.prestations = t("nrp.validation.prestationsDetail");
        }
      }
    }
    if (currentStep === 7) {
      if (typeDemande === "transfert" && !motifTransfert.trim()) errs.motifTransfert = t("nrp.validation.motifTransfert");
    }
    if (currentStep === 8) {
      if (activites.includes("inspection")) {
        if (!for04Type) errs.for04Type = t("nrp.validation.for04Type");
        if (!validateRows(for04Domaines, ["domaine", "objetInspecte", "norme"])) errs.for04Domaines = t("nrp.validation.for04Domaines");
        if (!validateRows(for04Inspecteurs, ["nom", "qualification", "statut"])) errs.for04Inspecteurs = t("nrp.validation.for04Inspecteurs");
        if (!validateRows(for04Equipements, ["designation", "gamme"])) errs.for04Equipements = t("nrp.validation.for04Equipements");
      }
      if (activites.includes("essais")) {
        if (!validateRows(for05Domaines, ["domaine", "essaiAnalyse", "methodeRef"])) errs.for05Domaines = t("nrp.validation.for05Domaines");
        if (!validateRows(for05Methodes, ["reference", "titre"])) errs.for05Methodes = t("nrp.validation.for05Methodes");
        if (!validateRows(for05Personnel, ["nom", "diplome", "fonction"])) errs.for05Personnel = t("nrp.validation.for05Personnel");
        if (!for05ProcedureIncertitudes.trim()) errs.for05ProcedureIncertitudes = t("nrp.validation.for05ProcedureIncertitudes");
      }
      if (activites.includes("etalonnage")) {
        if (!validateRows(for06Grandeurs, ["grandeur", "gamme", "methode"])) errs.for06Grandeurs = t("nrp.validation.for06Grandeurs");
        if (!validateRows(for06Etalons, ["designation", "grandeur"])) errs.for06Etalons = t("nrp.validation.for06Etalons");
      }
      if (activites.includes("cert_sm")) {
        if (for07Referentiels.length === 0) errs.for07Referentiels = t("nrp.validation.for07Referentiels");
        if (!validateRows(for07Secteurs, ["codeIAF", "description"])) errs.for07Secteurs = t("nrp.validation.for07Secteurs");
      }
      if (activites.includes("examens_medicaux") && !validateRows(for051Disciplines, ["discipline", "typeExamen"])) {
        errs.for051Disciplines = t("nrp.validation.for051Disciplines");
      }
      // Fichiers pour docs cochés
      const missingFile = Object.entries(docsChecked).some(([k, v]) => v && !documentFiles[k]);
      if (missingFile) errs.docsChecked = t("nrp.validation.docsChecked");
    }
    if (currentStep === 9) {
      const missing = Object.entries(docsAdminChecked).some(([k, v]) => v && !documentFiles[`admin-${k}`]);
      if (missing) errs.docsAdminChecked = t("nrp.validation.docsAdminChecked");
    }
    if (currentStep === 10) {
      if (!engagementsAcceptes) errs.engagements = t("nrp.validation.engagements");
      if (!demandeurNom.trim()) errs.demandeurNom = t("nrp.validation.demandeurNom");
      if (!demandeurFonction.trim()) errs.demandeurFonction = t("nrp.validation.demandeurFonction");
      if (!demandeurDate) errs.demandeurDate = t("nrp.validation.demandeurDate");
      if (!signature.trim()) errs.signature = t("nrp.validation.signature");
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: t("nrp.validation.requiredFields"), description: Object.values(errs)[0] || t("nrp.validation.fillRequired"), variant: "destructive" });
      return false;
    }
    return true;
  };

  const next = () => {
    if (validate() && currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Submit ──
  const handleSubmitClick = () => {
    if (!validate()) return;
    if (submitted || createdRequestId) {
      toast({ title: t("nrp.validation.alreadySubmitted"), description: t("nrp.validation.alreadySubmittedDesc") });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    if (submitted || loading) return;
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      const fileToBase64 = (f: File): Promise<string> =>
        new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res((r.result as string).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });

      // Collect uploaded docs
      const docsList: Array<{ key: string; name: string; base64?: string; mimeType?: string }> = [];
      for (const [key, checked] of Object.entries(docsChecked)) {
        if (checked) {
          const file = documentFiles[key];
          if (file) docsList.push({ key, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          else docsList.push({ key, name: key });
        }
      }
      for (const [doc, checked] of Object.entries(docsAdminChecked)) {
        if (checked) {
          const file = documentFiles[`admin-${doc}`];
          if (file) docsList.push({ key: `admin-${doc}`, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          else docsList.push({ key: `admin-${doc}`, name: doc });
        }
      }

      const backendType = TYPE_MAP[typeDemande] || "INITIAL";
      const domain = activites
        .map((a) => TYPES_ACTIVITES.find((t) => t.value === a)?.label || a)
        .join(", ");

      const description = JSON.stringify({
        // DOC1
        typeDemande, dateEvaluation, activites, siteType,
        nomLegal, abreviation, sigle,
        statutJuridique: statutJuridique === REQUIRES_AUTRE_TEXT ? `Autre: ${statutJuridiqueAutre}` : statutJuridique,
        registreCommerce, codesActivite,
        adresseSiege, adresseFacturation, emailOrg, siteWeb,
        appartientGroupe, groupeNom, groupeAdresse, groupeRelation, groupeImpact,
        contactNom, contactFonction, contactAdresse, contactTelephone, contactFax, contactEmail,
        sites, personnelSites, responsablesTechniques,
        responsableQualiteNom, responsableQualiteQualif, responsableQualiteExp,
        prestationConseil, prestations, reconnaissances, motifTransfert,
        // Declaration
        demandeurNom, demandeurFonction, demandeurDate, signature, organismeSoumission,
        // FOR technical forms
        technicalForms: {
          ...(activites.includes("inspection") ? { for04: { typeOrganisme: for04Type, domaines: for04Domaines, inspecteurs: for04Inspecteurs, equipements: for04Equipements } } : {}),
          ...(activites.includes("essais") ? { for05: { domaines: for05Domaines, methodes: for05Methodes, equipements: for05Equipements, personnel: for05Personnel, participationEIL: for05ParticipationEIL, procedureIncertitudes: for05ProcedureIncertitudes } } : {}),
          ...(activites.includes("etalonnage") ? { for06: { grandeurs: for06Grandeurs, etalons: for06Etalons, equipements: for06Equipements, personnel: for06Personnel, conditionsEnvironnementales: for06ConditionsEnv } } : {}),
          ...(activites.includes("cert_sm") ? { for07: { referentiels: for07Referentiels, secteurs: for07Secteurs, auditeurs: for07Auditeurs, comite: for07Comite, nbClientsCertifies: for07NbClientsCertifies } } : {}),
          ...(activites.includes("examens_medicaux") ? { for051: { disciplines: for051Disciplines, personnel: for051Personnel, participationEEQ: for051ParticipationEEQ } } : {}),
          ...(activites.includes("essais_aptitude") ? { for055: { programmes: for055Programmes, personnel: for055Personnel } } : {}),
          ...(activites.includes("cert_produits") ? { for075: { produits: for075Produits, evaluateurs: for075Evaluateurs } } : {}),
          ...(activites.includes("cert_personnes") ? { for078: { schemas: for078Schemas, evaluateurs: for078Evaluateurs } } : {}),
        },
        // Uploaded docs
        documents: docsList,
      });

      const createRes = await fetch("/api/requests/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: backendType,
          domain,
          description,
          isMultisite: siteType === "multisites",
          multisite: siteType === "multisites" ? {
            mainSiteName: msMainSiteName,
            mainSiteAddress: msMainSiteAddress,
            mainSiteContactName: msMainSiteContactName,
            mainSiteContactEmail: msMainSiteContactEmail,
            centralizedManagementSystem: msCentralizedSM,
            managementSystemDescription: msSMDescription,
            interSiteExchangesDoc: msInterSiteExchangesDoc,
            qualificationCriteriaJson: JSON.stringify(msCriteria),
            satelliteSites: satelliteSites
              .filter(s => s.name.trim() && s.address.trim())
              .map(s => ({
                name: s.name,
                address: s.address,
                activities: s.activities,
                personnel: s.personnel,
                isInScope: s.isInScope,
              })),
          } : null,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || err.message || "Erreur lors de la création");
      }

      const createData = await createRes.json();
      const requestId = createData.data.id;

      const submitRes = await fetch(`/api/requests/${requestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || err.message || "Erreur lors de la soumission");
      }

      setCreatedRequestId(requestId);
      setSubmitted(true);
      setShowPaymentDialog(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    setShowPaymentDialog(false);
    setLocation(`/oec/paiement/${createdRequestId}`);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP RENDERERS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Step 1: Type de demande ──
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">{t("nrp.s1.typeDemande")} <span className="text-red-500">*</span></Label>
        <RadioGroup value={typeDemande} onValueChange={setTypeDemande}>
          <div className="grid md:grid-cols-2 gap-3">
            {TYPES_DEMANDE.map((dt) => (
              <div key={dt.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                <RadioGroupItem value={dt.value} id={dt.value} />
                <Label htmlFor={dt.value} className="cursor-pointer flex-1">{t(`nrp.types.${dt.value}`)}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        {errors.typeDemande && <p className="text-sm text-red-500">{errors.typeDemande}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t("nrp.s1.dateEvaluation")} <span className="text-red-500">*</span></Label>
        <StringDatePicker value={dateEvaluation} onChange={setDateEvaluation} min={new Date().toISOString().split("T")[0]} />
        {errors.dateEvaluation && <p className="text-sm text-red-500">{errors.dateEvaluation}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("nrp.s1.typeActivite")} <span className="text-red-500">*</span></Label>
        <div className="grid md:grid-cols-2 gap-3">
          {TYPES_ACTIVITES.map((a) => (
            <div key={a.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
              <Checkbox id={a.value} checked={activites.includes(a.value)} onCheckedChange={() => toggleActivite(a.value)} />
              <Label htmlFor={a.value} className="cursor-pointer flex-1 text-sm">{t(`nrp.activities.${a.value}`)}</Label>
            </div>
          ))}
        </div>
        {errors.activites && <p className="text-sm text-red-500">{errors.activites}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("nrp.s1.typeSite")} <span className="text-red-500">*</span></Label>
        <RadioGroup value={siteType} onValueChange={setSiteType}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="monosite" id="site-monosite" />
              <Label htmlFor="site-monosite" className="cursor-pointer font-normal">
                <span className="font-semibold">{t("nrp.siteTypes.monosite")}</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="multisites" id="site-multisites" />
              <Label htmlFor="site-multisites" className="cursor-pointer font-normal">
                <span className="font-semibold">{t("nrp.siteTypes.multisites")}</span>
              </Label>
            </div>
          </div>
          {siteType === "multisites" && (
            <p className="text-xs text-slate-500 italic mt-2">
              {t("nrp.s1.multisiteNote")}
            </p>
          )}
        </RadioGroup>
        {errors.siteType && <p className="text-sm text-red-500">{errors.siteType}</p>}
      </div>
    </div>
  );

  // ── Step 2: Informations organisme (DOC1) ──
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        {t("nrp.s2.prefillBanner")}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>{t("nrp.s2.nomLegal")} <span className="text-red-500">*</span></Label>
          <Input value={nomLegal} onChange={(e) => setNomLegal(e.target.value)} placeholder={t("nrp.s2.nomLegalPlaceholder")} />
          {errors.nomLegal && <p className="text-sm text-red-500">{errors.nomLegal}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.abreviation")}</Label>
          <Input value={abreviation} onChange={(e) => setAbreviation(e.target.value)} placeholder={t("nrp.s2.abreviation")} />
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.sigle")}</Label>
          <Input value={sigle} onChange={(e) => setSigle(e.target.value)} placeholder={t("nrp.s2.sigle")} />
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.statutJuridique")} <span className="text-red-500">*</span></Label>
          <Select value={statutJuridique} onValueChange={setStatutJuridique}>
            <SelectTrigger><SelectValue placeholder={t("nrp.s2.statutJuridiquePlaceholder")} /></SelectTrigger>
            <SelectContent>
              {STATUTS_JURIDIQUES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
          {statutJuridique === REQUIRES_AUTRE_TEXT && (
            <Input value={statutJuridiqueAutre} onChange={(e) => setStatutJuridiqueAutre(e.target.value)} placeholder={t("nrp.s2.statutAutrePlaceholder")} className="mt-1" />
          )}
          {errors.statutJuridique && <p className="text-sm text-red-500">{errors.statutJuridique}</p>}
          {errors.statutJuridiqueAutre && <p className="text-sm text-red-500">{errors.statutJuridiqueAutre}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.registreCommerce")} <span className="text-red-500">*</span></Label>
          <Input value={registreCommerce} onChange={(e) => setRegistreCommerce(e.target.value)} placeholder={t("nrp.s2.registreCommercePlaceholder")} />
          {errors.registreCommerce && <p className="text-sm text-red-500">{errors.registreCommerce}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t("nrp.s2.codesActivite")} <span className="text-red-500">*</span></Label>
          <Input value={codesActivite} onChange={(e) => setCodesActivite(e.target.value)} placeholder={t("nrp.s2.codesActivitePlaceholder")} />
          {errors.codesActivite && <p className="text-sm text-red-500">{errors.codesActivite}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t("nrp.s2.adresseSiege")} <span className="text-red-500">*</span></Label>
          <Textarea value={adresseSiege} onChange={(e) => setAdresseSiege(e.target.value)} placeholder={t("nrp.s2.adresseSiegePlaceholder")} rows={3} />
          {errors.adresseSiege && <p className="text-sm text-red-500">{errors.adresseSiege}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t("nrp.s2.adresseFacturation")}</Label>
          <Textarea value={adresseFacturation} onChange={(e) => setAdresseFacturation(e.target.value)} placeholder={t("nrp.s2.adresseFacturationPlaceholder")} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.email")} <span className="text-red-500">*</span></Label>
          <Input type="email" value={emailOrg} onChange={(e) => setEmailOrg(e.target.value)} placeholder={t("nrp.s2.emailPlaceholder")} />
          {errors.emailOrg && <p className="text-sm text-red-500">{errors.emailOrg}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.siteWeb")}</Label>
          <Input value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} placeholder={t("nrp.s2.siteWebPlaceholder")} />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">{t("nrp.s2.appartientGroupe")} <span className="text-red-500">*</span></Label>
        {errors.appartientGroupe && <p className="text-sm text-red-500">{errors.appartientGroupe}</p>}
        <RadioGroup value={appartientGroupe} onValueChange={setAppartientGroupe}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="oui" id="g-oui" /><Label htmlFor="g-oui">{t("nrp.s2.oui")}</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="non" id="g-non" /><Label htmlFor="g-non">{t("nrp.s2.non")}</Label></div>
          </div>
        </RadioGroup>
      </div>

      {appartientGroupe === "oui" && (
        <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s2.groupeNom")} <span className="text-red-500">*</span></Label><Input value={groupeNom} onChange={(e) => setGroupeNom(e.target.value)} placeholder={t("nrp.s2.groupeNomPlaceholder")} />{errors.groupeNom && <p className="text-sm text-red-500">{errors.groupeNom}</p>}</div>
          <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s2.groupeAdresse")} <span className="text-red-500">*</span></Label><Textarea value={groupeAdresse} onChange={(e) => setGroupeAdresse(e.target.value)} placeholder={t("nrp.s2.groupeAdressePlaceholder")} rows={2} />{errors.groupeAdresse && <p className="text-sm text-red-500">{errors.groupeAdresse}</p>}</div>
          <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s2.groupeRelation")} <span className="text-red-500">*</span></Label><Input value={groupeRelation} onChange={(e) => setGroupeRelation(e.target.value)} placeholder={t("nrp.s2.groupeRelationPlaceholder")} />{errors.groupeRelation && <p className="text-sm text-red-500">{errors.groupeRelation}</p>}</div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("nrp.s2.groupeImpact")} <span className="text-red-500">*</span></Label>
            <p className="text-xs text-slate-500">{t("nrp.s2.groupeImpactHelper")}</p>
            <Textarea value={groupeImpact} onChange={(e) => setGroupeImpact(e.target.value)} placeholder={t("nrp.s2.groupeImpactPlaceholder")} rows={3} />
            {errors.groupeImpact && <p className="text-sm text-red-500">{errors.groupeImpact}</p>}
          </div>
        </div>
      )}
    </div>
  );

  // ── Step 3: Personne à contacter (DOC1) ──
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label>{t("nrp.s3.nomComplet")} <span className="text-red-500">*</span></Label><Input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder={t("nrp.s3.nomCompletPlaceholder")} />{errors.contactNom && <p className="text-sm text-red-500">{errors.contactNom}</p>}</div>
        <div className="space-y-2"><Label>{t("nrp.s3.fonction")} <span className="text-red-500">*</span></Label><Input value={contactFonction} onChange={(e) => setContactFonction(e.target.value)} placeholder={t("nrp.s3.fonctionPlaceholder")} />{errors.contactFonction && <p className="text-sm text-red-500">{errors.contactFonction}</p>}</div>
        <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s3.adresse")} <span className="text-red-500">*</span></Label><Textarea value={contactAdresse} onChange={(e) => setContactAdresse(e.target.value)} placeholder={t("nrp.s3.adressePlaceholder")} rows={2} />{errors.contactAdresse && <p className="text-sm text-red-500">{errors.contactAdresse}</p>}</div>
        <div className="space-y-2"><Label>{t("nrp.s3.telephone")} <span className="text-red-500">*</span></Label><Input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} placeholder={t("nrp.s3.telephonePlaceholder")} />{errors.contactTelephone && <p className="text-sm text-red-500">{errors.contactTelephone}</p>}</div>
        <div className="space-y-2"><Label>{t("nrp.s3.fax")}</Label><Input value={contactFax} onChange={(e) => setContactFax(e.target.value)} placeholder={t("nrp.s3.telephonePlaceholder")} /></div>
        <div className="space-y-2"><Label>{t("nrp.s3.email")} <span className="text-red-500">*</span></Label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@exemple.dz" />{errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}</div>
      </div>
    </div>
  );

  // ── Step 4: Sites et activités (DOC1) ──
  const renderStep4 = () => {
    if (siteType === "monosite") {
      const site = sites[0];
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <p className="text-sm text-slate-600">
              {t("nrp.s4.monoInfoText", { bold: t("nrp.s4.singleSite") }).split(t("nrp.s4.singleSite")).map((part, i, arr) =>
                i < arr.length - 1 ? <>{part}<span className="font-semibold">{t("nrp.s4.singleSite")}</span></> : part
              )}
            </p>
          </div>
          {errors.sites && <p className="text-sm text-red-500">{errors.sites}</p>}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("nrp.s4.adresseSite")} <span className="text-red-500">*</span></Label>
              <Textarea value={site.adresse} onChange={(e) => setSites((p) => p.map((s) => s.id === site.id ? { ...s, adresse: e.target.value } : s))} placeholder={t("nrp.s4.adresseSite")} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("nrp.s4.activitesSite")} <span className="text-red-500">*</span></Label>
              <Textarea value={site.activites} onChange={(e) => setSites((p) => p.map((s) => s.id === site.id ? { ...s, activites: e.target.value } : s))} placeholder={t("nrp.s4.activitesSitePlaceholder")} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("nrp.s4.soustraitance")}</Label>
              <p className="text-xs text-slate-500">{t("nrp.s4.soustraitanceHelper")}</p>
              <Input value={site.soustraitance} onChange={(e) => setSites((p) => p.map((s) => s.id === site.id ? { ...s, soustraitance: e.target.value } : s))} placeholder={t("nrp.s4.soustraitancePlaceholder")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("nrp.s4.ebmd")}</Label>
              <p className="text-xs text-slate-500">{t("nrp.s4.ebmdHelper")}</p>
              <Input value={site.ebmd} onChange={(e) => setSites((p) => p.map((s) => s.id === site.id ? { ...s, ebmd: e.target.value } : s))} placeholder={t("nrp.s4.ebmdPlaceholder")} />
            </div>
          </div>
        </div>
      );
    }

    // ── Multisites UI ──
    return renderMultisiteSection();
  };

  // ── PRO 26: Section multisites ──
  const renderMultisiteSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-700">
          {t("nrp.s4.multiInfoText", { bold: t("nrp.s4.multipleSites") }).split(t("nrp.s4.multipleSites")).map((part, i, arr) =>
            i < arr.length - 1 ? <>{part}<span className="font-semibold">{t("nrp.s4.multipleSites")}</span></> : part
          )}
        </p>
      </div>
      <h3 className="text-base font-semibold text-slate-800">{t("nrp.s4.multisitesTitle")}</h3>

      {/* Siège central */}
      <Card className="p-4">
        <h4 className="font-medium text-sm mb-3">{t("nrp.s4.headOffice")}</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">{t("nrp.s4.siegeName")} <span className="text-red-500">*</span></Label>
            <Input value={msMainSiteName} onChange={(e) => setMsMainSiteName(e.target.value)} placeholder={t("nrp.s4.siegeNamePlaceholder")} />
            {errors.msMainSiteName && <p className="text-xs text-red-500">{errors.msMainSiteName}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t("nrp.s4.siegeAddress")} <span className="text-red-500">*</span></Label>
            <Input value={msMainSiteAddress} onChange={(e) => setMsMainSiteAddress(e.target.value)} placeholder={t("nrp.s4.siegeAddressPlaceholder")} />
            {errors.msMainSiteAddress && <p className="text-xs text-red-500">{errors.msMainSiteAddress}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t("nrp.s4.siegeContact")} <span className="text-red-500">*</span></Label>
            <Input value={msMainSiteContactName} onChange={(e) => setMsMainSiteContactName(e.target.value)} placeholder={t("nrp.s4.siegeContactPlaceholder")} />
            {errors.msMainSiteContactName && <p className="text-xs text-red-500">{errors.msMainSiteContactName}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t("nrp.s4.siegeEmail")} <span className="text-red-500">*</span></Label>
            <Input type="email" value={msMainSiteContactEmail} onChange={(e) => setMsMainSiteContactEmail(e.target.value)} placeholder={t("nrp.s4.siegeEmailPlaceholder")} />
            {errors.msMainSiteContactEmail && <p className="text-xs text-red-500">{errors.msMainSiteContactEmail}</p>}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="ms-centralized" checked={msCentralizedSM} onCheckedChange={(v) => setMsCentralizedSM(Boolean(v))} />
            <Label htmlFor="ms-centralized" className="text-sm cursor-pointer">{t("nrp.s4.centralizedSM")}</Label>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label className="text-sm">{t("nrp.s4.smDescriptionLabel")} <span className="text-red-500">*</span></Label>
          <Textarea value={msSMDescription} onChange={(e) => setMsSMDescription(e.target.value)} rows={3} placeholder={t("nrp.s4.smDescriptionPlaceholder")} />
          {errors.msSMDescription && <p className="text-xs text-red-500">{errors.msSMDescription}</p>}
        </div>
        <div className="mt-4 space-y-2">
          <Label className="text-sm">{t("nrp.s4.interSiteLabel")} <span className="text-red-500">*</span></Label>
          <Textarea value={msInterSiteExchangesDoc} onChange={(e) => setMsInterSiteExchangesDoc(e.target.value)} rows={2} placeholder={t("nrp.s4.interSitePlaceholder")} />
          {errors.msInterSiteExchangesDoc && <p className="text-xs text-red-500">{errors.msInterSiteExchangesDoc}</p>}
        </div>
      </Card>

      {/* Sites satellites */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-sm">{t("nrp.s4.satelliteTitle")} <span className="text-red-500">*</span></h4>
          <Button type="button" size="sm" className="gap-2"
            onClick={() => setSatelliteSites(p => [...p, { id: Date.now(), name: "", address: "", activities: "", personnel: "", isInScope: true }])}>
            <Plus className="w-4 h-4" /> {t("nrp.add")}
          </Button>
        </div>
        {errors.satelliteSites && <p className="text-sm text-red-500 mb-2">{errors.satelliteSites}</p>}
        <div className="space-y-3">
          {satelliteSites.map((s) => (
            <Card key={s.id} className="p-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder={t("nrp.s4.satelliteName")} value={s.name} onChange={(e) => setSatelliteSites(p => p.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))} />
                <Input placeholder={t("nrp.s4.satelliteAddress")} value={s.address} onChange={(e) => setSatelliteSites(p => p.map(x => x.id === s.id ? { ...x, address: e.target.value } : x))} />
                <Input placeholder={t("nrp.s4.satelliteActivities")} value={s.activities} onChange={(e) => setSatelliteSites(p => p.map(x => x.id === s.id ? { ...x, activities: e.target.value } : x))} />
                <Input placeholder={t("nrp.s4.satellitePersonnel")} value={s.personnel} onChange={(e) => setSatelliteSites(p => p.map(x => x.id === s.id ? { ...x, personnel: e.target.value } : x))} />
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox id={`scope-${s.id}`} checked={s.isInScope} onCheckedChange={(v) => setSatelliteSites(p => p.map(x => x.id === s.id ? { ...x, isInScope: Boolean(v) } : x))} />
                  <Label htmlFor={`scope-${s.id}`} className="text-xs cursor-pointer">{t("nrp.s4.satelliteInScope")}</Label>
                </div>
                {satelliteSites.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setSatelliteSites(p => p.filter(x => x.id !== s.id))}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Critères de qualification §5.1 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-sm mb-3">{t("nrp.s4.criteriaTitle")}<span className="text-red-500">*</span></h4>
        <p className="text-xs text-slate-600 mb-3">{t("nrp.s4.criteriaNote")}</p>
        {errors.msCriteria && <p className="text-sm text-red-500 mb-2">{errors.msCriteria}</p>}
        <div className="space-y-3">
          {MULTISITE_CRITERIA_KEYS.map((cid) => (
            <div key={cid} className="space-y-2 pb-3 border-b border-blue-100 last:border-0">
              <div className="flex items-start gap-2">
                <Checkbox id={`crit-${cid}`} checked={msCriteria[cid]?.checked || false}
                  onCheckedChange={(v) => setMsCriteria(prev => ({ ...prev, [cid]: { ...prev[cid], checked: Boolean(v) } }))} />
                <Label htmlFor={`crit-${cid}`} className="text-sm cursor-pointer flex-1">{t(`nrp.s4.criteria.${cid}`)}</Label>
              </div>
              <Textarea
                placeholder={t("nrp.s4.justificationPlaceholder")}
                value={msCriteria[cid]?.justification || ""}
                rows={2}
                onChange={(e) => setMsCriteria(prev => ({ ...prev, [cid]: { ...prev[cid], justification: e.target.value } }))}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── Step 5: Personnel (DOC1) ──
  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">{t("nrp.s5.personnelParSite")} <span className="text-red-500">*</span></Label>
          <Button type="button" onClick={() => setPersonnelSites((p) => [...p, { id: Date.now(), site: "", permanents: "", vacataires: "" }])} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> {t("nrp.add")}
          </Button>
        </div>
        {errors.personnelSites && <p className="text-sm text-red-500">{errors.personnelSites}</p>}
        {personnelSites.map((ps) => (
          <Card key={ps.id} className="p-4">
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.siteName")} <span className="text-red-500">*</span></Label><Input value={ps.site} onChange={(e) => setPersonnelSites((p) => p.map((x) => x.id === ps.id ? { ...x, site: e.target.value } : x))} placeholder={t("nrp.s5.siteName")} /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.permanents")} <span className="text-red-500">*</span></Label><Input type="number" value={ps.permanents} onChange={(e) => setPersonnelSites((p) => p.map((x) => x.id === ps.id ? { ...x, permanents: e.target.value } : x))} placeholder="N" /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.vacataires")}</Label><Input type="number" value={ps.vacataires} onChange={(e) => setPersonnelSites((p) => p.map((x) => x.id === ps.id ? { ...x, vacataires: e.target.value } : x))} placeholder="N" /></div>
              {personnelSites.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPersonnelSites((p) => p.filter((x) => x.id !== ps.id))} className="h-10"><Trash2 className="w-4 h-4 text-red-500" /></Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-4 pt-6 border-t">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">{t("nrp.s5.responsablesTechniques")} <span className="text-red-500">*</span></Label>
          <Button type="button" onClick={() => setResponsablesTechniques((p) => [...p, { id: Date.now(), nom: "", qualifications: "", experience: "" }])} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> {t("nrp.add")}
          </Button>
        </div>
        {errors.responsablesTechniques && <p className="text-sm text-red-500">{errors.responsablesTechniques}</p>}
        {responsablesTechniques.map((rt) => (
          <Card key={rt.id} className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.nomComplet")} <span className="text-red-500">*</span></Label><Input value={rt.nom} onChange={(e) => setResponsablesTechniques((p) => p.map((x) => x.id === rt.id ? { ...x, nom: e.target.value } : x))} placeholder={t("nrp.s5.nomCompletPlaceholder")} /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.qualifications")} <span className="text-red-500">*</span></Label><Input value={rt.qualifications} onChange={(e) => setResponsablesTechniques((p) => p.map((x) => x.id === rt.id ? { ...x, qualifications: e.target.value } : x))} placeholder={t("nrp.s5.qualificationsPlaceholder")} /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.yearsExp")} <span className="text-red-500">*</span></Label><Input type="number" value={rt.experience} onChange={(e) => setResponsablesTechniques((p) => p.map((x) => x.id === rt.id ? { ...x, experience: e.target.value } : x))} placeholder={t("nrp.s5.yearsExpPlaceholder")} /></div>
            </div>
            {responsablesTechniques.length > 1 && (
              <div className="flex justify-end mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setResponsablesTechniques((p) => p.filter((x) => x.id !== rt.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-4 pt-6 border-t">
        <Label className="text-base font-semibold">{t("nrp.s5.responsableQualite")} <span className="text-red-500">*</span></Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.nomComplet")} <span className="text-red-500">*</span></Label><Input value={responsableQualiteNom} onChange={(e) => setResponsableQualiteNom(e.target.value)} placeholder={t("nrp.s5.nomCompletPlaceholder")} />{errors.responsableQualiteNom && <p className="text-sm text-red-500">{errors.responsableQualiteNom}</p>}</div>
          <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.diplomes")} <span className="text-red-500">*</span></Label><Input value={responsableQualiteQualif} onChange={(e) => setResponsableQualiteQualif(e.target.value)} placeholder={t("nrp.s5.diplomesPlaceholder")} />{errors.responsableQualiteQualif && <p className="text-sm text-red-500">{errors.responsableQualiteQualif}</p>}</div>
          <div className="space-y-2"><Label className="text-sm">{t("nrp.s5.yearsExp")} <span className="text-red-500">*</span></Label><Input type="number" value={responsableQualiteExp} onChange={(e) => setResponsableQualiteExp(e.target.value)} placeholder={t("nrp.s5.yearsExpPlaceholder")} />{errors.responsableQualiteExp && <p className="text-sm text-red-500">{errors.responsableQualiteExp}</p>}</div>
        </div>
      </div>
    </div>
  );

  // ── Step 6: Prestations conseil (DOC1) ──
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">{t("nrp.s6.question")} <span className="text-red-500">*</span></Label>
        {errors.prestationConseil && <p className="text-sm text-red-500">{errors.prestationConseil}</p>}
        <RadioGroup value={prestationConseil} onValueChange={setPrestationConseil}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="oui" id="pc-oui" /><Label htmlFor="pc-oui">{t("nrp.s2.oui")}</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="non" id="pc-non" /><Label htmlFor="pc-non">{t("nrp.s2.non")}</Label></div>
          </div>
        </RadioGroup>
      </div>

      {prestationConseil === "oui" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">{t("nrp.s6.prestationsTitle")}</Label>
            <Button type="button" onClick={() => setPrestations((p) => [...p, { id: Date.now(), types: [], prestataire: "", date: "", description: "", autrePrecision: "" }])} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> {t("nrp.add")}
            </Button>
          </div>
          {prestations.map((pr) => (
            <Card key={pr.id} className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t("nrp.s6.types")}</Label>
                  <div className="flex flex-wrap gap-3">
                    {TYPES_PRESTATION.map((tp) => (
                      <div key={tp.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pr-${pr.id}-${tp.value}`}
                          checked={pr.types.includes(tp.value)}
                          onCheckedChange={(checked) => {
                            setPrestations((prev) => prev.map((p) => p.id === pr.id
                              ? { ...p, types: checked ? [...p.types, tp.value] : p.types.filter((t) => t !== tp.value) }
                              : p
                            ));
                          }}
                        />
                        <Label htmlFor={`pr-${pr.id}-${tp.value}`} className="text-sm cursor-pointer">{t(`nrp.prestationTypes.${tp.value}`)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                {pr.types.includes("autre") && (
                  <div className="space-y-2">
                    <Label className="text-sm">{t("nrp.s6.autreType")} <span className="text-red-500">*</span></Label>
                    <Input value={pr.autrePrecision || ""} onChange={(e) => setPrestations((p) => p.map((x) => x.id === pr.id ? { ...x, autrePrecision: e.target.value } : x))} placeholder={t("nrp.s6.autrePlaceholder")} />
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-sm">{t("nrp.s6.prestataire")}</Label><Input value={pr.prestataire} onChange={(e) => setPrestations((p) => p.map((x) => x.id === pr.id ? { ...x, prestataire: e.target.value } : x))} placeholder={t("nrp.s6.prestatairePlaceholder")} /></div>
                  <div className="space-y-2"><Label className="text-sm">{t("nrp.s6.date")}</Label><StringDatePicker value={pr.date} onChange={(v) => setPrestations((p) => p.map((x) => x.id === pr.id ? { ...x, date: v } : x))} /></div>
                </div>
                <div className="space-y-2"><Label className="text-sm">{t("nrp.s6.description")}</Label><Textarea value={pr.description} onChange={(e) => setPrestations((p) => p.map((x) => x.id === pr.id ? { ...x, description: e.target.value } : x))} placeholder={t("nrp.s6.descriptionPlaceholder")} rows={2} /></div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPrestations((p) => p.filter((x) => x.id !== pr.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ── Step 7: Reconnaissances (DOC1) ──
  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">{t("nrp.s7.reconnaissances")}</Label>
          <Button type="button" onClick={() => setReconnaissances((p) => [...p, { id: Date.now(), organisation: "", domaine: "", validite: "" }])} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> {t("nrp.add")}
          </Button>
        </div>
        {reconnaissances.map((rec) => (
          <Card key={rec.id} className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s7.organisation")}</Label><Input value={rec.organisation} onChange={(e) => setReconnaissances((p) => p.map((x) => x.id === rec.id ? { ...x, organisation: e.target.value } : x))} placeholder={t("nrp.s7.organisationPlaceholder")} /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s7.domaine")}</Label><Input value={rec.domaine} onChange={(e) => setReconnaissances((p) => p.map((x) => x.id === rec.id ? { ...x, domaine: e.target.value } : x))} placeholder={t("nrp.s7.domainePlaceholder")} /></div>
              <div className="space-y-2"><Label className="text-sm">{t("nrp.s7.validite")}</Label><Input value={rec.validite} onChange={(e) => setReconnaissances((p) => p.map((x) => x.id === rec.id ? { ...x, validite: e.target.value } : x))} placeholder={t("nrp.s7.validitePlaceholder")} /></div>
            </div>
            {reconnaissances.length > 1 && (
              <div className="flex justify-end mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setReconnaissances((p) => p.filter((x) => x.id !== rec.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {typeDemande === "transfert" && (
        <div className="space-y-4 pt-6 border-t">
          <Label className="text-base font-semibold">{t("nrp.s7.motifTransfert")} <span className="text-red-500">*</span></Label>
          <Textarea value={motifTransfert} onChange={(e) => setMotifTransfert(e.target.value)} placeholder={t("nrp.s7.motifTransfertPlaceholder")} rows={3} />
          {errors.motifTransfert && <p className="text-sm text-red-500">{errors.motifTransfert}</p>}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 8: FORMULAIRES TECHNIQUES (FOR) - FILLABLE FORMS
  // ══════════════════════════════════════════════════════════════════════════════

  const renderFor04 = () => (
    <div className="space-y-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
      <h4 className="font-bold text-base text-blue-800">FOR 04 — Renseignements Techniques Inspection (ISO/IEC 17020)</h4>
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Type d'organisme d'inspection</Label>
        <RadioGroup value={for04Type} onValueChange={setFor04Type} className="flex gap-6">
          {["A", "B", "C"].map((t) => (
            <div key={t} className="flex items-center space-x-2"><RadioGroupItem value={t} id={`for04-${t}`} /><Label htmlFor={`for04-${t}`}>Type {t}</Label></div>
          ))}
        </RadioGroup>
      </div>
      <DynamicTable
        title="Domaines d'inspection"
        columns={[
          { key: "domaine", label: "Domaine d'activité", placeholder: "Ex: Équipements sous pression" },
          { key: "sousDomaine", label: "Sous-domaine", placeholder: "Précisez" },
          { key: "objetInspecte", label: "Objet inspecté", placeholder: "Type d'objet" },
          { key: "norme", label: "Norme/Méthode", placeholder: "Référence" },
          { key: "typeInspection", label: "Type", placeholder: "Réglementaire/Client" },
        ]}
        rows={for04Domaines}
        onAdd={() => addRow(setFor04Domaines, ["domaine", "sousDomaine", "objetInspecte", "norme", "typeInspection"])}
        onRemove={(id) => removeRow(setFor04Domaines, id)}
        onUpdate={(id, f, v) => updateRow(setFor04Domaines, id, f, v)}
      />
      <DynamicTable
        title="Personnel d'inspection"
        columns={[
          { key: "nom", label: "Nom & Prénom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification/Diplôme", placeholder: "Diplôme" },
          { key: "domaineHabilitation", label: "Domaine d'habilitation", placeholder: "Domaine" },
          { key: "experience", label: "Expérience (ans)", placeholder: "Années", type: "number" },
          { key: "statut", label: "Statut", placeholder: "Permanent/Vacataire" },
        ]}
        rows={for04Inspecteurs}
        onAdd={() => addRow(setFor04Inspecteurs, ["nom", "qualification", "domaineHabilitation", "experience", "statut"])}
        onRemove={(id) => removeRow(setFor04Inspecteurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor04Inspecteurs, id, f, v)}
      />
      <DynamicTable
        title="Équipements de mesure et d'essai"
        columns={[
          { key: "designation", label: "Désignation", placeholder: "Nom équipement" },
          { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
          { key: "noSerie", label: "N° de série", placeholder: "N° série" },
          { key: "gamme", label: "Gamme de mesure", placeholder: "Gamme" },
          { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "JJ/MM/AAAA" },
        ]}
        rows={for04Equipements}
        onAdd={() => addRow(setFor04Equipements, ["designation", "marqueModele", "noSerie", "gamme", "dateEtalonnage"])}
        onRemove={(id) => removeRow(setFor04Equipements, id)}
        onUpdate={(id, f, v) => updateRow(setFor04Equipements, id, f, v)}
      />
    </div>
  );

  const renderFor05 = () => (
    <div className="space-y-6 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
      <h4 className="font-bold text-base text-green-800">FOR 05 — Renseignements Techniques Laboratoire d'Essais (ISO/IEC 17025)</h4>
      <DynamicTable
        title="Portée d'accréditation demandée"
        columns={[
          { key: "domaine", label: "Domaine", placeholder: "Ex: Chimie" },
          { key: "sousDomaine", label: "Sous-domaine", placeholder: "Précisez" },
          { key: "produitMatrice", label: "Produit/Matrice", placeholder: "Type produit" },
          { key: "essaiAnalyse", label: "Essai/Analyse", placeholder: "Type essai" },
          { key: "methodeRef", label: "Méthode", placeholder: "Référence" },
          { key: "norme", label: "Norme", placeholder: "ISO/NF..." },
        ]}
        rows={for05Domaines}
        onAdd={() => addRow(setFor05Domaines, ["domaine", "sousDomaine", "produitMatrice", "essaiAnalyse", "methodeRef", "norme"])}
        onRemove={(id) => removeRow(setFor05Domaines, id)}
        onUpdate={(id, f, v) => updateRow(setFor05Domaines, id, f, v)}
      />
      <DynamicTable
        title="Méthodes d'essai"
        columns={[
          { key: "reference", label: "Référence", placeholder: "Réf. méthode" },
          { key: "titre", label: "Titre", placeholder: "Titre de la méthode" },
          { key: "type", label: "Type", placeholder: "Normative/Interne" },
          { key: "statutValidation", label: "Statut validation", placeholder: "Validée/En cours" },
        ]}
        rows={for05Methodes}
        onAdd={() => addRow(setFor05Methodes, ["reference", "titre", "type", "statutValidation"])}
        onRemove={(id) => removeRow(setFor05Methodes, id)}
        onUpdate={(id, f, v) => updateRow(setFor05Methodes, id, f, v)}
      />
      <DynamicTable
        title="Équipements principaux"
        columns={[
          { key: "designation", label: "Désignation", placeholder: "Nom" },
          { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
          { key: "gamme", label: "Gamme", placeholder: "Gamme mesure" },
          { key: "resolution", label: "Résolution", placeholder: "Résolution" },
          { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
          { key: "noCertificat", label: "N° certificat", placeholder: "N°" },
        ]}
        rows={for05Equipements}
        onAdd={() => addRow(setFor05Equipements, ["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage", "noCertificat"])}
        onRemove={(id) => removeRow(setFor05Equipements, id)}
        onUpdate={(id, f, v) => updateRow(setFor05Equipements, id, f, v)}
      />
      <DynamicTable
        title="Personnel technique"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "diplome", label: "Diplôme", placeholder: "Diplôme" },
          { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
          { key: "fonction", label: "Fonction", placeholder: "Fonction" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
          { key: "habilitations", label: "Habilitations", placeholder: "Domaines" },
        ]}
        rows={for05Personnel}
        onAdd={() => addRow(setFor05Personnel, ["nom", "diplome", "specialite", "fonction", "experience", "habilitations"])}
        onRemove={(id) => removeRow(setFor05Personnel, id)}
        onUpdate={(id, f, v) => updateRow(setFor05Personnel, id, f, v)}
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label className="text-sm">Participation aux essais d'aptitude (EIL)</Label><Textarea value={for05ParticipationEIL} onChange={(e) => setFor05ParticipationEIL(e.target.value)} placeholder="Programmes, fournisseurs, résultats..." rows={2} /></div>
        <div className="space-y-2"><Label className="text-sm">Procédure d'estimation des incertitudes</Label><Textarea value={for05ProcedureIncertitudes} onChange={(e) => setFor05ProcedureIncertitudes(e.target.value)} placeholder="Décrivez la procédure..." rows={2} /></div>
      </div>
    </div>
  );

  const renderFor06 = () => (
    <div className="space-y-6 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/30">
      <h4 className="font-bold text-base text-purple-800">FOR 06 — Renseignements Techniques Laboratoire d'Étalonnage (ISO/IEC 17025)</h4>
      <DynamicTable
        title="Portée d'accréditation — Grandeurs et gammes"
        columns={[
          { key: "grandeur", label: "Grandeur", placeholder: "Ex: Masse" },
          { key: "domaineMesure", label: "Domaine mesure", placeholder: "Précisez" },
          { key: "gamme", label: "Gamme", placeholder: "Min - Max" },
          { key: "cmc", label: "CMC", placeholder: "Incertitude meilleure" },
          { key: "methode", label: "Méthode", placeholder: "Méthode" },
          { key: "norme", label: "Norme", placeholder: "Référence" },
        ]}
        rows={for06Grandeurs}
        onAdd={() => addRow(setFor06Grandeurs, ["grandeur", "domaineMesure", "gamme", "cmc", "methode", "norme"])}
        onRemove={(id) => removeRow(setFor06Grandeurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor06Grandeurs, id, f, v)}
      />
      <DynamicTable
        title="Étalons de référence"
        columns={[
          { key: "designation", label: "Désignation", placeholder: "Nom" },
          { key: "noIdentification", label: "N° identification", placeholder: "N°" },
          { key: "grandeur", label: "Grandeur", placeholder: "Grandeur" },
          { key: "gamme", label: "Gamme", placeholder: "Gamme" },
          { key: "incertitude", label: "Incertitude", placeholder: "U" },
          { key: "tracabilite", label: "Traçabilité", placeholder: "Organisme" },
          { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
        ]}
        rows={for06Etalons}
        onAdd={() => addRow(setFor06Etalons, ["designation", "noIdentification", "grandeur", "gamme", "incertitude", "tracabilite", "dateEtalonnage"])}
        onRemove={(id) => removeRow(setFor06Etalons, id)}
        onUpdate={(id, f, v) => updateRow(setFor06Etalons, id, f, v)}
      />
      <DynamicTable
        title="Équipements"
        columns={[
          { key: "designation", label: "Désignation", placeholder: "Nom" },
          { key: "marqueModele", label: "Marque/Modèle", placeholder: "Marque" },
          { key: "gamme", label: "Gamme", placeholder: "Gamme" },
          { key: "resolution", label: "Résolution", placeholder: "Résolution" },
          { key: "dateEtalonnage", label: "Date étalonnage", placeholder: "Date" },
        ]}
        rows={for06Equipements}
        onAdd={() => addRow(setFor06Equipements, ["designation", "marqueModele", "gamme", "resolution", "dateEtalonnage"])}
        onRemove={(id) => removeRow(setFor06Equipements, id)}
        onUpdate={(id, f, v) => updateRow(setFor06Equipements, id, f, v)}
      />
      <DynamicTable
        title="Personnel technique"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "diplome", label: "Diplôme", placeholder: "Diplôme" },
          { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
          { key: "habilitations", label: "Habilitations", placeholder: "Domaines" },
        ]}
        rows={for06Personnel}
        onAdd={() => addRow(setFor06Personnel, ["nom", "diplome", "specialite", "experience", "habilitations"])}
        onRemove={(id) => removeRow(setFor06Personnel, id)}
        onUpdate={(id, f, v) => updateRow(setFor06Personnel, id, f, v)}
      />
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
              <Checkbox
                id={`for07-${ref}`}
                checked={for07Referentiels.includes(ref)}
                onCheckedChange={(checked) => setFor07Referentiels((prev) => checked ? [...prev, ref] : prev.filter((r) => r !== ref))}
              />
              <Label htmlFor={`for07-${ref}`} className="text-sm cursor-pointer">{ref}</Label>
            </div>
          ))}
        </div>
      </div>
      <DynamicTable
        title="Secteurs d'activité (codes IAF/EA)"
        columns={[
          { key: "codeIAF", label: "Code IAF", placeholder: "Ex: IAF 01" },
          { key: "description", label: "Description", placeholder: "Description secteur" },
          { key: "sousSecteurs", label: "Sous-secteurs", placeholder: "Précisez" },
          { key: "nbAuditeurs", label: "Nb auditeurs qualifiés", placeholder: "N", type: "number" },
        ]}
        rows={for07Secteurs}
        onAdd={() => addRow(setFor07Secteurs, ["codeIAF", "description", "sousSecteurs", "nbAuditeurs"])}
        onRemove={(id) => removeRow(setFor07Secteurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor07Secteurs, id, f, v)}
      />
      <DynamicTable
        title="Liste des auditeurs"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification", placeholder: "Qualification" },
          { key: "secteursQualifies", label: "Secteurs qualifiés", placeholder: "Codes IAF" },
          { key: "experienceAudits", label: "Exp. audits (ans)", placeholder: "Années", type: "number" },
          { key: "statut", label: "Statut", placeholder: "Permanent/Contractuel" },
        ]}
        rows={for07Auditeurs}
        onAdd={() => addRow(setFor07Auditeurs, ["nom", "qualification", "secteursQualifies", "experienceAudits", "statut"])}
        onRemove={(id) => removeRow(setFor07Auditeurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor07Auditeurs, id, f, v)}
      />
      <DynamicTable
        title="Comité de décision de certification"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "fonction", label: "Fonction", placeholder: "Fonction" },
          { key: "domaineCompetence", label: "Domaine compétence", placeholder: "Domaine" },
          { key: "representation", label: "Représentation", placeholder: "Partie prenante" },
        ]}
        rows={for07Comite}
        onAdd={() => addRow(setFor07Comite, ["nom", "fonction", "domaineCompetence", "representation"])}
        onRemove={(id) => removeRow(setFor07Comite, id)}
        onUpdate={(id, f, v) => updateRow(setFor07Comite, id, f, v)}
      />
      <div className="space-y-2"><Label className="text-sm">Nombre de clients certifiés</Label><Input value={for07NbClientsCertifies} onChange={(e) => setFor07NbClientsCertifies(e.target.value)} placeholder="Nombre total" type="number" /></div>
    </div>
  );

  const renderFor051 = () => (
    <div className="space-y-6 p-4 border-2 border-rose-200 rounded-lg bg-rose-50/30">
      <h4 className="font-bold text-base text-rose-800">FOR 05-1 — Renseignements Techniques Laboratoire Médical (ISO 15189)</h4>
      <DynamicTable
        title="Disciplines et examens"
        columns={[
          { key: "discipline", label: "Discipline", placeholder: "Ex: Biochimie" },
          { key: "typeExamen", label: "Type d'examen", placeholder: "Type" },
          { key: "methode", label: "Méthode", placeholder: "Méthode" },
          { key: "automate", label: "Automate/Équipement", placeholder: "Équipement" },
        ]}
        rows={for051Disciplines}
        onAdd={() => addRow(setFor051Disciplines, ["discipline", "typeExamen", "methode", "automate"])}
        onRemove={(id) => removeRow(setFor051Disciplines, id)}
        onUpdate={(id, f, v) => updateRow(setFor051Disciplines, id, f, v)}
      />
      <DynamicTable
        title="Personnel médical"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification", placeholder: "Diplôme" },
          { key: "specialite", label: "Spécialité", placeholder: "Spécialité" },
          { key: "fonction", label: "Fonction", placeholder: "Fonction" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        ]}
        rows={for051Personnel}
        onAdd={() => addRow(setFor051Personnel, ["nom", "qualification", "specialite", "fonction", "experience"])}
        onRemove={(id) => removeRow(setFor051Personnel, id)}
        onUpdate={(id, f, v) => updateRow(setFor051Personnel, id, f, v)}
      />
      <div className="space-y-2"><Label className="text-sm">Participation aux EEQ (programmes, fournisseurs)</Label><Textarea value={for051ParticipationEEQ} onChange={(e) => setFor051ParticipationEEQ(e.target.value)} placeholder="Programmes EEQ, fournisseurs, résultats..." rows={2} /></div>
    </div>
  );

  const renderFor055 = () => (
    <div className="space-y-6 p-4 border-2 border-teal-200 rounded-lg bg-teal-50/30">
      <h4 className="font-bold text-base text-teal-800">FOR 05-5 — Renseignements Techniques Essais d'Aptitude (ISO/IEC 17043)</h4>
      <DynamicTable
        title="Programmes d'essais d'aptitude"
        columns={[
          { key: "domaine", label: "Domaine", placeholder: "Domaine" },
          { key: "typeProgramme", label: "Type programme", placeholder: "Type" },
          { key: "frequence", label: "Fréquence", placeholder: "Fréquence" },
          { key: "nbParticipants", label: "Nb participants", placeholder: "N", type: "number" },
          { key: "methodeStatistique", label: "Méthode statistique", placeholder: "Méthode" },
        ]}
        rows={for055Programmes}
        onAdd={() => addRow(setFor055Programmes, ["domaine", "typeProgramme", "frequence", "nbParticipants", "methodeStatistique"])}
        onRemove={(id) => removeRow(setFor055Programmes, id)}
        onUpdate={(id, f, v) => updateRow(setFor055Programmes, id, f, v)}
      />
      <DynamicTable
        title="Personnel"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification", placeholder: "Qualification" },
          { key: "role", label: "Rôle", placeholder: "Rôle" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        ]}
        rows={for055Personnel}
        onAdd={() => addRow(setFor055Personnel, ["nom", "qualification", "role", "experience"])}
        onRemove={(id) => removeRow(setFor055Personnel, id)}
        onUpdate={(id, f, v) => updateRow(setFor055Personnel, id, f, v)}
      />
    </div>
  );

  const renderFor075 = () => (
    <div className="space-y-6 p-4 border-2 border-amber-200 rounded-lg bg-amber-50/30">
      <h4 className="font-bold text-base text-amber-800">FOR 07-5 — Renseignements Techniques Certification Produits (ISO/IEC 17065)</h4>
      <DynamicTable
        title="Produits/Services couverts"
        columns={[
          { key: "categorie", label: "Catégorie", placeholder: "Catégorie produit" },
          { key: "normeApplicable", label: "Norme applicable", placeholder: "Norme/Règlement" },
          { key: "schemaCertification", label: "Schéma", placeholder: "Schéma certification" },
          { key: "programme", label: "Programme", placeholder: "Programme" },
        ]}
        rows={for075Produits}
        onAdd={() => addRow(setFor075Produits, ["categorie", "normeApplicable", "schemaCertification", "programme"])}
        onRemove={(id) => removeRow(setFor075Produits, id)}
        onUpdate={(id, f, v) => updateRow(setFor075Produits, id, f, v)}
      />
      <DynamicTable
        title="Personnel d'évaluation"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification", placeholder: "Qualification" },
          { key: "domaine", label: "Domaine", placeholder: "Domaine" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        ]}
        rows={for075Evaluateurs}
        onAdd={() => addRow(setFor075Evaluateurs, ["nom", "qualification", "domaine", "experience"])}
        onRemove={(id) => removeRow(setFor075Evaluateurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor075Evaluateurs, id, f, v)}
      />
    </div>
  );

  const renderFor078 = () => (
    <div className="space-y-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50/30">
      <h4 className="font-bold text-base text-indigo-800">FOR 07-8 — Renseignements Techniques Certification Personnes (ISO/IEC 17024)</h4>
      <DynamicTable
        title="Schémas de certification"
        columns={[
          { key: "domaine", label: "Domaine", placeholder: "Domaine" },
          { key: "referentiel", label: "Référentiel", placeholder: "Norme/Référentiel" },
          { key: "niveau", label: "Niveau", placeholder: "Niveau" },
          { key: "criteresEligibilite", label: "Critères d'éligibilité", placeholder: "Critères" },
        ]}
        rows={for078Schemas}
        onAdd={() => addRow(setFor078Schemas, ["domaine", "referentiel", "niveau", "criteresEligibilite"])}
        onRemove={(id) => removeRow(setFor078Schemas, id)}
        onUpdate={(id, f, v) => updateRow(setFor078Schemas, id, f, v)}
      />
      <DynamicTable
        title="Évaluateurs"
        columns={[
          { key: "nom", label: "Nom", placeholder: "Nom complet" },
          { key: "qualification", label: "Qualification", placeholder: "Qualification" },
          { key: "domaineCertifie", label: "Domaine certifié", placeholder: "Domaine" },
          { key: "experience", label: "Exp. (ans)", placeholder: "Années", type: "number" },
        ]}
        rows={for078Evaluateurs}
        onAdd={() => addRow(setFor078Evaluateurs, ["nom", "qualification", "domaineCertifie", "experience"])}
        onRemove={(id) => removeRow(setFor078Evaluateurs, id)}
        onUpdate={(id, f, v) => updateRow(setFor078Evaluateurs, id, f, v)}
      />
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t("nrp.s8.title")}</h3>
        <p className="text-sm text-slate-600 mb-4">{t("nrp.s8.subtitle")}</p>
      </div>

      {activites.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {t("nrp.s8.noActivities")}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Fillable FOR forms */}
          {activites.includes("inspection") && renderFor04()}
          {activites.includes("essais") && renderFor05()}
          {activites.includes("etalonnage") && renderFor06()}
          {activites.includes("cert_sm") && renderFor07()}
          {activites.includes("examens_medicaux") && renderFor051()}
          {activites.includes("essais_aptitude") && renderFor055()}
          {activites.includes("cert_produits") && renderFor075()}
          {activites.includes("cert_personnes") && renderFor078()}

          {/* Other documents to upload */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold">{t("nrp.s8.docsTitle")}</h3>
            <p className="text-sm text-slate-600">{t("nrp.s8.docsSubtitle")}</p>

            {activites.map((activity) => {
              const label = TYPES_ACTIVITES.find((a) => a.value === activity)?.label || activity;
              const docs = UPLOAD_DOCS[activity] || [];
              if (docs.length === 0) return null;
              return (
                <div key={activity} className="space-y-3">
                  <h4 className="font-semibold text-sm text-[#00A63E]">{label}</h4>
                  <div className="space-y-2 pl-4">
                    {docs.map((doc, idx) => {
                      const key = `${activity}-${doc}`;
                      return (
                        <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                          <Checkbox id={`doc-${key}`} checked={!!docsChecked[key]} onCheckedChange={() => toggleDoc(key)} />
                          <div className="flex-1">
                            <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                            {!!docsChecked[key] && (
                              <div className="mt-1">
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setDocumentFiles((p) => ({ ...p, [key]: file }));
                                  }}
                                  className="text-xs w-full"
                                />
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

            {typeDemande === "transfert" && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-sm text-[#00A63E]">Documents de transfert</h4>
                <div className="space-y-2 pl-4">
                  {(UPLOAD_DOCS.transfert || []).map((doc, idx) => {
                    const key = `transfert-${doc}`;
                    return (
                      <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                        <Checkbox id={`doc-${key}`} checked={!!docsChecked[key]} onCheckedChange={() => toggleDoc(key)} />
                        <div className="flex-1">
                          <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                          {!!docsChecked[key] && (
                            <div className="mt-1">
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) setDocumentFiles((p) => ({ ...p, [key]: file })); }} className="text-xs w-full" />
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

  // ── Step 9: Documents administratifs ──
  const renderStep9 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t("nrp.s9.title")}</h3>
        <p className="text-sm text-slate-600 mb-4">{t("nrp.s9.subtitle")}</p>
      </div>
      <div className="space-y-2">
        {DOCS_ADMIN.map((doc, idx) => (
          <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50">
            <Checkbox id={`admin-doc-${idx}`} checked={!!docsAdminChecked[doc]} onCheckedChange={() => toggleDocAdmin(doc)} />
            <div className="flex-1">
              <Label htmlFor={`admin-doc-${idx}`} className="cursor-pointer text-sm">{doc}</Label>
              {!!docsAdminChecked[doc] && (
                <div className="mt-1">
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) setDocumentFiles((p) => ({ ...p, [`admin-${doc}`]: file })); }} className="text-xs w-full" />
                  {documentFiles[`admin-${doc}`] && <p className="text-xs text-green-600 mt-0.5">{documentFiles[`admin-${doc}`].name}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 10: Déclaration et signature ──
  const renderStep10 = () => (
    <div className="space-y-6">
      {/* Official declaration text */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          <span className="font-bold">{t("nrp.s10.declareLabel")}</span>{" "}{t("nrp.s10.declareText")}{" "}
          <a href="https://www.algerac.dz" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">www.algerac.dz</a>
        </p>

        <div>
          <p className="font-bold mb-2">{t("nrp.s10.commitTitle")}</p>
          <ol className="list-[lower-alpha] pl-6 space-y-2">
            <li>
              <span className="font-bold">{t("nrp.s10.informLabel")}</span>{" "}{t("nrp.s10.informText")}
            </li>
            <li>
              <span className="font-bold">{t("nrp.s10.transmitLabel")}</span>{" "}{t("nrp.s10.transmitText")}
            </li>
            <li>
              <span className="font-bold">{t("nrp.s10.allowLabel")}</span>{" "}{t("nrp.s10.allowText")}
            </li>
          </ol>
        </div>

        <p>
          {t("nrp.s10.normesText")}{" "}
          <a href="https://www.algerac.dz" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 underline">www.algerac.dz</a>{" "}
          {t("nrp.s10.normesText2")}
        </p>

        <p>{t("nrp.s10.droitsText")}</p>

        <p>
          <span className="font-bold">{t("nrp.s10.authorizedLabel")}</span>{" "}{t("nrp.s10.authorizedBy")}{" "}
          <Input
            value={organismeSoumission}
            onChange={(e) => setOrganismeSoumission(e.target.value)}
            placeholder={t("nrp.s10.organismePlaceholder")}
            className="inline-block w-64 h-7 text-sm mx-1 align-middle"
          />{" "}
          {t("nrp.s10.authorizedText2")}
        </p>
      </div>

      {/* Le Demandeur */}
      <div className="space-y-4">
        <h3 className="font-semibold text-base border-b pb-2">{t("nrp.s10.demandeurTitle")}</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>{t("nrp.s10.date")} <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <Input
                value={demandeurDate ? new Date(demandeurDate).toLocaleDateString("fr-DZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                readOnly
                className="bg-slate-50 text-slate-600 cursor-default"
              />
              <span className="text-xs text-slate-400 whitespace-nowrap">{t("nrp.s10.dateAutoFill")}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("nrp.s10.nomPrenom")} <span className="text-red-500">*</span></Label>
            <Input value={demandeurNom} onChange={(e) => setDemandeurNom(e.target.value)} placeholder={t("nrp.s10.nomPrenomPlaceholder")} />
            {errors.demandeurNom && <p className="text-sm text-red-500">{errors.demandeurNom}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("nrp.s10.fonction")} <span className="text-red-500">*</span></Label>
            <Input value={demandeurFonction} onChange={(e) => setDemandeurFonction(e.target.value)} placeholder={t("nrp.s10.fonctionPlaceholder")} />
            {errors.demandeurFonction && <p className="text-sm text-red-500">{errors.demandeurFonction}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("nrp.s10.signature")} <span className="text-red-500">*</span></Label>
            <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={t("nrp.s10.signaturePlaceholder")} />
            {errors.signature && <p className="text-sm text-red-500">{errors.signature}</p>}
          </div>
        </div>
      </div>

      <div className={cn("flex items-start space-x-3 p-4 rounded-lg border-2", errors.engagements ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50")}>
        <Checkbox id="engagements" checked={engagementsAcceptes} onCheckedChange={(checked) => setEngagementsAcceptes(!!checked)} />
        <Label htmlFor="engagements" className="cursor-pointer text-sm leading-relaxed">
          {t("nrp.s10.checkboxLabel")}
        </Label>
      </div>
      {errors.engagements && <p className="text-sm text-red-500">{errors.engagements}</p>}
    </div>
  );

  // ── Step router ──
  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      case 9: return renderStep9();
      case 10: return renderStep10();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-4xl space-y-6">

            <div>
              <h1 className="text-2xl font-bold">{t("nrp.title")}</h1>
              <p className="text-muted-foreground mt-1">{t("nrp.subtitle")}</p>
            </div>

            {/* ── DEMO FILL BAR (dev only) ── */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3">
              <span className="text-xs font-semibold text-amber-700 mr-1">Demo :</span>
              {TYPES_DEMANDE.map((td) => (
                <Button
                  key={td.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100"
                  onClick={() => fillDemo(td.value)}
                >
                  {td.label}
                </Button>
              ))}
              <span className="text-[10px] text-amber-500 ml-auto">Rempli automatiquement pour test</span>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("nrp.stepOf", { current: currentStep, total: STEPS.length })}</h2>
                  <p className="text-sm text-slate-600">{t(`nrp.steps.${currentStep}`)}</p>
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {Math.round((currentStep / STEPS.length) * 100)}{t("nrp.pctCompleted")}
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
                  <div key={step.id} className={cn("flex flex-col items-center transition-all", step.id <= currentStep ? "opacity-100" : "opacity-40")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step.id < currentStep ? "bg-[#00A63E] text-white"
                        : step.id === currentStep ? "bg-[#00A63E] text-white ring-4 ring-[#00A63E]/20"
                        : "bg-slate-200 text-slate-400"
                    )}>
                      {step.id}
                    </div>
                    <span className="text-[10px] mt-1 text-center hidden md:block max-w-[90px]">{t(`nrp.steps.${step.id}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form content */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {renderStep()}

                <div className="flex justify-between mt-8 pt-6 border-t">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prev} className="gap-2">
                      <ChevronLeft className="w-4 h-4" /> {t("nrp.nav.prev")}
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setLocation("/oec/dashboard")}>
                      {t("nrp.nav.cancel")}
                    </Button>
                  )}

                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={next} className="gap-2 ml-auto" style={{ backgroundColor: "#00A63E" }}>
                      {t("nrp.nav.next")} <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmitClick} disabled={loading || submitted} className="ml-auto" style={{ backgroundColor: "#00A63E" }}>
                      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("nrp.nav.submitting")}</> : submitted ? t("nrp.nav.alreadySubmitted") : t("nrp.nav.submit")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>

      {/* Confirmation avant soumission */}
      <Dialog open={showConfirmDialog} onOpenChange={(o) => !loading && setShowConfirmDialog(o)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              {t("nrp.dialogs.confirm.title")}
            </DialogTitle>
            <DialogDescription>
              {t("nrp.dialogs.confirm.desc")}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>{t("nrp.dialogs.confirm.backToForm")}</Button>
            <Button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: "#00A63E" }}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("nrp.nav.submitting")}</> : t("nrp.dialogs.confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission success dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              {t("nrp.dialogs.success.title")}
            </DialogTitle>
            <DialogDescription>
              {t("nrp.dialogs.success.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Prochaines étapes</p>
                  <p className="text-sm text-blue-700 mt-2">
  Votre dossier sera vérifié par ALGERAC et traité conformément à la procédure en vigueur.
</p>
<p className="text-sm text-blue-700 mt-2">
  Vous serez informé de l’avancement de votre demande ainsi que des frais associés.
</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => { setShowPaymentDialog(false); setLocation("/oec/mes-demandes"); }}
              className="w-full" size="lg" style={{ backgroundColor: "#00A63E" }}
            >
              {t("nrp.dialogs.success.viewRequests")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
