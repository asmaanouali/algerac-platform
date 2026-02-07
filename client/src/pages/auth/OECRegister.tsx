import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, FileText, Upload, AlertCircle } from "lucide-react";

const ACTIVITIES = [
  { label: "Inspection (FOR 04)", value: "inspection" },
  { label: "Essais (FOR 05)", value: "essais" },
  { label: "Étalonnage (FOR 06)", value: "etalonnage" },
  { label: "Examens médicaux (FOR 05-1)", value: "examens_medicaux" },
  { label: "Essais d'aptitude (FOR 05-5)", value: "essais_aptitude" },
  { label: "Certification SM (FOR 07)", value: "cert_sm" },
  { label: "Certification produits (FOR 07-5)", value: "cert_produits" },
  { label: "Certification personnes (FOR 07-8)", value: "cert_personnes" },
];

const STATUTS = ["EURL", "SARL", "SPA", "EPE", "EPIC", "Autre"];
const CONSEIL_TYPES = ["Accompagnement", "Formation", "Audit interne", "Autres"];

interface ValidationErrors {
  [key: string]: string;
}

type Reconnaissance = { 
  id: number;
  nom: string; 
  date: string; 
  description: string;
};

type ConseilDetail = { 
  prestataire?: string; 
  date?: string; 
  description?: string;
};

interface FormDataType {
  typeDemande: string;
  dateEvaluation: string;
  activites: string[];
  siteType: string;
  nomOrganisme: string;
  sigle: string;
  statutJuridique: string;
  registreCommerce: string;
  codesActivite: string;
  adresseSiege: string;
  adresseFacturation: string;
  telephone: string;
  fax: string;
  email: string;
  siteWeb: string;
  appartientGroupe: boolean;
  groupeNom: string;
  groupeAdresse: string;
  groupeRelation: string;
  groupeImpact: string;
  contactNom: string;
  contactFonction: string;
  contactAdresse: string;
  contactTelephone: string;
  contactFax: string;
  contactEmail: string;
  activitePrincipale: string;
  nbDocuments: string;
  personnelPermanent: string;
  personnelVacataire: string;
  respTechNom: string;
  respTechQualif: string;
  respTechExp: string;
  respQualNom: string;
  respQualQualif: string;
  respQualExp: string;
  conseilRecours: boolean;
  conseilTypes: string[];
  statutsFile: File | null;
  carteFiscaleFile: File | null;
  articleImpositionFile: File | null;
  registreCommerceFile: File | null;
  paiementFile: File | null;
  signataireNom: string;
  signataireFonction: string;
}

