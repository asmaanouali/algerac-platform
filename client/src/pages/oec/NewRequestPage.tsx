import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CheckCircle, CreditCard, ArrowRight, ChevronLeft, AlertCircle } from "lucide-react";
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

const DOCUMENTS_ANNEXES: Record<string, string[]> = {
  inspection: [
    "FOR 04", "FOR 04-1", "Manuel qualité", "Procédures SM", "Procédures techniques",
    "Liste des documents", "Dernier rapport d'audit interne", "Dernier CR de revue de direction",
    "Liste des inspecteurs", "Liste des équipements", "Certificats d'étalonnage",
    "Police d'assurance", "Liste des sites clients", "Agrément",
    "Dossier de validation des méthodes", "Spécimen du rapport d'inspection",
  ],
  essais: [
    "FOR 05", "Manuel qualité", "Politiques/procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Procédure d'incertitudes", "Gestion des risques",
    "Spécimen rapport d'essai", "Dossier validation des méthodes",
    "Liste des étalons/équipements", "Certificats d'étalonnage",
    "Procédure de surveillance", "Rapport essais d'aptitude",
  ],
  etalonnage: [
    "FOR 06", "Manuel qualité", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Procédure d'incertitudes", "Feuilles de calcul",
    "Gestion des risques", "Spécimen certificat d'étalonnage", "Liste des étalons",
    "Équipements étalonnés en interne", "Certificats d'étalonnage",
    "Procédure de surveillance", "Dossiers de validation",
    "Rapport essais d'aptitude", "Liste du personnel habilité",
  ],
  examens_medicaux: [
    "Organigramme", "Modalités des biologistes", "Procédure examens urgents",
    "Procédures gestion du personnel", "Gestion du système d'information",
    "Procédure validation/vérification méthode", "Certificats d'aptitude FOR 05-3",
    "Procédure CIQ/EEQ", "Résultats EEQ", "Procédure incertitudes", "Manuel qualité",
    "Liste des documents", "Planning audits internes", "Planning revues de direction",
    "Spécimen CR résultats", "Procédures SM", "Questionnaire FOR 05-2",
    "Certificats d'étalonnage",
  ],
  essais_aptitude: [
    "FOR 05-5", "Manuel SM", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction", "Dossier complet campagne ILC",
    "Technique de valeur assignée", "Liste prestataires externes",
    "Spécimen rapports", "Procédure et matrice des risques", "FOR 81",
  ],
  cert_sm: [
    "FOR 07", "Manuel SM", "Procédures", "Liste des documents",
    "Audit interne", "Revue de direction",
    "Composition comité de décision + preuves de compétences",
    "Analyse de risque du comité d'impartialité", "Police d'assurance RC",
    "Liste des documents par référentiel (ISO 9001/14001/22000/45001)",
    "Matrice des compétences auditeurs", "Liste des clients certifiés",
    "Planning des audits pour witnessing", "FOR 79", "FOR 80",
  ],
  cert_produits: [
    "FOR 07-5", "Liste des documents", "Procédures SM et technique",
    "Programme de certification + PV de validation", "Autorisation du propriétaire",
    "Audit interne", "Revue de direction", "Dispositif d'impartialité",
    "Liste des ressources", "Spécimen certificat", "Composition dispositif décisionnel",
    "Règles de gestion certificat/licence/marque", "Liste des produits certifiés",
    "Spécimen contrat", "FOR 07-6", "Planning audits de suivi",
  ],
  cert_personnes: [
    "FOR 07-8", "Manuel SM", "Dispositions SM", "Liste des documents",
    "Audit interne", "Revue de direction",
    "Composition des dispositifs de gestion/appels/impartialité",
    "Analyse des risques impartialité",
    "Programme de certification ISO/IEC 17024 + PV de validation",
    "Matrice des compétences évaluateurs", "Modèle de certificat",
    "Calendrier pour witnessing", "Liste des activités externalisées", "FOR 82",
  ],
  transfert: [
    "Statut juridique de l'entité réceptrice",
    "Dispositions gestion des risques",
    "Spécimens de rapports/certificats",
    "Rapports d'évaluation les plus récents",
    "État d'avancement clôture des écarts",
    "Certificat d'accréditation de l'organisme cédant",
  ],
};

