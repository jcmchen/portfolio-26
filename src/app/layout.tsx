import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import ClientWrapper from "@/components/ClientWrapper";
import Header from "@/components/Header";
import "./globals.css";

export const metadata = {
  title: "Jeremy Chen",
  description: "Architecture, computation, material systems, and perception.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fbfaf7] text-[#111111]">
        <Suspense fallback={null}>
          <Header />
          <ClientWrapper>{children}</ClientWrapper>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
