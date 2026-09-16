"use client";
import { useState, useRef } from "react";
import { splitSentences, extractSourceSentencesFromMixedText, type SourceLanguage } from "@/lib/sentences";
import { compareSentenceLists, type ComparisonReport } from "@/lib/compare";

const samples: Record<SourceLanguage, { source: string; translation: string }> = {
  de: { source: "Heute Morgen bin ich früher als gewöhnlich aufgestanden.\nNach dem Frühstück bin ich mit dem Fahrrad zur Arbeit gefahren.\nAuf dem Weg habe ich einen alten Freund getroffen.\nWir haben uns kurz unterhalten und Telefonnummern ausgetauscht.\nAm Nachmittag musste ich an einer wichtigen Besprechung teilnehmen.", translation: "Heute Morgen bin ich früher als gewöhnlich aufgestanden.\n오늘 아침 나는 평소보다 일찍 일어났다.\n\nNach dem Frühstück bin ich mit dem Fahrrad zur Arbeit gefahren.\n아침 식사 후 자전거를 타고 직장에 갔다.\n\nAuf dem Weg habe ich einen alten Freund getroffen.\n가는 길에 오랜 친구를 만났다.\n\nAm Nachmittag musste ich an einer wichtigen Besprechung teilnehmen.\n오후에는 중요한 회의에 참석해야 했다." },
  en: { source: "The meeting started at nine.\nEveryone introduced themselves.\nWe discussed the new project.", translation: "The meeting started at nine.\n회의는 아홉 시에 시작했다.\nWe discussed the new project.\n우리는 새 프로젝트에 대해 논의했다." },
  ja: { source: "今日はいい天気です。\n公園に行きました。\n友達に会いました。", translation: "今日はいい天気です。\n오늘은 날씨가 좋다.\n友達に会いました。\n친구를 만났다." },
  auto: { source: "The meeting started at nine.\nEveryone introduced themselves.", translation: "The meeting started at nine.\n회의는 아홉 시에 시작했다." },
};
const statusLabels = { match: "일치", similar: "유사", missing: "누락" };
const statusColors = { match: "bg-green-50 border-green-500 text-green-700", similar: "bg-yellow-50 border-yellow-400 text-yellow-700", missing: "bg-red-50 border-red-500 text-red-600" };
export default function Home() {
  const [source, setSource] = useState("");
  const [translation, setTranslation] = useState("");
  const [language, setLanguage] = useState<SourceLanguage>("de");
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  function compare() {
    setError(""); setCopied(false);
    const src = splitSentences(source, language), ext = extractSourceSentencesFromMixedText(translation, language);
    if (!ext.length) { setReport(null); setError("번역 결과에서 원문을 찾지 못했습니다. 오른쪽에는 원문과 한국어 번역이 함께 있는 텍스트를 넣어 주세요. 한국어 번역만으로는 비교할 수 없습니다."); return; }
    if (src.length > 500 || ext.length > 500) { setError("한 번에 500문장 이하로 나누어 비교해 주세요."); return; }
    setExtracted(ext); setReport(compareSentenceLists(src, ext));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }
  async function upload(file: File | undefined, update: (text: string) => void) {
    if (!file) return;
    if (file.size > 1000000) { setError("1MB 이하의 텍스트 파일을 선택해 주세요."); return; }
    try { update(await file.text()); setReport(null); setError(""); } catch { setError("파일을 읽을 수 없습니다."); }
  }
  return <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <header className="text-center mb-8"><h1 className="text-3xl font-bold mb-2">번역 검증기</h1><p className="text-gray-500">원문과 번역 결과를 비교하여 누락된 원문 문장을 검출합니다</p></header>
    <div className="mb-5 flex items-center gap-3"><label htmlFor="language" className="text-sm font-medium">원문 언어</label><select id="language" className="border rounded-lg px-3 py-2 bg-white" value={language} onChange={e => { setLanguage(e.target.value as SourceLanguage); setReport(null); }}>{Object.entries({ de: "🇩🇪 독일어 (Deutsch)", en: "🇺🇸 영어 (English)", ja: "🇯🇵 일본어 (日本語)", auto: "🌐 자동 감지" }).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    <div className="grid md:grid-cols-2 gap-5">{[{id:"source",label:"원문",value:source,update:setSource,hint:"문장을 줄바꿈 또는 단락 단위로 입력하세요."},{id:"translation",label:"번역 결과 (원문 + 한국어 번역 혼합)",value:translation,update:setTranslation,hint:"한국어 줄은 자동으로 제외하고 원문 문장만 추출합니다."}].map(field => <div key={field.id}><div className="flex justify-between items-center gap-2 mb-2"><label htmlFor={field.id} className="font-semibold">{field.label}</label><label className="text-blue-600 text-sm cursor-pointer shrink-0">파일 업로드<input className="sr-only" type="file" accept=".txt,.md" onChange={e => { void upload(e.target.files?.[0],field.update); e.target.value=""; }} /></label></div><textarea id={field.id} value={field.value} spellCheck={false} onChange={e => { field.update(e.target.value); setReport(null); setError(""); }} className="w-full h-72 rounded-xl border border-gray-300 p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={field.id === "source" ? "원문을 입력하세요." : "원문 한 줄\n한국어 번역 한 줄\n\n원문 한 줄\n한국어 번역 한 줄"}/><p className="text-xs text-gray-500 mt-1">{field.hint}</p></div>)}</div>
    <div className="flex justify-center gap-3 my-6"><button className="border border-gray-300 rounded-lg px-5 py-3 hover:bg-gray-100" onClick={() => { setSource(samples[language].source); setTranslation(samples[language].translation); setReport(null); setError(""); }}>샘플 텍스트 넣기</button><button className="bg-blue-600 text-white font-semibold rounded-lg px-7 py-3 disabled:opacity-40 hover:bg-blue-700" disabled={!source.trim() || !translation.trim()} onClick={compare}>비교하기</button></div>
    <p className="text-center text-xs text-gray-500">입력한 텍스트는 브라우저 안에서만 처리됩니다. 번역 의미의 정확성을 평가하는 기능은 아닙니다.</p>
    {error && <p role="alert" className="mt-5 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">{error}</p>}
    {report && <div ref={resultRef} className="border-t mt-8 pt-7 scroll-mt-20"><div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">{[{label:"원문 문장",value:report.totalSource,color:"bg-gray-100"},{label:"추출 문장",value:report.totalExtracted,color:"bg-gray-100"},{label:"일치",value:report.matchCount,color:"bg-green-100 text-green-700"},{label:"유사",value:report.similarCount,color:"bg-yellow-100 text-yellow-700"},{label:"누락",value:report.missingCount,color:"bg-red-100 text-red-600"},{label:"추가",value:report.extraCount,color:"bg-blue-100 text-blue-700"}].map(s => <div key={s.label} className={`rounded-lg p-4 text-center ${s.color}`}><div className="text-3xl font-bold">{s.value}</div><div className="text-sm mt-1">{s.label}</div></div>)}</div>
    <details className="mb-5 text-sm text-gray-500"><summary className="cursor-pointer">추출된 원문 문장 미리보기 ({extracted.length}개)</summary><ol className="list-decimal pl-6 mt-3 space-y-2">{extracted.map((s,i) => <li key={i}>{s}</li>)}</ol></details>
    <div className="space-y-3">{report.results.map((r,i) => <article key={i} className={`border-l-4 rounded-r-lg p-4 ${statusColors[r.status]}`}><div className="flex items-center gap-3 mb-2"><span className="text-gray-400 text-xs">{i+1}.</span><span className="text-sm font-semibold">{r.status === "match" ? "✓" : r.status === "missing" ? "✗" : "≈"} {statusLabels[r.status]}</span>{r.orderIssue && <span className="text-purple-700 text-xs">⚠ 순서 불일치</span>}{r.status === "similar" && <span className="text-xs">{Math.round(r.similarity*100)}%</span>}</div><p className="text-gray-800 font-mono text-sm leading-relaxed">{r.sourceSentence}</p>{r.matchedSentence && r.status !== "match" && <p className="text-gray-500 text-sm mt-2">→ {r.matchedSentence}</p>}</article>)}{report.extras.map((e,i) => <article key={`extra-${i}`} className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg p-4"><span className="text-blue-700 text-sm font-semibold">+ 추가</span><p className="font-mono text-sm mt-2">{e.sentence}</p></article>)}</div>
    <div className="text-center mt-6"><button className="border rounded-lg px-5 py-2" onClick={async () => { try { await navigator.clipboard.writeText(`번역 검증 결과\n일치: ${report.matchCount}, 유사: ${report.similarCount}, 누락: ${report.missingCount}, 추가: ${report.extraCount}\n\n`+report.results.map((r,i)=>`${i+1}. [${statusLabels[r.status]}] ${r.sourceSentence}`).join("\n")+"\n"+report.extras.map(e=>`[추가] ${e.sentence}`).join("\n")); setCopied(true); } catch { setError("복사 권한을 확인해 주세요."); } }}>{copied ? "복사 완료" : "결과 복사"}</button></div></div>}
  </main>;
}
