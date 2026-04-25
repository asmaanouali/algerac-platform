import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2, ArrowLeft, FileText, CheckCircle, XCircle, Download,
  Building2, User, Mail, Phone, MapPin, Globe, Briefcase, Calendar, ClipboardList, Users, Shield, Send,
} from "lucide-react";

interface DetailShape {
  request?: any;
  oecProfile?: any;
}

interface ParsedRow { [k: string]: any }

export default function DTRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailShape | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  // Department + CD picker for validation → the DT must choose which CD owns the dossier.
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [cdsInDept, setCdsInDept] = useState<Array<{ id: number; fullName: string; email: string }>>([]);
  const [selectedCdId, setSelectedCdId] = useState<string>("");
  const [loadingCds, setLoadingCds] = useState(false);

  useEffect(() => { if (requestId) load(); }, [requestId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/departments");
        const j = await res.json();
        setDepartments(Array.isArray(j) ? j : []);
      } catch { /* non-blocking */ }
    })();
  }, []);

  useEffect(() => {
    setSelectedCdId("");
    if (!selectedDeptId) { setCdsInDept([]); return; }
    (async () => {
      try {
        setLoadingCds(true);
        const res = await apiRequest("GET", `/api/departments/${selectedDeptId}/cds`);
        const j = await res.json();
        const list = Array.isArray(j) ? j : [];
        setCdsInDept(list);
        // The CD is determined by the department: pin to the (single) CD that
        // owns it. If a department happens to have several CDs we still pin
        // to the first one — DT does not pick the CD manually.
        if (list.length > 0) setSelectedCdId(String(list[0].id));
      } catch { setCdsInDept([]); }
      finally { setLoadingCds(false); }
    })();
  }, [selectedDeptId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", `/api/requests/${requestId}/full-details`);
      const j = await res.json();
      setData(j);
      const desc = j?.request?.description;
      if (desc) {
        try { setParsed(JSON.parse(desc)); } catch { setParsed(null); }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Chargement impossible" });
    } finally {
      setLoading(false);
    }
  };

  const act = async (approved: boolean) => {
    if (!approved && !comments.trim()) {
      toast({ variant: "destructive", title: "Motif requis", description: "Indiquez les raisons du rejet" });
      return;
    }
    if (approved && (!selectedDeptId || !selectedCdId)) {
      toast({
        variant: "destructive",
        title: "Assignation requise",
        description: "Choisissez le département et le CD à qui transmettre la demande.",
      });
      return;
    }
    try {
      setBusy(true);
      if (approved) {
        // Single call: validate + route to the selected CD of the chosen department.
        await apiRequest("POST", `/api/requests/${requestId}/dt-assign-cd`, {
          departmentId: Number(selectedDeptId),
          cdId: Number(selectedCdId),
          comments,
        });
        const cdName = cdsInDept.find((c) => String(c.id) === selectedCdId)?.fullName;
        const deptName = departments.find((d) => String(d.id) === selectedDeptId)?.name;
        toast({
          title: "Demande transmise",
          description: cdName ? `Assignée à ${cdName} — département ${deptName}.` : "Demande transmise au CD.",
        });
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/dt-review`, { approved: false, comments });
        toast({ title: "Documents rejetés", description: "L'OEC a été notifié." });
      }
      setRejectOpen(false);
      setLocation("/dt/demandes-accreditation");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar /><div className="md:ml-64"><Navbar />
          <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>
        </div>
      </div>
    );
  }

  if (!data?.request) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar /><div className="md:ml-64"><Navbar />
          <main className="p-8">
            <Button variant="outline" onClick={() => setLocation("/dt/demandes-accreditation")}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
            <p className="text-center text-muted-foreground py-10">Demande introuvable</p>
          </main>
        </div>
      </div>
    );
  }

  const req = data.request;
  const oec = data.oecProfile || {};
  const p = parsed || {};
  const canReview = req.status === "PENDING_DT_REVIEW";

  const Info = ({ icon: Icon, label, value }: any) => (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />}{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );

  const TableBlock = ({ title, cols, rows }: { title: string; cols: { key: string; label: string }[]; rows?: ParsedRow[] }) => {
    if (!rows || rows.length === 0) return null;
    const hasContent = rows.some((r) => cols.some((c) => r[c.key]));
    if (!hasContent) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-[#00A63E]">{title}</h4>
        <div className="border rounded-lg overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-10">#</th>
                {cols.map((c) => <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-slate-600">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 text-xs text-slate-500">{i + 1}</td>
                  {cols.map((c) => <td key={c.key} className="px-3 py-2 text-sm">{r[c.key] || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dt/demandes-accreditation")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <Badge className="text-sm" variant="outline">{req.referenceNumber || `#${req.id}`}</Badge>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2"><Building2 className="w-5 h-5" /> {oec.organizationName || req.oec?.organizationName || "Demande d'accréditation"}</CardTitle>
                  <CardDescription className="mt-1">{p.nomLegal && p.nomLegal !== oec.organizationName ? p.nomLegal : ""}</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">{req.status?.replace(/_/g, " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Info icon={ClipboardList} label="Type de demande" value={p.typeDemande || req.type} />
                <Info icon={Briefcase} label="Domaine" value={req.domain} />
                <Info icon={Calendar} label="Date de soumission" value={req.submissionDate ? new Date(req.submissionDate).toLocaleDateString("fr-FR") : "—"} />
                <Info icon={Calendar} label="Date d'évaluation souhaitée" value={p.dateEvaluation ? new Date(p.dateEvaluation).toLocaleDateString("fr-FR") : "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Organisme */}
          <Card>
            <CardHeader><CardTitle>Informations de l'organisme</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Info label="Nom légal" value={p.nomLegal || oec.organizationName} />
                <Info label="Abréviation / Sigle" value={[p.abreviation, p.sigle].filter(Boolean).join(" / ")} />
                <Info label="Statut juridique" value={p.statutJuridique || oec.typeOrganisme} />
                <Info label="N° Registre de commerce" value={p.registreCommerce} />
                <Info label="Codes d'activité" value={p.codesActivite} />
                <Info icon={Mail} label="Email organisme" value={p.emailOrg || oec.email} />
                <Info icon={Globe} label="Site web" value={p.siteWeb} />
                <Info label="Type de site" value={p.siteType} />
                <Info icon={MapPin} label="Adresse siège" value={p.adresseSiege || oec.adresseSiege} />
                <Info icon={MapPin} label="Adresse de facturation" value={p.adresseFacturation} />
              </div>
              {p.appartientGroupe === "oui" && (
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border">
                  <p className="text-sm font-medium mb-2">Groupe d'appartenance</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <Info label="Nom" value={p.groupeNom} />
                    <Info label="Relation" value={p.groupeRelation} />
                    <Info label="Adresse" value={p.groupeAdresse} />
                    <Info label="Impact sur activités" value={p.groupeImpact} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Personne à contacter</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Info label="Nom complet" value={p.contactNom || oec.nomRepresentant} />
                <Info label="Fonction" value={p.contactFonction || oec.fonction} />
                <Info icon={Phone} label="Téléphone" value={p.contactTelephone || oec.telephoneDirect} />
                <Info label="Fax" value={p.contactFax} />
                <Info icon={Mail} label="Email" value={p.contactEmail || oec.emailProfessionnel} />
                <Info label="Adresse" value={p.contactAdresse} />
              </div>
            </CardContent>
          </Card>

          {/* Sites */}
          {Array.isArray(p.sites) && (
            <Card>
              <CardHeader><CardTitle>Sites</CardTitle></CardHeader>
              <CardContent>
                <TableBlock title="" cols={[
                  { key: "localisation", label: "Localisation" },
                  { key: "adresse", label: "Adresse" },
                  { key: "activites", label: "Activités" },
                  { key: "soustraitance", label: "Sous-traitance" },
                  { key: "ebmd", label: "EBMD" },
                ]} rows={p.sites} />
              </CardContent>
            </Card>
          )}

          {/* Personnel */}
          {(Array.isArray(p.personnelSites) || Array.isArray(p.responsablesTechniques) || p.responsableQualiteNom) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Personnel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <TableBlock title="Personnel par site" cols={[
                  { key: "site", label: "Site" },
                  { key: "permanents", label: "Permanents" },
                  { key: "vacataires", label: "Vacataires" },
                ]} rows={p.personnelSites} />
                <TableBlock title="Responsables techniques" cols={[
                  { key: "nom", label: "Nom" },
                  { key: "qualifications", label: "Qualifications" },
                  { key: "experience", label: "Expérience (ans)" },
                ]} rows={p.responsablesTechniques} />
                {p.responsableQualiteNom && (
                  <div className="grid md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border">
                    <Info label="Responsable qualité — Nom" value={p.responsableQualiteNom} />
                    <Info label="Qualifications" value={p.responsableQualiteQualif} />
                    <Info label="Expérience" value={p.responsableQualiteExp} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activités */}
          {Array.isArray(p.activites) && p.activites.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Activités demandées</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {p.activites.map((a: string) => <Badge key={a} variant="outline" className="capitalize">{a.replace(/_/g, " ")}</Badge>)}
              </CardContent>
            </Card>
          )}

          {/* Formulaires techniques */}
          {p.technicalForms && (
            <Card>
              <CardHeader><CardTitle>Formulaires techniques</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {p.technicalForms.for04 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 04 — Inspection</h3>
                    <p className="text-xs text-muted-foreground">Type d'organisme : <strong>{p.technicalForms.for04.typeOrganisme || "—"}</strong></p>
                    <TableBlock title="Domaines" cols={[
                      { key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" },
                      { key: "objetInspecte", label: "Objet" }, { key: "norme", label: "Norme" }, { key: "typeInspection", label: "Type" },
                    ]} rows={p.technicalForms.for04.domaines} />
                    <TableBlock title="Personnel" cols={[
                      { key: "nom", label: "Nom" }, { key: "qualification", label: "Qualification" },
                      { key: "domaineHabilitation", label: "Habilitation" }, { key: "experience", label: "Exp." }, { key: "statut", label: "Statut" },
                    ]} rows={p.technicalForms.for04.inspecteurs} />
                    <TableBlock title="Équipements" cols={[
                      { key: "designation", label: "Désignation" }, { key: "marqueModele", label: "Marque/Modèle" },
                      { key: "noSerie", label: "N° série" }, { key: "gamme", label: "Gamme" }, { key: "dateEtalonnage", label: "Étalonnage" },
                    ]} rows={p.technicalForms.for04.equipements} />
                  </div>
                )}
                {p.technicalForms.for05 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 05 — Essais (ISO/IEC 17025)</h3>
                    <TableBlock title="Portée" cols={[
                      { key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" },
                      { key: "produitMatrice", label: "Produit/Matrice" }, { key: "essaiAnalyse", label: "Essai" },
                      { key: "methodeRef", label: "Méthode" }, { key: "norme", label: "Norme" },
                    ]} rows={p.technicalForms.for05.domaines} />
                    <TableBlock title="Méthodes" cols={[
                      { key: "reference", label: "Réf" }, { key: "titre", label: "Titre" },
                      { key: "type", label: "Type" }, { key: "statutValidation", label: "Validation" },
                    ]} rows={p.technicalForms.for05.methodes} />
                    <TableBlock title="Équipements" cols={[
                      { key: "designation", label: "Désignation" }, { key: "marqueModele", label: "Marque/Modèle" },
                      { key: "gamme", label: "Gamme" }, { key: "resolution", label: "Résolution" },
                      { key: "dateEtalonnage", label: "Étalonnage" }, { key: "noCertificat", label: "N° cert" },
                    ]} rows={p.technicalForms.for05.equipements} />
                    <TableBlock title="Personnel" cols={[
                      { key: "nom", label: "Nom" }, { key: "diplome", label: "Diplôme" },
                      { key: "specialite", label: "Spécialité" }, { key: "fonction", label: "Fonction" },
                      { key: "experience", label: "Exp." }, { key: "habilitations", label: "Habilitations" },
                    ]} rows={p.technicalForms.for05.personnel} />
                  </div>
                )}
                {p.technicalForms.for06 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 06 — Étalonnage</h3>
                    <TableBlock title="Grandeurs" cols={[
                      { key: "grandeur", label: "Grandeur" }, { key: "domaineMesure", label: "Domaine" },
                      { key: "gamme", label: "Gamme" }, { key: "cmc", label: "CMC" },
                      { key: "methode", label: "Méthode" }, { key: "norme", label: "Norme" },
                    ]} rows={p.technicalForms.for06.grandeurs} />
                    <TableBlock title="Étalons" cols={[
                      { key: "designation", label: "Désignation" }, { key: "noIdentification", label: "N° id" },
                      { key: "grandeur", label: "Grandeur" }, { key: "gamme", label: "Gamme" },
                      { key: "incertitude", label: "Incertitude" }, { key: "tracabilite", label: "Traçabilité" },
                      { key: "dateEtalonnage", label: "Étalonnage" },
                    ]} rows={p.technicalForms.for06.etalons} />
                  </div>
                )}
                {p.technicalForms.for07 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 07 — Certification SM</h3>
                    {p.technicalForms.for07.referentiels?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.technicalForms.for07.referentiels.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                      </div>
                    )}
                    <TableBlock title="Secteurs" cols={[
                      { key: "codeIAF", label: "IAF" }, { key: "description", label: "Description" },
                      { key: "sousSecteurs", label: "Sous-secteurs" }, { key: "nbAuditeurs", label: "Nb auditeurs" },
                    ]} rows={p.technicalForms.for07.secteurs} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {Array.isArray(p.documents) && p.documents.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Documents joints ({p.documents.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {p.documents.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm truncate">{d.name}</span>
                      </div>
                      {d.base64 ? (
                        <Button variant="ghost" size="sm" onClick={() => {
                          const mime = d.mimeType || "application/octet-stream";
                          const bc = atob(d.base64);
                          const ba = new Uint8Array(bc.length);
                          for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
                          const blob = new Blob([ba], { type: mime });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = d.name; a.click();
                          URL.revokeObjectURL(url);
                        }}><Download className="w-3.5 h-3.5 mr-1" /> Télécharger</Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">sans fichier</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Déclaration */}
          {(p.demandeurNom || p.signature) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Déclaration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Info label="Organisme autorisant" value={p.organismeSoumission} />
                  <Info label="Demandeur" value={p.demandeurNom} />
                  <Info label="Fonction" value={p.demandeurFonction} />
                  <Info label="Date" value={p.demandeurDate ? new Date(p.demandeurDate).toLocaleDateString("fr-FR") : "—"} />
                  <Info label="Signature" value={p.signature} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* CD Assignment Info */}
          {req.assignedToCd && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Send className="w-4 h-4" /> Assignation au Chef de Département
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Info icon={Users} label="Chef de Département" value={req.assignedToCd.fullName} />
                  <Info icon={Mail} label="Email du CD" value={req.assignedToCd.email} />
                  {req.department && <Info icon={Building2} label="Département" value={`${req.department.name} (${req.department.code})`} />}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className={canReview ? "border-2 border-amber-300" : ""}>
            <CardHeader>
              <CardTitle>Décision de la Direction Technique</CardTitle>
              <CardDescription>
                {canReview
                  ? "Validez pour transmettre au Chef de Département, ou rejetez pour demander une correction à l'OEC."
                  : "Cette demande n'est plus à l'étape de vérification DT."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {req.dtReviewComments && (
                <Alert><AlertDescription><strong>Commentaires précédents :</strong> {req.dtReviewComments}</AlertDescription></Alert>
              )}
              {canReview && (
                <>
                  <div className="space-y-2">
                    <Label>Commentaires / Observations</Label>
                    <Textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Observations sur les documents (obligatoire si rejet)" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 p-3 border rounded-lg bg-slate-50">
                    <div className="space-y-1">
                      <Label className="text-xs">Département concerné <span className="text-red-500">*</span></Label>
                      <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                        <SelectTrigger><SelectValue placeholder="Choisir un département" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Chef de Département <span className="text-red-500">*</span></Label>
                      {(() => {
                        const cd = cdsInDept.find((c) => String(c.id) === selectedCdId);
                        const placeholder = !selectedDeptId
                          ? "Sélectionnez d'abord un département"
                          : loadingCds
                            ? "Chargement..."
                            : "Aucun CD rattaché à ce département";
                        return (
                          <div className="flex items-center h-10 px-3 rounded-md border bg-background text-sm">
                            {cd ? (
                              <span className="truncate"><strong>{cd.fullName}</strong> — {cd.email}</span>
                            ) : (
                              <span className="text-muted-foreground italic">{placeholder}</span>
                            )}
                          </div>
                        );
                      })()}
                      
                      {selectedDeptId && !loadingCds && cdsInDept.length === 0 && (
                        <p className="text-xs text-amber-700">Aucun CD n'est rattaché à ce département.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-[#00A63E] hover:bg-[#009235]"
                      onClick={() => act(true)}
                      disabled={busy || !selectedDeptId || !selectedCdId}
                    >
                      {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                      Valider & Transmettre au CD
                    </Button>
                    <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le rejet</DialogTitle>
            <DialogDescription>L'OEC sera notifié et devra corriger puis resoumettre la demande.</DialogDescription>
          </DialogHeader>
          {!comments.trim() && <Alert variant="destructive"><AlertDescription>Un motif est obligatoire pour rejeter.</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label>Motif du rejet</Label>
            <Textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => act(false)} disabled={busy || !comments.trim()}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
