import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useCreateRequest } from "@/hooks/use-requests";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestTypes } from "@shared/schema";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Identification" },
  { id: 2, title: "Détails" },
  { id: 3, title: "Confirmation" }
];

const formSchema = z.object({
  oecId: z.coerce.number(),
  type: z.enum(requestTypes),
  domain: z.string().min(1, "Le domaine est requis"),
  status: z.string().default("draft"),
  progress: z.number().default(0),
});

export default function CreateRequestPage() {
  const { user } = useAuth();
  const createRequestMutation = useCreateRequest();
  const [currentStep, setCurrentStep] = useState(1);
  const [_, setLocation] = useLocation();

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "initial",
      domain: "",
      oecId: user?.id || 0,
      status: "draft",
      progress: 0,
    },
  });

  if (!user) return <Redirect to="/" />;

  const onSubmit = (values: any) => {
    createRequestMutation.mutate(values as any, {
      onSuccess: () => {
        setLocation("/requests");
      }
    });
  };

  const nextStep = () => {
    const fieldsToValidate = currentStep === 1 
      ? ['type', 'domain'] as const 
      : [];
      
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    });
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Nouvelle Demande</h1>
              <p className="text-muted-foreground">Créer une demande d'accréditation</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10" />
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center bg-slate-50 px-4">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300",
                      currentStep >= step.id 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-slate-300 text-slate-400"
                    )}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={cn(
                    "mt-2 text-sm font-medium hidden sm:block",
                    currentStep >= step.id ? "text-primary" : "text-slate-400"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>Veuillez remplir les informations requises.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de demande</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Sélectionnez le type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {requestTypes.map((type) => (
                                  <SelectItem key={type} value={type} className="capitalize">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Le type d'accréditation que vous sollicitez.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domaine d'activité</FormLabel>
                            <FormControl>
                              <Input placeholder="ex: Laboratoire d'essais béton" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription>
                              Précisez le domaine technique concerné.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">i</span>
                          Information Importante
                        </h4>
                        <p>
                          Vous devrez télécharger les documents justificatifs dans l'étape suivante via votre tableau de bord
                          une fois la demande initialisée.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-slate-50">
                          <span className="text-xs text-muted-foreground uppercase">Organisation</span>
                          <p className="font-semibold">{(user as any).nomOrganisme || user.fullName}</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-slate-50">
                          <span className="text-xs text-muted-foreground uppercase">Email de contact</span>
                          <p className="font-semibold">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-8">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Prêt à soumettre ?</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Votre demande sera créée avec le statut "Brouillon". Vous pourrez ajouter les documents requis ultérieurement.
                      </p>
                      
                      <div className="bg-slate-50 p-4 rounded-lg text-left max-w-sm mx-auto mt-6 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{form.getValues('type')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Domaine:</span>
                          <span className="font-medium capitalize">{form.getValues('domain')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
              >
                Précédent
              </Button>
              
              {currentStep < steps.length ? (
                <Button onClick={nextStep} className="bg-primary hover:bg-primary/90">
                  Suivant <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={createRequestMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {createRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Soumettre la demande
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        </main>
      </div>
    </div>
  );
}
