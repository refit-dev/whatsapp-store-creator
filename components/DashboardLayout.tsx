"use client";

import { DashboardNav } from "./DashboardNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  storeHandle?: string;
}

export function DashboardLayout({
  children,
  storeHandle,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Navigation */}
      <DashboardNav storeHandle={storeHandle} />

      {/* Main content area */}
      <div className="lg:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
