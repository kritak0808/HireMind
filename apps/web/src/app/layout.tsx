import React from 'react';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata = {
  title: 'HireMind AI - Autonomous Enterprise Hiring Intelligence Platform',
  description: 'Production-grade enterprise hiring intelligence platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-deep-matte text-text-white min-h-screen antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
