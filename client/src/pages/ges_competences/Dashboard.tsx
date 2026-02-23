import { Sidebar } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Users, FileCheck, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Link } from "wouter";

export default function GesCompetencesDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble des candidatures.</p>
            </div>
          </main>
        </div>
      </div>
  );
}
