import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, Clock, Loader2, Stamp } from "lucide-react";

export default function CertificateSigningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<number | null>(null);

  const role = (user as any)?.role || (user as any)?.typeRole || "";
  const roleUpper = role.toUpperCase();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all requests
      const res = await fetch("/api/requests", { credentials: "include" });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || data.content || []);

      // Keep requests that could have a certificate
      const relevant = list.filter((r: any) =>
        ["CERTIFICATE_PREPARATION", "CERTIFICATE_ISSUED", "ACTIVE"].includes(r.status)
      );

      // Fetch certificate for each
      const results: any[] = [];
      await Promise.all(relevant.map(async (r: any) => {
        try {
          const certRes = await fetch(`/api/workflow/accreditation/${r.id}/certificate`, { credentials: "include" });
          if (certRes.ok) {
            const certData = await certRes.json();
            const cert = certData?.data || certData;
            if (cert && cert.id) {
              results.push({ request: r, cert });
            }
          }
        } catch {}
      }));
      setItems(results);
    } catch (err) {
    }
    setLoading(false);
  };

  const handleSign = async (certId: number) => {
    setSigning(certId);
    try {
      const res = await apiRequest("PUT", `/api/workflow/accreditation/certificates/${certId}/sign`);
      const data = await res.json();
      toast({
        title: "Certificat signé avec succès",
        description: `Votre signature (${roleUpper}) a été apposée.`,
      });
      loadData();
    } catch (err: any) {
      toast({ title: "Erreur de signature", description: err.message, variant: "destructive" });
    }
    setSigning(null);
  };

  if (!user) return null;

  const needsMySignature = (cert: any) => {
    if (roleUpper === "DT") return !cert.signedByDT;
    if (roleUpper === "DG") return !cert.signedByDG;
    return false;
  };

  const getCertStatus = (cert: any) => {
    if (cert.published) return { label: "Publié", color: "bg-emerald-100 text-emerald-800" };
    if (cert.signedByDT && cert.signedByDG) return { label: "Signé (DT + DG)", color: "bg-green-100 text-green-800" };
    if (cert.signedByDT || cert.signedByDG) return { label: "Partiellement signé", color: "bg-amber-100 text-amber-800" };
    return { label: "En attente de signature", color: "bg-yellow-100 text-yellow-800" };
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6" />
              Certificats d'accréditation
            </h1>
            <p className="text-muted-foreground">
              Signature et suivi des certificats FOR 05
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <Card className="flex items-center justify-center h-48">
              <div className="text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun certificat à traiter pour le moment</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map(({ request, cert }) => {
                const status = getCertStatus(cert);
                const needsSign = needsMySignature(cert);
                return (
                  <Card key={cert.id} className={needsSign ? "border-2 border-amber-300 shadow-md" : "border"}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{cert.certificateNumber || `Certificat #${cert.id}`}</CardTitle>
                          <CardDescription>
                            Dossier: {request.referenceNumber} — {request.organizationName || request.oec?.organizationName || "OEC"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={status.color}>{status.label}</Badge>
                          {needsSign && (
                            <Badge className="bg-red-100 text-red-800 animate-pulse">
                              Action requise
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Portée</p>
                          <p className="font-medium">{cert.scope || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Domaines techniques</p>
                          <p className="font-medium">{cert.technicalDomains || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date d'émission</p>
                          <p className="font-medium">
                            {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("fr-FR") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expiration</p>
                          <p className="font-medium">
                            {cert.expirationDate ? new Date(cert.expirationDate).toLocaleDateString("fr-FR") : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Signature status */}
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className={cert.signedByDT ? "border-green-500 text-green-700" : "border-gray-300 text-gray-500"}>
                          DT {cert.signedByDT ? "✓ Signé" : "— En attente"}
                        </Badge>
                        <Badge variant="outline" className={cert.signedByDG ? "border-green-500 text-green-700" : "border-gray-300 text-gray-500"}>
                          DG {cert.signedByDG ? "✓ Signé" : "— En attente"}
                        </Badge>
                      </div>

                      {/* SIGN BUTTON — always visible when user hasn't signed yet */}
                      {needsSign && (
                        <Button
                          size="lg"
                          onClick={() => handleSign(cert.id)}
                          disabled={signing === cert.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                        >
                          {signing === cert.id ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Stamp className="w-5 h-5 mr-2" />
                          )}
                          Signer le certificat ({roleUpper})
                        </Button>
                      )}

                      {!needsSign && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Vous avez déjà signé ce certificat</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
