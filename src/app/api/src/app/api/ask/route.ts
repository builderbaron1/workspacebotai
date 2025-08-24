import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/src/lib/prompt";
import { getMiniLMEmbedding } from "@/src/lib/embedding";
import { supabase } from "@/src/lib/supabaseClient";

type MatchRow = {
  id: string;
  content: string;
  similarity?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body?.query;
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing 'query' string" }, { status: 400 });
    }

    // 1) Embed the user query (MiniLM via HF Inference you set up earlier)
    const queryEmbedding = await getMiniLMEmbedding(query);

    // 2) Try to pull related chunks from Supabase (RPC optional)
    let contextChunks: string[] = [];
    try {
      const { data, error } = await supabase
        .rpc("match_embeddings", {
          query_embedding: queryEmbedding,
          match_count: 6,
          match_threshold: 0.5,
        });
      if (error) throw error;
      const rows = (data ?? []) as MatchRow[];
      contextChunks = rows.map((r) => r.content).filter(Boolean);
    } catch {
      // No RPC yet? Fine—proceed without RAG.
      contextChunks = [];
    }

    const contextBlock =
      contextChunks.length > 0
        ? `\n\nContext:\n${contextChunks.map((c, i) => `- (${i + 1}) ${c}`).join("\n")}`
        : "";

    // 3) Call OpenAI (model: gpt-5-mini is cost-efficient + strong)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${query}${contextBlock}` },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      temperature: 0.2,
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I didn’t get a usable answer.";

    return NextResponse.json({
      answer,
      contextUsed: contextChunks.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
