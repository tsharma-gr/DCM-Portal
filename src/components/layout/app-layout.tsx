"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Suspense } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 h-screen shrink-0 z-50">
        <Suspense fallback={<div className="w-[250px] h-full bg-card" />}>
          <Sidebar />
        </Suspense>
      </div>
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="sticky top-0 z-40 shrink-0">
          <Suspense fallback={<div className="h-16 w-full bg-background" />}>
            <Header />
          </Suspense>
        </div>
        <main className="flex-1 px-8 pt-2 pb-6 bg-muted/10 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
