'use client';

import React, { useState } from 'react';

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setAnswer(data.answer ?? JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1>Ask Workspace Bot AI</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="Ask me something…"
          style={{ padding: 12, fontSize: 16 }}
          required
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{ padding: '10px 16px', fontSize: 16 }}
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson', marginTop: 16 }}>Error: {error}</p>}
      {answer && (
        <section style={{ marginTop: 24 }}>
          <h3>Answer</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{answer}</pre>
        </section>
      )}
    </main>
  );
}
