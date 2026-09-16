"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Navbar() {
  const pathname = usePathname();
  return <nav className="bg-white border-b border-gray-200 sticky top-0 z-50"><div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap gap-3 items-center justify-between"><span className="font-bold text-gray-800 text-sm">🇩🇪 독일어 학습 도구</span><div className="flex gap-1">{[{href:"/", label:"문장 누락 비교"}, {href:"/word-meaning", label:"단어 뜻 확인"}].map(({href,label}) => <Link key={href} href={href} className={`px-4 py-1.5 rounded-md text-sm font-medium ${pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{label}</Link>)}</div></div></nav>;
}
