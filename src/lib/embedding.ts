import { pipeline, env, type FeatureExtractionPipeline } from "@huggingface/transformers";
import path from "node:path";

env.cacheDir = path.join(process.cwd(), ".model-cache");
env.allowLocalModels = false;
const state = globalThis as typeof globalThis & { sentenceEncoder?: Promise<FeatureExtractionPipeline>; alignmentBusy?: boolean };

export function acquireAnalysis() { if (state.alignmentBusy) return false; state.alignmentBusy = true; return true; }
export function releaseAnalysis() { state.alignmentBusy = false; }

export async function embed(texts: string[]): Promise<number[][]> {
  if (!state.sentenceEncoder) {
    const createEncoder = pipeline as unknown as (task: "feature-extraction", model: string, options: { dtype: "q8" }) => Promise<FeatureExtractionPipeline>;
    state.sentenceEncoder = createEncoder("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", { dtype: "q8" }).catch(error => { state.sentenceEncoder = undefined; throw error; });
  }
  const encoder = await state.sentenceEncoder;
  const result: number[][] = [];
  for (let i = 0; i < texts.length; i += 8) {
    const output = await encoder(texts.slice(i, i + 8), { pooling: "mean", normalize: true });
    result.push(...output.tolist() as number[][]);
  }
  return result;
}
