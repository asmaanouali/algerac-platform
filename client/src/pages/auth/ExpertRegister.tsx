import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, ChevronLeft, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ValidationErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: "Type & Identification" },
  { id: 2, title: "Contacts" },
  { id: 3, title: "Formation" },
  { id: 4, title: "Expérience" },
  { id: 5, title: "Expertise & Documents" },
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
  const [cv, setCV] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    formationPrincipale: "",
    experiencePrincipale: "",
    rgpdConsent: false,
  });

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

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCV(e.target.files[0]);
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

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!agreedToTerms || !formData.rgpdConsent) {
      setApiError("Vous devez cocher les deux engagements pour continuer");
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
                />
              </div>

              <div className="space-y-2">
                <Label>Prénom <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Date de naissance <span className="text-red-500">*</span></Label>
                <Input 
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
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
                <Label>Situation familiale</Label>
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
                <Label>Photo <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="gap-2 bg-white" 
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
                />
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
            <h3 className="font-semibold text-lg">Formation académique & professionnelle</h3>
            <div className="space-y-2">
              <Label>Résumé de votre formation principale</Label>
              <Textarea 
                placeholder="Décrivez votre parcours de formation (diplômes, certifications principales...)"
                rows={4}
                value={formData.formationPrincipale}
                onChange={(e) => setFormData({...formData, formationPrincipale: e.target.value})}
              />
            </div>
            <p className="text-sm text-slate-600">
              💡 Vous pourrez détailler vos formations complètes après validation de votre candidature
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Expérience professionnelle</h3>
            <div className="space-y-2">
              <Label>Résumé de votre expérience principale</Label>
              <Textarea 
                placeholder="Décrivez votre expérience professionnelle pertinente (postes, responsabilités, durées...)"
                rows={4}
                value={formData.experiencePrincipale}
                onChange={(e) => setFormData({...formData, experiencePrincipale: e.target.value})}
              />
            </div>
            <p className="text-sm text-slate-600">
              💡 Vous pourrez détailler votre expérience complète après validation de votre candidature
            </p>
          </div>
        );

      case 5:
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
            </div>

            <div className="pt-6 space-y-4 border-t">
              <h3 className="font-semibold text-lg">Engagements</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    id="agree"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <Label htmlFor="agree" className="text-sm leading-relaxed font-medium cursor-pointer">
                    Je confirme l&apos;exactitude des informations fournies et mon engagement 
                    d&apos;indépendance, d&apos;objectivité et de confidentialité conformément 
                    aux règles d&apos;ALGERAC. <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    id="rgpd"
                    checked={formData.rgpdConsent}
                    onChange={e => setFormData({ ...formData, rgpdConsent: e.target.checked })}
                  />
                  <Label htmlFor="rgpd" className="text-sm leading-relaxed font-medium cursor-pointer">
                    En soumettant ce formulaire, j'autorise ALGERAC à collecter, traiter et exploiter les données fournies dans le cadre de l'étude de ma candidature, conformément à la réglementation en vigueur. <span className="text-red-500">*</span>
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
          <h2 className="text-3xl font-bold">Inscription Expert / Évaluateur / Formateur</h2>
          <p className="text-slate-600">Candidature pour rejoindre notre équipe d&apos;experts</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                  currentStep >= step.id 
                    ? "bg-[#00A63E] text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {step.id}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 transition-colors",
                  currentStep > step.id ? "bg-[#00A63E]" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {apiError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="flex-1">{apiError}</p>
          </div>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-8 md:p-12">
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button 
                  onClick={nextStep}
                  className="gap-2 ml-auto"
                  style={{ backgroundColor: '#00A63E' }}
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading || !agreedToTerms || !formData.rgpdConsent}
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
