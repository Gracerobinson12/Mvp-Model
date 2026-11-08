// app/api/vault/seal/route.ts
// Seals a vault idea: SHA-256 of the full canonical document, optional code hash,
// optional GitHub commit snapshot, then watermarks the doc with a canary mark.
//
// Requires (server-only):
//   SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   GITHUB_TOKEN (optional — only needed for private repos)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';
import { watermarkText } from '@/lib/canary';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GitHub helpers ────────────────────────────────────────────────────────────

function parseGithubUrl(url: string): { owner: string; repo: string; ref?: string } | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!u.hostname.includes('github.com')) return null;
    // Handle /commit/SHA, /tree/branch, /blob/branch/path, or just /owner/repo
    const parts = u.pathname.replace(/^\//, '').split('/');
    if (parts.length < 2) return null;
    const owner = parts[0], repo = parts[1].replace(/\.git$/, '');
    // If path is owner/repo/commit/SHA → use that SHA
    const ref = parts[2] === 'commit' && parts[3] ? parts[3]
              : parts[2] === 'tree' && parts[3] ? parts[3]
              : undefined;
    return { owner, repo, ref };
  } catch {
    return null;
  }
}

async function fetchGithubCommit(owner: string, repo: string, ref?: string) {
  const endpoint = ref
    ? `https://api.github.com/repos/${owner}/${repo}/commits/${ref}`
    : `https://api.github.com/repos/${owner}/${repo}/commits/HEAD`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GratiaCore-VaultSeal/1.0',
  };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    sha: data.sha as string,
    tree_sha: data.commit?.tree?.sha as string,
    message: (data.commit?.message as string || '').slice(0, 300),
    author: data.commit?.author?.name as string,
    committed_at: data.commit?.author?.date as string,
    html_url: data.html_url as string,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    // 2. Parse body — ideaId required; codeSnippet and githubUrl are optional additions
    const body = await req.json();
    const { ideaId, codeSnippet, githubUrl } = body;
    if (!ideaId) return NextResponse.json({ ok: false, error: 'Missing ideaId' }, { status: 400 });

    // 3. Load idea (ownership check)
    const { data: idea, error: loadErr } = await admin
      .from('vault_ideas').select('*').eq('id', ideaId).eq('user_id', user.id).single();
    if (loadErr || !idea) return NextResponse.json({ ok: false, error: 'Idea not found' }, { status: 404 });
    if (idea.status === 'sealed') return NextResponse.json({ ok: false, error: 'Already sealed' }, { status: 409 });

    const sealedAt = new Date().toISOString();
    const sealId = `GC-${randomUUID().split('-')[0].toUpperCase()}`;

    // 4. Optional: hash a pasted code snippet
    let codeHash: string | null = null;
    let codeSnippetTrimmed: string | null = null;
    if (codeSnippet && typeof codeSnippet === 'string' && codeSnippet.trim().length > 0) {
      codeSnippetTrimmed = codeSnippet.trim().slice(0, 50000); // 50 KB max
      codeHash = createHash('sha256').update(codeSnippetTrimmed, 'utf8').digest('hex');
    }

    // 5. Optional: fetch GitHub commit snapshot
    let githubSnapshot: {
      url: string; owner: string; repo: string; ref?: string;
      sha: string; tree_sha: string; message: string;
      author: string; committed_at: string; html_url: string;
    } | null = null;
    let githubError: string | null = null;

    if (githubUrl && typeof githubUrl === 'string' && githubUrl.trim()) {
      const parsed = parseGithubUrl(githubUrl.trim());
      if (!parsed) {
        githubError = 'Could not parse that GitHub URL.';
      } else {
        try {
          const commit = await fetchGithubCommit(parsed.owner, parsed.repo, parsed.ref);
          githubSnapshot = { url: githubUrl.trim(), ...parsed, ...commit };
        } catch (e: any) {
          githubError = e?.message || 'GitHub fetch failed.';
        }
      }
    }

    // 6. Build the canonical document — this is what gets hashed
    const lines: string[] = [
      'GRATIA CORE — IDEAS VAULT SEAL',
      `idea_id: ${idea.id}`,
      `user_id: ${user.id}`,
      `title: ${idea.title}`,
      `document:\n${idea.expanded_doc || idea.description || ''}`,
    ];
    if (codeHash) {
      lines.push(`code_sha256: ${codeHash}`);
      lines.push(`code_preview: ${codeSnippetTrimmed!.slice(0, 120)}…`);
    }
    if (githubSnapshot) {
      lines.push(`github_repo: ${githubSnapshot.owner}/${githubSnapshot.repo}`);
      lines.push(`github_commit_sha: ${githubSnapshot.sha}`);
      lines.push(`github_tree_sha: ${githubSnapshot.tree_sha}`);
      lines.push(`github_committed_at: ${githubSnapshot.committed_at}`);
    }
    lines.push(`sealed_at: ${sealedAt}`);
    const canonical = lines.join('\n');

    const sealHash = createHash('sha256').update(canonical, 'utf8').digest('hex');

    // 7. Watermark the expanded doc with the seal ID (canary mark)
    const rawDoc = idea.expanded_doc || idea.description || '';
    const watermarked = watermarkText(rawDoc, sealId);

    // 8. Build the strength object
    const strength = {
      hash: true,
      code_hash: !!codeHash,
      github: !!githubSnapshot,
      rfc: false,
      bitcoin: false,
    };

    // 9. Save everything
    const { data: sealed, error: updErr } = await admin
      .from('vault_ideas')
      .update({
        status: 'sealed',
        seal_hash: sealHash,
        seal_id: sealId,
        sealed_at: sealedAt,
        seal_level: 'basic',
        strength,
        expanded_doc: watermarked,
        // Store extras in a jsonb column — add this if not in your schema yet:
        seal_meta: {
          code_hash: codeHash,
          code_preview: codeSnippetTrimmed ? codeSnippetTrimmed.slice(0, 120) : null,
          github: githubSnapshot,
        },
      })
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .select()
      .single();
    if (updErr) throw updErr;

    return NextResponse.json({
      ok: true,
      idea: sealed,
      github_snapshot: githubSnapshot,
      github_error: githubError,
      code_hash: codeHash,
    });
  } catch (e: any) {
    console.error('vault/seal error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}