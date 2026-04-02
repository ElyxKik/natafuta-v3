'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Home, FileText, Search,
  User, LogOut, LogIn, UserPlus, Menu, X, Users
} from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const isAgent = status === 'authenticated' && (session?.user as any)?.userType === 'agent';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Agents use the sidebar via AgentLayout — no navbar needed
  if (isAgent) return null;

  // Show a minimal navbar skeleton while session is loading to prevent layout shift
  if (status === 'loading') {
    return (
      <header className="bg-blue-800 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold flex items-center gap-2">
              <img src="/logo.png" alt="Natafuta" className="h-10 w-10" />
              <span className="hidden sm:inline">Natafuta</span>
            </Link>
            <div className="hidden md:flex items-center space-x-2">
              <div className="h-8 w-20 bg-blue-700 rounded-lg animate-pulse" />
              <div className="h-8 w-20 bg-blue-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // For visitors: show full navbar
  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <img src="/logo.png" alt="Natafuta" className="h-10 w-10" />
            <span className="hidden sm:inline">Natafuta</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:block">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="hover:text-blue-200 flex items-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Home className="h-5 w-5 mr-2" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/missing" className="hover:text-blue-200 flex items-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <FileText className="h-5 w-5 mr-2" />
                  Avis de recherche
                </Link>
              </li>
              {session?.user && (
                <li>
                  <Link href="/my-searches" className="hover:text-blue-200 flex items-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
                    <Users className="h-5 w-5 mr-2" />
                    Mes recherches
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* User area */}
          <div className="hidden md:flex items-center space-x-2">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-1 hover:text-blue-200 py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span>{session.user.name || session.user.email}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-blue-200 flex items-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <LogIn className="h-5 w-5 mr-1" />
                  Connexion
                </Link>
                <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center transition-colors">
                  <UserPlus className="h-5 w-5 mr-1" />
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 pb-2" onClick={() => setMobileOpen(false)}>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                  <Home className="h-5 w-5 mr-3" /> Accueil
                </Link>
              </li>
              <li>
                <Link href="/missing" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                  <FileText className="h-5 w-5 mr-3" /> Avis de recherche
                </Link>
              </li>
              {session?.user && (
                <li>
                  <Link href="/my-searches" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                    <Users className="h-5 w-5 mr-3" /> Mes recherches
                  </Link>
                </li>
              )}
              {session?.user ? (
                <>
                  <li>
                    <Link href="/profile" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                      <User className="h-5 w-5 mr-3" /> Profil
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-3" /> Déconnexion
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                      <LogIn className="h-5 w-5 mr-3" /> Connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className="flex items-center py-3 px-4 hover:text-blue-200 hover:bg-blue-700 rounded-lg transition-colors">
                      <UserPlus className="h-5 w-5 mr-3" /> Inscription
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
