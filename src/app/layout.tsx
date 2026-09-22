import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "WeatherGPT — Agentic Weather Intelligence",
  description: "Next Generation Agentic Weather Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('skycast_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-sky-background text-sky-text-primary flex h-dvh w-full overflow-hidden transition-colors duration-300">
        <Providers>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-linear-to-br from-sky-background to-sky-surface-elevated/30">
            <Header />
            <div className="flex-1 overflow-y-auto hide-scrollbar relative z-0 lg:pb-0 pb-16">
              {children}
            </div>
            <MobileNav />
          </main>
        </Providers>
      </body>
    </html>
  );
}
