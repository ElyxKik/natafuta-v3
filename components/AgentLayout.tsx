'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Home, Search, PlusCircle, Zap, BarChart2,
  User, LogOut, Brain, ChevronLeft, ChevronRight, Menu, X,
  TrendingUp, Users, Shield, Globe, MapPin, Tent, Map
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Principal', items: [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/missing', label: 'Personnes disparues', icon: Search },
    { href: '/refugees', label: 'Réfugiés', icon: Globe },
    { href: '/displaced', label: 'Déplacés internes', icon: MapPin },
    { href: '/camps', label: 'Camps', icon: Tent },
    { href: '/my-searches', label: 'Mes recherches', icon: Users },
  ]},
  { section: 'Outils Agent', items: [
    { href: '/create', label: 'Nouvelle fiche', icon: PlusCircle },
    { href: '/family-matches', label: 'Correspondances', icon: Zap },
    { href: '/map', label: 'Carte humanitaire', icon: Map },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { href: '/matching-statistics', label: 'Statistiques', icon: TrendingUp },
    { href: '/ai-matching', label: 'ElikIA', icon: Brain, highlight: true },
  ]},
  { section: 'Compte', items: [
    { href: '/profile', label: 'Profil', icon: User },
  ]},
];

const ADMIN_ITEMS = [
  { href: '/admin/users', label: 'Gestion utilisateurs', icon: Shield },
];

export function AgentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAgent = status === 'authenticated' && (session?.user as any)?.userType === 'agent';
  const isAdmin = isAgent && (session?.user as any)?.isAdmin === true;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Still loading — render a neutral wrapper (no sidebar, no container yet)
  if (status === 'loading') {
    return (
      <main className="container mx-auto px-4 py-6 grow">
        {children}
      </main>
    );
  }

  // Authenticated visitor or unauthenticated — standard main layout
  if (!isAgent) {
    return (
      <main className="container mx-auto px-4 py-6 grow">
        {children}
      </main>
    );
  }

  const userName = (session?.user as any)?.name || 'Agent';
  const userOrg = (session?.user as any)?.organization || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 min-h-0">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-blue-900 text-white flex flex-col z-50 shadow-xl
          transition-all duration-300 ease-in-out
          md:sticky md:top-0 md:shrink-0
          ${collapsed ? 'md:w-16' : 'md:w-64'}
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className={`flex items-center border-b border-blue-800 h-[61px] shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <Link href="/" className="text-lg font-bold flex items-center gap-2 hover:text-blue-200 transition-colors">
              <img src="/logo.png" alt="Natafuta" className="h-8 w-8 shrink-0" />
              Natafuta
            </Link>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-800 transition-colors text-blue-300 hover:text-white"
            title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <p className="text-xs font-semibold text-blue-400 uppercase px-4 mb-2 tracking-wider">
                  {group.section}
                </p>
              )}
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`
                          flex items-center gap-3 rounded-lg transition-colors
                          ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
                          ${isActive
                            ? 'bg-white/15 text-white font-medium'
                            : (item as any).highlight
                              ? 'bg-purple-800/40 hover:bg-purple-700 text-purple-200 hover:text-white'
                              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                        {!collapsed && isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {isAdmin && (
            <div>
              {!collapsed && (
                <p className="text-xs font-semibold text-red-400 uppercase px-4 mb-2 tracking-wider">Administration</p>
              )}
              <ul className="space-y-1 px-2">
                {ADMIN_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-lg transition-colors ${
                          collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                        } ${
                          isActive ? 'bg-white/15 text-white font-medium' : 'text-red-300 hover:bg-red-900/40 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer / user info */}
        <div className="border-t border-blue-800 shrink-0">
          {!collapsed ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  {userOrg && <p className="text-xs text-blue-400 truncate">{userOrg}</p>}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold"
                title={userName}
              >
                {userInitial}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Déconnexion"
                className="p-2 rounded-lg text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile toggle + page context) */}
        <div className="md:hidden bg-blue-800 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="text-lg font-bold">Natafuta</Link>
        </div>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
