import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const loginMutation = useLogin();
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Branding */}
      <div className="hidden md:flex flex-col justify-between bg-[#0055A4] p-12 text-white relative overflow-hidden">
        {/* Abstract Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-3xl font-display font-bold">
            <div className="w-10 h-10 bg-white text-primary rounded flex items-center justify-center">A</div>
            ALGERAC
          </div>
          <p className="mt-4 text-blue-100 max-w-md text-lg">
            Organisme Algérien d'Accréditation
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-display font-bold leading-tight">
            Gérez vos demandes d'accréditation en toute simplicité
          </h1>
          <p className="text-blue-100 text-lg">
            Plateforme unifiée pour les Organismes d'Évaluation de la Conformité (OEC), 
            les Évaluateurs et le personnel ALGERAC.
          </p>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          © {new Date().getFullYear()} ALGERAC. Tous droits réservés.
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 md:hidden">
              <span className="text-2xl font-bold text-primary">A</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Connexion à votre espace
            </CardTitle>
            <CardDescription className="text-slate-500">
              Saisissez vos identifiants pour accéder à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse Email</FormLabel>
                      <FormControl>
                        <Input placeholder="exemple@oec.dz" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Mot de passe</FormLabel>
                        <Button 
                          variant="ghost" 
                          className="p-0 h-auto text-xs text-primary"
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                        >
                          Mot de passe oublié ?
                        </Button>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                  >
                    Se souvenir de moi
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4 border-t bg-slate-50/50 rounded-b-xl">
            <div className="text-sm text-center text-slate-500">
              Vous n'avez pas de compte ?{" "}
              <Button variant="ghost" className="p-0 h-auto font-semibold text-primary">
                Créer un compte
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
