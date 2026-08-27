import { encodeUtf8ToBase64 } from "./util.ts";

export const REPO = Deno.env.get("GITHUB_REPO") ?? "grandzam1/scrape-kit";
export const BRANCH = Deno.env.get("GITHUB_BRANCH") ?? "main";

export function githubHeaders() {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "zamplandoc-deno-scrape",
  };
}

export function decodeGithubContent(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

export async function githubGetFile(path: string): Promise<string | null> {
  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(`${api}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: githubHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = await res.json();
  if (typeof body.content !== "string") return null;
  return decodeGithubContent(body.content);
}

export async function githubPutFile(path: string, content: string, message: string) {
  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = githubHeaders();

  let sha: string | undefined;
  const existing = await fetch(`${api}?ref=${encodeURIComponent(BRANCH)}`, { headers });
  if (existing.ok) {
    const body = await existing.json();
    sha = body.sha;
  }

  const put = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: encodeUtf8ToBase64(content),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  const result = await put.json();
  if (!put.ok) {
    throw new Error(`GitHub ${put.status}: ${JSON.stringify(result)}`);
  }
  return result;
}
