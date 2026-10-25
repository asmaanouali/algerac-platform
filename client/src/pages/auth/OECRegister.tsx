import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ResetButton } from "@/components/ui/reset-button";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/hooks/use-theme";
import { Loader2, CheckCircle, ArrowRight, ChevronLeft, AlertCircle, Trash2, Sun, Moon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// L'inscription publique ne couvre que les étapes 1 à 3 du DOC 1 ; le reste du formulaire est
// complété par l'OEC une fois son compte créé par l'administrateur (voir NewRequestPage, mode "complétion").

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

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
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OECRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  useEffect(() => {
    setMaxStepReached((m) => Math.max(m, currentStep));
  }, [currentStep]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── DOC1 Fields (étapes 1 à 3) ──
  const [typeDemande, setTypeDemande] = useState("");
  const [dateEvaluation, setDateEvaluation] = useState("");
  const [activites, setActivites] = useState<string[]>([]);
  const [siteType, setSiteType] = useState("");

  // Organisme
  const [nomLegal, setNomLegal] = useState("");
  const [abreviation, setAbreviation] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (!logoFile) { setLogoPreview(""); return; }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);
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

  // Contact
  const [contactNom, setContactNom] = useState("");
  const [contactFonction, setContactFonction] = useState("");
  const [contactAdresse, setContactAdresse] = useState("");
  const [contactTelephone, setContactTelephone] = useState("");
  const [contactFax, setContactFax] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── Helpers ──
  const toggleActivite = (val: string) =>
    setActivites((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, logo: t("nrp.validation.logoType") }));
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setErrors((p) => ({ ...p, logo: t("nrp.validation.logoSize") }));
      e.target.value = "";
      return;
    }
    setErrors((p) => { const { logo, ...rest } = p; return rest; });
    setLogoFile(file);
  };

  // ── Validation ──
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!typeDemande) errs.typeDemande = t("nrp.validation.typeDemande");
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
      if (!adresseFacturation.trim()) errs.adresseFacturation = t("nrp.validation.adresseFacturation");
      if (!emailOrg.trim()) errs.emailOrg = t("nrp.validation.emailOrg");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrg.trim())) errs.emailOrg = t("oecRegister.validation.accountEmailInvalid");
      if (!appartientGroupe) errs.appartientGroupe = t("nrp.validation.appartientGroupe");
      if (appartientGroupe === "oui") {
        if (!groupeNom.trim()) errs.groupeNom = t("nrp.validation.groupeNom");
        if (!groupeAdresse.trim()) errs.groupeAdresse = t("nrp.validation.groupeAdresse");
        if (!groupeRelation.trim()) errs.groupeRelation = t("nrp.validation.groupeRelation");
      }
    }
    if (currentStep === 3) {
      if (!contactNom.trim()) errs.contactNom = t("nrp.validation.contactNom");
      if (!contactFonction.trim()) errs.contactFonction = t("nrp.validation.contactFonction");
      if (!contactAdresse.trim()) errs.contactAdresse = t("nrp.validation.contactAdresse");
      if (!contactTelephone.trim()) errs.contactTelephone = t("nrp.validation.contactTelephone");
      if (!contactEmail.trim()) errs.contactEmail = t("nrp.validation.contactEmail");
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
    if (submitted) {
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

      const logoBase64 = logoFile ? await fileToBase64(logoFile) : undefined;

      const backendType = TYPE_MAP[typeDemande] || "INITIAL";
      const domain = activites
        .map((a) => TYPES_ACTIVITES.find((t) => t.value === a)?.label || a)
        .join(", ");

      const doc1Part1 = {
        typeDemande, dateEvaluation, activites, siteType,
        nomLegal, abreviation,
        statutJuridique: statutJuridique === REQUIRES_AUTRE_TEXT ? `Autre: ${statutJuridiqueAutre}` : statutJuridique,
        registreCommerce, codesActivite,
        adresseSiege, adresseFacturation, emailOrg, siteWeb,
        appartientGroupe, groupeNom, groupeAdresse, groupeRelation,
        contactNom, contactFonction, contactAdresse, contactTelephone, contactFax, contactEmail,
      };

      const res = await fetch("/api/auth/signup/oec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Account: login email is the organisation email; the password is generated at account creation
          email: emailOrg.trim(),
          // Required by OECSignupRequest DTO
          userType: "OEC",
          // Organization basics
          nomOrganisme: nomLegal,
          typeOrganisme: statutJuridique === REQUIRES_AUTRE_TEXT ? statutJuridiqueAutre : statutJuridique,
          adresseSiege,
          telephone: contactTelephone,
          nomRepresentant: contactNom,
          fonction: contactFonction,
          telephoneDirect: contactTelephone,
          emailProfessionnel: contactEmail,
          porteeAccreditation: domain,
          logoBase64,
          logoMimeType: logoFile?.type,
          typeDemande: backendType,
          // Étapes 1 à 3 du DOC 1, persistées dans AccreditationRequest.description
          description: JSON.stringify({
            type: backendType,
            domain,
            description: doc1Part1,
            isMultisite: siteType === "multisites",
            multisite: null,
          }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Erreur lors de l'inscription");
      }

      setSubmitted(true);
      setShowSuccessDialog(true);
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

  const goToLogin = () => {
    setShowSuccessDialog(false);
    setLocation("/");
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
        <ResetButton show={!!typeDemande} onClick={() => setTypeDemande("")} label={t("nrp.reset")} />
        {errors.typeDemande && <p className="text-sm text-red-500">{errors.typeDemande}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t("nrp.s1.dateEvaluation")}</Label>
        <StringDatePicker clearable value={dateEvaluation} onChange={setDateEvaluation} min={new Date().toISOString().split("T")[0]} />
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
        <ResetButton show={!!siteType} onClick={() => setSiteType("")} label={t("nrp.reset")} />
        {errors.siteType && <p className="text-sm text-red-500">{errors.siteType}</p>}
      </div>
    </div>
  );

  // ── Step 2: Informations organisme (DOC1) ──
  const renderStep2 = () => (
    <div className="space-y-6">
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
          <Label>{t("nrp.s2.logo")}</Label>
          <Input key={logoFile?.name ?? "empty"} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoChange} />
          <p className="text-xs text-slate-500">{t("nrp.s2.logoHelper")}</p>
          {logoPreview && (
            <div className="flex items-center gap-3">
              <img src={logoPreview} alt="Logo" className="h-12 w-auto max-w-[8rem] object-contain border rounded bg-white p-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogoFile(null)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          )}
          {errors.logo && <p className="text-sm text-red-500">{errors.logo}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("nrp.s2.statutJuridique")} <span className="text-red-500">*</span></Label>
          <Select clearable value={statutJuridique} onValueChange={(v) => { setStatutJuridique(v); if (v !== REQUIRES_AUTRE_TEXT) setStatutJuridiqueAutre(""); }}>
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
          <Label>{t("nrp.s2.adresseFacturation")} <span className="text-red-500">*</span></Label>
          <Textarea value={adresseFacturation} onChange={(e) => setAdresseFacturation(e.target.value)} placeholder={t("nrp.s2.adresseFacturationPlaceholder")} rows={2} />
          {errors.adresseFacturation && <p className="text-sm text-red-500">{errors.adresseFacturation}</p>}
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
        <ResetButton
          show={!!appartientGroupe}
          onClick={() => { setAppartientGroupe(""); setGroupeNom(""); setGroupeAdresse(""); setGroupeRelation(""); }}
          label={t("nrp.reset")}
        />
      </div>

      {appartientGroupe === "oui" && (
        <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s2.groupeNom")} <span className="text-red-500">*</span></Label><Input value={groupeNom} onChange={(e) => setGroupeNom(e.target.value)} placeholder={t("nrp.s2.groupeNomPlaceholder")} />{errors.groupeNom && <p className="text-sm text-red-500">{errors.groupeNom}</p>}</div>
          <div className="space-y-2 md:col-span-2"><Label>{t("nrp.s2.groupeAdresse")} <span className="text-red-500">*</span></Label><Textarea value={groupeAdresse} onChange={(e) => setGroupeAdresse(e.target.value)} placeholder={t("nrp.s2.groupeAdressePlaceholder")} rows={2} />{errors.groupeAdresse && <p className="text-sm text-red-500">{errors.groupeAdresse}</p>}</div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("nrp.s2.groupeRelation")} <span className="text-red-500">*</span></Label>
            <p className="text-xs text-slate-500">{t("nrp.s2.groupeRelationHelper")}</p>
            <Textarea value={groupeRelation} onChange={(e) => setGroupeRelation(e.target.value)} placeholder={t("nrp.s2.groupeRelationPlaceholder")} rows={3} />
            {errors.groupeRelation && <p className="text-sm text-red-500">{errors.groupeRelation}</p>}
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

  // ── Demo prefill (dev helper) ──
  const fillDemoOEC = () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    setTypeDemande("initiale");
    setDateEvaluation(futureDateStr);
    setActivites(["inspection"]);
    setSiteType("monosite");

    setNomLegal("LABO DEMO SARL");
    setAbreviation("LDEMO");
    setStatutJuridique("SARL");
    setRegistreCommerce("16B1234567");
    setCodesActivite("7120 – Services d'essais et analyses techniques");
    setAdresseSiege("12 Rue des Labos, Alger");
    setAdresseFacturation("12 Rue des Labos, Alger");
    setEmailOrg("contact@labodemo.dz");
    setSiteWeb("www.labodemo.dz");
    setAppartientGroupe("non");

    setContactNom("Ahmed Bensalem");
    setContactFonction("Directeur Qualité");
    setContactAdresse("12 Rue des Labos, Alger");
    setContactTelephone("+213 555 123 456");
    setContactFax("+213 21 123 456");
    setContactEmail("ahmed.bensalem@labodemo.dz");

    setCurrentStep(1);
    setErrors({});
  };

  // ── Step router ──
  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <>
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-slate-950 transition-colors registration-wizard">
      {/* Fixed top header — same pattern as ExpertRegister */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60 sticky top-0 z-20 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/logoalgerac.png" alt="ALGERAC" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#00A63E] leading-tight">ALGERAC</h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-slate-400 truncate">
                {t("oecRegister.title")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher variant="compact" />
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shrink-0"
              aria-label="Changer de thème"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-2 sm:px-3">
              <Link href="/auth/register">
                <ChevronLeft className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">{t("common.back")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Two-stage registration notice */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">{t("oecRegister.twoStageNotice")}</p>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200/60 dark:border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {t("nrp.stepOf", { current: currentStep, total: STEPS.length })}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t(`nrp.steps.${currentStep}`)}</p>
            </div>
            <span className="text-sm font-medium text-[#00A63E] bg-[#00A63E]/8 px-3 py-1 rounded-full">
              {Math.round((currentStep / STEPS.length) * 100)}{t("nrp.pctCompleted")}
            </span>
          </div>
          <div className="relative h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#00A63E] rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                onClick={() => step.id <= maxStepReached && step.id !== currentStep && setCurrentStep(step.id)}
                className={cn(
                  "flex flex-col items-center transition-all",
                  step.id <= currentStep ? "opacity-100" : "opacity-40",
                  step.id <= maxStepReached && step.id !== currentStep ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step.id < currentStep ? "bg-[#00A63E] text-white hover:ring-2 hover:ring-[#00A63E]/30"
                    : step.id === currentStep ? "bg-[#00A63E] text-white ring-2 ring-[#00A63E]/20 ring-offset-2"
                    : step.id <= maxStepReached ? "bg-[#00A63E]/20 text-[#00A63E] border border-[#00A63E]/40 hover:ring-2 hover:ring-[#00A63E]/30"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600"
                )}>
                  {step.id}
                </div>
                <span className="text-[10px] mt-1.5 text-center max-w-[110px] text-gray-600 dark:text-slate-400">
                  {t(`nrp.steps.${step.id}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200/60 dark:border-slate-700/60">
          <div className="p-6 md:p-10">
            <div className="flex justify-end mb-6">
              <Button type="button" variant="outline" className="gap-2" onClick={fillDemoOEC}>
                Demo
              </Button>
            </div>
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={prev} className="gap-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4" /> {t("nrp.nav.prev")}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setLocation("/")} className="gap-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                  {t("nrp.nav.cancel")}
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={next} className="gap-2 ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm">
                  {t("nrp.nav.next")} <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmitClick} disabled={loading || submitted} className="ml-auto bg-[#00A63E] hover:bg-[#008a35] text-white shadow-sm">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("nrp.nav.submitting")}</> : submitted ? t("nrp.nav.alreadySubmitted") : t("nrp.nav.submit")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
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
            {t("oecRegister.confirmDesc")}
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

    {/* Accusé de réception */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            {t("oecRegister.successTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("oecRegister.successDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">{t("oecRegister.successInfo")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={goToLogin}
            className="w-full" size="lg" style={{ backgroundColor: "#00A63E" }}
          >
            {t("oecRegister.goToLogin")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
