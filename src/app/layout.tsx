import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "독일어 학습 도구",
  description: "번역 누락 비교 · 단어 뜻 확인",
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
