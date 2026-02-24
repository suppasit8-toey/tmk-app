import type { Metadata } from "next";
import { Kanit, Inter, Outfit } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/utils/supabase/server";

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-thai",
  subsets: ["latin", "thai"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TMK TEAM",
  description: "Management System for Curtain Store",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <html lang="th">
      <body className={`${kanit.variable} ${inter.variable} ${outfit.variable}`}>
        <AppLayout user={user} profile={profile}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
