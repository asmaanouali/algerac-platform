import frResources from "../locales/fr.json";
import enResources from "../locales/en.json";
import arResources from "../locales/ar.json";

type Language = "fr" | "en" | "ar";
type TranslationTuple = readonly [fr: string, en: string, ar: string];
type FlatTranslations = Record<string, string>;

const manualTranslations: TranslationTuple[] = [
  ["Erreur inconnue", "Unknown error", "خطأ غير معروف"],
  ["Chargement impossible", "Unable to load", "تعذر التحميل"],
  ["Impossible de charger", "Unable to load", "تعذر تحميل"],
  ["Une erreur est survenue", "An error occurred", "حدث خطأ"],
  ["Session expirée", "Session expired", "انتهت الجلسة"],
  ["Veuillez vous reconnecter", "Please sign in again", "يرجى تسجيل الدخول مرة أخرى"],
  ["404 Page Not Found", "404 Page Not Found", "404 الصفحة غير موجودة"],
  ["La page que vous recherchez n'existe pas ou a été déplacée.", "The page you are looking for does not exist or has been moved.", "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."],
  ["Retour à l'accueil", "Back to home", "العودة إلى الصفحة الرئيسية"],
  ["Retour au tableau de bord", "Back to dashboard", "العودة إلى لوحة القيادة"],
  ["Veuillez sélectionner", "Please select", "يرجى اختيار"],
  ["Sélectionnez", "Select", "اختر"],
  ["Aucune donnée", "No data", "لا توجد بيانات"],
  ["Aucun dossier", "No file", "لا يوجد ملف"],
  ["Aucune demande", "No request", "لا يوجد طلب"],
  ["Aucune entrée", "No entry", "لا يوجد إدخال"],
  ["Aucun rapport", "No report", "لا يوجد تقرير"],
  ["Aucun certificat", "No certificate", "لا توجد شهادة"],
  ["Aucune qualification", "No qualification", "لا يوجد تأهيل"],
  ["Aucune évaluation", "No evaluation", "لا يوجد تقييم"],
  ["Aucune équipe", "No team", "لا يوجد فريق"],
  ["Aucun entretien", "No interview", "لا توجد مقابلة"],
  ["Aucun écart", "No gap", "لا يوجد انحراف"],
  ["Aucun", "None", "لا يوجد"],
  ["Aucune", "None", "لا توجد"],
  ["Accréditation initiale", "Initial accreditation", "اعتماد أولي"],
  ["Accréditation", "Accreditation", "الاعتماد"],
  ["Extension de portée", "Scope extension", "توسيع النطاق"],
  ["Renouvellement", "Renewal", "تجديد"],
  ["Surveillance", "Surveillance", "المراقبة"],
  ["Étalonnage", "Calibration", "المعايرة"],
  ["Examens médicaux", "Medical examinations", "الفحوصات الطبية"],
  ["Certification produits/procédés/services", "Product/process/service certification", "اعتماد المنتجات/العمليات/الخدمات"],
  ["Laboratoires d'essais", "Testing laboratories", "مخابر الاختبار"],
  ["Laboratoires d'étalonnage", "Calibration laboratories", "مخابر المعايرة"],
  ["Laboratoire d'essais", "Testing laboratory", "مخبر اختبار"],
  ["Laboratoire d'étalonnage", "Calibration laboratory", "مخبر معايرة"],
  ["Organismes d'inspection", "Inspection bodies", "هيئات التفتيش"],
  ["Organisme d'inspection", "Inspection body", "هيئة تفتيش"],
  ["Organismes de certification", "Certification bodies", "هيئات التصديق"],
  ["Organisme de certification", "Certification body", "هيئة تصديق"],
  ["Organismes de vérification/validation", "Verification/validation bodies", "هيئات التحقق/المصادقة"],
  ["Programmé", "Scheduled", "مبرمج"],
  ["Programmée", "Scheduled", "مبرمجة"],
  ["Planifié", "Scheduled", "مجدول"],
  ["Planifiée", "Scheduled", "مجدولة"],
  ["Planifiés", "Scheduled", "مجدولة"],
  ["Confirmé", "Confirmed", "مؤكد"],
  ["Confirmés", "Confirmed", "مؤكدة"],
  ["Terminé", "Completed", "مكتمل"],
  ["Terminée", "Completed", "مكتملة"],
  ["Terminés", "Completed", "مكتملة"],
  ["Terminées", "Completed", "مكتملة"],
  ["Validé", "Validated", "تم التحقق"],
  ["Validée", "Validated", "تم التحقق"],
  ["Validés", "Validated", "تم التحقق"],
  ["Validées", "Validated", "تم التحقق"],
  ["Rejeté", "Rejected", "مرفوض"],
  ["Rejetée", "Rejected", "مرفوض"],
  ["Rejetés", "Rejected", "مرفوضة"],
  ["Rejetées", "Rejected", "مرفوضة"],
  ["Approuvé", "Approved", "موافق عليه"],
  ["Approuvée", "Approved", "موافق عليها"],
  ["Approuvés", "Approved", "موافق عليها"],
  ["Accepté", "Accepted", "مقبول"],
  ["Acceptée", "Accepted", "مقبولة"],
  ["Acceptées", "Accepted", "مقبولة"],
  ["Refusé", "Refused", "مرفوض"],
  ["Refusée", "Refused", "مرفوضة"],
  ["Reçue", "Received", "مستلمة"],
  ["Assignée", "Assigned", "مسندة"],
  ["Fondée", "Substantiated", "مؤسسة"],
  ["Clôturée", "Closed", "مغلقة"],
  ["Résolue", "Resolved", "محلولة"],
  ["Complété", "Completed", "مكتمل"],
  ["Complétée", "Completed", "مكتملة"],
  ["Finalisé", "Finalized", "منجز"],
  ["Envoyé", "Sent", "مرسل"],
  ["Envoyée", "Sent", "مرسلة"],
  ["Créé", "Created", "تم الإنشاء"],
  ["Créée", "Created", "تم الإنشاء"],
  ["Soumis", "Submitted", "مرسل"],
  ["Soumise", "Submitted", "مرسلة"],
  ["Délivré", "Issued", "صادر"],
  ["En préparation", "In preparation", "قيد التحضير"],
  ["Révoqué", "Revoked", "ملغى"],
  ["Brouillon", "Draft", "مسودة"],
  ["Corrections demandées", "Corrections requested", "طُلبت تصحيحات"],
  ["En attente", "Pending", "قيد الانتظار"],
  ["Voir", "View", "عرض"],
  ["Valider", "Validate", "تحقق"],
  ["Rejeter", "Reject", "رفض"],
  ["Approuver", "Approve", "موافقة"],
  ["Enregistrer", "Save", "حفظ"],
  ["Soumettre", "Submit", "إرسال"],
  ["Envoyer", "Send", "إرسال"],
  ["Créer", "Create", "إنشاء"],
  ["Modifier", "Edit", "تعديل"],
  ["Supprimer", "Delete", "حذف"],
  ["Télécharger", "Download", "تحميل"],
  ["Retour", "Back", "رجوع"],
  ["Annuler", "Cancel", "إلغاء"],
  ["Fermer", "Close", "إغلاق"],
  ["Confirmer", "Confirm", "تأكيد"],
  ["Continuer", "Continue", "متابعة"],
  ["Démarrer", "Start", "بدء"],
  ["Ouvrir", "Open", "فتح"],
  ["Ajouter", "Add", "إضافة"],
  ["Planifier", "Schedule", "جدولة"],
  ["Signer", "Sign", "توقيع"],
  ["Payer", "Pay", "دفع"],
  ["Référence", "Reference", "المرجع"],
  ["Organisme", "Organization", "الهيئة"],
  ["Date", "Date", "التاريخ"],
  ["Statut", "Status", "الحالة"],
  ["Actions", "Actions", "الإجراءات"],
  ["Détails", "Details", "التفاصيل"],
  ["Documents", "Documents", "الوثائق"],
  ["Dossier", "File", "الملف"],
  ["Dossiers", "Files", "الملفات"],
  ["Nom", "Last name", "اللقب"],
  ["Prénom", "First name", "الاسم"],
  ["Email", "Email", "البريد الإلكتروني"],
  ["Téléphone", "Phone", "الهاتف"],
  ["Adresse", "Address", "العنوان"],
  ["Rôle", "Role", "الدور"],
  ["Motif", "Reason", "السبب"],
  ["Décision", "Decision", "القرار"],
  ["Commentaire", "Comment", "تعليق"],
  ["Commentaires", "Comments", "تعليقات"],
  ["Description", "Description", "الوصف"],
  ["Justification", "Justification", "التبرير"],
  ["Périmètre", "Scope", "النطاق"],
  ["Portée", "Scope", "النطاق"],
  ["Montant", "Amount", "المبلغ"],
  ["Preuve", "Proof", "الدليل"],
  ["Fichier", "File", "ملف"],
  ["Type", "Type", "النوع"],
  ["Catégorie", "Category", "الفئة"],
  ["Priorité", "Priority", "الأولوية"],
  ["Résultat", "Result", "النتيجة"],
  ["Résultats", "Results", "النتائج"],
  ["Observations", "Observations", "الملاحظات"],
  ["Formation", "Training", "التكوين"],
  ["Qualification", "Qualification", "التأهيل"],
  ["Qualifications", "Qualifications", "التأهيلات"],
  ["Compétence", "Competence", "الكفاءة"],
  ["Compétences", "Competences", "الكفاءات"],
  ["Département", "Department", "القسم"],
  ["Connexion", "Sign in", "تسجيل الدخول"],
  ["Inscription", "Registration", "التسجيل"],
  ["Administration", "Administration", "الإدارة"],
  ["Utilisateurs", "Users", "المستخدمون"],
  ["Paiements", "Payments", "المدفوعات"],
  ["Certificats", "Certificates", "الشهادات"],
  ["Devis", "Quotations", "عروض السعر"],
  ["Conventions", "Agreements", "الاتفاقيات"],
  ["Mandatements", "Mandates", "التكليفات"],
  ["Réunions", "Meetings", "الاجتماعات"],
  ["Récusations", "Recusals", "التنحيات"],
  ["Tarifs", "Tariffs", "التعريفات"],
  ["Transferts", "Transfers", "التحويلات"],
  ["Candidature", "Application", "الترشيح"],
  ["Candidatures", "Applications", "الترشيحات"],
  ["Entretien", "Interview", "المقابلة"],
  ["Entretiens", "Interviews", "المقابلات"],
  ["Plainte", "Complaint", "الشكوى"],
  ["Plaintes", "Complaints", "الشكاوى"],
  ["Équipe", "Team", "الفريق"],
  ["Équipes", "Teams", "الفرق"],
  ["Tableau de bord", "Dashboard", "لوحة القيادة"],
  ["Plateforme d'Accréditation", "Accreditation platform", "منصة الاعتماد"],
  ["Gestion des demandes", "Request management", "إدارة الطلبات"],
  ["Gestion des Compétences", "Competence management", "إدارة الكفاءات"],
  ["Détails de la demande", "Request details", "تفاصيل الطلب"],
  ["Détails de la Candidature", "Application details", "تفاصيل الترشيح"],
  ["Nouvelle demande", "New request", "طلب جديد"],
  ["Mes demandes", "My requests", "طلباتي"],
  ["Mes Documents", "My documents", "وثائقي"],
  ["Mes Équipes", "My teams", "فرقي"],
  ["Mes Évaluations", "My evaluations", "تقييماتي"],
  ["Accès Rapide", "Quick access", "وصول سريع"],
  ["Ordres de Mission", "Mission orders", "أوامر المهمة"],
  ["Suivi des paiements", "Payment tracking", "متابعة المدفوعات"],
  ["Frais d'enregistrement", "Registration fees", "رسوم التسجيل"],
  ["Fixation des devis", "Quotation setup", "إعداد عروض السعر"],
  ["Candidatures OEC", "OEC applications", "ترشيحات هيئات تقييم المطابقة"],
  ["Demandes d'accréditation", "Accreditation requests", "طلبات الاعتماد"],
  ["Évaluation sur Site", "On-site evaluation", "التقييم في الموقع"],
  ["Évaluation sur site", "On-site evaluation", "التقييم في الموقع"],
  ["Rédaction du Rapport", "Report drafting", "تحرير التقرير"],
  ["Rapport d'Évaluation", "Evaluation report", "تقرير التقييم"],
  ["Traitement des Écarts", "Gap treatment", "معالجة الانحرافات"],
  ["Revue des Écarts", "Gap review", "مراجعة الانحرافات"],
  ["Plans d'Actions", "Action plans", "خطط العمل"],
  ["Levée des Obstacles", "Obstacle resolution", "رفع العوائق"],
  ["Réponse documentaire", "Documentary response", "الرد الوثائقي"],
  ["Revue documentaire", "Documentary review", "المراجعة الوثائقية"],
  ["Préparation évaluation", "Evaluation preparation", "تحضير التقييم"],
  ["Préparation de l'Évaluation", "Evaluation preparation", "تحضير التقييم"],
  ["Gestion des écarts", "Gap management", "إدارة الانحرافات"],
  ["Préparation CAS", "CAS preparation", "تحضير لجنة الاعتماد"],
  ["Décision d'accréditation", "Accreditation decision", "قرار الاعتماد"],
  ["Comités CAS", "CAS committees", "لجان الاعتماد"],
  ["Réunions CAS", "CAS meetings", "اجتماعات لجنة الاعتماد"],
  ["Transferts d'accréditation", "Accreditation transfers", "تحويلات الاعتماد"],
  ["Responsables d'Accréditation", "Accreditation managers", "مسؤولو الاعتماد"],
  ["Répertoire des Experts", "Expert directory", "دليل الخبراء"],
  ["Surveillance & KPI", "Surveillance & KPIs", "المراقبة ومؤشرات الأداء"],
  ["Paiement validé", "Payment validated", "تم تأكيد الدفع"],
  ["Paiement rejeté", "Payment rejected", "تم رفض الدفع"],
  ["Documents reçus", "Documents received", "تم استلام الوثائق"],
  ["Documents soumis", "Documents submitted", "تم إرسال الوثائق"],
  ["Documents rejetés", "Documents rejected", "تم رفض الوثائق"],
  ["Documents validés", "Documents validated", "تم التحقق من الوثائق"],
  ["Réponse envoyée", "Response sent", "تم إرسال الرد"],
  ["Plan accepté", "Plan accepted", "تم قبول الخطة"],
  ["Plan rejeté", "Plan rejected", "تم رفض الخطة"],
  ["Écart enregistré", "Gap saved", "تم حفظ الانحراف"],
  ["Note enregistrée", "Note saved", "تم حفظ الملاحظة"],
  ["Rapport brouillon créé", "Draft report created", "تم إنشاء مسودة التقرير"],
  ["Rapport soumis au RA pour validation", "Report submitted to RA for validation", "تم إرسال التقرير إلى مسؤول الاعتماد للتحقق"],
  ["Rapport soumis au CD pour validation", "Report submitted to CD for validation", "تم إرسال التقرير إلى رئيس القسم للتحقق"],
  ["Mandatements envoyés au CD", "Mandates sent to CD", "تم إرسال التكليفات إلى رئيس القسم"],
  ["Demande de modifications envoyée au RA", "Modification request sent to RA", "تم إرسال طلب التعديل إلى مسؤول الاعتماد"],
  ["Le paiement a été validé avec succès.", "The payment was validated successfully.", "تم تأكيد الدفع بنجاح."],
  ["Le paiement sera effectué le jour de l'évaluation", "Payment will be made on the evaluation day", "سيتم الدفع يوم التقييم"],
  ["Votre réponse a été transmise", "Your response has been sent", "تم إرسال ردك"],
  ["Vous serez notifié", "You will be notified", "سيتم إشعارك"],
  ["Retour à mes demandes", "Back to my requests", "العودة إلى طلباتي"],
  ["Tous les documents", "All documents", "كل الوثائق"],
  ["Tous les rôles", "All roles", "كل الأدوار"],
  ["Toutes les missions", "All missions", "كل المهام"],
  ["Chef de Département", "Head of department", "رئيس القسم"],
  ["Responsable d'Accréditation", "Accreditation manager", "مسؤول الاعتماد"],
  ["Responsable Qualité", "Quality manager", "مسؤول الجودة"],
  ["Responsable d'Équipe d'Évaluation", "Evaluation team leader", "رئيس فريق التقييم"],
  ["Évaluateur Technique", "Technical assessor", "مقيم تقني"],
  ["Évaluateur Qualité", "Quality assessor", "مقيم جودة"],
  ["Évaluateur", "Assessor", "مقيم"],
  ["Expert", "Expert", "خبير"],
  ["Formateur", "Trainer", "مكون"],
  ["Qualifié", "Qualified", "مؤهل"],
  ["Non qualifié", "Not qualified", "غير مؤهل"],
  ["Sous réserve", "With reservations", "مع تحفظات"],
  ["Défavorables", "Unfavorable", "غير مواتية"],
  ["Favorable", "Favorable", "مواتية"],
  ["Défavorable", "Unfavorable", "غير مواتية"],
  ["Délai expiré", "Deadline expired", "انتهت المهلة"],
  ["En cours", "In progress", "قيد التنفيذ"],
  ["À traiter", "To process", "للمعالجة"],
  ["À examiner", "To review", "للمراجعة"],
  ["À valider", "To validate", "للتحقق"],
  ["À signer", "To sign", "للتوقيع"],
  ["À venir", "Upcoming", "قادمة"],
];

