import { createServerFn } from "@tanstack/react-start";
import { findChromeMatch, slugify } from "./names";

export type StoreResult = {
  status: "available" | "taken" | "error";
  url?: string;
  matchName?: string;
};
export type CheckResult = { name: string; slug: string; firefox: StoreResult; chrome: StoreResult };

// Simple in-memory cache per worker instance, to avoid repeat hits on the stores.
const cache = new Map<string, { at: number; value: CheckResult }>();
const TTL = 15 * 60 * 1000;
const UA = "Mozilla/5.0 (extension-name-checker; open source)";

async function checkFirefox(slug: string): Promise<StoreResult> {
  try {
    const r = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(slug)}/`, {
      headers: { "user-agent": UA, accept: "application/json" },
    });
    if (r.status === 404 || r.status === 401) return { status: "available" };
    if (r.ok) {
      const j = (await r.json()) as { name?: Record<string, string> | string };
      const name = typeof j.name === "string" ? j.name : j.name ? Object.values(j.name)[0] : undefined;
      return { status: "taken", matchName: name, url: `https://addons.mozilla.org/en-GB/firefox/addon/${slug}/` };
    }
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

async function checkChrome(name: string): Promise<StoreResult> {
  try {
    const r = await fetch(`https://chromewebstore.google.com/search/${encodeURIComponent(name)}`, {
      headers: { "user-agent": UA, "accept-language": "en" },
    });
    if (!r.ok) return { status: "error" };
    const m = findChromeMatch(await r.text(), name);
    return m
      ? { status: "taken", matchName: m.name, url: `https://chromewebstore.google.com/detail/${m.slug}/${m.id}` }
      : { status: "available" };
  } catch {
    return { status: "error" };
  }
}

export const checkName = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => {
    const name = String(d?.name ?? "").trim().slice(0, 60);
    if (!slugify(name)) throw new Error("Enter a name");
    return { name };
  })
  .handler(async ({ data }): Promise<CheckResult> => {
    const slug = slugify(data.name);
    const key = slug;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.value;
    const chromeQuery = data.name.includes("-") && !data.name.includes(" ") ? slug.replace(/-/g, " ") : data.name;
    const [firefox, chrome] = await Promise.all([checkFirefox(slug), checkChrome(chromeQuery)]);
    const value = { name: data.name, slug, firefox, chrome };
    if (firefox.status !== "error" && chrome.status !== "error") cache.set(key, { at: Date.now(), value });
    return value;
  });
