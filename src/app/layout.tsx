import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/components/providers/data-provider";

export const metadata: Metadata = {
  title: "LaxPlan - Lacrosse Game Scheduler",
  description: "Schedule and manage lacrosse games for youth leagues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TooltipProvider>
          <DataProvider>
            {children}
          </DataProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
