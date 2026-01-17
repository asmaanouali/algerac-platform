import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Check, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function ExpertRegister() {
  const [, setLocation] = useLocation();

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
          <h2 className="text-3xl font-bold">Candidature Expert / Évaluateur</h2>
          <p className="text-slate-600">Devenez partenaire d'ALGERAC</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-10">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Informations Personnelles</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Civilité</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Monsieur</SelectItem>
                      <SelectItem value="mme">Madame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input placeholder="Nom et Prénom" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@exemple.com" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input placeholder="+213 ..." />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Formation Académique</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dernier diplôme obtenu</Label>
                  <div className="flex gap-4">
                    <Input placeholder="Intitulé du diplôme" className="flex-1" />
                    <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Expérience Professionnelle</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Poste actuel</Label>
                  <Input placeholder="Intitulé du poste" />
                </div>
                <div className="space-y-2">
                  <Label>Années d'expérience</Label>
                  <Input type="number" placeholder="Total années" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Documents & Engagements</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CV Détaillé (Format FOR 20)</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="gap-2">
                      <FileText className="w-4 h-4" /> Choisir un fichier
                    </Button>
                    <span className="text-xs text-slate-400 italic">Aucun fichier sélectionné</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <input type="checkbox" className="mt-1" id="agree" />
                  <Label htmlFor="agree" className="text-sm leading-relaxed font-medium">
                    Je confirme mon engagement d'indépendance, d'objectivité et de confidentialité conformément aux règles d'ALGERAC.
                  </Label>
                </div>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-bold" onClick={() => setLocation("/auth/success")}>
              Soumettre ma candidature
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
