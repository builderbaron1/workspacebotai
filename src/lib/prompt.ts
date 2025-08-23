export const SYSTEM_PROMPT = `
You are Workspace Bot AI. Answer questions using ONLY the retrieved chunks.
Rules:
- Be concise and direct; bullet when helpful.
- If info is missing, say so and suggest the exact doc to check (by title).
- Add inline citations like [1], [2] that map to each chunk's source_url or url.
- Never invent facts beyond chunks. If user asks outside scope, say it's out of scope.
- If multiple chunks conflict, say which chunks conflict and prefer the most recent if timestamps exist.
- Return a short "Sources" list at the end with [n] Title — URL.
`;

export type Match = {
  doc_id: string;
  title: string | null;
  url: string | null;
  source_url: string | null;
  chunk: string;
  similarity: number;
};

const MAX_CONTEXT_CHARS = 9000;

function dedupeByChunk(matches: Match[]) {
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = m.chunk.trim().slice(0, 180);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trimContextToLimit(text: string, limit = MAX_CONTEXT_CHARS) {
  if (text.length <= limit) return text;
  const half = Math.floor(limit / 2);
  return text.slice(0, half) + "\n...\n" + text.slice(-half);
}

export function buildMessages(userQuestion: string, matches: Match[]) {
  const cleaned = dedupeByChunk(matches).slice(0, 8);
  const numbered = cleaned.map((m, i) => ({
    ...m,
    idx: i + 1,
    title: m.title ?? "Untitled",
    link: m.source_url || m.url || ""
  }));

  const contextBlocks = numbered.map(m => {
    const body = trimContextToLimit(m.chunk);
    return `### [${m.idx}] ${m.title}
URL: ${m.link}
${body}`;
  });

  const retrievalContext = trimContextToLimit(contextBlocks.join("\n\n"));

  const USER_PROMPT = `
User question:
${userQuestion}

Use the context below. Cite with [n] where n maps to the labeled chunks.

Context:
${retrievalContext}

Return format:
- Direct answer first (2–6 sentences).
- If steps are needed, add a short list.
- Then a "Sources" section with [n] Title — URL.
If context is insufficient, say what’s missing and which source(s) to check next.
`;

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: USER_PROMPT },
  ] as const;
}
