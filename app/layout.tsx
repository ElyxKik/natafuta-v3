import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AgentLayout } from '@/components/AgentLayout';

export const metadata: Metadata = {
  title: 'Natafuta - Recherche de Personnes Disparues',
  description: 'Application de gestion des fiches de personnes disparues',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <AgentLayout>{children}</AgentLayout>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