function flattenTranslations(value: unknown, prefix = "", output: FlatTranslations = {}): FlatTranslations {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flattenTranslations(child, prefix ? `${prefix}.${key}` : key, output);
    }
  } else if (prefix && typeof value === "string") {
    output[prefix] = value;
  }

  return output;
}

function normalizeLanguage(language: string | undefined): Language {
  const baseLanguage = (language || "fr").split("-")[0].toLowerCase();
  return baseLanguage === "en" || baseLanguage === "ar" ? baseLanguage : "fr";
}

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const frFlat = flattenTranslations(frResources);
const enFlat = flattenTranslations(enResources);
const arFlat = flattenTranslations(arResources);

const exactTranslations: Record<Exclude<Language, "fr">, Map<string, string>> = {
  en: new Map(),
  ar: new Map(),
};

const sourceTexts = new Set<string>();

function addTranslation(source: string, en: string | undefined, ar: string | undefined) {
  const normalizedSource = normalizeText(source);
  if (!normalizedSource) return;

  sourceTexts.add(normalizedSource);
  if (en) exactTranslations.en.set(normalizedSource, normalizeText(en));
  if (ar) exactTranslations.ar.set(normalizedSource, normalizeText(ar));
}

for (const [key, source] of Object.entries(frFlat)) {
  addTranslation(source, enFlat[key], arFlat[key]);
}

