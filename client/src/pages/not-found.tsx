import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="md:ml-64">
          <Navbar />
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404 Page Not Found</h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404 Page Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      
      <Link href="/">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          Retour à l'accueil
        </Button>
      </Link>
    </div>
  );
}
