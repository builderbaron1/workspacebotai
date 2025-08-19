set -euo pipefail

# --- package.json ---
cat > package.json <<'JSON'
{
  "name": "workspacebotai",
  "version": "1.0.0",
  "description": "MVP for Workspace Bot AI (Notion + Slack Q&A)",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "next": "^15.4.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "@types/node": "^24.3.0",
    "@types/react": "^19.1.10",
    "typescript": "^5.9.2"
  }
}
JSON

# --- tsconfig.json (safe to overwrite) ---
cat > tsconfig.json <<'JSON'
{
  "extends": "next/core-web-vitals",
  "compilerOptions": { "strict": true }
}
JSON

# --- app files ---
mkdir -p src/app/api/health

cat > src/app/page.tsx <<'TSX'
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Workspace Bot AI</h1>
      <p>Next.js app is Live. Check <code>/api/health</code> for JSON.</p>
    </main>
  );
}
TSX

cat > src/app/api/health/route.ts <<'TS'
import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ ok: true, app: "workspacebotai" });
}
TS

# --- .gitignore ---
cat > .gitignore <<'GIT'
node_modules
.next
.vercel
.env*
GIT

npm install
npm run build
