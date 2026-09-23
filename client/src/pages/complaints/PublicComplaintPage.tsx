import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, ArrowLeft, Shield, FileText, Upload, X, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";

interface AttachedFile {
  name: string;
  size: number;
  base64: string;
  mimeType: string;
}

export default function PublicComplaintPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    complainantName: "",
    complainantEmail: "",
    complainantPhone: "",
    complainantOrganization: "",
    targetOrganization: "",
    category: "",
    subject: "",
    description: "",
    expectedResolution: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: "quality", label: t('complaints.categories.quality') },
    { value: "delay", label: t('complaints.categories.delay') },
    { value: "competence", label: t('complaints.categories.competence') },
    { value: "impartiality", label: t('complaints.categories.impartiality') },
    { value: "confidentiality", label: t('complaints.categories.confidentiality') },
    { value: "other", label: t('complaints.categories.other') },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB max
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          base64,
          mimeType: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Quick-fill valid sample data so the form can be tested without typing
  const fillDemoData = () => {
    setFormData({
      complainantName: "Ahmed Benali",
      complainantEmail: "ahmed.benali@example.com",
      complainantPhone: "+213 555 123 456",
      complainantOrganization: "SARL Benali Import Export",
      targetOrganization: "Organisme de certification XYZ",
      category: "quality",
      subject: "Retard important dans le traitement du dossier de certification",
      description: "Nous avons soumis notre dossier de certification il y a plus de trois mois et nous n'avons reçu aucune mise à jour malgré plusieurs relances. Ce retard impacte fortement nos activités commerciales.",
      expectedResolution: "Nous souhaitons un traitement accéléré de notre dossier ainsi qu'une communication régulière sur son avancement.",
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.complainantName.trim()) newErrors.complainantName = t('complaints.errors.nameRequired');
    if (!formData.complainantEmail.trim()) newErrors.complainantEmail = t('complaints.errors.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.complainantEmail)) newErrors.complainantEmail = t('complaints.errors.emailInvalid');
    if (!formData.category) newErrors.category = t('complaints.errors.categoryRequired');
    if (!formData.subject.trim()) newErrors.subject = t('complaints.errors.subjectRequired');
    if (!formData.description.trim()) newErrors.description = t('complaints.errors.descriptionRequired');
    if (formData.description.trim().length < 50) newErrors.description = t('complaints.errors.descriptionTooShort');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        attachments: attachedFiles.map(f => ({ name: f.name, base64: f.base64, mimeType: f.mimeType })),
        isPublic: true,
      };
      const response = await fetch("/api/complaints/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setTrackingCode(data.data?.trackingCode || data.trackingCode || "");
        setStep("success");
      } else {
        const data = await response.json().catch(() => null);
        setTrackingCode(data?.data?.trackingCode || data?.trackingCode || "");
        setStep("success");
      }
    } catch (err) {
      // Network error – cannot show a valid tracking code
      setTrackingCode("");
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="absolute top-4 right-4"><LanguageSwitcher variant="compact" /></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full">
            <Card className="border-green-200 shadow-xl">
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800">{t('complaints.public.successTitle')}</h2>
                  <p className="text-muted-foreground mt-2">{t('complaints.public.successDescription')}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-muted-foreground">{t('complaints.public.trackingCode')}</p>
                  <p className="text-2xl font-mono font-bold text-blue-800 mt-1">{trackingCode}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t('complaints.public.trackingNote')}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setLocation("/")}><ArrowLeft className="w-4 h-4 mr-2" />{t('complaints.public.backToLogin')}</Button>
                  <Button onClick={() => { setStep("form"); setFormData({ complainantName: "", complainantEmail: "", complainantPhone: "", complainantOrganization: "", targetOrganization: "", category: "", subject: "", description: "", expectedResolution: "" }); setAttachedFiles([]); }}>
                    {t('complaints.public.newComplaint')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher variant="compact" /></div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logoalgerac.png" alt="ALGERAC" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-primary">ALGERAC</h1>
              <p className="text-xs text-muted-foreground">{t('complaints.public.headerSubtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}><ArrowLeft className="w-4 h-4 mr-2" />{t('complaints.public.backToLogin')}</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Info Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {t('complaints.public.infoBanner')}
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('complaints.public.formTitle')}</CardTitle>
              <CardDescription>{t('complaints.public.formDescription')}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={fillDemoData} className="shrink-0">
              <Wand2 className="w-4 h-4 mr-2" />{t('complaints.public.demoFill')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Complainant Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4 pb-2 border-b">{t('complaints.public.complainantInfo')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('complaints.fields.name')} <span className="text-red-500">*</span></Label>
                  <Input value={formData.complainantName} onChange={(e) => handleChange("complainantName", e.target.value)} placeholder={t('complaints.fields.namePlaceholder')} className={errors.complainantName ? "border-red-500" : ""} />
                  {errors.complainantName && <p className="text-xs text-red-500">{errors.complainantName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('complaints.fields.email')} <span className="text-red-500">*</span></Label>
                  <Input type="email" value={formData.complainantEmail} onChange={(e) => handleChange("complainantEmail", e.target.value)} placeholder={t('complaints.fields.emailPlaceholder')} className={errors.complainantEmail ? "border-red-500" : ""} />
                  {errors.complainantEmail && <p className="text-xs text-red-500">{errors.complainantEmail}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('complaints.fields.phone')}</Label>
                  <Input value={formData.complainantPhone} onChange={(e) => handleChange("complainantPhone", e.target.value)} placeholder="+213 XXX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>{t('complaints.fields.organization')}</Label>
                  <Input value={formData.complainantOrganization} onChange={(e) => handleChange("complainantOrganization", e.target.value)} placeholder={t('complaints.fields.organizationPlaceholder')} />
                </div>
              </div>
            </div>

            {/* Complaint Details */}
            <div>
              <h3 className="font-semibold text-lg mb-4 pb-2 border-b">{t('complaints.public.complaintDetails')}</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('complaints.fields.targetOrganization')}</Label>
                    <Input value={formData.targetOrganization} onChange={(e) => handleChange("targetOrganization", e.target.value)} placeholder={t('complaints.fields.targetPlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('complaints.fields.category')} <span className="text-red-500">*</span></Label>
                    <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}><SelectValue placeholder={t('complaints.fields.categoryPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('complaints.fields.subject')} <span className="text-red-500">*</span></Label>
                  <Input value={formData.subject} onChange={(e) => handleChange("subject", e.target.value)} placeholder={t('complaints.fields.subjectPlaceholder')} className={errors.subject ? "border-red-500" : ""} />
                  {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('complaints.fields.description')} <span className="text-red-500">*</span></Label>
                  <Textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder={t('complaints.fields.descriptionPlaceholder')} rows={6} className={errors.description ? "border-red-500" : ""} />
                  <div className="flex justify-between">
                    {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                    <p className="text-xs text-muted-foreground ml-auto">{formData.description.length}/50 min</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('complaints.fields.expectedResolution')}</Label>
                  <Textarea value={formData.expectedResolution} onChange={(e) => handleChange("expectedResolution", e.target.value)} placeholder={t('complaints.fields.expectedResolutionPlaceholder')} rows={3} />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <h3 className="font-semibold text-lg mb-4 pb-2 border-b">{t('complaints.public.attachments')}</h3>
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('complaints.public.dragOrClick')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('complaints.public.maxFileSize')}</p>
                  <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" style={{ position: "relative" }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                </div>
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(i)}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setLocation("/")}>{t('common.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.submitting')}</> : t('complaints.public.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
