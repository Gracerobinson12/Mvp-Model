// GC Shield · Access Shield for GitHub (read-only).
// Needs GITHUB_TOKEN: a fine-grained token with READ-ONLY permissions
// (Administration, Webhooks, Metadata on repos; Git SSH keys on the account).
// The token stays on the server and is never sent to the browser.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Risk = "Low" | "Medium" | "High";

export type AccessItem = {
  id: string;
  direction: "Can reach you" | "You can reach";
  type: string;
  name: string;
  description: string;
  risk: Risk;
  evidence: "Verified";
  howToRemove: string;
  link: string;
};

type Repo = {
  full_name: string;
  html_url: string;
  private: boolean;
  owner: { login: string };
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean; pull?: boolean };
};
type Collaborator = {
  login: string;
  html_url: string;
  role_name?: string;
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean };
};
type DeployKey = { id: number; title: string; read_only: boolean; created_at: string; last_used?: string | null };
type Hook = { id: number; active: boolean; events: string[]; config: { url?: string } };
type SshKey = { id: number; title?: string; created_at?: string };
type Org = { login: string };

const API = "https://api.github.com";

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(API + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "unknown date");

function hostOf(url?: string) {
  if (!url) return "Unknown destination";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

async function pool<T>(list: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, list.length) }, async () => {
    while (i < list.length) {
      const x = list[i++];
      await fn(x);
    }
  });
  await Promise.all(workers);
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is missing. Add a read-only GitHub token to your environment variables and redeploy." },
      { status: 500 }
    );
  }

  try {
    const me = await gh<{ login: string }>("/user", token);
    const repos = await gh<Repo[]>("/user/repos?per_page=100&sort=pushed", token);
    const items: AccessItem[] = [];
    const notChecked = { collaborators: 0, deployKeys: 0, webhooks: 0, sshKeys: false };

    // Can reach you: people, servers and services with access to repos you administer.
    const adminRepos = repos.filter((r) => r.permissions?.admin).slice(0, 30);
    await pool(adminRepos, 4, async (r) => {
      const full = r.full_name;
      const [collabs, keys, hooks] = await Promise.allSettled([
        gh<Collaborator[]>(`/repos/${full}/collaborators?per_page=100&affiliation=direct`, token),
        gh<DeployKey[]>(`/repos/${full}/keys`, token),
        gh<Hook[]>(`/repos/${full}/hooks`, token),
      ]);

      if (collabs.status === "fulfilled") {
        for (const c of collabs.value) {
          if (c.login.toLowerCase() === me.login.toLowerCase()) continue;
          const role = c.role_name ?? (c.permissions?.admin ? "admin" : c.permissions?.push ? "write" : "read");
          const risk: Risk = role === "admin" ? "High" : role === "write" || role === "maintain" ? "Medium" : "Low";
          items.push({
            id: `collab:${full}:${c.login}`,
            direction: "Can reach you",
            type: "Person",
            name: c.login,
            description: `${role[0].toUpperCase() + role.slice(1)} access to ${full}`,
            risk,
            evidence: "Verified",
            howToRemove: `Open ${full} on GitHub, go to Settings, then Collaborators, and remove ${c.login}.`,
            link: `${r.html_url}/settings/access`,
          });
        }
      } else notChecked.collaborators++;

      if (keys.status === "fulfilled") {
        for (const k of keys.value) {
          items.push({
            id: `deploykey:${full}:${k.id}`,
            direction: "Can reach you",
            type: "Deploy key",
            name: k.title,
            description: `${k.read_only ? "Can read" : "Can push code to"} ${full} · added ${day(k.created_at)}${
              k.last_used ? ` · last used ${day(k.last_used)}` : ""
            }`,
            risk: k.read_only ? "Low" : "High",
            evidence: "Verified",
            howToRemove: `Open ${full} on GitHub, go to Settings, then Deploy keys, and delete "${k.title}".`,
            link: `${r.html_url}/settings/keys`,
          });
        }
      } else notChecked.deployKeys++;

      if (hooks.status === "fulfilled") {
        for (const h of hooks.value) {
          const events = h.events.includes("*") ? "every event" : h.events.join(", ");
          items.push({
            id: `webhook:${full}:${h.id}`,
            direction: "Can reach you",
            type: "Webhook",
            name: hostOf(h.config.url),
            description: `Receives ${events} from ${full}${h.active ? "" : " · turned off"}`,
            risk: h.events.includes("*") ? "High" : "Medium",
            evidence: "Verified",
            howToRemove: `Open ${full} on GitHub, go to Settings, then Webhooks, and delete the one sending to ${hostOf(h.config.url)}.`,
            link: `${r.html_url}/settings/hooks`,
          });
        }
      } else notChecked.webhooks++;
    });

    // Can reach you: computers that can push code as you.
    try {
      const ssh = await gh<SshKey[]>("/user/keys", token);
      for (const k of ssh) {
        items.push({
          id: `ssh:${k.id}`,
          direction: "Can reach you",
          type: "SSH key",
          name: k.title || `SSH key ${k.id}`,
          description: `A computer that can push code as you${k.created_at ? ` · added ${day(k.created_at)}` : ""}`,
          risk: "Medium",
          evidence: "Verified",
          howToRemove: "Open GitHub Settings, then SSH and GPG keys, and delete keys for computers you no longer use.",
          link: "https://github.com/settings/keys",
        });
      }
    } catch {
      notChecked.sshKeys = true;
    }

    // You can reach: other people's repos where you can change code.
    for (const r of repos) {
      if (r.owner.login.toLowerCase() === me.login.toLowerCase()) continue;
      if (!r.permissions?.push && !r.permissions?.admin) continue;
      items.push({
        id: `repo:${r.full_name}`,
        direction: "You can reach",
        type: "Repository",
        name: r.full_name,
        description: `${r.permissions?.admin ? "Admin" : "Write"} access · owned by ${r.owner.login}${r.private ? " · private" : ""}`,
        risk: r.permissions?.admin ? "High" : "Medium",
        evidence: "Verified",
        howToRemove: `If you no longer work on ${r.full_name}, ask ${r.owner.login} to remove you, or leave it from the repo page.`,
        link: r.html_url,
      });
    }

    // You can reach: organizations you belong to.
    try {
      const orgs = await gh<Org[]>("/user/orgs", token);
      for (const o of orgs) {
        items.push({
          id: `org:${o.login}`,
          direction: "You can reach",
          type: "Organization",
          name: o.login,
          description: "You're a member of this organization",
          risk: "Low",
          evidence: "Verified",
          howToRemove: `If you're done with ${o.login}, open GitHub Settings, then Organizations, and leave it.`,
          link: "https://github.com/settings/organizations",
        });
      }
    } catch {
      /* org list not available with this token */
    }

    return NextResponse.json({
      login: me.login,
      checkedAt: new Date().toISOString(),
      reposChecked: adminRepos.length,
      notChecked,
      items,
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "error";
    const message =
      code === "401"
        ? "GitHub rejected the token. Check that GITHUB_TOKEN is correct and hasn't expired."
        : code === "403"
        ? "GitHub refused the request. The token may be missing a permission, or the rate limit was hit."
        : "Couldn't reach GitHub. Try Check again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
