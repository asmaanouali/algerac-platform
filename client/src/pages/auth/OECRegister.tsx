import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Building2, UserRound, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OECRegister() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();

  const next = () => setStep(s => Math.min(s + 1, 3));
  const prev = () => setStep(s => Math.max(s - 1, 1));
  const submit = () => setLocation("/auth/success");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold">A</div>
            <h1 className="text-lg font-bold text-primary tracking-tight">ALGERAC</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Créer un compte</h2>
          <p className="text-slate-600">Organisme d'Évaluation de la Conformité (OEC)</p>
        </div>

        <div className="flex justify-between max-w-2xl mx-auto relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                step === s ? 'bg-primary border-primary text-white' : 
                step > s ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {s === 1 ? 'Organisme' : s === 2 ? 'Représentant' : 'Documents'}
              </span>
            </div>
          ))}
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Raison Sociale / Nom de l'organisme</Label>
                      <Input placeholder="Entrez le nom" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type d'organisme</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab">Laboratoire</SelectItem>
                          <SelectItem value="insp">Inspection</SelectItem>
                          <SelectItem value="cert">Certification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Adresse du siège social</Label>
                      <Input placeholder="Adresse complète" />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input placeholder="+213 ..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Email officiel</Label>
                      <Input type="email" placeholder="contact@organisme.dz" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nom et Prénom du représentant légal</Label>
                      <Input placeholder="Nom complet" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fonction</Label>
                      <Input placeholder="Directeur, Gérant, ..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone direct</Label>
                      <Input placeholder="+213 ..." />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Email professionnel</Label>
                      <Input type="email" placeholder="r.legal@organisme.dz" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Portée d'accréditation souhaitée</Label>
                      <Textarea placeholder="Décrivez brièvement la portée..." className="min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Documents à joindre (Statuts, Registre de commerce, Organigramme)</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-2 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-slate-600">Cliquez pour ajouter des fichiers ou glissez-déposez</p>
                        <p className="text-xs text-slate-400">PDF, JPG, PNG (Max 10MB par fichier)</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={prev} disabled={step === 1}>
                Précédent
              </Button>
              {step < 3 ? (
                <Button onClick={next} className="gap-2">
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={submit} className="bg-green-600 hover:bg-green-700">
                  Soumettre la demande
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
