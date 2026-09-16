"use client";

import { Fragment, useState } from "react";
import { tokenize, type Token } from "@/lib/tokenize";
import { lookupWord, type DictionaryEntry } from "@/lib/dictionary";

// ────────────────────────────────────────────────────────────
// 샘플 문장
// ────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    label: "샘플 1",
    text: "Er weine der Führung in Teheran keine Träne nach.",
  },
  {
    label: "샘플 2",
    text: "Bundeskanzler Merz wollte Trump nicht über das Völkerrecht belehren.",
  },
  {
    label: "샘플 3",
    text: "Das Leben ist wie eine Reise, die man nur einmal macht.",
  },
];

// ────────────────────────────────────────────────────────────
// 서브 컴포넌트: 클릭 가능한 단어 렌더링
// ────────────────────────────────────────────────────────────

function ClickableWord({
  token,
  selected,
  onClick,
}: {
  token: Token;
  selected: boolean;
  onClick: () => void;
}) {
  if (!token.isWord) {
    return <span className="text-gray-800">{token.display}</span>;
  }

  return (
    <span
      onClick={onClick}
      className={`
        inline-block cursor-pointer rounded px-0.5 transition-all select-none
        ${
          selected
            ? "bg-blue-100 border-2 border-blue-500 text-blue-900 font-semibold"
            : "border-2 border-transparent hover:bg-gray-100 hover:border-gray-300 text-gray-800"
        }
      `}
    >
      {token.display}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// 서브 컴포넌트: 뜻 카드
// ────────────────────────────────────────────────────────────

function MeaningCard({
  token,
  entry,
}: {
  token: Token | null;
  entry: DictionaryEntry | null;
}) {
  if (!token) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white p-5 text-center text-gray-400 text-sm">
        단어를 클릭하면 뜻이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="border border-blue-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <div className="bg-blue-50 border-b border-blue-200 px-5 py-3 flex items-baseline gap-3">
        <span className="text-xl font-bold text-blue-900">{token.clean}</span>
        {entry?.baseForm && entry.baseForm !== token.clean && (
          <span className="text-sm text-blue-500">
            원형:{" "}
            <span className="font-medium text-blue-700">{entry.baseForm}</span>
          </span>
        )}
      </div>

      {/* 카드 바디 */}
      <div className="px-5 py-4">
        {entry ? (
          <div className="space-y-2">
            {/* 뜻 */}
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-10 pt-0.5 shrink-0">
                뜻
              </span>
              <span className="text-gray-800 font-medium leading-relaxed">
                {entry.meaning}
              </span>
            </div>
            {/* 품사 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-10 shrink-0">
                품사
              </span>
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {entry.pos}
              </span>
            </div>
            {/* 메모 */}
            {entry.note && (
              <div className="flex items-start gap-3 mt-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-10 pt-0.5 shrink-0">
                  참고
                </span>
                <span className="text-sm text-gray-500 leading-relaxed">
                  {entry.note}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            &ldquo;{token.clean}&rdquo; — 사전에 데이터가 없는 단어입니다.
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────────────────

export default function WordMeaningPage() {
  const [inputText, setInputText] = useState(SAMPLES[0].text);
  const [activeText, setActiveText] = useState(SAMPLES[0].text);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const tokens = tokenize(activeText);
  const selectedToken = selectedId !== null
    ? (tokens.find((t) => t.id === selectedId) ?? null)
    : null;
  const entry = selectedToken ? lookupWord(selectedToken.clean) : null;

  const handleApply = () => {
    setActiveText(inputText.trim());
    setSelectedId(null);
  };

  const handleSample = (text: string) => {
    setInputText(text);
    setActiveText(text);
    setSelectedId(null);
  };

  const handleWordClick = (token: Token) => {
    if (!token.isWord) return;
    setSelectedId((prev) => (prev === token.id ? null : token.id));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">독일어 단어 뜻 확인</h1>
          <p className="text-sm text-gray-500 mt-1">
            문장을 입력한 뒤 단어를 클릭하면 한국어 뜻이 표시됩니다.
          </p>
        </div>

        {/* 입력 영역 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            독일어 문장 입력
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="독일어 문장을 입력하세요..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleApply}
              disabled={!inputText.trim()}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              적용
            </button>
            <span className="text-xs text-gray-400">샘플:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSample(s.text)}
                className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 문장 표시 영역 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-3 font-medium">
            단어를 클릭하여 선택하세요
          </p>
          <p className="text-lg leading-relaxed">
            {tokens.map((token, i) => (
              <Fragment key={token.id}>
                {i > 0 && " "}
                <ClickableWord
                  token={token}
                  selected={selectedId === token.id}
                  onClick={() => handleWordClick(token)}
                />
              </Fragment>
            ))}
          </p>
          {selectedToken && (
            <p className="text-xs text-gray-400 mt-3">
              선택됨:{" "}
              <span className="font-semibold text-blue-600">
                {selectedToken.clean}
              </span>{" "}
              — 다른 단어를 클릭하면 교체, 같은 단어를 다시 클릭하면 해제
            </p>
          )}
        </div>

        {/* 뜻 카드 */}
        <MeaningCard token={selectedToken} entry={entry} />

        {/* 사전 커버리지 안내 */}
        <p className="text-xs text-gray-400 text-center">
          현재 Mock 사전 기반 · 향후 외부 사전 API 연동 예정
        </p>
      </div>
    </main>
  );
}
