import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getMiniLMEmbedding } from "@/lib/embedding";
import { buildMessages, Match } from "@/lib/prompt";
import OpenAI from "openai";

// export const runtime = "edge"; // optional later

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing 'query' string" }, { status: 400 });
    }

    // 1) Embed user question
    const embedding = await getMiniLMEmbedding(query);

    // 2) Retrieve from Supabase RPC
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: embedding,
      match_count: 8,
    });
    if (error) throw error;

    const matches = (data || []) as Match[];
    const messages = buildMessages(query, matches);

    // 3) Ask LLM for a cited answer
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: completion.choices[0].message?.content,
      matches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
