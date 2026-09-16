"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Navbar() {
  const pathname = usePathname();
  return <nav className="site-nav" aria-label="주요 메뉴"><div className="nav-inner"><Link href="/" className="brand"><span className="brand-icon" aria-hidden>≍</span>문장 사이<span className="brand-english">SAI</span></Link><div className="nav-links"><Link href="/" aria-current={pathname === "/" ? "page" : undefined}>문장 대응 검사</Link><Link href="/word-meaning/" aria-current={pathname.startsWith("/word-meaning") ? "page" : undefined}>단어 뜻 확인</Link></div><span className="nav-caption">YOUR READING COMPANION</span></div></nav>;
}
