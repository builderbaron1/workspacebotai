import * as hf from "@huggingface/inference";
const hfClient = new hf.HfInference(process.env.HF_API_KEY!);

export async function getMiniLMEmbedding(text: string): Promise<number[]> {
  const v = await hfClient.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  const arr = Array.isArray((v as any)[0]) ? (v as number[][])[0] : (v as number[]);
  if (arr.length !== 384) throw new Error("Expected 384-dim embedding");
  return arr;
}
