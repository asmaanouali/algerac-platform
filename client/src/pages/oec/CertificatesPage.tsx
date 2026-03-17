import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, Award, Download, Eye } from "lucide-react";

interface Certificate {
  id: number;
  requestId: number;
  referenceNumber: string;
  certificateNumber?: string;
  type: string;
  domain: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  scope?: string;
  signedByDT?: boolean;
  signedByDG?: boolean;
  published?: boolean;
  certificateUrl?: string;
}

export default function OECCertificatesPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      loadCertificates();
    }
  }, [user, authLoading]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      // Fetch OEC's own requests
      const res = await fetch("/api/requests/my-requests", { credentials: "include" });
      if (!res.ok) return;

      const requests = await res.json();
      // Filter requests that have reached certificate stage
      const certified = requests.filter((r: any) =>
        r.status === "CERTIFICATE_PREPARATION" ||
        r.status === "CERTIFICATE_ISSUED" ||
        r.status === "ACTIVE" ||
        r.status === "RENEWED"
      );

      // Fetch actual certificate details for each request
      const certs: Certificate[] = [];
      for (const r of certified) {
        try {
          const certRes = await fetch(`/api/workflow/accreditation/${r.id}/certificate`, { credentials: "include" });
          if (certRes.ok) {
            const certData = await certRes.json();
            const cert = certData?.data;
            if (cert) {
              certs.push({
                id: cert.id || r.id,
                requestId: r.id,
                referenceNumber: r.referenceNumber || `ACC-${r.id}`,
                certificateNumber: cert.certificateNumber,
                type: r.type,
                domain: r.domain || cert.technicalDomains || "—",
                status: r.status,
                issueDate: cert.issueDate || r.certificateIssueDate,
                expiryDate: cert.expirationDate || r.certificateExpirationDate,
                scope: cert.scope,
                signedByDT: cert.signedByDT,
                signedByDG: cert.signedByDG,
                published: cert.published,
                certificateUrl: cert.certificateUrl,
              });
              continue;
            }
          }
        } catch {
          // Fall back to request-level data if certificate fetch fails
        }
        // Fallback: use request data only
        certs.push({
          id: r.id,
          requestId: r.id,
          referenceNumber: r.referenceNumber || `ACC-${r.id}`,
          type: r.type,
          domain: r.domain || "—",
          status: r.status,
          issueDate: r.certificateIssueDate,
          expiryDate: r.certificateExpirationDate,
        });
      }
      setCertificates(certs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "CERTIFICATE_ISSUED": return <Badge className="bg-blue-100 text-blue-800">Délivré</Badge>;
      case "CERTIFICATE_PREPARATION": return <Badge className="bg-amber-100 text-amber-800">En préparation</Badge>;
      case "RENEWED": return <Badge className="bg-emerald-100 text-emerald-800">Renouvelé</Badge>;
      case "SUSPENDED": return <Badge className="bg-orange-100 text-orange-800">Suspendu</Badge>;
      case "REVOKED": return <Badge className="bg-red-100 text-red-800">Révoqué</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Mes Certificats</h1>
            <p className="text-muted-foreground mt-1">Consultez vos certificats d'accréditation délivrés par ALGERAC.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Certificats ({certificates.length})
              </CardTitle>
              <CardDescription>Liste de vos certificats d'accréditation</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun certificat disponible.</p>
                  <p className="text-sm">Les certificats apparaîtront ici une fois votre accréditation délivrée.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>N° Certificat</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de délivrance</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.referenceNumber}</TableCell>
                        <TableCell>{cert.certificateNumber || "—"}</TableCell>
                        <TableCell className="capitalize">{cert.type}</TableCell>
                        <TableCell>{cert.domain}</TableCell>
                        <TableCell>{statusBadge(cert.status)}</TableCell>
                        <TableCell>
                          {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell>
                          {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {cert.signedByDT && cert.signedByDG ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={cert.certificateUrl || `/api/accreditation-delivery/${cert.requestId}/certificate/download`} download>
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">En attente de signature</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
