import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { LayoutDashboard, FilePlus, Files, AlertCircle, Calendar, Users, FileText, Receipt, ShieldCheck, LogOut, ArrowRight, Download, Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";


export default function OECDashboard() {
  

  return (
    <div className="flex h-screen w-full bg-slate-50">
          <Sidebar />
          
          <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
            <Navbar />
              
              <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
                </div>
              </main>
            </div>
          </div>
  );
}
