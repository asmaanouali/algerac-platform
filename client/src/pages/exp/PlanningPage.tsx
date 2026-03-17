import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarDays, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PlanningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unavailableDates, setUnavailableDates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDates(); }, []);

  const loadDates = async () => {
    try {
      const res = await fetch(`/api/workflow/availability/user/${user?.id}`, { credentials: "include" });
      if (res.ok) setUnavailableDates(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addUnavailableDate = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const res = await apiRequest("POST", "/api/workflow/availability/mark-unavailable", {
        userId: user?.id,
        unavailableDate: dateStr,
        reason: "Indisponible",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Date d'indisponibilité enregistrée" });
        loadDates();
        setSelectedDate(undefined);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const removeDate = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/workflow/availability/${id}`);
      toast({ title: "Succès", description: "Date retirée" });
      loadDates();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const unavailableDateSet = new Set(
    unavailableDates.map((d: any) => {
      const parts = (d.unavailableDate as string).split("T")[0].split("-");
      return new Date(+parts[0], +parts[1] - 1, +parts[2]).toDateString();
    })
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Mon Planning</h1>
            <p className="text-muted-foreground mt-1">Gérez vos disponibilités pour les missions d'évaluation</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" />Calendrier</CardTitle>
                  <CardDescription>Sélectionnez les dates où vous n'êtes pas disponible</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{ unavailable: (date) => unavailableDateSet.has(date.toDateString()) }}
                    modifiersStyles={{ unavailable: { backgroundColor: "#fecaca", color: "#991b1b", borderRadius: "4px" } }}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  {selectedDate && (
                    <div className="mt-4 w-full">
                      <Button onClick={addUnavailableDate} disabled={saving} className="w-full">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Marquer indisponible: {selectedDate.toLocaleDateString("fr-FR")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dates d'Indisponibilité</CardTitle>
                  <CardDescription>{unavailableDates.length} date(s) enregistrée(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {unavailableDates.length > 0 ? unavailableDates
                      .sort((a: any, b: any) => new Date(a.unavailableDate).getTime() - new Date(b.unavailableDate).getTime())
                      .map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <CalendarDays className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{(() => { const p = (d.unavailableDate as string).split("T")[0].split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); })()}</p>
                              {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeDate(d.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune date d'indisponibilité enregistrée</p>
                        <p className="text-xs">Vous êtes considéré comme disponible pour toutes les missions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
