import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import 'svgmap/dist/svgMap.min.css';
import SessionProvider from "@/utils/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/Providers";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";
import ProgressBar from "@/components/ProgressBar";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Electronic Marketplace",
  description: "Your trusted electronics e-commerce shop",
};

/**
 * Provides the application's root HTML layout, wrapping page content with session state and global UI components.
 *
 * @param children - Page content to render inside the global providers and layout
 * @returns The top-level HTML element containing global providers, header, footer, progress bar, and the rendered `children`
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions) as any;
  return (
    <html lang="en" data-theme="light">
      <body className={`${inter.className} ${montserrat.variable}`}>
        <SessionProvider session={session}>
          <ProgressBar />
          <SessionTimeoutWrapper />
          <Header />
          <Providers>
            {children}
          </Providers>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