for (const [source, en, ar] of manualTranslations) {
  addTranslation(source, en, ar);
}

const phraseTranslations = manualTranslations
  .map(([source, en, ar]) => ({ source, en, ar }))
  .sort((left, right) => right.source.length - left.source.length);

const frenchSignal = /[À-ÿ]|\b(Aucun|Aucune|Ajouter|Annuler|Approuver|Attention|Chef|Commentaires|Créer|Date|Décision|Délais|Détails|Documents|Dossier|Envoyer|Enregistrer|Erreur|Écart|Équipe|Évaluation|Expert|Fermer|Formation|Impossible|Informations|Mission|Motif|Nom|Nouvelle|Nouveau|Organisme|Planifier|Qualité|Rapport|Recevabilité|Référence|Rejeter|Responsable|Résultat|Sélectionner|Soumettre|Statut|Succès|Suivi|Supprimer|Télécharger|Tous|Toutes|Traitement|Valider|Voir|Vous|Votre)\b/i;
const technicalValue = /^(@\/|\/api\/|https?:\/\/|[A-Z0-9_./:-]{4,})$/;

function shouldTranslateSource(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized || technicalValue.test(normalized)) return false;
  if (sourceTexts.has(normalized)) return true;
  return frenchSignal.test(normalized);
}

function withOriginalSpacing(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export function isHardcodedI18nSource(value: string): boolean {
  return shouldTranslateSource(value);
}

export function translateHardcodedText(value: string, language: string | undefined): string {
  const targetLanguage = normalizeLanguage(language);
  if (targetLanguage === "fr") return value;

  const normalized = normalizeText(value);
  if (!shouldTranslateSource(normalized)) return value;

  const exactTranslation = exactTranslations[targetLanguage].get(normalized);
  if (exactTranslation) return withOriginalSpacing(value, exactTranslation);

  let translated = normalized;
  for (const phrase of phraseTranslations) {
    const replacement = targetLanguage === "en" ? phrase.en : phrase.ar;
    translated = translated.replace(new RegExp(escapeRegExp(phrase.source), "g"), replacement);
  }

  return translated !== normalized ? withOriginalSpacing(value, translated) : value;
}

export function isRenderedHardcodedTranslation(source: string, renderedValue: string): boolean {
  const normalizedRenderedValue = normalizeText(renderedValue);
  return (["fr", "en", "ar"] as const).some((language) => {
    const translated = normalizeText(translateHardcodedText(source, language));
    return translated === normalizedRenderedValue;
  });
}