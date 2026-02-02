import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, FileText, Upload, Calendar, AlertCircle } from "lucide-react";

interface FormItem {
  id: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const nationalites = [
  "Algérienne",
  "Française",
  "Marocaine",
  "Tunisienne",
  "Libyenne",
  "Égyptienne",
  "Mauritanienne",
  "Sénégalaise",
  "Malienne",
  "Nigérienne",
  "Tchadienne",
  "Soudanaise",
  "Autre"
];

export default function ExpertRegister() {
  const [, setLocation] = useLocation();
  const [formations, setFormations] = useState<FormItem[]>([{ id: 1 }]);
  const [autresFormations, setAutresFormations] = useState<FormItem[]>([{ id: 1 }]);
  const [experiences, setExperiences] = useState<FormItem[]>([{ id: 1 }]);
  const [evaluations, setEvaluations] = useState<FormItem[]>([{ id: 1 }]);
  const [formationsDispensees, setFormationsDispensees] = useState<FormItem[]>([{ id: 1 }]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const addItem = (items: FormItem[], setItems: (items: FormItem[]) => void) => {
    setItems([...items, { id: Date.now() }]);
  };

  const removeItem = (items: FormItem[], setItems: (items: FormItem[]) => void, id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCV(e.target.files[0]);
    }
  };

  // Validation du numéro de téléphone algérien
  const validatePhone = (phone: string, fieldName: string) => {
    const phoneRegex = /^(\+213|0)(5|6|7)[0-9]{8}$/;
    if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: "Format invalide. Ex: +213 555 123 456 ou 0555 123 456"
      }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    }
  };

  // Validation de l'email
  const validateEmail = (email: string, fieldName: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: "Format d'email invalide"
      }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ color: '#00A63E' }}>ALGERAC</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/register"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Candidature Expert / Évaluateur / Formateur</h2>
          <p className="text-slate-600">Devenez partenaire d'ALGERAC</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-10">
            
            {/* Section 1 - Identification */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">1 - Identification</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Nom complet" />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      className="pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nationalité</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {nationalites.map((nat) => (
                        <SelectItem key={nat} value={nat.toLowerCase()}>
                          {nat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Situation familiale</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="celibataire">Célibataire</SelectItem>
                      <SelectItem value="marie">Marié(e)</SelectItem>
                      <SelectItem value="divorce">Divorcé(e)</SelectItem>
                      <SelectItem value="veuf">Veuf(ve)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => document.getElementById('photo')?.click()}>
                      <Upload className="w-4 h-4 mr-2" /> Choisir
                    </Button>
                    <input type="file" id="photo" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </div>
                  {photo && <span className="text-xs text-green-600">{photo.name}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Date d&apos;élaboration du CV</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      className="pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Contacts */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">2 - Contacts</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Domicile ou Entreprise</h4>
                  <div className="space-y-2">
                    <Label>Domicile</Label>
                    <Input placeholder="Adresse domicile" />
                  </div>
                  <div className="space-y-2">
                    <Label>Entreprise</Label>
                    <Input placeholder="Adresse entreprise" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Coordonnées</h4>
                  <div className="space-y-2">
                    <Label>Numéro de téléphone</Label>
                    <Input 
                      placeholder="+213 555 123 456" 
                      onBlur={(e) => validatePhone(e.target.value, 'phone1')}
                      className={errors.phone1 ? 'border-red-500' : ''}
                    />
                    {errors.phone1 && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.phone1}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone mobile</Label>
                    <Input 
                      placeholder="+213 666 123 456" 
                      onBlur={(e) => validatePhone(e.target.value, 'mobile1')}
                      className={errors.mobile1 ? 'border-red-500' : ''}
                    />
                    {errors.mobile1 && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.mobile1}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Fax</Label>
                    <Input placeholder="Numéro fax" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input 
                      type="email" 
                      placeholder="email@exemple.com"
                      onBlur={(e) => validateEmail(e.target.value, 'email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-sm">Contact (en cas d&apos;urgences)</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input placeholder="Nom du contact" />
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro de téléphone</Label>
                    <Input 
                      placeholder="+213 555 123 456"
                      onBlur={(e) => validatePhone(e.target.value, 'emergencyPhone')}
                      className={errors.emergencyPhone ? 'border-red-500' : ''}
                    />
                    {errors.emergencyPhone && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.emergencyPhone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone mobile</Label>
                    <Input 
                      placeholder="+213 666 123 456"
                      onBlur={(e) => validatePhone(e.target.value, 'emergencyMobile')}
                      className={errors.emergencyMobile ? 'border-red-500' : ''}
                    />
                    {errors.emergencyMobile && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.emergencyMobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Formation(s) académique(s) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">3 - Formation(s) académique(s)</h3>
                <Button variant="outline" size="sm" onClick={() => addItem(formations, setFormations)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">Par ordre chronologique : du plus récent au plus ancien</p>
              {formations.map((formation, index) => (
                <div key={formation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Formation {index + 1}</span>
                    {formations.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(formations, setFormations, formation.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & durée</Label>
                      <Input placeholder="Ex: 2015-2018 (3 ans)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Université / Institution</Label>
                      <Input placeholder="Nom de l'institution" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cours / Spécialité</Label>
                      <Input placeholder="Spécialité" />
                    </div>
                    <div className="space-y-2">
                      <Label>Diplôme</Label>
                      <Input placeholder="Diplôme obtenu" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3 - Autres Formations */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">3 - Autres Formations</h3>
                <Button variant="outline" size="sm" onClick={() => addItem(autresFormations, setAutresFormations)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">Par ordre chronologique : du plus récent au plus ancien</p>
              {autresFormations.map((formation, index) => (
                <div key={formation.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Autre formation {index + 1}</span>
                    {autresFormations.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(autresFormations, setAutresFormations, formation.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & durée</Label>
                      <Input placeholder="Ex: Janvier 2020 (5 jours)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Université / Institution</Label>
                      <Input placeholder="Nom de l'institution" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cours / Spécialité</Label>
                      <Input placeholder="Spécialité" />
                    </div>
                    <div className="space-y-2">
                      <Label>Diplôme</Label>
                      <Input placeholder="Certificat / Attestation" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 4 - Expérience Professionnelle */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">4 - Expérience Professionnelle</h3>
                <Button variant="outline" size="sm" onClick={() => addItem(experiences, setExperiences)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">Par ordre chronologique : du plus récent au plus ancien</p>
              {experiences.map((exp, index) => (
                <div key={exp.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Expérience {index + 1}</span>
                    {experiences.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(experiences, setExperiences, exp.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date (du - au)</Label>
                      <Input placeholder="Ex: 01/2020 - 12/2023" />
                    </div>
                    <div className="space-y-2">
                      <Label>Organisme</Label>
                      <Input placeholder="Nom de l'entreprise/organisme" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Poste occupé</Label>
                      <Input placeholder="Intitulé du poste" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Activités principales</Label>
                      <Textarea placeholder="Décrire les activités principales..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Domaine compétence actuel</Label>
                      <Input placeholder="Domaine" />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous domaine</Label>
                      <Input placeholder="Sous domaine" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 5 - Évaluation ou Audit de SM réalisés */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">5 - Évaluation ou Audit de SM réalisés</h3>
                <Button variant="outline" size="sm" onClick={() => addItem(evaluations, setEvaluations)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">Par ordre chronologique : du plus récent au plus ancien</p>
              {evaluations.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Évaluation/Audit {index + 1}</span>
                    {evaluations.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(evaluations, setEvaluations, item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mois/Année</Label>
                      <Input placeholder="Ex: 03/2023" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type d&apos;évaluation ou d&apos;audit</Label>
                      <Input placeholder="Type" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle tenu dans l&apos;équipe</Label>
                      <Input placeholder="Ex: Chef d'équipe, Auditeur..." />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Normes utilisées comme référentiels</Label>
                      <Input placeholder="Ex: ISO 9001, ISO 14001..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 6 - Formations dispensées */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex-1">6 - Formations dispensées ayant un lien avec les activités d&apos;évaluation</h3>
                <Button variant="outline" size="sm" onClick={() => addItem(formationsDispensees, setFormationsDispensees)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
              <p className="text-xs text-slate-500 italic">Par ordre chronologique : du plus récent au plus ancien</p>
              {formationsDispensees.map((form, index) => (
                <div key={form.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Formation dispensée {index + 1}</span>
                    {formationsDispensees.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(formationsDispensees, setFormationsDispensees, form.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & Durée</Label>
                      <Input placeholder="Ex: 10/2022 (3 jours)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Formation</Label>
                      <Input placeholder="Intitulé de la formation" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 7 - Connaissance Linguistique */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">7 - Connaissance Linguistique</h3>
              <p className="text-xs text-slate-500 italic">1 = Basique | 2 = Bien | 3 = Très bien | 4 = Excellent</p>
              <div className="space-y-4">
                {['Arabe', 'Français', 'Anglais', 'Autre'].map((langue) => (
                  <div key={langue} className="grid grid-cols-4 gap-4 items-center p-3 bg-slate-50 rounded">
                    <Label className="font-semibold">{langue}</Label>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Lu</Label>
                      <Select>
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Parlé</Label>
                      <Select>
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Écrit</Label>
                      <Select>
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">1 - Basique</SelectItem>
                          <SelectItem value="2">2 - Bien</SelectItem>
                          <SelectItem value="3">3 - Très bien</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 8 - Divers */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">8 - Divers</h3>
              <div className="space-y-2">
                <Label>Informations complémentaires</Label>
                <Textarea placeholder="Informations complémentaires pertinentes..." rows={4} />
              </div>
            </div>

            {/* Documents & Engagements */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">Documents & Engagements</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CV Détaillé (Format FOR 20) - Optionnel</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="gap-2 bg-white" onClick={() => document.getElementById('cv-file')?.click()}>
                      <FileText className="w-4 h-4" /> Choisir un fichier
                    </Button>
                    <input type="file" id="cv-file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVChange} />
                    <span className="text-xs text-slate-400 italic">
                      {cv ? cv.name : 'Aucun fichier sélectionné'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                  <input type="checkbox" className="mt-1" id="agree" />
                  <Label htmlFor="agree" className="text-sm leading-relaxed font-medium">
                    Je confirme l&apos;exactitude des informations fournies et mon engagement d&apos;indépendance, d&apos;objectivité et de confidentialité conformément aux règles d&apos;ALGERAC.
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