'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  Home, FileText, Search, PlusCircle, Zap, BarChart2,
  User, LogOut, LogIn, UserPlus, X, Users, Brain, ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const isAgent = (session?.user as any)?.userType === 'agent';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAgent) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-blue-900 text-white shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-800">
          <h1 className="text-xl font-bold">Natafuta</h1>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-blue-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Main menu */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-300 uppercase px-3 py-2">Menu Principal</p>
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Accueil</span>
            </Link>
            <Link
              href="/missing"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Recherche</span>
            </Link>
          </div>

          {/* Agent menu */}
          <div className="space-y-2 pt-4 border-t border-blue-800">
            <p className="text-xs font-semibold text-blue-300 uppercase px-3 py-2">Outils Agent</p>
            <Link
              href="/create-notice"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Créer Fiche</span>
            </Link>
            <Link
              href="/family-matches"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Zap className="h-5 w-5" />
              <span>Correspondances</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <BarChart2 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/ai-matching"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-700 bg-purple-800/40 transition-colors"
            >
              <Brain className="h-5 w-5" />
              <span>Analyse IA</span>
            </Link>
            <Link
              href="/matching-statistics"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <BarChart2 className="h-5 w-5" />
              <span>Statistiques</span>
            </Link>
          </div>

          {/* User menu */}
          <div className="space-y-2 pt-4 border-t border-blue-800">
            <p className="text-xs font-semibold text-blue-300 uppercase px-3 py-2">Compte</p>
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Profil</span>
            </Link>
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-700 transition-colors text-left"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-blue-800 p-4">
          <p className="text-xs text-blue-300">
            {(session?.user as any)?.name || 'Agent'}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {(session?.user as any)?.organization || 'Organisation'}
          </p>
        </div>
      </aside>
    </>
  );
}