export default function OECRegister() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [conseilDetails, setConseilDetails] = useState<Record<string, ConseilDetail>>({});
  const [reconnaissances, setReconnaissances] = useState<Reconnaissance[]>([
    { id: 1, nom: "", date: "", description: "" }
  ]);
  
  const [formData, setFormData] = useState<FormDataType>({
    typeDemande: "",
    dateEvaluation: "",
    activites: [],
    siteType: "",
    nomOrganisme: "",
    sigle: "",
    statutJuridique: "",
    registreCommerce: "",
    codesActivite: "",
    adresseSiege: "",
    adresseFacturation: "",
    telephone: "",
    fax: "",
    email: "",
    siteWeb: "",
    appartientGroupe: false,
    groupeNom: "",
    groupeAdresse: "",
    groupeRelation: "",
    groupeImpact: "",
    contactNom: "",
    contactFonction: "",
    contactAdresse: "",
    contactTelephone: "",
    contactFax: "",
    contactEmail: "",
    activitePrincipale: "",
    nbDocuments: "",
    personnelPermanent: "",
    personnelVacataire: "",
    respTechNom: "",
    respTechQualif: "",
    respTechExp: "",
    respQualNom: "",
    respQualQualif: "",
    respQualExp: "",
    conseilRecours: false,
    conseilTypes: [],
    statutsFile: null,
    carteFiscaleFile: null,
    articleImpositionFile: null,
    registreCommerceFile: null,
    paiementFile: null,
    signataireNom: "",
    signataireFonction: "",
  });

  const handleFileChange = (name: string, file: File | null) => {
    setFormData({ ...formData, [name]: file });
  };

  const handleAddReconnaissance = () => {
    const newId = reconnaissances.length > 0 
      ? Math.max(...reconnaissances.map(r => r.id)) + 1 
      : 1;
    setReconnaissances([...reconnaissances, { id: newId, nom: "", date: "", description: "" }]);
  };

  const handleRemoveReconnaissance = (id: number) => {
    setReconnaissances(reconnaissances.filter(r => r.id !== id));
  };

  const handleReconnaissanceChange = (id: number, field: keyof Reconnaissance, value: string) => {
    setReconnaissances(reconnaissances.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleConseilTypeChange = (type: string, checked: boolean) => {
    let conseilTypes = formData.conseilTypes || [];
    if (checked) {
      conseilTypes = [...conseilTypes, type];
    } else {
      conseilTypes = conseilTypes.filter(t => t !== type);
    }
    setFormData({ ...formData, conseilTypes });
  };

  const handleActivityChange = (activity: string, checked: boolean) => {
    let activites = formData.activites || [];
    if (checked) {
      activites = [...activites, activity];
    } else {
      activites = activites.filter(a => a !== activity);
    }
    setFormData({ ...formData, activites });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        email: "Format d'email invalide"
      }));
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

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setApiError("Vous devez accepter les exigences d'accréditation.");
      return;
    }

    // Validation basique
    if (!formData.nomOrganisme || !formData.email) {
      setApiError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!validateEmail(formData.email)) {
      setApiError("Veuillez corriger les erreurs de validation");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v instanceof File) {
          fd.append(k, v);
        } else if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v));
        } else if (typeof v === "boolean") {
          fd.append(k, v ? "true" : "false");
        } else if (v !== null && v !== undefined) {
          fd.append(k, v as string);
        }
      });
      fd.append("userType", "OEC");
      fd.append("reconnaissances", JSON.stringify(reconnaissances));
      fd.append("conseilDetails", JSON.stringify(conseilDetails));

      const response = await fetch("http://localhost:8082/api/auth/signup/oec", {
        method: "POST",
        body: fd,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header (copied from ExpertRegister) */}
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
          <h2 className="text-3xl font-bold">Demande d'Accréditation OEC</h2>
          <p className="text-slate-600">Organisme d'Évaluation de la Conformité</p>
        </div>

        {/* Erreur API */}
        {apiError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="flex-1">{apiError}</p>
          </div>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-8 md:p-12 space-y-10">
            
            {/* Section 1 - Informations générales */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                1 - Informations générales
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Type de demande <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.typeDemande}
                    onValueChange={(value) => setFormData({...formData, typeDemande: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="initiale">Initiale</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="renouvellement">Renouvellement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date d&apos;évaluation souhaitée</Label>
                  <Input 
                    type="date"
                    value={formData.dateEvaluation}
                    onChange={(e) => setFormData({...formData, dateEvaluation: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Activités demandées <span className="text-red-500">*</span></Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {ACTIVITIES.map(activity => (
                    <label key={activity.value} className="flex items-center gap-2 p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.activites.includes(activity.value)}
                        onChange={(e) => handleActivityChange(activity.value, e.target.checked)}
                      />
                      <span className="text-sm">{activity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type de site</Label>
                <Select 
                  value={formData.siteType}
                  onValueChange={(value) => setFormData({...formData, siteType: value})}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="fixe">Fixe</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="temporaire">Temporaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section 2 - Identification de l'organisme */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                2 - Identification de l&apos;organisme
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nom de l&apos;organisme <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Nom complet de l'organisme"
                    value={formData.nomOrganisme}
                    onChange={(e) => setFormData({...formData, nomOrganisme: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sigle</Label>
                  <Input 
                    placeholder="Sigle"
                    value={formData.sigle}
                    onChange={(e) => setFormData({...formData, sigle: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Statut juridique <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.statutJuridique}
                    onValueChange={(value) => setFormData({...formData, statutJuridique: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {STATUTS.map(statut => (
                        <SelectItem key={statut} value={statut}>{statut}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>N° Registre de commerce</Label>
                  <Input 
                    placeholder="Ex: 12345678"
                    value={formData.registreCommerce}
                    onChange={(e) => setFormData({...formData, registreCommerce: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Code(s) d&apos;activité</Label>
                  <Input 
                    placeholder="Codes d'activité"
                    value={formData.codesActivite}
                    onChange={(e) => setFormData({...formData, codesActivite: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Section 3 - Coordonnées */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                3 - Coordonnées
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse du siège social <span className="text-red-500">*</span></Label>
                  <Textarea 
                    placeholder="Adresse complète"
                    rows={2}
                    value={formData.adresseSiege}
                    onChange={(e) => setFormData({...formData, adresseSiege: e.target.value})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse de facturation</Label>
                  <Textarea 
                    placeholder="Si différente du siège social"
                    rows={2}
                    value={formData.adresseFacturation}
                    onChange={(e) => setFormData({...formData, adresseFacturation: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléphone <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    onBlur={(e) => validatePhone(e.target.value, 'telephone')}
                  />
                  {errors.telephone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.telephone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fax</Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.fax}
                    onChange={(e) => setFormData({...formData, fax: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email"
                    placeholder="contact@exemple.dz"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    onBlur={(e) => validateEmail(e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Site Web</Label>
                  <Input 
                    placeholder="www.exemple.dz"
                    value={formData.siteWeb}
                    onChange={(e) => setFormData({...formData, siteWeb: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Section 4 - Appartenance à un groupe */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                4 - Appartenance à un groupe
              </h3>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded">
                <input 
                  type="checkbox"
                  id="appartientGroupe"
                  checked={formData.appartientGroupe}
                  onChange={(e) => setFormData({...formData, appartientGroupe: e.target.checked})}
                />
                <Label htmlFor="appartientGroupe" className="cursor-pointer">
                  L&apos;organisme appartient-il à un groupe ?
                </Label>
              </div>

              {formData.appartientGroupe && (
                <div className="grid md:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nom du groupe</Label>
                    <Input 
                      placeholder="Nom du groupe"
                      value={formData.groupeNom}
                      onChange={(e) => setFormData({...formData, groupeNom: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Adresse du groupe</Label>
                    <Textarea 
                      placeholder="Adresse complète"
                      rows={2}
                      value={formData.groupeAdresse}
                      onChange={(e) => setFormData({...formData, groupeAdresse: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Nature de la relation</Label>
                    <Input 
                      placeholder="Ex: Filiale, Holding, etc."
                      value={formData.groupeRelation}
                      onChange={(e) => setFormData({...formData, groupeRelation: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Impact sur l&apos;impartialité</Label>
                    <Textarea 
                      placeholder="Décrivez l'impact potentiel sur l'impartialité"
                      rows={3}
                      value={formData.groupeImpact}
                      onChange={(e) => setFormData({...formData, groupeImpact: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 5 - Personne à contacter */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                5 - Personne à contacter
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom complet <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Nom et prénom"
                    value={formData.contactNom}
                    onChange={(e) => setFormData({...formData, contactNom: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fonction</Label>
                  <Input 
                    placeholder="Fonction dans l'organisme"
                    value={formData.contactFonction}
                    onChange={(e) => setFormData({...formData, contactFonction: e.target.value})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse</Label>
                  <Input 
                    placeholder="Adresse"
                    value={formData.contactAdresse}
                    onChange={(e) => setFormData({...formData, contactAdresse: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactTelephone}
                    onChange={(e) => setFormData({...formData, contactTelephone: e.target.value})}
                    onBlur={(e) => validatePhone(e.target.value, 'contactTelephone')}
                  />
                  {errors.contactTelephone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.contactTelephone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fax</Label>
                  <Input 
                    placeholder="+213 XXX XXX XXX"
                    value={formData.contactFax}
                    onChange={(e) => setFormData({...formData, contactFax: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="contact@exemple.dz"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    onBlur={(e) => validateEmail(e.target.value)}
                  />
                  {errors.contactEmail && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.contactEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6 - Informations sur l'activité */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                6 - Informations sur l&apos;activité
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Activité principale</Label>
                  <Textarea 
                    placeholder="Décrivez votre activité principale"
                    rows={3}
                    value={formData.activitePrincipale}
                    onChange={(e) => setFormData({...formData, activitePrincipale: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre de documents du système</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 25"
                    value={formData.nbDocuments}
                    onChange={(e) => setFormData({...formData, nbDocuments: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personnel permanent</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 15"
                    value={formData.personnelPermanent}
                    onChange={(e) => setFormData({...formData, personnelPermanent: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personnel vacataire</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 5"
                    value={formData.personnelVacataire}
                    onChange={(e) => setFormData({...formData, personnelVacataire: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Section 7 - Responsables */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                7 - Responsables
              </h3>
              
              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200 space-y-4">
                <h4 className="text-sm font-semibold text-green-800">Responsable Technique</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input 
                      placeholder="Nom et prénom"
                      value={formData.respTechNom}
                      onChange={(e) => setFormData({...formData, respTechNom: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualifications</Label>
                    <Input 
                      placeholder="Qualifications"
                      value={formData.respTechQualif}
                      onChange={(e) => setFormData({...formData, respTechQualif: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expérience</Label>
                    <Input 
                      placeholder="Ex: 10 ans"
                      value={formData.respTechExp}
                      onChange={(e) => setFormData({...formData, respTechExp: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-4">
                <h4 className="text-sm font-semibold text-blue-800">Responsable Qualité</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input 
                      placeholder="Nom et prénom"
                      value={formData.respQualNom}
                      onChange={(e) => setFormData({...formData, respQualNom: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualifications</Label>
                    <Input 
                      placeholder="Qualifications"
                      value={formData.respQualQualif}
                      onChange={(e) => setFormData({...formData, respQualQualif: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expérience</Label>
                    <Input 
                      placeholder="Ex: 8 ans"
                      value={formData.respQualExp}
                      onChange={(e) => setFormData({...formData, respQualExp: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8 - Recours au conseil */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                8 - Recours au conseil
              </h3>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded">
                <input 
                  type="checkbox"
                  id="conseilRecours"
                  checked={formData.conseilRecours}
                  onChange={(e) => setFormData({...formData, conseilRecours: e.target.checked})}
                />
                <Label htmlFor="conseilRecours" className="cursor-pointer">
                  L&apos;organisme a-t-il eu recours au conseil ?
                </Label>
              </div>

              {formData.conseilRecours && (
                <div className="space-y-4 p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <Label>Types de conseil utilisés</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {CONSEIL_TYPES.map(type => (
                      <label key={type} className="flex items-center gap-2 p-3 bg-white rounded hover:bg-amber-100 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.conseilTypes.includes(type)}
                          onChange={(e) => handleConseilTypeChange(type, e.target.checked)}
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 9 - Reconnaissances */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                9 - Reconnaissances
              </h3>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Ajoutez les reconnaissances ou accréditations obtenues
                </p>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddReconnaissance}
                  className="gap-2 bg-white"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                {reconnaissances.map((rec, index) => (
                  <div key={rec.id} className="p-6 bg-slate-50 rounded-lg border-2 border-slate-200 relative">
                    {reconnaissances.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReconnaissance(rec.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nom de la reconnaissance</Label>
                        <Input 
                          placeholder="Ex: ISO 9001"
                          value={rec.nom}
                          onChange={(e) => handleReconnaissanceChange(rec.id, 'nom', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date d&apos;obtention</Label>
                        <Input 
                          type="date"
                          value={rec.date}
                          onChange={(e) => handleReconnaissanceChange(rec.id, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Détails de la reconnaissance"
                          rows={2}
                          value={rec.description}
                          onChange={(e) => handleReconnaissanceChange(rec.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {reconnaissances.length === 0 && (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
                  <p>Aucune reconnaissance ajoutée</p>
                </div>
              )}
            </div>

            {/* Section 10 - Documents requis */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                10 - Documents requis
              </h3>
              
              <div className="space-y-4">
                {[
                  { name: "statutsFile", label: "Statuts" },
                  { name: "carteFiscaleFile", label: "Carte d'immatriculation fiscale" },
                  { name: "articleImpositionFile", label: "N° article d'imposition" },
                  { name: "registreCommerceFile", label: "Registre de commerce" },
                  { name: "paiementFile", label: "Preuve de paiement" }
                ].map(({ name, label }) => (
                  <div key={name} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="gap-2 bg-white" 
                        onClick={() => document.getElementById(name)?.click()}
                      >
                        <FileText className="w-4 h-4" /> Choisir un fichier
                      </Button>
                      <input 
                        type="file" 
                        id={name} 
                        className="hidden" 
                        accept=".pdf,.jpg,.png" 
                        onChange={(e) => handleFileChange(name, e.target.files?.[0] || null)}
                      />
                      <span className="text-xs text-slate-400 italic">
                        {formData[name as keyof FormDataType] 
                          ? (formData[name as keyof FormDataType] as File).name 
                          : 'Aucun fichier sélectionné'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 11 - Signature */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                11 - Signature
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom du signataire <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Nom complet"
                    value={formData.signataireNom}
                    onChange={(e) => setFormData({...formData, signataireNom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fonction du signataire <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Fonction"
                    value={formData.signataireFonction}
                    onChange={(e) => setFormData({...formData, signataireFonction: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Engagements */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">
                Déclaration et engagements
              </h3>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                <input 
                  type="checkbox" 
                  className="mt-1" 
                  id="agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <Label htmlFor="agree" className="text-sm leading-relaxed font-medium">
                  Je déclare avoir pris connaissance des exigences d&apos;accréditation et m&apos;engage à :
                  informer ALGERAC de toute modification concernant l&apos;organisme, transmettre toutes 
                  les informations requises, faciliter les observations et évaluations, et respecter les 
                  exigences réglementaires et normatives. <span className="text-red-500">*</span>
                </Label>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base font-bold" 
              onClick={handleSubmit}
              disabled={loading || !agreedToTerms}
              style={{ backgroundColor: '#00A63E' }}
            >
              {loading ? "Envoi en cours..." : "Soumettre la demande"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}