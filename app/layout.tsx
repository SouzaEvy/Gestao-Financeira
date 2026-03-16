import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Finança — Gestão Financeira Inteligente",
  description:
    "Conecte seus bancos, acompanhe gastos e controle seu orçamento com Open Finance.",
  keywords: ["finanças pessoais", "open finance", "controle financeiro", "pluggy"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable}`}
      >
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster
              theme="dark"
              richColors
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(222 47% 9%)",
                  border: "1px solid hsl(222 47% 14%)",
                  color: "hsl(213 31% 91%)",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
