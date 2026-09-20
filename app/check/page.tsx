"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Check, Clipboard, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { FrontDoor, GeneratedFile } from "@/utils/front-door";
import type { Finding } from "@/utils/verify-readme";

interface Result {
    owner: string;
    repo: string;
    frontDoor: FrontDoor;
    files: GeneratedFile[];
    decisions: string[];
    findings: Finding[];
}

const LABELS: Record<string, string> = {
    readme: "README",
    contributing: "Contributing guide",
    code_of_conduct: "Code of conduct",
    license: "License",
    issue_template: "Issue templates",
    pull_request_template: "Pull request template",
};

const FINDING_LABELS: Record<Finding["kind"], string> = {
    "dead-link": "Dead link",
    "dead-image": "Dead image",
    "stale-stars": "Stale star count",
    "orphan-workflow-badge": "Badge without a workflow",
};

const scoreColor = (score: number) =>
    score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";

function FileCard({ file }: { file: GeneratedFile }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(file.content);
        setCopied(true);
        toast.success(`${file.path} copied`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border rounded-xl border-white/10 bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="font-mono text-[13px] text-white hover:text-emerald-300"
                >
                    {open ? "▾" : "▸"} {file.path}
                </button>
                <p className="flex-1 min-w-[200px] text-xs text-white/40">{file.reason}</p>
                <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/25"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            {open && (
                <pre className="px-4 py-3 overflow-x-auto font-mono text-[12px] leading-relaxed border-t whitespace-pre-wrap border-white/10 text-white/70">
                    {file.content}
                </pre>
            )}
        </div>
    );
}

export default function CheckPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState("");

    const run = async (repo: string) => {
        if (!repo.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch(`/api/front-door?repo=${encodeURIComponent(repo)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not read that repository");
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const present = result
        ? Object.keys(LABELS).filter((key) => !result.frontDoor.missing.includes(key))
        : [];

    return (
        <div className="min-h-screen bg-[#0b0b0d]">
            <Navbar />

            <main className="max-w-4xl px-6 py-16 mx-auto">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                    Is your repo ready for visitors?
                </h1>
                <p className="mt-3 text-white/50">
                    GitHub scores every repository&apos;s community profile, and most fail it.
                    Paste any repository — yours or not — to see what is missing and what its
                    README still claims.
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        run(input);
                    }}
                    className="flex flex-col gap-3 mt-8 sm:flex-row"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Open-Dev-Society/opencosmos"
                        className="flex-1 px-4 py-3 font-mono text-sm text-white border rounded-xl border-white/10 bg-white/[0.03] placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-black transition rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        {loading ? "Checking" : "Check"}
                    </button>
                </form>

                <div className="flex flex-wrap gap-2 mt-3 text-xs text-white/30">
                    Try:
                    {["Open-Dev-Society/opencosmos", "Open-Dev-Society/OpenStock", "facebook/react"].map(
                        (example) => (
                            <button
                                key={example}
                                onClick={() => {
                                    setInput(example);
                                    run(example);
                                }}
                                className="font-mono underline hover:text-white/60 underline-offset-2"
                            >
                                {example}
                            </button>
                        )
                    )}
                </div>

                {error && (
                    <p className="px-4 py-3 mt-8 text-sm border rounded-xl border-red-500/30 bg-red-500/10 text-red-300">
                        {error}
                    </p>
                )}

                {result && (
                    <div className="mt-12 space-y-10">
                        <section className="flex flex-wrap items-center gap-6">
                            <div
                                className="flex items-center justify-center w-24 h-24 text-3xl font-semibold border rounded-2xl"
                                style={{
                                    color: scoreColor(result.frontDoor.healthPercentage),
                                    borderColor: `${scoreColor(result.frontDoor.healthPercentage)}40`,
                                }}
                            >
                                {result.frontDoor.healthPercentage}%
                            </div>
                            <div>
                                <p className="font-mono text-sm text-white">
                                    {result.owner}/{result.repo}
                                </p>
                                <p className="mt-1 text-sm text-white/50">
                                    GitHub community profile score
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {present.map((key) => (
                                        <span
                                            key={key}
                                            className="px-2.5 py-1 text-[11px] rounded-full border border-emerald-400/25 text-emerald-300/80"
                                        >
                                            ✓ {LABELS[key]}
                                        </span>
                                    ))}
                                    {result.frontDoor.missing.map((key) => (
                                        <span
                                            key={key}
                                            className="px-2.5 py-1 text-[11px] rounded-full border border-white/10 text-white/35"
                                        >
                                            ✕ {LABELS[key] ?? key}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {result.decisions.length > 0 && (
                            <section>
                                <h2 className="text-sm font-medium tracking-wide text-white uppercase">
                                    Your call, not ours
                                </h2>
                                <div className="mt-3 space-y-2">
                                    {result.decisions.map((note) => (
                                        <p
                                            key={note}
                                            className="px-4 py-3 text-sm border rounded-xl border-amber-400/25 bg-amber-400/5 text-amber-100/80"
                                            dangerouslySetInnerHTML={{
                                                __html: note.replace(
                                                    /\*\*(.+?)\*\*/g,
                                                    "<strong class='text-amber-200'>$1</strong>"
                                                ),
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {result.files.length > 0 && (
                            <section>
                                <h2 className="text-sm font-medium tracking-wide text-white uppercase">
                                    Written from this repository
                                </h2>
                                <p className="mt-1 mb-4 text-sm text-white/40">
                                    Real scripts, real language, real contact — not a template with
                                    blanks to fill in.
                                </p>
                                <div className="space-y-3">
                                    {result.files.map((file) => (
                                        <FileCard key={file.path} file={file} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="text-sm font-medium tracking-wide text-white uppercase">
                                What the README still claims
                            </h2>
                            {result.findings.length === 0 ? (
                                <p className="mt-3 text-sm text-white/40">
                                    Every link, badge and star count checked out. Nothing to fix.
                                </p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {result.findings.map((finding, index) => (
                                        <div
                                            key={`${finding.line}-${index}`}
                                            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 border rounded-xl border-white/10 bg-white/[0.02]"
                                        >
                                            <span className="font-mono text-xs text-white/30">
                                                L{finding.line}
                                            </span>
                                            <span className="text-[11px] uppercase tracking-wide text-red-300/70">
                                                {FINDING_LABELS[finding.kind]}
                                            </span>
                                            <span className="font-mono text-[13px] text-white/80 break-all">
                                                {finding.claim}
                                            </span>
                                            <span className="text-sm text-white/40">
                                                → {finding.reality}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
