import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, FileSignature, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CommitmentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<number | null>(null);

  useEffect(() => { loadMemberships(); }, []);

  const loadMemberships = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) setMemberships(await res.json());
    } catch (e) { }
    setLoading(false);
  };

  const signCommitment = async (memberId: number) => {
    setSigning(memberId);
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/members/${memberId}/sign`, {
        hasConflictOfInterest: false,
        conflictDetails: ""
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Engagement signé avec succès" });
        loadMemberships();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSigning(null);
  };

  if (!user) return null;

  const unsigned = memberships.filter((m: any) => !m.commitmentSigned);
  const signed = memberships.filter((m: any) => m.commitmentSigned);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Engagements</h1>
              <p className="text-muted-foreground mt-1">
                Signez vos engagements de confidentialité et d'impartialité pour chaque mission
              </p>
            </div>
            <Button variant="outline" onClick={loadMemberships} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {unsigned.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <CardTitle className="text-lg text-amber-800">Engagements à Signer</CardTitle>
                    </div>
                    <CardDescription>
                      Vous devez signer ces engagements avant de pouvoir participer aux évaluations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {unsigned.map((m: any) => (
                      <div key={m.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Équipe #{m.teamId}</p>
                            <Badge variant="outline" className="mt-1">{m.role}</Badge>
                          </div>
                          <Button onClick={() => signCommitment(m.id)} disabled={signing === m.id}>
                            {signing === m.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileSignature className="w-4 h-4 mr-2" />
                            )}
                            Signer
                          </Button>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                          <p className="font-medium">En signant cet engagement, je m'engage à :</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Respecter la confidentialité des informations de l'organisme évalué</li>
                            <li>Ne pas divulguer les résultats de l'évaluation à des tiers</li>
                            <li>Déclarer tout conflit d'intérêt potentiel</li>
                            <li>Exercer mon rôle en toute impartialité et objectivité</li>
                            <li>Respecter les procédures et normes en vigueur</li>
                            <li>Me conformer au code de déontologie d'ALGERAC</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-lg">Engagements Signés</CardTitle>
                  </div>
                  <CardDescription>
                    Vous gardez l'accès à vos engagements signés, avec la date de signature, pour consultation à tout moment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {signed.length > 0 ? (
                    <div className="space-y-3">
                      {signed.map((m: any) => {
                        const signedDate = m.commitmentDate
                          ? new Date(m.commitmentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                          : null;
                        const signedTime = m.commitmentDate
                          ? new Date(m.commitmentDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                          : null;
                        return (
                          <div key={m.id} className="border border-green-200 rounded-lg p-4 bg-green-50/40">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">Équipe #{m.teamId} — {m.role}</p>
                                  {signedDate && (
                                    <p className="text-xs text-green-800">
                                      Signé le <strong>{signedDate}</strong>{signedTime ? ` à ${signedTime}` : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800">Signé</Badge>
                            </div>
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm text-green-800 select-none">
                                Consulter le texte de l'engagement
                              </summary>
                              <div className="mt-2 p-3 bg-white rounded border border-green-100 text-sm space-y-1">
                                <p className="font-medium">En signant cet engagement, je m'engage à :</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                  <li>Respecter la confidentialité des informations de l'organisme évalué</li>
                                  <li>Ne pas divulguer les résultats de l'évaluation à des tiers</li>
                                  <li>Déclarer tout conflit d'intérêt potentiel</li>
                                  <li>Exercer mon rôle en toute impartialité et objectivité</li>
                                  <li>Respecter les procédures et normes en vigueur</li>
                                  <li>Me conformer au code de déontologie d'ALGERAC</li>
                                </ul>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun engagement signé</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