const DOCS_ADMIN = [
  "Copie des statuts de l'organisme",
  "Copie de la carte d'immatriculation fiscale (NIS, NIF)",
  "Copie du N° article d'imposition",
  "Copie du registre de commerce",
  "Chèque à l'ordre d'ALGERAC (organismes nationaux)",
  "Ordre de virement à l'ordre d'ALGERAC (organismes étrangers)",
];

const TYPE_MAP: Record<string, string> = {
  initiale: "INITIAL",
  extension: "EXTENSION",
  renouvellement: "RENOUVELLEMENT",
  transfert: "EXTENSION",
};

const STEPS = [
  { id: 1, title: "Type de demande" },
  { id: 2, title: "Documents techniques" },
  { id: 3, title: "Documents administratifs" },
  { id: 4, title: "Déclaration et signature" },
];

interface FormState {
  typeDemande: string;
  dateEvaluation: string;
  activites: string[];
  documentsChecked: Record<string, boolean>;
  docsAdminChecked: Record<string, boolean>;
  organismeSoumission: string;
  demandeurNom: string;
  demandeurFonction: string;
  demandeurDate: string;
  signature: string;
  engagementsAcceptes: boolean;
}

export default function NewRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    typeDemande: "",
    dateEvaluation: "",
    activites: [],
    documentsChecked: {},
    docsAdminChecked: {},
    organismeSoumission: "",
    demandeurNom: "",
    demandeurFonction: "",
    demandeurDate: "",
    signature: "",
    engagementsAcceptes: false,
  });

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

  const update = (field: keyof FormState, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleActivite = (val: string) => {
    const curr = form.activites;
    update("activites", curr.includes(val) ? curr.filter((a) => a !== val) : [...curr, val]);
  };

  const toggleDoc = (key: string) =>
    update("documentsChecked", { ...form.documentsChecked, [key]: !form.documentsChecked[key] });

  const toggleDocAdmin = (doc: string) =>
    update("docsAdminChecked", { ...form.docsAdminChecked, [doc]: !form.docsAdminChecked[doc] });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.typeDemande) errs.typeDemande = "Le type de demande est requis";
      if (form.activites.length === 0) errs.activites = "Veuillez sélectionner au moins une activité";
    }
    if (currentStep === 4 && !form.engagementsAcceptes) {
      errs.engagements = "Vous devez accepter les engagements";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: "Champs requis manquants", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
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

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const fileToBase64 = (f: File): Promise<string> =>
        new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res((r.result as string).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });

      const docsList: Array<{ key: string; name: string; base64?: string; mimeType?: string }> = [];
      for (const [key, checked] of Object.entries(form.documentsChecked)) {
        if (checked) {
          const file = documentFiles[key];
          if (file) docsList.push({ key, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          else docsList.push({ key, name: key });
        }
      }
      for (const [doc, checked] of Object.entries(form.docsAdminChecked)) {
        if (checked) {
          const file = documentFiles[`admin-${doc}`];
          if (file) docsList.push({ key: `admin-${doc}`, name: file.name, base64: await fileToBase64(file), mimeType: file.type });
          else docsList.push({ key: `admin-${doc}`, name: doc });
        }
      }

      const backendType = TYPE_MAP[form.typeDemande] || "INITIAL";
      const domain = form.activites
        .map((a) => TYPES_ACTIVITES.find((t) => t.value === a)?.label || a)
        .join(", ");

      const description = JSON.stringify({
        typeDemande: form.typeDemande,
        dateEvaluation: form.dateEvaluation,
        activites: form.activites,
        demandeurNom: form.demandeurNom,
        demandeurFonction: form.demandeurFonction,
        demandeurDate: form.demandeurDate,
        signature: form.signature,
        organismeSoumission: form.organismeSoumission,
        documents: docsList,
      });

      // Créer la demande (DRAFT)
      const createRes = await fetch("/api/requests/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: backendType, domain, description }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || "Erreur lors de la création");
      }

      const createData = await createRes.json();
      const requestId = createData.data.id;

      // Soumettre la demande (passe en PENDING_PAYMENT)
      const submitRes = await fetch(`/api/requests/${requestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.message || "Erreur lors de la soumission");
      }

      setCreatedRequestId(requestId);
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

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Type de demande <span className="text-red-500">*</span>
        </Label>
        <RadioGroup value={form.typeDemande} onValueChange={(v) => update("typeDemande", v)}>
          <div className="grid md:grid-cols-2 gap-3">
            {TYPES_DEMANDE.map((t) => (
              <div key={t.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                <RadioGroupItem value={t.value} id={t.value} />
                <Label htmlFor={t.value} className="cursor-pointer flex-1">{t.label}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        {errors.typeDemande && <p className="text-sm text-red-500">{errors.typeDemande}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date d'évaluation souhaitée</Label>
        <StringDatePicker value={form.dateEvaluation} onChange={(v) => update("dateEvaluation", v)} />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Type d'activité <span className="text-red-500">*</span>
        </Label>
        <div className="grid md:grid-cols-2 gap-3">
          {TYPES_ACTIVITES.map((a) => (
            <div key={a.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
              <Checkbox
                id={a.value}
                checked={form.activites.includes(a.value)}
                onCheckedChange={() => toggleActivite(a.value)}
              />
              <Label htmlFor={a.value} className="cursor-pointer flex-1 text-sm">{a.label}</Label>
            </div>
          ))}
        </div>
        {errors.activites && <p className="text-sm text-red-500">{errors.activites}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Liste des documents techniques à joindre</h3>
        <p className="text-sm text-slate-600 mb-4">Cochez chaque document que vous inclurez dans votre dossier</p>
      </div>
      {form.activites.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          Veuillez sélectionner au moins une activité à l'étape 1
        </div>
      ) : (
        <div className="space-y-6">
          {form.activites.map((activity) => {
            const label = TYPES_ACTIVITES.find((a) => a.value === activity)?.label || activity;
            const docs = DOCUMENTS_ANNEXES[activity] || [];
            return (
              <div key={activity} className="space-y-3">
                <h4 className="font-semibold text-base text-[#00A63E]">{label}</h4>
                <div className="space-y-2 pl-4">
                  {docs.map((doc, idx) => {
                    const key = `${activity}-${doc}`;
                    return (
                      <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                        <Checkbox
                          id={`doc-${key}`}
                          checked={!!form.documentsChecked[key]}
                          onCheckedChange={() => toggleDoc(key)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                          {!!form.documentsChecked[key] && (
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
                              {documentFiles[key] && (
                                <p className="text-xs text-green-600 mt-0.5">{documentFiles[key].name}</p>
                              )}
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
          {form.typeDemande === "transfert" && DOCUMENTS_ANNEXES.transfert && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-base text-[#00A63E]">Annexe 09 – Documents de transfert</h4>
              <div className="space-y-2 pl-4">
                {DOCUMENTS_ANNEXES.transfert.map((doc, idx) => {
                  const key = `transfert-${doc}`;
                  return (
                    <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        id={`doc-${key}`}
                        checked={!!form.documentsChecked[key]}
                        onCheckedChange={() => toggleDoc(key)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`doc-${key}`} className="cursor-pointer text-sm">{doc}</Label>
                        {!!form.documentsChecked[key] && (
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
                            {documentFiles[key] && (
                              <p className="text-xs text-green-600 mt-0.5">{documentFiles[key].name}</p>
                            )}
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
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Documents administratifs</h3>
        <p className="text-sm text-slate-600 mb-4">Cochez chaque document administratif que vous inclurez</p>
      </div>
      <div className="space-y-2">
        {DOCS_ADMIN.map((doc, idx) => (
          <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50">
            <Checkbox
              id={`admin-doc-${idx}`}
              checked={!!form.docsAdminChecked[doc]}
              onCheckedChange={() => toggleDocAdmin(doc)}
            />
            <div className="flex-1">
              <Label htmlFor={`admin-doc-${idx}`} className="cursor-pointer text-sm">{doc}</Label>
              {!!form.docsAdminChecked[doc] && (
                <div className="mt-1">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setDocumentFiles((p) => ({ ...p, [`admin-${doc}`]: file }));
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

  const renderStep4 = () => (
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
            value={form.organismeSoumission}
            onChange={(e) => update("organismeSoumission", e.target.value)}
            placeholder="Nom officiel de l'organisme"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom complet du demandeur</Label>
            <Input value={form.demandeurNom} onChange={(e) => update("demandeurNom", e.target.value)} placeholder="Nom et prénom" />
          </div>
          <div className="space-y-2">
            <Label>Fonction</Label>
            <Input value={form.demandeurFonction} onChange={(e) => update("demandeurFonction", e.target.value)} placeholder="Fonction du demandeur" />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <StringDatePicker value={form.demandeurDate} onChange={(v) => update("demandeurDate", v)} />
          </div>
          <div className="space-y-2">
            <Label>Signature (nom)</Label>
            <Input value={form.signature} onChange={(e) => update("signature", e.target.value)} placeholder="Signature électronique" />
          </div>
        </div>
      </div>

      <div className={cn("flex items-start space-x-3 p-4 rounded-lg border-2", errors.engagements ? "border-red-300 bg-red-50" : "bg-slate-50")}>
        <Checkbox
          id="engagements"
          checked={form.engagementsAcceptes}
          onCheckedChange={(checked) => update("engagementsAcceptes", !!checked)}
        />
        <Label htmlFor="engagements" className="cursor-pointer text-sm leading-relaxed">
          J'accepte les engagements ci-dessus et confirme que j'ai l'autorité pour soumettre cette demande au nom de l'organisme
        </Label>
      </div>
      {errors.engagements && <p className="text-sm text-red-500">{errors.engagements}</p>}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-4xl space-y-6">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nouvelle Demande d'Accréditation</h1>
              <p className="text-muted-foreground mt-1">Remplissez le formulaire ci-dessous pour soumettre votre dossier</p>
            </div>

            {/* Progress */}
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
                    <span className="text-[10px] mt-1 text-center hidden md:block max-w-[90px]">{step.title}</span>
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
                      <ChevronLeft className="w-4 h-4" /> Précédent
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setLocation("/oec/dashboard")}>
                      Annuler
                    </Button>
                  )}

                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={next} className="gap-2 ml-auto" style={{ backgroundColor: "#00A63E" }}>
                      Suivant <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmit} disabled={loading} className="ml-auto" style={{ backgroundColor: "#00A63E" }}>
                      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</> : "Soumettre la demande"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>

      {/* Dialog de succès - Information sur les frais d'enregistrement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Demande soumise avec succès
            </DialogTitle>
            <DialogDescription>
              Votre demande d'accréditation a été enregistrée et transmise au service administratif.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Frais d'enregistrement du dossier</p>
                  <p className="text-sm text-blue-700 mt-2">
                    Vous allez recevoir prochainement les frais d'enregistrement de votre dossier. 
                    Le Directeur Administratif et Financier (DAG) va examiner votre dossier et fixer le montant des frais.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Vous serez notifié par email dès que les frais seront fixés. 
                    Vous pourrez alors vous connecter à la plateforme et effectuer le paiement depuis votre <strong>page de facturation</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => { setShowPaymentDialog(false); setLocation("/oec/mes-demandes"); }}
              className="w-full"
              size="lg"
              style={{ backgroundColor: "#00A63E" }}
            >
              Voir mes demandes
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowPaymentDialog(false); setLocation("/oec/dashboard"); }}
              className="w-full text-muted-foreground"
            >
              Retour au tableau de bord
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
