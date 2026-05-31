import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import './sketches.css';

export const metadata: Metadata = {
  title: 'Sketches',
  description: 'Disposable prototypes — not part of the site.',
  robots: { index: false, follow: false },
};

// Always reflect the current folders, never a stale build snapshot.
export const dynamic = 'force-dynamic';

interface SketchEntry {
  slug: string;
  title: string;
  description: string;
}

function getSketches(): SketchEntry[] {
  const dir = path.join(process.cwd(), 'app/sketches');
  let names: fs.Dirent[];
  try {
    names = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return names
    .filter((e) => e.isDirectory())
    .map((e) => {
      const slug = e.name;
      let description = '';
      try {
        const src = fs.readFileSync(path.join(dir, slug, 'page.tsx'), 'utf8');
        const m = src.match(/\/\/\s*sketch:\s*(.+)/);
        if (m) description = m[1].trim();
      } catch {
        // no page.tsx / unreadable — fine, just no description
      }
      return { slug, title: slug.replace(/-/g, ' '), description };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export default function SketchesIndexPage() {
  const sketches = getSketches();

  return (
    <div className="sketchIndex">
      <header className="sketchHead">
        <h1>sketches</h1>
        <p>
          Throwaway prototypes. Not linked from anywhere on the site and never indexed —
          this page is the only way to find them. Safe to delete any time.
        </p>
      </header>

      {sketches.length === 0 ? (
        <p className="sketchEmpty">No sketches yet. Run <code>/sketch</code> to make one.</p>
      ) : (
        <ul className="sketchList">
          {sketches.map((s) => (
            <li key={s.slug}>
              <Link href={`/sketches/${s.slug}`} className="sketchLink">
                <span className="sketchName">{s.title}</span>
                {s.description && <span className="sketchDesc">{s.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
