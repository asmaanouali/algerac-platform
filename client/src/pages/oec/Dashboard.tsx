import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import {
  CheckCircle2, Calendar, AlertTriangle, TrendingUp, Download,
  Loader2, FileText, FileImage, AlertCircle, ArrowRight, Shield
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface MyRequest {
  id: number;
  referenceNumber: string | null;
  type: string;
  domain: string;
  status: string;
  progress: number;
  currentPhase: string | null;
  currentStep: string | null;
  nextAction: string | null;
  pendingWith: string | null;
  submissionDate: string | null;
  createdAt: string;
  certificateIssueDate?: string | null;
  certificateExpirationDate?: string | null;
  description?: string | null;
}

interface Certificate {
  certificateNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  technicalDomains?: string;
  scope?: string;
}

interface Gap {
  id: number;
  gapCode: string;
  type: string;
  status: string;
  description: string;
  identifiedDate?: string;
}

interface Doc {
  name: string;
  category: string;
  time: string;
  type: string;
  mimeType?: string;
}

interface Surveillance {
  id: number;
  status: string;
  evaluationType: string;
  proposedDate?: string;
  evaluationDate?: string;
  scheduledDate?: string;
}

const OPEN_GAP_STATUSES = new Set([
  "IDENTIFIED", "SENT_TO_REE", "KEPT_BY_REE", "SENT_TO_OEC", "OEC_ACCEPTED",
  "AWAITING_ACTION_PLAN", "PLAN_SUBMITTED", "PLAN_REJECTED",
]);

const RESOLVED_GAP_STATUSES = new Set([
  "PLAN_ACCEPTED", "CLOSED", "RESOLVED",
]);

function buildGapEvolution(gaps: Gap[], locale: string) {
  const now = new Date();
  const months: { month: string; open: number; resolved: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString(locale, { month: "short" });
    const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let open = 0;
    let resolved = 0;
    gaps.forEach(g => {
      const identified = g.identifiedDate ? new Date(g.identifiedDate) : null;
      if (!identified || identified >= cutoff) return;
      if (RESOLVED_GAP_STATUSES.has(g.status)) resolved++;
      else if (OPEN_GAP_STATUSES.has(g.status)) open++;
    });
    months.push({ month: label, open, resolved });
  }
  return months;
}

function guessDocType(name: string, mimeType?: string): string {
  if (mimeType?.startsWith("image/")) return "image";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "docx";
  return "pdf";
}

function guessCategory(key: string | undefined, t: (k: string) => string): string {
  if (!key) return t("oec.dashboard.docCatDocument");
  if (key.startsWith("admin-")) return t("oec.dashboard.docCatAdmin");
  if (key.startsWith("essais-")) return t("oec.dashboard.docCatTests");
  if (key.startsWith("etalonnage-")) return t("oec.dashboard.docCatCalibration");
  if (key.startsWith("cert_")) return t("oec.dashboard.docCatCertification");
  return t("oec.dashboard.docCatTechnical");
}

function DocIcon({ type }: { type: string }) {
  if (type === "image") return <FileImage className="h-8 w-8 text-emerald-600" />;
  if (type === "docx") return <FileText className="h-8 w-8 text-blue-600" />;
  return <FileText className="h-8 w-8 text-emerald-600" />;
}

export default function OECDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [nextSurveillance, setNextSurveillance] = useState<Surveillance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiRequest("GET", "/api/requests/my-requests");
      const data: MyRequest[] = await res.json();
      const reqs = Array.isArray(data) ? data : [];
      setRequests(reqs);

      // Extract documents from all requests' description JSON
      const allDocs: Doc[] = [];
      reqs.forEach(r => {
        if (!r.description) return;
        try {
          const parsed = JSON.parse(r.description);
          const dlist: any[] = Array.isArray(parsed.documents) ? parsed.documents : [];
          dlist.forEach(d => {
            allDocs.push({
              name: d.name || d.key || "Document",
              category: guessCategory(d.key, t),
              time: r.submissionDate
                ? new Date(r.submissionDate).toLocaleDateString(locale, { day: "2-digit", month: "short" })
                : "—",
              type: guessDocType(d.name || d.key || "", d.mimeType),
              mimeType: d.mimeType,
            });
          });
        } catch { /* ignore */ }
      });
      setDocs(allDocs.slice(0, 4));

      const activeReq = reqs.find(r => r.status === "ACTIVE" || r.status === "CERTIFICATE_ISSUED");

      // Fetch certificate
      if (activeReq) {
        try {
          const certRes = await fetch(`/api/workflow/accreditation/${activeReq.id}/certificate`, { credentials: "include" });
          if (certRes.ok) {
            const certData = await certRes.json();
            if (certData?.data) setCertificate(certData.data);
          }
        } catch { /* ignore */ }

        // Fetch gaps for active request
        try {
          const gapRes = await fetch(`/api/workflow/gaps/by-request/${activeReq.id}`, { credentials: "include" });
          if (gapRes.ok) {
            const gapData = await gapRes.json();
            setGaps(Array.isArray(gapData) ? gapData : []);
          }
        } catch { /* ignore */ }
      }

      // Fetch surveillances to find next one
      try {
        const survRes = await fetch("/api/workflow/surveillance/all", { credentials: "include" });
        if (survRes.ok) {
          const survData = await survRes.json();
          if (survData?.success && Array.isArray(survData.data)) {
            const upcoming = survData.data
              .filter((s: any) => s.status !== "COMPLETED" && s.status !== "SANCTIONS_APPLIED")
              .sort((a: any, b: any) => {
                const da = a.proposedDate || a.evaluationDate || a.scheduledDate || "";
                const db = b.proposedDate || b.evaluationDate || b.scheduledDate || "";
                return da.localeCompare(db);
              });
            if (upcoming.length > 0) setNextSurveillance(upcoming[0]);
          }
        }
      } catch { /* ignore */ }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const activeReq = requests.find(r => r.status === "ACTIVE" || r.status === "CERTIFICATE_ISSUED");
  const pendingActions = requests.filter(r => r.pendingWith === "OEC");

  const openGapsCount = gaps.filter(g => OPEN_GAP_STATUSES.has(g.status)).length;
  const resolvedCount = gaps.filter(g => RESOLVED_GAP_STATUSES.has(g.status)).length;
  const totalGaps = gaps.length;
  const resolutionRate = totalGaps > 0 ? Math.round((resolvedCount / totalGaps) * 100) : 0;
  const criticalGaps = gaps.filter(g => g.type === "CRITIQUE" && OPEN_GAP_STATUSES.has(g.status)).length;

  const gapEvolutionData = buildGapEvolution(gaps, locale);

  const awaitingActionPlanGaps = gaps.filter(g => g.status === "AWAITING_ACTION_PLAN");

  const certNumber = certificate?.certificateNumber ?? activeReq?.referenceNumber ?? "—";
  const issueDate = certificate?.issueDate ?? activeReq?.certificateIssueDate;
  const expiryDate = certificate?.expirationDate ?? activeReq?.certificateExpirationDate;

  const nextSurvDate = nextSurveillance?.proposedDate
    ?? nextSurveillance?.evaluationDate
    ?? nextSurveillance?.scheduledDate;

  const scopeTags = certificate?.technicalDomains
    ? certificate.technicalDomains.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("oec.dashboard.title")}</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* ── Row 1: 4 stat cards ── */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Statut Accréditation */}
                <Card className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-slate-500 font-medium">{t("oec.dashboard.accreditationStatus")}</p>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {activeReq ? t("oec.dashboard.active") : t("oec.dashboard.inactive")}
                    </p>
                    {expiryDate ? (
                      <p className="text-xs text-slate-400 mt-1">
                        {t("oec.dashboard.expiresOn", { date: new Date(expiryDate).toLocaleDateString(locale) })}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">—</p>
                    )}
                  </CardContent>
                </Card>

                {/* Prochaine Évaluation */}
                <Card className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-slate-500 font-medium">{t("oec.dashboard.nextEvaluation")}</p>
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    {nextSurvDate ? (
                      <>
                        <p className="text-2xl font-bold text-slate-800">
                          {new Date(nextSurvDate).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {t("oec.dashboard.evaluationType", { type: nextSurveillance?.evaluationType ?? "Surveillance" })}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-slate-400">—</p>
                    )}
                  </CardContent>
                </Card>

                {/* Écarts Ouverts */}
                <Card className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-slate-500 font-medium">{t("oec.dashboard.openGaps")}</p>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{openGapsCount}</p>
                    {criticalGaps > 0 ? (
                      <p className="text-xs text-red-500 mt-1">{t("oec.dashboard.criticalGapsCount", { count: criticalGaps })}</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">
                        {openGapsCount === 0 ? t("oec.dashboard.noOpenGaps") : t("oec.dashboard.noCritical")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Taux de Résolution */}
                <Card className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-slate-500 font-medium">{t("oec.dashboard.resolutionRate")}</p>
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {totalGaps > 0 ? `${resolutionRate}%` : "—"}
                    </p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${resolutionRate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Row 2: Certificate + Actions Requises ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Certificat d'Accréditation */}
                <Card className="border border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{t("oec.dashboard.accreditationCertificate")}</CardTitle>
                    {certificate?.scope && (
                      <p className="text-xs text-slate-500">{certificate.scope}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeReq ? (
                      <>
                        {/* Certificate block */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{t("oec.dashboard.certNumber", { number: certNumber })}</p>
                              <p className="text-xs text-slate-500">
                                {t("oec.dashboard.issuedOn", { date: issueDate ? new Date(issueDate).toLocaleDateString(locale) : "—" })}
                              </p>
                            </div>
                          </div>
                          <a href={`/api/accreditation-delivery/${activeReq.id}/certificate/download`} download>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <Download className="h-3.5 w-3.5" />
                              {t("common.download")}
                            </Button>
                          </a>
                        </div>

                        {/* Technical scope */}
                        {scopeTags.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-2">{t("oec.dashboard.technicalScope")}</p>
                            <div className="flex flex-wrap gap-2">
                              {scopeTags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                              ))}
                              {scopeTags.length > 3 && (
                                <Link href="/oec/certificats">
                                  <button className="text-xs text-primary underline-offset-2 hover:underline">
                                    {t("oec.dashboard.moreScope", { count: scopeTags.length - 3 })}
                                  </button>
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                        <Link href="/oec/certificats">
                          <button className="text-xs text-primary underline-offset-2 hover:underline">
                            {t("oec.dashboard.viewAllScope")}
                          </button>
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 py-4 text-center">
                        {t("oec.dashboard.noActiveAccreditation")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Actions Requises */}
                <Card className={pendingActions.length > 0 || awaitingActionPlanGaps.length > 0 ? "border border-red-100" : "border border-slate-200"}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      {t("oec.dashboard.requiredActions")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Gaps awaiting action plan */}
                    {awaitingActionPlanGaps.length > 0 && (
                      <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                        <div className="flex items-start gap-3">
                          <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-red-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {t("oec.dashboard.gapsNeedActionPlan", { count: awaitingActionPlanGaps.length })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{t("oec.dashboard.tenDayDeadline")}</p>
                            <Link href="/oec/ecarts">
                              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3">
                                {t("oec.dashboard.handleNow")}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Requests pending OEC action */}
                    {pendingActions.map(req => (
                      <div key={req.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                        <div className="flex items-start gap-3">
                          <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-amber-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {req.referenceNumber || `Demande #${req.id}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{req.nextAction || req.currentStep}</p>
                            <Link href={`/oec/demandes/${req.id}`}>
                              <Button size="sm" variant="outline" className="mt-3 text-xs h-7 px-3 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                                {t("oec.dashboard.handle")} <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}

                    {awaitingActionPlanGaps.length === 0 && pendingActions.length === 0 && (
                      <div className="py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">{t("oec.dashboard.noActions")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Row 3: Gap chart + Recent documents ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Évolution des Écarts */}
                <Card className="border border-slate-200">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-semibold">{t("oec.dashboard.gapEvolution")}</CardTitle>
                    <p className="text-xs text-slate-500">{t("oec.dashboard.nonconformityTracking")}</p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {totalGaps === 0 ? (
                      <div className="h-[200px] flex items-center justify-center">
                        <p className="text-sm text-slate-400">{t("oec.dashboard.noGapsRecorded")}</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={gapEvolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                            formatter={(value: number, name: string) => [
                              value,
                              name === "open" ? t("oec.dashboard.legendOpen") : t("oec.dashboard.legendResolved"),
                            ]}
                          />
                          <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Documents Récents */}
                <Card className="border border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{t("oec.dashboard.recentDocuments")}</CardTitle>
                    <p className="text-xs text-slate-500">{t("oec.dashboard.latestFiles")}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {docs.length === 0 ? (
                      <div className="py-6 text-center">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">{t("oec.dashboard.noDocuments")}</p>
                      </div>
                    ) : (
                      docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 py-1">
                          <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <DocIcon type={doc.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.category} &bull; {doc.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="pt-2">
                      <Link href="/oec/documents">
                        <Button variant="outline" className="w-full text-sm">
                          {t("oec.dashboard.viewAllDocuments")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
