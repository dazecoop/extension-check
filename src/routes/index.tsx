import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { checkName, type CheckResult, type StoreResult } from "@/lib/check.functions";
import { suggestNames } from "@/lib/names";
import chromeIcon from "@/assets/chrome.svg";
import firefoxIcon from "@/assets/firefox.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Extension Name Checker — Chrome & Firefox" },
      { name: "description", content: "Check if a browser extension name is free on the Chrome Web Store and Firefox Add-ons." },
      { property: "og:title", content: "Extension Name Checker" },
      { property: "og:description", content: "Is your extension name taken on Chrome or Firefox? Find out, and get free alternatives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Index() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<CheckResult[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const run = useRef(0);

  async function submit(e?: React.FormEvent, value = q) {
    e?.preventDefault();
    if (!value.trim() || loading) return;
    const id = ++run.current;
    setLoading(true);
    setError("");
    setResult(null);
    setSuggestions([]);
    try {
      const r = await checkName({ data: { name: value } });
      if (id !== run.current) return;
      setResult(r);
      if (r.firefox.status === "taken" || r.chrome.status === "taken") {
        setSuggesting(true);
        // Sequential with a pause, to stay gentle on both stores.
        for (const s of suggestNames(value, 6)) {
          if (id !== run.current) return;
          await sleep(600);
          try {
            const sr = await checkName({ data: { name: s } });
            if (id !== run.current) return;
            setSuggestions((p) => [...p, sr]);
          } catch {
            /* skip */
          }
        }
      }
    } catch (err) {
      if (id === run.current) setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (id === run.current) {
        setLoading(false);
        setSuggesting(false);
      }
    }
  }

  const free = suggestions.filter((s) => s.firefox.status === "available" && s.chrome.status === "available");

  return (
    <main className="min-h-screen bg-background px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2">
          <img src={chromeIcon} alt="" className="h-8 w-8" />
          <img src={firefoxIcon} alt="" className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Is your extension name free?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Check a browser extension name on the Chrome Web Store and Firefox Add-ons in one go. If it's taken,
          you'll get similar names that are still free.
        </p>

        <form onSubmit={submit} className="mt-10 flex gap-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. tab-tidy"
            aria-label="Extension name"
            className="h-12 flex-1 rounded-xl border border-input bg-card px-4 text-base text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
          <button
            disabled={loading || !q.trim()}
            className="h-12 rounded-xl bg-primary px-5 font-medium text-primary-foreground transition active:scale-[0.97] disabled:opacity-40"
          >
            {loading && !result ? "Checking…" : "Check"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {result && (
          <section className="animate-in fade-in slide-in-from-bottom-1 mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm duration-300">
            <Row icon={chromeIcon} label="Chrome Web Store" hint="Best-effort name match" r={result.chrome} />
            <div className="h-px bg-border" />
            <Row icon={firefoxIcon} label="Firefox Add-ons" hint={`Exact slug: ${result.slug}`} r={result.firefox} />
          </section>
        )}

        {(suggesting || suggestions.length > 0) && (
          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Alternatives {suggesting && <span className="normal-case tracking-normal">· checking…</span>}
            </h2>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <button
                    onClick={() => {
                      setQ(s.slug);
                      submit(undefined, s.slug);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{s.slug}</span>
                    <span className="flex gap-3 text-xs text-muted-foreground">
                      <Pill icon={chromeIcon} label="Chrome" r={s.chrome} />
                      <Pill icon={firefoxIcon} label="Firefox" r={s.firefox} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!suggesting && free.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No fully free alternatives found. Try a different word.</p>
            )}
          </section>
        )}

        <section className="mt-20 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">What is this?</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Picking a name for a browser extension is harder than it looks. A name that's free on one store is often
            already used on the other. This tool checks both at once, so you can pick a name that works everywhere
            before you publish.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Info icon={chromeIcon} title="Chrome Web Store">
              We search the store and look for an extension with the same name. Chrome has no public lookup, so this is
              a best guess.
            </Info>
            <Info icon={firefoxIcon} title="Firefox Add-ons">
              We check the exact web address name (like <span className="font-mono text-foreground">tab-tidy</span>).
              Each Firefox add-on has a unique one, so this answer is reliable.
            </Info>
          </div>
          <h3 className="mt-10 font-semibold text-foreground">Good to know</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Similar names are made from simple variations like "-pro" or "get-". No AI involved.</li>
            <li>Results are remembered for 15 minutes, and names are checked one at a time to go easy on both stores.</li>
            <li>"Available" means we found no match. It doesn't reserve the name for you.</li>
          </ul>
        </section>

        <footer className="mt-16 text-xs text-muted-foreground">
          Free and open source. Not affiliated with Google or Mozilla.
        </footer>
      </div>
    </main>
  );
}

function Info({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <img src={icon} alt="" className="h-6 w-6" />
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Row({ icon, label, hint, r }: { icon: string; label: string; hint: string; r: StoreResult }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <img src={icon} alt="" className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">{label}</div>
        <div className="truncate text-sm text-muted-foreground">
          {r.status === "taken" && r.url ? (
            <a href={r.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              {r.matchName ?? "View listing"} ↗
            </a>
          ) : (
            hint
          )}
        </div>
      </div>
      <Status r={r} />
    </div>
  );
}

const tone = {
  available: "bg-success/15 text-success",
  taken: "bg-destructive/10 text-destructive",
  error: "bg-muted text-muted-foreground",
};
const text = { available: "Available", taken: "Taken", error: "Couldn't check" };

function Status({ r }: { r: StoreResult }) {
  return <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${tone[r.status]}`}>{text[r.status]}</span>;
}

function Pill({ icon, label, r }: { icon: string; label: string; r: StoreResult }) {
  const dot = r.status === "available" ? "bg-success" : r.status === "taken" ? "bg-destructive" : "bg-muted-foreground";
  return (
    <span className="flex items-center gap-1.5">
      <img src={icon} alt={label} className="h-4 w-4" />
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </span>
  );
}
