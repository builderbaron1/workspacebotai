import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace Bot AI',
  description: 'MVP for Workspace Bot AI (Notion + Slack Q&A with citations)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
