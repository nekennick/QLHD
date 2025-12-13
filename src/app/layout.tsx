import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quản Lý Hợp Đồng",
  description: "Hệ thống quản lý thực hiện hợp đồng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
