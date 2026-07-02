"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 h-screen shrink-0 z-50">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="sticky top-0 z-40 shrink-0">
          <Header />
        </div>
        <main className="flex-1 p-6 bg-muted/10 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
