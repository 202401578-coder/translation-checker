import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { align, segment } from "../lib/alignment";

// Single-threaded WASM works on GitHub Pages without cross-origin isolation.
// All sentence processing stays inside this worker; only model files are fetched.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.proxy = false;

let encoder: Promise<FeatureExtractionPipeline> | undefined;
let busy = false;
const progress = (message: string, percent?: number) => self.postMessage({ type: "progress", message, percent });

self.onmessage = async (event: MessageEvent) => {
  if (busy) return;
  busy = true;
  try {
    const { source, target, language, mode } = event.data;
    if (typeof source !== "string" || typeof target !== "string" || !["de", "en", "fr", "ja", "es"].includes(language) || !["sentence", "line"].includes(mode)) throw new Error("원문과 한국어 번역을 확인해 주세요.");
    const src = segment(source, language, mode), tgt = segment(target, "ko", mode);
    if (source.length + target.length > 30000 || !src.length || !tgt.length || src.length > 100 || tgt.length > 100 || [...src, ...tgt].some(s => s.length > 1000)) throw new Error("각 입력은 1~100문장, 한 문장은 1,000자 이내, 전체는 30,000자 이내로 입력해 주세요.");
    progress("분석 모델을 준비하고 있어요.");
    if (!encoder) {
      const create = pipeline as unknown as (task: "feature-extraction", model: string, options: Record<string, unknown>) => Promise<FeatureExtractionPipeline>;
      encoder = create("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
        dtype: "q8", device: "wasm",
        progress_callback: (p: { status: string; progress?: number; file?: string }) => {
          if (p.status === "progress" && p.progress !== undefined) progress("모델 파일 다운로드 · " + Math.round(p.progress) + "%", p.progress);
        },
      }).catch(error => { encoder = undefined; throw error; });
    }
    const model = await encoder;
    const pairs = (list: string[]) => list.slice(0, -1).map((s, i) => s + " " + list[i + 1]);
    const a = pairs(src), b = pairs(tgt), texts = [...src, ...tgt, ...a, ...b];
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += 4) {
      progress("문장 의미 비교 중 · " + Math.min(i + 4, texts.length) + " / " + texts.length, i / texts.length * 100);
      const output = await model(texts.slice(i, i + 4), { pooling: "mean", normalize: true });
      vectors.push(...output.tolist() as number[][]);
    }
    const rows = align(vectors.slice(0, src.length), vectors.slice(src.length, src.length + tgt.length), vectors.slice(src.length + tgt.length, src.length + tgt.length + a.length), vectors.slice(src.length + tgt.length + a.length));
    self.postMessage({ type: "result", report: { source: src, target: tgt, rows } });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("각 입력") ? error.message : "분석을 완료하지 못했습니다. 인터넷 연결과 브라우저 여유 메모리를 확인해 주세요. 최신 Chrome, Edge 또는 Safari에서 다시 시도할 수 있습니다.";
    self.postMessage({ type: "error", message });
  } finally { busy = false; }
};
