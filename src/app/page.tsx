"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { segment, type AlignmentRow, type AlignmentStatus, type SplitMode } from "@/lib/alignment";
import { example } from "@/lib/examples";

const labels: Record<AlignmentStatus, string> = {
  paired: "대응 후보", review: "의미 확인", missing: "누락 의심",
  merged: "합쳐짐 의심", split: "나뉨 의심", extra: "추가 의심",
};
type Report = { source: string[]; target: string[]; rows: AlignmentRow[] };
type Filter = "all" | "review" | "pending";

export default function Home() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [language, setLanguage] = useState("de");
  const [mode, setMode] = useState<SplitMode>("sentence");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ message: "분석 모델을 준비하고 있어요.", percent: undefined as number | undefined });
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => () => workerRef.current?.terminate(), []);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [study, setStudy] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const src = useMemo(() => segment(source, language, mode), [source, language, mode]);
  const tgt = useMemo(() => segment(target, "ko", mode), [target, mode]);
  const tooLarge = src.length > 100 || tgt.length > 100 || source.length + target.length > 30000;
  const invalidate = () => {
    setReport(null); setError(""); setConfirmed(new Set()); setRevealed(new Set()); setCopied(false);
  };
  const toggle = (id: number, current: Set<number>, update: (s: Set<number>) => void) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  };
  function loadExample(kind: string) {
    invalidate(); setLanguage("de"); setMode("sentence");
    const data = example(kind); setSource(data.source); setTarget(data.target);
  }
  function analyze() {
    setBusy(true); invalidate(); setFilter("all");
    setProgress({ message: "분석 모델을 준비하고 있어요.", percent: undefined });
    try {
      if (!workerRef.current) workerRef.current = new Worker(new URL("../workers/alignment.worker.ts", import.meta.url), { type: "module" });
      const worker = workerRef.current;
      worker.onmessage = ({ data }) => {
        if (data.type === "progress") setProgress({ message: data.message, percent: data.percent });
        if (data.type === "result") {
          setReport(data.report); setBusy(false);
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
        if (data.type === "error") {
          setError(data.message); setBusy(false); worker.terminate(); workerRef.current = null;
        }
      };
      worker.onerror = () => {
        setError("분석기를 실행하지 못했습니다. 최신 브라우저에서 새로고침한 뒤 다시 시도해 주세요.");
        setBusy(false); worker.terminate(); workerRef.current = null;
      };
      worker.postMessage({ source, target, language, mode });
    } catch { setError("이 브라우저에서는 분석기를 실행할 수 없습니다. 최신 브라우저에서 다시 시도해 주세요."); setBusy(false); }
  }
  async function upload(file: File | undefined, side: "source" | "target") {
    if (!file) return;
    if (file.size > 150000 || !/\.(txt|md)$/i.test(file.name)) {
      setError("150KB 이하의 .txt 또는 .md 파일을 선택해 주세요."); return;
    }
    try {
      const text = await file.text(); invalidate();
      (side === "source" ? setSource : setTarget)(text);
    } catch { setError("파일을 읽지 못했습니다. 내용을 직접 붙여넣어 주세요."); }
  }
  function exportText() {
    if (!report) return "";
    return "문장 사이 · 대응 검토표\n자동 분석은 대응 후보이며 번역의 정확성을 보증하지 않습니다.\n\n" +
      report.rows.map((r, i) =>
        "[" + (confirmed.has(i) ? "직접 확인함 · " : "") + labels[r.status] + "]\n" +
        (r.source.map(k => "원문 " + (k + 1) + ": " + report.source[k]).join("\n") || "대응 원문 없음") + "\n" +
        (r.target.map(k => "번역 " + (k + 1) + ": " + report.target[k]).join("\n") || "대응 번역 없음")
      ).join("\n\n");
  }
  const concerns = report?.rows.filter(r => r.status !== "paired").length ?? 0;
  const visible = (r: AlignmentRow, i: number) =>
    filter === "all" || filter === "review" && r.status !== "paired" || filter === "pending" && !confirmed.has(i);

  return <main className="workspace">
    <header className="workspace-heading">
      <div><div className="eyebrow">READ BETWEEN THE LINES</div>
        <h1>한 문장도, 놓치지 않도록.</h1>
        <p>원문과 해석을 나란히 놓고, 문장 사이의 연결을 확인하세요.</p>
      </div>
      <span className="local-tag"><span aria-hidden /> 브라우저 의미 분석</span>
    </header>

    <section className="input-workspace" aria-label="검사할 문서 입력">
      <div className="toolbar">
        <div className="toolbar-title"><span className="step">01</span> 원문과 번역 준비</div>
        <div className="example-actions"><span>예시로 시작</span>
          <button disabled={busy} onClick={() => loadExample("missing")}>한 문장 누락</button>
          <button disabled={busy} onClick={() => loadExample("merged")}>두 문장 합쳐짐</button>
          <button disabled={busy} onClick={() => loadExample("complete")}>전체 번역</button>
        </div>
      </div>
      <div className="editors">{(["source", "target"] as const).map(side =>
        <div className="editor" key={side}>
          <div className="editor-heading">
            <label htmlFor={side}>{side === "source" ? "원문" : "한국어 번역"}</label>
            <div className="editor-tools">
              {side === "source" ? <select aria-label="원문 언어" value={language} disabled={busy}
                onChange={e => { invalidate(); setLanguage(e.target.value); }}>
                <option value="de">독일어 DE</option><option value="en">영어 EN</option>
                <option value="fr">프랑스어 FR</option><option value="ja">일본어 JA</option>
                <option value="es">스페인어 ES</option>
              </select> : <span className="language-label">한국어 KO</span>}
              <label className="upload">파일 열기<input type="file" accept=".txt,.md" disabled={busy}
                aria-label={side === "source" ? "원문 파일 열기" : "번역 파일 열기"}
                onChange={e => { void upload(e.target.files?.[0], side); e.target.value = ""; }} /></label>
            </div>
          </div>
          <textarea id={side} spellCheck={false} disabled={busy} value={side === "source" ? source : target}
            placeholder={side === "source"
              ? "독일어 원문을 그대로 붙여넣으세요.\n\nHeute Morgen bin ich früher als gewöhnlich aufgestanden."
              : "LLM이 번역한 한국어 해석만 붙여넣으세요.\n원문을 섞거나 번호를 맞출 필요 없어요.\n\n오늘 아침 나는 평소보다 일찍 일어났다."}
            onChange={e => { invalidate(); (side === "source" ? setSource : setTarget)(e.target.value); }} />
          <div className="editor-footer"><span><b>{(side === "source" ? src : tgt).length}</b> 문장</span>
            <span>{(side === "source" ? source : target).length.toLocaleString()} 자</span></div>
        </div>
      )}</div>
      <div className="analysis-controls">
        <div className="split-controls"><label className="mode-label">문장 나누기
          <select value={mode} disabled={busy} onChange={e => { invalidate(); setMode(e.target.value as SplitMode); }}>
            <option value="sentence">문장부호 기준</option><option value="line">한 줄을 한 문장으로</option>
          </select></label>
          <button className="text-button" onClick={() => setPreview(!preview)} aria-expanded={preview}>
            {preview ? "문장 목록 접기" : "나눈 문장 확인"}
          </button>
        </div>
        <button className="primary-button" disabled={busy || !src.length || !tgt.length || tooLarge} onClick={analyze}>
          {busy ? <><span className="spinner" /> 의미 비교 중</> : <>문장 대응 검사 <span aria-hidden>↗</span></>}
        </button>
      </div>
      {preview && <div className="segmentation">{[src, tgt].map((sentences, side) =>
        <div key={side}><h3>{side === 0 ? "원문" : "번역"} · {sentences.length}문장</h3>
          <ol>{sentences.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
      )}</div>}
    </section>

    <div className="input-note"><span aria-hidden>ⓘ</span>
      <p>최초 검사 시 약 145MB의 분석 모델을 다운로드합니다. 브라우저가 캐시를 유지하면 다음 검사에 재사용합니다.<br />
        문장은 이 브라우저 안에서 분석되며, 외부 번역 서비스로 전송되지 않습니다.</p>
    </div>
    {tooLarge && <p className="error-panel" role="alert">각 입력은 100문장 이하, 두 입력을 합쳐 30,000자 이내로 나누어 검사해 주세요.</p>}
    {busy && <div className="loading-panel" role="status"><div className="loading-line" />
      <strong>{progress.message}</strong>
      {progress.percent !== undefined && <progress aria-label="분석 진행 상태" max={100} value={progress.percent} style={{ display: "block", width: "min(100%, 360px)", margin: "16px auto" }} />}
      <p>첫 실행은 다운로드와 준비에 수 분 걸릴 수 있습니다. 기기 성능에 따라 분석 시간이 달라집니다.</p>
      <button className="secondary-button" style={{ marginTop: 16 }} onClick={() => { workerRef.current?.terminate(); workerRef.current = null; setBusy(false); }}>검사 취소</button>
    </div>}
    {error && <div className="error-panel" role="alert">{error}</div>}

    {!report && !busy && <section className="empty-guide">
      <div className="guide-mark" aria-hidden>1:1</div>
      <div><h2>문장 수가 같아도, 연결은 다를 수 있어요.</h2>
        <p>누락된 해석과 하나로 합쳐진 번역을 찾아<br className="desktop-break" /> 원문 순서대로 검토할 수 있게 정리합니다.</p></div>
      <div className="guide-pills"><span>1 : 0 <small>누락</small></span>
        <span>2 : 1 <small>합쳐짐</small></span><span>1 : 2 <small>나뉨</small></span></div>
    </section>}

    {report && <section className="results" ref={resultsRef}>
      <div className="result-heading">
        <div><div className="eyebrow">REVIEW YOUR ALIGNMENT</div><h2>문장별 대응 살펴보기</h2></div>
        <div className="export-actions">
          <button className="secondary-button" onClick={async () => {
            try { await navigator.clipboard.writeText(exportText()); setCopied(true); }
            catch { setError("복사 권한을 확인하거나 검토표를 저장해 주세요."); }
          }}>{copied ? "복사 완료" : "결과 복사"}</button>
          <button className="secondary-button" onClick={() => {
            const url = URL.createObjectURL(new Blob([exportText()], { type: "text/plain;charset=utf-8" }));
            const a = document.createElement("a"); a.href = url; a.download = "문장사이-검토표.txt";
            a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}>검토표 저장 ↓</button>
        </div>
      </div>
      <div className="summary-grid">
        <div><span>원문 → 번역</span><strong>{report.source.length}<small> → </small>{report.target.length}<small> 문장</small></strong></div>
        <div><span>1:1 대응 후보</span><strong>{report.rows.filter(r => r.status === "paired").length}<small> 쌍</small></strong></div>
        <div className={concerns ? "attention-stat" : ""}><span>검토할 연결</span><strong>{concerns}<small> 곳</small></strong></div>
        <div><span>내가 확인한 연결</span><strong>{confirmed.size}<small> / {report.rows.length}</small></strong></div>
      </div>
      <div className="analysis-notice">
        {concerns ? "표시된 부분부터 확인하세요. 누락 뒤의 문장도 의미를 기준으로 다시 연결했습니다." : "모든 문장에서 1:1 대응 후보를 찾았습니다. 해석을 읽으며 최종 확인해 주세요."}
        <small>자동 분석은 추정입니다. 비슷한 문장, 순서가 바뀐 번역, 세 문장 이상 합쳐진 번역은 잘못 연결될 수 있습니다.</small>
      </div>
      <div className="results-toolbar">
        <div className="filter-tabs">
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>전체 {report.rows.length}</button>
          <button aria-pressed={filter === "review"} onClick={() => setFilter("review")}>검토 필요 {concerns}</button>
          <button aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>미확인 {report.rows.length - confirmed.size}</button>
        </div>
        <label className="study-toggle"><input type="checkbox" checked={study}
          onChange={e => { setStudy(e.target.checked); setRevealed(new Set()); }} /> 해석 가리고 공부하기</label>
      </div>
      <div className="comparison-labels"><span>원문</span><span>대응 관계</span><span>한국어 해석</span></div>
      <div className="alignment-list">{report.rows.map((row, i) => {
        if (!visible(row, i)) return null;
        return <article className={"alignment-row status-" + row.status + (confirmed.has(i) ? " is-confirmed" : "")} key={i}>
          <div className="sentence-cell original">{row.source.length ? row.source.map(k =>
            <p key={k}><span className="sentence-number">{String(k + 1).padStart(2, "0")}</span><span>{report.source[k]}</span></p>
          ) : <p className="absent">대응하는 원문을 찾지 못했어요.</p>}</div>
          <div className="connection"><span className={"status-chip " + row.status}>{labels[row.status]}</span>
            <span className="ratio">{row.source.length} <span>:</span> {row.target.length}</span>
            {row.source.length > 0 && row.target.length > 0 && <small title="의미 유사도이며 번역 정확도나 확률이 아닙니다.">유사도 {row.score.toFixed(2)}</small>}
          </div>
          <div className="sentence-cell translation">
            {study && row.target.length > 0 && !revealed.has(i)
              ? <button className="reveal-button" onClick={() => toggle(i, revealed, setRevealed)}>해석 보기 <span>↗</span></button>
              : row.target.length ? row.target.map(k =>
                <p key={k}><span className="sentence-number">{String(k + 1).padStart(2, "0")}</span><span>{report.target[k]}</span></p>
              ) : <p className="absent">이 문장에 대응하는 해석을 확인해 주세요.</p>}
            <button aria-pressed={confirmed.has(i)} className="confirm-button"
              onClick={() => { toggle(i, confirmed, setConfirmed); setCopied(false); }}>
              {confirmed.has(i) ? "✓ 직접 확인함" : "○ 확인했어요"}
            </button>
          </div>
        </article>;
      })}{!report.rows.some(visible) && <p className="no-results">이 조건에 해당하는 연결이 없습니다.</p>}</div>
    </section>}

    <footer className="workspace-footer"><span>문장 사이 <span className="footer-divider">/</span> 더 꼼꼼한 독해를 위한 작은 도구</span>
      <span>한 번에 최대 100문장</span></footer>
  </main>;
}
