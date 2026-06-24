import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayoutShell from "@/components/layout/ClientLayoutShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Panda E-Mart | Admin",
  description: "Administrative dashboard for Panda E-Mart",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased bg-[#f8f9fa]`} suppressHydrationWarning>
        <Providers>
          <ClientLayoutShell>
            {children}
          </ClientLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
