import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "문장 사이 — 원문과 해석을 잇다",
  description: "원문과 한국어 번역의 문장별 대응을 비교하고 누락과 합쳐진 번역을 검토하는 독해 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-800">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
